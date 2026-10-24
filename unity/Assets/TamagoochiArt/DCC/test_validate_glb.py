"""Synthetic GLB gate tests, separate from real Blender mesh and visual QA."""
import json
import struct
import tempfile
import unittest
from pathlib import Path

from validate_glb import validate


def fixture(path: Path, *, morphs=True, textures=True, triangles=18000,
            morph_positions=True, split_morphs=False) -> None:
    attrs = {name: 1 for name in ("POSITION", "NORMAL", "TEXCOORD_0", "JOINTS_0", "WEIGHTS_0")}
    head = {"extras": {"targetNames": ["Smile", "Pout", "CheekPuff", "Curious"] if morphs else []},
            "primitives": [{"attributes": attrs, "indices": 0,
                            "targets": [{"POSITION": 1} if morph_positions else {} for _ in range(4)]}]}
    meshes = [head] + [{"primitives": [{"attributes": attrs, "indices": 0}]}
                       for _ in range(4)]
    if split_morphs:
        head["extras"]["targetNames"] = ["Smile", "Pout"]
        meshes[1]["extras"] = {"targetNames": ["CheekPuff", "Curious"]}
    doc = {
        "asset": {"version": "2.0"}, "buffers": [{"byteLength": 4}],
        "accessors": [{"count": triangles * 3 // 5}, {"count": 5000}],
        "nodes": [{"mesh": 0, "skin": 0}],
        "meshes": meshes, "skins": [{"joints": list(range(10))}],
        "images": [{"bufferView": 0} for _ in range(4)] if textures else [],
        "textures": [{"source": i} for i in range(4)] if textures else [],
        "materials": [{"pbrMetallicRoughness": {"baseColorTexture": {"index": i}}}
                      for i in range(4)],
    }
    header = json.dumps(doc, separators=(",", ":")).encode()
    header += b" " * (-len(header) % 4)
    binary = b"\0" * 4
    size = 12 + 8 + len(header) + 8 + len(binary)
    path.write_bytes(
        struct.pack("<4sII", b"glTF", 2, size)
        + struct.pack("<I4s", len(header), b"JSON") + header
        + struct.pack("<I4s", len(binary), b"BIN\0") + binary
    )


class GlbContractTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name) / "puffino_mobile.glb"

    def test_valid_structural_fixture(self):
        fixture(self.path)
        self.assertTrue(validate(self.path)["structural_pass"])

    def test_missing_head_morphs_fail(self):
        fixture(self.path, morphs=False)
        with self.assertRaisesRegex(ValueError, "morph"):
            validate(self.path)

    def test_morph_names_split_between_meshes_fail(self):
        fixture(self.path, split_morphs=True)
        with self.assertRaisesRegex(ValueError, "morph"):
            validate(self.path)

    def test_empty_head_morph_position_targets_fail(self):
        fixture(self.path, morph_positions=False)
        with self.assertRaisesRegex(ValueError, "morph"):
            validate(self.path)

    def test_missing_exported_images_fail(self):
        fixture(self.path, textures=False)
        with self.assertRaisesRegex(ValueError, "albedo"):
            validate(self.path)

    def test_mobile_budget_fail(self):
        fixture(self.path, triangles=55000)
        with self.assertRaisesRegex(ValueError, "Mobile triangle budget"):
            validate(self.path)

    def test_invalid_binary_chunk_fail(self):
        fixture(self.path)
        data = bytearray(self.path.read_bytes())
        data[-8:-4] = b"FAIL"
        self.path.write_bytes(data)
        with self.assertRaisesRegex(ValueError, "binary geometry"):
            validate(self.path)


if __name__ == "__main__":
    unittest.main()
