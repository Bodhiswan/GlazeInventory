from __future__ import annotations

import colorsys
import concurrent.futures
import json
from io import BytesIO
from pathlib import Path

import requests
from PIL import Image


USER_AGENT = "GlazeLibraryCatalogBot/1.0 (+https://glaze-library.app)"
INPUT_PATH = Path("data/vendors/mayco-glazes.json")
OUTPUT_PATH = Path("data/vendors/mayco-visual-traits.json")


def classify_pixel(r: int, g: int, b: int) -> str:
    hue, sat, val = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    hue *= 360

    if sat < 0.12:
        if val > 0.9:
            return "White"
        if val < 0.18:
            return "Black"
        if 25 <= hue <= 75 and val > 0.72:
            return "Cream"
        return "Grey"

    if hue < 12 or hue >= 350:
        return "Maroon" if val < 0.42 else "Red"

    if hue < 24:
        if val > 0.72 and sat < 0.7:
            return "Coral"
        return "Orange"

    if hue < 45:
        if val < 0.45:
            return "Brown"
        if sat < 0.45:
            return "Amber"
        return "Gold"

    if hue < 66:
        if val < 0.55:
            return "Olive"
        return "Yellow"

    if hue < 95:
        return "Olive" if val < 0.55 else "Green"

    if hue < 150:
        if sat < 0.25 and val > 0.5:
            return "Sage"
        return "Green"

    if hue < 178:
        return "Teal"

    if hue < 205:
        return "Aqua" if val > 0.65 else "Teal"

    if hue < 238:
        return "Navy" if val < 0.42 else "Blue"

    if hue < 262:
        return "Indigo"

    if hue < 292:
        return "Purple"

    if hue < 320:
        return "Lavender" if sat < 0.35 else "Pink"

    if val < 0.46:
        return "Burgundy"

    return "Pink"


def infer_colors(image_url: str) -> tuple[list[str], dict[str, float]]:
    response = requests.get(
        image_url,
        headers={"User-Agent": USER_AGENT},
        timeout=30,
    )
    response.raise_for_status()

    with Image.open(BytesIO(response.content)) as image:
        image = image.convert("RGB")
        width, height = image.size
        left = int(width * 0.15)
        top = int(height * 0.15)
        right = int(width * 0.85)
        bottom = int(height * 0.85)
        image = image.crop((left, top, right, bottom))
        image.thumbnail((72, 72))

        counts: dict[str, int] = {}
        total = 0

        for red, green, blue in list(image.getdata()):
            label = classify_pixel(red, green, blue)
            counts[label] = counts.get(label, 0) + 1
            total += 1

    ranked = sorted(counts.items(), key=lambda item: item[1], reverse=True)
    kept = [
        label
        for label, count in ranked
        if count / max(total, 1) >= 0.045
    ][:5]

    if not kept:
        kept = [label for label, _count in ranked[:3]]

    weights = {
        label: round(count / max(total, 1), 4)
        for label, count in ranked
        if count / max(total, 1) >= 0.015
    }

    return kept, weights


def process_entry(entry: dict[str, str | None]) -> tuple[str, dict[str, object]]:
    code = entry.get("code") or ""
    image_url = entry.get("imageUrl")

    if not code:
        raise RuntimeError("Mayco entry is missing a code.")

    if not image_url:
        return code, {"imageColors": [], "imageColorWeights": {}}

    try:
        colors, weights = infer_colors(image_url)
        return code, {"imageColors": colors, "imageColorWeights": weights}
    except Exception:
        return code, {"imageColors": [], "imageColorWeights": {}}


def main() -> None:
    entries = json.loads(INPUT_PATH.read_text(encoding="utf-8"))
    output: dict[str, dict[str, object]] = {}

    with concurrent.futures.ThreadPoolExecutor(max_workers=12) as executor:
        future_map = {executor.submit(process_entry, entry): entry for entry in entries}

        for index, future in enumerate(concurrent.futures.as_completed(future_map), start=1):
            code, payload = future.result()
            output[code] = payload

            if index % 50 == 0 or index == len(entries):
                print(f"Inferred colors for {index}/{len(entries)} Mayco glazes...", flush=True)

    OUTPUT_PATH.write_text(f"{json.dumps(output, indent=2)}\n", encoding="utf-8")
    print(f"Saved {len(output)} Mayco visual trait profiles to {OUTPUT_PATH}", flush=True)


if __name__ == "__main__":
    main()
