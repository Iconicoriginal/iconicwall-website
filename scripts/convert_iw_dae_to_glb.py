import bpy
import json
import sys
from pathlib import Path
from mathutils import Vector


def clean_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


def mesh_bounds(objects):
    points = []
    for obj in objects:
        if obj.type != "MESH":
            continue
        points.extend(obj.matrix_world @ Vector(corner) for corner in obj.bound_box)
    minimum = Vector((min(p.x for p in points), min(p.y for p in points), min(p.z for p in points)))
    maximum = Vector((max(p.x for p in points), max(p.y for p in points), max(p.z for p in points)))
    return minimum, maximum


def main():
    source_dir = Path(sys.argv[-2])
    output_dir = Path(sys.argv[-1])
    output_dir.mkdir(parents=True, exist_ok=True)
    report = {}

    for source in sorted(source_dir.glob("*.dae")):
        clean_scene()
        bpy.ops.wm.collada_import(filepath=str(source))
        meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
        for obj in list(bpy.context.scene.objects):
            if obj.type != "MESH":
                bpy.data.objects.remove(obj, do_unlink=True)

        minimum, maximum = mesh_bounds(meshes)
        size_before = maximum - minimum

        # SketchUp exports inches with Z up. Blender imports the unit and
        # orientation; move only the bounding-box origin, preserving geometry.
        for obj in meshes:
            obj.location -= minimum

        bpy.context.view_layer.update()
        minimum_after, maximum_after = mesh_bounds(meshes)
        target = output_dir / f"{source.stem}.glb"
        bpy.ops.export_scene.gltf(
            filepath=str(target),
            export_format="GLB",
            use_selection=False,
            export_yup=True,
            export_apply=True,
        )
        report[source.stem] = {
            "source": str(source),
            "target": str(target),
            "mesh_count": len(meshes),
            "size_m": [round(value, 6) for value in size_before],
            "min_after_m": [round(value, 6) for value in minimum_after],
            "max_after_m": [round(value, 6) for value in maximum_after],
        }

    (output_dir / "conversion_report.json").write_text(
        json.dumps(report, indent=2),
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
