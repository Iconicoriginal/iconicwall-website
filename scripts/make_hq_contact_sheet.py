from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps


SOURCE = Path(r"C:\Users\utente\iCloudDrive\Iconic\Marketing\Sito Web\Fatto da ChatGPT\Immagini\Immagini HQ nuove")
OUT = Path(__file__).resolve().parents[1] / "tmp" / "hq_collection_contact.jpg"

files = sorted([p for p in SOURCE.iterdir() if p.is_file()])
tile_w, tile_h = 520, 400
cols = 2
rows = max(1, (len(files) + cols - 1) // cols)

canvas = Image.new("RGB", (tile_w * cols, tile_h * rows), (238, 235, 229))
draw = ImageDraw.Draw(canvas)
font = ImageFont.load_default()

for i, path in enumerate(files):
    image = ImageOps.exif_transpose(Image.open(path).convert("RGB"))
    image.thumbnail((tile_w - 30, tile_h - 70), Image.Resampling.LANCZOS)

    x = (i % cols) * tile_w
    y = (i // cols) * tile_h
    canvas.paste(image, (x + (tile_w - image.width) // 2, y + 12))

    draw.rectangle((x + 12, y + tile_h - 48, x + tile_w - 12, y + tile_h - 12), fill=(255, 255, 255))
    draw.text((x + 22, y + tile_h - 38), f"{i + 1}. {path.name}", fill=(0, 0, 0), font=font)

OUT.parent.mkdir(parents=True, exist_ok=True)
canvas.save(OUT, quality=92)
print(OUT)
