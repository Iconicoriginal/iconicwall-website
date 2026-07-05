import json
import re
import base64
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageOps


SOURCE = Path(r"C:\Users\utente\iCloudDrive\Iconic\Marketing\Materiale\Pattern 3M DiNoc 2024-Rinominati")
OUTPUT = Path(__file__).resolve().parents[1] / "assets" / "dinoc"
TEXTURES = OUTPUT / "textures"

FAMILY_BY_PREFIX = {
    "ME": "Metal",
    "VM": "Metal",
    "CH": "Metal",
    "PA": "Metal",
    "ST": "Stone",
    "CN": "Concrete",
    "LE": "Leather",
    "SU": "Leather",
    "NU": "Textile",
    "AE": "Abstract",
    "FA": "Abstract",
    "HS": "Abstract",
    "CA": "Carbon",
    "PW": "Wood",
    "PWF": "Wood",
    "DW": "Wood",
    "FW": "Wood",
    "MW": "Wood",
    "WG": "Wood",
    "PS": "Solid Color",
    "HG": "Solid Color",
}

SERIES_WITH_MT = {"AE", "SU", "NU", "PW", "DW", "PS"}


def cleaned_code(stem: str) -> str:
    value = stem.upper().replace(" ", "")
    value = re.sub(r"_H$", "", value)
    value = re.sub(r"_?TH$", "", value)
    value = value.rstrip("_")
    return value


def slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def series_for(code: str, prefix: str) -> str:
    if prefix == "PS" and "MTRC" in code:
        return "PS-MTRC"
    if prefix in SERIES_WITH_MT and "MT" in code:
        return f"{prefix}-MT"
    return prefix


def variant_for(code: str) -> str:
    variants = []
    if "EX" in code:
        variants.append("EX")
    if "AR" in code:
        variants.append("AR")
    if re.search(r"MT(?:$|_)", code):
        variants.append("MT")
    return " / ".join(variants)


def main():
    TEXTURES.mkdir(parents=True, exist_ok=True)
    entries = []
    used_names = set()

    for source in sorted(SOURCE.glob("*.jpg"), key=lambda item: item.name.lower()):
        code = cleaned_code(source.stem)
        match = re.match(r"^([A-Z]+)-?\d", code)
        if not match:
            continue
        prefix = match.group(1)
        family = FAMILY_BY_PREFIX.get(prefix, "Altri")
        base_name = slug(code)
        output_name = f"{base_name}.webp"
        suffix = 2
        while output_name in used_names:
            output_name = f"{base_name}-{suffix}.webp"
            suffix += 1
        used_names.add(output_name)

        target = TEXTURES / output_name
        with Image.open(source) as image:
            image = ImageOps.exif_transpose(image).convert("RGB")
            image.thumbnail((512, 512), Image.Resampling.LANCZOS)
            canvas = Image.new("RGB", (512, 512), image.getpixel((0, 0)))
            canvas.paste(image, ((512 - image.width) // 2, (512 - image.height) // 2))
            canvas.save(target, "WEBP", quality=76, method=6)
            average = canvas.resize((1, 1), Image.Resampling.BOX).getpixel((0, 0))
            preview = canvas.resize((192, 192), Image.Resampling.LANCZOS)
            preview_bytes = BytesIO()
            preview.save(preview_bytes, "WEBP", quality=68, method=6)
            preview_data = "data:image/webp;base64," + base64.b64encode(preview_bytes.getvalue()).decode("ascii")

        entries.append(
            {
                "id": f"dinoc-{len(entries) + 1}",
                "code": code,
                "family": family,
                "series": series_for(code, prefix),
                "variant": variant_for(code),
                "texture": f"assets/dinoc/textures/{output_name}",
                "sourceFile": source.name,
                "directional": family in {"Wood", "Textile", "Metal"},
                "defaultScaleMm": 600 if family in {"Wood", "Stone", "Concrete"} else 300,
                "averageColor": f"#{average[0]:02x}{average[1]:02x}{average[2]:02x}",
                "textureData": preview_data,
            }
        )

    families = sorted({entry["family"] for entry in entries if entry["family"] != "Altri"})
    if any(entry["family"] == "Altri" for entry in entries):
        families.append("Altri")
    payload = {
        "version": "2025.1",
        "source": "Listino Dinoc_2025.xlsx + Pattern 3M DiNoc 2024-Rinominati",
        "count": len(entries),
        "families": families,
        "materials": entries,
    }
    (OUTPUT / "catalog.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    (OUTPUT / "catalog.js").write_text(
        "globalThis.IW_DINOC_CATALOG=" + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )
    print(json.dumps({"materials": len(entries), "families": families}, ensure_ascii=False))


if __name__ == "__main__":
    main()
