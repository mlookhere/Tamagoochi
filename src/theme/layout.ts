// Keep the default visual baseline while providing more space for Dynamic Type.
export function tabBarHeight(fontScale: number): number {
  const scale = Number.isFinite(fontScale)
    ? Math.min(4, Math.max(1, fontScale))
    : 1;
  return 76 + Math.ceil((scale - 1) * 35);
}

export function stackCareActions(fontScale: number): boolean {
  return Number.isFinite(fontScale) && fontScale >= 1.6;
}
