# Home gameplay native acceptance — Issue #11

Status: **not yet device-verified**. This checklist documents evidence required to accept draft PR #24; passing GitHub CI or a web build does **not** satisfy native testing.

## Boundary

The Workshop basket, room layout, minigame progress, bond, and personality are deliberately **preview-only** on this branch. They may reset when the Workshop unmounts. Do not assert durable progress until separate Item 3 / PR #23 has completed native acceptance and its save boundary is integrated. Item 2 / PR #20's art and motion are also a separate approval.

## Devices and evidence

Run an installed native build on at least one representative mid-range **Android** phone and one **iPhone**. Record OS version, app/build SHA, device model, orientation, accessibility settings, any frame stutter, and a screenshot or short screen recording of each scenario. Repeat large-text and screen-reader tests on both platforms.

## Acceptance scenarios

1. **Crafting and inventory:** Craft a picnic snack, leaf spinner, moss cushion, lucky stone, and flower crown from the supplied materials. Check ingredient deductions, capped quantities, full outputs, and insufficient-material attempts. Failed attempts must not consume anything.
2. **Room placement:** Select each available crafted decor item and place it in the sunny window, cozy nook, or garden ledge. The basket decreases by one. An occupied slot cannot overwrite an object; tapping it instead picks up the object and returns exactly one unit. A full basket must leave the object in the room. No duplicate or lost items.
3. **Room response:** Verify Mochi reacts affectionately to the leaf spinner and moss cushion, cautiously to the lucky stone, and neutrally to the flower crown. Mixed placements should produce a mixed room mood; removing an object updates the text. Neither cautious nor neutral decor reduces bond.
4. **Forest Echo:** Finish its three-symbol pattern, intentionally choose a wrong symbol, then retry. On first completion, Focus increases once and bond increases by 8. Replays grant materials when the basket allows but do not farm bond.
5. **Stone Skip:** Reach the exact target in three hops. An impossible hop resets the round without using resources. First completion increases Courage once and bond by 8; replay has no further bond effect.
6. **Meadow Pairs:** Reveal mismatched cards, review both, close them, then complete all three pairs. First completion increases Curiosity once and bond by 8. Replays have no further bond effect.
7. **No forced grind:** All three minigames are optional, untimed, and replayable without bond penalties. Before Item 3 integration, navigate away and back and confirm any preview reset is disclosed, not represented as saved progression.
8. **Reduced motion:** Switch on iOS Reduce Motion or Android's reduced-animation option, then open the Workshop and place/pick objects. Room targets must not spring. Switch it off and repeat: short spring response should return. Test changes while the screen is open, including rapidly toggled settings.
9. **Accessibility:** Verify 48-point or larger action targets, VoiceOver/TalkBack item name and action announcements, matched/disabled pair-card semantics, logical reading order, visible text with larger system fonts, and adequate contrast for unavailable objects. Check the bond and pet mood remain readable.
10. **Performance and cleanup:** Rapidly place/pick up objects, craft, retry games and switch tabs on both devices. Check responsiveness, frame drops, memory drift, runaway animations, and that no spring keeps running after unmount. Capture traces for any observed regressions.

## Evidence record

For each platform, link the build SHA, device/OS, date, scenario number, pass/fail, screen recording or screenshot, and any follow-up issue. **Do not mark this checklist complete without native evidence.** Failure cases should retain the exact action sequence and expected/observed outcome.
