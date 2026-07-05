from __future__ import annotations

import csv
import hashlib
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps


SOURCES = [
    (
        "AI",
        Path(r"C:\Users\utente\iCloudDrive\Iconic\Marketing\IconicWall\Immagini AI"),
    ),
    (
        "PRESENTAZIONE",
        Path(
            r"C:\Users\utente\iCloudDrive\Iconic\Iconic Wall"
            r"\Presentazione progetto\Immagini"
        ),
    ),
]
EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff", ".heic", ".avif"}
ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "tmp" / "catalog"
CSV_PATH = OUTPUT / "image-catalog.csv"
THUMB_SIZE = (280, 210)
CELL_SIZE = (300, 270)
COLUMNS = 4
ROWS = 4


def font(size: int):
    try:
        return ImageFont.truetype("arial.ttf", size)
    except OSError:
        return ImageFont.load_default()


def files():
    for source, root in SOURCES:
        for path in sorted(root.rglob("*"), key=lambda item: str(item).lower()):
            if path.is_file() and path.suffix.lower() in EXTENSIONS:
                yield source, root, path


def sha256(path: Path):
    digest = hashlib.sha256()
    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    records = []

    for index, (source, root, path) in enumerate(files(), start=1):
        try:
            with Image.open(path) as original:
                image = ImageOps.exif_transpose(original).convert("RGB")
                width, height = image.size
                thumb = ImageOps.fit(image, THUMB_SIZE, method=Image.Resampling.LANCZOS)
        except Exception as error:
            records.append(
                {
                    "id": index,
                    "source": source,
                    "relative_path": str(path.relative_to(root)),
                    "full_path": str(path),
                    "width": "",
                    "height": "",
                    "ratio": "",
                    "bytes": path.stat().st_size,
                    "sha256": sha256(path),
                    "error": str(error),
                    "thumbnail": None,
                }
            )
            continue

        records.append(
            {
                "id": index,
                "source": source,
                "relative_path": str(path.relative_to(root)),
                "full_path": str(path),
                "width": width,
                "height": height,
                "ratio": round(width / height, 3),
                "bytes": path.stat().st_size,
                "sha256": sha256(path),
                "error": "",
                "thumbnail": thumb,
            }
        )

    with CSV_PATH.open("w", newline="", encoding="utf-8-sig") as file:
        fields = [
            "id",
            "source",
            "relative_path",
            "full_path",
            "width",
            "height",
            "ratio",
            "bytes",
            "sha256",
            "error",
        ]
        writer = csv.DictWriter(file, fieldnames=fields)
        writer.writeheader()
        writer.writerows({key: record[key] for key in fields} for record in records)

    per_sheet = COLUMNS * ROWS
    sheets = []
    title_font = font(24)
    label_font = font(18)
    meta_font = font(14)

    for offset in range(0, len(records), per_sheet):
        batch = records[offset : offset + per_sheet]
        canvas = Image.new(
            "RGB",
            (COLUMNS * CELL_SIZE[0], ROWS * CELL_SIZE[1]),
            "#f3f1ed",
        )
        draw = ImageDraw.Draw(canvas)

        for position, record in enumerate(batch):
            column = position % COLUMNS
            row = position // COLUMNS
            x = column * CELL_SIZE[0]
            y = row * CELL_SIZE[1]
            thumb = record["thumbnail"]

            if thumb:
                canvas.paste(thumb, (x + 10, y + 10))
            else:
                draw.rectangle(
                    (x + 10, y + 10, x + 290, y + 220),
                    fill="#d8d4cd",
                )
                draw.text((x + 20, y + 90), "ANTEPRIMA NON DISPONIBILE", fill="#555")

            draw.rectangle((x + 10, y + 210, x + 58, y + 242), fill="#171715")
            draw.text(
                (x + 18, y + 214),
                f"{record['id']:03}",
                fill="white",
                font=label_font,
            )
            name = Path(record["relative_path"]).name
            if len(name) > 31:
                name = name[:28] + "..."
            draw.text((x + 68, y + 214), name, fill="#171715", font=meta_font)
            draw.text(
                (x + 68, y + 234),
                f"{record['source']} · {record['width']}×{record['height']}",
                fill="#77736d",
                font=meta_font,
            )

        sheet_number = offset // per_sheet + 1
        path = OUTPUT / f"contact-sheet-{sheet_number:02}.jpg"
        canvas.save(path, quality=90)
        sheets.append(path)

    print(f"{len(records)} images")
    print(f"{len(sheets)} contact sheets")
    print(CSV_PATH)


if __name__ == "__main__":
    main()
