# Tamagoochi high-fidelity creature art contract — Issue #35

## Purpose

Ship original stylized 3D creatures which *hint* at familiar animals without literally replicating real species. Compact lovable baby silhouettes preserve recognizable DNA so later forest, lunar and ember evolution branches can change anatomy, appendages and material expression.

## Three distinct art levels

| Level | Available | Evidence needed |
| --- | --- | --- |
| Concept | Original high-detail render sheets shown in the creative discussion | Approval of original visual style, turnarounds and evolution lineage |
| Generated playable prototype | Four base + three evolved Unity primitive creatures; 16 clip blockouts; five props; nursery; FX/audio placeholders | Unity native import, prefab/generation and mobile tests; not yet run |
| Sculpt/rig study | Puffino high-density UV sphere-based skinned meshes, ear/tail bones, face keys and Blender authoring script | Actual Unity and Blender execution plus deformation checks; not yet run |
| Production sculpt | Not authored | Artist-quality separate sculpt source, retopology, game textures/UVs, validated skin/facial rig and mobile perf |

## Scale and export rules

- Character scale: baby form about 1.9 Unity units tall including ear tips; standing feet near scene ground.
- Unity up/forward: Y-up, front toward +Z in the in-editor Unity sculpt study. Blender source: Z-up and front toward -Y; inspect glTF import conversions.
- Skinning must retain a root motion pivot at the feet and a deterministic neutral/bind pose.
- Avoid extreme ear/tail bone poses and mesh self-intersections; validate at 0, ±30, ±60 degrees for flexible joints.
- Surface materials: warm pastel roughness; expressive eye highlights, no forced cinematic fur simulation on mobile.
- Bake high-poly appearance into compact normal/occlusion/roughness/albedo maps where supported, with texture resolution profiles for low/mid/high phones.

## Rig and performance channels

- Stable prototype id: `puffino_sculpt_study` (art study). Production should keep stable *species* `puffino` when integrated, without replacing the current gameplay asset before approval.
- Skinned study: `BodyMesh`, `FaceMesh`, `EarMesh_L`, `EarMesh_R`, `TailMesh`. Mesh assets must carry UVs, valid bind poses and corresponding weights.
- Bone handles: `BodyRoot`, `Head`, `EarRoot_L`, `EarTip_L`, `EarRoot_R`, `EarTip_R`, `TailRoot`, `TailTip`, `Jaw`.
- Head morph targets: `Smile`, `Pout`, `CheekPuff`, `Curious`. Eye scales provide blinking; replace with eyelid morphs when face retopology is finished.
- `CreaturePerformance` coordinates mood-triggered bone secondary motion and face expression. `CreatureFacialRig` is optional when Animator drives shape keys directly.
- Six authored curve studies: `face_happy`, `face_pouty`, `face_curious`, `face_eating`, `face_sleepy`, `face_blink`.
- Do **not** play Animator curves on `VisualRoot`, bones, eye scales or `blendShape.*` simultaneously with corresponding procedural writers. Assign clear ownership or separate additive layers.

## Affinity VFX palette

| Cue | Core hues | Visual choreography |
| --- | --- | --- |
| Happy | Coral -> peach | Gentle outward confetti / floating hearts, no flash |
| Sleep | Periwinkle -> lilac | Soft upward drift, low particle count |
| Forest evolution | Leaf green -> cream | Sprout motes circle into body, then dissipate |
| Lunar evolution | Lavender -> gold | Orbit ribbons, subtle star trails, then fade |
| Ember evolution | Warm coral -> honey | Rising ember motes, gem shimmer, never strobe |

Five finite-burst VFX-study prefabs can be generated independently. They use particle-size and color gradients with <=64 particles per emitter; they are not final drawn icon shapes, custom trails, shaders or sound design. Effects must respect `Reduce Motion` and accessibility.

## Implementation milestones

1. **Authoring scaffold (this PR)**: source for Unity high-density skinned Puffino study, Blender sculpt script, facial morph/clip studies and budgeted effect studies, with manifest and audits.
2. **Blender/Unity native proof (pending)**: execute generation, source sculpt export, import/compile and inspect all rig weights, meshes, shaders, blend shapes and effects.
3. **Final Puffino sculpt (pending)**: original distinctive silhouette, correct clean edge loops, optimized maps, expressions, living secondary motion.
4. **Common rig / remaining creatures (pending)**: adapt deformation and anatomy to Lunari, Sproutle and Bubblin rather than just recolor Puffino.
5. **Evolution pass (pending)**: forest/lunar/ember models and transformation visuals with original fantasy anatomy.
6. **World/audio/UI polish (pending)**: interaction props, nursery world, creature sounds, portraits, thumbnails, icons and native profiling.

## Validation checklist (not yet executed)

- [ ] Blender headless script creates nonempty `.blend` and `.glb` and exits zero.
- [ ] Exported skinned head/ears/tail deform without joint collapse; no hidden geometry or inverted normal patches.
- [ ] Facial morphs animate in Blender and remain distinguishable and intact after Unity glTF import.
- [ ] Unity 6000.0.62f1 compiles, generates and audits 5 skinned meshes, 4 morphs and 6 facial clips.
- [ ] Unity VFX audit confirms 5 particle effects and finite particle budgets.
- [ ] Prefabs survive regeneration with stable mesh GUIDs.
- [ ] Existing required GitHub CI checks pass on exact current PR SHA.
- [ ] Android/iOS builds, accessibility, memory/thermal/frame-time art QA demonstrated separately.

Do not merge draft PR #36 based solely on repository CI: native validation remains pending under Issues #31 and #33.
