from __future__ import annotations

import concurrent.futures
import html
import json
import re
from pathlib import Path
from typing import TypedDict
import requests


MAYCO_SWATCH_TABLE_URL = "https://www.maycocolors.com/color-swatches-csv-download/"
USER_AGENT = "GlazeLibraryCatalogBot/1.0 (+https://glaze-library.app)"
OUTPUT_JSON_PATH = Path("data/vendors/mayco-glazes.json")
OUTPUT_SQL_PATH = Path("supabase/migrations/20260401230000_refresh_mayco_catalog_with_images.sql")

ROW_PATTERN = re.compile(r"<tr>(.*?)</tr>", re.S)
CELL_PATTERN = re.compile(r"<td>(.*?)</td>", re.S)
SHORT_DESCRIPTION_PATTERN = re.compile(
    r'<div class="woocommerce-product-details__short-description">(.*?)</div>',
    re.S,
)


class RawCatalogEntry(TypedDict):
    line: str
    code: str
    name: str
    source_url: str
    image_url: str | None
    cones: set[str]


class CatalogEntry(TypedDict):
    brand: str
    line: str
    code: str
    name: str
    cone: str | None
    description: str | None
    imageUrl: str | None
    sourceUrl: str


EXCLUDED_LINES = {
    "Elements Starter Palette",
    "Stoneware Starter Palette",
    "White Speckled Clay",
}


def normalize_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def decode_html(value: str) -> str:
    value = html.unescape(value)
    value = value.replace("\u2122", "").replace("\u00ae", "").replace("\u00a9", "")
    return value


def strip_tags(value: str) -> str:
    return normalize_whitespace(decode_html(re.sub(r"<[^>]+>", " ", value)))


def normalize_line(value: str) -> str:
    return normalize_whitespace(strip_tags(value).replace(" & ", " & "))


def escape_sql(value: str) -> str:
    return value.replace("'", "''")


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def source_url_score(source_url: str, code: str, name: str) -> int:
    score = 0
    code_slug = slugify(code)
    name_slug = slugify(name)
    source_slug = source_url.rstrip("/").split("/")[-1].lower()

    if code_slug and code_slug in source_slug:
        score += 2

    if name_slug and name_slug in source_slug:
        score += 2

    return score


def fetch_text(url: str) -> str:
    response = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=20)
    response.raise_for_status()
    return response.text


def format_cone(cones: set[str]) -> str | None:
    if not cones:
        return None

    ordered = sorted({normalize_whitespace(strip_tags(cone)) for cone in cones if strip_tags(cone)})
    return " / ".join(ordered) if ordered else None


def build_raw_catalog() -> list[RawCatalogEntry]:
    swatch_html = fetch_text(MAYCO_SWATCH_TABLE_URL)
    table_start = swatch_html.find('<table id="color-swatches-csv"')
    table_end = swatch_html.find("</table>", table_start)

    if table_start == -1 or table_end == -1:
        raise RuntimeError("Could not find the Mayco swatch table.")

    table_html = swatch_html[table_start:table_end]
    raw_catalog: dict[str, RawCatalogEntry] = {}

    for row_html in ROW_PATTERN.findall(table_html):
        cells = [strip_tags(cell) for cell in CELL_PATTERN.findall(row_html)]

        if len(cells) != 8 or cells[0] == "ID":
            continue

        _, name, source_url, image_url, code, line, _line_id, cone = cells

        if not source_url or not code or not name or not line:
            continue

        if code in raw_catalog:
            if cone:
                raw_catalog[code]["cones"].add(cone)

            if source_url_score(source_url, code, name) > source_url_score(
                raw_catalog[code]["source_url"],
                raw_catalog[code]["code"],
                raw_catalog[code]["name"],
            ):
                raw_catalog[code]["source_url"] = source_url
                raw_catalog[code]["name"] = name
                raw_catalog[code]["line"] = line
                raw_catalog[code]["image_url"] = image_url or raw_catalog[code]["image_url"]

            continue

        raw_catalog[code] = {
            "line": line,
            "code": code,
            "name": name,
            "source_url": source_url,
            "image_url": image_url or None,
            "cones": {cone} if cone else set(),
        }

    return sorted(
        raw_catalog.values(),
        key=lambda item: f"{item['code']} {item['name']}".lower(),
    )


def is_current_fired_glaze(entry: RawCatalogEntry) -> bool:
    if entry["line"] in EXCLUDED_LINES:
        return False

    if "discontinued" in entry["name"].lower() or "discontinued" in entry["line"].lower():
        return False

    return any("Cone" in cone for cone in entry["cones"])


def fetch_description(source_url: str) -> str | None:
    candidates = [source_url]

    if "-ttic-" in source_url:
        candidates.append(source_url.replace("-ttic-", "-tic-"))

    for candidate_url in candidates:
        try:
            product_html = fetch_text(candidate_url)
        except requests.HTTPError as error:
            if error.response is not None and error.response.status_code == 404:
                continue
            return None
        except requests.RequestException:
            return None

        match = SHORT_DESCRIPTION_PATTERN.search(product_html)

        if not match:
            return None

        description = decode_html(
            match.group(1)
            .replace("<br />", "\n")
            .replace("<br/>", "\n")
            .replace("<br>", "\n")
            .replace("</p>", "\n")
        )
        description = normalize_whitespace(re.sub(r"<[^>]+>", " ", description))
        return description or None

    return None


def create_sql(entries: list[CatalogEntry]) -> str:
    value_rows: list[str] = []

    for entry in entries:
        cone = f"'{escape_sql(entry['cone'])}'" if entry["cone"] else "null"
        description = f"'{escape_sql(entry['description'])}'" if entry["description"] else "null"
        image_url = f"'{escape_sql(entry['imageUrl'])}'" if entry["imageUrl"] else "null"

        value_rows.append(
            "  ("
            "'commercial', "
            f"'{escape_sql(entry['brand'])}', "
            f"'{escape_sql(entry['line'])}', "
            f"'{escape_sql(entry['code'])}', "
            f"'{escape_sql(entry['name'])}', "
            f"{cone}, "
            f"{description}, "
            f"{image_url}"
            ")"
        )

    return "\n".join(
        [
            "-- Generated by scripts/scrape_mayco_catalog.py from maycocolors.com on 2026-04-01.",
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
            ",\n".join(value_rows),
            "on conflict (brand, code) where created_by_user_id is null and code is not null",
            "do update",
            "set",
            "  line = excluded.line,",
            "  name = excluded.name,",
            "  cone = excluded.cone,",
            "  description = excluded.description,",
            "  image_url = excluded.image_url;",
            "",
        ]
    )


def main() -> None:
    raw_catalog = [entry for entry in build_raw_catalog() if is_current_fired_glaze(entry)]
    descriptions: dict[str, str | None] = {}

    print(f"Fetching descriptions for {len(raw_catalog)} filtered Mayco glazes...", flush=True)

    with concurrent.futures.ThreadPoolExecutor(max_workers=16) as executor:
        future_map = {
            executor.submit(fetch_description, entry["source_url"]): entry["source_url"]
            for entry in raw_catalog
        }

        for index, future in enumerate(concurrent.futures.as_completed(future_map), start=1):
            source_url = future_map[future]
            descriptions[source_url] = future.result()

            if index % 50 == 0:
                print(f"Fetched descriptions for {index}/{len(raw_catalog)} glazes...", flush=True)

    catalog: list[CatalogEntry] = [
        {
            "brand": "Mayco",
            "line": entry["line"],
            "code": entry["code"],
            "name": entry["name"],
            "cone": format_cone(entry["cones"]),
            "description": descriptions.get(entry["source_url"]),
            "imageUrl": entry["image_url"],
            "sourceUrl": entry["source_url"],
        }
        for entry in raw_catalog
    ]

    OUTPUT_JSON_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_SQL_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_JSON_PATH.write_text(f"{json.dumps(catalog, indent=2)}\n", encoding="utf-8")
    OUTPUT_SQL_PATH.write_text(create_sql(catalog), encoding="utf-8")

    missing = [entry for entry in catalog if not entry["description"]]

    print(f"Saved {len(catalog)} Mayco glazes.", flush=True)
    print(f"JSON: {OUTPUT_JSON_PATH}", flush=True)
    print(f"SQL: {OUTPUT_SQL_PATH}", flush=True)

    if missing:
        print("Missing descriptions:", flush=True)
        for entry in missing:
            print(f"- {entry['code']} {entry['name']}: {entry['sourceUrl']}", flush=True)


if __name__ == "__main__":
    main()
