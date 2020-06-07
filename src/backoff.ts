/**
 * Exponential growth function.
 * Useful to sparse API calls.
 * [400, 800, 1600, 3200, 6400, ...]
 *
 * @param {number} attempt
 *
 * @returns {number}
 */
export function exponentialGrowth(attempt: number): number {
  return 200 * 2 ** (attempt + 1);
}

/**
 * Linear growth function.
 * Useful to sparse API calls.
 * [400, 800, 1200, 1600, 2000, ...]
 *
 * @param {number} attempt
 *
 * @returns {number}
 */
export function linearGrowth(attempt: number): number {
  return 400 * (attempt + 1);
}
