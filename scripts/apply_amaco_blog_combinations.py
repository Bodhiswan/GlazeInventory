from __future__ import annotations

import html
import json
import re
import sys
import uuid
from html.parser import HTMLParser
from pathlib import Path
from typing import Any
from urllib.parse import urljoin, urlparse

import requests


USER_AGENT = "GlazeLibraryCatalogBot/1.0 (+https://glazeinventory.com)"
CATALOG_PATH = Path("data/catalog/glazes.json")
EXAMPLES_PATH = Path("data/catalog/combination-examples.json")
SOURCE_COLLECTION = "blog-combinations"

SOURCE_URLS = [
    "https://amaco.com/resources/blog/try-something-new-magic-forest-glaze-combination",
    "https://amaco.com/resources/blog/embrace-spontaneity-with-crawls-glazes",
    "https://amaco.com/resources/blog/exploring-phase-glazes",
    "https://amaco.com/resources/blog/dip-into-color",
    "https://amaco.com/resources/blog/amaco-fall-layering-favorites",
    "https://amaco.com/resources/blog/dipping-and-layering-glazes-tips-and-tricks-for-success",
    "https://amaco.com/resources/blog/halloween-glaze-roundup",
    "https://amaco.com/resources/blog/hidden-gems-dipping-and-layering-glazes",
    "https://amaco.com/resources/blog/phase-glazes-hidden-gems",
    "https://amaco.com/resources/blog/new-potters-choice-glazes-for-2025",
    "https://amaco.com/resources/blog/getting-to-know-the-teachers-palette-glaze-family",
    "https://amaco.com/resources/blog/winter-glazes-of-2025",
    "https://amaco.com/resources/blog/favorite-winter-layering-combinations",
    "https://amaco.com/resources/blog/2025-glaze-roundup",
    "https://amaco.com/resources/blog/kick-off-2026-with-amaco-glazes",
    "https://amaco.com/resources/blog/great-glaze-combos-to-try-out-in-2026",
    "https://amaco.com/resources/blog/valentines-day-glazes",
    "https://amaco.com/resources/blog/new-cosmos-glazes-for-2026",
    "https://amaco.com/resources/blog/spring-glaze-combinations",
    "https://amaco.com/resources/tutorials/peacock-feather-effect-with-layering-pc-glazes",
]

CODE_PATTERN = re.compile(
    r"\b(?:PCF|PC|C|SM|SH|CR|DL|HF|TPL|TP|V|LUG|PG|CO|KI|O|LG|LM)-?\s?\d{1,3}[A-Z]?\b",
    re.IGNORECASE,
)


class TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.parts: list[str] = []

    def handle_data(self, data: str) -> None:
        self.parts.append(data)

    def text(self) -> str:
        return re.sub(r"\s+", " ", " ".join(self.parts)).strip()


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug[:90] or "amaco-combination"


def normalize_code(code: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", code.upper())


def code_lookup_keys(code: str) -> list[str]:
    normalized = normalize_code(code)
    match = re.match(r"^([A-Z]+)(\d+)([A-Z]?)$", normalized)
    if not match:
        return [normalized]

    prefix, number, suffix = match.groups()
    keys = [
        normalized,
        f"{prefix}{int(number)}{suffix}",
        f"{prefix}{int(number):02d}{suffix}",
    ]
    return list(dict.fromkeys(keys))


def extract_article(html_text: str) -> str:
    match = re.search(r"<article\b.*?</article>", html_text, re.IGNORECASE | re.DOTALL)
    article = match.group(0) if match else html_text
    article = re.split(r'<div class="related-posts"', article, maxsplit=1, flags=re.IGNORECASE)[0]
    return article


def extract_text(fragment: str) -> str:
    parser = TextExtractor()
    parser.feed(fragment)
    return html.unescape(parser.text())


def extract_title(html_text: str) -> str:
    match = re.search(r"<title[^>]*>(.*?)</title>", html_text, re.IGNORECASE | re.DOTALL)
    if not match:
        return "AMACO resource"
    title = extract_text(match.group(1))
    return title.split("|")[0].strip() or "AMACO resource"


def extract_img_url(figure_html: str, page_url: str) -> str | None:
    match = re.search(r"<img\b([^>]*)>", figure_html, re.IGNORECASE | re.DOTALL)
    if not match:
        return None
    attrs = match.group(1)
    for attr in ("data-src", "src"):
        attr_match = re.search(rf'{attr}=["\']([^"\']+)["\']', attrs, re.IGNORECASE)
        if attr_match:
            value = html.unescape(attr_match.group(1))
            if "themes/amaco/assets/images" in value:
                return None
            return urljoin(page_url, value)
    return None


def build_glaze_lookup() -> dict[str, dict[str, Any]]:
    lookup: dict[str, dict[str, Any]] = {}
    glazes = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    for glaze in glazes:
        if glaze.get("brand") != "AMACO" or not glaze.get("code"):
            continue
        entry = {
            "id": glaze["id"],
            "code": glaze["code"],
            "name": glaze["name"],
        }
        for key in code_lookup_keys(glaze["code"]):
            lookup[key] = entry
    return lookup


def find_code(value: str) -> str | None:
    match = CODE_PATTERN.search(value)
    return match.group(0) if match else None


def code_from_href(href: str) -> str | None:
    slug = urlparse(href).path.strip("/").split("/")[-1]
    return find_code(slug.replace("-", " "))


def extract_linked_glazes(fragment: str, lookup: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []
    seen: set[str] = set()
    for match in re.finditer(r"<a\b([^>]*)>(.*?)</a>", fragment, re.IGNORECASE | re.DOTALL):
      attrs, body = match.groups()
      href_match = re.search(r'href=["\']([^"\']+)["\']', attrs, re.IGNORECASE)
      href = html.unescape(href_match.group(1)) if href_match else ""
      label = extract_text(body)
      raw_code = code_from_href(href) or find_code(label)
      if not raw_code:
          continue
      glaze = next((lookup[key] for key in code_lookup_keys(raw_code) if key in lookup), None)
      if not glaze or glaze["id"] in seen:
          continue
      seen.add(glaze["id"])
      results.append(glaze)
    return results


def extract_coded_glazes(fragment: str, lookup: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []
    seen: set[str] = set()
    text = extract_text(fragment)
    for raw_code in CODE_PATTERN.findall(text):
        glaze = next((lookup[key] for key in code_lookup_keys(raw_code) if key in lookup), None)
        if not glaze or glaze["id"] in seen:
            continue
        seen.add(glaze["id"])
        results.append(glaze)
    return results


def title_from_segment(segment: str, fallback: str) -> str:
    strong_matches = re.findall(r"<strong[^>]*>(.*?)</strong>", segment, re.IGNORECASE | re.DOTALL)
    for raw in strong_matches[:3]:
        title = extract_text(raw)
        if usable_title(title):
            return title
    first_text = extract_text(segment).split(".")[0].strip()
    return first_text[:80] or fallback


def usable_title(title: str) -> bool:
    normalized = title.strip().lower()
    if not normalized:
        return False
    if len(title) > 55:
        return False
    if normalized.startswith(("if you want", "a combination", "for something")):
        return False
    if "conversion chart" in normalized:
        return False
    return True


def title_for_figure(before_segment: str, after_segment: str, fallback: str) -> str:
    before_titles = [
        extract_text(raw)
        for raw in re.findall(r"<strong[^>]*>(.*?)</strong>", before_segment, re.IGNORECASE | re.DOTALL)
    ]
    for title in reversed(before_titles):
        if usable_title(title):
            return title

    return title_from_segment(after_segment, fallback)


def connector_from_text(text: str) -> str:
    lowered = text.lower()
    if any(token in lowered for token in ("mixed", "mixing", "equal parts", "mixable")):
        return "with"
    if " under " in lowered and " over " not in lowered:
        return "under"
    return "over"


def layer_title(glazes: list[dict[str, Any]], connector: str) -> str:
    return f" {connector} ".join(f"{glaze['code']} {glaze['name']}" for glaze in glazes)


def cone_from_text(text: str) -> str | None:
    match = re.search(r"\bcone\s*0?\d+\b", text, re.IGNORECASE)
    if not match:
        return None
    return re.sub(r"\s+", " ", match.group(0)).title()


def clay_from_text(text: str) -> str | None:
    match = re.search(
        r"\b(?:A-?\s*Mix|White Stoneware|Buff Stoneware|Dark Stoneware|B-?Mix)[^.,;)]*",
        text,
        re.IGNORECASE,
    )
    if not match:
        return None
    return re.sub(r"\s+", " ", match.group(0)).strip()


def build_example(
    page_url: str,
    page_title: str,
    image_url: str,
    title: str,
    segment: str,
    glazes: list[dict[str, Any]],
) -> dict[str, Any]:
    text = extract_text(segment)
    connector = connector_from_text(text)
    title_code_count = len(CODE_PATTERN.findall(title))
    if not usable_title(title) or title_code_count < min(len(glazes), 2):
        title = layer_title(glazes, connector)
    source_key = f"{slugify(urlparse(page_url).path.rstrip('/').split('/')[-1])}-{slugify(title)}"
    example_id = str(uuid.uuid5(uuid.NAMESPACE_URL, f"{page_url}#{title}#{image_url}"))

    return {
        "id": example_id,
        "source_vendor": "AMACO",
        "source_collection": SOURCE_COLLECTION,
        "source_key": source_key,
        "source_url": page_url,
        "title": title,
        "image_url": image_url,
        "cone": cone_from_text(text),
        "atmosphere": None,
        "clay_body": clay_from_text(text),
        "application_notes": text or page_title,
        "firing_notes": cone_from_text(text),
        "layers": [
            {
                "id": str(uuid.uuid5(uuid.NAMESPACE_URL, f"{example_id}:layer:{index}:{glaze['id']}")),
                "glaze_id": glaze["id"],
                "glaze_code": glaze["code"],
                "glaze_name": glaze["name"],
                "layer_order": index,
                "connector_to_next": connector if index < len(glazes) - 1 else None,
                "source_image_url": None,
            }
            for index, glaze in enumerate(glazes)
        ],
    }


def extract_examples(page_url: str, html_text: str, lookup: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    page_title = extract_title(html_text)
    article = extract_article(html_text)
    figure_matches = list(re.finditer(r"<figure\b.*?</figure>", article, re.IGNORECASE | re.DOTALL))
    examples: list[dict[str, Any]] = []

    for index, match in enumerate(figure_matches):
        image_url = extract_img_url(match.group(0), page_url)
        if not image_url or "/asset/" not in image_url:
            continue

        previous_end = figure_matches[index - 1].end() if index > 0 else 0
        next_start = figure_matches[index + 1].start() if index + 1 < len(figure_matches) else len(article)
        before_segment = article[previous_end:match.start()]
        segment = article[match.end():next_start]
        glazes = extract_linked_glazes(segment, lookup)
        if len(glazes) < 2:
            glazes = extract_coded_glazes(segment, lookup)

        if len(glazes) < 2:
            continue
        if len(glazes) > 3:
            continue

        title = title_for_figure(before_segment, segment, page_title)
        if "conversion chart" in title.lower():
            continue
        examples.append(build_example(page_url, page_title, image_url, title, segment, glazes))

    return examples


def main() -> None:
    lookup = build_glaze_lookup()
    existing = json.loads(EXAMPLES_PATH.read_text(encoding="utf-8"))
    existing_kept = [
        row
        for row in existing
        if not (row.get("source_vendor") == "AMACO" and row.get("source_collection") == SOURCE_COLLECTION)
    ]
    existing_keys = {
        (row.get("source_vendor"), row.get("source_collection"), row.get("source_key"))
        for row in existing_kept
    }
    existing_images = {row.get("image_url") for row in existing_kept}

    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT})

    candidates: list[dict[str, Any]] = []
    for url in SOURCE_URLS:
        response = session.get(url, timeout=45)
        response.raise_for_status()
        page_examples = extract_examples(url, response.text, lookup)
        print(f"{url}: {len(page_examples)} candidate(s)")
        candidates.extend(page_examples)

    additions: list[dict[str, Any]] = []
    seen_keys = set(existing_keys)
    seen_images = set(existing_images)
    for example in candidates:
        key = (example["source_vendor"], example["source_collection"], example["source_key"])
        if key in seen_keys or example["image_url"] in seen_images:
            continue
        seen_keys.add(key)
        seen_images.add(example["image_url"])
        additions.append(example)

    removed = len(existing) - len(existing_kept)
    if additions or removed:
        EXAMPLES_PATH.write_text(
            json.dumps(existing_kept + additions, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )

    print(f"Replaced {removed} existing AMACO blog combination example(s).")
    print(f"Added {len(additions)} AMACO blog combination example(s).")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Failed to apply AMACO blog combinations: {exc}", file=sys.stderr)
        raise
