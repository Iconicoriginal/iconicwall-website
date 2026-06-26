from pathlib import Path

from PIL import Image, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "gallery"

LARGE_FORMAT = {
    "living-signature.webp",
    "system-reveal.webp",
    "living-warm.webp",
    "wood-wall.webp",
    "wood-human.webp",
    "wood-living.webp",
    "kitchen.webp",
    "accessory-system.webp",
    "magnetic-reveal.webp",
    "retail-display.webp",
}

FILES = {
    "living-signature.webp": r"C:\Users\utente\iCloudDrive\Iconic\Marketing\IconicWall\Immagini AI\Soggiorno_1\ChatGPT Image 9 giu 2026, 20_15_56.png",
    "system-reveal.webp": r"C:\Users\utente\iCloudDrive\Iconic\Marketing\IconicWall\Immagini AI\Soggiorno_2\ChatGPT Image 11 giu 2026, 11_40_23.png",
    "living-warm.webp": r"C:\Users\utente\iCloudDrive\Iconic\Marketing\IconicWall\Immagini AI\Soggiorno_2\ChatGPT Image 11 giu 2026, 14_32_09.png",
    "panel-access.webp": r"C:\Users\utente\iCloudDrive\Iconic\Marketing\IconicWall\Immagini AI\Soggiorno_2\ChatGPT Image 11 giu 2026, 16_00_54.png",
    "structure-open.webp": r"C:\Users\utente\iCloudDrive\Iconic\Marketing\IconicWall\Immagini AI\Soggiorno_2\ChatGPT Image 11 giu 2026, 17_14_32.png",
    "shelf-detail.webp": r"C:\Users\utente\iCloudDrive\Iconic\Marketing\IconicWall\Immagini AI\Soggiorno_2\ChatGPT Image 11 giu 2026, 17_54_16.png",
    "box-detail.webp": r"C:\Users\utente\iCloudDrive\Iconic\Marketing\IconicWall\Immagini AI\Soggiorno_2\ChatGPT Image 11 giu 2026, 20_22_42.png",
    "material-moodboard.webp": r"C:\Users\utente\iCloudDrive\Iconic\Marketing\IconicWall\Immagini AI\Soggiorno_2\ChatGPT Image 12 giu 2026, 14_40_37.png",
    "metal-detail.webp": r"C:\Users\utente\iCloudDrive\Iconic\Marketing\IconicWall\Immagini AI\Soggiorno_2\ChatGPT Image 12 giu 2026, 15_17_20.png",
    "wood-wall.webp": r"C:\Users\utente\iCloudDrive\Iconic\Iconic Wall\Presentazione progetto\Immagini\ChatGPT Image 16 giu 2026, 16_21_40.png",
    "wood-human.webp": r"C:\Users\utente\iCloudDrive\Iconic\Iconic Wall\Presentazione progetto\Immagini\ChatGPT Image 16 giu 2026, 16_27_57.png",
    "wood-samples.webp": r"C:\Users\utente\iCloudDrive\Iconic\Iconic Wall\Presentazione progetto\Immagini\ChatGPT Image 16 giu 2026, 16_30_17.png",
    "natural-veneers.webp": r"C:\Users\utente\iCloudDrive\Iconic\Iconic Wall\Presentazione progetto\Immagini\ChatGPT Image 16 giu 2026, 16_40_25.png",
    "brass-samples.webp": r"C:\Users\utente\iCloudDrive\Iconic\Iconic Wall\Presentazione progetto\Immagini\ChatGPT Image 16 giu 2026, 16_41_56.png",
    "material-layers.webp": r"C:\Users\utente\iCloudDrive\Iconic\Iconic Wall\Presentazione progetto\Immagini\ChatGPT Image 16 giu 2026, 16_44_15.png",
    "color-samples.webp": r"C:\Users\utente\iCloudDrive\Iconic\Iconic Wall\Presentazione progetto\Immagini\ChatGPT Image 16 giu 2026, 17_44_19.png",
    "wood-living.webp": r"C:\Users\utente\iCloudDrive\Iconic\Iconic Wall\Presentazione progetto\Immagini\ChatGPT Image 16 giu 2026, 17_59_29.png",
    "kitchen.webp": r"C:\Users\utente\iCloudDrive\Iconic\Iconic Wall\Presentazione progetto\Immagini\ChatGPT Image 16 giu 2026, 19_59_48.png",
    "magnetic-reveal.webp": r"C:\Users\utente\iCloudDrive\Iconic\Iconic Wall\Presentazione progetto\Immagini\ChatGPT Image 20 giu 2026, 11_19_05.png",
    "magnet-closeup.webp": r"C:\Users\utente\iCloudDrive\Iconic\Iconic Wall\Presentazione progetto\Immagini\ChatGPT Image 20 giu 2026, 11_19_43.png",
    "organize.webp": r"C:\Users\utente\iCloudDrive\Iconic\Iconic Wall\Presentazione progetto\Immagini\ChatGPT Image 20 giu 2026, 11_32_53.png",
    "wardrobe.webp": r"C:\Users\utente\iCloudDrive\Iconic\Iconic Wall\Presentazione progetto\Immagini\ChatGPT Image 20 giu 2026, 11_33_09.png",
    "retail-display.webp": r"C:\Users\utente\iCloudDrive\Iconic\Iconic Wall\Presentazione progetto\Immagini\ChatGPT Image 20 giu 2026, 15_44_52.png",
    "accessory-system.webp": r"C:\Users\utente\iCloudDrive\Iconic\Iconic Wall\Presentazione progetto\Immagini\ChatGPT Image 20 giu 2026, 15_53_21.png",
    "phone-tray.webp": r"C:\Users\utente\iCloudDrive\Iconic\Iconic Wall\Presentazione progetto\Immagini\ChatGPT Image 20 giu 2026, 15_57_54 (2).png",
    "key-hook.webp": r"C:\Users\utente\iCloudDrive\Iconic\Iconic Wall\Presentazione progetto\Immagini\ChatGPT Image 20 giu 2026, 15_57_55 (3).png",
    "phone-holder.webp": r"C:\Users\utente\iCloudDrive\Iconic\Iconic Wall\Presentazione progetto\Immagini\ChatGPT Image 20 giu 2026, 15_57_56 (4).png",
    "perfume-shelf.webp": r"C:\Users\utente\iCloudDrive\Iconic\Iconic Wall\Presentazione progetto\Immagini\ChatGPT Image 20 giu 2026, 15_57_56 (5).png",
    "brochure-holder.webp": r"C:\Users\utente\iCloudDrive\Iconic\Iconic Wall\Presentazione progetto\Immagini\ChatGPT Image 20 giu 2026, 16_00_48 (1).png",
    "picture-shelf.webp": r"C:\Users\utente\iCloudDrive\Iconic\Iconic Wall\Presentazione progetto\Immagini\ChatGPT Image 20 giu 2026, 16_00_48 (2).png",
    "plant-box.webp": r"C:\Users\utente\iCloudDrive\Iconic\Iconic Wall\Presentazione progetto\Immagini\ChatGPT Image 20 giu 2026, 16_00_48 (3).png",
    "mirror.webp": r"C:\Users\utente\iCloudDrive\Iconic\Iconic Wall\Presentazione progetto\Immagini\ChatGPT Image 20 giu 2026, 16_00_49 (4).png",
    "flower-rack.webp": r"C:\Users\utente\iCloudDrive\Iconic\Iconic Wall\Presentazione progetto\Immagini\ChatGPT Image 20 giu 2026, 16_22_21 (1).png",
    "decor-shelf.webp": r"C:\Users\utente\iCloudDrive\Iconic\Iconic Wall\Presentazione progetto\Immagini\ChatGPT Image 20 giu 2026, 16_22_22 (2).png",
    "retail-shelf.webp": r"C:\Users\utente\iCloudDrive\Iconic\Iconic Wall\Presentazione progetto\Immagini\ChatGPT Image 20 giu 2026, 16_27_23 (2).png",
    "eyewear-display.webp": r"C:\Users\utente\iCloudDrive\Iconic\Iconic Wall\Presentazione progetto\Immagini\ChatGPT Image 20 giu 2026, 16_31_38 (1).png",
    "eyewear-wall.webp": r"C:\Users\utente\iCloudDrive\Iconic\Iconic Wall\Presentazione progetto\Immagini\ChatGPT Image 20 giu 2026, 16_31_38 (2).png",
    "editorial-wall.webp": r"C:\Users\utente\iCloudDrive\Iconic\Iconic Wall\Presentazione progetto\Immagini\IconicWall_P11_Italian_Living_Editorial_Frame_Final.png",
    "real-detail.webp": r"C:\Users\utente\iCloudDrive\Iconic\Iconic Wall\Presentazione progetto\Immagini\IMG_4876.JPEG",
    "real-wall.webp": r"C:\Users\utente\iCloudDrive\Iconic\Iconic Wall\Presentazione progetto\Immagini\IMG_4878.JPEG",
    "real-showroom.webp": r"C:\Users\utente\iCloudDrive\Iconic\Iconic Wall\Presentazione progetto\Immagini\IMG_4885.JPEG",
    "real-exhibition.webp": r"C:\Users\utente\iCloudDrive\Iconic\Iconic Wall\Presentazione progetto\Immagini\IMG_4900.JPEG",
}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, source in FILES.items():
        with Image.open(source) as original:
            image = ImageOps.exif_transpose(original).convert("RGB")
            if name in LARGE_FORMAT and image.width < 2800:
                target_width = 2800
                target_height = round(image.height * target_width / image.width)
                image = image.resize(
                    (target_width, target_height),
                    Image.Resampling.LANCZOS,
                )
                image = image.filter(
                    ImageFilter.UnsharpMask(radius=1.15, percent=82, threshold=3)
                )
            elif image.width > 2200:
                target_height = round(image.height * 2200 / image.width)
                image = image.resize(
                    (2200, target_height),
                    Image.Resampling.LANCZOS,
                )
            image.save(OUT / name, "WEBP", quality=94, method=6)
        print(name)


if __name__ == "__main__":
    main()
