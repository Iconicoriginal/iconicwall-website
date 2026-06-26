from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps


SOURCE = Path(r"C:\Users\utente\iCloudDrive\Iconic\Marketing\Materiale\Foto 3M")
OUT = Path(__file__).resolve().parents[1] / "tmp" / "3m_contact.jpg"

files = sorted(SOURCE.glob("*.jpg"))
tile_w, tile_h = 360, 300
cols = 3
rows = max(1, (len(files) + cols - 1) // cols)

canvas = Image.new("RGB", (tile_w * cols, tile_h * rows), (238, 235, 229))
draw = ImageDraw.Draw(canvas)
font = ImageFont.load_default()

for i, path in enumerate(files):
    image = ImageOps.exif_transpose(Image.open(path).convert("RGB"))
    image.thumbnail((tile_w - 20, tile_h - 54), Image.Resampling.LANCZOS)

    x = (i % cols) * tile_w
    y = (i // cols) * tile_h
    canvas.paste(image, (x + (tile_w - image.width) // 2, y + 10))

    draw.rectangle((x + 8, y + tile_h - 38, x + tile_w - 8, y + tile_h - 8), fill=(255, 255, 255))
    draw.text((x + 14, y + tile_h - 31), f"{i + 1}. {path.name[:45]}", fill=(0, 0, 0), font=font)

OUT.parent.mkdir(parents=True, exist_ok=True)
canvas.save(OUT, quality=92)
print(OUT)
