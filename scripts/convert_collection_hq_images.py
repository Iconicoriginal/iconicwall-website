from pathlib import Path

from PIL import Image, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(r"C:\Users\utente\iCloudDrive\Iconic\Marketing\Sito Web\Fatto da ChatGPT\Immagini\Immagini HQ nuove")

IMAGES = {
    "ChatGPT Image 25 giu 2026, 07_40_34.png": ("collection-frame-hq.webp", 1800),
    "ChatGPT Image 25 giu 2026, 07_42_10.png": ("collection-flat-hq.webp", 2200),
    "ChatGPT Image 25 giu 2026, 08_07_42.png": ("collection-lux-hq.webp", 1800),
    "ChatGPT Image 25 giu 2026, 08_09_41.png": ("collection-shelf-hq.webp", 1800),
}


def convert(src: Path, dst: Path, max_width: int) -> None:
    image = ImageOps.exif_transpose(Image.open(src).convert("RGB"))
    if image.width > max_width:
        height = round(image.height * max_width / image.width)
        image = image.resize((max_width, height), Image.Resampling.LANCZOS)

    image = image.filter(ImageFilter.UnsharpMask(radius=1.05, percent=110, threshold=3))
    dst.parent.mkdir(parents=True, exist_ok=True)
    image.save(dst, "WEBP", quality=94, method=6)
    print(f"{dst.relative_to(ROOT)} {image.width}x{image.height}")


for filename, (output_name, width) in IMAGES.items():
    convert(SOURCE / filename, ROOT / "assets" / "gallery" / output_name, width)
