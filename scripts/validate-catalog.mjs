import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
const normalize = (value) => String(value ?? "").replace(/[^a-z0-9]/gi, "").toLowerCase();
const imageFor = (row) => String(row.image_url ?? row.imageUrl ?? "").trim();
const descriptionFor = (row) => String(row.description ?? "").trim();

const catalog = readJson("data/catalog/glazes.json");
const spectrumLocalImages = readJson("data/vendors/spectrum-local-images.json");
const speedballLocalImages = readJson("data/vendors/speedball-local-images.json");

const brands = [
  ["Mayco", "data/vendors/mayco-glazes.json"],
  ["AMACO", "data/vendors/amaco-glazes.json"],
  ["Spectrum", "data/vendors/spectrum-glazes.json"],
  ["Coyote", "data/vendors/coyote-glazes.json"],
];

const knownRemoteFallbackCodes = new Set(["MBG215", "MBG221"]);
const knownExternalImageGaps = new Map();

const hasCone6 = (value) => {
  const text = String(value ?? "").replace(/[–—]/g, "-");
  return /\bcone\s*6\b/i.test(text)
    || /\bcone\s*5\s*[-/]\s*(?:6|10)\b/i.test(text)
    || /\bcone\s*6\s*[-/]\s*10\b/i.test(text);
};

const hasQualityDescription = (value) => {
  const raw = String(value ?? "");
  const description = raw.trim();
  if (!description || description.length < 40) return false;
  if (/\.\.\.$/.test(description)) return false;
  if (raw.length >= 500 && !/[.!?]$/.test(description)) return false;
  if (/\b(?:when|and|or|the|for|use|with|to|is|a|an)\s*$/i.test(description)) return false;
  return true;
};

const runtimeImageFor = (row) => {
  if (row.brand === "Spectrum" && row.code && spectrumLocalImages[row.code]) {
    const relative = spectrumLocalImages[row.code];
    if (fs.existsSync(path.join(root, "public", relative.replace(/^\/+/, "")))) return relative;
  }

  const raw = imageFor(row);
  if (raw) return raw;

  if (row.brand === "Spectrum" && row.code && spectrumLocalImages[row.code]) {
    const relative = spectrumLocalImages[row.code];
    return fs.existsSync(path.join(root, "public", relative.replace(/^\/+/, ""))) ? relative : null;
  }
  if (row.brand === "Speedball" && row.code && speedballLocalImages[row.code]) {
    const relative = speedballLocalImages[row.code];
    return fs.existsSync(path.join(root, "public", relative.replace(/^\/+/, ""))) ? relative : null;
  }
  if (row.brand === "Coyote" && row.code && !knownRemoteFallbackCodes.has(row.code.toUpperCase())) {
    const relative = `/vendor-images/coyote/${row.code.toLowerCase()}.jpg`;
    return fs.existsSync(path.join(root, "public", relative.replace(/^\/+/, ""))) ? relative : null;
  }
  return null;
};

const issues = [];
const report = [];

for (const [brand, sourcePath] of brands) {
  const source = readJson(sourcePath);
  const sourceCone6 = source.filter((row) => hasCone6(row.cone));
  const sourceCone6Codes = new Set(sourceCone6.map((row) => normalize(row.code)).filter(Boolean));
  const catalogRows = catalog.filter((row) => row.brand === brand);
  const catalogCone6Codes = new Set(
    catalogRows.filter((row) => hasCone6(row.cone)).map((row) => normalize(row.code)).filter(Boolean),
  );
  const missingCone6Codes = [...sourceCone6Codes].filter((code) => !catalogCone6Codes.has(code));
  const missingImages = catalogRows.filter((row) => !runtimeImageFor(row));
  const badDescriptions = catalogRows.filter((row) => !hasQualityDescription(row.description));
  const sourceMissingImages = source.filter((row) => !imageFor(row));
  const sourceBadDescriptions = source.filter((row) => !hasQualityDescription(row.description));

  if (missingCone6Codes.length) issues.push(`${brand}: missing cone-6 codes ${missingCone6Codes.join(", ")}`);
  if (badDescriptions.length) issues.push(`${brand}: ${badDescriptions.length} catalogue descriptions need repair`);
  if (sourceMissingImages.length) issues.push(`${brand}: ${sourceMissingImages.length} source rows have no image`);

  report.push({
    brand,
    sourceTotal: source.length,
    sourceCone6: sourceCone6Codes.size,
    catalogueTotal: catalogRows.length,
    catalogueCone6: catalogCone6Codes.size,
    missingCone6Codes,
    missingRuntimeImages: missingImages.map((row) => row.code),
    weakDescriptions: badDescriptions.map((row) => row.code),
    sourceMissingImages: sourceMissingImages.map((row) => row.code),
    sourceWeakDescriptions: sourceBadDescriptions.map((row) => row.code),
  });
}

const allMissingImages = catalog.filter((row) => !runtimeImageFor(row));
const allWeakDescriptions = catalog.filter((row) => !hasQualityDescription(row.description));
const unexpectedExternalGaps = allMissingImages.filter((row) => {
  const expected = knownExternalImageGaps.get(row.brand) ?? [];
  return !expected.includes(row.code);
});

if (allWeakDescriptions.length) issues.push(`Catalogue: ${allWeakDescriptions.length} rows have weak descriptions`);
if (unexpectedExternalGaps.length) {
  issues.push(`Catalogue: unexpected runtime image gaps ${unexpectedExternalGaps.map((row) => `${row.brand} ${row.code}`).join(", ")}`);
}

console.log(JSON.stringify({
  brands: report,
  catalogue: {
    total: catalog.length,
    runtimeImageGaps: allMissingImages.map((row) => ({ brand: row.brand, code: row.code, name: row.name })),
    weakDescriptionCount: allWeakDescriptions.length,
    documentedVendorSourceGaps: Object.fromEntries(knownExternalImageGaps),
  },
}, null, 2));

if (process.argv.includes("--strict-images") && allMissingImages.length) {
  issues.push(`Strict image mode: ${allMissingImages.length} catalogue rows still need an image`);
}

if (issues.length) {
  console.error("Catalogue validation failed:");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exitCode = 1;
} else if (allMissingImages.length) {
  console.log(`Catalogue validation passed with ${allMissingImages.length} documented vendor-source image gaps.`);
} else {
  console.log("Catalogue validation passed.");
}
