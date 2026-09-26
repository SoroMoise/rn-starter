#!/usr/bin/env python3
"""Draws the app's mark into every brand asset the mobile app ships.

    pip install pillow && python3 scripts/generate-brand-assets.py

A maintainer's tool, not a build step: the PNGs are committed, and this script is
the only way they change. Each output carries a constraint that stays invisible
until a store or a launcher enforces it:

- images/icon.png — the store icon, 1024 px, full bleed, flattened to RGB. Both
  stores cut their own corners, so a rounded plate drawn here fights their mask,
  and Expo flattens any transparency onto white for iOS anyway.
- images/adaptive-icon.png — Android's foreground layer, over transparency. The
  launcher shows the central 72 dp of a 108 dp layer and only guarantees a 66 dp
  circle, so the mark is drawn at two thirds of its size on the store icon; the
  layer behind it is `android.adaptiveIcon.backgroundColor`.
- images/splash-icon.png — over transparency. Android 12+ draws the splash image
  200 dp wide in a 288 dp canvas and cuts it to a 192 dp circle, so a plate would
  show as a disc; `splash.backgroundColor` fills the screen behind the mark.
- notification-icon.png — a silhouette: Android paints every non-transparent pixel
  with the system tint and discards the colours, so it is pure white.
- apps/web/app/icon.png and apple-icon.png — the site's favicon and home-screen
  icon, the store icon at their sizes. Skipped once apps/web is gone.

BACKGROUND must equal `splash.backgroundColor` and
`android.adaptiveIcon.backgroundColor` in apps/mobile/app.config.js.

The mark is a deliberate placeholder. Replace draw_mark() and re-run — never
hand-patch a PNG.
"""

from pathlib import Path

from PIL import Image, ImageDraw

REPO_ROOT = Path(__file__).resolve().parents[1]
ASSETS = REPO_ROOT / "apps/mobile/assets"
WEB_APP = REPO_ROOT / "apps/web/app"

BACKGROUND = (0x63, 0x66, 0xF1)  # #6366f1
WHITE = (255, 255, 255, 255)
TRANSPARENT = (255, 255, 255, 0)
SUPERSAMPLE = 4

# Width of the mark as a fraction of each canvas.
ICON_EXTENT = 0.56
ADAPTIVE_EXTENT = ICON_EXTENT * 72 / 108
SPLASH_EXTENT = 0.5
NOTIFICATION_EXTENT = 0.72


def draw_mark(draw: ImageDraw.ImageDraw, size: int, extent: float) -> None:
    side = size * extent
    start = (size - side) / 2
    draw.rounded_rectangle(
        (start, start, start + side, start + side),
        radius=side * 0.306,
        outline=WHITE,
        width=round(side * 0.139),
    )

    core = side * 0.222
    centre = size / 2
    draw.ellipse(
        (centre - core / 2, centre - core / 2, centre + core / 2, centre + core / 2),
        fill=WHITE,
    )


def render(size: int, extent: float, background: tuple[int, int, int] | None = None) -> Image.Image:
    canvas = size * SUPERSAMPLE
    image = Image.new("RGBA", (canvas, canvas), (*background, 255) if background else TRANSPARENT)
    draw_mark(ImageDraw.Draw(image), canvas, extent)
    return image.resize((size, size), Image.LANCZOS)


def main() -> None:
    outputs = {
        ASSETS / "images/icon.png": render(1024, ICON_EXTENT, BACKGROUND).convert("RGB"),
        ASSETS / "images/adaptive-icon.png": render(1024, ADAPTIVE_EXTENT),
        ASSETS / "images/splash-icon.png": render(1024, SPLASH_EXTENT),
        ASSETS / "notification-icon.png": render(192, NOTIFICATION_EXTENT),
        WEB_APP / "icon.png": render(512, ICON_EXTENT, BACKGROUND).convert("RGB"),
        WEB_APP / "apple-icon.png": render(180, ICON_EXTENT, BACKGROUND).convert("RGB"),
    }
    for path, image in outputs.items():
        if not path.parent.is_dir():
            print(f"skipped {path.relative_to(REPO_ROOT)}: {path.parent.relative_to(REPO_ROOT)} is gone")
            continue
        image.save(path, "PNG", optimize=True)
        print(f"wrote {path.relative_to(REPO_ROOT)} ({image.width}x{image.height} {image.mode})")


if __name__ == "__main__":
    main()
