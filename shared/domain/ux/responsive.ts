export const PROFILE_MOBILE_TEST_WIDTHS = [320, 360, 390, 412] as const;

export function shouldUseScrollableProfileTabs(width: number) {
  return width <= 412;
}
