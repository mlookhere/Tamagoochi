# Blender sculpt and rig study

This directory is a standalone DCC tool, not a Unity runtime dependency. No Blender binaries or third-party creature art are committed.

## Run

From Blender 4.x with the bundled glTF exporter enabled:

```bash
blender --background --python unity/Assets/TamagoochiArt/DCC/make_puffino_sculpt.py -- --output /absolute/output/directory --species puffino --profile sculpt
```

The script stages an editable `<species>_<profile>.blend`, a validated skinned/morph-target `<species>_<profile>.glb`, a Unity-native-importable `<species>_<profile>.fbx` (skin, shape keys, embedded textures), and UV albedo PNGs in `Textures/`, *if execution succeeds*. Unity FBX import, rig deformation, materials, scale/orientation and blend shapes still require a real Unity 6000.0.62f1 Editor audit. Valid species: `puffino`, `lunari`, `sproutle`, `bubblin`. These are not pre-rendered or verified in this repository.

Run the command separately for each starter species. Shapes share an armature convention but differ in ear-fin silhouette, colors and species-defining accessories (horn nubs, lunar antennas, sprout crown or cloud orbs). This is an **artist base**, not four polished final sculpts.

### What the script does

- Builds distinct subdivision-smoothed quad meshes for Puffino's body, head, ear fins and tail; the anatomy intentionally does not match any exact real animal.
- Creates per-species original pastel material palettes, stylized eyes, ears, paws, muzzle details and accessory silhouettes.
- Adds an armature with 10 named bones (`root`, `body`, `head`, ear roots/tips, tail root/tip and `jaw`), associated skin weights, and four named facial morphs.
- Prepares soft three-point studio lighting and an orthographic preview camera.
- Exports Blender source, glTF binary and a separate Y-up/-Z-forward FBX with leaf bones disabled and preserved shape keys for Unity's built-in ModelImporter. Verify the actual Unity import: vertex weights, four blend shapes, materials, handedness, scale and face-forward direction.

### Next artist pass

1. Refine actual silhouette in Sculpt Mode; smooth intersections; add original cheek fur clusters, petal details and tail stripes.
2. Retopologize facial landmarks and deformable appendage joints; place loops around mouth, cheek, neck and ear fold.
3. Add fur-groom/texture normals sparingly; use an optimized low-poly game mesh while retaining high-poly sculpt source.
4. Validate all shape keys at 0%, 50%, 100% and combined. Tune eyelids and lips to avoid clipping.
5. Add expressive armature pose actions and polish timing; export clips as separate tracked action assets.
6. Import skinned FBX/glTF to Unity; confirm bone and face shape names and stable prefab/catalog references.

### Naming contract

Blender rig names map to Unity sketch equivalents:

| Blender bone | Unity prototype study |
| --- | --- |
| `root`/`body` | `VisualRoot` / `BodyRoot` |
| `head` | `Head` |
| `ear_root_L`, `ear_tip_L` | `EarRoot_L`, `EarTip_L` |
| `ear_root_R`, `ear_tip_R` | `EarRoot_R`, `EarTip_R` |
| `tail_root`, `tail_tip` | `TailRoot`, `TailTip` |
| `jaw` | `Jaw` |

Facial morph names are identical: `Smile`, `Pout`, `CheekPuff`, `Curious`. Retain these after replacing the study mesh.

**Not verified:** Blender is unavailable in the execution environment, so this script has not been run here. Import/export, deformation, shading and morph correctness need a Blender/Unity acceptance run. Neither a hypothetical `.blend` nor the `.glb` is counted as completed art until generated and inspected.

### Asset integrity and quality evidence

Use `--profile sculpt` for detailed authoring and `--profile mobile` for a lighter mobile preview. Both should be exported and checked; the mobile GLB is rejected when it exceeds the 30,000 triangle starter-study ceiling.

The export script calls `validate_glb.py` automatically and fails if real geometry, skinned joints, UVs, four facial morphs, or portable image textures are missing. This is a **structural** validator; it does not certify that the creature looks good. A portable `Textures/<species>_*_Albedo.png` file is created for base fur, fin color and striped tail markings so the hero palette is not dependent on Blender-only shader nodes.

For visual proof, run:

```bash
blender --background --python unity/Assets/TamagoochiArt/DCC/render_quality_review.py -- --output /absolute/review --engine cycles --samples 32 --resolution 960
```

It emits front/three-quarter/side/back and expression renders for all four species, plus a real 256px **mobile-profile** image per species. Inspect the images, not just the mesh count, and record quality acceptance against `VISUAL_QUALITY_GATE.md`.

**Current status:** neither Blender export nor the 32 proof renders could be executed from this conversation's environment. The source is available, the exported meshes/images are not yet verified.

For a quick **Blender-independent** check of the GLB validator itself:

```bash
cd unity/Assets/TamagoochiArt/DCC
python -m unittest -v test_validate_glb.py
```

The five synthetic contract tests passed locally when authored. These are parser tests; they do **not** generate, render, aesthetically evaluate, or import an actual creature mesh. The Blender export validator and rendered proof checks remain separate required gates.

## RTX 4090 OptiX rendering (private Windows runner)

The Blender proof script accepts `--device optix` to use your installed RTX 4090. CPU is still the default for the public GitHub-hosted runner.

```powershell
# On a computer with Blender 4.5.x installed and the RTX 4090 NVIDIA driver:
blender.exe --background --factory-startup --python-exit-code 1 --python unity/Assets/TamagoochiArt/DCC/render_quality_review.py -- --output C:/tamagoochi-reviews --species puffino --engine cycles --device optix --gpu-name "RTX 4090" --samples 128 --resolution 960
```

Blender's headless Cycles preferences must set `compute_device_type = "OPTIX"`, call `get_devices()`, select the matching GPU and **disable CPU** before setting `scene.cycles.device = "GPU"`. This is implemented in `DCC/render_devices.py`. If the NVIDIA driver, Cycles add-on, or requested RTX 4090 is not available, the render job **fails** rather than silently switching to CPU. The resulting `quality_report.json` includes the requested backend, the discovered renderer and GPU name, but this does not replace actual GPU/visual inspection.

Only launch GPU workflows from the private `mlookhere/Tamagoochi-GPU-Render` repository, using its dedicated self-hosted runner and an **immutable** commit SHA from the public art branch. Never attach a personal Windows workstation as a self-hosted runner to the public game repository. Do not run workflows from untrusted pull requests on the self-hosted runner.

Run independent selection tests without Blender:

```bash
python -m unittest discover -s unity/Assets/TamagoochiArt/DCC -p 'test_render_devices.py' -v
```

These tests verify both CPU and OptiX selection logic using fake devices; actual RTX execution must be verified by the private GPU Actions job.
