from __future__ import annotations

import html
import json
import re
from pathlib import Path
from typing import TypedDict

import requests


MAYCO_SWATCH_TABLE_URL = "https://www.maycocolors.com/color-swatches-csv-download/"
USER_AGENT = "GlazeLibraryCatalogBot/1.0 (+https://glaze-library.app)"
CATALOG_JSON_PATH = Path("data/vendors/mayco-glazes.json")
COMBINATIONS_JSON_PATH = Path("data/vendors/mayco-combinations.json")
OUTPUT_JSON_PATH = Path("data/vendors/mayco-firing-images.json")
OUTPUT_SQL_PATH = Path("supabase/migrations/20260402014500_import_mayco_firing_images.sql")

ROW_PATTERN = re.compile(r"<tr>(.*?)</tr>", re.S)
CELL_PATTERN = re.compile(r"<td>(.*?)</td>", re.S)


class FiringImageEntry(TypedDict):
    code: str
    label: str
    cone: str | None
    atmosphere: str | None
    imageUrl: str
    sortOrder: int


def normalize_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def strip_tags(value: str) -> str:
    return normalize_whitespace(html.unescape(re.sub(r"<[^>]+>", " ", value)))


def escape_sql(value: str) -> str:
    return value.replace("'", "''")


def normalize_code(value: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", normalize_whitespace(value).upper())


def fetch_text(url: str) -> str:
    response = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=30)
    response.raise_for_status()
    return response.text


def load_catalog_codes() -> set[str]:
    if not CATALOG_JSON_PATH.exists():
        return set()

    catalog = json.loads(CATALOG_JSON_PATH.read_text(encoding="utf-8"))
    return {
        normalize_code(str(entry.get("code", "")))
        for entry in catalog
        if entry.get("code")
    }


def get_sort_order(cone_label: str) -> int:
    if cone_label == "Cone 6":
        return 20
    if cone_label == "Cone 10":
        return 30
    return 10


def backfill_entries_from_combinations(
    entries_by_key: dict[tuple[str, str], FiringImageEntry],
    catalog_codes: set[str],
) -> None:
    if not COMBINATIONS_JSON_PATH.exists():
        return

    combinations = json.loads(COMBINATIONS_JSON_PATH.read_text(encoding="utf-8"))

    for combination in combinations:
        cone_label = normalize_whitespace(str(combination.get("cone") or ""))
        atmosphere = combination.get("atmosphere")

        if not cone_label:
            continue

        for layer in combination.get("layers", []):
            code = normalize_code(str(layer.get("glazeCode") or ""))
            image_url = normalize_whitespace(str(layer.get("sourceImageUrl") or ""))

            if not code or not image_url:
                continue

            if catalog_codes and code not in catalog_codes:
                continue

            key = (code, cone_label)

            if key in entries_by_key:
                continue

            entries_by_key[key] = {
                "code": code,
                "label": cone_label,
                "cone": cone_label,
                "atmosphere": normalize_whitespace(str(atmosphere)) or None,
                "imageUrl": image_url,
                "sortOrder": get_sort_order(cone_label),
            }


def build_entries() -> list[FiringImageEntry]:
    page = fetch_text(MAYCO_SWATCH_TABLE_URL)
    catalog_codes = load_catalog_codes()
    entries_by_key: dict[tuple[str, str], FiringImageEntry] = {}

    for row_html in ROW_PATTERN.findall(page):
        cells = [strip_tags(cell) for cell in CELL_PATTERN.findall(row_html)]

        if len(cells) != 8 or cells[0] == "ID":
            continue

        _, _name, _source_url, image_url, code, _line, _line_id, cone = cells

        if not code or not image_url or not cone:
            continue

        normalized_code = normalize_code(code)

        if catalog_codes and normalized_code not in catalog_codes:
            continue

        cone_label = normalize_whitespace(cone)

        key = (normalized_code, cone_label)
        entries_by_key[key] = {
            "code": normalized_code,
            "label": cone_label,
            "cone": cone_label,
            "atmosphere": None,
            "imageUrl": image_url,
            "sortOrder": get_sort_order(cone_label),
        }

    backfill_entries_from_combinations(entries_by_key, catalog_codes)

    return sorted(entries_by_key.values(), key=lambda entry: (entry["code"], entry["sortOrder"], entry["label"]))


def create_sql(entries: list[FiringImageEntry]) -> str:
    value_rows: list[str] = []

    for entry in entries:
        cone = f"'{escape_sql(entry['cone'])}'" if entry["cone"] else "null"
        atmosphere = f"'{escape_sql(entry['atmosphere'])}'" if entry["atmosphere"] else "null"

        value_rows.append(
            "  ("
            " (select id from public.glazes"
            " where brand = 'Mayco'"
            " and created_by_user_id is null"
            " and regexp_replace(upper(coalesce(code, '')), '[^A-Z0-9]', '', 'g') = "
            f"'{escape_sql(entry['code'])}'"
            " limit 1), "
            f"'{escape_sql(entry['label'])}', "
            f"{cone}, "
            f"{atmosphere}, "
            f"'{escape_sql(entry['imageUrl'])}', "
            f"{entry['sortOrder']}"
            ")"
        )

    return "\n".join(
        [
            "-- Generated by scripts/scrape_mayco_firing_images.py from maycocolors.com on 2026-04-02.",
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
            ",\n".join(value_rows),
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


def main() -> None:
    entries = build_entries()
    OUTPUT_JSON_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_SQL_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_JSON_PATH.write_text(f"{json.dumps(entries, indent=2)}\n", encoding="utf-8")
    OUTPUT_SQL_PATH.write_text(create_sql(entries), encoding="utf-8")
    print(f"Saved {len(entries)} Mayco firing images.", flush=True)
    print(f"JSON: {OUTPUT_JSON_PATH}", flush=True)
    print(f"SQL: {OUTPUT_SQL_PATH}", flush=True)


if __name__ == "__main__":
    main()
