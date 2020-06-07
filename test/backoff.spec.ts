import { exponentialGrowth, linearGrowth } from '../src';

describe('backoff', () => {
  describe('exponentialGrowth', () => {
    it.each([
      [0, 400],
      [1, 800],
      [2, 1600],
      [3, 3200],
    ])('should match %p with: %p', (retry, expected) => {
      expect(exponentialGrowth(retry)).toBe(expected);
    });
  });

  describe('linearGrowth', () => {
    it.each([
      [0, 400],
      [1, 800],
      [2, 1200],
      [3, 1600],
    ])('should match %p with: %p', (retry, expected) => {
      expect(linearGrowth(retry)).toBe(expected);
    });
  });
});
