from __future__ import annotations

import html
import json
import re
import sys
import uuid
from pathlib import Path
from typing import Any
from urllib.parse import unquote, urljoin

import requests


USER_AGENT = "GlazeLibraryCatalogBot/1.0 (+https://glazeinventory.com)"
CATALOG_PATH = Path("data/catalog/glazes.json")
EXAMPLES_PATH = Path("data/catalog/combination-examples.json")
SOURCE_VENDOR = "Coyote"

SHINO_URL = "https://www.coyoteclay.com/ShinoOverlap.html"
TWO_STEP_URL = "https://www.coyoteclay.com/TwoStep.html"

SHINO_IMAGE_NAMES = {
    "blueshinooverblackshadow.jpg": "Blue Shino",
    "butterscotchshinooverblackshadow.jpg": "Butterscotch Shino",
    "cedarshinooverblackshadow.jpg": "Cedar Shino",
    "desertsageoverblackshadow.jpg": "Desert Sage",
    "espressooverblackshadow.jpg": "Espresso Bean",
    "goldenrodshinooverblackshadow.jpg": "Goldenrod Shino",
    "greenshinooverblackshadow.jpg": "Green Shino",
    "leopardshinooverblackshadow.jpg": "Leopard Shino",
    "lbshinooverblackshadow.jpg": "Light Blue Shino",
    "lgshinooverblackshadow.jpg": "Light Green Shino",
    "lightshinooverblackshadow.jpg": "Light Shino",
    "mochashinooverblack.jpg": "Mocha Shino",
    "pistachioshinooverblackshadow.jpg": "Pistachio Shino",
    "plumshinooverblackshadow.jpg": "Plum Shino",
    "sandstoneshinooverblackshadow.jpg": "Sandstone Shino",
    "shinooverblackshadow.jpg": "Shino",
    "steelgrayshinooverblackshadow.jpg": "Steel Gray Shino",
    "sunriseshinooverblackshadow.jpg": "Sunrise Shino",
}

TWO_STEP_TOP_ALIASES = {
    "blue moon": "Blue Moon",
    "birch": "Birch",
    "rose": "Texas Rose",
    "texas rose": "Texas Rose",
    "marshmallow": "Marshmallow",
    "sea mist": "Sea Mist",
}

TWO_STEP_BASE_ALIASES = {
    "licorice": "Licorice",
    "coffee": "Coffee Bean",
    "coffee bean": "Coffee Bean",
    "brick": "Brick Red",
    "brick red": "Brick Red",
}


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug[:90] or "coyote-combination"


def normalize_name(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


def image_urls(page_url: str, html_text: str) -> list[str]:
    urls: list[str] = []
    for match in re.finditer(r"<img\b[^>]*(?:src|data-src)=[\"']([^\"']+)[\"']", html_text, re.IGNORECASE):
        src = html.unescape(match.group(1))
        urls.append(urljoin(page_url, src))
    return urls


def build_glaze_lookup() -> dict[str, dict[str, Any]]:
    glazes = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    lookup: dict[str, dict[str, Any]] = {}
    for glaze in glazes:
        if glaze.get("brand") != SOURCE_VENDOR:
            continue
        lookup.setdefault(normalize_name(glaze["name"]), glaze)
    return lookup


def find_glaze(lookup: dict[str, dict[str, Any]], name: str) -> dict[str, Any]:
    glaze = lookup.get(normalize_name(name))
    if not glaze:
        raise ValueError(f"Could not find Coyote glaze named {name!r}")
    return glaze


def make_layer(example_id: str, index: int, glaze: dict[str, Any], connector: str | None) -> dict[str, Any]:
    return {
        "id": str(uuid.uuid5(uuid.NAMESPACE_URL, f"{example_id}:layer:{index}:{glaze['id']}")),
        "glaze_id": glaze["id"],
        "glaze_code": glaze.get("code"),
        "glaze_name": glaze["name"],
        "layer_order": index,
        "connector_to_next": connector,
        "source_image_url": None,
    }


def make_example(
    *,
    collection: str,
    source_url: str,
    image_url: str,
    top: dict[str, Any],
    base: dict[str, Any],
    application_notes: str,
    firing_notes: str,
    clay_body: str | None = None,
) -> dict[str, Any]:
    title = f"{top['name']} over {base['name']}"
    source_key = f"{slugify(collection)}-{slugify(title)}"
    example_id = str(uuid.uuid5(uuid.NAMESPACE_URL, f"{source_url}#{title}#{image_url}"))

    return {
        "id": example_id,
        "source_vendor": SOURCE_VENDOR,
        "source_collection": collection,
        "source_key": source_key,
        "source_url": source_url,
        "title": title,
        "image_url": image_url,
        "cone": "Cone 6",
        "atmosphere": "Electric",
        "clay_body": clay_body,
        "application_notes": application_notes,
        "firing_notes": firing_notes,
        "layers": [
            make_layer(example_id, 0, top, "over"),
            make_layer(example_id, 1, base, None),
        ],
    }


def extract_shino_examples(html_text: str, lookup: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    black = find_glaze(lookup, "Black")
    examples: list[dict[str, Any]] = []

    for url in image_urls(SHINO_URL, html_text):
        filename = unquote(url.rsplit("/", 1)[-1]).lower()
        top_name = SHINO_IMAGE_NAMES.get(filename)
        if not top_name:
            continue
        top = find_glaze(lookup, top_name)
        examples.append(
            make_example(
                collection="shino-over-black",
                source_url=SHINO_URL,
                image_url=url,
                top=top,
                base=black,
                clay_body="Speckled buff clay",
                application_notes=(
                    "Official Coyote Shino overlap result. Coyote describes these as Shino glazes "
                    "layered over Gloss Black; brushing guidance is 3 coats of Black, then 2 to 3 coats "
                    "of the Shino color."
                ),
                firing_notes=(
                    "Official Coyote page says the sample cups were fired between witness cone 5 and cone 6 "
                    "in an electric kiln."
                ),
            )
        )

    return examples


def two_step_names_from_filename(url: str) -> tuple[str, str] | None:
    filename = unquote(url.rsplit("/", 1)[-1])
    match = re.match(r"TT(.+?)\s+over\s+(.+?)(?:\s+RC)?\.jpg$", filename, re.IGNORECASE)
    if not match:
        return None

    top_alias = normalize_name(match.group(1))
    base_alias = normalize_name(match.group(2))
    top_name = TWO_STEP_TOP_ALIASES.get(top_alias)
    base_name = TWO_STEP_BASE_ALIASES.get(base_alias)
    if not top_name or not base_name:
        return None
    return top_name, base_name


def extract_two_step_examples(html_text: str, lookup: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    examples: list[dict[str, Any]] = []

    for url in image_urls(TWO_STEP_URL, html_text):
        names = two_step_names_from_filename(url)
        if not names:
            continue
        top_name, base_name = names
        top = find_glaze(lookup, top_name)
        base = find_glaze(lookup, base_name)
        examples.append(
            make_example(
                collection="texas-two-step",
                source_url=TWO_STEP_URL,
                image_url=url,
                top=top,
                base=base,
                application_notes=(
                    "Official Coyote Texas Two-Step result. Coyote describes the system as a Step One "
                    "undercoat covered by a Step Two overcoat, with thicker applications producing larger spots."
                ),
                firing_notes="Official Coyote page says these oilspot combinations fire to cone 6 in an electric kiln.",
            )
        )

    return examples


def main() -> None:
    lookup = build_glaze_lookup()
    existing = json.loads(EXAMPLES_PATH.read_text(encoding="utf-8"))
    collections = {"shino-over-black", "texas-two-step"}
    kept = [
        row
        for row in existing
        if not (row.get("source_vendor") == SOURCE_VENDOR and row.get("source_collection") in collections)
    ]

    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT})

    shino_response = session.get(SHINO_URL, timeout=45)
    shino_response.raise_for_status()
    two_step_response = session.get(TWO_STEP_URL, timeout=45)
    two_step_response.raise_for_status()

    candidates = extract_shino_examples(shino_response.text, lookup)
    candidates.extend(extract_two_step_examples(two_step_response.text, lookup))

    seen_keys = {
        (row.get("source_vendor"), row.get("source_collection"), row.get("source_key"))
        for row in kept
    }
    seen_images = {row.get("image_url") for row in kept}
    additions: list[dict[str, Any]] = []
    for example in candidates:
        key = (example["source_vendor"], example["source_collection"], example["source_key"])
        if key in seen_keys or example["image_url"] in seen_images:
            continue
        seen_keys.add(key)
        seen_images.add(example["image_url"])
        additions.append(example)

    removed = len(existing) - len(kept)
    if additions or removed:
        EXAMPLES_PATH.write_text(
            json.dumps(kept + additions, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )

    print(f"Replaced {removed} existing Coyote combination example(s).")
    print(f"Added {len(additions)} Coyote combination example(s).")
    print(f"Shino over Black: {sum(1 for row in additions if row['source_collection'] == 'shino-over-black')}")
    print(f"Texas Two-Step: {sum(1 for row in additions if row['source_collection'] == 'texas-two-step')}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Failed to apply Coyote combinations: {exc}", file=sys.stderr)
        raise
