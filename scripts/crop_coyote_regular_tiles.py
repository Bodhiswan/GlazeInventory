"""Crop Coyote's split Regular/Slow primary tiles down to Regular only."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageStat


DEFAULT_SOURCE_DIR = Path("public/vendor-images/coyote")
DIVIDER_SEARCH_RADIUS = 70
DIVIDER_LUMINANCE_LIMIT = 28
MIN_DIVIDER_WIDTH = 3


def column_luminance(image: Image.Image, x: int) -> float:
    column = image.crop((x, 0, x + 1, image.height)).convert("L")
    return ImageStat.Stat(column).mean[0]


def find_divider_start(image: Image.Image) -> int | None:
    width, height = image.size
    if width <= height * 1.2:
        return None

    center = width // 2
    start = max(1, center - DIVIDER_SEARCH_RADIUS)
    end = min(width - 1, center + DIVIDER_SEARCH_RADIUS)
    dark_columns = [
        x
        for x in range(start, end + 1)
        if column_luminance(image, x) <= DIVIDER_LUMINANCE_LIMIT
    ]

    runs: list[tuple[int, int]] = []
    run_start: int | None = None
    previous: int | None = None
    for x in dark_columns:
        if run_start is None or previous is None or x != previous + 1:
            if run_start is not None and previous is not None:
                runs.append((run_start, previous))
            run_start = x
        previous = x
    if run_start is not None and previous is not None:
        runs.append((run_start, previous))

    divider_runs = [
        (run_start, run_end)
        for run_start, run_end in runs
        if run_end - run_start + 1 >= MIN_DIVIDER_WIDTH
    ]
    if not divider_runs:
        return None

    divider_start, _ = min(divider_runs, key=lambda run: abs(((run[0] + run[1]) / 2) - center))
    return divider_start


def process_tile(path: Path) -> bool:
    with Image.open(path) as source:
        divider_start = find_divider_start(source)
        if divider_start is None:
            return False

        cropped = source.convert("RGB").crop((0, 0, divider_start, source.height))
        cropped.save(path, format="JPEG", quality=95, optimize=True)
        return True


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--source-dir",
        type=Path,
        default=DEFAULT_SOURCE_DIR,
        help=f"Directory of Coyote primary tile images (default: {DEFAULT_SOURCE_DIR})",
    )
    args = parser.parse_args()

    paths = sorted(args.source_dir.glob("*.jpg"))
    processed = sum(process_tile(path) for path in paths)
    print(f"Coyote tiles scanned: {len(paths)}")
    print(f"Coyote Regular tiles cropped: {processed}")
    print(f"Coyote tiles left unchanged: {len(paths) - processed}")


if __name__ == "__main__":
    main()
