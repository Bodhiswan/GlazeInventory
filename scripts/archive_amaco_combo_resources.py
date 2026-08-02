from __future__ import annotations

import hashlib
import html
import json
import re
import sys
from html.parser import HTMLParser
from io import BytesIO
from pathlib import Path
from typing import Any
from urllib.parse import urljoin, urlparse

import requests
from PIL import Image


USER_AGENT = "GlazeLibraryCatalogBot/1.0 (+https://glazeinventory.com)"
ARCHIVE_ROOT = Path("data/external-combination-archive")
COLLECTION_ID = "amaco-blog"
CATALOG_PATH = Path("data/catalog/glazes.json")
MANIFEST_PATH = ARCHIVE_ROOT / "manifest.json"

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
    r"\b(?:PCF|PC|C|SM|SH|CR|DL|HF|TPL|TP|V|LUG|PG)-?\s?\d{1,3}[A-Z]?\b",
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


class ImageExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.urls: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() != "img":
            return
        attr = {key.lower(): value for key, value in attrs if value}
        for key in ("data-src", "src"):
            value = attr.get(key)
            if value and "/asset/" in value:
                self.urls.append(html.unescape(value))
                break


def slug_from_url(url: str) -> str:
    return urlparse(url).path.rstrip("/").split("/")[-1]


def source_type_for_url(url: str) -> str:
    if "/resources/tutorials/" in url:
        return "amaco-tutorial"
    return "amaco-blog-post"


def source_name_for_url(url: str) -> str:
    if "/resources/tutorials/" in url:
        return "AMACO Tutorial"
    return "AMACO Blog"


def normalize_code(code: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", code.upper())


def code_lookup_keys(code: str) -> list[str]:
    normalized = normalize_code(code)
    match = re.match(r"^([A-Z]+)(\d+)([A-Z]?)$", normalized)
    if not match:
        return [normalized]

    prefix, number, suffix = match.groups()
    stripped = f"{prefix}{int(number)}{suffix}"
    padded = f"{prefix}{int(number):02d}{suffix}"
    keys = [normalized, stripped, padded]
    return list(dict.fromkeys(keys))


def canonical_code(code: str) -> str:
    normalized = normalize_code(code)
    match = re.match(r"^([A-Z]+)(\d+[A-Z]?)$", normalized)
    if not match:
        return code.upper().replace(" ", "")
    prefix, number = match.groups()
    return f"{prefix}-{number}"


def extract_article(html_text: str) -> str:
    match = re.search(r"<article\b.*?</article>", html_text, re.IGNORECASE | re.DOTALL)
    article = match.group(0) if match else html_text
    return re.split(r'<div class="related-posts"', article, maxsplit=1, flags=re.IGNORECASE)[0]


def extract_title(html_text: str) -> str:
    match = re.search(r"<title[^>]*>(.*?)</title>", html_text, re.IGNORECASE | re.DOTALL)
    if not match:
        return "Untitled"
    return html.unescape(re.sub(r"\s+", " ", match.group(1)).split("|")[0].strip())


def extract_text(fragment: str) -> str:
    parser = TextExtractor()
    parser.feed(fragment)
    return html.unescape(parser.text())


def extract_image_urls(fragment: str, source_url: str) -> list[str]:
    parser = ImageExtractor()
    parser.feed(fragment)
    seen: set[str] = set()
    urls: list[str] = []
    for raw in parser.urls:
        resolved = urljoin(source_url, raw)
        if resolved in seen:
            continue
        seen.add(resolved)
        urls.append(resolved)
    return urls


def build_glaze_lookup() -> dict[str, dict[str, Any]]:
    glazes = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    lookup: dict[str, dict[str, Any]] = {}
    for glaze in glazes:
        if glaze.get("brand") != "AMACO" or not glaze.get("code"):
            continue
        entry = {
            "brand": "AMACO",
            "code": glaze["code"],
            "name": glaze["name"],
            "line": glaze.get("line"),
        }
        for key in code_lookup_keys(glaze["code"]):
            lookup[key] = entry
    return lookup


def matched_glazes(article_text: str, lookup: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    matches: list[dict[str, Any]] = []
    seen: set[str] = set()
    for raw in CODE_PATTERN.findall(article_text):
        normalized = normalize_code(raw)
        if normalized in seen:
            continue
        seen.add(normalized)
        match = next((lookup[key] for key in code_lookup_keys(raw) if key in lookup), None)
        matches.append(match or {"brand": "AMACO", "code": canonical_code(raw), "name": None, "line": None})
    return matches


def image_extension(content_type: str | None, image: Image.Image) -> str:
    if content_type and "png" in content_type.lower():
        return ".png"
    if image.format and image.format.lower() == "png":
        return ".png"
    return ".jpg"


def download_image(session: requests.Session, url: str) -> tuple[bytes, str, int, int]:
    response = session.get(url, timeout=45)
    response.raise_for_status()
    content = response.content
    with Image.open(BytesIO(content)) as image:
        width, height = image.size
        ext = image_extension(response.headers.get("content-type"), image)
    return content, ext, width, height


def update_manifest() -> None:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    entries: list[dict[str, Any]] = []
    for collection_dir in sorted(p for p in ARCHIVE_ROOT.iterdir() if p.is_dir()):
        for metadata_path in sorted(collection_dir.glob("*/metadata.json")):
            metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
            entries.append({
                "id": metadata["id"],
                "sourceType": metadata["sourceType"],
                "title": metadata["title"],
                "sourceUrl": metadata["sourceUrl"],
                "metadataPath": metadata_path.as_posix(),
                "imageCount": len(metadata.get("images", [])),
                "matchedGlazeCount": len(metadata.get("matchedGlazes", [])),
            })

    source_collections: list[dict[str, Any]] = []
    for collection_dir in sorted(p for p in ARCHIVE_ROOT.iterdir() if p.is_dir()):
        collection_entries = [entry for entry in entries if entry["id"].startswith(f"{collection_dir.name}/")]
        label = "AMACO Blog combo posts" if collection_dir.name == COLLECTION_ID else "Coyote Shino over Black overlap archive"
        source_collections.append({
            "id": collection_dir.name,
            "label": label,
            "entryCount": len(collection_entries),
        })

    manifest["sourceCollections"] = source_collections
    manifest["entryCount"] = len(entries)
    manifest["entries"] = entries
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def archive_url(session: requests.Session, url: str, lookup: dict[str, dict[str, Any]]) -> tuple[str, int]:
    response = session.get(url, timeout=45)
    response.raise_for_status()
    article = extract_article(response.text)
    article_text = extract_text(article)
    title = extract_title(response.text)
    slug = slug_from_url(url)
    entry_dir = ARCHIVE_ROOT / COLLECTION_ID / slug
    images_dir = entry_dir / "images"
    images_dir.mkdir(parents=True, exist_ok=True)

    images: list[dict[str, Any]] = []
    for index, image_url in enumerate(extract_image_urls(article, url), start=1):
        content, ext, width, height = download_image(session, image_url)
        digest = hashlib.sha256(content).hexdigest()
        file_name = f"{index:02d}{ext}"
        (images_dir / file_name).write_bytes(content)
        images.append({
            "fileName": file_name,
            "remoteUrl": image_url,
            "sha256": digest,
            "width": width,
            "height": height,
        })

    metadata = {
        "id": f"{COLLECTION_ID}/{slug}",
        "sourceType": source_type_for_url(url),
        "sourceName": source_name_for_url(url),
        "title": title,
        "sourceUrl": url,
        "cone": "Cone 6" if "cone 6" in article_text.lower() else None,
        "atmosphere": None,
        "clayBody": None,
        "description": article_text,
        "matchedGlazes": matched_glazes(article_text, lookup),
        "images": images,
    }
    (entry_dir / "metadata.json").write_text(json.dumps(metadata, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return metadata["id"], len(images)


def main() -> None:
    lookup = build_glaze_lookup()
    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT})

    archived: list[tuple[str, int]] = []
    for url in SOURCE_URLS:
        entry_id, image_count = archive_url(session, url, lookup)
        archived.append((entry_id, image_count))
        print(f"{entry_id}: {image_count} image(s)")

    update_manifest()
    print(f"Archived {len(archived)} AMACO resource pages.")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Archive failed: {exc}", file=sys.stderr)
        raise
