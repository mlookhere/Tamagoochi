"""Validate actual Tamagoochi skinned GLB exports before Unity ingestion.

Run with Python 3.11+; no Blender dependency. A passing structural report
is NOT aesthetic approval and does not prove Unity import or mobile performance.
"""
from __future__ import annotations

import argparse
import json
import struct
from pathlib import Path

REQUIRED_MORPHS = frozenset(("Smile", "Pout", "CheekPuff", "Curious"))


def read_document(path: Path) -> dict:
    raw = path.read_bytes()
    if len(raw) < 20 or raw[:4] != b"glTF":
        raise ValueError("Missing GLB binary header")
    magic, version, declared = struct.unpack_from("<4sII", raw)
    if version != 2 or declared != len(raw):
        raise ValueError("GLB version or length mismatch")
    length, kind = struct.unpack_from("<I4s", raw, 12)
    if kind != b"JSON" or length < 2 or length % 4:
        raise ValueError("First chunk must be aligned JSON")
    end = 20 + length
    if end > len(raw):
        raise ValueError("JSON chunk exceeds the file")
    document = json.loads(raw[20:end].decode("utf-8"))
    if not isinstance(document, dict) or document.get("asset", {}).get("version") != "2.0":
        raise ValueError("Invalid glTF JSON document")
    if end + 8 > len(raw):
        raise ValueError("No binary geometry chunk")
    binary_length, binary_type = struct.unpack_from("<I4s", raw, end)
    if binary_type != b"BIN\x00" or binary_length < 4 or end + 8 + binary_length != len(raw):
        raise ValueError("Missing or malformed binary geometry payload")
    if not document.get("buffers") or document["buffers"][0].get("byteLength", 0) < 4:
        raise ValueError("GLB JSON does not declare geometry data")
    return document


def triangle_count(document: dict) -> int:
    accessors = document.get("accessors", [])
    count = 0
    for mesh in document.get("meshes", []):
        for primitive in mesh.get("primitives", []):
            if primitive.get("mode", 4) != 4:
                continue
            if "indices" in primitive:
                count += accessors[primitive["indices"]]["count"] // 3
            else:
                positions = primitive.get("attributes", {}).get("POSITION")
                if positions is not None:
                    count += accessors[positions]["count"] // 3
    return count


def validate(path: Path, mobile_budget: int = 30000) -> dict:
    document = read_document(path)
    meshes = document.get("meshes", [])
    skins = document.get("skins", [])
    images = document.get("images", [])
    if not meshes or not skins or not document.get("nodes"):
        raise ValueError("Missing renderable meshes, scene nodes or skeleton")
    if max(len(item.get("joints", [])) for item in skins) < 4:
        raise ValueError("Skeleton is missing deform joints")
    if len(images) < 4 or not document.get("textures"):
        raise ValueError("Four UV albedo textures were not exported")

    materials = document.get("materials", [])
    if len(materials) < 4:
        raise ValueError("Missing distinct material regions")
    textured = sum(
        "baseColorTexture" in material.get("pbrMetallicRoughness", {})
        for material in materials
    )
    if textured < 4:
        raise ValueError("Portable base color texture links are missing")

    morph_names = set()
    weighted_primitives = 0
    uv_primitives = 0
    targets = 0
    for mesh in meshes:
        morph_names.update(mesh.get("extras", {}).get("targetNames", []))
        for primitive in mesh.get("primitives", []):
            attributes = primitive.get("attributes", {})
            if "JOINTS_0" in attributes and "WEIGHTS_0" in attributes:
                weighted_primitives += 1
            if "TEXCOORD_0" in attributes:
                uv_primitives += 1
            targets += len(primitive.get("targets", []))
    if not REQUIRED_MORPHS.issubset(morph_names) or targets < 4:
        raise ValueError("Head facial morph names or target frames missing")
    if weighted_primitives < 5 or uv_primitives < 5:
        raise ValueError("Expected skinned, UV-mapped creature parts missing")

    triangles = triangle_count(document)
    if triangles < 3000:
        raise ValueError("No meaningful modeled geometry")
    if "_mobile" in path.stem and triangles > mobile_budget:
        raise ValueError("Mobile triangle budget exceeded")

    return {
        "path": str(path),
        "meshes": len(meshes),
        "skins": len(skins),
        "images": len(images),
        "textured_materials": textured,
        "skinned_primitives": weighted_primitives,
        "uv_primitives": uv_primitives,
        "morphs": sorted(REQUIRED_MORPHS),
        "triangles": triangles,
        "structural_pass": True,
        "visual_approval": "required",
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("glb", nargs="+", type=Path)
    args = parser.parse_args()
    for path in args.glb:
        print(json.dumps(validate(path), sort_keys=True))


if __name__ == "__main__":
    main()
