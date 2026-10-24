# Production backlog and acceptance gates

| Group | Current content | Required before production approval |
| --- | --- | --- |
| 3D meshes | Seven sphere-based creatures | Authored topology, UVs, texture maps, stylized materials and mobile LODs |
| Rigs/expressions | None; runtime transforms | Skinning, ear/tail bones, facial blend shapes, working eye/mouth controls |
| Animations | 16 blockouts + procedural motion | Authored full-body clips, transitions, blend policy and reduced motion |
| World | One room prototype | Modular nursery, grove, pond and night habitats |
| Toys/food/furniture | Five primitive props | Modeled items, interaction pivots, collision and icons |
| VFX | Three particle bursts | Custom original sprite/meshes, pooling, accessibility |
| Audio | Six synthetic tones | Professionally polished original effects, creature voices, ambience, music |
| UI | None | Inventory icons, pet thumbnails, evolution diagrams |

## Native acceptance checklist

- [ ] Unity 6000.0.62f1 imports and compiles the isolated art source.
- [ ] Generator creates 7 creature prefabs, 5 props, nursery, 3 VFX, 16 clips, 6 WAV and catalog.
- [ ] Audit confirms all generated assets and no missing script/material.
- [ ] Prototype prefabs display without shader errors and react to pet/feed/play/sleep.
- [ ] Disabled/reduced motion makes sense; no fight between Animator and runtime transform writes.
- [ ] Android and iOS physical-device visual/performance QA completed.
- [ ] Exact-head repository checks pass; native CI is separately evidenced before merge.

## Preparation completed in latest source slice

- Sculpt-ready **Puffino** mesh prototype with tracked UV assets, deform-capable body/ear/tail skinning, jaw bone, separate eye meshes and four face blend shapes. `CreatureRigBuilder` is an Editor generator, not a final hand-sculpted model.
- Six authored facial-curve studies with animation binding names and audit menu. Face and body performance exposed through `CreaturePerformance` and `CreatureFacialRig`.
- Five budgeted VFX-study prefab generators (happy/dream/forest/lunar/ember); final texture/shader/particle choreography still pending.
- Blender source scene exporter to create editable `.blend` sculpt study and skinned `.glb` when executed in an actual Blender environment; no native Blender run verified.
- New `ART_PIPELINE.md` records rig/morph names, axes, deformation tests, mobile budgets and signoff gates.

**Next priority:** execute Blender/Unity, inspect deformations and morph import, then iterate the actual organic sculpt/retopo/texture work before duplicating the rig across additional species.
