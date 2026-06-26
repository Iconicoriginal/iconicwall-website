import json
from pathlib import Path

import numpy as np
import trimesh


SOURCE = Path("assets/models/original")
REPORT = {}

for source in sorted(SOURCE.glob("*.dae")):
    scene = trimesh.load_scene(source)

    # SketchUp's DAE contains inch coordinates. Convert to web-standard metres
    # and move the lower/rear/left bounding-box corner to the origin.
    scene.apply_scale(0.0254)
    minimum = scene.bounds[0].copy()
    transform = np.eye(4)
    transform[:3, 3] = -minimum
    scene.apply_transform(transform)

    target = source.with_suffix(".glb")
    target.write_bytes(scene.export(file_type="glb"))
    REPORT[source.stem] = {
        "source": str(source),
        "target": str(target),
        "geometry_count": len(scene.geometry),
        "size_m": [round(float(value), 6) for value in scene.extents],
        "bounds_m": [[round(float(value), 6) for value in row] for row in scene.bounds],
    }

(SOURCE / "conversion_report.json").write_text(
    json.dumps(REPORT, indent=2),
    encoding="utf-8",
)
