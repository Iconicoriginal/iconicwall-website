import json
from pathlib import Path

import numpy as np
import trimesh


SAMPLES = Path("assets/models/samples")
OUTPUT = Path("assets/models/generated")
OUTPUT.mkdir(parents=True, exist_ok=True)

WIDTHS = (300, 600, 900)
HEIGHTS = (300, 450, 600)
BASE_WIDTH = 300
BASE_HEIGHT = 450

FILES = {
    "shelf": {
        "base": "07_IW_SHELF_SEED_W300_H450_BOTTOM_300-0x450-0x152-5.dae",
        "wide": "14_IW_SHELF_SEED_W300_H450_BOTTOM_2_600-0x450-0x152-5.dae",
        "tall": "09_IW_SHELF_SEED_W300_H450_BOTTOM_1_300-0x750-0x152-5.dae",
    },
    "frame": {
        "base": "06_IconicFrame_300-0x450-0x151-2.dae",
        "wide": "17_IconicFrame_2_600-0x450-0x151-2.dae",
        "tall": "12_IconicFrame_1_300-0x750-0x151-2.dae",
    },
    "box": {
        "base": "05_IconicBox_300-0x450-0x151-3.dae",
        "wide": "13_IconicBox_2_600-0x450-0x151-3.dae",
        "tall": "08_IconicBox_1_300-0x750-0x151-3.dae",
    },
}


def world_mesh(filename):
    scene = trimesh.load_scene(SAMPLES / filename)
    scene.apply_scale(25.4)
    unique = []
    signatures = set()
    for node_name in scene.graph.nodes_geometry:
        transform, geometry_name = scene.graph[node_name]
        geometry = scene.geometry[geometry_name].copy()
        geometry.apply_transform(transform)
        signature = (
            np.round(geometry.vertices, 5).tobytes(),
            geometry.faces.tobytes(),
        )
        if signature in signatures:
            continue
        signatures.add(signature)
        unique.append(geometry)
    mesh = trimesh.util.concatenate(unique)
    mesh.apply_translation(-mesh.bounds[0])
    return mesh


def authored_masks(family, base, wide, tall):
    if family in ("shelf", "box"):
        width_delta = wide.vertices - base.vertices
        height_delta = tall.vertices - base.vertices
        width_mask = np.isclose(width_delta[:, 0], 300.0, atol=0.01)
        height_mask = np.isclose(height_delta[:, 2], 300.0, atol=0.01)
    else:
        # Frame export changes vertex order in the tall instance. Its authored
        # coordinate sets are nevertheless exact:
        # X: 0 / 1.2 / W-1.2 / W
        # Z: 0 / 1.2 / 150 / H-1.2 / H
        width_delta = wide.vertices - base.vertices
        width_mask = np.isclose(width_delta[:, 0], 300.0, atol=0.01)
        height_mask = base.vertices[:, 2] >= 448.8 - 0.01

    return width_mask, height_mask


report = {}
for family, names in FILES.items():
    base = world_mesh(names["base"])
    wide = world_mesh(names["wide"])
    tall = world_mesh(names["tall"])
    if not (np.array_equal(base.faces, wide.faces) and np.array_equal(base.faces, tall.faces)):
        raise RuntimeError(f"{family}: face topology mismatch")

    width_mask, height_mask = authored_masks(family, base, wide, tall)

    for width in WIDTHS:
        for height in HEIGHTS:
            mesh = base.copy()
            vertices = mesh.vertices.copy()
            vertices[width_mask, 0] += width - BASE_WIDTH
            vertices[height_mask, 2] += height - BASE_HEIGHT
            mesh.vertices = vertices
            mesh.apply_translation(-mesh.bounds[0])
            extents = mesh.extents.copy()
            valid = bool(
                abs(extents[0] - width) < 0.01
                and abs(extents[1] - base.extents[1]) < 0.01
                and abs(extents[2] - height) < 0.01
            )
            # glTF/Three.js use metres.
            export_mesh = mesh.copy()
            export_mesh.apply_scale(0.001)
            scene = trimesh.Scene(export_mesh)
            target = OUTPUT / f"IW_{family.upper()}_W{width}_H{height}.glb"
            target.write_bytes(scene.export(file_type="glb"))
            report[f"{family}_{width}_{height}"] = {
                "file": target.name,
                "extents_mm": [round(float(value), 3) for value in extents],
                "valid": valid,
                "authored_width_vertices": int(width_mask.sum()),
                "authored_height_vertices": int(height_mask.sum()),
            }

(OUTPUT / "variants_report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
if not all(item["valid"] for item in report.values()):
    raise SystemExit("Dimensional validation failed.")
