"""Fail-closed visual QA renderer for the original stylized creature studies.

Run in Blender 4.x:
  blender -b -P render_quality_review.py -- --output /absolute/review

Generates front/3-quarter/side/back plus expression proof renders per species.
It NEVER grants creative/art approval automatically; reviewers inspect the PNGs.
"""

from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

from make_puffino_sculpt import build_creature, create_armature, studio


SPECIES = ("puffino", "lunari", "sproutle", "bubblin")
REQUIRED_MORPHS = ("Smile", "Pout", "CheekPuff", "Curious")
ANGLES = {"front": 0.0, "three_quarter": 42.0, "side": 90.0, "back": 180.0}
DETAIL_SIGNATURES = {
    "puffino": ("Horn_L", "Horn_R", "ForelockPetal_1", "CheekTuft_L_0"),
    "lunari": ("Antenna_L", "StarOrb_L", "MoonSigil", "ForelockPetal_1"),
    "sproutle": ("LeafCrown_L", "BloomBud", "LeafFrill_1", "ForelockPetal_1"),
    "bubblin": ("CloudOrb_A", "CloudOrb_B", "BubbleNeck_0", "ForelockPetal_1"),
}


def parse_args() -> argparse.Namespace:
    arguments = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--resolution", type=int, default=960)
    parser.add_argument("--engine", choices=("cycles", "eevee"), default="cycles")
    parser.add_argument("--samples", type=int, default=32)
    parser.add_argument("--species", choices=("all",) + SPECIES, default="all")
    return parser.parse_args(arguments)


def reset(species: str, profile: str = "sculpt", engine: str = "cycles",
          samples: int = 32):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    rig = create_armature()
    build_creature(rig, species, profile)
    studio()
    scene = bpy.context.scene

    # CPU Cycles works on headless render farms without an EEVEE GPU context.
    if engine == "cycles":
        scene.render.engine = "CYCLES"
        scene.cycles.device = "CPU"
        scene.cycles.samples = samples
        scene.cycles.use_denoising = True
    else:
        version = bpy.app.version
        scene.render.engine = ("BLENDER_EEVEE_NEXT"
                               if (4, 2, 0) <= version < (5, 0, 0)
                               else "BLENDER_EEVEE")
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    return rig


def mesh_metrics(species: str) -> dict:
    named = {obj.name for obj in bpy.data.objects}
    missing_details = sorted(set(DETAIL_SIGNATURES[species]) - named)
    skinned = []
    triangles = 0
    uv_failures = []
    weight_failures = []

    for obj in bpy.data.objects:
        if obj.type != "MESH":
            continue
        mesh = obj.data
        mesh.calc_loop_triangles()
        triangles += len(mesh.loop_triangles)
        if not mesh.uv_layers:
            uv_failures.append(obj.name)

        deforms = [modifier for modifier in obj.modifiers if modifier.type == "ARMATURE"]
        if deforms:
            skinned.append(obj.name)
            if len(obj.vertex_groups) == 0:
                weight_failures.append(obj.name)

    heads = [obj for obj in bpy.data.objects if obj.name == "Head" and obj.type == "MESH"]
    missing_morphs = []
    weak_morphs = []
    if len(heads) != 1 or not heads[0].data.shape_keys:
        missing_morphs = list(REQUIRED_MORPHS)
    else:
        blocks = heads[0].data.shape_keys.key_blocks
        for name in REQUIRED_MORPHS:
            if name not in blocks:
                missing_morphs.append(name)
                continue
            base = blocks["Basis"].data
            target = blocks[name].data
            movement = max((a.co - b.co).length for a, b in zip(base, target))
            if movement < 0.008:
                weak_morphs.append(name)

    return {
        "species": species,
        "mesh_objects": sum(obj.type == "MESH" for obj in bpy.data.objects),
        "triangles": triangles,
        "skinned_parts": len(skinned),
        "missing_signature_features": missing_details,
        "missing_morphs": missing_morphs,
        "weak_morphs": weak_morphs,
        "missing_uvs": uv_failures,
        "missing_skin_weights": weight_failures,
    }


def move_camera(degrees: float) -> None:
    angle = math.radians(degrees)
    camera = bpy.context.scene.camera
    camera.location = (5.7 * math.sin(angle), -5.7 * math.cos(angle), 2.45)
    target = Vector((0, 0, 1.07))
    camera.rotation_euler = (target - camera.location).to_track_quat("-Z", "Y").to_euler()


def expression(name: str) -> None:
    for obj in bpy.data.objects:
        if obj.type == "MESH" and obj.data.shape_keys:
            for key in obj.data.shape_keys.key_blocks:
                if key.name != "Basis":
                    key.value = 1.0 if key.name == name else 0.0


def save_render(path: Path, resolution: int) -> int:
    scene = bpy.context.scene
    scene.render.resolution_x = resolution
    scene.render.resolution_y = resolution
    scene.render.resolution_percentage = 100
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)
    if not path.is_file():
        raise RuntimeError("Blender did not write proof render: " + str(path))
    return path.stat().st_size


def species_review(species: str, target: Path, resolution: int,
                   engine: str, samples: int) -> dict:
    reset(species, engine=engine, samples=samples)
    metrics = mesh_metrics(species)
    screenshots = {}
    for angle, degrees in ANGLES.items():
        move_camera(degrees)
        path = target / (species + "_" + angle + ".png")
        screenshots[angle] = save_render(path, resolution)

    move_camera(0)
    for face in ("Smile", "Pout", "Curious"):
        expression(face)
        path = target / (species + "_face_" + face.lower() + ".png")
        screenshots["face_" + face] = save_render(path, resolution)
    # Review both genuine sculpt study and optimized mobile topology.
    reset(species, "mobile", engine=engine, samples=samples)
    metrics["mobile_triangles"] = mesh_metrics(species)["triangles"]
    metrics["mobile_budget"] = 30000

    # Phone-scale proof must use the optimized mobile mesh, not sculpt geometry.
    move_camera(0)
    expression("Smile")
    phone = target / (species + "_phone_256.png")
    screenshots["phone_256"] = save_render(phone, 256)
    metrics["proof_images"] = screenshots

    failures = (
        metrics["missing_signature_features"] or
        metrics["missing_morphs"] or
        metrics["weak_morphs"] or
        metrics["missing_uvs"] or
        metrics["missing_skin_weights"] or
        metrics["skinned_parts"] < 5 or
        metrics["mesh_objects"] < 20 or
        metrics["triangles"] < 12000 or
        metrics["mobile_triangles"] >= metrics["triangles"] or
        metrics["mobile_triangles"] > metrics["mobile_budget"] or
        any(size < (3000 if name == "phone_256" else 15000)
            for name, size in screenshots.items())
    )
    metrics["mechanical_pass"] = not failures
    return metrics


def main() -> None:
    args = parse_args()
    if not 512 <= args.resolution <= 2048:
        raise ValueError("QA resolution must be between 512 and 2048")
    if not 8 <= args.samples <= 256:
        raise ValueError("Samples must be between 8 and 256")
    directory = args.output.resolve()
    directory.mkdir(parents=True, exist_ok=True)
    results = []
    selected = SPECIES if args.species == "all" else (args.species,)
    for species in selected:
        results.append(species_review(species, directory, args.resolution,
                                      args.engine, args.samples))

    passed = all(row["mechanical_pass"] for row in results)
    report = {
        "schema": 1,
        "art_standard": "original stylized 3D creature; sculpt-quality review",
        "technical_checks_pass": passed,
        "creative_review": "required",
        "production_ready": False,
        "reason": "Review proof PNGs versus approved concepts, deformations and phone viewport.",
        "species": results,
    }
    (directory / "quality_report.json").write_text(
        json.dumps(report, indent=2) + "\n", encoding="utf-8")
    if not passed:
        raise RuntimeError("Mechanical art checks failed; inspect quality_report.json")
    print("Generated", len(results) * 8, "proof renders, including phone-scale images.")
    print("Creative approval is still required.")


if __name__ == "__main__":
    main()
