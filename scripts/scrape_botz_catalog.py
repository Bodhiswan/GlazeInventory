from __future__ import annotations

import html
import json
import re
from pathlib import Path
from typing import TypedDict
from urllib.parse import urlparse, unquote

import requests


COLLECTION_URL = "https://www.ceramixaustralia.com.au/collections/botz/products.json?limit=250"
USER_AGENT = "GlazeInventoryCatalogBot/1.0 (+https://glazeinventory.com)"
HEADERS = {"User-Agent": USER_AGENT}

OUTPUT_DIR = Path("data/vendors")
CATALOG_OUTPUT_PATH = OUTPUT_DIR / "botz-glazes.json"
FIRING_OUTPUT_PATH = OUTPUT_DIR / "botz-firing-images.json"
SQL_OUTPUT_PATH = OUTPUT_DIR / "botz-import.sql"


class CatalogEntry(TypedDict):
    brand: str
    line: str
    code: str
    name: str
    cone: str | None
    description: str | None
    imageUrl: str | None
    sourceUrl: str


class FiringImageEntry(TypedDict):
    brand: str
    code: str
    label: str
    cone: str | None
    atmosphere: str | None
    imageUrl: str
    sortOrder: int


LINE_BY_TAG = {
    "BOTZ Unidekor": "Unidekor",
    "BOTZ PRO": "PRO",
    "Botz Earthenware": "Earthenware",
    "Botz Stoneware": "Stoneware",
    "Engobes": "Engobes",
}

GENERIC_LINE_CONES = {
    "Unidekor": "Cone 06 / Cone 6",
    "Earthenware": "Cone 06",
    "Stoneware": "Cone 6 / Cone 9",
    "Engobes": "Cone 4 / Cone 9",
    "PRO": "Cone 05 / Cone 04 / Cone 8 / Cone 9",
}

SKIP_IMAGE_MARKERS = ("lb_", "setcard", "label", "bottle")


def fetch_collection() -> list[dict[str, object]]:
    response = requests.get(COLLECTION_URL, headers=HEADERS, timeout=30)
    response.raise_for_status()
    payload = response.json()
    products = payload.get("products")

    if not isinstance(products, list):
        raise RuntimeError("BOTZ collection did not return a products list.")

    return products


def normalize_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def html_to_text(value: str) -> str:
    text = re.sub(r"<br\s*/?>", "\n", value, flags=re.I)
    text = re.sub(r"</p\s*>", "\n\n", text, flags=re.I)
    text = re.sub(r"</li\s*>", "\n", text, flags=re.I)
    text = re.sub(r"<li[^>]*>", "• ", text, flags=re.I)
    text = re.sub(r"<[^>]+>", "", text)
    text = html.unescape(text)
    lines = [normalize_whitespace(line) for line in text.splitlines()]
    return "\n".join(line for line in lines if line)


def collapse_text(value: str) -> str:
    return normalize_whitespace(" ".join(part.strip() for part in value.splitlines() if part.strip()))


def split_title(title: str) -> tuple[str, str]:
    cleaned = normalize_whitespace(title)
    match = re.match(r"^(?P<code>\d{4,5}[A-Z]?)\s+(?P<name>.+?)\s+-\s+BOTZ(?:\s+PRO)?(?:\s+\*Special Effects)?$", cleaned)

    if not match:
        raise RuntimeError(f"Could not split BOTZ title: {title}")

    name = re.sub(r"\s+\((Underglaze|Earthenware|Stoneware)\)$", "", match.group("name")).strip()
    return match.group("code"), name


def infer_line(product: dict[str, object]) -> str:
    tags = product.get("tags") or []

    if isinstance(tags, list):
      for tag in tags:
        if isinstance(tag, str) and tag in LINE_BY_TAG:
            return LINE_BY_TAG[tag]

    product_type = normalize_whitespace(str(product.get("product_type") or ""))
    if product_type == "Ceramic Ink":
        return "Ceramic Ink"

    return "BOTZ"


def infer_cone(line: str, body_text: str) -> str | None:
    normalized = body_text.replace("–", "-").replace("—", "-")

    if line == "PRO":
        if re.search(r"cone\s*05-04.*?cone\s*8-9", normalized, re.I):
            return "Cone 05 / Cone 04 / Cone 8 / Cone 9"

    if line == "Engobes":
        if re.search(r"cone\s*4-9", normalized, re.I):
            return "Cone 4 / Cone 9"

    if line == "Unidekor":
        if re.search(r"cone\s*06-6", normalized, re.I):
            return "Cone 06 / Cone 6"

    return GENERIC_LINE_CONES.get(line)


def summarise_description(line: str, body_html: str) -> str | None:
    paragraphs = [
        collapse_text(html_to_text(match.group(1)))
        for match in re.finditer(r"<p[^>]*>(.*?)</p>", body_html, re.S | re.I)
    ]
    bullets = [
        collapse_text(html_to_text(match.group(1)))
        for match in re.finditer(r"<li[^>]*>(.*?)</li>", body_html, re.S | re.I)
    ]

    filtered_paragraphs = [
        paragraph
        for paragraph in paragraphs
        if paragraph
        and not paragraph.upper() in {"NOTES/APPLICATION", "PROPERTIES", "PRODUCT IMAGES", "FEATURES", "HIGHLIGHTS"}
        and not paragraph.lower().startswith("view the entire")
        and not paragraph.lower().startswith("display the effects at different firing temperatures")
        and not re.fullmatch(r"botz(?:\s+\w+)*\s+(glazes|engobes|ceramic colours)", paragraph, re.I)
    ]
    filtered_bullets = [
        bullet
        for bullet in bullets
        if bullet
        and not bullet.lower().startswith("square =")
        and not bullet.lower().startswith("circle =")
        and not bullet.lower().startswith("triangle =")
        and not bullet.lower().startswith("low fire =")
        and not bullet.lower().startswith("high fire =")
    ]

    summary_parts: list[str] = []

    if filtered_paragraphs:
        summary_parts.append(filtered_paragraphs[0])

    if len(filtered_paragraphs) > 1 and line in {"Unidekor", "PRO"}:
        summary_parts.append(filtered_paragraphs[1])

    if filtered_bullets:
        bullet_summary = "; ".join(filtered_bullets[:3])
        summary_parts.append(bullet_summary)

    summary = " ".join(part.strip() for part in summary_parts if part.strip()).strip()

    if not summary:
        defaults = {
            "Unidekor": "BOTZ Unidekor underglaze colour for decorating bisque, glaze surfaces, or in-glaze designs.",
            "Earthenware": "Liquid low-fire BOTZ earthenware glaze for brush-on application with reliable surface results.",
            "Stoneware": "Liquid BOTZ stoneware glaze for brush-on application across the line's stoneware firing range.",
            "Engobes": "Liquid BOTZ stoneware engobe with a soft matte surface that can also be glazed over for brighter glossy colour.",
            "PRO": "Variable-temperature BOTZ PRO glaze designed to develop different effects across low-fire and higher stoneware firings.",
            "Ceramic Ink": "Highly pigmented BOTZ ceramic ink for highlighting fired surfaces and crackle effects.",
        }
        return defaults.get(line)

    if not summary.endswith((".", "!", "?")):
        summary += "."

    return summary


def normalize_image_src(value: str) -> str:
    return value.strip()


def get_product_images(product: dict[str, object]) -> list[str]:
    images = product.get("images") or []

    if not isinstance(images, list):
        return []

    urls: list[str] = []

    for image in images:
        if not isinstance(image, dict):
            continue
        src = image.get("src")
        if isinstance(src, str) and src.strip():
            urls.append(normalize_image_src(src))

    return urls


def is_reference_image(url: str) -> bool:
    filename = unquote(urlparse(url).path.split("/")[-1]).lower()
    return not any(marker in filename for marker in SKIP_IMAGE_MARKERS)


def pick_primary_image(urls: list[str]) -> str | None:
    reference_urls = [url for url in urls if is_reference_image(url)]
    if reference_urls:
        return reference_urls[0]
    return urls[0] if urls else None


def derive_firing_label(url: str, index: int) -> tuple[str, int]:
    filename = unquote(urlparse(url).path.split("/")[-1]).lower()
    temperature = re.search(r"(?<!\d)(1050|1150|1250)(?!\d)", filename)

    if temperature:
        temp = temperature.group(1)
        return f"{temp}°C sample", int(temp)

    if "reaction-line" in filename:
        return "Reaction line example", 150

    if index == 0:
        return "Reference tile", 50

    return f"Example {index + 1}", 200 + index * 10


def dedupe_firing_images(entries: list[FiringImageEntry]) -> list[FiringImageEntry]:
    seen: set[tuple[str, str, str, str]] = set()
    output: list[FiringImageEntry] = []

    for entry in entries:
        key = (entry["brand"], entry["code"], entry["label"], entry["imageUrl"])
        if key in seen:
            continue
        seen.add(key)
        output.append(entry)

    return output


def uniquify_firing_labels(entries: list[FiringImageEntry]) -> list[FiringImageEntry]:
    per_glaze_counts: dict[tuple[str, str], int] = {}
    output: list[FiringImageEntry] = []

    for entry in entries:
        key = (entry["code"], entry["label"])
        duplicate_count = per_glaze_counts.get(key, 0)
        per_glaze_counts[key] = duplicate_count + 1

        if duplicate_count == 0:
            output.append(entry)
            continue

        output.append(
            {
                **entry,
                "label": f"{entry['label']} (variation {duplicate_count + 1})",
                "sortOrder": entry["sortOrder"] + duplicate_count,
            }
        )

    return output


def escape_sql(value: str) -> str:
    return value.replace("'", "''")


def create_import_sql(glazes: list[CatalogEntry], firing_images: list[FiringImageEntry]) -> str:
    glaze_values = []

    for entry in glazes:
        glaze_values.append(
            "  ("
            "'commercial', "
            f"'{escape_sql(entry['brand'])}', "
            f"'{escape_sql(entry['line'])}', "
            f"'{escape_sql(entry['code'])}', "
            f"'{escape_sql(entry['name'])}', "
            + (f"'{escape_sql(entry['cone'])}'" if entry["cone"] else "null")
            + ", "
            + (f"'{escape_sql(entry['description'])}'" if entry["description"] else "null")
            + ", "
            + (f"'{escape_sql(entry['imageUrl'])}'" if entry["imageUrl"] else "null")
            + ")"
        )

    firing_values = []

    for entry in firing_images:
        firing_values.append(
            "  ("
            " (select id from public.glazes"
            f" where brand = '{escape_sql(entry['brand'])}'"
            " and created_by_user_id is null"
            f" and code = '{escape_sql(entry['code'])}'"
            " limit 1), "
            f"'{escape_sql(entry['label'])}', "
            + (f"'{escape_sql(entry['cone'])}'" if entry["cone"] else "null")
            + ", "
            + (f"'{escape_sql(entry['atmosphere'])}'" if entry["atmosphere"] else "null")
            + ", "
            + f"'{escape_sql(entry['imageUrl'])}', "
            + f"{entry['sortOrder']}"
            + ")"
        )

    return "\n".join(
        [
            "-- Generated by scripts/scrape_botz_catalog.py from Ceramix Australia's BOTZ collection.",
            "insert into public.glazes (",
            "  source_type,",
            "  brand,",
            "  line,",
            "  code,",
            "  name,",
            "  cone,",
            "  description,",
            "  image_url",
            ")",
            "values",
            ",\n".join(glaze_values),
            "on conflict (brand, code) where created_by_user_id is null and code is not null",
            "do update",
            "set",
            "  line = excluded.line,",
            "  name = excluded.name,",
            "  cone = excluded.cone,",
            "  description = excluded.description,",
            "  image_url = excluded.image_url;",
            "",
            "delete from public.glaze_firing_images",
            "where glaze_id in (",
            "  select id",
            "  from public.glazes",
            "  where brand = 'BOTZ'",
            "    and created_by_user_id is null",
            ");",
            "",
            "insert into public.glaze_firing_images (",
            "  glaze_id,",
            "  label,",
            "  cone,",
            "  atmosphere,",
            "  image_url,",
            "  sort_order",
            ")",
            "select * from (",
            "values",
            ",\n".join(firing_values),
            ") as source (",
            "  glaze_id,",
            "  label,",
            "  cone,",
            "  atmosphere,",
            "  image_url,",
            "  sort_order",
            ")",
            "where glaze_id is not null",
            "on conflict (glaze_id, label)",
            "do update",
            "set",
            "  cone = excluded.cone,",
            "  atmosphere = excluded.atmosphere,",
            "  image_url = excluded.image_url,",
            "  sort_order = excluded.sort_order;",
            "",
        ]
    )


def build_catalog(products: list[dict[str, object]]) -> tuple[list[CatalogEntry], list[FiringImageEntry]]:
    catalog: list[CatalogEntry] = []
    firing_images: list[FiringImageEntry] = []

    for product in products:
        title = str(product.get("title") or "").strip()
        handle = str(product.get("handle") or "").strip()
        if not title or not handle:
            continue

        code, name = split_title(title)
        line = infer_line(product)
        body_html = str(product.get("body_html") or "")
        body_text = html_to_text(body_html)
        cone = infer_cone(line, body_text)
        description = summarise_description(line, body_html)
        images = get_product_images(product)
        primary_image = pick_primary_image(images)
        source_url = f"https://www.ceramixaustralia.com.au/products/{handle}"

        catalog.append(
            {
                "brand": "BOTZ",
                "line": line,
                "code": code,
                "name": name,
                "cone": cone,
                "description": description,
                "imageUrl": primary_image,
                "sourceUrl": source_url,
            }
        )

        reference_urls = [url for url in images if is_reference_image(url)]

        for index, image_url in enumerate(reference_urls):
            label, sort_order = derive_firing_label(image_url, index)
            firing_images.append(
                {
                    "brand": "BOTZ",
                    "code": code,
                    "label": label,
                    "cone": cone,
                    "atmosphere": None,
                    "imageUrl": image_url,
                    "sortOrder": sort_order,
                }
            )

    catalog.sort(key=lambda item: (item["line"], item["code"]))
    deduped_images = dedupe_firing_images(firing_images)
    return catalog, uniquify_firing_labels(deduped_images)


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    products = fetch_collection()
    catalog, firing_images = build_catalog(products)

    CATALOG_OUTPUT_PATH.write_text(f"{json.dumps(catalog, indent=2)}\n", encoding="utf-8")
    FIRING_OUTPUT_PATH.write_text(f"{json.dumps(firing_images, indent=2)}\n", encoding="utf-8")
    SQL_OUTPUT_PATH.write_text(create_import_sql(catalog, firing_images), encoding="utf-8")

    print(f"BOTZ catalog entries: {len(catalog)}", flush=True)
    print(f"BOTZ firing images: {len(firing_images)}", flush=True)
    print(f"Wrote {CATALOG_OUTPUT_PATH}", flush=True)
    print(f"Wrote {FIRING_OUTPUT_PATH}", flush=True)
    print(f"Wrote {SQL_OUTPUT_PATH}", flush=True)


if __name__ == "__main__":
    main()
