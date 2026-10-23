"""Blender 4.x sculpt-authoring starting scene for the original Puffino creature.

Usage (Blender installed separately):
    blender --background --python make_puffino_sculpt.py -- --output /path/to/output

Outputs are a real editable .blend and optional .glb (not pre-generated in GitHub).
The mesh is a quad-based sculpt blockout, not a finished artist-painted character.
"""
from __future__ import annotations

import argparse
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


def parse_args() -> Path:
    args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    parsed = parser.parse_args(args)
    return parsed.output.resolve()


def material(name: str, color: tuple[float, float, float, float]) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = color
    mat.use_nodes = True
    node = mat.node_tree.nodes.get("Principled BSDF")
    node.inputs["Base Color"].default_value = color
    node.inputs["Roughness"].default_value = 0.72
    subsurface = node.inputs.get("Subsurface Weight")
    if subsurface is not None:
        subsurface.default_value = 0.12
    return mat


def sculpt_part(
    name: str,
    location: tuple[float, float, float],
    dimensions: tuple[float, float, float],
    mat: bpy.types.Material,
    subdivisions: int = 1,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=48,
        ring_count=32,
        location=location,
    )
    obj = bpy.context.object
    obj.name = name
    obj.scale = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    if subdivisions:
        modifier = obj.modifiers.new("SculptSmooth", "SUBSURF")
        modifier.levels = subdivisions
        modifier.render_levels = subdivisions
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    return obj


def create_armature() -> bpy.types.Object:
    bones = [
        ("root", None, (0, 0, 0.08), (0, 0, 0.50)),
        ("body", "root", (0, 0, 0.45), (0, 0, 1.05)),
        ("head", "body", (0, 0, 1.02), (0, 0, 1.55)),
        ("ear_root_L", "head", (-0.42, 0, 1.51), (-0.54, 0, 1.80)),
        ("ear_tip_L", "ear_root_L", (-0.54, 0, 1.80), (-0.62, 0, 2.11)),
        ("ear_root_R", "head", (0.42, 0, 1.51), (0.54, 0, 1.80)),
        ("ear_tip_R", "ear_root_R", (0.54, 0, 1.80), (0.62, 0, 2.11)),
        ("tail_root", "body", (0.45, 0.36, 0.57), (0.64, 0.52, 0.75)),
        ("tail_tip", "tail_root", (0.64, 0.52, 0.75), (0.97, 0.69, 0.91)),
        ("jaw", "head", (0, -0.39, 1.01), (0, -0.46, 0.93)),
    ]
    armature = bpy.data.armatures.new("PuffinoSkeleton")
    rig = bpy.data.objects.new("PuffinoRig", armature)
    bpy.context.collection.objects.link(rig)
    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    for name, parent, begin, end in bones:
        bone = armature.edit_bones.new(name)
        bone.head = begin
        bone.tail = end
        if parent:
            bone.parent = armature.edit_bones[parent]
            bone.use_connect = False
    bpy.ops.object.mode_set(mode="OBJECT")
    rig.select_set(False)
    return rig


def skin(
    obj: bpy.types.Object,
    rig: bpy.types.Object,
    bone_name: str,
    tip: str | None = None,
    axis: int = 2,
    start: float = -0.25,
    end: float = 0.35,
) -> None:
    group_root = obj.vertex_groups.new(name=bone_name)
    group_tip = obj.vertex_groups.new(name=tip) if tip else None
    for vertex in obj.data.vertices:
        value = (vertex.co[axis] - start) / max(0.001, end - start)
        weight = min(1.0, max(0.0, value)) if group_tip else 0.0
        group_root.add([vertex.index], 1.0 - weight, "REPLACE")
        if group_tip and weight > 0.0:
            group_tip.add([vertex.index], weight, "REPLACE")
    modifier = obj.modifiers.new("PuffinoSkin", "ARMATURE")
    modifier.object = rig
    obj.parent = rig
    obj.matrix_parent_inverse = rig.matrix_world.inverted()


def face_keys(head: bpy.types.Object) -> None:
    head.shape_key_add(name="Basis", from_mix=False)
    for name in ("Smile", "Pout", "CheekPuff", "Curious"):
        key = head.shape_key_add(name=name, from_mix=False)
        for vertex in key.data:
            co = vertex.co
            # Original head local coordinates. Blender forward = negative Y.
            front = max(0.0, min(1.0, (-co.y - 0.23) / 0.30))
            lower = max(0.0, 1.0 - abs(co.z + 0.17) / 0.28)
            mouth = max(0.0, 1.0 - abs(co.x) / 0.38)
            cheek = max(0.0, 1.0 - abs(abs(co.x) - 0.31) / 0.23)
            if name == "Smile":
                co.z += 0.07 * front * lower * mouth
                co.y -= 0.02 * front * lower
            elif name == "Pout":
                co.z -= 0.06 * front * lower * mouth
                co.y -= 0.04 * front * lower
            elif name == "CheekPuff":
                co.x += math.copysign(0.065 * cheek * front, co.x)
            elif name == "Curious" and co.x > 0 and co.z > 0.11:
                co.z += 0.05 * front


def build_creature(rig: bpy.types.Object) -> None:
    ivory = material("Puffino_Ivory", (0.95, 0.82, 0.71, 1))
    coral = material("Puffino_Coral", (0.95, 0.48, 0.32, 1))
    pink = material("Puffino_InnerEar", (1.0, 0.64, 0.60, 1))
    dark = material("Puffino_Eyes", (0.17, 0.10, 0.15, 1))
    shine = material("Puffino_EyeLight", (1.0, 0.98, 0.92, 1))
    brown = material("Puffino_Horns", (0.63, 0.30, 0.18, 1))

    parts = [
        ("Body", (0, 0, 0.62), (0.49, 0.42, 0.57), ivory, "body", None),
        ("Head", (0, -0.04, 1.18), (0.57, 0.49, 0.48), ivory, "head", None),
        ("Ear_L", (-0.55, 0, 1.80), (0.22, 0.13, 0.35), coral, "ear_root_L", "ear_tip_L"),
        ("Ear_R", (0.55, 0, 1.80), (0.22, 0.13, 0.35), coral, "ear_root_R", "ear_tip_R"),
        ("Tail", (0.77, 0.50, 0.76), (0.42, 0.32, 0.37), coral, "tail_root", "tail_tip"),
    ]
    for name, location, scale, mat, bone, tip in parts:
        obj = sculpt_part(name, location, scale, mat)
        if name == "Head":
            face_keys(obj)
        if name.startswith("Ear"):
            skin(obj, rig, bone, tip, start=-0.28, end=0.31)
        elif name == "Tail":
            skin(obj, rig, bone, tip, axis=0, start=-0.37, end=0.37)
        else:
            skin(obj, rig, bone)

    details = [
        ("Inner_L", (-0.55, -0.11, 1.82), (0.13, 0.05, 0.24), pink, "ear_root_L"),
        ("Inner_R", (0.55, -0.11, 1.82), (0.13, 0.05, 0.24), pink, "ear_root_R"),
        ("Horn_L", (-0.19, -0.07, 1.62), (0.10, 0.10, 0.18), brown, "head"),
        ("Horn_R", (0.19, -0.07, 1.62), (0.10, 0.10, 0.18), brown, "head"),
        ("Eye_L", (-0.24, -0.50, 1.20), (0.15, 0.075, 0.18), dark, "head"),
        ("Eye_R", (0.24, -0.50, 1.20), (0.15, 0.075, 0.18), dark, "head"),
        ("Glint_L", (-0.28, -0.57, 1.26), (0.038, 0.025, 0.045), shine, "head"),
        ("Glint_R", (0.20, -0.57, 1.26), (0.038, 0.025, 0.045), shine, "head"),
        ("Paw_L", (-0.50, -0.25, 0.56), (0.20, 0.20, 0.20), ivory, "body"),
        ("Paw_R", (0.50, -0.25, 0.56), (0.20, 0.20, 0.20), ivory, "body"),
        ("Foot_L", (-0.32, -0.25, 0.16), (0.23, 0.25, 0.12), coral, "body"),
        ("Foot_R", (0.32, -0.25, 0.16), (0.23, 0.25, 0.12), coral, "body"),
        ("Nose", (0, -0.54, 1.02), (0.07, 0.05, 0.05), brown, "head"),
        ("Mouth", (0, -0.48, 0.93), (0.12, 0.07, 0.08), dark, "jaw"),
    ]
    for name, location, scale, mat, bone in details:
        obj = sculpt_part(name, location, scale, mat, 0)
        skin(obj, rig, bone)


def studio() -> None:
    bpy.ops.object.camera_add(location=(2.75, -5.50, 2.65))
    camera = bpy.context.object
    target = Vector((0, 0, 1.04))
    camera.rotation_euler = (target - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = 3.65
    bpy.context.scene.camera = camera

    for name, position, power, area in (
        ("Key", (1.3, -3.0, 4.0), 430, 4.0),
        ("Fill", (-2.5, -1.5, 1.8), 240, 3.5),
        ("Rim", (0.8, 2.7, 3.0), 470, 3.0),
    ):
        light_data = bpy.data.lights.new(name, "AREA")
        light_data.energy = power
        light_data.shape = "DISK"
        light_data.size = area
        light = bpy.data.objects.new(name, light_data)
        bpy.context.collection.objects.link(light)
        light.location = position
        light.rotation_euler = (Vector((0, 0, 1)) - light.location).to_track_quat("-Z", "Y").to_euler()


def main() -> None:
    output = parse_args()
    output.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    rig = create_armature()
    build_creature(rig)
    studio()
    bpy.context.scene["artifact_status"] = "SCULPT_STUDY_NOT_FINAL"
    bpy.context.scene["source_species"] = "puffino"
    bpy.context.scene.render.resolution_x = 1024
    bpy.context.scene.render.resolution_y = 1024
    bpy.context.scene.render.resolution_percentage = 100

    bpy.ops.wm.save_as_mainfile(filepath=str(output / "puffino_sculpt_study.blend"))
    bpy.ops.export_scene.gltf(
        filepath=str(output / "puffino_sculpt_study.glb"),
        export_format="GLB",
        export_skins=True,
        export_morph=True,
        export_animations=False,
    )
    print("Prepared Puffino .blend and skinned GLB study:", output)


if __name__ == "__main__":
    main()
