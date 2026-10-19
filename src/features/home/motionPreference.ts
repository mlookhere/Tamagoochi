// An async OS settings snapshot must not override a newer change event.
export function createMotionPreferenceGuard(
  publish: (enabled: boolean) => void,
) {
  let active = true;
  let sawChange = false;

  return {
    onInitial(enabled: boolean) {
      if (active && !sawChange) publish(enabled);
    },
    onChange(enabled: boolean) {
      if (!active) return;
      sawChange = true;
      publish(enabled);
    },
    dispose() {
      active = false;
    },
  };
}
