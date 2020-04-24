export type RetryError<T = unknown> = Error & {
  yielded?: T;
};
