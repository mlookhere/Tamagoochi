"""Editable Blender sculpt studies for original Tamagoochi creatures."""
from __future__ import annotations

import argparse
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from validate_glb import validate
from sculpt_details import petal_ear, curled_puffino_tail, configure_fur_shader, configure_fur_albedo, configure_tail_bands, decorate_face

def parse_args() -> argparse.Namespace:
    args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--profile", choices=("sculpt", "mobile"), default="sculpt")
    parser.add_argument("--species", choices=("puffino", "lunari", "sproutle", "bubblin"),
                        default="puffino")
    return parser.parse_args(args)

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
    segments: int = 48,
    rings: int = 32,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=location)
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
    if name in ("Body", "Head"):
        peak = 0.0
        for vertex in obj.data.vertices:
            x, y, z = vertex.co
            phase = math.atan2(y / dimensions[1], x / dimensions[0])
            back = min(1.0, max(0.0, (y + 0.05) / (0.65 * dimensions[1])))
            side = min(1.0, max(0.0, (abs(x) / dimensions[0] - 0.63) / 0.37))
            tuft = max(0.0, math.cos(7 * phase + 3 * z / dimensions[2]))**4
            amount = (0.035 if name == "Head" else 0.025) * max(back, 0.6 * side) * tuft
            front = max(0.0, min(1.0, (-y / dimensions[1] - 0.45) / 0.5))
            cheek = math.exp(-((abs(x / dimensions[0]) - 0.78) / 0.20)**2
                             - ((z / dimensions[2] + 0.25) / 0.32)**2)
            chest = math.exp(-((z / dimensions[2] - 0.40) / 0.34)**2)
            fold = 0.70 + 0.30 * max(0.0, math.cos(6 * phase + 5 * z))
            amount = max(amount, (0.043 * cheek if name == "Head"
                                  else 0.030 * chest) * front * fold)
            vertex.co += vertex.normal * amount
            peak = max(peak, amount)
        obj["fur_surface_relief"] = peak
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

def face_feature_keys(feature: bpy.types.Object) -> None:
    feature.shape_key_add(name="Basis", from_mix=False)
    for name in ("Smile", "Pout", "Curious"):
        key = feature.shape_key_add(name=name, from_mix=False)
        for vertex in key.data:
            co = vertex.co
            if feature.name == "Mouth":
                if name == "Smile":
                    co.z += 0.12 * min(1.0, abs(co.x) / 0.1)
                    co.x *= 1.18
                elif name == "Pout":
                    co.x *= 0.62
                    co.y -= 0.10
                else:
                    co.z += 0.065 * co.x / 0.12
            elif name == "Smile":
                co.z *= 0.65
            elif name == "Pout":
                co.z *= 1.2
            elif feature.name == "Eye_R":
                co.z += 0.09
            else:
                co.z -= 0.045

def _add_primary_part(name, location, scale, mat, bone, tip, rig, species, profile, lining):
    if name.startswith("Ear"):
        side = -1 if name.endswith("_L") else 1
        obj = petal_ear(name, location,
                        (scale[0], scale[1], scale[2] * 2), mat, side, species, lining)
    elif name == "Tail" and species == "puffino":
        obj = curled_puffino_tail(mat, profile)
    else:
        sculpt_subdiv = 1 if profile == "sculpt" else 0
        segments, rings = (48, 32) if profile == "sculpt" else (32, 20)
        obj = sculpt_part(name, location, scale, mat, sculpt_subdiv,
                          segments=segments, rings=rings)
    if species == "puffino" and name == "Body":
        for vertex in obj.data.vertices:
            taper = vertex.co.z / scale[2]
            vertex.co.x *= 1.05 - 0.14 * taper
            vertex.co.y *= 1.05 - 0.09 * taper
    if name == "Head":
        relief = 0.0
        for vertex in obj.data.vertices:
            x, y, z = vertex.co
            front = min(1.0, max(0.0, (-y - 0.20) / 0.20))
            cheek = math.exp(-((abs(x) - 0.37) / 0.15)**2 - ((z + 0.12) / 0.17)**2)
            muzzle = math.exp(-(x / 0.23)**2 - ((z + 0.17) / 0.15)**2)
            eye = math.hypot((abs(x) - 0.24) / 0.16, z / 0.19)
            socket = math.exp(-(eye / 0.63)**4)
            rim = math.exp(-((eye - 1.15) / 0.27)**2)
            displacement = front * (0.060 * socket
                                    - (0.085 if species == "puffino" else 0.042) * cheek
                                    - 0.053 * muzzle - 0.018 * rim)
            vertex.co.x *= 1 + (0.10 * cheek if species == "puffino" else 0)
            vertex.co.y += displacement
            relief = max(relief, abs(displacement))
        obj["integrated_face_relief"] = relief
    if name == "Head":
        face_keys(obj)
    if name.startswith("Ear"):
        skin(obj, rig, bone, tip, start=-0.28, end=0.31)
    elif name == "Tail":
        skin(obj, rig, bone, tip, axis=0, start=-0.37, end=0.37)
    else:
        skin(obj, rig, bone)

def _add_species_extras(species, rig, ivory, coral, pink):
    extras = []
    if species == "lunari":
        extras = [
            ("Antenna_L", (-0.22, 0.04, 1.85), (0.055, 0.055, 0.25), coral),
            ("Antenna_R", (0.22, 0.04, 1.85), (0.055, 0.055, 0.25), coral),
            ("StarOrb_L", (-0.22, 0.04, 2.08), (0.13, 0.13, 0.13), pink),
            ("StarOrb_R", (0.22, 0.04, 2.08), (0.13, 0.13, 0.13), pink),
        ]
    elif species == "sproutle":
        extras = [
            ("LeafCrown_L", (-0.16, 0.01, 1.84), (0.12, 0.07, 0.29), coral),
            ("LeafCrown_R", (0.16, 0.01, 1.84), (0.12, 0.07, 0.29), pink),
            ("BloomBud", (0, -0.01, 2.08), (0.10, 0.10, 0.14), ivory),
        ]
    elif species == "bubblin":
        extras = [
            ("CloudOrb_A", (-0.33, 0.04, 1.75), (0.17, 0.17, 0.17), pink),
            ("CloudOrb_B", (0.14, 0.10, 1.88), (0.19, 0.19, 0.19), coral),
            ("CloudOrb_C", (0.43, 0.07, 1.70), (0.14, 0.14, 0.14), pink),
        ]
    for name, location, scale, mat in extras:
        ornament = sculpt_part(name, location, scale, mat, 0, segments=16, rings=12)
        skin(ornament, rig, "head")

def _add_creature_details(rig, details, pink):
    for name, location, scale, mat, bone in details:
        obj = sculpt_part(name, location, scale, mat, 0,
                          segments=24 if name.startswith("Foot_") else 16,
                          rings=16 if name.startswith("Foot_") else 12)
        if name.startswith("Eye_"):
            layer = obj.data.uv_layers.active
            for polygon in obj.data.polygons:
                for loop_index in polygon.loop_indices:
                    vertex = obj.data.vertices[obj.data.loops[loop_index].vertex_index]
                    layer.data[loop_index].uv = (0.5 + vertex.co.x / (2 * scale[0]),
                                                 0.5 + vertex.co.z / (2 * scale[2]))
        if name.startswith("Paw_"):
            for vertex in obj.data.vertices:
                root = max(0.0, min(1.0, vertex.co.z / 0.19))
                vertex.co.x *= 1.0 - 0.35 * root
                vertex.co.y -= 0.045 * max(0.0, -vertex.co.z) / 0.19
        if name.startswith("Foot_"):
            obj.data.materials.append(pink)
            for vertex in obj.data.vertices:
                vertex.co.y -= 0.018 * max(0.0, -vertex.co.y / 0.25)**2
            for polygon in obj.data.polygons:
                c = polygon.center
                polygon.material_index = int(
                    c.y < -0.12 and c.z < 0.025 and abs(c.x) < 0.18)
        if name in ("Mouth", "Eye_L", "Eye_R"):
            face_feature_keys(obj)
        skin(obj, rig, bone)

def build_creature(rig: bpy.types.Object, species: str, profile: str, texture_dir=None) -> None:
    palettes = {
        "puffino": ((0.95, 0.82, 0.71, 1), (0.95, 0.48, 0.32, 1),
                    (1.0, 0.64, 0.60, 1), (0.17, 0.10, 0.15, 1)),
        "lunari": ((0.94, 0.91, 0.99, 1), (0.56, 0.68, 0.95, 1),
                   (0.73, 0.64, 0.99, 1), (0.14, 0.18, 0.42, 1)),
        "sproutle": ((0.95, 0.93, 0.75, 1), (0.49, 0.70, 0.32, 1),
                     (0.70, 0.85, 0.49, 1), (0.16, 0.28, 0.15, 1)),
        "bubblin": ((0.98, 0.89, 0.92, 1), (0.94, 0.58, 0.78, 1),
                    (0.74, 0.53, 0.91, 1), (0.28, 0.15, 0.34, 1)),
    }
    body_color, accent_color, fin_color, eye_color = palettes[species]
    ivory = material(species + "_Body", body_color)
    coral = material(species + "_Accent", accent_color)
    pink = material(species + "_Fin", fin_color)
    dark = material(species + "_Eyes", eye_color)
    eyes = material(species + "_PaintedEyes", accent_color)
    configure_fur_albedo(eyes, accent_color, texture_dir, eye=True)
    shine = material(species + "_Light", (1.0, 0.98, 0.92, 1))
    brown = material(species + "_Nubs", (0.63, 0.30, 0.18, 1))
    tail_bands = material(species + "_TailBands", accent_color)
    configure_tail_bands(tail_bands, body_color, accent_color, texture_dir, species)
    for fur, color in ((ivory, body_color), (coral, accent_color),
                       (pink, fin_color)):
        configure_fur_albedo(fur, color, texture_dir)
        configure_fur_shader(fur)
    eye_node = eyes.node_tree.nodes.get("Principled BSDF")
    eye_node.inputs["Roughness"].default_value = 0.12
    if eye_node.inputs.get("Coat Weight") is not None:
        eye_node.inputs["Coat Weight"].default_value = 0.4
    ear_scale = {
        "puffino": (0.22, 0.13, 0.35),
        "lunari": (0.23, 0.11, 0.53),
        "sproutle": (0.23, 0.10, 0.47),
        "bubblin": (0.27, 0.17, 0.28),
    }[species]
    silhouette = {
        "puffino": ((0.49, 0.42, 0.57), (0.57, 0.49, 0.48), (0.42, 0.32, 0.37)),
        "lunari": ((0.40, 0.36, 0.67), (0.54, 0.46, 0.54), (0.24, 0.21, 0.62)),
        "sproutle": ((0.57, 0.46, 0.64), (0.54, 0.46, 0.50), (0.33, 0.22, 0.53)),
        "bubblin": ((0.63, 0.49, 0.46), (0.66, 0.53, 0.49), (0.32, 0.35, 0.32)),
    }
    body_scale, head_scale, tail_scale = silhouette[species]
    tail_positions = {
        "puffino": (0.77, 0.50, 0.76),
        "lunari": (0.68, 0.52, 1.04),
        "sproutle": (0.76, 0.50, 0.90),
        "bubblin": (0.78, 0.49, 0.68),
    }
    parts = [
        ("Body", (0, 0, 0.62), body_scale, ivory, "body", None),
        ("Head", (0, -0.04, 1.18), head_scale, ivory, "head", None),
        ("Ear_L", (-0.55, 0, 1.80), ear_scale, coral, "ear_root_L", "ear_tip_L"),
        ("Ear_R", (0.55, 0, 1.80), ear_scale, coral, "ear_root_R", "ear_tip_R"),
        ("Tail", tail_positions[species], tail_scale, tail_bands, "tail_root", "tail_tip"),
    ]
    for name, location, scale, mat, bone, tip in parts:
        _add_primary_part(name, location, scale, mat, bone, tip, rig, species, profile, pink)
    details = [
        ("Horn_L", (-0.19, -0.07, 1.62), (0.10, 0.10, 0.18), brown, "head"),
        ("Horn_R", (0.19, -0.07, 1.62), (0.10, 0.10, 0.18), brown, "head"),
        ("Eye_L", (-0.24, -0.45, 1.20), (0.185, 0.028, 0.205), eyes, "head"),
        ("Eye_R", (0.24, -0.45, 1.20), (0.185, 0.028, 0.205), eyes, "head"),
        ("Paw_L", (-0.32, -0.34, 0.61), (0.17, 0.18, 0.19), ivory, "body"),
        ("Paw_R", (0.32, -0.34, 0.61), (0.17, 0.18, 0.19), ivory, "body"),
        ("Foot_L", (-0.32, -0.25, 0.16), (0.23, 0.25, 0.12), coral, "body"),
        ("Foot_R", (0.32, -0.25, 0.16), (0.23, 0.25, 0.12), coral, "body"),
        ("Nose", (0, -0.54, 1.02), (0.07, 0.05, 0.05), brown, "head"),
        ("Mouth", (0, -0.48, 0.93), (0.12, 0.07, 0.08), dark, "jaw"),
    ]
    if species != "puffino":
        details = [detail for detail in details if not detail[0].startswith("Horn_")]
    _add_creature_details(rig, details, pink)
    _add_species_extras(species, rig, ivory, coral, pink)
    def face_detail(name, location, dimensions, material, subdivisions=0):
        if profile == "sculpt":
            return sculpt_part(name, location, dimensions, material, subdivisions)
        return sculpt_part(name, location, dimensions, material, 0, segments=12, rings=8)
    decorate_face(species, rig, face_detail, skin, (ivory, coral, pink, dark, shine, brown))

def studio() -> None:
    world = bpy.data.worlds.new("WarmStudio")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.62, 0.47, 0.45, 1)
    bpy.context.scene.world = world
    bpy.ops.object.camera_add(location=(2.75, -5.50, 2.65))
    camera = bpy.context.object
    target = Vector((0, 0, 1.04))
    camera.rotation_euler = (target - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = 3.15
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
    args = parse_args()
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    rig = create_armature()
    build_creature(rig, args.species, args.profile, output)
    studio()
    bpy.context.scene["artifact_status"] = "SCULPT_STUDY_NOT_FINAL"
    bpy.context.scene["source_species"] = args.species
    bpy.context.scene["quality_profile"] = args.profile
    bpy.context.scene.render.resolution_x = 1024
    bpy.context.scene.render.resolution_y = 1024
    bpy.context.scene.render.resolution_percentage = 100

    name = args.species + "_" + args.profile
    bpy.ops.wm.save_as_mainfile(filepath=str(output / (name + ".blend")))
    exported = output / (name + ".glb")
    result = bpy.ops.export_scene.gltf(
        filepath=str(exported),
        export_format="GLB",
        export_skins=True,
        export_morph=True,
        export_animations=False,
    )
    if "FINISHED" not in result or not exported.is_file():
        raise RuntimeError("Blender GLB export did not finish.")
    report = validate(exported)
    print("Validated GLB geometry, morphs, skinning and albedo:", report)

    bpy.ops.object.select_all(action="DESELECT")
    for obj in bpy.data.objects:
        if obj.type in {"ARMATURE", "MESH"}:
            obj.select_set(True)
    bpy.context.view_layer.objects.active = rig
    fbx = output / (name + ".fbx")
    fbx_result = bpy.ops.export_scene.fbx(
        filepath=str(fbx), use_selection=True, object_types={"ARMATURE", "MESH"},
        axis_forward="-Z", axis_up="Y", add_leaf_bones=False,
        use_mesh_modifiers=False, bake_anim=False,
        path_mode="COPY", embed_textures=True,
    )
    if ("FINISHED" not in fbx_result or not fbx.is_file()
            or fbx.stat().st_size < 1024
            or fbx.open("rb").read(23) != b"Kaydara FBX Binary  \x00\x1a\x00"):
        raise RuntimeError("Blender Unity FBX export is missing or malformed.")
    print("Unity FBX export staged for native Editor import:", fbx.name)
    print("Visual quality is NOT approved until native proof renders are reviewed.")


if __name__ == "__main__":
    main()
