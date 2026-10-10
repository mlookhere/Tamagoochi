// A missing OS preference is treated as Reduce Motion enabled until confirmed.
export function motionDisabled(preference: boolean | null): boolean {
  return preference !== false;
}

export function reduceMotionDescription(preference: boolean | null): string {
  if (preference === null) return 'not available';
  return preference ? 'enabled' : 'disabled';
}
