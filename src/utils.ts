import type { RetryError, ConditionFunction } from './types';

type SuccessReturn<T> = [T, false];
type FailureReturn = [any, true];
type TryCatchYieldReturn<TSuccess> = SuccessReturn<TSuccess> | FailureReturn;

// function tryCatchYield<T, TNext>(value: T): Generator<T, [TNext, false]>;
// function tryCatchYield<T, TNext>(value: T): Generator<T, [any, true]>;
function* tryCatchYield<T, TNext>(value: T): Generator<T, TryCatchYieldReturn<TNext>> {
  try {
    return [yield value, false] as [TNext, false];
  } catch (e) {
    return [e, true] as [any, true];
  }
}

/**
 * Executes the generator, and passes each yielded value to a `stopCondition`
 * function which determine if the generator should be early terminated.
 *
 * @param {Generator} generator
 * @param {Function} stopCondition Given the yielded value, determines if should stop the generator execution.
 *
 * @returns {Generator}
 */
export function* runGenerator<T, TReturn, TNext>(
  generator: Generator<T, TReturn, TNext>,
  stopCondition: ConditionFunction,
): Generator<T, TReturn, TNext> {
  let yielded = generator.next();

  while (!yielded.done) {
    if (stopCondition(yielded.value)) {
      const error: RetryError<T> = new Error('RetryError');
      error.yielded = yielded.value;

      throw error;
    }

    // delegate resolution to the caller;
    // Caller's return will appear in `nextValue`
    const [nextValue, isError] = yield* tryCatchYield<T, TNext>(yielded.value);

    if (isError) {
      yielded = generator.throw(nextValue);
    } else {
      yielded = generator.next(nextValue);
    }
  }

  return yielded.value;
}

export function actionTypeMatches(regex: RegExp): ConditionFunction {
  return function matches(value: any) {
    return value?.type === 'PUT' && regex.test(value.payload?.action?.type);
  };
}

export const alwaysFalse: ConditionFunction = () => false;
