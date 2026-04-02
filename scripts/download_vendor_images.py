from __future__ import annotations

import hashlib
import json
import re
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from io import BytesIO
from pathlib import Path
from typing import Any
from urllib.parse import urljoin, urlparse

import requests
from PIL import Image


USER_AGENT = "GlazeInventoryImageArchiver/1.0 (+https://glazeinventory.com)"
HEADERS = {"User-Agent": USER_AGENT}
VENDOR_DATA_DIR = Path("data/vendors")
ARCHIVE_DIR = Path("data/vendor-images")
MANIFEST_PATH = VENDOR_DATA_DIR / "vendor-image-catalog.json"
SUMMARY_PATH = VENDOR_DATA_DIR / "vendor-image-summary.json"
MAX_WORKERS = 8

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="backslashreplace")


@dataclass(frozen=True)
class Reference:
    brand: str
    code: str
    glaze_name: str
    usage: str
    label: str
    remote_url: str
    source_page_url: str | None
    sort_order: int


def load_json(path: Path) -> list[dict[str, Any]]:
    return json.loads(path.read_text(encoding="utf-8"))


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def normalize_code(value: str | None) -> str:
    return re.sub(r"[^A-Z0-9]", "", (value or "").upper())


def absolutize(url: str, base: str) -> str:
    if url.startswith("http://") or url.startswith("https://"):
        return url
    if url.startswith("//"):
        return f"https:{url}"
    return urljoin(base, url)


def maybe_wordpress_original(url: str) -> str | None:
    updated = re.sub(r"-(\d+)x(\d+)(\.(?:jpg|jpeg|png|webp))(\?.*)?$", r"\3\4", url, flags=re.I)
    return updated if updated != url else None


def maybe_amaco_original(url: str) -> str | None:
    updated = re.sub(r"/images/stencil/[^/]+/", "/images/stencil/original/", url)
    return updated if updated != url else None


def candidate_urls(reference: Reference, coyote_page_maps: dict[str, dict[str, str]]) -> list[str]:
    urls: list[str] = []

    if reference.brand == "Coyote" and reference.source_page_url:
        mapped = coyote_page_maps.get(reference.source_page_url, {}).get(reference.remote_url)
        if mapped:
            urls.append(mapped)

    if reference.brand == "AMACO":
        original = maybe_amaco_original(reference.remote_url)
        if original:
            urls.append(original)

    wordpress_original = maybe_wordpress_original(reference.remote_url)
    if wordpress_original:
        urls.append(wordpress_original)

    urls.append(reference.remote_url)

    unique: list[str] = []
    seen: set[str] = set()
    for url in urls:
        if not url or url in seen:
            continue
        unique.append(url)
        seen.add(url)
    return unique


def fetch_image(url: str) -> dict[str, Any]:
    response = requests.get(url, headers=HEADERS, timeout=45)
    response.raise_for_status()

    content_type = response.headers.get("content-type", "")
    if "image" not in content_type.lower():
        raise RuntimeError(f"Expected image content, got {content_type or 'unknown'}")

    content = response.content
    image = Image.open(BytesIO(content))
    width, height = image.size

    return {
        "bytes": content,
        "content_type": content_type,
        "width": width,
        "height": height,
        "area": width * height,
        "size_bytes": len(content),
        "format": image.format,
        "url": url,
    }


def choose_best_image(urls: list[str]) -> dict[str, Any]:
    attempts: list[dict[str, Any]] = []
    errors: list[str] = []

    for url in urls:
        try:
            attempts.append(fetch_image(url))
        except Exception as exc:  # noqa: BLE001
            errors.append(f"{url}: {exc}")

    if not attempts:
        raise RuntimeError("; ".join(errors) if errors else "No candidate image could be downloaded")

    attempts.sort(
        key=lambda item: (item["area"], item["size_bytes"], -urls.index(item["url"])),
        reverse=True,
    )
    return attempts[0]


def extension_for_image(image_info: dict[str, Any]) -> str:
    format_name = str(image_info.get("format") or "").lower()
    if format_name in {"jpeg", "jpg"}:
        return ".jpg"
    if format_name == "png":
        return ".png"
    if format_name == "webp":
        return ".webp"

    parsed = urlparse(image_info["url"])
    suffix = Path(parsed.path).suffix.lower()
    return suffix if suffix in {".jpg", ".jpeg", ".png", ".webp"} else ".jpg"


def build_coyote_page_maps(glazes: list[dict[str, Any]]) -> dict[str, dict[str, str]]:
    source_urls = sorted(
        {
            str(glaze["sourceUrl"])
            for glaze in glazes
            if glaze.get("brand") == "Coyote" and glaze.get("sourceUrl")
        },
    )

    def parse_page(source_url: str) -> tuple[str, dict[str, str]]:
        html = requests.get(source_url, headers=HEADERS, timeout=45).text
        pairs = re.findall(r'<a[^>]+href="([^"]+?(?:jpg|jpeg|png|webp))"[^>]*>\s*<img[^>]+src="([^"]+)"', html, re.I | re.S)
        mapping: dict[str, str] = {}
        for href, src in pairs:
            mapping[absolutize(src, source_url)] = absolutize(href, source_url)
        return source_url, mapping

    results: dict[str, dict[str, str]] = {}

    with ThreadPoolExecutor(max_workers=6) as executor:
        futures = {executor.submit(parse_page, source_url): source_url for source_url in source_urls}
        for future in as_completed(futures):
            source_url = futures[future]
            try:
                page_url, mapping = future.result()
                results[page_url] = mapping
            except Exception as exc:  # noqa: BLE001
                print(f"[warn] could not parse Coyote page {source_url}: {exc}")
                results[source_url] = {}

    return results


def collect_references() -> list[Reference]:
    glaze_files = [
        VENDOR_DATA_DIR / "mayco-glazes.json",
        VENDOR_DATA_DIR / "amaco-glazes.json",
        VENDOR_DATA_DIR / "coyote-glazes.json",
    ]
    firing_files = [
        VENDOR_DATA_DIR / "mayco-firing-images.json",
        VENDOR_DATA_DIR / "amaco-firing-images.json",
        VENDOR_DATA_DIR / "coyote-firing-images.json",
    ]

    references: list[Reference] = []
    glaze_lookup: dict[tuple[str, str], dict[str, Any]] = {}

    for path in glaze_files:
        default_brand = path.name.split("-")[0].capitalize()
        for item in load_json(path):
            brand = str(item.get("brand") or default_brand)
            code = str(item["code"])
            glaze_lookup[(brand, normalize_code(code))] = item

            image_url = item.get("imageUrl")
            if not image_url:
                continue

            references.append(
                Reference(
                    brand=brand,
                    code=code,
                    glaze_name=str(item["name"]),
                    usage="catalog",
                    label="Primary image",
                    remote_url=str(image_url),
                    source_page_url=str(item.get("sourceUrl")) if item.get("sourceUrl") else None,
                    sort_order=0,
                )
            )

    for path in firing_files:
        default_brand = path.name.split("-")[0].capitalize()
        for item in load_json(path):
            brand = str(item.get("brand") or default_brand)
            code = str(item["code"])
            image_url = item.get("imageUrl")
            if not image_url:
                continue

            glaze_item = glaze_lookup.get((brand, normalize_code(code)))
            references.append(
                Reference(
                    brand=brand,
                    code=code,
                    glaze_name=str(glaze_item["name"]) if glaze_item else code,
                    usage="firing",
                    label=str(item.get("label") or "Reference image"),
                    remote_url=str(image_url),
                    source_page_url=str(glaze_item.get("sourceUrl")) if glaze_item and glaze_item.get("sourceUrl") else None,
                    sort_order=int(item.get("sortOrder") or 999),
                )
            )

    return references


def build_job_key(reference: Reference) -> str:
    return "||".join(
        [
            reference.brand,
            reference.code,
            reference.remote_url,
            reference.source_page_url or "",
        ]
    )


def archive_path_for(reference: Reference, image_info: dict[str, Any]) -> Path:
    brand_slug = slugify(reference.brand)
    code_slug = slugify(reference.code or "uncoded")
    label_slug = slugify(f"{reference.usage}-{reference.label}")[:64] or "image"
    url_hash = hashlib.sha1(image_info["url"].encode("utf-8")).hexdigest()[:10]
    extension = extension_for_image(image_info)
    return ARCHIVE_DIR / brand_slug / code_slug / f"{label_slug}-{url_hash}{extension}"


def process_job(
    reference: Reference,
    references: list[Reference],
    coyote_page_maps: dict[str, dict[str, str]],
) -> dict[str, Any]:
    candidates = candidate_urls(reference, coyote_page_maps)
    best = choose_best_image(candidates)
    asset_path = archive_path_for(reference, best)
    asset_path.parent.mkdir(parents=True, exist_ok=True)
    asset_path.write_bytes(best["bytes"])

    references_payload = [
        {
            "brand": item.brand,
            "code": item.code,
            "glazeName": item.glaze_name,
            "usage": item.usage,
            "label": item.label,
            "remoteUrl": item.remote_url,
            "sourcePageUrl": item.source_page_url,
            "sortOrder": item.sort_order,
        }
        for item in sorted(references, key=lambda item: (item.usage, item.sort_order, item.label))
    ]

    return {
        "brand": reference.brand,
        "code": reference.code,
        "glazeName": reference.glaze_name,
        "assetPath": asset_path.as_posix(),
        "resolvedUrl": best["url"],
        "candidateUrls": candidates,
        "contentType": best["content_type"],
        "width": best["width"],
        "height": best["height"],
        "sizeBytes": best["size_bytes"],
        "references": references_payload,
        "status": "downloaded",
    }


def summarize_manifest(entries: list[dict[str, Any]]) -> dict[str, Any]:
    downloaded = [entry for entry in entries if entry.get("status") == "downloaded"]
    failed = [entry for entry in entries if entry.get("status") != "downloaded"]

    by_brand: dict[str, dict[str, Any]] = {}
    for entry in downloaded:
        brand = str(entry["brand"])
        bucket = by_brand.setdefault(
            brand,
            {
                "assetCount": 0,
                "referenceCount": 0,
                "totalBytes": 0,
                "maxWidth": 0,
                "maxHeight": 0,
            },
        )
        bucket["assetCount"] += 1
        bucket["referenceCount"] += len(entry.get("references", []))
        bucket["totalBytes"] += int(entry.get("sizeBytes") or 0)
        bucket["maxWidth"] = max(bucket["maxWidth"], int(entry.get("width") or 0))
        bucket["maxHeight"] = max(bucket["maxHeight"], int(entry.get("height") or 0))

    return {
        "downloadedAssetCount": len(downloaded),
        "failedAssetCount": len(failed),
        "downloadedReferenceCount": sum(len(entry.get("references", [])) for entry in downloaded),
        "failedReferenceCount": sum(len(entry.get("references", [])) for entry in failed),
        "totalBytes": sum(int(entry.get("sizeBytes") or 0) for entry in downloaded),
        "brands": by_brand,
    }


def main() -> None:
    references = collect_references()
    coyote_page_maps = build_coyote_page_maps(load_json(VENDOR_DATA_DIR / "coyote-glazes.json"))

    grouped: dict[str, list[Reference]] = {}
    for reference in references:
        grouped.setdefault(build_job_key(reference), []).append(reference)

    manifest_entries: list[dict[str, Any]] = []

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {
            executor.submit(process_job, refs[0], refs, coyote_page_maps): refs[0]
            for refs in grouped.values()
        }
        for future in as_completed(futures):
            reference = futures[future]
            try:
                manifest_entries.append(future.result())
                print(
                    f"[ok] {reference.brand} {reference.code} {reference.label} -> "
                    f"{manifest_entries[-1]['width']}x{manifest_entries[-1]['height']}"
                )
            except Exception as exc:  # noqa: BLE001
                print(f"[fail] {reference.brand} {reference.code} {reference.label}: {exc}")
                manifest_entries.append(
                    {
                        "brand": reference.brand,
                        "code": reference.code,
                        "glazeName": reference.glaze_name,
                        "assetPath": None,
                        "resolvedUrl": None,
                        "candidateUrls": candidate_urls(reference, coyote_page_maps),
                        "contentType": None,
                        "width": None,
                        "height": None,
                        "sizeBytes": None,
                        "references": [
                            {
                                "brand": item.brand,
                                "code": item.code,
                                "glazeName": item.glaze_name,
                                "usage": item.usage,
                                "label": item.label,
                                "remoteUrl": item.remote_url,
                                "sourcePageUrl": item.source_page_url,
                                "sortOrder": item.sort_order,
                            }
                            for item in grouped[build_job_key(reference)]
                        ],
                        "status": "failed",
                        "error": str(exc),
                    }
                )

    manifest_entries.sort(
        key=lambda item: (
            item["brand"],
            normalize_code(item["code"]),
            item["references"][0]["usage"] if item.get("references") else "",
            item["references"][0]["sortOrder"] if item.get("references") else 0,
            item["references"][0]["label"] if item.get("references") else "",
        )
    )

    MANIFEST_PATH.write_text(json.dumps(manifest_entries, indent=2), encoding="utf-8")
    summary = summarize_manifest(manifest_entries)
    SUMMARY_PATH.write_text(json.dumps(summary, indent=2), encoding="utf-8")

    print()
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
