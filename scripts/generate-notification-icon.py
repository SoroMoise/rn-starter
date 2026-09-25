#!/usr/bin/env python3
"""Regenerates apps/mobile/assets/notification-icon.png.

Android renders a notification icon as a SILHOUETTE: every non-transparent pixel
is painted with the system tint and the colours are discarded. Only the alpha
channel carries meaning, so the source must be pure white over transparency and
must never rely on colour or on a background plate.

This ships a deliberately neutral placeholder mark. Replace the geometry here and
re-run the script — never hand-patch the PNG.
"""

from pathlib import Path

from PIL import Image, ImageDraw

SIZE = 192
OUTPUT = Path(__file__).resolve().parents[1] / "apps/mobile/assets/notification-icon.png"

# Android reserves the outer ~10% of the canvas as optical padding.
PADDING = round(SIZE * 0.14)
STROKE = round(SIZE * 0.10)
RADIUS = round(SIZE * 0.22)
CORE = round(SIZE * 0.16)

WHITE = (255, 255, 255, 255)


def build() -> Image.Image:
    image = Image.new("RGBA", (SIZE, SIZE), (255, 255, 255, 0))
    draw = ImageDraw.Draw(image)

    draw.rounded_rectangle(
        (PADDING, PADDING, SIZE - PADDING, SIZE - PADDING),
        radius=RADIUS,
        outline=WHITE,
        width=STROKE,
    )

    centre = SIZE / 2
    draw.ellipse(
        (centre - CORE / 2, centre - CORE / 2, centre + CORE / 2, centre + CORE / 2),
        fill=WHITE,
    )

    return image


if __name__ == "__main__":
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    build().save(OUTPUT, "PNG", optimize=True)
    print(f"wrote {OUTPUT} ({SIZE}x{SIZE})")
