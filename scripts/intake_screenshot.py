"""
Intake a local Facebook-style screenshot into external_example_intakes.

Usage:
    python scripts/intake_screenshot.py \
        --image "C:/path/Screenshot.png" \
        --caption "Opal lustre with dark flux" \
        --author "Jennifer Newman" \
        --group "Mayco Mud Room Society" \
        --crop 55,100,295,415 \
        [--cone "Cone 6"] [--clay "White stoneware"] \
        [--source-url https://www.facebook.com/...] \
        [--admin-email swan1995@gmail.com] \
        [--dry-run]

Skips (exit 2) when fewer than 2 glazes are matched in the caption — the
admin-review publish gate needs exactly 2 approved matches anyway.
"""
from __future__ import annotations

import argparse
import hashlib
import io
import json
import os
import re
import sys
import uuid
from pathlib import Path

import requests
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
GLAZES_PATH = ROOT / "data" / "catalog" / "glazes.json"
ENV_PATH = ROOT / ".env.local"
BUCKET = "external-example-imports"


def load_env() -> dict[str, str]:
    env = dict(os.environ)
    if ENV_PATH.exists():
        for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, _, v = line.partition("=")
            v = v.strip()
            if (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
                v = v[1:-1]
            env.setdefault(k.strip(), v)
    for required in ("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"):
        if not env.get(required):
            raise SystemExit(f"missing {required} in env")
    return env


def normalize_code(v: str | None) -> str:
    return re.sub(r"[^A-Z0-9]", "", (v or "").upper())


def normalize_search(v: str | None) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^A-Z0-9]+", " ", (v or "").upper())).strip()


def word_count(s: str) -> int:
    return len([w for w in s.split(" ") if w])


def exact_match_regex(label: str) -> re.Pattern[str]:
    escaped = re.escape(label).replace(r"\ ", r"\s+")
    return re.compile(rf"(^|[^A-Z0-9]){escaped}([^A-Z0-9]|$)", re.I)


def format_glaze_label(g: dict) -> str:
    parts = [x for x in (g.get("brand"), g.get("code"), g.get("name")) if x]
    return " ".join(parts)


def parse_caption(caption: str, glazes: list[dict]) -> list[dict]:
    norm_caption = normalize_search(caption)
    mentions: list[dict] = []
    matched_ids: set[str] = set()

    # 1. explicit code matches (e.g. SW-219, PC-42)
    for m in re.finditer(r"\b[A-Z]{1,4}-?\d{1,4}\b", caption.upper()):
        raw = m.group(0)
        code_n = normalize_code(raw)
        for g in glazes:
            if normalize_code(g.get("code")) == code_n and g["id"] not in matched_ids:
                matched_ids.add(g["id"])
                mentions.append({"text": raw, "glaze_id": g["id"], "confidence": 0.98})

    # 2. label / name matches on remaining glazes
    for g in glazes:
        if g["id"] in matched_ids:
            continue
        label = format_glaze_label(g)
        norm_label = normalize_search(label)
        norm_name = normalize_search(g.get("name"))
        has_label = (
            len(norm_label) >= 8
            and word_count(norm_label) >= 2
            and exact_match_regex(norm_label).search(norm_caption) is not None
        )
        has_name = (
            len(norm_name) >= 8
            and word_count(norm_name) >= 1
            and exact_match_regex(norm_name).search(norm_caption) is not None
        )
        if not has_label and not has_name:
            continue
        matched_ids.add(g["id"])
        mentions.append(
            {
                "text": label if has_label else g.get("name"),
                "glaze_id": g["id"],
                "confidence": 0.8 if has_label else 0.62,
            }
        )

    mentions.sort(key=lambda x: -x["confidence"])
    for i, m in enumerate(mentions):
        m["order"] = i
    return mentions


def extract_cone(caption: str) -> str | None:
    matches = re.findall(r"\bcone\s*(0?\d{1,2}(?:\s*[\/\-]\s*0?\d{1,2})?)\b", caption, re.I)
    if not matches:
        return None
    normalized: list[str] = []
    for raw in matches:
        parts = re.split(r"[/\-]", raw.replace(" ", ""))
        parts = [p if (len(p) > 1 and p.startswith("0")) else str(int(p)) for p in parts]
        normalized.append(" / ".join(f"Cone {p}" for p in parts))
    # dedupe preserving order
    seen: list[str] = []
    for v in normalized:
        if v not in seen:
            seen.append(v)
    return seen[0] if seen else None


def extract_atmosphere(caption: str) -> str | None:
    if re.search(r"\breduction\b", caption, re.I):
        return "Reduction"
    if re.search(r"\boxidation\b|\box\b", caption, re.I):
        return "Oxidation"
    return None


CLAY_PATTERNS: list[tuple[str, str]] = [
    (r"\bb-?mix\b", "B-Mix"),
    (r"\bporcelain\b", "Porcelain"),
    (r"\bwhite stoneware\b", "White stoneware"),
    (r"\bbrown stoneware\b", "Brown stoneware"),
    (r"\bspeckled buff\b", "Speckled buff"),
    (r"\bbuff stoneware\b", "Buff stoneware"),
    (r"\bstoneware\b", "Stoneware"),
    (r"\bearthenware\b", "Earthenware"),
    (r"\bterra cotta\b", "Terra cotta"),
]


def extract_clay(caption: str) -> str | None:
    for pattern, label in CLAY_PATTERNS:
        if re.search(pattern, caption, re.I):
            return label
    return None


def supabase_rest(method: str, env: dict, path: str, **kwargs) -> requests.Response:
    base = env["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
    headers = {
        "apikey": env["SUPABASE_SERVICE_ROLE_KEY"],
        "Authorization": f"Bearer {env['SUPABASE_SERVICE_ROLE_KEY']}",
    }
    headers.update(kwargs.pop("headers", {}))
    return requests.request(method, base + path, headers=headers, timeout=60, **kwargs)


def resolve_admin(env: dict, email: str | None) -> str:
    if email:
        encoded = requests.utils.quote(email, safe="")
        r = supabase_rest(
            "GET", env, f"/rest/v1/profiles?select=id,email&email=ilike.{encoded}&limit=1"
        )
        r.raise_for_status()
        rows = r.json()
        if rows:
            return rows[0]["id"]
    r = supabase_rest(
        "GET",
        env,
        "/rest/v1/profiles?select=id&is_admin=eq.true&order=created_at.asc&limit=1",
    )
    r.raise_for_status()
    rows = r.json()
    if not rows:
        raise SystemExit("no admin profile found for captured_by_user_id")
    return rows[0]["id"]


def main() -> int:
    ap = argparse.ArgumentParser(description="Import a local FB screenshot as an external-example intake row.")
    ap.add_argument("--image", required=True)
    ap.add_argument("--caption", required=True)
    ap.add_argument("--group", required=True, help="Facebook group label, e.g. 'Mayco Mud Room Society'")
    ap.add_argument("--author", default=None)
    ap.add_argument("--timestamp", default=None, help="Raw source timestamp string, optional")
    ap.add_argument("--crop", required=True, help="x1,y1,x2,y2 pixel box (pot-only region)")
    ap.add_argument("--source-url", default=None, help="Overrides default screenshot-intake URL")
    ap.add_argument("--admin-email", default="swan1995@gmail.com")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    glazes: list[dict] = json.loads(GLAZES_PATH.read_text(encoding="utf-8"))

    # Crop the screenshot to pot-only
    x1, y1, x2, y2 = [int(v) for v in args.crop.split(",")]
    im = Image.open(args.image).convert("RGB")
    cropped = im.crop((x1, y1, x2, y2))
    cw, ch = cropped.size
    buf = io.BytesIO()
    cropped.save(buf, format="PNG")
    crop_bytes = buf.getvalue()
    crop_sha = hashlib.sha256(crop_bytes).hexdigest()

    # Caption analysis
    mentions = parse_caption(args.caption, glazes)
    matched_count = sum(1 for m in mentions if m["glaze_id"])
    cone = extract_cone(args.caption)
    atmosphere = extract_atmosphere(args.caption)
    clay = extract_clay(args.caption)

    default_url = f"https://www.facebook.com/screenshot-intake/{crop_sha}"
    source_url = args.source_url or default_url

    print(f"image:     {args.image}")
    print(f"caption:   {args.caption!r}")
    print(f"author:    {args.author}")
    print(f"group:     {args.group}")
    print(f"crop:      {cw}x{ch}  sha256={crop_sha[:12]}...")
    print(f"cone:      {cone}")
    print(f"atmos:     {atmosphere}")
    print(f"clay:      {clay}")
    print(f"matched:   {matched_count} glaze(s)")
    for m in mentions:
        g = next((g for g in glazes if g["id"] == m["glaze_id"]), None)
        if g:
            print(f"  -> {m['text']!r} = {g['brand']} {g['code']} {g['name']} (conf {m['confidence']})")
    print(f"source_url: {source_url}")

    if matched_count < 2:
        print("\nSKIP: fewer than 2 glazes matched — single-glaze filter.")
        return 2

    if args.dry_run:
        print("\nDRY RUN: no DB writes performed.")
        return 0

    env = load_env()
    admin_id = resolve_admin(env, args.admin_email)
    print(f"captured_by_user_id: {admin_id}")

    # Dedupe by URL
    encoded_url = requests.utils.quote(source_url, safe="")
    r = supabase_rest(
        "GET",
        env,
        f"/rest/v1/external_example_intakes?select=id&source_platform=eq.facebook&source_url=eq.{encoded_url}",
    )
    r.raise_for_status()
    existing = r.json()
    if existing:
        print(f"SKIP: source_url already exists as intake {existing[0]['id']}")
        return 3

    # Dedupe by asset hash (mark as duplicate, still insert so admin can see it)
    r = supabase_rest("GET", env, f"/rest/v1/external_example_assets?select=intake_id&sha256=eq.{crop_sha}")
    r.raise_for_status()
    sha_existing = r.json()
    duplicate_of = sha_existing[0]["intake_id"] if sha_existing else None

    parser_output = {
        "extractedCone": cone,
        "extractedAtmosphere": atmosphere,
        "extractedClayBody": clay,
        "matchedTerms": [m["text"] for m in mentions],
        "duplicateSourceUrl": False,
        "duplicateSha256s": [crop_sha] if duplicate_of else [],
    }

    intake_payload = {
        "source_platform": "facebook",
        "group_label": args.group,
        "source_url": source_url,
        "raw_caption": args.caption,
        "raw_author_display_name": args.author,
        "raw_source_timestamp": args.timestamp,
        "captured_by_user_id": admin_id,
        "privacy_mode": "anonymous",
        "review_status": "duplicate" if duplicate_of else "queued",
        "parser_output": parser_output,
        "duplicate_of_intake_id": duplicate_of,
    }
    r = supabase_rest(
        "POST",
        env,
        "/rest/v1/external_example_intakes",
        headers={"Content-Type": "application/json", "Prefer": "return=representation"},
        data=json.dumps(intake_payload),
    )
    if r.status_code not in (200, 201):
        print("intake insert failed:", r.status_code, r.text)
        return 1
    intake_id = r.json()[0]["id"]
    print(f"intake inserted: {intake_id}")

    # Upload crop to bucket
    storage_path = f"{intake_id}/1-{uuid.uuid4()}.png"
    r = supabase_rest(
        "POST",
        env,
        f"/storage/v1/object/{BUCKET}/{storage_path}",
        headers={"Content-Type": "image/png"},
        data=crop_bytes,
    )
    if r.status_code not in (200, 201):
        print("storage upload failed:", r.status_code, r.text)
        return 1
    print(f"asset uploaded: {storage_path}")

    asset_payload = {
        "intake_id": intake_id,
        "storage_path": storage_path,
        "source_image_url": None,
        "capture_method": "screenshot",
        "width": cw,
        "height": ch,
        "sha256": crop_sha,
        "sort_order": 0,
    }
    r = supabase_rest(
        "POST",
        env,
        "/rest/v1/external_example_assets",
        headers={"Content-Type": "application/json"},
        data=json.dumps(asset_payload),
    )
    if r.status_code not in (200, 201, 204):
        print("asset insert failed:", r.status_code, r.text)
        return 1

    if mentions:
        mention_rows = [
            {
                "intake_id": intake_id,
                "freeform_text": m["text"],
                "matched_glaze_id": m["glaze_id"],
                "confidence": m["confidence"],
                "mention_order": m["order"],
                "is_approved": False,
            }
            for m in mentions
        ]
        r = supabase_rest(
            "POST",
            env,
            "/rest/v1/external_example_glaze_mentions",
            headers={"Content-Type": "application/json"},
            data=json.dumps(mention_rows),
        )
        if r.status_code not in (200, 201, 204):
            print("mentions insert failed:", r.status_code, r.text)
            return 1

    print(f"\nSUCCESS  intake_id={intake_id}  status={'duplicate' if duplicate_of else 'queued'}")
    print(f"Review at: /admin/intake/{intake_id}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
