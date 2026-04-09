from __future__ import annotations

import concurrent.futures
import json
from io import BytesIO
from pathlib import Path

import requests
from PIL import Image

from infer_vendor_visual_traits import (
    WHITE_DOMINANT_SHARE,
    classify_pixel,
    detect_glare_mask,
    get_center_weight,
    infer_background_color,
    matches_background,
    rgb_to_hex,
)


USER_AGENT = "GlazeInventoryCatalogBot/1.0 (+https://glazeinventory.com)"
INPUT_PATH = Path("data/vendors/mayco-glazes.json")
OUTPUT_PATH = Path("data/vendors/mayco-visual-traits.json")

def infer_colors(image_url: str) -> tuple[list[str], dict[str, float], list[dict[str, object]]]:
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
        background_color = infer_background_color(image)
        glare_pixels = detect_glare_mask(image, background_color)

        counts: dict[str, float] = {}
        rgb_totals: dict[str, tuple[float, float, float]] = {}
        total = 0.0

        pixels = image.load()

        for y in range(image.height):
            for x in range(image.width):
                red, green, blue = pixels[x, y]

                if matches_background((red, green, blue), background_color):
                    continue

                if (x, y) in glare_pixels:
                    continue

                label = classify_pixel(red, green, blue)
                weight = get_center_weight(x, y, image.width, image.height)
                counts[label] = counts.get(label, 0.0) + weight
                current_red, current_green, current_blue = rgb_totals.get(label, (0.0, 0.0, 0.0))
                rgb_totals[label] = (
                    current_red + red * weight,
                    current_green + green * weight,
                    current_blue + blue * weight,
                )
                total += weight

        if total <= 0:
            for y in range(image.height):
                for x in range(image.width):
                    red, green, blue = pixels[x, y]
                    label = classify_pixel(red, green, blue)
                    weight = get_center_weight(x, y, image.width, image.height)
                    counts[label] = counts.get(label, 0.0) + weight
                    current_red, current_green, current_blue = rgb_totals.get(label, (0.0, 0.0, 0.0))
                    rgb_totals[label] = (
                        current_red + red * weight,
                        current_green + green * weight,
                        current_blue + blue * weight,
                    )
                    total += weight

    ranked = sorted(counts.items(), key=lambda item: item[1], reverse=True)
    white_share = counts.get("White", 0.0) / max(total, 1.0)

    if white_share < WHITE_DOMINANT_SHARE and len(ranked) > 1:
        ranked = [(label, count) for label, count in ranked if label != "White"]

    kept = [
        label
        for label, count in ranked
        if count / max(total, 1.0) >= 0.045
    ][:5]

    if not kept:
        kept = [label for label, _count in ranked[:3]]

    weights = {
        label: round(count / max(total, 1.0), 4)
        for label, count in ranked
        if count / max(total, 1.0) >= 0.015
    }

    palette = []

    for label, count in ranked[:4]:
        if count / max(total, 1.0) < 0.03:
            continue

        total_red, total_green, total_blue = rgb_totals[label]
        average_rgb = (
            round(total_red / max(count, 0.0001)),
            round(total_green / max(count, 0.0001)),
            round(total_blue / max(count, 0.0001)),
        )
        palette.append(
            {
                "label": label,
                "hex": rgb_to_hex(average_rgb),
                "weight": round(count / max(total, 1.0), 4),
            }
        )

    return kept, weights, palette


def process_entry(entry: dict[str, str | None]) -> tuple[str, dict[str, object]]:
    code = entry.get("code") or ""
    image_url = entry.get("imageUrl")

    if not code:
        raise RuntimeError("Mayco entry is missing a code.")

    if not image_url:
        return code, {"imageColors": [], "imageColorWeights": {}, "imagePalette": []}

    try:
        colors, weights, palette = infer_colors(image_url)
        return code, {"imageColors": colors, "imageColorWeights": weights, "imagePalette": palette}
    except Exception:
        return code, {"imageColors": [], "imageColorWeights": {}, "imagePalette": []}


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
