import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { chromium } from "playwright";

const ROOT = process.cwd();
const OUTPUT_DIR = resolve(ROOT, "data", "vendors");
const GLAZES_PATH = resolve(OUTPUT_DIR, "clay-art-center-glazes.json");
const FIRING_IMAGES_PATH = resolve(OUTPUT_DIR, "clay-art-center-firing-images.json");
const CATALOG_SQL_PATH = resolve(ROOT, "supabase", "migrations", "20260410100000_import_clay_art_center_catalog.sql");
const FIRING_SQL_PATH = resolve(ROOT, "supabase", "migrations", "20260410101000_import_clay_art_center_firing_images.sql");
const CAC_CATEGORY_URL = "https://clayartcenter.net/product-category/ceramic-glazes/clay-art-center-glazes/";
const CAC_CATALOG_TEXT_PATH = resolve(ROOT, "output", "cac-mini-catalog.txt");
const BRAND = "Clay Art Center";

const LEAF_CATEGORY_TO_LINE = {
  "CAC Base Glazes": "Base Glazes",
  "CAC Craftsman Glazes": "Craftsman Glazes",
  "CAC Frost Glazes": "Frost Series Glazes",
  "CAC Glossy Glazes": "Glossy Series Glazes",
  "CAC High Fire Glazes": "High Fire Glazes",
  "CAC Low Fire Glossy Glazes": "Lead-Free Low Fire Glossy Glazes",
  "CAC P Series Glazes": "P Series Glazes",
  "CAC Rainbow Glazes": "Rainbow Glazes",
  "CAC Raku Glazes": "Raku Glazes",
  "CAC Satin Matte Glazes": "Satin Matte Glazes",
  "CAC Strontium Matte Glazes": "Strontium Matte Glazes",
  "CAC Terra Sigillata": "Terra Sigillata",
  "Classic Terra Sigillatas": "Terra Sigillata",
  "Colored Terra Sigillatas": "Terra Sigillata",
  "Mica Infused Terra Sigillatas": "Mica Terra Sigillata",
};

const LINE_TO_CONE = {
  "Base Glazes": "Cone 4 / Cone 6",
  "Craftsman Glazes": "Cone 4 / Cone 6",
  "Frost Series Glazes": "Cone 4 / Cone 6",
  "Glossy Series Glazes": "Cone 06 / Cone 6",
  "High Fire Glazes": "Cone 10",
  "Lead-Free Low Fire Glossy Glazes": "Cone 04 / Cone 06",
  "Mica Terra Sigillata": null,
  "P Series Glazes": "Cone 4 / Cone 6",
  "Rainbow Glazes": "Cone 4 / Cone 6",
  "Raku Glazes": "Cone 04 / Cone 06",
  "Satin Matte Glazes": "Cone 4 / Cone 6",
  "Strontium Matte Glazes": "Cone 4 / Cone 6",
  "Terra Sigillata": null,
};

const LINE_TO_DESCRIPTION = {
  "Base Glazes": "Cone 4-6 base glazes from clear to matte for dependable functional surfaces and liner applications.",
  "Craftsman Glazes": "Cone 4-6 craftsman glazes designed for more varied, expressive surfaces and layered effects.",
  "Frost Series Glazes": "Cone 4-6 frost glazes with soft satin surfaces. Frost Satin Clear also works well over underglaze decoration.",
  "Glossy Series Glazes": "Lead-free glossy glazes formulated to fire from cone 06 to cone 6.",
  "High Fire Glazes": "Cone 10 high-fire glazes from reliable clears and copper reds to mattes and ash surfaces.",
  "Lead-Free Low Fire Glossy Glazes": "A basic group of glossy low-fire glazes for both students and studio use, designed for cone 04-06 firings.",
  "Mica Terra Sigillata": "Mica-infused terra sigillata for decorative polished surfaces and atmospheric firing work.",
  "P Series Glazes": "Professional cone 6 gloss glazes designed to yield consistent and reliable results for both the studio and classroom.",
  "Rainbow Glazes": "Mid-range rainbow glazes for bright, expressive cone 4-6 surfaces.",
  "Raku Glazes": "Specialty raku glazes and companion products for cone 04-06 raku firing.",
  "Satin Matte Glazes": "Warm cone 5 satin-matte glazes suitable for artware and decorative work.",
  "Strontium Matte Glazes": "Reactive cone 4-6 art glazes with dynamic breaking and varied sculptural surfaces; not intended for food-contact surfaces.",
  "Terra Sigillata": "Terra sigillata for polished low-fire and atmospheric surfaces, usable as a slip or engobe at higher temperatures.",
};

const TITLE_LINE_PATTERNS = [
  { regex: /^(?:CAC\s+)?P SERIES\s+[–-]\s+P(\d{2})\s+[–-]\s+(.+)$/i, line: "P Series Glazes", code: (match) => `GLP${match[1]}`, name: (match) => match[2] },
  { regex: /^(?:CAC\s+)?BASE\s+[–-]\s+(.+)$/i, line: "Base Glazes", name: (match) => match[1] },
  { regex: /^(?:CAC\s+)?CRAFTSMAN\s+[–-]\s+(.+)$/i, line: "Craftsman Glazes", name: (match) => match[1] },
  { regex: /^(?:CAC\s+)?FROST\s+[–-]\s+(.+)$/i, line: "Frost Series Glazes", name: (match) => match[1] },
  { regex: /^(?:CAC\s+)?GLOSSY\s+[–-]\s+(.+)$/i, line: "Glossy Series Glazes", name: (match) => match[1] },
  { regex: /^(?:CAC\s+)?HIGH FIRE\s+[–-]\s+(.+)$/i, line: "High Fire Glazes", name: (match) => match[1] },
  { regex: /^(?:CAC\s+)?RAINBOW\s+[–-]\s+(.+)$/i, line: "Rainbow Glazes", name: (match) => match[1] },
  { regex: /^(?:CAC\s+)?RAKU\s+[–-]\s+(.+)$/i, line: "Raku Glazes", name: (match) => match[1] },
  { regex: /^(?:CAC\s+)?SATIN MATTE\s+[–-]\s+(.+)$/i, line: "Satin Matte Glazes", name: (match) => match[1] },
  { regex: /^(?:CAC\s+)?STRONTIUM MATTE\s+[–-]\s+(.+)$/i, line: "Strontium Matte Glazes", name: (match) => match[1] },
  { regex: /^(?:CAC\s+)?CLASSIC TERRA SIGILLATA\s+[–-]\s+(.+)$/i, line: "Terra Sigillata", name: (match) => match[1] },
  { regex: /^(?:CAC\s+)?COLORED TERRA SIGILLATA\s+[–-]\s+(.+)$/i, line: "Terra Sigillata", name: (match) => match[1] },
  { regex: /^(?:CAC\s+)?MICA TERRA SIGILLATA\s+[–-]\s+(.+)$/i, line: "Mica Terra Sigillata", name: (match) => match[1] },
  { regex: /^RAKU SEALER$/i, line: "Raku Glazes", name: () => "Raku Sealer" },
];

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeName(value) {
  return normalizeWhitespace(value)
    .replace(/’/g, "'")
    .replace(/–/g, "-")
    .replace(/\bCAC\b/gi, "")
    .replace(/\bClay Art Center\b/gi, "")
    .replace(/\bSeries\b/gi, "")
    .replace(/\bGlazes?\b/gi, "")
    .replace(/\bTerra Sigillata\b/gi, "Terra Sigillata")
    .replace(/\bMica\b/gi, "Mica")
    .replace(/\bInfused\b/gi, "Infused")
    .replace(/\s+-\s+/g, " ")
    .replace(/[^\w\s'/-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function titleCase(value) {
  return normalizeWhitespace(value)
    .split(" ")
    .map((segment) => {
      if (/^[A-Z0-9]{2,}$/.test(segment)) return segment;
      return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase();
    })
    .join(" ")
    .replace(/\bOm4\b/g, "OM4")
    .replace(/\bEpk\b/g, "EPK")
    .replace(/\bLa\b/g, "LA")
    .replace(/\bGn\b/g, "GN")
    .replace(/\bPzn\b/g, "PZN");
}

function escapeSql(value) {
  return value.replaceAll("'", "''");
}

function canonicalizeImageUrl(url) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    if (parsed.hostname === "s.w.org") return null;

    if (parsed.hostname.endsWith("wp.com")) {
      const embedded = parsed.pathname.match(/^\/(?:imgpress\?url=)?([^?]+)$/);
      const directPath = embedded?.[1];

      if (directPath?.startsWith("http")) {
        return directPath;
      }

      if (parsed.pathname.startsWith("/clayartcenter.net/")) {
        return `https://${parsed.pathname.slice(1)}`;
      }
    }

    parsed.search = "";
    return parsed.toString();
  } catch {
    return url;
  }
}

function slugToName(slug) {
  return slug
    .replace(/^cac-/, "")
    .replace(/^clay-art-center-/, "")
    .replace(/-/g, " ")
    .replace(/\bglazes?\b/gi, "")
    .replace(/\bseries\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function titleToFallbackName(title) {
  return normalizeWhitespace(
    title
      .replace(/^CAC\s+/i, "")
      .replace(/^CLAY ART CENTER\s+/i, "")
      .replace(/\bGLAZES?\b/gi, "")
      .replace(/\bSERIES\b/gi, "")
      .replace(/\s+-\s+/g, " ")
      .replace(/\s+/g, " ")
  );
}

function parseCatalogText() {
  const namesByCode = new Map();
  const codeByName = new Map();

  let text = "";
  try {
    text = readFileSync(CAC_CATALOG_TEXT_PATH, "utf8");
  } catch {
    return { namesByCode, codeByName };
  }

  const addEntry = (code, rawName) => {
    const cleanCode = normalizeWhitespace(code).toUpperCase();
    const cleanName = normalizeWhitespace(
      rawName
        .replace(/\$.*$/, "")
        .replace(/\d+\.\d+.*$/, "")
        .replace(/\*+/g, "")
    );

    if (!cleanCode || !cleanName) return;
    namesByCode.set(cleanCode, cleanName);

    const normalized = normalizeName(cleanName);
    if (!codeByName.has(normalized)) {
      codeByName.set(normalized, cleanCode);
    }
  };

  const simplePatterns = [
    /\b(GLW\d{3}|GLP\d{2}|RG\d{3}|TE\d{3}|UGF\d{2,3}[A-Z]?|GL\d{3})\s+([^\n]+)/g,
  ];

  for (const pattern of simplePatterns) {
    for (const match of text.matchAll(pattern)) {
      addEntry(match[1], match[2]);
    }
  }

  for (const match of text.matchAll(/G\s*L\s*P\s*(\d{2})\s+([A-Za-z][A-Za-z\s]+)/g)) {
    addEntry(`GLP${match[1]}`, match[2]);
  }

  return { namesByCode, codeByName };
}

function getLine(categories) {
  for (const category of categories) {
    if (LEAF_CATEGORY_TO_LINE[category]) {
      return LEAF_CATEGORY_TO_LINE[category];
    }
  }

  return "Glossy Series Glazes";
}

function parseTitleParts(title) {
  for (const pattern of TITLE_LINE_PATTERNS) {
    const match = title.match(pattern.regex);
    if (!match) continue;

    return {
      line: pattern.line,
      code: pattern.code ? pattern.code(match) : null,
      name: normalizeWhitespace(pattern.name(match)),
    };
  }

  return null;
}

function maybeExtractCodeFromText(value, line) {
  if (!value) return null;

  const explicit = value.match(/\b(GLW\d{3}|GLP\d{2}|RG\d{3}|TE\d{3}|UGF\d{2,3}[A-Z]?|GLD\d{3}|GL\d{3})\b/i);
  if (explicit) return explicit[1].toUpperCase();

  if (line === "P Series Glazes") {
    const pSeries = value.match(/\bP(\d{2})\b/i);
    if (pSeries) return `GLP${pSeries[1]}`;
  }

  return null;
}

function resolveCode(product, catalogMaps) {
  const checks = [
    product.parsedCode,
    maybeExtractCodeFromText(product.h1, product.line),
    maybeExtractCodeFromText(product.title, product.line),
    maybeExtractCodeFromText(product.url, product.line),
    ...product.imageUrls.map((url) => maybeExtractCodeFromText(url, product.line)),
  ].filter(Boolean);

  if (checks.length) {
    return checks[0];
  }

  const mapped = catalogMaps.codeByName.get(normalizeName(product.name));
  if (mapped) {
    return mapped;
  }

  if (product.line === "Mica Terra Sigillata") {
    const imageCode = product.imageUrls.map((url) => maybeExtractCodeFromText(url, product.line)).find(Boolean);
    if (imageCode) return imageCode;
  }

  return null;
}

function normalizeNameFromProduct(product, catalogMaps) {
  const explicitCode = product.parsedCode
    ?? maybeExtractCodeFromText(product.h1, product.line)
    ?? maybeExtractCodeFromText(product.title, product.line)
    ?? maybeExtractCodeFromText(product.url, product.line);

  if (explicitCode && catalogMaps.namesByCode.has(explicitCode)) {
    return catalogMaps.namesByCode.get(explicitCode);
  }

  const mappedCode = catalogMaps.codeByName.get(normalizeName(product.name));
  if (mappedCode && catalogMaps.namesByCode.has(mappedCode)) {
    return catalogMaps.namesByCode.get(mappedCode);
  }

  return normalizeWhitespace(product.name);
}

async function collectCategoryUrls(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(CAC_CATEGORY_URL, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(12000);

  const { resultCount, pageUrls } = await page.evaluate((categoryUrl) => {
    const resultCount = document.querySelector(".woocommerce-result-count")?.textContent?.trim() ?? "";
    const matches = [...document.querySelectorAll('a[href*="/page/"]')]
      .map((anchor) => anchor.href)
      .filter((href) => href.includes("/product-category/ceramic-glazes/clay-art-center-glazes/page/"));

    return {
      resultCount,
      pageUrls: [categoryUrl, ...matches],
    };
  }, CAC_CATEGORY_URL);

  await page.close();

  const totalResults = Number(resultCount.match(/of\s+(\d+)\s+results/i)?.[1] ?? "0");
  const totalPages = Math.max(1, Math.ceil(totalResults / 25));
  const ordered = [];
  const seen = new Set();

  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
    const href = pageNumber === 1
      ? CAC_CATEGORY_URL
      : `${CAC_CATEGORY_URL.replace(/\/$/, "")}/page/${pageNumber}/`;
    if (!seen.has(href)) {
      ordered.push(href);
      seen.add(href);
    }
  }

  for (const href of pageUrls) {
    if (!seen.has(href)) {
      ordered.push(href);
      seen.add(href);
    }
  }

  return ordered;
}

async function collectProductLinks(browser, pageUrls) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const links = [];
  const seen = new Set();

  for (const url of pageUrls) {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120000 });
    await page.waitForTimeout(6000);

    const pageLinks = await page.evaluate(() => (
      Array.from(document.querySelectorAll('a[href*="/product/"]'))
        .map((anchor) => ({
          href: anchor.href,
          imageUrl: anchor.querySelector("img")?.src ?? null,
        }))
        .filter((item, index, items) => item.href && items.findIndex((other) => other.href === item.href) === index)
    ));

    for (const item of pageLinks) {
      if (seen.has(item.href)) continue;
      seen.add(item.href);
      links.push(item);
    }
  }

  await page.close();
  return links;
}

async function collectProducts(browser, links) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const products = [];

  for (const [index, item] of links.entries()) {
    await page.goto(item.href, { waitUntil: "domcontentloaded", timeout: 120000 });
    await page.waitForTimeout(4000);

    const product = await page.evaluate((fallbackImageUrl) => {
      const h1 = document.querySelector("h1")?.textContent?.trim() ?? "";
      const title = document.title?.replace(/\s*-\s*Clay Art Center\s*$/i, "").trim() ?? "";
      const categories = Array.from(document.querySelectorAll(".posted_in a"))
        .map((anchor) => anchor.textContent?.trim())
        .filter(Boolean);
      const imageUrls = Array.from(document.querySelectorAll(".woocommerce-product-gallery img"))
        .map((image) => image.getAttribute("src") || image.getAttribute("data-src") || "")
        .filter(Boolean);
      const tabDescription = document.querySelector("#tab-description, .woocommerce-Tabs-panel--description")?.textContent?.trim() ?? null;
      const bodyMatch = document.body.innerText.match(/(?:SKU|Code)\s*[:#]?\s*([A-Z]{2,4}\d{2,3}[A-Z]?)/i)?.[1] ?? null;

      return {
        url: location.href,
        title,
        h1,
        categories,
        imageUrls: [fallbackImageUrl, ...imageUrls].filter(Boolean),
        description: tabDescription,
        bodyCode: bodyMatch,
      };
    }, item.imageUrl);

    const skip = /sample pack/i.test(product.h1) || /discontinued/i.test(product.h1);
    if (skip) {
      process.stdout.write(`Skipping ${index + 1}/${links.length}: ${product.h1}\n`);
      continue;
    }

    products.push(product);
    process.stdout.write(`Scraped ${index + 1}/${links.length}: ${product.h1}\n`);
  }

  await page.close();
  return products;
}

function buildGlazeRows(products, catalogMaps) {
  return products.map((product) => {
    const parsedTitle = parseTitleParts(product.h1 || product.title);
    const line = parsedTitle?.line ?? getLine(product.categories);
    const provisionalName = parsedTitle?.name
      ?? titleToFallbackName(product.h1 || product.title || slugToName(new URL(product.url).pathname.split("/").filter(Boolean).pop() ?? ""));
    const normalizedName = normalizeNameFromProduct(
      {
        ...product,
        line,
        parsedCode: parsedTitle?.code ?? null,
        name: provisionalName,
      },
      catalogMaps,
    );

    const name = titleCase(
      normalizedName
        .replace(/^Terra Sigillata\s*-\s*/i, "")
        .replace(/^CAC\s+/i, "")
        .trim()
    );

    const imageUrls = [...new Set(product.imageUrls.map(canonicalizeImageUrl).filter(Boolean))];
    const code = resolveCode(
      {
        ...product,
        line,
        parsedCode: parsedTitle?.code ?? null,
        name,
        imageUrls,
      },
      catalogMaps,
    ) ?? product.bodyCode ?? null;

    const description = normalizeWhitespace(product.description || LINE_TO_DESCRIPTION[line] || "");

    return {
      brand: BRAND,
      line,
      code,
      name,
      cone: LINE_TO_CONE[line] ?? null,
      description: description || null,
      imageUrl: imageUrls[0] ?? null,
      sourceUrl: product.url,
      galleryImages: imageUrls,
    };
  });
}

function buildFiringImages(glazes) {
  const entries = [];

  for (const glaze of glazes) {
    const extras = glaze.galleryImages.slice(1);

    extras.forEach((imageUrl, index) => {
      entries.push({
        brand: glaze.brand,
        code: glaze.code,
        sourceUrl: glaze.sourceUrl,
        label: `Example ${index + 2}`,
        cone: glaze.cone,
        atmosphere: null,
        imageUrl,
        sortOrder: 200 + index * 10,
      });
    });
  }

  return entries;
}

function buildCatalogSql(glazes) {
  const values = glazes.map((glaze) => (
    `  ('commercial', '${escapeSql(glaze.brand)}', '${escapeSql(glaze.line)}', ${
      glaze.code ? `'${escapeSql(glaze.code)}'` : "null"
    }, '${escapeSql(glaze.name)}', ${
      glaze.cone ? `'${escapeSql(glaze.cone)}'` : "null"
    }, ${
      glaze.description ? `'${escapeSql(glaze.description)}'` : "null"
    }, ${
      glaze.imageUrl ? `'${escapeSql(glaze.imageUrl)}'` : "null"
    })`
  ));

  return `-- Generated by scripts/scrape_clay_art_center_catalog.mjs from clayartcenter.net on 2026-04-10.\nwith deleted_firing as (\n  delete from public.glaze_firing_images\n  where glaze_id in (\n    select id\n    from public.glazes\n    where brand = '${escapeSql(BRAND)}' and created_by_user_id is null\n  )\n), deleted_glazes as (\n  delete from public.glazes\n  where brand = '${escapeSql(BRAND)}' and created_by_user_id is null\n)\ninsert into public.glazes (\n  source_type,\n  brand,\n  line,\n  code,\n  name,\n  cone,\n  description,\n  image_url\n)\nvalues\n${values.join(",\n")};\n`;
}

function buildFiringSql(glazes, firingImages) {
  const keyByLookup = new Map();

  for (const glaze of glazes) {
    const lookup = glaze.code
      ? `${glaze.brand}::${glaze.code}`
      : `${glaze.brand}::${glaze.name}`;
    keyByLookup.set(lookup, glaze);
  }

  const values = firingImages
    .map((entry) => {
      const glaze = entry.code
        ? keyByLookup.get(`${entry.brand}::${entry.code}`)
        : keyByLookup.get(`${entry.brand}::${entry.sourceUrl}`);

      const matchByName = !glaze && glazes.find((candidate) => candidate.sourceUrl === entry.sourceUrl);
      const target = glaze ?? matchByName;
      if (!target) return null;

      const glazeMatch = target.code
        ? `(select id from public.glazes where brand = '${escapeSql(target.brand)}' and code = '${escapeSql(target.code)}' and created_by_user_id is null limit 1)`
        : `(select id from public.glazes where brand = '${escapeSql(target.brand)}' and name = '${escapeSql(target.name)}' and created_by_user_id is null limit 1)`;

      return `  (${glazeMatch}, '${escapeSql(entry.label)}', ${
        entry.cone ? `'${escapeSql(entry.cone)}'` : "null"
      }, null, '${escapeSql(entry.imageUrl)}', ${entry.sortOrder})`;
    })
    .filter(Boolean);

  return `-- Generated by scripts/scrape_clay_art_center_catalog.mjs from clayartcenter.net on 2026-04-10.\ndelete from public.glaze_firing_images\nwhere glaze_id in (\n  select id from public.glazes where brand = '${escapeSql(BRAND)}' and created_by_user_id is null\n);\n\ninsert into public.glaze_firing_images (\n  glaze_id,\n  label,\n  cone,\n  atmosphere,\n  image_url,\n  sort_order\n)\nvalues\n${values.join(",\n")};\n`;
}

function writeJson(path, value) {
  writeFileSync(path, JSON.stringify(value, null, 2));
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const catalogMaps = parseCatalogText();
  const browser = await chromium.launch({ headless: false });

  try {
    const pageUrls = await collectCategoryUrls(browser);
    const productLinks = await collectProductLinks(browser, pageUrls);
    const products = await collectProducts(browser, productLinks);
    const glazes = buildGlazeRows(products, catalogMaps);
    const firingImages = buildFiringImages(glazes);

    writeJson(
      GLAZES_PATH,
      glazes.map((glaze) => ({
        brand: glaze.brand,
        line: glaze.line,
        code: glaze.code,
        name: glaze.name,
        cone: glaze.cone,
        description: glaze.description,
        imageUrl: glaze.imageUrl,
        sourceUrl: glaze.sourceUrl,
      })),
    );
    writeJson(
      FIRING_IMAGES_PATH,
      firingImages.map((entry) => ({
        brand: entry.brand,
        code: entry.code,
        label: entry.label,
        cone: entry.cone,
        atmosphere: entry.atmosphere,
        imageUrl: entry.imageUrl,
        sortOrder: entry.sortOrder,
      })),
    );
    writeFileSync(CATALOG_SQL_PATH, buildCatalogSql(glazes));
    writeFileSync(FIRING_SQL_PATH, buildFiringSql(glazes, firingImages));

    const missingCodes = glazes.filter((glaze) => !glaze.code);
    process.stdout.write(`\nSaved ${glazes.length} glaze rows to ${GLAZES_PATH}\n`);
    process.stdout.write(`Saved ${firingImages.length} firing images to ${FIRING_IMAGES_PATH}\n`);
    process.stdout.write(`Missing codes: ${missingCodes.length}\n`);

    if (missingCodes.length) {
      missingCodes.slice(0, 25).forEach((glaze) => {
        process.stdout.write(`  - ${glaze.line}: ${glaze.name}\n`);
      });
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
