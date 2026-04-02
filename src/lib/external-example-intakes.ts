import type { ExternalExampleParserOutput, Glaze } from "@/lib/types";
import { formatGlazeLabel } from "@/lib/utils";

export interface ParsedExternalExampleMentionDraft {
  freeformText: string;
  matchedGlazeId?: string | null;
  confidence: number;
  mentionOrder: number;
}

export interface ParsedExternalExampleCaption {
  mentions: ParsedExternalExampleMentionDraft[];
  parserOutput: ExternalExampleParserOutput;
}

type PublishableMention = {
  matchedGlazeId?: string | null;
  isApproved?: boolean;
};

const clayBodyPatterns = [
  { pattern: /\bb-?mix\b/i, label: "B-Mix" },
  { pattern: /\bporcelain\b/i, label: "Porcelain" },
  { pattern: /\bwhite stoneware\b/i, label: "White stoneware" },
  { pattern: /\bbrown stoneware\b/i, label: "Brown stoneware" },
  { pattern: /\bspeckled buff\b/i, label: "Speckled buff" },
  { pattern: /\bbuff stoneware\b/i, label: "Buff stoneware" },
  { pattern: /\bstoneware\b/i, label: "Stoneware" },
  { pattern: /\bearthenware\b/i, label: "Earthenware" },
  { pattern: /\bterra cotta\b/i, label: "Terra cotta" },
] as const;

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function normalizeExternalSearchText(value: string | null | undefined) {
  return normalizeWhitespace((value ?? "").toUpperCase().replace(/[^A-Z0-9]+/g, " "));
}

export function normalizeGlazeCode(value: string | null | undefined) {
  return (value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function buildExactMatcher(value: string) {
  return new RegExp(`(^|[^A-Z0-9])${value.replace(/\s+/g, "\\s+")}([^A-Z0-9]|$)`, "i");
}

function dedupeMentions(mentions: ParsedExternalExampleMentionDraft[]) {
  const seen = new Set<string>();
  return mentions.filter((mention) => {
    const key = `${mention.matchedGlazeId ?? "unmatched"}:${normalizeExternalSearchText(mention.freeformText)}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function extractConeFromCaption(caption: string) {
  const matches = Array.from(
    caption.matchAll(/\bcone\s*(0?\d{1,2}(?:\s*[\/-]\s*0?\d{1,2})?)\b/gi),
  ).map((match) => match[1]?.replace(/\s+/g, ""));

  if (!matches.length) {
    return null;
  }

  const normalized = Array.from(
    new Set(
      matches.map((value) =>
        value
          .split(/[/-]/)
          .map((part) => (part.length > 1 && part.startsWith("0") ? part : String(Number(part))))
          .map((part) => `Cone ${part}`)
          .join(" / "),
      ),
    ),
  );

  return normalized.join(" / ");
}

export function extractAtmosphereFromCaption(caption: string) {
  if (/\breduction\b/i.test(caption)) {
    return "Reduction";
  }

  if (/\boxidation\b|\box\b/i.test(caption)) {
    return "Oxidation";
  }

  return null;
}

export function extractClayBodyFromCaption(caption: string) {
  const match = clayBodyPatterns.find(({ pattern }) => pattern.test(caption));
  return match?.label ?? null;
}

export function buildExternalExampleParserOutput(
  caption: string,
  mentions: ParsedExternalExampleMentionDraft[],
  options?: {
    duplicateSourceUrl?: boolean;
    duplicateSha256s?: string[];
  },
): ExternalExampleParserOutput {
  return {
    extractedCone: extractConeFromCaption(caption),
    extractedAtmosphere: extractAtmosphereFromCaption(caption),
    extractedClayBody: extractClayBodyFromCaption(caption),
    matchedTerms: mentions.map((mention) => mention.freeformText),
    duplicateSourceUrl: options?.duplicateSourceUrl ?? false,
    duplicateSha256s: options?.duplicateSha256s ?? [],
  };
}

export function parseExternalExampleCaption(caption: string, glazes: Glaze[]): ParsedExternalExampleCaption {
  const normalizedCaption = normalizeExternalSearchText(caption);
  const mentions: ParsedExternalExampleMentionDraft[] = [];
  const matchedGlazeIds = new Set<string>();

  const glazesByCode = glazes.reduce<Map<string, Glaze[]>>((map, glaze) => {
    const normalizedCode = normalizeGlazeCode(glaze.code);

    if (!normalizedCode) {
      return map;
    }

    map.set(normalizedCode, [...(map.get(normalizedCode) ?? []), glaze]);
    return map;
  }, new Map());

  const codeMatches = Array.from(caption.toUpperCase().matchAll(/\b[A-Z]{1,4}-?\d{1,4}\b/g));

  for (const [index, match] of codeMatches.entries()) {
    const rawCode = match[0];
    const normalizedCode = normalizeGlazeCode(rawCode);
    const matchingGlazes = glazesByCode.get(normalizedCode) ?? [];

    for (const glaze of matchingGlazes) {
      if (matchedGlazeIds.has(glaze.id)) {
        continue;
      }

      matchedGlazeIds.add(glaze.id);
      mentions.push({
        freeformText: rawCode,
        matchedGlazeId: glaze.id,
        confidence: 0.98,
        mentionOrder: index,
      });
    }
  }

  for (const glaze of glazes) {
    if (matchedGlazeIds.has(glaze.id)) {
      continue;
    }

    const label = formatGlazeLabel(glaze);
    const normalizedLabel = normalizeExternalSearchText(label);
    const normalizedName = normalizeExternalSearchText(glaze.name);

    const labelWordCount = normalizedLabel.split(" ").filter(Boolean).length;
    const nameWordCount = normalizedName.split(" ").filter(Boolean).length;
    const hasExplicitLabelMatch =
      normalizedLabel.length >= 8 &&
      labelWordCount >= 2 &&
      buildExactMatcher(normalizedLabel).test(normalizedCaption);
    const hasExplicitNameMatch =
      normalizedName.length >= 8 &&
      nameWordCount >= 1 &&
      buildExactMatcher(normalizedName).test(normalizedCaption);

    if (!hasExplicitLabelMatch && !hasExplicitNameMatch) {
      continue;
    }

    matchedGlazeIds.add(glaze.id);
    mentions.push({
      freeformText: hasExplicitLabelMatch ? label : glaze.name,
      matchedGlazeId: glaze.id,
      confidence: hasExplicitLabelMatch ? 0.8 : 0.62,
      mentionOrder: mentions.length,
    });
  }

  const dedupedMentions = dedupeMentions(
    mentions.sort((left, right) => right.confidence - left.confidence || left.mentionOrder - right.mentionOrder),
  ).map((mention, index) => ({
    ...mention,
    mentionOrder: index,
  }));

  return {
    mentions: dedupedMentions,
    parserOutput: buildExternalExampleParserOutput(caption, dedupedMentions),
  };
}

export function resolveGlazeInput(glazes: Glaze[], input: string) {
  const normalizedInput = normalizeExternalSearchText(input);
  const normalizedCode = normalizeGlazeCode(input);

  if (!normalizedInput) {
    return null;
  }

  const byId = glazes.find((glaze) => glaze.id === input.trim());

  if (byId) {
    return byId;
  }

  const exactCodeMatches = normalizedCode
    ? glazes.filter((glaze) => normalizeGlazeCode(glaze.code) === normalizedCode)
    : [];

  if (exactCodeMatches.length === 1) {
    return exactCodeMatches[0] ?? null;
  }

  const exactLabelMatches = glazes.filter(
    (glaze) => normalizeExternalSearchText(formatGlazeLabel(glaze)) === normalizedInput,
  );

  if (exactLabelMatches.length === 1) {
    return exactLabelMatches[0] ?? null;
  }

  const exactNameMatches = glazes.filter(
    (glaze) => normalizeExternalSearchText(glaze.name) === normalizedInput,
  );

  if (exactNameMatches.length === 1) {
    return exactNameMatches[0] ?? null;
  }

  const fuzzyMatches = glazes.filter((glaze) => {
    const normalizedLabel = normalizeExternalSearchText(formatGlazeLabel(glaze));
    return normalizedLabel.includes(normalizedInput);
  });

  return fuzzyMatches.length === 1 ? (fuzzyMatches[0] ?? null) : null;
}

export function buildAnonymizedCombinationAuthorName(sourcePlatform: string) {
  return sourcePlatform === "facebook" ? "Facebook group archive" : "Community archive";
}

export function getApprovedMatchedGlazeIds(mentions: PublishableMention[]) {
  return Array.from(
    new Set(
      mentions
        .filter((mention) => Boolean(mention.isApproved) && mention.matchedGlazeId)
        .map((mention) => String(mention.matchedGlazeId)),
    ),
  );
}

export function canPublishExternalExampleIntake(reviewStatus: string, mentions: PublishableMention[]) {
  if (["duplicate", "rejected", "published"].includes(reviewStatus)) {
    return false;
  }

  return getApprovedMatchedGlazeIds(mentions).length === 2;
}
