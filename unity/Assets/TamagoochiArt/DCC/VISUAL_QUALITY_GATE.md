# Tamagoochi — visual quality gate (Issue #35)

**Unrendered source never counts as completed high-detail art.** Previous concept sheets are creative targets, not evidence that the actual Unity or Blender models look like them.

## What must be reviewed

| Review area | Requirement |
| --- | --- |
| Originality and silhouette | Immediately identifiable as its own imaginary species; not a real cat/fox/rabbit/hamster with a different color |
| Cute anatomy | Appealing big-to-small proportions, organic cheek-to-muzzle connection, soft ears, meaningful paws and tail |
| Sculpt detail | Actual shaped ear fins and face landmarks, refined cheek tufts, forehead details, layered eyes, tail banding |
| Surface/materials | Pastel high-quality roughness, readable eye catchlights, convincing *subtle* micro-surface; no cheap plastic shine |
| Facial emotion | Happy/pout/curious expressions genuinely different; eyes and mouth remain correctly attached while deforming |
| Rigged motion | No collapsing cheeks or tail/ear seams, no detached objects, no extreme skinning stretches |
| Multiple views | Front, three-quarter, side and back are coherent; no forced cheats that only work head-on |
| Small-phone framing | Clearly readable at 256×256 with low triangle budget and without depending on eye color |
| Evolution language | Each starter has unique DNA; an evolved form should retain only some family traits and develop distinct new anatomy |
| VFX | Appropriate effects, no flicker/strobe and controlled mobile overdraw |

**Pass threshold:** every area must score at least **4/5** and average at least **4.5/5** from actual observed native renders and animation. Reject or rework any failing aspect; do not infer approval from source tests or increased subdivision counts.

## Generate the review evidence

Requires a real Blender 4.x installation on an authorized local/CI rendering machine.

```bash
blender --background --python unity/Assets/TamagoochiArt/DCC/render_quality_review.py -- --output /absolute/review --engine cycles --samples 32 --resolution 960
```

For a quick single-species iteration:

```bash
blender --background --python unity/Assets/TamagoochiArt/DCC/render_quality_review.py -- --output /absolute/review --species puffino --engine cycles --samples 16 --resolution 720
```

The script renders **32 images for all four babies**: front / 3-quarter / side / back / Smile / Pout / Curious / **256-pixel mobile-profile proof**. It validates named species-signature geometry, head morph deformation, UVs, nonempty skin weights, missing images, dense sculpt topology and the mobile-triangle budget. It writes `quality_report.json` and raises on technical failures.

Proof renders are required for the actual 3D objects. A beautiful concept render **cannot** substitute for a shot of the exported and rigged model.

### Approval (separate from mechanical validation)

The generated report deliberately contains:

```json
{
  "creative_review": "required",
  "production_ready": false
}
```

This is by design. No automated polygon or material check can reliably judge whether an original pet actually looks cute. Review the captured PNGs and record category scores and the reviewer/date against Issue #35. Require representative short animation proof (idle, blink, hop, sleep, eating, ear/tail reaction), a unity camera screenshot, and device preview before calling the artwork high-detail/production-ready.

## Outstanding evidence

- [ ] Blender installed; all four species generate from source with no runtime exception
- [ ] `.blend` source files and skinned/morph `.glb` exports actually exist and are nonempty
- [ ] `quality_report.json` passes mechanical checks for all species
- [ ] All 32 render PNGs visually inspected, scores recorded, silhouettes approved
- [ ] Unity 6 imports and compiles source, rig weights, material maps and morph targets
- [ ] Animation deformation proof and 256px game-camera view match the accepted art direction
- [ ] Native Android/iOS render and mobile performance checks completed
- [ ] Final artist-authored sculpt, retopology, texture pass and polished custom VFX replace the studies

## Status

The materials/shape/detail improvements and the render checker are source code only. This environment does **not** contain Blender or a licensed Unity Editor, so screenshots and native testing have **not** been generated or approved. Keep PR #36 draft until the actual quality evidence exists.
