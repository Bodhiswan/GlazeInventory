from __future__ import annotations

import html
import json
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import TypedDict
from urllib.parse import unquote, unquote_plus, urljoin, urlparse

import requests


USER_AGENT = "GlazeInventoryCatalogBot/1.0 (+https://glazeinventory.com)"
HEADERS = {"User-Agent": USER_AGENT}

AMACO_CATEGORY_SITEMAP = "https://shop.amaco.com/xmlsitemap.php?type=categories&page=1"
COYOTE_CONE6_URL = "https://www.coyoteclay.com/Cone6byFamily.html"

OUTPUT_DIR = Path("data/vendors")
OUTPUT_CATALOG_SQL_PATH = Path("supabase/migrations/20260402150000_refresh_amaco_coyote_catalog.sql")
OUTPUT_FIRING_SQL_PATH = Path("supabase/migrations/20260402151000_import_amaco_coyote_firing_images.sql")
AMACO_DESCRIPTION_STOP_PATTERN = re.compile(
    r"(?:Apply to:|Apply\s+\d+(?:-\d+)?\s+coats|Number of coats:|For best results,|Can be fired in a normal|To take this glaze to the next level,|These glazes are prone to running|You can also use a drip tray|Is this glaze food safe\?|Due to variations in raw materials used during manufacturing)",
    re.I,
)
AMACO_DESCRIPTION_SKIP_PATTERN = re.compile(
    r"(currently available for pre-order|shop local here!?|find a distributor)",
    re.I,
)


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


AMACO_SKIP_SEGMENTS = (
    "/underglaze-chalk-crayons-and-pencils/",
    "/ceramic-inks/",
    "/glaze-additives-and-aids/",
)
AMACO_SKIP_EXACT = {
    "https://shop.amaco.com/glazes-underglazes/",
    "https://shop.amaco.com/glazes-underglazes/low-fire-glazes/",
    "https://shop.amaco.com/glazes-underglazes/high-fire-glazes/",
    "https://shop.amaco.com/glazes-underglazes/mid-high-fire-glazes/",
    "https://shop.amaco.com/glazes-underglazes/specialty-glazes/",
    "https://shop.amaco.com/glazes-underglazes/underglazes/",
    "https://shop.amaco.com/glazes-underglazes/underglazes/underglaze-chalk-crayons-and-pencils/",
}

COYOTE_FAMILY_NORMALIZATION = {
    "Fantasy Glazes": "Fantasy Glazes",
    "Vibro-Color Glazes": "Vibro-Color Glazes",
    "Shino Glazes": "Shino Glazes",
    "Archie's Glazes": "Archie's Glazes",
    "Frank's Colored Celadon Glazes": "Frank's Colored Celadon Glazes",
    "Matt Glazes & Crawl Glazes": "Matt Glazes & Crawl Glazes",
    "Satin Glazes": "Satin Glazes",
    "Gloss Glazes": "Gloss Glazes",
    "Mottled Glazes": "Mottled Glazes",
    "Copper & Iron Glazes": "Copper & Iron Glazes",
    "Texas Two-Step Oilspot Glazes": "Texas Two-Step Oilspot Glazes",
    "Enduro-Color Glazes": "Enduro-Color Glazes",
}


def fetch_text(url: str) -> str:
    response = requests.get(url, headers=HEADERS, timeout=30)
    response.raise_for_status()
    return response.text


def normalize_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def decode_html_text(value: str) -> str:
    return html.unescape(value.replace("\xa0", " "))


def html_to_text(value: str) -> str:
    text = re.sub(r"<br\s*/?>", "\n", value, flags=re.I)
    text = re.sub(r"</p\s*>", "\n\n", text, flags=re.I)
    text = re.sub(r"</div\s*>", "\n", text, flags=re.I)
    text = re.sub(r"</li\s*>", "\n", text, flags=re.I)
    text = re.sub(r"<li[^>]*>", "• ", text, flags=re.I)
    text = re.sub(r"<[^>]+>", "", text)
    text = decode_html_text(text)
    lines = [normalize_whitespace(line) for line in text.splitlines()]
    return "\n".join(line for line in lines if line)


def collapse_text(value: str) -> str:
    return normalize_whitespace(" ".join(segment.strip() for segment in value.splitlines() if segment.strip()))


def strip_tags(value: str) -> str:
    return collapse_text(html_to_text(value))


def normalize_line(value: str) -> str:
    normalized = strip_tags(value)
    normalized = re.sub(r"^\(([A-Z]+)\)\s*", "", normalized)
    return normalize_whitespace(normalized)


def split_amaco_card_title(title: str, line: str) -> tuple[str, str] | None:
    code_match = re.match(r"(?P<code>[A-Z0-9-]+)\s+(?P<name>.+)", title)

    if code_match:
        return code_match.group("code"), code_match.group("name").strip()

    if line == "Semi-Moist Underglaze":
        set_match = re.search(r"#(?P<number>\d+)", title)

        if set_match:
            number = set_match.group("number")
            return f"SMUGS-{number}", f"Set #{number}"

    return None


def escape_sql(value: str) -> str:
    return value.replace("'", "''")


def absolutize_url(url: str, base: str) -> str:
    if not url:
        return url

    if url.startswith("http://") or url.startswith("https://"):
        return url

    if url.startswith("//"):
        return f"https:{url}"

    return urljoin(f"{base.rstrip('/')}/", url)


def get_attr(tag_html: str, attribute_name: str) -> str | None:
    match = re.search(rf'{re.escape(attribute_name)}="([^"]+)"', tag_html, re.I)
    return match.group(1) if match else None


def unique_preserving_order(values: list[str]) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []

    for value in values:
        if not value or value in seen:
            continue
        ordered.append(value)
        seen.add(value)

    return ordered


def dedupe_firing_image_labels(entries: list[FiringImageEntry]) -> list[FiringImageEntry]:
    counts: dict[tuple[str, str, str], int] = {}
    deduped: list[FiringImageEntry] = []

    for entry in entries:
        key = (entry["brand"], normalize_code(entry["code"]), entry["label"])
        occurrence = counts.get(key, 0) + 1
        counts[key] = occurrence

        if occurrence == 1:
            deduped.append(entry)
            continue

        deduped.append(
            {
                **entry,
                "label": f"{entry['label']} ({occurrence})",
            }
        )

    return deduped


def normalize_code(value: str | None) -> str:
    return re.sub(r"[^A-Z0-9]", "", normalize_whitespace(value or "").upper())


def parse_cone(text: str) -> str | None:
    matches = re.findall(r"Cone\s*0?\d+(?:\s*[-/]\s*0?\d+)?", text, re.I)

    if not matches:
        return None

    normalized: list[str] = []

    for match in matches:
        numbers = re.findall(r"0?\d{1,2}", match)

        for number in numbers:
            if len(number) > 1 and number.startswith("0"):
                cleaned = f"Cone {number}"
            else:
                cleaned = f"Cone {int(number)}"

            if cleaned not in normalized:
                normalized.append(cleaned)

    non_bisque = [value for value in normalized if value not in {"Cone 04", "Cone 03"}]
    candidates = non_bisque or normalized
    return " / ".join(candidates)


def extract_product_schema(page_html: str) -> dict[str, object] | None:
    for match in re.finditer(r'<script type="application/ld\+json">(.*?)</script>', page_html, re.S | re.I):
        blob = match.group(1).strip()

        try:
            parsed = json.loads(blob)
        except json.JSONDecodeError:
            continue

        if isinstance(parsed, dict) and parsed.get("@type") == "Product":
            return parsed

    return None


def clean_amaco_description(value: str | None) -> str | None:
    if not value:
        return None

    paragraphs = [collapse_text(part) for part in html_to_text(unquote_plus(value)).splitlines() if collapse_text(part)]
    cleaned_parts: list[str] = []

    for paragraph in paragraphs:
        if AMACO_DESCRIPTION_SKIP_PATTERN.search(paragraph):
            continue

        shortened = AMACO_DESCRIPTION_STOP_PATTERN.split(paragraph, maxsplit=1)[0].strip(" .")

        shortened = re.sub(r"Due to the powdered nature of the materials involved.*$", "", shortened, flags=re.I)
        shortened = re.sub(r"\*?Note that all dry dipping glazes.*$", "", shortened, flags=re.I)
        shortened = re.sub(r"\b\d+#\s*DIPPING WARNING:.*$", "", shortened, flags=re.I)
        shortened = re.sub(r"WARNING:\s*This product can expose you to chemicals.*$", "", shortened, flags=re.I)
        shortened = re.sub(r"For more information go to www\.P65Warnings\.ca\.gov\.?$", "", shortened, flags=re.I)
        shortened = normalize_whitespace(shortened).strip(" .")

        if not shortened:
            if cleaned_parts:
                break
            continue

        cleaned_parts.append(shortened)

        if AMACO_DESCRIPTION_STOP_PATTERN.search(paragraph):
            break

    cleaned = " ".join(unique_preserving_order(cleaned_parts)).strip(" .")
    return f"{cleaned}." if cleaned and cleaned[-1] not in ".!?" else cleaned or None


def clean_coyote_description(value: str | None) -> str | None:
    if not value:
        return None

    cleaned = collapse_text(html_to_text(value))
    cleaned = re.sub(r"\s+([.,;:!?])", r"\1", cleaned)
    cleaned = cleaned.strip()
    return cleaned or None


def derive_amaco_gallery_label(image_url: str, current_code: str, index: int) -> str:
    filename = unquote(urlparse(image_url).path.split("/")[-1])
    filename = re.sub(r"\.[A-Za-z0-9]+$", "", filename)
    filename = re.sub(r"__.+$", "", filename)
    lowered = filename.lower()

    if index == 0:
        return "Tile"

    if "label" in lowered:
        return "Label tile"

    if "call-out" in lowered or "callout" in lowered:
        return "Detail tile"

    codes = unique_preserving_order(re.findall(r"\b[A-Z]{1,3}-?\d{1,4}\b", filename.upper()))
    normalized_current = normalize_code(current_code)
    remaining = [code for code in codes if normalize_code(code) != normalized_current]

    if remaining:
        return f"Layering example: {' + '.join(remaining[:4])}"

    return f"Example {index + 1}"


def infer_cone_label(*values: str | None) -> str | None:
    text = " ".join(value or "" for value in values).lower()

    if re.search(r"cone[\s_-]*0?10(?=[^0-9]|$)", text):
        return "Cone 10"

    if re.search(r"cone[\s_-]*06(?=[^0-9]|$)", text):
        return "Cone 06"

    if re.search(r"cone[\s_-]*6(?=[^0-9]|$)", text):
        return "Cone 6"

    if re.search(r"cone[\s_-]*5(?=[^0-9]|$)", text):
        return "Cone 5"

    return None


def infer_atmosphere_label(*values: str | None) -> str | None:
    text = " ".join(value or "" for value in values).lower()

    if "reduction" in text:
        return "Reduction"

    if "oxidation" in text:
        return "Oxidation"

    return None


def derive_amaco_gallery_metadata(image_url: str, current_code: str, index: int) -> tuple[str, str | None, str | None, int]:
    cone = infer_cone_label(image_url)
    atmosphere = infer_atmosphere_label(image_url)
    label = derive_amaco_gallery_label(image_url, current_code, index)
    lowered_label = label.lower()

    if lowered_label == "tile" and cone:
        label = cone
    elif lowered_label == "tile":
        label = "Reference tile"
    elif cone and lowered_label.startswith("example "):
        label = f"{cone} example"

    if label in {"Cone 5", "Cone 6", "Cone 06", "Cone 10", "Reference tile"}:
        sort_order = {
            "Cone 5": 10,
            "Cone 06": 20,
            "Cone 6": 30,
            "Cone 10": 40,
            "Reference tile": 50,
        }[label]
    elif label == "Label tile":
        sort_order = 110 + index * 10
    elif label == "Detail tile":
        sort_order = 140 + index * 10
    elif label.startswith("Layering example"):
        sort_order = 220 + index * 10
    else:
        sort_order = 180 + index * 10

    return label, cone, atmosphere, sort_order


def clean_coyote_gallery_label(value: str, glaze_name: str) -> str:
    cleaned = collapse_text(value)

    if glaze_name:
        cleaned = re.sub(
            rf"^{re.escape(glaze_name)}(?:\s*[,.:-]\s*)?",
            "",
            cleaned,
            flags=re.I,
        ).strip()

    return cleaned or "Reference image"


def url_points_to_image(url: str) -> bool:
    try:
        response = requests.get(url, headers=HEADERS, timeout=20)
        response.raise_for_status()
        return response.headers.get("content-type", "").startswith("image/")
    except requests.RequestException:
        return False


def maybe_correct_coyote_image_url(image_url: str | None, code: str) -> str | None:
    if not image_url:
        return None

    mismatched_code = re.search(r"(MBG\d{3})", image_url, re.I)

    if not mismatched_code or mismatched_code.group(1).upper() == code.upper():
        return image_url

    candidate = re.sub(r"MBG\d{3}", code, image_url, count=1, flags=re.I)

    if candidate != image_url and url_points_to_image(candidate):
        return candidate

    return image_url


def create_glaze_sql(entries: list[CatalogEntry]) -> str:
    values = []

    for entry in entries:
        values.append(
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

    return "\n".join(
        [
            "-- Generated by scripts/scrape_additional_vendor_catalogs.py from official AMACO and Coyote pages on 2026-04-02.",
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
            ",\n".join(values),
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


def create_firing_image_sql(entries: list[FiringImageEntry]) -> str:
    value_rows: list[str] = []

    for entry in entries:
        cone = f"'{escape_sql(entry['cone'])}'" if entry["cone"] else "null"
        atmosphere = f"'{escape_sql(entry['atmosphere'])}'" if entry["atmosphere"] else "null"
        value_rows.append(
            "  ("
            " (select id from public.glazes"
            f" where brand = '{escape_sql(entry['brand'])}'"
            " and created_by_user_id is null"
            " and regexp_replace(upper(coalesce(code, '')), '[^A-Z0-9]', '', 'g') = "
            f"'{escape_sql(normalize_code(entry['code']))}'"
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
            "-- Generated by scripts/scrape_additional_vendor_catalogs.py from official AMACO and Coyote pages on 2026-04-02.",
            "delete from public.glaze_firing_images",
            "where glaze_id in (",
            "  select id",
            "  from public.glazes",
            "  where brand in ('AMACO', 'Coyote')",
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


def scrape_amaco_base_entries() -> list[CatalogEntry]:
    sitemap = fetch_text(AMACO_CATEGORY_SITEMAP)
    category_urls = re.findall(r"<loc>(.*?)</loc>", sitemap)
    entries_by_code: dict[str, CatalogEntry] = {}

    for category_url in category_urls:
        if "/glazes-underglazes/" not in category_url:
            continue
        if category_url in AMACO_SKIP_EXACT or any(segment in category_url for segment in AMACO_SKIP_SEGMENTS):
            continue

        category_html = fetch_text(f"{category_url}?sort=alphaasc&limit=100")
        heading_match = re.search(r"<h1[^>]*>(.*?)</h1>", category_html, re.S)
        body_match = re.search(r'<div class="wysiwyg">(.*?)</div>', category_html, re.S)
        line = normalize_line(heading_match.group(1) if heading_match else category_url.rstrip("/").split("/")[-1])
        body_text = strip_tags(body_match.group(1)) if body_match else ""
        cone = parse_cone(body_text or line)

        for card_match in re.finditer(r'<article class="product-card product-card--grid".*?</article>', category_html, re.S):
            card_html = card_match.group(0)
            url_match = re.search(
                r'<a class="text-reset d-block mb-1"[^>]*href="(?P<url>https://shop\.amaco\.com/[^"]+/)"[^>]*data-product-title>\s*(?P<title>.*?)\s*</a>',
                card_html,
                re.S,
            )

            if not url_match:
                continue

            title = strip_tags(url_match.group("title"))
            code_match = split_amaco_card_title(title, line)

            if not code_match:
                continue

            code, name = code_match
            entries_by_code[code] = {
                "brand": "AMACO",
                "line": line,
                "code": code,
                "name": name,
                "cone": cone,
                "description": None,
                "imageUrl": None,
                "sourceUrl": url_match.group("url"),
            }

    return sorted(entries_by_code.values(), key=lambda item: (item["line"], item["code"]))


def enrich_amaco_entry(entry: CatalogEntry) -> tuple[CatalogEntry, list[FiringImageEntry]]:
    page_html = fetch_text(entry["sourceUrl"])
    product_schema = extract_product_schema(page_html) or {}

    description_block = re.search(
        r'<div id="product-description-content" class="wysiwyg mb-45">(.*?)</div>',
        page_html,
        re.S,
    )

    description = clean_amaco_description(str(product_schema.get("description") or ""))

    if not description and description_block:
        description = clean_amaco_description(description_block.group(1))

    gallery_urls = unique_preserving_order(
        [
            zoom or new_image
            for tag in re.findall(r"<a[^>]+data-image-gallery-item[^>]+>", page_html, re.S)
            for new_image, zoom in [
                (
                    get_attr(tag, "data-image-gallery-new-image-url") or "",
                    get_attr(tag, "data-image-gallery-zoom-image-url") or "",
                )
            ]
            if zoom or new_image
        ]
    )

    fallback_image = None
    og_image_match = re.search(r'<meta property="og:image" content="([^"]+)"', page_html, re.I)

    if isinstance(product_schema.get("image"), str):
        fallback_image = str(product_schema["image"])
    elif og_image_match:
        fallback_image = og_image_match.group(1)

    image_url = gallery_urls[0] if gallery_urls else fallback_image

    firing_images: list[FiringImageEntry] = []

    for index, gallery_url in enumerate(gallery_urls):
        label, cone, atmosphere, sort_order = derive_amaco_gallery_metadata(gallery_url, entry["code"], index)
        firing_images.append(
            {
                "brand": "AMACO",
                "code": entry["code"],
                "label": label,
                "cone": cone,
                "atmosphere": atmosphere,
                "imageUrl": gallery_url,
                "sortOrder": sort_order,
            }
        )

    return (
        {
            **entry,
            "description": description,
            "imageUrl": image_url,
        },
        firing_images,
    )


def scrape_amaco() -> tuple[list[CatalogEntry], list[FiringImageEntry]]:
    base_entries = scrape_amaco_base_entries()
    enriched_by_code: dict[str, CatalogEntry] = {}
    firing_images_by_code: dict[str, list[FiringImageEntry]] = {}

    with ThreadPoolExecutor(max_workers=10) as executor:
        future_map = {executor.submit(enrich_amaco_entry, entry): entry for entry in base_entries}

        for index, future in enumerate(as_completed(future_map), start=1):
            entry = future_map[future]

            try:
                enriched_entry, firing_images = future.result()
            except Exception:
                enriched_entry, firing_images = entry, []

            enriched_by_code[entry["code"]] = enriched_entry
            firing_images_by_code[entry["code"]] = firing_images

            if index % 40 == 0 or index == len(base_entries):
                print(f"AMACO: enriched {index}/{len(base_entries)} glazes", flush=True)

    firing_images = [
        image
        for code in sorted(firing_images_by_code)
        for image in firing_images_by_code[code]
    ]

    return (
        sorted(enriched_by_code.values(), key=lambda item: (item["line"], item["code"])),
        firing_images,
    )


def normalize_coyote_family(value: str) -> str:
    normalized = normalize_line(value)
    return COYOTE_FAMILY_NORMALIZATION.get(normalized, normalized)


def scrape_coyote_section_urls() -> dict[str, str]:
    page_html = fetch_text(COYOTE_CONE6_URL)
    family_splitter = re.compile(
        r'<strong><a name="[^"]*">\s*(?P<family>[^<]+?)\s*</a></strong>(?P<body>.*?)(?=<strong><a name="|$)',
        re.S,
    )
    section_urls: dict[str, str] = {}

    for section in family_splitter.finditer(page_html):
        family = normalize_coyote_family(section.group("family"))
        body = section.group("body")
        urls = unique_preserving_order(
            [absolutize_url(url, "https://www.coyoteclay.com") for url in re.findall(r'href="(Glazes/[^"]+\.html)"', body)]
        )

        for url in urls:
            section_urls[url] = family

    return section_urls


def enrich_coyote_entry(source_url: str, line: str) -> tuple[CatalogEntry, list[FiringImageEntry]]:
    page_html = fetch_text(source_url)

    id_match = re.search(r'<input[^>]+name="ID"[^>]+value="([^"]+)"', page_html, re.I)

    if not id_match:
        raise RuntimeError(f"Could not find Coyote product code in {source_url}")

    hidden_id = collapse_text(id_match.group(1))
    code_match = re.match(r"(?P<name>.+?)\s+(?P<code>MBG\d{3})$", hidden_id)

    if not code_match:
        raise RuntimeError(f"Could not split Coyote code from '{hidden_id}'")

    name = code_match.group("name")
    code = code_match.group("code")

    description_match = re.search(
        r"<!--Glaze Description-->.*?<td[^>]*>(?P<body>.*?)(?:<!--Safety Logos-->|<table style=\"width: 100%\">)",
        page_html,
        re.S,
    )
    description = clean_coyote_description(description_match.group("body")) if description_match else None

    main_image_match = re.search(
        r'data-lightbox="[^"]+"\s+data-title="[^"]*">\s*<img[^>]+src="([^"]+)"',
        page_html,
        re.S,
    ) or re.search(
        r'<img[^>]+height="250"[^>]+src="([^"]+)"',
        page_html,
        re.S,
    ) or re.search(
        r'<img[^>]+src="([^"]+)"[^>]+height="250"',
        page_html,
        re.S,
    )
    image_url = (
        maybe_correct_coyote_image_url(
            absolutize_url(main_image_match.group(1), "https://www.coyoteclay.com"),
            code,
        )
        if main_image_match
        else None
    )

    firing_images: list[FiringImageEntry] = []
    lightbox_matches = list(
        re.finditer(
            r'<a[^>]+href="(?P<href>[^"]+)"[^>]+data-lightbox="[^"]+"[^>]+data-title="(?P<title>[^"]+)"',
            page_html,
            re.S,
        )
    )

    for index, match in enumerate(lightbox_matches):
        label = clean_coyote_gallery_label(match.group("title"), name)
        gallery_url = maybe_correct_coyote_image_url(
            absolutize_url(match.group("href"), "https://www.coyoteclay.com"),
            code,
        )

        if not gallery_url:
            continue

        if label == "Reference image":
            label = "Cone 6 tile"

        firing_images.append(
            {
                "brand": "Coyote",
                "code": code,
                "label": label,
                "cone": "Cone 6",
                "atmosphere": None,
                "imageUrl": gallery_url,
                "sortOrder": 10 if label == "Cone 6 tile" else 20 + index * 10,
            }
        )

    if image_url and not any(
        image["imageUrl"] == image_url or image["label"] == "Cone 6 tile" for image in firing_images
    ):
        firing_images.insert(
            0,
            {
                "brand": "Coyote",
                "code": code,
                "label": "Cone 6 tile",
                "cone": "Cone 6",
                "atmosphere": None,
                "imageUrl": image_url,
                "sortOrder": 10,
            },
        )

    return (
        {
            "brand": "Coyote",
            "line": line,
            "code": code,
            "name": name,
            "cone": "Cone 6",
            "description": description,
            "imageUrl": image_url,
            "sourceUrl": source_url,
        },
        firing_images,
    )


def scrape_coyote() -> tuple[list[CatalogEntry], list[FiringImageEntry]]:
    section_urls = scrape_coyote_section_urls()
    entries_by_code: dict[str, CatalogEntry] = {}
    firing_images_by_code: dict[str, list[FiringImageEntry]] = {}

    with ThreadPoolExecutor(max_workers=10) as executor:
        future_map = {
            executor.submit(enrich_coyote_entry, url, line): url
            for url, line in section_urls.items()
        }

        for index, future in enumerate(as_completed(future_map), start=1):
            url = future_map[future]

            try:
                entry, firing_images = future.result()
            except Exception:
                print(f"Coyote: failed to enrich {url}", flush=True)
                continue

            entries_by_code[entry["code"]] = entry
            firing_images_by_code[entry["code"]] = firing_images

            if index % 25 == 0 or index == len(section_urls):
                print(f"Coyote: enriched {index}/{len(section_urls)} glazes", flush=True)

    firing_images = [
        image
        for code in sorted(firing_images_by_code)
        for image in firing_images_by_code[code]
    ]

    return (
        sorted(entries_by_code.values(), key=lambda item: (item["line"], item["code"])),
        firing_images,
    )


def write_json(name: str, payload: object) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUTPUT_DIR / f"{name}.json"
    path.write_text(f"{json.dumps(payload, indent=2)}\n", encoding="utf-8")


def main() -> None:
    amaco_entries, amaco_firing_images = scrape_amaco()
    print(f"AMACO: {len(amaco_entries)} catalog glazes, {len(amaco_firing_images)} gallery images", flush=True)

    coyote_entries, coyote_firing_images = scrape_coyote()
    print(
        f"Coyote: {len(coyote_entries)} catalog glazes, {len(coyote_firing_images)} gallery images",
        flush=True,
    )

    write_json("amaco-glazes", amaco_entries)
    write_json("amaco-firing-images", amaco_firing_images)
    write_json("coyote-glazes", coyote_entries)
    write_json("coyote-firing-images", coyote_firing_images)

    catalog_entries = sorted(
        amaco_entries + coyote_entries,
        key=lambda item: (item["brand"], item["line"], item["code"]),
    )
    firing_images = sorted(
        dedupe_firing_image_labels(amaco_firing_images + coyote_firing_images),
        key=lambda item: (item["brand"], normalize_code(item["code"]), item["sortOrder"], item["label"]),
    )

    OUTPUT_CATALOG_SQL_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FIRING_SQL_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_CATALOG_SQL_PATH.write_text(create_glaze_sql(catalog_entries), encoding="utf-8")
    OUTPUT_FIRING_SQL_PATH.write_text(create_firing_image_sql(firing_images), encoding="utf-8")

    print(f"Catalog SQL: {OUTPUT_CATALOG_SQL_PATH}", flush=True)
    print(f"Firing image SQL: {OUTPUT_FIRING_SQL_PATH}", flush=True)


if __name__ == "__main__":
    main()
