/* eslint-disable consistent-return */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { delay } from 'redux-saga/effects';
// import type { SagaIterator, Saga } from 'redux-saga';
import { runGenerator } from './utils';
import { exponentialGrowth } from './backoff-functions';

// type GenFun<T, TReturn, TNext, TArgs extends Array<unknown> = any[]> = (
//   ...args: TArgs
// ) => Generator<T, TReturn, TNext>;

interface RetryGeneratorOptions {
  backoff?: (attempt: number) => number;
  defaultMax?: number;
  stopCondition: (v: unknown) => boolean;
}

// type TempGenerator<Args extends any[] = any[]> = Saga<Args>;
type TempGenerator<Args extends any[] = any[]> = (...args: Args) => any;

export function retry<Args extends any[] = any[]>(
  gen: TempGenerator,
  options: RetryGeneratorOptions,
): TempGenerator {
  const { backoff = exponentialGrowth, defaultMax = 3, stopCondition } = options;

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

  return retryableGenerator as TempGenerator;
}
