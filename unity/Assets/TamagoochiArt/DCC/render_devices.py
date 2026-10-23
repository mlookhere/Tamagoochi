"""Explicit Cycles CPU or RTX OptiX device selection for headless Blender.

This module deliberately imports no bpy at module load, permitting regular
unittest verification of the no-silent-CPU-fallback policy.
"""


def configure_cycles(scene, preferences, device="cpu", gpu_name="RTX 4090", samples=32):
    """Configure render device and return audit metadata; fail closed for GPU."""
    if device not in ("cpu", "optix"):
        raise ValueError("Render device must be cpu or optix")
    scene.render.engine = "CYCLES"
    scene.cycles.samples = samples
    scene.cycles.use_denoising = True

    if device == "cpu":
        scene.cycles.device = "CPU"
        return {"device": "CPU", "compute_type": "CPU", "selected_gpus": []}

    cycles_addon = preferences.addons.get("cycles")
    if cycles_addon is None:
        raise RuntimeError("Blender Cycles add-on unavailable; cannot enable OptiX")
    cycles = cycles_addon.preferences
    try:
        cycles.compute_device_type = "OPTIX"
        cycles.get_devices()  # Refresh devices in the current headless process.
    except (RuntimeError, TypeError, ValueError) as exc:
        raise RuntimeError("Unable to initialize Blender OptiX; check NVIDIA Studio driver") from exc

    available = tuple(cycles.devices)
    match = [
        entry for entry in available
        if entry.type == "OPTIX" and gpu_name.casefold() in entry.name.casefold()
    ]
    for entry in available:
        entry.use = entry in match  # Explicitly disable CPU and unrelated devices.
    if not match:
        candidates = ", ".join(f"{entry.name} ({entry.type})" for entry in available)
        raise RuntimeError(
            f"Requested OptiX GPU '{gpu_name}' not found. Available: {candidates or 'none'}"
        )

    scene.cycles.device = "GPU"
    selected = [entry.name for entry in match]
    print("TAMAGOOCHI_RENDER_DEVICE=OPTIX")
    print("TAMAGOOCHI_RENDER_GPU=" + ", ".join(selected))
    return {"device": "GPU", "compute_type": "OPTIX", "selected_gpus": selected}
