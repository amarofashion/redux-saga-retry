import { delay, put } from 'redux-saga/effects';
import { runGenerator, actionTypeMatches, alwaysFalse } from './utils';
import { exponentialGrowth } from './backoff';
import type { GeneratorFactory, RetryGeneratorOptions } from './types';

export function retry<Args extends any[] = any[]>(
  saga: GeneratorFactory<Args>,
  options?: RetryGeneratorOptions,
): GeneratorFactory<Args> {
  const { backoff = exponentialGrowth, debug = false, retries = 3, condition = /_FAILURE$/ } =
    options || {};
  const conditionFn = condition instanceof RegExp ? actionTypeMatches(condition) : condition;

  /* eslint-disable-next-line consistent-return */
  function* retryableGenerator(...args: Args) {
    const action = args[args.length - 1];
    const maxRetries = action?.meta?.retries || retries;

    for (let i = 0; i <= maxRetries; i += 1) {
      const conditionToUse = i === maxRetries ? alwaysFalse : conditionFn;

      try {
        return yield* runGenerator(saga(...args), conditionToUse);
      } catch (e) {
        if (e?.message !== 'RetryError') {
          throw e;
        }
      }

      yield delay(backoff(i));

      /* istanbul ignore else */
      if (debug) {
        yield put({
          type: '@@REDUX-SAGA-RETRY',
          payload: {
            action: action.type,
            attempt: i + 1,
          },
        });
      }
    }
  }

  Object.defineProperty(retryableGenerator, 'name', { value: `retryGenerator(${saga.name})` });

  return retryableGenerator as GeneratorFactory<Args>;
}
