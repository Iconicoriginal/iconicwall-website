from pathlib import Path

import pypdfium2 as pdfium


SOURCE = Path(
    r"C:\Users\utente\iCloudDrive\Iconic\Iconic Wall\Presentazione progetto"
    r"\ICONIC Presentazione prodotto.pdf"
)
OUTPUT = Path(__file__).resolve().parents[1] / "assets"
REFERENCE_WIDTH = 1287
REFERENCE_HEIGHT = 910


CROPS = {
    "hero.webp": (1, (525, 0, 1287, 910)),
    "system.webp": (2, (0, 300, 1287, 810)),
    "living-wall.webp": (3, (335, 0, 1287, 548)),
    "technical.webp": (6, (830, 0, 1287, 910)),
    "materials.webp": (8, (461, 0, 1287, 537)),
    "hospitality.webp": (9, (0, 0, 643, 455)),
    "retail.webp": (9, (643, 0, 1287, 455)),
    "living.webp": (9, (643, 456, 1287, 910)),
    "panel-flat.webp": (4, (40, 347, 273, 563)),
    "panel-lux.webp": (4, (280, 347, 512, 563)),
    "panel-shelf.webp": (4, (520, 347, 751, 563)),
    "panel-frame.webp": (4, (759, 347, 991, 563)),
    "panel-box.webp": (4, (999, 347, 1231, 563)),
    "accessory-organize.webp": (5, (497, 186, 736, 485)),
    "accessory-display.webp": (5, (754, 186, 993, 485)),
    "accessory-decor.webp": (5, (1014, 186, 1253, 485)),
}


def crop_for(page_image, crop):
    sx = page_image.width / REFERENCE_WIDTH
    sy = page_image.height / REFERENCE_HEIGHT
    return tuple(
        round(value * (sx if index % 2 == 0 else sy))
        for index, value in enumerate(crop)
    )


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    document = pdfium.PdfDocument(SOURCE)
    rendered = {}

    for filename, (page_number, crop) in CROPS.items():
        if page_number not in rendered:
            page = document[page_number - 1]
            rendered[page_number] = page.render(scale=2.5).to_pil()
        image = rendered[page_number].crop(crop_for(rendered[page_number], crop))
        image.save(OUTPUT / filename, "WEBP", quality=92, method=6)
        print(filename, image.size)


if __name__ == "__main__":
    main()
