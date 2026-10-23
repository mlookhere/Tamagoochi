# Blender sculpt and rig study

This directory is a standalone DCC tool, not a Unity runtime dependency. No Blender binaries or third-party creature art are committed.

## Run

From Blender 4.x with the bundled glTF exporter enabled:

```bash
blender --background --python unity/Assets/TamagoochiArt/DCC/make_puffino_sculpt.py -- --output /absolute/output/directory
```

The script stages a **real editable** `puffino_sculpt_study.blend` and a skinned + morph-target `puffino_sculpt_study.glb` in the chosen output directory, *if execution succeeds*. These files are not pre-rendered or verified in this repository.

### What the script does

- Builds distinct subdivision-smoothed quad meshes for Puffino's body, head, ear fins and tail; the anatomy intentionally does not match any exact real animal.
- Creates the base original ivory/coral/peach material library, stylized eyes, horns, paws and muzzle details.
- Adds an armature with 10 named bones (`root`, `body`, `head`, ear roots/tips, tail root/tip and `jaw`), associated skin weights, and four named facial morphs.
- Prepares soft three-point studio lighting and an orthographic preview camera.
- Exports both Blender-native source and glTF binary. Blender's Z-up and glTF's coordinate conversion differ from Unity's Y-up; inspect axes, pose/rest transforms, eye direction and unit scale in Unity before use.

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
