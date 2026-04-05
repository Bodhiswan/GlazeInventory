from __future__ import annotations

import html
import json
import re
import uuid
from dataclasses import dataclass, field
from datetime import date
from html.parser import HTMLParser
from pathlib import Path
from typing import Any, TypedDict
from urllib.parse import urlparse

import requests


MAYCO_COMBINATIONS_URL = "https://www.maycocolors.com/glaze-combinations/"
USER_AGENT = "GlazeLibraryCatalogBot/1.0 (+https://glaze-library.app)"
OUTPUT_JSON_PATH = Path("data/vendors/mayco-combinations.json")
OUTPUT_SQL_PATH = Path("supabase/migrations/20260403110000_refresh_mayco_combination_examples.sql")
SOURCE_VENDOR = "Mayco"
SOURCE_COLLECTION = "glaze-combinations"
UUID_NAMESPACE = uuid.UUID("a13f18f4-67eb-4275-903f-8d86e55a43a6")
APPLICATION_NOTES = (
    "Technique was achieved by brushing on two (2) layers of base glaze. "
    "Then apply two (2) layers of top glaze, letting glazes dry between coats."
)
FIRING_NOTES_BY_CONE = {
    "Cone 06": "Cone 06 combinations are fired on white earthenware body (MB-1556 Textured Bud Vases).",
    "Cone 6": "All Cone 6 combinations are fired in oxidation on white stoneware body.",
    "Cone 10": "All Cone 10 combinations are fired in reduction on white stoneware body.",
}
CLAY_BODY_BY_CONE = {
    "Cone 06": "White earthenware (MB-1556 Textured Bud Vases)",
    "Cone 6": "White stoneware",
    "Cone 10": "White stoneware",
}
ATMOSPHERE_BY_CONE = {
    "Cone 06": None,
    "Cone 6": "oxidation",
    "Cone 10": "reduction",
}
GLAZE_LABEL_PATTERN = re.compile(r"^\s*([A-Z]{1,4}-?\d{2,4}[A-Z]?)\s+(.+?)\s*$")
FWP_JSON_PATTERN = re.compile(r"FWP_JSON\s*=\s*(\{.*?\});", re.DOTALL)


class LayerEntry(TypedDict):
    id: str
    glazeCode: str | None
    glazeName: str
    layerOrder: int
    connectorToNext: str | None
    sourceImageUrl: str | None


class CombinationEntry(TypedDict):
    id: str
    sourceVendor: str
    sourceCollection: str
    sourceKey: str
    sourceUrl: str
    title: str
    imageUrl: str
    cone: str | None
    atmosphere: str | None
    clayBody: str | None
    applicationNotes: str | None
    firingNotes: str | None
    layers: list[LayerEntry]


class FacetConfig(TypedDict):
    ajaxUrl: str
    totalRows: int
    totalPages: int


@dataclass
class Node:
    tag: str
    attrs: dict[str, str]
    children: list["Node"] = field(default_factory=list)
    parts: list["str | Node"] = field(default_factory=list)

    def append_text(self, value: str) -> None:
        self.parts.append(value)

    def append_child(self, child: "Node") -> None:
        self.children.append(child)
        self.parts.append(child)


class TreeBuilder(HTMLParser):
    VOID_TAGS = {
        "area",
        "base",
        "br",
        "col",
        "embed",
        "hr",
        "img",
        "input",
        "link",
        "meta",
        "param",
        "source",
        "track",
        "wbr",
    }

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.root = Node("root", {})
        self.stack = [self.root]

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        node = Node(tag, {key: value or "" for key, value in attrs})
        self.stack[-1].append_child(node)
        if tag not in self.VOID_TAGS:
            self.stack.append(node)

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        node = Node(tag, {key: value or "" for key, value in attrs})
        self.stack[-1].append_child(node)

    def handle_endtag(self, tag: str) -> None:
        for index in range(len(self.stack) - 1, 0, -1):
            if self.stack[index].tag == tag:
                self.stack = self.stack[:index]
                break

    def handle_data(self, data: str) -> None:
        self.stack[-1].append_text(data)


def normalize_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def escape_sql(value: str) -> str:
    return value.replace("'", "''")


def normalize_code(value: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", normalize_whitespace(value).upper())


def title_case_connector(value: str) -> str:
    return " ".join(word.capitalize() for word in normalize_whitespace(value).split(" "))


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def create_session() -> requests.Session:
    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT})
    return session


def parse_facet_config(page_html: str) -> FacetConfig:
    match = FWP_JSON_PATTERN.search(page_html)

    if not match:
        raise RuntimeError("Could not locate FacetWP configuration on the Mayco combinations page.")

    raw_config = json.loads(match.group(1))
    pager = (
        raw_config.get("preload_data", {})
        .get("settings", {})
        .get("pager", {})
    )
    ajax_url = normalize_whitespace(raw_config.get("ajaxurl", ""))
    total_rows = int(pager.get("total_rows") or 0)
    total_pages = int(pager.get("total_pages") or 0)

    if not ajax_url or total_rows <= 0 or total_pages <= 0:
        raise RuntimeError("Mayco FacetWP configuration did not include a usable AJAX URL or pager.")

    return {
        "ajaxUrl": ajax_url,
        "totalRows": total_rows,
        "totalPages": total_pages,
    }


def build_refresh_payload(page_number: int) -> dict[str, str]:
    return {
        "action": "facetwp_refresh",
        "data[http_params][uri]": "glaze-combinations",
        "data[template]": "glaze_combos",
        "data[extras][sort]": "default",
        "data[soft_refresh]": "0",
        "data[is_bfcache]": "1",
        "data[first_load]": "0",
        "data[paged]": str(page_number),
    }


def fetch_combo_page(session: requests.Session, facet_config: FacetConfig, page_number: int) -> dict[str, Any]:
    response = session.post(
        facet_config["ajaxUrl"],
        data=build_refresh_payload(page_number),
        timeout=60,
    )
    response.raise_for_status()
    payload = response.json()

    if not isinstance(payload, dict) or "template" not in payload:
        raise RuntimeError(f"Unexpected FacetWP response for page {page_number}.")

    return payload


def get_class_tokens(node: Node) -> set[str]:
    return {token for token in node.attrs.get("class", "").split() if token}


def inner_text(node: Node) -> str:
    fragments: list[str] = []

    for part in node.parts:
        if isinstance(part, str):
            fragments.append(part)
        else:
            fragments.append(inner_text(part))

    return normalize_whitespace(" ".join(fragment for fragment in fragments if fragment.strip()))


def find_all(node: Node, predicate) -> list[Node]:
    matches: list[Node] = []

    if predicate(node):
        matches.append(node)

    for child in node.children:
        matches.extend(find_all(child, predicate))

    return matches


def extract_product_code_and_name(label: str) -> tuple[str | None, str]:
    match = GLAZE_LABEL_PATTERN.match(normalize_whitespace(label))

    if not match:
        return None, normalize_whitespace(label)

    code, name = match.groups()
    return code, normalize_whitespace(name)


def derive_connector_sequence(title: str, labels: list[str]) -> list[str | None]:
    if len(labels) < 2:
        return [None for _ in labels]

    title_lower = title.lower()
    connectors: list[str | None] = []
    cursor = 0

    for current, following in zip(labels, labels[1:]):
        current_index = title_lower.find(current.lower(), cursor)
        following_index = title_lower.find(following.lower(), current_index + len(current))

        if current_index == -1 or following_index == -1:
            connectors.append(None)
            cursor = max(cursor, 0)
            continue

        connector = title_case_connector(
            title[current_index + len(current) : following_index].replace("/", " ")
        )
        connectors.append(connector or None)
        cursor = following_index

    connectors.append(None)
    return connectors


def source_key_from_recipe(
    title: str,
    cone: str | None,
    layers: list[LayerEntry],
    image_url: str,
) -> str:
    parts: list[str] = []

    for layer in layers:
        layer_token = (
            normalize_code(layer["glazeCode"]).lower()
            if layer["glazeCode"]
            else slugify(layer["glazeName"])
        )

        if layer_token:
            parts.append(layer_token)

        if layer["connectorToNext"]:
            parts.append(slugify(layer["connectorToNext"]))

    if cone:
        parts.append(slugify(cone))

    if parts:
        return "-".join(parts)

    path = urlparse(image_url).path
    stem = Path(path).stem

    if stem:
        return slugify(stem)

    return slugify(f"{title}-{cone or 'unknown'}")


def extract_upload_priority(image_url: str) -> int:
    match = re.search(r"/wp-content/uploads/(\d{4})/(\d{2})/", image_url)

    if not match:
        return 0

    year, month = match.groups()
    return int(year) * 100 + int(month)


def choose_preferred_entry(current: CombinationEntry, candidate: CombinationEntry) -> CombinationEntry:
    def score(entry: CombinationEntry) -> tuple[int, int, int, int]:
        image_url = entry["imageUrl"]
        return (
            0 if "woocommerce-placeholder" in image_url else 1,
            extract_upload_priority(image_url),
            sum(1 for layer in entry["layers"] if layer["sourceImageUrl"]),
            len(image_url),
        )

    return candidate if score(candidate) > score(current) else current


def dedupe_entries(entries: list[CombinationEntry]) -> tuple[list[CombinationEntry], int]:
    deduped: dict[str, CombinationEntry] = {}
    duplicate_rows = 0

    for entry in entries:
        source_key = entry["sourceKey"]
        existing = deduped.get(source_key)

        if existing is None:
            deduped[source_key] = entry
            continue

        duplicate_rows += 1
        deduped[source_key] = choose_preferred_entry(existing, entry)

    return list(deduped.values()), duplicate_rows


def parse_combo_entries(template_html: str) -> list[CombinationEntry]:
    parser = TreeBuilder()
    parser.feed(template_html)

    combo_nodes = find_all(
        parser.root,
        lambda node: node.tag == "div" and "combo" in get_class_tokens(node),
    )

    entries: list[CombinationEntry] = []

    for combo_node in combo_nodes:
        thumb_wrap = find_all(
            combo_node,
            lambda node: node.tag == "div" and "thumb-wrap" in get_class_tokens(node),
        )
        ou_images = find_all(
            combo_node,
            lambda node: node.tag == "div" and "ou-images" in get_class_tokens(node),
        )

        if not thumb_wrap or not ou_images:
            continue

        main_anchors = [node for node in find_all(thumb_wrap[0], lambda node: node.tag == "a")]
        layer_anchors = [node for node in find_all(ou_images[0], lambda node: node.tag == "a")]
        cone_nodes = find_all(
            ou_images[0],
            lambda node: node.tag == "div" and "fire-temp-tag" in get_class_tokens(node),
        )

        if not main_anchors or not layer_anchors:
            continue

        main_anchor = main_anchors[0]
        main_caption = normalize_whitespace(
            html.unescape(main_anchor.attrs.get("data-caption", "")).replace("’", "'")
        )
        image_url = normalize_whitespace(main_anchor.attrs.get("href", ""))
        cone = inner_text(cone_nodes[0]) if cone_nodes else None

        layer_labels = [
            normalize_whitespace(html.unescape(anchor.attrs.get("data-caption", "")))
            for anchor in layer_anchors
        ]
        connectors = derive_connector_sequence(main_caption, layer_labels)
        layers: list[LayerEntry] = []

        for index, (anchor, label) in enumerate(zip(layer_anchors, layer_labels)):
            glaze_code, glaze_name = extract_product_code_and_name(label)
            layers.append(
                {
                    "id": "",
                    "glazeCode": glaze_code,
                    "glazeName": glaze_name,
                    "layerOrder": index,
                    "connectorToNext": connectors[index],
                    "sourceImageUrl": normalize_whitespace(anchor.attrs.get("href", "")) or None,
                }
            )

        source_key = source_key_from_recipe(main_caption, cone, layers, image_url)
        example_id = str(uuid.uuid5(UUID_NAMESPACE, f"example:{source_key}"))
        for index, layer in enumerate(layers):
            layer["id"] = str(uuid.uuid5(UUID_NAMESPACE, f"layer:{source_key}:{index}"))

        entries.append(
            {
                "id": example_id,
                "sourceVendor": SOURCE_VENDOR,
                "sourceCollection": SOURCE_COLLECTION,
                "sourceKey": source_key,
                "sourceUrl": MAYCO_COMBINATIONS_URL,
                "title": f"{main_caption} ({cone})" if cone else main_caption,
                "imageUrl": image_url,
                "cone": cone,
                "atmosphere": ATMOSPHERE_BY_CONE.get(cone or ""),
                "clayBody": CLAY_BODY_BY_CONE.get(cone or ""),
                "applicationNotes": APPLICATION_NOTES,
                "firingNotes": FIRING_NOTES_BY_CONE.get(cone or ""),
                "layers": layers,
            }
        )

    return sorted(entries, key=lambda entry: ((entry["cone"] or ""), entry["title"].lower()))


def build_entries() -> list[CombinationEntry]:
    session = create_session()
    initial_page = session.get(MAYCO_COMBINATIONS_URL, timeout=30)
    initial_page.raise_for_status()
    facet_config = parse_facet_config(initial_page.text)

    raw_entries: list[CombinationEntry] = []

    for page_number in range(1, facet_config["totalPages"] + 1):
        payload = fetch_combo_page(session, facet_config, page_number)
        template_html = str(payload.get("template") or "")

        if not template_html.strip():
            raise RuntimeError(f"FacetWP page {page_number} returned an empty template.")

        page_entries = parse_combo_entries(template_html)
        raw_entries.extend(page_entries)
        print(
            f"Fetched Mayco combination page {page_number}/{facet_config['totalPages']} "
            f"({len(page_entries)} entries).",
            flush=True,
        )

    if len(raw_entries) != facet_config["totalRows"]:
        raise RuntimeError(
            f"Expected {facet_config['totalRows']} combinations from Mayco, parsed {len(raw_entries)}."
        )

    entries, duplicate_rows = dedupe_entries(raw_entries)
    print(
        f"Collapsed {duplicate_rows} duplicate Mayco rows into {len(entries)} unique combinations.",
        flush=True,
    )

    return sorted(entries, key=lambda entry: ((entry["cone"] or ""), entry["title"].lower()))


def glaze_lookup_sql(code: str | None) -> str:
    if not code:
        return "null"

    normalized = escape_sql(normalize_code(code))
    return (
        "("
        "select id from public.glazes "
        "where brand = 'Mayco' "
        "and created_by_user_id is null "
        "and regexp_replace(upper(coalesce(code, '')), '[^A-Z0-9]', '', 'g') = "
        f"'{normalized}' "
        "limit 1"
        ")"
    )


def sql_string(value: str | None) -> str:
    if value is None or not value.strip():
        return "null"

    return f"'{escape_sql(value)}'"


def create_sql(entries: list[CombinationEntry]) -> str:
    example_rows: list[str] = []
    layer_rows: list[str] = []

    for entry in entries:
        example_rows.append(
            "  ("
            f"'{escape_sql(entry['id'])}', "
            f"'{escape_sql(entry['sourceVendor'])}', "
            f"'{escape_sql(entry['sourceCollection'])}', "
            f"'{escape_sql(entry['sourceKey'])}', "
            f"'{escape_sql(entry['sourceUrl'])}', "
            f"'{escape_sql(entry['title'])}', "
            f"'{escape_sql(entry['imageUrl'])}', "
            f"{sql_string(entry['cone'])}, "
            f"{sql_string(entry['atmosphere'])}, "
            f"{sql_string(entry['clayBody'])}, "
            f"{sql_string(entry['applicationNotes'])}, "
            f"{sql_string(entry['firingNotes'])}"
            ")"
        )

        for layer in entry["layers"]:
            layer_rows.append(
                "  ("
                f"'{escape_sql(layer['id'])}', "
                f"'{escape_sql(entry['id'])}', "
                f"{glaze_lookup_sql(layer['glazeCode'])}, "
                f"{sql_string(layer['glazeCode'])}, "
                f"'{escape_sql(layer['glazeName'])}', "
                f"{layer['layerOrder']}, "
                f"{sql_string(layer['connectorToNext'])}, "
                f"{sql_string(layer['sourceImageUrl'])}"
                ")"
            )

    return "\n".join(
        [
            f"-- Generated by scripts/scrape_mayco_combinations.py from maycocolors.com on {date.today().isoformat()}.",
            "begin;",
            "",
            "delete from public.vendor_combination_examples",
            "where source_vendor = 'Mayco'",
            "  and source_collection = 'glaze-combinations';",
            "",
            "insert into public.vendor_combination_examples (",
            "  id,",
            "  source_vendor,",
            "  source_collection,",
            "  source_key,",
            "  source_url,",
            "  title,",
            "  image_url,",
            "  cone,",
            "  atmosphere,",
            "  clay_body,",
            "  application_notes,",
            "  firing_notes",
            ")",
            "values",
            ",\n".join(example_rows),
            ";",
            "",
            "insert into public.vendor_combination_example_layers (",
            "  id,",
            "  example_id,",
            "  glaze_id,",
            "  glaze_code,",
            "  glaze_name,",
            "  layer_order,",
            "  connector_to_next,",
            "  source_image_url",
            ")",
            "values",
            ",\n".join(layer_rows),
            ";",
            "",
            "commit;",
            "",
        ]
    )


def main() -> None:
    entries = build_entries()
    OUTPUT_JSON_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_SQL_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_JSON_PATH.write_text(f"{json.dumps(entries, indent=2)}\n", encoding="utf-8")
    OUTPUT_SQL_PATH.write_text(create_sql(entries), encoding="utf-8")
    print(f"Saved {len(entries)} Mayco combinations.", flush=True)
    print(f"JSON: {OUTPUT_JSON_PATH}", flush=True)
    print(f"SQL: {OUTPUT_SQL_PATH}", flush=True)


if __name__ == "__main__":
    main()
