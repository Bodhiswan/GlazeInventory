from __future__ import annotations

import html
import json
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote, urljoin
from urllib.request import Request, urlopen


USER_AGENT = "GlazeInventoryCatalogBot/1.0 (+https://glazeinventory.com)"
NAMESPACE = uuid.UUID("4f3b8c8f-ef2e-4d2a-90a4-3c0f1a4f35ef")
CATALOG_PATH = Path("data/catalog/glazes.json")
OUTPUT_DIR = Path("data/vendors")
MIGRATION_PATH = Path("supabase/migrations/20260424100000_import_uk_supplier_catalogs.sql")


BATH_CATEGORIES = [
    {
        "line": "Bath Potters Decorating Slips",
        "cone": "Cone 06 / Cone 6 / Cone 10",
        "url": "https://www.bathpotters.co.uk/slips-glazes/decorating-slips/bath-potters-decorating-slips/c188?filter=1&f_brand=4",
    },
    {
        "line": "Bath Potters Stoneware Brush-On Glazes",
        "cone": "Cone 6 / Cone 10",
        "url": "https://www.bathpotters.co.uk/slips-glazes/stoneware-glazes-1180c-1300c/stoneware-brush-on-glaze-1180c-1300c/bath-potters-stoneware-glazes/c211?filter=1&f_brand=4",
    },
    {
        "line": "Bath Potters Raku Brush-On Glazes",
        "cone": "Raku",
        "url": "https://www.bathpotters.co.uk/slips-glazes/raku-glazes/raku-brush-on-glazes/bath-potters-raku-glazes/c81?filter=1&f_brand=4",
    },
    {
        "line": "Bath Potters Earthenware Powder Glazes",
        "cone": "Cone 06 / Cone 04",
        "url": "https://www.bathpotters.co.uk/slips-glazes/earthenware-glazes-1020c-1160c/powdered-earthenware-glazes-1020c-1160c/c129?filter=1&f_brand=4",
    },
    {
        "line": "Bath Potters Stoneware Glaze Powders",
        "cone": "Cone 6 / Cone 10",
        "url": "https://www.bathpotters.co.uk/slips-glazes/stoneware-glazes-1180c-1300c/stoneware-glaze-powder-1200c-1300c/bath-potters-stoneware-glaze-powders/c58?filter=1&f_brand=4",
    },
    {
        "line": "Bath Potters Earthenware Brush-On Glazes",
        "cone": "Cone 06 / Cone 04",
        "url": "https://www.bathpotters.co.uk/slips-glazes/earthenware-glazes-1020c-1160c/brush-on-earthenware-glazes-1020c-1160c/bath-potters-glazes/c128?filter=1&f_brand=4",
    },
]


SCARVA_SEED = [
    {
        "code": "ESGCC",
        "name": "ColourCoat Stoneware Cloudless Underglaze Transparent",
        "line": "Earthstone ColourCoat Stoneware",
        "cone": "Cone 6 / Cone 9",
        "url": "https://www.scarva.com/en/gb/Scarva-Earthstone-Glazes-ColourCoat-Stoneware-Cloudless-Underglaze-Transparent/m-10573.aspx",
        "description": "Earthstone ColourCoat stoneware transparent glaze developed for Scarva Earthstone stoneware underglazes.",
    },
    {
        "code": "ESGCC-EW",
        "name": "ColourCoat Earthenware Cloudless Underglaze Transparent",
        "line": "Earthstone ColourCoat Earthenware",
        "cone": "Cone 05 / Cone 1",
        "url": "https://www.scarva.com/en/Scarva-Earthstone-Glazes-ColourCoat-Earthenware-Cloudless-Underglaze-Transparent/m-10853.aspx",
        "description": "Earthstone ColourCoat earthenware transparent glaze developed for Scarva Earthstone earthenware underglazes.",
    },
    {"code": "ESU013", "name": "Electric Citrus", "line": "Earthstone Earthenware Underglazes", "cone": "Cone 05 / Cone 1", "url": "https://www.scarva.com/en/Scarva-Earthstone-Underglazes-ESU013-Electric-Citrus-Earthenware-Underglaze/m-10794.aspx"},
    {"code": "ESU027", "name": "Canopy", "line": "Earthstone Earthenware Underglazes", "cone": "Cone 05 / Cone 1", "url": "https://www.scarva.com/en/Scarva-Earthstone-Underglazes-ESU027-Canopy-Earthenware-Underglaze/m-10801.aspx"},
    {"code": "ESU037", "name": "Seabound", "line": "Earthstone Earthenware Underglazes", "cone": "Cone 05 / Cone 1", "url": "https://www.scarva.com/en/Scarva-Earthstone-Underglazes-ESU037-Seabound-Earthenware-Underglaze---100ml/s-10806-41900.aspx"},
    {"code": "ESU039", "name": "Surf", "line": "Earthstone Earthenware Underglazes", "cone": "Cone 05 / Cone 1", "url": "https://www.scarva.com/en/us/Scarva-Earthstone-Underglazes-ESU039-Surf-Earthenware-Underglaze/m-10807.aspx"},
    {"code": "ESU071", "name": "Blood Orange", "line": "Earthstone Earthenware Underglazes", "cone": "Cone 05 / Cone 1", "url": "https://www.scarva.com/en/us/Scarva-Earthstone-Underglazes-ESU071-Blood-Orange-Earthenware-Underglaze/m-10822.aspx"},
    {"code": "ESU085", "name": "Rust", "line": "Earthstone Earthenware Underglazes", "cone": "Cone 05 / Cone 1", "url": "https://www.scarva.com/en/Scarva-Earthstone-Underglazes-ESU085-Rust-Earthenware-Underglaze/m-10829.aspx"},
    {"code": "ESU113", "name": "Atomic Yellow", "line": "Earthstone Stoneware Underglazes", "cone": "Cone 5 / Cone 9", "url": "https://www.scarva.com/en/us/Scarva-Earthstone-Underglazes-ESU113-Atomic-Yellow-Stoneware-Underglaze/m-10479.aspx"},
    {"code": "ESU125", "name": "Clover", "line": "Earthstone Stoneware Underglazes", "cone": "Cone 5 / Cone 9", "url": "https://www.scarva.com/en/Scarva-Earthstone-Underglazes-ESU125-Clover-Stoneware-Underglaze/m-10491.aspx"},
    {"code": "ESU145", "name": "Glacier", "line": "Earthstone Stoneware Underglazes", "cone": "Cone 5 / Cone 9", "url": "https://www.scarva.com/en/us/Scarva-Earthstone-Underglazes-ESU145-Glacier-Stoneware-Underglaze/m-10511.aspx"},
    {"code": "ESU173", "name": "Flame", "line": "Earthstone Stoneware Underglazes", "cone": "Cone 5 / Cone 9", "url": "https://www.scarva.com/en/Scarva-Earthstone-Underglazes-ESU173-Flame-Stoneware-Underglaze/m-10539.aspx"},
    {"code": "ESU177", "name": "Oxblood", "line": "Earthstone Stoneware Underglazes", "cone": "Cone 5 / Cone 9", "url": "https://www.scarva.com/en/Scarva-Earthstone-Underglazes-ESU177-Oxblood-Stoneware-Underglaze/m-10543.aspx"},
]


COLOR_WORDS = [
    "white", "cream", "ivory", "clear", "transparent", "black", "grey", "gray",
    "silver", "gold", "brown", "amber", "tan", "beige", "red", "burgundy",
    "maroon", "orange", "coral", "yellow", "green", "olive", "sage", "teal",
    "turquoise", "aqua", "blue", "navy", "indigo", "purple", "lavender", "pink",
    "jade", "celadon", "citrus", "rust", "oxblood", "flame", "glacier",
    "canopy", "seabound", "surf", "clover",
]


def fetch_text(url: str) -> str:
    request = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(request, timeout=35) as response:
        return response.read().decode("utf-8", "replace")


def clean_text(value: str | None) -> str | None:
    if not value:
        return None
    text = html.unescape(re.sub(r"<[^>]+>", " ", value))
    text = re.sub(r"\s+", " ", text).strip()
    return text or None


def stable_id(brand: str, code: str | None, name: str) -> str:
    return str(uuid.uuid5(NAMESPACE, f"{brand}|{code or ''}|{name}".lower()))


def normalize_code(code: str | None) -> str | None:
    if not code:
        return None
    normalized = code.strip().upper()
    normalized = re.sub(r"-(?:S|1KG|2\.5KG|5KG|45|100ML|250ML|500ML|1LTR|PEN)$", "", normalized)
    if normalized.startswith(("P", "R")):
        normalized = re.sub(r"-(?:0?5|01)$", "", normalized)
    normalized = re.sub(r"\.(?:015|025|05|1|5)$", "", normalized)
    return normalized or None


def infer_color_notes(name: str, description: str | None = None) -> str | None:
    haystack = name.lower()
    labels: list[str] = []
    for word in COLOR_WORDS:
        if re.search(rf"\b{re.escape(word)}\b", haystack):
            label = {
                "gray": "Grey",
                "transparent": "Clear",
                "jade": "Green",
                "celadon": "Green",
                "citrus": "Yellow",
                "rust": "Brown",
                "oxblood": "Red",
                "flame": "Orange",
                "glacier": "Blue",
                "canopy": "Green",
                "seabound": "Blue",
                "surf": "Blue",
                "clover": "Green",
            }.get(word, word.title())
            if label not in labels:
                labels.append(label)
    return ", ".join(labels) if labels else None


def infer_finish_notes(name: str, description: str | None = None) -> str | None:
    name_text = name.lower()
    haystack = f"{name} {description or ''}".lower()
    labels: list[str] = []
    patterns = [
        ("gloss", "Glossy"),
        ("shiny", "Glossy"),
        ("matt", "Matte"),
        ("matte", "Matte"),
        ("satin", "Satin"),
        ("crackle", "Crackle"),
        ("opaque", "Opaque"),
        ("speckled", "Speckled"),
        ("crystalline", "Crystalline"),
        ("raku", "Raku"),
    ]
    for keyword in ("transparent", "clear"):
        if keyword in name_text and "Transparent" not in labels:
            labels.append("Transparent")
    for keyword, label in patterns:
        if keyword in haystack and label not in labels:
            labels.append(label)
    return ", ".join(labels) if labels else None


def catalog_row(brand: str, line: str, code: str | None, name: str, cone: str | None, description: str | None, image_url: str | None, source_url: str | None) -> dict[str, object | None]:
    clean_description = clean_text(description)
    return {
        "id": stable_id(brand, code, name),
        "source_type": "commercial",
        "name": name,
        "brand": brand,
        "line": line,
        "code": code,
        "cone": cone,
        "atmosphere": None,
        "finish_notes": infer_finish_notes(name, clean_description),
        "color_notes": infer_color_notes(name, clean_description),
        "recipe_notes": source_url,
        "created_by_user_id": None,
        "created_at": "2026-04-24T10:00:00+00:00",
        "description": clean_description,
        "image_url": image_url,
        "editorial_summary": None,
        "editorial_surface": None,
        "editorial_application": None,
        "editorial_firing": None,
        "editorial_reviewed_at": None,
        "editorial_reviewed_by_user_id": None,
        "moderation_state": None,
    }


def vendor_entry(row: dict[str, object | None]) -> dict[str, object | None]:
    return {
        "brand": row["brand"],
        "line": row["line"],
        "code": row["code"],
        "name": row["name"],
        "cone": row["cone"],
        "description": row["description"],
        "imageUrl": row["image_url"],
        "sourceUrl": row["recipe_notes"],
        "finishNotes": row["finish_notes"],
        "colorNotes": row["color_notes"],
    }


def scrape_bath_potters() -> list[dict[str, object | None]]:
    rows: list[dict[str, object | None]] = []
    seen: set[tuple[str | None, str]] = set()

    for category in BATH_CATEGORIES:
        text = fetch_text(category["url"])
        starts = [match.start() for match in re.finditer(r'<div[^>]+class="[^"]*productframe', text)]
        for index, start in enumerate(starts):
            end = starts[index + 1] if index + 1 < len(starts) else text.find('<div class="pagingoptions"', start)
            chunk = text[start : end if end != -1 else len(text)]
            title_match = re.search(r'<div class="name".*?<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>', chunk, re.S)
            if not title_match:
                continue

            name = clean_text(title_match.group(2))
            if not name:
                continue

            sku_match = re.search(r'name="variant"\s+value="([^"]+)"', chunk, re.S) or re.search(r'data-sku="([^"]+)"', chunk, re.S)
            image_match = re.search(r'<img[^>]+(?:data-src|src)="([^"]+)"', chunk, re.S)
            description_match = re.search(r'<div class="longdesc"[^>]*>(.*?)</div>', chunk, re.S)

            code = normalize_code(sku_match.group(1) if sku_match else None)
            key = (code, name)
            if key in seen:
                continue
            seen.add(key)

            rows.append(
                catalog_row(
                    brand="Bath Potters",
                    line=category["line"],
                    code=code,
                    name=name,
                    cone=category["cone"],
                    description=clean_text(description_match.group(1) if description_match else None),
                    image_url=urljoin("https://www.bathpotters.co.uk", image_match.group(1)) if image_match else None,
                    source_url=urljoin("https://www.bathpotters.co.uk", title_match.group(1)),
                )
            )

    return rows


def potterycrafts_line(product: dict[str, object]) -> tuple[str, str | None]:
    title = str(product.get("title") or "")
    tags = set(product.get("tags") or [])
    if "underglaze" in tags or "Underglaze" in title or "underglaze" in title.lower():
        return "Underglazes", "Cone 06 / Cone 6"
    if "on-glaze" in tags or "On-Glaze" in title:
        return "On-Glaze Colours", "Cone 018 / Cone 016"
    if "raku-glazes" in tags or "Raku" in title:
        return "Raku Glazes", "Raku"
    if "stoneware-powder-glaze" in tags or "Stoneware" in title:
        return "Stoneware Powder Glazes", "Cone 6 / Cone 10"
    if "decorating-slip" in tags or "Decorating Slip" in title:
        return "Decorating Slips", "Cone 06 / Cone 6 / Cone 10"
    return "Earthenware Powder Glazes", "Cone 06 / Cone 04"


def scrape_potterycrafts() -> list[dict[str, object | None]]:
    products: list[dict[str, object]] = []
    for page in range(1, 30):
        payload = json.loads(fetch_text(f"https://potterycrafts.co.uk/products.json?limit=250&page={page}"))
        page_products = payload.get("products") or []
        if not page_products:
            break
        products.extend(page_products)

    include_title = re.compile(
        r"(powder(?:ed)? .*glaze|powder glaze|liquid underglaze|underglaze pencil|powder(?:ed)? decorating slip|decorating slip|liquid on-glaze|powder on-glaze|lead(?:free|ed)? .*on-glaze|crystalline .*glaze|raku .*glaze)",
        re.I,
    )
    exclude_title = re.compile(
        r"(hydrometer|trailer|nozzle|sieve|mesh|tile|bisque|thinner|cleaner|medium|binder|resist|turpentine|sodium silicate|oxide|manganese|stain|raw material|extraction|kiln|cutter|gift|platter|money box|brush|powder pigment|resin|clay)",
        re.I,
    )
    glaze_tags = {
        "stoneware-powder-glaze",
        "earthenware-powder-glazes",
        "underglaze",
        "underglaze-brush-on",
        "underglaze-powder",
        "decorating-slip",
        "decorating-slips",
        "liquid-decorating-slips",
        "on-glaze",
        "on-glaze-powder",
        "raku-glazes",
        "raku-powder-glaze",
    }

    rows: list[dict[str, object | None]] = []
    seen: set[tuple[str | None, str]] = set()

    for product in products:
        title = str(product.get("title") or "")
        vendor = str(product.get("vendor") or "").lower()
        tags = set(product.get("tags") or [])
        own_brand = "potterycraft" in vendor or title.lower().startswith("potterycrafts ")
        is_glaze = bool(tags & glaze_tags) or bool(include_title.search(title))
        if not own_brand or not is_glaze or exclude_title.search(title):
            continue

        variants = product.get("variants") or []
        first_variant = variants[0] if variants and isinstance(variants[0], dict) else {}
        images = product.get("images") or []
        first_image = images[0] if images and isinstance(images[0], dict) else {}
        code = normalize_code(str(first_variant.get("sku") or "")) if first_variant else None
        name = re.sub(r"^Potterycrafts\s+", "", title).strip()
        line, cone = potterycrafts_line(product)
        key = (code, name)
        if key in seen:
            continue
        seen.add(key)

        rows.append(
            catalog_row(
                brand="Potterycrafts",
                line=line,
                code=code,
                name=name,
                cone=cone,
                description=clean_text(str(product.get("body_html") or "")),
                image_url=str(first_image.get("src") or "") or None,
                source_url=f"https://potterycrafts.co.uk/products/{product.get('handle')}",
            )
        )

    return rows


def build_scarva_rows() -> list[dict[str, object | None]]:
    rows: list[dict[str, object | None]] = []
    for entry in SCARVA_SEED:
        description = entry.get("description")
        if not description:
            line = entry["line"]
            firing = entry["cone"]
            description = f"Scarva Earthstone {line.lower()} color with manufacturer-listed firing range {firing}."
        rows.append(
            catalog_row(
                brand="Scarva",
                line=str(entry["line"]),
                code=str(entry["code"]),
                name=str(entry["name"]),
                cone=str(entry["cone"]),
                description=str(description),
                image_url=None,
                source_url=str(entry["url"]),
            )
        )
    return rows


def sql_literal(value: object | None) -> str:
    if value is None:
        return "null"
    return "'" + str(value).replace("'", "''") + "'"


def write_migration(rows: list[dict[str, object | None]]) -> None:
    columns = [
        "id",
        "source_type",
        "brand",
        "line",
        "code",
        "name",
        "cone",
        "description",
        "image_url",
        "finish_notes",
        "color_notes",
        "recipe_notes",
    ]
    values = []
    for row in rows:
        values.append("  (" + ", ".join(sql_literal(row[column]) for column in columns) + ")")

    sql = [
        "-- Generated by scripts/import_uk_supplier_catalogs.py on 2026-04-24.",
        "with deleted_firing as (",
        "  delete from public.glaze_firing_images",
        "  where glaze_id in (",
        "    select id from public.glazes",
        "    where brand in ('Bath Potters', 'Potterycrafts', 'Scarva') and created_by_user_id is null",
        "  )",
        "), deleted_glazes as (",
        "  delete from public.glazes",
        "  where brand in ('Bath Potters', 'Potterycrafts', 'Scarva') and created_by_user_id is null",
        ")",
        f"insert into public.glazes ({', '.join(columns)})",
        "values",
        ",\n".join(values) + ";",
        "",
    ]
    MIGRATION_PATH.write_text("\n".join(sql), encoding="utf-8")


def update_catalog(rows: list[dict[str, object | None]]) -> None:
    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    catalog = [
        row
        for row in catalog
        if row.get("brand") not in {"Bath Potters", "Potterycrafts", "Scarva"}
    ]
    catalog.extend(rows)
    CATALOG_PATH.write_text(json.dumps(catalog, indent=2) + "\n", encoding="utf-8")


def write_vendor_files(grouped: dict[str, list[dict[str, object | None]]]) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for brand, rows in grouped.items():
        filename = brand.lower().replace(" ", "-")
        entries = [vendor_entry(row) for row in rows]
        (OUTPUT_DIR / f"{filename}-glazes.json").write_text(json.dumps(entries, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    grouped = {
        "Bath Potters": scrape_bath_potters(),
        "Potterycrafts": scrape_potterycrafts(),
        "Scarva": build_scarva_rows(),
    }
    rows = [row for brand_rows in grouped.values() for row in brand_rows]

    write_vendor_files(grouped)
    write_migration(rows)
    update_catalog(rows)

    counts = {brand: len(brand_rows) for brand, brand_rows in grouped.items()}
    print(f"Imported {sum(counts.values())} UK supplier catalog rows at {datetime.now(timezone.utc).isoformat()}")
    for brand, count in counts.items():
        print(f"{brand}: {count}")


if __name__ == "__main__":
    main()
