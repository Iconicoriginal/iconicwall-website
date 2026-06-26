import bpy
import math
import sys
from mathutils import Vector


source = sys.argv[-2]
target = sys.argv[-1]

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=source)

meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
for obj in meshes:
    material = bpy.data.materials.new("IW_CHECK")
    material.diffuse_color = (0.32, 0.24, 0.17, 1)
    material.metallic = 0.25
    material.roughness = 0.42
    obj.data.materials.clear()
    obj.data.materials.append(material)

points = [obj.matrix_world @ Vector(corner) for obj in meshes for corner in obj.bound_box]
minimum = Vector((min(p.x for p in points), min(p.y for p in points), min(p.z for p in points)))
maximum = Vector((max(p.x for p in points), max(p.y for p in points), max(p.z for p in points)))
centre = (minimum + maximum) / 2
size = maximum - minimum

camera_data = bpy.data.cameras.new("Camera")
camera = bpy.data.objects.new("Camera", camera_data)
bpy.context.scene.collection.objects.link(camera)
camera.location = centre + Vector((size.x * 1.4, -max(size.x, size.z) * 1.7, size.z * 1.1))
direction = centre - camera.location
camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
camera_data.type = "ORTHO"
camera_data.ortho_scale = max(size.x, size.z) * 1.35
bpy.context.scene.camera = camera

world = bpy.context.scene.world
world.color = (0.07, 0.07, 0.07)
light_data = bpy.data.lights.new("Key", "AREA")
light_data.energy = 900
light_data.shape = "DISK"
light_data.size = 4
light = bpy.data.objects.new("Key", light_data)
light.location = centre + Vector((-2, -3, 4))
bpy.context.scene.collection.objects.link(light)

scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 900
scene.render.resolution_y = 700
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.filepath = target
scene.render.film_transparent = False
bpy.ops.render.render(write_still=True)
