export type RetryError<T = unknown> = Error & {
  yielded?: T;
};

export type GeneratorFactory<Args extends any[] = any[]> = (...args: Args) => any;
