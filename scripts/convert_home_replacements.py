from pathlib import Path

from PIL import Image, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[1]

REPLACEMENTS = [
    (
        Path(r"C:\Users\utente\iCloudDrive\Iconic\Marketing\Sito Web\Fatto da ChatGPT\Immagini\Immagini HQ nuove\ChatGPT Image 25 giu 2026, 08_58_18.png"),
        ROOT / "assets" / "gallery" / "home-bottom-wood-wall.webp",
    ),
    (
        Path(r"C:\Users\utente\iCloudDrive\Iconic\Marketing\Sito Web\Fatto da ChatGPT\Immagini\ChatGPT Image 20 giu 2026, 11_32_53.png"),
        ROOT / "assets" / "gallery" / "home-accessories-function.webp",
    ),
]


for source, destination in REPLACEMENTS:
    image = ImageOps.exif_transpose(Image.open(source).convert("RGB"))
    image = image.filter(ImageFilter.UnsharpMask(radius=1.05, percent=105, threshold=3))
    destination.parent.mkdir(parents=True, exist_ok=True)
    image.save(destination, "WEBP", quality=94, method=6)
    print(f"{destination.relative_to(ROOT)} {image.width}x{image.height}")
