/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { delay } from 'redux-saga/effects';
import type { Effect } from 'redux-saga/effects';
import { runGenerator } from './utils';
import { exponentialGrowth } from './backoff-functions';

type GenFun<T, TReturn, TNext, TArgs extends Array<unknown> = any[]> = (
  ...args: TArgs
) => Generator<T, TReturn, TNext>;

interface RetryGeneratorOptions<TYielded = unknown> {
  backoff?: (attempt: number) => number;
  defaultMax?: number;
  stopCondition: (v: TYielded) => boolean;
}

export function retry<TYielded extends Effect, TReturn, TNext>(
  gen: GenFun<TYielded, TReturn, TNext>,
  options: RetryGeneratorOptions<TYielded>,
) {
  const { backoff = exponentialGrowth, defaultMax = 3, stopCondition } = options;

  function* retryableGenerator(
    ...args: Parameters<typeof gen>
  ): Generator<TYielded, TReturn, TNext> {
    const [action] = args;
    const maxRetries = action?.meta?.retries || defaultMax;

    let result: TReturn | undefined;

    for (let i = 0; i <= maxRetries; i += 1) {
      const stopConditionFn = i === maxRetries ? () => false : stopCondition;
      result = undefined;

      try {
        result = yield* runGenerator(gen(...args), stopConditionFn);
      } catch (e) {
        if (e?.message !== 'RetryError') {
          throw e;
        }
      }

      yield delay(backoff(i));
    }

    return result as TReturn;
  }

  Object.defineProperty(retryableGenerator, 'name', { value: `retryGenerator(${gen.name})` });

  return retryableGenerator;
}
