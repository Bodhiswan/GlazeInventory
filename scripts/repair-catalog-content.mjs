import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const readJson = (relativePath) =>
  JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));

const writeJson = (relativePath, value) => {
  fs.writeFileSync(
    path.join(root, relativePath),
    `${JSON.stringify(value, null, 2)}\n`,
    "utf8",
  );
};

const normalize = (value) =>
  String(value ?? "")
    .normalize("NFKD")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();

const normalizeCone = (value) =>
  String(value ?? "")
    .replace(/\s+/g, "")
    .replace(/[–—]/g, "-")
    .toLowerCase();

const imageUrl = (value) => {
  if (!value) return null;
  return value.startsWith("//") ? `https:${value}` : value;
};

const files = {
  catalog: "data/catalog/glazes.json",
  chrysanthos: "data/vendors/chrysanthos-glazes.json",
  scarva: "data/vendors/scarva-glazes.json",
  laguna: "data/vendors/laguna-glazes.json",
  speedball: "data/vendors/speedball-glazes.json",
  mayco: "data/vendors/mayco-glazes.json",
  amaco: "data/vendors/amaco-glazes.json",
  spectrum: "data/vendors/spectrum-glazes.json",
  coyote: "data/vendors/coyote-glazes.json",
  botz: "data/vendors/botz-glazes.json",
  bathPotters: "data/vendors/bath-potters-glazes.json",
};

const catalog = readJson(files.catalog);
const spectrumLocalImages = readJson("data/vendors/spectrum-local-images.json");
const speedballLocalImages = readJson("data/vendors/speedball-local-images.json");
const vendors = {
  Chrysanthos: readJson(files.chrysanthos),
  Scarva: readJson(files.scarva),
  Laguna: readJson(files.laguna),
  Speedball: readJson(files.speedball),
  Mayco: readJson(files.mayco),
  AMACO: readJson(files.amaco),
  Spectrum: readJson(files.spectrum),
  Coyote: readJson(files.coyote),
  BOTZ: readJson(files.botz),
  "Bath Potters": readJson(files.bathPotters),
};

const staticImageOverrides = {
  Chrysanthos: {
    SW157: "https://www.chrysanthos.com/wp-content/uploads/2024/08/SW157.png",
    SW069: "https://www.chrysanthos.com/wp-content/uploads/2024/08/SW069.png",
    SW149: "https://www.chrysanthos.com/wp-content/uploads/2024/08/SW149.png",
    SW161: "https://www.chrysanthos.com/wp-content/uploads/2023/04/SW161-290x290-1.png",
    SW089: "https://www.chrysanthos.com/wp-content/uploads/2024/08/SW089.png",
    SW153: "https://www.chrysanthos.com/wp-content/uploads/2024/08/SW153.png",
    SW001: "https://www.chrysanthos.com/wp-content/uploads/2024/08/SW001.png",
    SW093: "https://www.chrysanthos.com/wp-content/uploads/2024/08/SW093.png",
    SW009: "https://www.chrysanthos.com/wp-content/uploads/2024/08/SW009.png",
    SW109: "https://www.chrysanthos.com/wp-content/uploads/2024/08/SW109.png",
    SW021: "https://www.chrysanthos.com/wp-content/uploads/2024/08/SW021.png",
    SW129: "https://www.chrysanthos.com/wp-content/uploads/2024/08/SW129.png",
    SW041: "https://www.chrysanthos.com/wp-content/uploads/2024/08/SW041.png",
    SW141: "https://www.chrysanthos.com/wp-content/uploads/2024/08/SW141.png",
  },
  Scarva: {
    ESGCC: "https://www.scarva.com/Images/Models/Full/10573.Jpg",
    "ESGCC-EW": "https://www.scarva.com/Images/Models/Full/10853.Jpg",
    ESU013: "https://www.scarva.com/Images/Models/Full/10794.Jpg",
    ESU027: "https://www.scarva.com/Images/Models/Full/10801.Jpg",
    ESU037: "https://www.scarva.com/Images/Models/Full/10806.Jpg",
    ESU039: "https://www.scarva.com/Images/Models/Full/10807.Jpg",
    ESU071: "https://www.scarva.com/Images/Models/Full/10822.Jpg",
    ESU085: "https://www.scarva.com/Images/Models/Full/10829.Jpg",
    ESU113: "https://www.scarva.com/Images/Models/Full/10479.Jpg",
    ESU125: "https://www.scarva.com/Images/Models/Full/10491.Jpg",
    ESU145: "https://www.scarva.com/Images/Models/Full/10511.Jpg",
    ESU173: "https://www.scarva.com/Images/Models/Full/10539.Jpg",
    ESU177: "https://www.scarva.com/Images/Models/Full/10543.Jpg",
  },
  Speedball: {
    // The current Speedball product endpoint no longer exposes images for these
    // legacy Earthenware colours. These matching product photos are from Soul
    // Ceramics, a ceramics supplier; the row sourceUrl remains Speedball's
    // official Earthenware catalogue page for product/firing information.
    "004000": "https://cdn.shopify.com/s/files/1/0836/2769/products/speedball-speedball-clear-earthenware-glaze-soul-ceramics.jpg?v=1781153513",
    "004003": "https://cdn.shopify.com/s/files/1/0836/2769/products/speedball-speedball-yellow-orange-earthenware-glaze-soul-ceramics.jpg?v=1781153517",
    "004004": "https://cdn.shopify.com/s/files/1/0836/2769/products/speedball-speedball-chartreuse-earthenware-glaze-soul-ceramics.jpg?v=1781153518",
    "004005": "https://cdn.shopify.com/s/files/1/0836/2769/products/speedball-speedball-celadon-earthenware-glaze-soul-ceramics.jpg?v=1781153519",
    "004007": "https://cdn.shopify.com/s/files/1/0836/2769/products/speedball-speedball-pine-earthenware-glaze-soul-ceramics.jpg?v=1781153521",
    "004010": "https://cdn.shopify.com/s/files/1/0836/2769/products/speedball-speedball-sea-blue-earthenware-glaze-soul-ceramics.jpg?v=1781153525",
    "004011": "https://cdn.shopify.com/s/files/1/0836/2769/products/speedball-speedball-medium-blue-earthenware-glaze-soul-ceramics.jpg?v=1781153526",
    "004014": "https://cdn.shopify.com/s/files/1/0836/2769/products/speedball-speedball-violet-earthenware-glaze-soul-ceramics.jpg?v=1781153529",
    "004015": "https://cdn.shopify.com/s/files/1/0836/2769/products/speedball-speedball-burgundy-earthenware-glaze-soul-ceramics.jpg?v=1781153530",
    "004017": "https://cdn.shopify.com/s/files/1/0836/2769/products/speedball-speedball-gray-earthenware-glaze-soul-ceramics.jpg?v=1781153533",
    "004019": "https://cdn.shopify.com/s/files/1/0836/2769/products/speedball-speedball-tan-earthenware-glaze-soul-ceramics.jpg?v=1781153535",
    "004020": "https://cdn.shopify.com/s/files/1/0836/2769/products/speedball-speedball-honey-earthenware-glaze-soul-ceramics.jpg?v=1781153536",
    "004001": "https://cdn11.bigcommerce.com/s-glqkoqulcz/images/stencil/1280w/attribute_rule_images/143_source_1754914592.png",
    "004002": "https://cdn11.bigcommerce.com/s-glqkoqulcz/images/stencil/1280w/attribute_rule_images/144_source_1754914593.png",
    "004006": "https://cdn11.bigcommerce.com/s-glqkoqulcz/images/stencil/1280w/attribute_rule_images/155_source_1754914592.png",
    "004009": "https://cdn11.bigcommerce.com/s-glqkoqulcz/images/stencil/1280w/attribute_rule_images/163_source_1754914593.png",
    "004012": "https://cdn11.bigcommerce.com/s-glqkoqulcz/images/stencil/1280w/attribute_rule_images/159_source_1754914592.png",
    "004013": "https://cdn11.bigcommerce.com/s-glqkoqulcz/images/stencil/1280w/attribute_rule_images/153_source_1754914592.png",
    "004016": "https://cdn11.bigcommerce.com/s-glqkoqulcz/images/stencil/1280w/attribute_rule_images/165_source_1754914973.png",
    "004018": "https://cdn11.bigcommerce.com/s-glqkoqulcz/images/stencil/1280w/attribute_rule_images/148_source_1754914592.png",
    "004021": "https://cdn11.bigcommerce.com/s-glqkoqulcz/images/stencil/1280w/attribute_rule_images/150_source_1754914592.png",
    "004022": "https://cdn11.bigcommerce.com/s-glqkoqulcz/images/stencil/1280w/attribute_rule_images/157_source_1754914592.png",
    "004023": "https://cdn11.bigcommerce.com/s-glqkoqulcz/images/stencil/1280w/attribute_rule_images/160_source_1754914973.png",
  },
};

const fallbackImageOverrides = {
  // Laguna's current product JSON omits media for these rows. LG-1 and LG-20
  // use the matching swatches from Laguna's official Cone 10 flyer
  // (cdn.shopify.com/.../cone_10_glaze_flyer_lagunaclay.pdf); RAKU-1 uses the
  // exact White Matte Raku sample published by New Mexico Clay.
  "LG-1": "/vendor-images/laguna/lg-1-timoku.png",
  "LG-20": "/vendor-images/laguna/lg-20-fake-ash.png",
  "RAKU-1": "/vendor-images/laguna/raku-1-white-matte.jpg",
  // These legacy Moroccan Sand rows still referenced the retired
  // porcelainandceramics.com host. Keep the exact supplier samples local so
  // the catalogue does not render a broken image when those cards are found.
  "MS-200": "/vendor-images/laguna/ms-200-dune-white.jpg",
  "MS-203": "/vendor-images/laguna/ms-203-black-out.jpg",
  "MS-322": "https://www.lagunaclay.com/cdn/shop/files/ms322star.png?v=1743802263",
  "MS-321": "https://www.lagunaclay.com/cdn/shop/files/ms321star.png?v=1743802345",
  "LG-15": "https://cdn.shopify.com/s/files/1/0664/2050/6866/files/BC_Upload_d8dd5a63-5a4d-4aa9-9663-eba663ec8e4f.png?v=1717432387",
  "WC-134": "https://cdn.shopify.com/s/files/1/0664/2050/6866/files/BC_Upload_29e3b3d8-8b7a-4a94-8a62-5cda79fcd2ab.png?v=1727722656",
  "WC-135": "https://cdn.shopify.com/s/files/1/0664/2050/6866/files/BC_Upload_70bc4784-ed12-4c1c-99c1-67960c8eec6e.png?v=1727722653",
  "WC-137": "https://cdn.shopify.com/s/files/1/0664/2050/6866/files/BC_Upload_f6ccf5ea-0e65-4bb1-871c-365bd44936be.png?v=1727722647",
  "WC-138": "https://cdn.shopify.com/s/files/1/0664/2050/6866/files/BC_Upload_c1fe535f-6b18-4f04-a8cf-6271a864deee.png?v=1727722224",
  "WC-139": "https://cdn.shopify.com/s/files/1/0664/2050/6866/files/BC_Upload_8b0e62b7-8f16-44c1-af0b-bdc7d5583e73.png?v=1727722644",
  "WC-141": "https://cdn.shopify.com/s/files/1/0664/2050/6866/files/BC_Upload_fcdb019e-57e1-40cd-92a5-f871ec62a505.png?v=1727722641",
  "DL-100": "https://cdn.shopify.com/s/files/1/0664/2050/6866/files/dl_100_fossil_white.png?v=1744064216",
  "DL-101": "https://cdn.shopify.com/s/files/1/0664/2050/6866/files/dl_101_teton_teal.png?v=1744064085",
  "DL-102": "https://cdn.shopify.com/s/files/1/0664/2050/6866/files/dl_102_metamorphic_blue.png?v=1744064273",
  "DL-104": "https://cdn.shopify.com/s/files/1/0664/2050/6866/files/dl_104_glacier_ice.png?v=1744064246",
  "DL-105": "https://cdn.shopify.com/s/files/1/0664/2050/6866/files/dl_105_black_ore.png?v=1744064311",
  "DL-108": "https://cdn.shopify.com/s/files/1/0664/2050/6866/files/dl_108_lava_lake_red.png?v=1744063964",
  "DL-109": "https://cdn.shopify.com/s/files/1/0664/2050/6866/files/dl_109_hoo_doo_orange.png?v=1744064012",
  "DL-110": "https://cdn.shopify.com/s/files/1/0664/2050/6866/files/dl_110_sulfur_vent_yellow.png?v=1744064189",
  "DL-111": "https://cdn.shopify.com/s/files/1/0664/2050/6866/files/dl_111_open_meadow_green.png?v=1744064159",
  "WC-559": "https://cdn.shopify.com/s/files/1/0664/2050/6866/files/BC_Upload_b02c144c-29e2-4f42-8258-966d11aa4976.png?v=1717432048",
};

const isIncompleteDescription = (value) => {
  const description = String(value ?? "").trim();
  if (!description || description.length < 40) return true;
  if (/\.\.\.$/.test(description)) return true;
  if (String(value ?? "").length >= 500 && !/[.!?]$/.test(description)) return true;
  if (/\b(?:when|and|or|the|for|use|with|to|is|a|an)\s*$/i.test(description)) return true;
  return false;
};

const completeEllipsis = (value) =>
  `${String(value ?? "").trim().replace(/\.\.\.$/, ".")} Final appearance depends on application, clay body, and firing; test before production.`;

const genericDescription = (row) => {
  const label = [row.brand, row.line].filter(Boolean).join(" ");
  const code = row.code ? ` (${row.code})` : "";
  const firing = row.cone ? ` It is listed for ${row.cone} firing.` : "";
  return `${label || "Catalogue"} product${code}: ${row.name}.${firing} Final color and surface vary with clay body, application, and firing; test before use.`;
};

const scarvaDescription = (row) => {
  const transparent = row.code?.startsWith("ESGCC");
  const type = transparent ? "transparent glaze" : "underglaze";
  const body = row.code === "ESGCC-EW" || /^ESU0/.test(row.code ?? "") ? "earthenware" : "stoneware";
  return `Scarva Earthstone ${body} ${type} ${row.name} (${row.code}) is listed for ${row.cone} firing. Test application and firing on the intended clay body before production.`;
};

async function fetchLagunaImage(row) {
  const fallback = fallbackImageOverrides[row.code];
  if (fallback) return fallback;
  if (!row.sourceUrl) return null;

  const endpoint = row.sourceUrl.endsWith(".js") ? row.sourceUrl : `${row.sourceUrl}.js`;
  try {
    const response = await fetch(endpoint, {
      headers: { "user-agent": "Glaze Library catalogue maintenance" },
    });
    if (!response.ok) return null;
    const payload = await response.json();
    return imageUrl(payload.images?.find(Boolean) ?? null);
  } catch {
    return null;
  }
}

function applyVendorImageOverrides(brand, rows) {
  const overrides = staticImageOverrides[brand] ?? {};
  for (const row of rows) {
    const override = overrides[row.code];
    if (override) row.imageUrl = override;
  }
}

function buildSourceIndex(rows) {
  const byCode = new Map();
  for (const row of rows) {
    const key = normalize(row.code);
    if (!key) continue;
    const list = byCode.get(key) ?? [];
    list.push(row);
    byCode.set(key, list);
  }
  return byCode;
}

function findSourceRow(row, sourceByBrandCode) {
  const candidates = sourceByBrandCode.get(`${row.brand}|${normalize(row.code)}`) ?? [];
  if (!candidates.length) return null;
  return (
    candidates.find((candidate) => normalize(candidate.name) === normalize(row.name)) ??
    candidates.find((candidate) => normalizeCone(candidate.cone) === normalizeCone(row.cone)) ??
    candidates[0]
  );
}

applyVendorImageOverrides("Chrysanthos", vendors.Chrysanthos);
applyVendorImageOverrides("Scarva", vendors.Scarva);
applyVendorImageOverrides("Speedball", vendors.Speedball);
for (const row of vendors.Speedball) {
  if (!row.imageUrl && speedballLocalImages[row.code]) row.imageUrl = speedballLocalImages[row.code];
}

const missingLagunaCodes = [
  ...new Set(
    [...vendors.Laguna, ...catalog.filter((row) => row.brand === "Laguna")]
      .filter((row) => !String(row.imageUrl ?? row.image_url ?? "").trim())
      .map((row) => row.code)
      .filter(Boolean),
  ),
];

const lagunaImages = new Map();
for (const code of missingLagunaCodes) {
  const row = vendors.Laguna.find((candidate) => candidate.code === code) ??
    catalog.find((candidate) => candidate.brand === "Laguna" && candidate.code === code);
  if (!row) continue;
  const result = await fetchLagunaImage({ ...row, sourceUrl: row.sourceUrl });
  if (result) lagunaImages.set(code, result);
}

for (const row of vendors.Laguna) {
  const image = lagunaImages.get(row.code);
  if (image) row.imageUrl = image;
}

for (const rows of [vendors.Chrysanthos, vendors.Scarva, vendors.Laguna, vendors.Speedball]) {
  for (const row of rows) {
    if (row.brand === "Scarva") row.description = scarvaDescription(row);
    else if (/\.\.\.$/.test(String(row.description ?? "").trim())) row.description = completeEllipsis(row.description);
    else if (isIncompleteDescription(row.description)) row.description = genericDescription(row);
  }
}

const sourceByBrandCode = new Map();
for (const [brand, rows] of Object.entries(vendors)) {
  const index = buildSourceIndex(rows);
  for (const [code, candidates] of index) sourceByBrandCode.set(`${brand}|${code}`, candidates);
}

for (const row of catalog) {
  const source = findSourceRow(row, sourceByBrandCode);
  let copiedSourceDescription = false;
  if (source?.description && !isIncompleteDescription(source.description) && !/\.\.\.$/.test(String(source.description).trim()) && (isIncompleteDescription(row.description) || source.description.length > row.description.length + 20)) {
    row.description = source.description;
    copiedSourceDescription = true;
  }

  if (row.brand === "Laguna") {
    const image = lagunaImages.get(row.code);
    if (image) row.image_url = image;
    const fallback = fallbackImageOverrides[row.code];
    if (fallback) row.image_url = fallback;
  }
  if (row.brand === "Spectrum" && spectrumLocalImages[row.code]) {
    row.image_url = spectrumLocalImages[row.code];
  }

  const override = staticImageOverrides[row.brand]?.[row.code];
  if (override) row.image_url = override;
  if (row.brand === "Speedball" && !row.image_url && speedballLocalImages[row.code]) {
    row.image_url = speedballLocalImages[row.code];
  }

  if (row.brand === "Scarva") row.description = scarvaDescription(row);
  else if (/\.\.\.$/.test(String(row.description ?? "").trim())) row.description = completeEllipsis(row.description);
  else if (!copiedSourceDescription && isIncompleteDescription(row.description)) row.description = genericDescription(row);
}

for (const brand of ["Mayco", "Spectrum"]) {
  for (const row of vendors[brand]) {
    if (!isIncompleteDescription(row.description)) continue;

    const repairedCatalogRow = catalog.find(
      (candidate) =>
        candidate.brand === brand &&
        normalize(candidate.code) === normalize(row.code) &&
        normalize(candidate.name) === normalize(row.name),
    );

    row.description =
      repairedCatalogRow && !isIncompleteDescription(repairedCatalogRow.description)
        ? repairedCatalogRow.description
        : genericDescription(row);
  }
}

writeJson(files.catalog, catalog);
writeJson(files.chrysanthos, vendors.Chrysanthos);
writeJson(files.scarva, vendors.Scarva);
writeJson(files.laguna, vendors.Laguna);
writeJson(files.speedball, vendors.Speedball);
writeJson(files.mayco, vendors.Mayco);
writeJson(files.spectrum, vendors.Spectrum);

const unresolvedLaguna = missingLagunaCodes.filter((code) => !lagunaImages.has(code));
console.log(JSON.stringify({
  updated: {
    chrysanthosImages: vendors.Chrysanthos.filter((row) => row.imageUrl).length,
    scarvaImages: vendors.Scarva.filter((row) => row.imageUrl).length,
    speedballCurrentImages: vendors.Speedball.filter((row) => staticImageOverrides.Speedball[row.code]).length,
    lagunaImages: lagunaImages.size,
  },
  unresolvedLaguna,
}, null, 2));
