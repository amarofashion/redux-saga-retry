export type RetryError<T = unknown> = Error & {
  yielded?: T;
};

export type GeneratorFactory<Args extends any[] = any[]> = (...args: Args) => any;

export type ConditionFunction = (v: unknown) => boolean;

export interface RetryGeneratorOptions {
  backoff?: (attempt: number) => number;
  condition?: RegExp | ConditionFunction;
  defaultMax?: number;
}
