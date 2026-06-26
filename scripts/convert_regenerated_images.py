from pathlib import Path

from PIL import Image, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[1]

SOURCES = [
    (
        Path(r"C:\Users\utente\iCloudDrive\Iconic\Iconic Wall\Presentazione progetto\Immagini\ChatGPT Image 25 giu 2026, 07_40_34.png"),
        ROOT / "assets" / "gallery" / "regenerated-frame-books.webp",
        1800,
    ),
    (
        Path(r"C:\Users\utente\iCloudDrive\Iconic\Iconic Wall\Presentazione progetto\Immagini\ChatGPT Image 25 giu 2026, 07_42_10.png"),
        ROOT / "assets" / "gallery" / "regenerated-wood-living.webp",
        2400,
    ),
]


def convert(src: Path, dst: Path, max_width: int) -> None:
    image = Image.open(src).convert("RGB")
    image = ImageOps.exif_transpose(image)

    if image.width > max_width:
        height = round(image.height * max_width / image.width)
        image = image.resize((max_width, height), Image.Resampling.LANCZOS)

    image = image.filter(ImageFilter.UnsharpMask(radius=1.1, percent=115, threshold=3))
    dst.parent.mkdir(parents=True, exist_ok=True)
    image.save(dst, "WEBP", quality=93, method=6)
    print(f"{dst.relative_to(ROOT)} {image.size[0]}x{image.size[1]}")


for source, destination, width in SOURCES:
    convert(source, destination, width)
