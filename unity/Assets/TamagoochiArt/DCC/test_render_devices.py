"""Offline, Blender-independent tests for fail-closed OptiX selection."""

import unittest
from types import SimpleNamespace

from render_devices import configure_cycles


def fake_system(gpus=None, available=True):
    devices = gpus if gpus is not None else [
        SimpleNamespace(name="NVIDIA GeForce RTX 4090", type="OPTIX", use=False),
        SimpleNamespace(name="Intel CPU", type="CPU", use=True),
    ]
    cycles_prefs = SimpleNamespace(
        compute_device_type="NONE",
        devices=devices,
        get_devices=lambda: None,
    )
    addons = {"cycles": SimpleNamespace(preferences=cycles_prefs)} if available else {}
    preferences = SimpleNamespace(addons=addons)
    scene = SimpleNamespace(
        render=SimpleNamespace(engine=None),
        cycles=SimpleNamespace(device=None, samples=0, use_denoising=False),
    )
    return scene, preferences, devices


class RenderDeviceTests(unittest.TestCase):
    def test_cpu_remains_supported(self):
        scene, prefs, _ = fake_system(available=False)
        result = configure_cycles(scene, prefs, "cpu", samples=12)
        self.assertEqual((scene.cycles.device, result["device"]), ("CPU", "CPU"))
        self.assertEqual(scene.cycles.samples, 12)

    def test_optix_selects_only_requested_gpu(self):
        scene, prefs, devices = fake_system()
        result = configure_cycles(scene, prefs, "optix", samples=128)
        self.assertEqual(scene.cycles.device, "GPU")
        self.assertEqual(result["compute_type"], "OPTIX")
        self.assertEqual(result["selected_gpus"], ["NVIDIA GeForce RTX 4090"])
        self.assertTrue(devices[0].use)
        self.assertFalse(devices[1].use)

    def test_gpu_mode_cannot_fallback_to_cpu(self):
        cpu = SimpleNamespace(name="Intel CPU", type="CPU", use=True)
        scene, prefs, _ = fake_system([cpu])
        with self.assertRaisesRegex(RuntimeError, "not found"):
            configure_cycles(scene, prefs, "optix")
        self.assertFalse(cpu.use)
        self.assertNotEqual(scene.cycles.device, "CPU")

    def test_missing_cycles_addon_fails(self):
        scene, prefs, _ = fake_system(available=False)
        with self.assertRaisesRegex(RuntimeError, "add-on unavailable"):
            configure_cycles(scene, prefs, "optix")

    def test_wrong_gpu_is_not_accepted(self):
        device = SimpleNamespace(name="NVIDIA GeForce RTX 3090", type="OPTIX", use=True)
        scene, prefs, _ = fake_system([device])
        with self.assertRaisesRegex(RuntimeError, "RTX 4090"):
            configure_cycles(scene, prefs, "optix")
        self.assertFalse(device.use)

    def test_invalid_backend_fails(self):
        scene, prefs, _ = fake_system()
        with self.assertRaises(ValueError):
            configure_cycles(scene, prefs, "cuda")


if __name__ == "__main__":
    unittest.main()
