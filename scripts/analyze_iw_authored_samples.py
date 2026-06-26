import json
from pathlib import Path

import numpy as np
import trimesh


ROOT = Path("assets/models/samples")
FAMILIES = {
    "box": {
        "base": "05_IconicBox_300-0x450-0x151-3.dae",
        "wide": "13_IconicBox_2_600-0x450-0x151-3.dae",
        "tall": "08_IconicBox_1_300-0x750-0x151-3.dae",
    },
    "frame": {
        "base": "06_IconicFrame_300-0x450-0x151-2.dae",
        "wide": "17_IconicFrame_2_600-0x450-0x151-2.dae",
        "tall": "12_IconicFrame_1_300-0x750-0x151-2.dae",
    },
    "shelf": {
        "base": "07_IW_SHELF_SEED_W300_H450_BOTTOM_300-0x450-0x152-5.dae",
        "wide": "14_IW_SHELF_SEED_W300_H450_BOTTOM_2_600-0x450-0x152-5.dae",
        "tall": "09_IW_SHELF_SEED_W300_H450_BOTTOM_1_300-0x750-0x152-5.dae",
    },
}


def world_mesh(path):
    scene = trimesh.load_scene(path)
    scene.apply_scale(25.4)
    mesh = scene.to_geometry()
    mesh.apply_translation(-mesh.bounds[0])
    return mesh


report = {}
for family, files in FAMILIES.items():
    paths = {key: ROOT / value for key, value in files.items() if value}
    meshes = {key: world_mesh(path) for key, path in paths.items()}
    base = meshes["base"]
    wide = meshes["wide"]
    tall = meshes["tall"]
    item = {
        "base_vertices": len(base.vertices),
        "wide_vertices": len(wide.vertices),
        "base_faces": len(base.faces),
        "wide_faces": len(wide.faces),
        "tall_vertices": len(tall.vertices),
        "tall_faces": len(tall.faces),
        "same_topology_counts": bool(
            len(base.vertices) == len(wide.vertices)
            and len(base.faces) == len(wide.faces)
            and len(base.vertices) == len(tall.vertices)
            and len(base.faces) == len(tall.faces)
        ),
        "base_extents_mm": [round(float(value), 3) for value in base.extents],
        "wide_extents_mm": [round(float(value), 3) for value in wide.extents],
        "tall_extents_mm": [round(float(value), 3) for value in tall.extents],
    }
    if item["same_topology_counts"]:
        displacement = wide.vertices - base.vertices
        tall_displacement = tall.vertices - base.vertices
        item["width_displacement_axes_mm"] = {
            axis: sorted(set(np.round(displacement[:, index], 3).tolist()))
            for index, axis in enumerate(("x", "y", "z"))
        }
        item["height_displacement_axes_mm"] = {
            axis: sorted(set(np.round(tall_displacement[:, index], 3).tolist()))
            for index, axis in enumerate(("x", "y", "z"))
        }
        item["faces_identical"] = bool(
            np.array_equal(base.faces, wide.faces)
            and np.array_equal(base.faces, tall.faces)
        )
    report[family] = item

Path("tmp/iw_authored_sample_analysis.json").write_text(
    json.dumps(report, indent=2),
    encoding="utf-8",
)
