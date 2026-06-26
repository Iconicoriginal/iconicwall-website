from pathlib import Path

from PIL import Image, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[1]
LOGO_SOURCE = Path(r"C:\Users\utente\iCloudDrive\Iconic\Marketing\Materiale\Loghi 3M\3M_DI_NOC_logo.png")
PHOTO_SOURCE = Path(r"C:\Users\utente\iCloudDrive\Iconic\Marketing\Materiale\Foto 3M")

LOGO_DEST = ROOT / "brand" / "3m" / "logo-3m-dinoc.png"
PHOTOS = [
    (
        PHOTO_SOURCE / "3M™-DI-NOC™-Architectural-Finishes-Artisanal-Series-Group-Image-B.jpg",
        ROOT / "materials" / "3m" / "photos" / "dinoc-artisanal-samples.webp",
    ),
    (
        PHOTO_SOURCE / "3M™-DI-NOC™-Architectural-Finishes-Metallic-Palette-Group-Image-B.jpg",
        ROOT / "materials" / "3m" / "photos" / "dinoc-metallic-rolls.webp",
    ),
    (
        PHOTO_SOURCE / "3M™-DI-NOC™-Architectural-Finishes-Premium-Wood-Group-Image-E.jpg",
        ROOT / "materials" / "3m" / "photos" / "dinoc-wood-samples.webp",
    ),
]

LOGO_DEST.parent.mkdir(parents=True, exist_ok=True)
LOGO_DEST.write_bytes(LOGO_SOURCE.read_bytes())
print(f"{LOGO_DEST.relative_to(ROOT)} {LOGO_DEST.stat().st_size} bytes")

for source, destination in PHOTOS:
    image = ImageOps.exif_transpose(Image.open(source).convert("RGB"))
    if image.width > 1800:
        height = round(image.height * 1800 / image.width)
        image = image.resize((1800, height), Image.Resampling.LANCZOS)
    image = image.filter(ImageFilter.UnsharpMask(radius=1.05, percent=105, threshold=3))
    destination.parent.mkdir(parents=True, exist_ok=True)
    image.save(destination, "WEBP", quality=92, method=6)
    print(f"{destination.relative_to(ROOT)} {image.width}x{image.height}")
