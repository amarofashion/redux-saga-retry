import { delay } from 'redux-saga/effects';
import { runGenerator } from './utils';
import { exponentialGrowth } from './backoff-functions';
import type { GeneratorFactory } from './types';

interface RetryGeneratorOptions {
  backoff?: (attempt: number) => number;
  defaultMax?: number;
  stopCondition: (v: unknown) => boolean;
}

export function retry<Args extends any[] = any[]>(
  gen: GeneratorFactory<Args>,
  options: RetryGeneratorOptions,
): GeneratorFactory<Args> {
  const { backoff = exponentialGrowth, defaultMax = 3, stopCondition } = options;

  /* eslint-disable-next-line consistent-return */
  function* retryableGenerator(...args: Args) {
    const [action] = args;
    const maxRetries = action?.meta?.retries || defaultMax;

    for (let i = 0; i <= maxRetries; i += 1) {
      const stopConditionFn = i === maxRetries ? () => false : stopCondition;

      try {
        return yield* runGenerator(gen(...args), stopConditionFn);
      } catch (e) {
        if (e?.message !== 'RetryError') {
          throw e;
        }
      }

      yield delay(backoff(i));
    }
  }

  Object.defineProperty(retryableGenerator, 'name', { value: `retryGenerator(${gen.name})` });

  return retryableGenerator as GeneratorFactory<Args>;
}
