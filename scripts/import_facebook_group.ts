import { createHash, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { createClient } from "@supabase/supabase-js";
import { chromium, type BrowserContext, type Page } from "playwright";

import {
  buildExternalExampleParserOutput,
  parseExternalExampleCaption,
} from "../src/lib/external-example-intakes";
import type { Glaze } from "../src/lib/types";

type VisiblePostImage = {
  src: string;
  width: number | null;
  height: number | null;
};

type VisiblePost = {
  captureId: string;
  permalink: string;
  authorName: string | null;
  visibleTimestamp: string | null;
  caption: string;
  summary: string;
  groupLabel: string;
  images: VisiblePostImage[];
};

type PreparedAsset = {
  buffer: Buffer;
  sha256: string;
  sourceImageUrl: string | null;
  captureMethod: "download" | "screenshot";
  width: number | null;
  height: number | null;
  extension: string;
  contentType: string;
};

type SupabaseEnv = {
  url: string;
  serviceRoleKey: string;
};

const PROJECT_ROOT = path.resolve(__dirname, "..");
const USER_DATA_DIR = path.join(PROJECT_ROOT, "data", "facebook-import-browser-profile");
const DEFAULT_GROUP_URL = process.argv[2] ?? process.env.FACEBOOK_GROUP_URL ?? null;

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();

    if (!key || key in process.env) {
      continue;
    }

    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function ensureEnv() {
  loadEnvFile(path.join(PROJECT_ROOT, ".env.local"));
  loadEnvFile(path.join(PROJECT_ROOT, ".env"));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the local environment.");
  }

  return { url, serviceRoleKey } satisfies SupabaseEnv;
}

function canonicalizeFacebookPostUrl(value: string) {
  try {
    const parsed = new URL(value);
    parsed.hash = "";
    parsed.search = "";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return value.trim();
  }
}

function sha256(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function extensionFromContentType(contentType: string) {
  if (contentType.includes("png")) {
    return ".png";
  }

  if (contentType.includes("webp")) {
    return ".webp";
  }

  return ".jpg";
}

async function promptForGroupUrl(rl: readline.Interface) {
  if (DEFAULT_GROUP_URL) {
    return DEFAULT_GROUP_URL;
  }

  const answer = (await rl.question("Facebook group URL: ")).trim();

  if (!answer) {
    throw new Error("A Facebook group URL is required.");
  }

  return answer;
}

async function launchBrowser(groupUrl: string) {
  mkdirSync(USER_DATA_DIR, { recursive: true });
  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: false,
    viewport: { width: 1440, height: 1080 },
  });
  const page = context.pages()[0] ?? (await context.newPage());
  await page.goto(groupUrl, { waitUntil: "domcontentloaded" });
  return { context, page };
}

async function collectVisiblePosts(page: Page) {
  return page.evaluate(() => {
    const isVisible = (element: Element | null) => {
      if (!(element instanceof HTMLElement)) {
        return false;
      }

      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);

      return (
        rect.width > 0 &&
        rect.height > 0 &&
        rect.bottom > 0 &&
        rect.top < window.innerHeight &&
        style.visibility !== "hidden" &&
        style.display !== "none"
      );
    };

    const normalize = (value: string) => value.replace(/\s+/g, " ").trim();
    const summarize = (value: string) => {
      const summary = normalize(value);
      return summary.length > 110 ? `${summary.slice(0, 107)}...` : summary;
    };

    const postLinks = Array.from(
      document.querySelectorAll<HTMLAnchorElement>(
        'a[href*="/groups/"][href*="/posts/"], a[href*="/groups/"][href*="/permalink/"]',
      ),
    )
      .filter((anchor) => anchor.href && isVisible(anchor))
      .slice(0, 40);

    const posts: VisiblePost[] = [];
    const seen = new Set<string>();

    for (const anchor of postLinks) {
      const permalink = anchor.href.replace(/\?.*$/, "");

      if (seen.has(permalink)) {
        continue;
      }

      const root =
        anchor.closest('[role="article"]') ??
        anchor.closest('div[data-pagelet]') ??
        anchor.parentElement;

      if (!root || !isVisible(root)) {
        continue;
      }

      const captureId = `codex-post-${Math.random().toString(36).slice(2, 10)}`;
      (root as HTMLElement).dataset.codexPostCaptureId = captureId;

      const imageNodes = Array.from(root.querySelectorAll("img"))
        .filter((img) => isVisible(img))
        .map((img) => ({
          src: img.currentSrc || img.getAttribute("src") || "",
          width: img.naturalWidth || img.clientWidth || null,
          height: img.naturalHeight || img.clientHeight || null,
        }))
        .filter((image) => image.src && !image.src.startsWith("data:"));

      const textNodes = Array.from(
        root.querySelectorAll('div[dir="auto"], span[dir="auto"], h2, h3, strong'),
      )
        .filter((node) => isVisible(node))
        .map((node) => normalize(node.textContent || ""))
        .filter(Boolean);

      const dedupedText = Array.from(new Set(textNodes));
      const authorName = dedupedText[0] ?? null;
      const visibleTimestamp =
        dedupedText.find((text) => /\b(?:\d+[hm]|yesterday|hrs?|mins?|minutes?|hours?)\b/i.test(text)) ??
        (normalize(anchor.textContent || "") || null);
      const caption = dedupedText.slice(1).join("\n").trim();
      const summary = caption ? summarize(caption) : "No caption captured";
      const groupLabel = normalize(document.title.split("|")[0] || "Facebook group");

      posts.push({
        captureId,
        permalink,
        authorName,
        visibleTimestamp,
        caption,
        summary,
        groupLabel,
        images: imageNodes,
      });
      seen.add(permalink);
    }

    return posts;
  });
}

async function captureFallbackScreenshot(page: Page, captureId: string) {
  const locator = page.locator(`[data-codex-post-capture-id="${captureId}"]`).first();
  const count = await locator.count();

  if (!count) {
    throw new Error("Could not find the visible post container for screenshot fallback.");
  }

  const box = await locator.boundingBox();
  const buffer = Buffer.from(await locator.screenshot({ type: "png" }));

  return {
    buffer,
    sha256: sha256(buffer),
    sourceImageUrl: null,
    captureMethod: "screenshot" as const,
    width: box ? Math.round(box.width) : null,
    height: box ? Math.round(box.height) : null,
    extension: ".png",
    contentType: "image/png",
  };
}

async function downloadImageAsset(context: BrowserContext, image: VisiblePostImage) {
  const response = await context.request.get(image.src, { timeout: 30_000 });

  if (!response.ok()) {
    throw new Error(`Image request failed with ${response.status()}`);
  }

  const contentType = response.headers()["content-type"] || "image/jpeg";
  const buffer = Buffer.from(await response.body());

  return {
    buffer,
    sha256: sha256(buffer),
    sourceImageUrl: image.src,
    captureMethod: "download" as const,
    width: image.width,
    height: image.height,
    extension: extensionFromContentType(contentType),
    contentType,
  };
}

async function prepareAssetsForPost(context: BrowserContext, page: Page, post: VisiblePost) {
  const preparedAssets: PreparedAsset[] = [];
  const seenHashes = new Set<string>();

  for (const image of post.images) {
    try {
      const asset = await downloadImageAsset(context, image);

      if (seenHashes.has(asset.sha256)) {
        continue;
      }

      preparedAssets.push(asset);
      seenHashes.add(asset.sha256);
    } catch {
      // Ignore direct-download failures and fall through to screenshot fallback below.
    }
  }

  if (!preparedAssets.length) {
    const screenshotAsset = await captureFallbackScreenshot(page, post.captureId);
    preparedAssets.push(screenshotAsset);
  }

  return preparedAssets;
}

function printVisiblePosts(posts: VisiblePost[]) {
  if (!posts.length) {
    console.log("\nNo visible posts were detected yet. Scroll the page, wait for posts to load, and try again.\n");
    return;
  }

  console.log("");
  posts.forEach((post, index) => {
    console.log(
      `[${index + 1}] ${post.authorName ?? "Unknown author"} | ${post.visibleTimestamp ?? "No timestamp"} | ${post.summary}`,
    );
  });
  console.log("");
}

async function choosePostsToCapture(rl: readline.Interface, posts: VisiblePost[]) {
  const answer = (await rl.question("Choose visible post numbers to capture (comma-separated, or blank to refresh, q to quit): ")).trim();

  if (!answer) {
    return { quit: false, selectedPosts: [] as VisiblePost[] };
  }

  if (answer.toLowerCase() === "q") {
    return { quit: true, selectedPosts: [] as VisiblePost[] };
  }

  const selectedIndexes = Array.from(
    new Set(
      answer
        .split(",")
        .map((value) => Number.parseInt(value.trim(), 10) - 1)
        .filter((index) => Number.isInteger(index) && index >= 0 && index < posts.length),
    ),
  );

  return {
    quit: false,
    selectedPosts: selectedIndexes.map((index) => posts[index]!).filter(Boolean),
  };
}

async function fetchCatalogGlazes(supabaseEnv: SupabaseEnv) {
  const supabase = createClient(supabaseEnv.url, supabaseEnv.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.from("glazes").select("*").is("created_by_user_id", null);

  if (error) {
    throw new Error(`Could not load glazes: ${error.message}`);
  }

  return (data ?? []) as Glaze[];
}

async function findCapturedByUserId(supabaseEnv: SupabaseEnv, emailHint: string | null) {
  const supabase = createClient(supabaseEnv.url, supabaseEnv.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (emailHint) {
    const { data } = await supabase.from("profiles").select("id,email").ilike("email", emailHint).limit(1);

    if (data?.[0]?.id) {
      return String(data[0].id);
    }
  }

  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("is_admin", true)
    .order("created_at", { ascending: true })
    .limit(1);

  if (!data?.[0]?.id) {
    throw new Error("Could not find an admin profile to attribute imported intakes to.");
  }

  return String(data[0].id);
}

async function capturePostIntoSupabase(
  supabaseEnv: SupabaseEnv,
  context: BrowserContext,
  page: Page,
  post: VisiblePost,
  glazes: Glaze[],
  capturedByUserId: string,
) {
  const supabase = createClient(supabaseEnv.url, supabaseEnv.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const sourceUrl = canonicalizeFacebookPostUrl(post.permalink);

  const { data: existingSource } = await supabase
    .from("external_example_intakes")
    .select("id")
    .eq("source_platform", "facebook")
    .eq("source_url", sourceUrl)
    .maybeSingle();

  if (existingSource?.id) {
    console.log(`Skipping ${sourceUrl} because it already exists as intake ${existingSource.id}.`);
    return;
  }

  const preparedAssets = await prepareAssetsForPost(context, page, post);
  const duplicateHashes = preparedAssets.map((asset) => asset.sha256);
  const { data: hashDuplicates } = await supabase
    .from("external_example_assets")
    .select("intake_id,sha256")
    .in("sha256", duplicateHashes);

  const duplicateOfIntakeId = hashDuplicates?.[0]?.intake_id ? String(hashDuplicates[0].intake_id) : null;
  const parsedCaption = parseExternalExampleCaption(post.caption, glazes);
  const parserOutput = buildExternalExampleParserOutput(post.caption, parsedCaption.mentions, {
    duplicateSourceUrl: false,
    duplicateSha256s: (hashDuplicates ?? []).map((entry) => String(entry.sha256)),
  });

  const reviewStatus = duplicateOfIntakeId ? "duplicate" : "queued";
  const { data: intake, error: intakeError } = await supabase
    .from("external_example_intakes")
    .insert({
      source_platform: "facebook",
      group_label: post.groupLabel || "Facebook group",
      source_url: sourceUrl,
      raw_caption: post.caption || null,
      raw_author_display_name: post.authorName,
      raw_source_timestamp: post.visibleTimestamp,
      captured_by_user_id: capturedByUserId,
      privacy_mode: "anonymous",
      review_status: reviewStatus,
      parser_output: parserOutput,
      duplicate_of_intake_id: duplicateOfIntakeId,
    })
    .select("id")
    .single();

  if (intakeError || !intake) {
    throw new Error(intakeError?.message ?? "Could not insert intake.");
  }

  const assetRows: Array<Record<string, unknown>> = [];

  for (const [index, asset] of preparedAssets.entries()) {
    const storagePath = `${intake.id}/${index + 1}-${randomUUID()}${asset.extension}`;
    const { error: uploadError } = await supabase.storage
      .from("external-example-imports")
      .upload(storagePath, asset.buffer, {
        contentType: asset.contentType,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Could not upload archived asset: ${uploadError.message}`);
    }

    assetRows.push({
      intake_id: intake.id,
      storage_path: storagePath,
      source_image_url: asset.sourceImageUrl,
      capture_method: asset.captureMethod,
      width: asset.width,
      height: asset.height,
      sha256: asset.sha256,
      sort_order: index,
    });
  }

  if (assetRows.length) {
    const { error: assetInsertError } = await supabase.from("external_example_assets").insert(assetRows);

    if (assetInsertError) {
      throw new Error(`Could not insert archived asset metadata: ${assetInsertError.message}`);
    }
  }

  if (parsedCaption.mentions.length) {
    const mentionRows = parsedCaption.mentions.map((mention) => ({
      intake_id: intake.id,
      freeform_text: mention.freeformText,
      matched_glaze_id: mention.matchedGlazeId ?? null,
      confidence: mention.confidence,
      mention_order: mention.mentionOrder,
      is_approved: false,
    }));
    const { error: mentionInsertError } = await supabase
      .from("external_example_glaze_mentions")
      .insert(mentionRows);

    if (mentionInsertError) {
      throw new Error(`Could not insert glaze mention suggestions: ${mentionInsertError.message}`);
    }
  }

  console.log(
    `Captured intake ${intake.id} | ${post.summary} | ${parsedCaption.mentions.length} mention(s) | ${preparedAssets.length} asset(s)`,
  );
}

async function main() {
  const rl = readline.createInterface({ input, output });

  try {
    const supabaseEnv = ensureEnv();
    const groupUrl = await promptForGroupUrl(rl);
    const { context, page } = await launchBrowser(groupUrl);
    const glazes = await fetchCatalogGlazes(supabaseEnv);
    const capturedByUserId = await findCapturedByUserId(
      supabaseEnv,
      process.env.FACEBOOK_IMPORT_PROFILE_EMAIL ?? null,
    );

    console.log("\nThe browser is open with a persistent profile.");
    console.log("Log into Facebook if needed, open the target group, and scroll until the posts you want are visible.\n");

    while (true) {
      const readyAnswer = (await rl.question("Press Enter after the group page is ready (or type q to quit): ")).trim().toLowerCase();

      if (readyAnswer === "q") {
        break;
      }

      const posts = await collectVisiblePosts(page);
      printVisiblePosts(posts);
      const selection = await choosePostsToCapture(rl, posts);

      if (selection.quit) {
        break;
      }

      if (!selection.selectedPosts.length) {
        continue;
      }

      for (const post of selection.selectedPosts) {
        try {
          await capturePostIntoSupabase(
            supabaseEnv,
            context,
            page,
            post,
            glazes,
            capturedByUserId,
          );
        } catch (error) {
          console.error(`Failed to capture ${post.permalink}:`, error);
        }
      }

      console.log("");
    }

    await context.close();
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
