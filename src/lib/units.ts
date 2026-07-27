export const M_TO_FT = 3.28084;

/** Meters → feet string for hint display, e.g. "≈ 4.9 ft" */
export function metersToFtHint(meters: number): string {
  const ft = parseFloat((meters * M_TO_FT).toFixed(1));
  return `≈ ${ft} ft`;
}
