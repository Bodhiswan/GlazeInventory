from __future__ import annotations

import colorsys
import concurrent.futures
import json
from io import BytesIO
from pathlib import Path

import requests
from PIL import Image


USER_AGENT = "GlazeInventoryCatalogBot/1.0 (+https://glazeinventory.com)"
MAYCO_INPUT_PATH = Path("data/vendors/mayco-glazes.json")
MAYCO_EXISTING_PATH = Path("data/vendors/mayco-visual-traits.json")
AMACO_INPUT_PATH = Path("data/vendors/amaco-glazes.json")
COYOTE_INPUT_PATH = Path("data/vendors/coyote-glazes.json")
DUNCAN_INPUT_PATH = Path("data/vendors/duncan-glazes.json")
SPECTRUM_INPUT_PATH = Path("data/vendors/spectrum-glazes.json")
SPEEDBALL_INPUT_PATH = Path("data/vendors/speedball-glazes.json")
CHRYSANTHOS_INPUT_PATH = Path("data/vendors/chrysanthos-glazes.json")
LAGUNA_INPUT_PATH = Path("data/vendors/laguna-glazes.json")
NORTHCOTE_INPUT_PATH = Path("data/vendors/northcote-glazes.json")
BOTZ_INPUT_PATH = Path("data/vendors/botz-glazes.json")
OUTPUT_PATH = Path("data/vendors/vendor-visual-traits.json")


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


def is_bright_neutral(r: int, g: int, b: int) -> bool:
    return max(r, g, b) >= 232 and max(r, g, b) - min(r, g, b) <= 18


def infer_background_color(image: Image.Image) -> tuple[int, int, int] | None:
    if image.width < 3 or image.height < 3:
        return None

    border_depth = max(1, min(image.width, image.height) // 18)
    pixels = image.load()
    samples: list[tuple[int, int, int]] = []

    for y in range(image.height):
        for x in range(image.width):
            if x < border_depth or y < border_depth or x >= image.width - border_depth or y >= image.height - border_depth:
                samples.append(pixels[x, y])

    bright_neutral_samples = [sample for sample in samples if is_bright_neutral(*sample)]

    if len(bright_neutral_samples) < max(16, len(samples) // 5):
        return None

    count = len(bright_neutral_samples)
    return (
        round(sum(sample[0] for sample in bright_neutral_samples) / count),
        round(sum(sample[1] for sample in bright_neutral_samples) / count),
        round(sum(sample[2] for sample in bright_neutral_samples) / count),
    )


def matches_background(pixel: tuple[int, int, int], background: tuple[int, int, int] | None) -> bool:
    if background is None:
        return False

    r, g, b = pixel
    bg_r, bg_g, bg_b = background

    return (
        is_bright_neutral(r, g, b)
        and abs(r - bg_r) <= 18
        and abs(g - bg_g) <= 18
        and abs(b - bg_b) <= 18
    )


def normalize_code(value: str | None) -> str:
    return "".join(character for character in (value or "").upper() if character.isalnum())


def make_key(brand: str, code: str | None) -> str:
    return f"{brand}|{normalize_code(code)}"


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
        background_color = infer_background_color(image)

        counts: dict[str, int] = {}
        total = 0

        pixels = image.load()

        for y in range(image.height):
            for x in range(image.width):
                red, green, blue = pixels[x, y]
                if matches_background((red, green, blue), background_color):
                    continue
                label = classify_pixel(red, green, blue)
                counts[label] = counts.get(label, 0) + 1
                total += 1

        if total == 0:
            for y in range(image.height):
                for x in range(image.width):
                    red, green, blue = pixels[x, y]
                    label = classify_pixel(red, green, blue)
                    counts[label] = counts.get(label, 0) + 1
                    total += 1

    ranked = sorted(counts.items(), key=lambda item: item[1], reverse=True)
    ranked = [(label, count) for label, count in ranked if label != "White"]
    kept = [label for label, count in ranked if count / max(total, 1) >= 0.045][:5]

    if not kept:
        kept = [label for label, _count in ranked[:3]]

    weights = {
        label: round(count / max(total, 1), 4)
        for label, count in ranked
        if count / max(total, 1) >= 0.015
    }

    return kept, weights


def process_entry(brand: str, entry: dict[str, str | None]) -> tuple[str, dict[str, object]]:
    code = entry.get("code") or ""
    image_url = entry.get("imageUrl")
    key = make_key(brand, code)

    if not code:
        raise RuntimeError(f"{brand} entry is missing a code.")

    if not image_url:
        return key, {"imageColors": [], "imageColorWeights": {}}

    try:
        colors, weights = infer_colors(image_url)
        return key, {"imageColors": colors, "imageColorWeights": weights}
    except Exception:
        return key, {"imageColors": [], "imageColorWeights": {}}


def load_json(path: Path) -> object:
    return json.loads(path.read_text(encoding="utf-8"))


def load_existing_mayco_profiles() -> dict[str, dict[str, object]]:
    if not MAYCO_EXISTING_PATH.exists():
        return {}

    raw = load_json(MAYCO_EXISTING_PATH)

    if not isinstance(raw, dict):
        return {}

    output: dict[str, dict[str, object]] = {}

    for code, payload in raw.items():
        if isinstance(payload, dict):
            output[make_key("Mayco", code)] = payload

    return output


def build_profiles(brand: str, input_path: Path) -> dict[str, dict[str, object]]:
    entries = load_json(input_path)

    if not isinstance(entries, list):
        return {}

    output: dict[str, dict[str, object]] = {}

    with concurrent.futures.ThreadPoolExecutor(max_workers=12) as executor:
        future_map = {
            executor.submit(process_entry, brand, entry): entry
            for entry in entries
            if isinstance(entry, dict)
        }

        for index, future in enumerate(concurrent.futures.as_completed(future_map), start=1):
            key, payload = future.result()
            output[key] = payload

            if index % 40 == 0 or index == len(future_map):
                print(f"{brand}: inferred colors for {index}/{len(future_map)} glazes", flush=True)

    return output


def main() -> None:
    output = load_existing_mayco_profiles()
    output.update(build_profiles("AMACO", AMACO_INPUT_PATH))
    output.update(build_profiles("Coyote", COYOTE_INPUT_PATH))
    output.update(build_profiles("Duncan", DUNCAN_INPUT_PATH))
    output.update(build_profiles("Spectrum", SPECTRUM_INPUT_PATH))
    output.update(build_profiles("Speedball", SPEEDBALL_INPUT_PATH))
    output.update(build_profiles("Chrysanthos", CHRYSANTHOS_INPUT_PATH))
    output.update(build_profiles("Laguna", LAGUNA_INPUT_PATH))
    output.update(build_profiles("Northcote", NORTHCOTE_INPUT_PATH))
    output.update(build_profiles("BOTZ", BOTZ_INPUT_PATH))

    OUTPUT_PATH.write_text(f"{json.dumps(output, indent=2)}\n", encoding="utf-8")
    print(f"Saved {len(output)} vendor visual trait profiles to {OUTPUT_PATH}", flush=True)


if __name__ == "__main__":
    main()
