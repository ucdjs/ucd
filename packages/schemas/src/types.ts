export type DeepOmit<T, K extends PropertyKey> = T extends object
  ? T extends any[]
    ? DeepOmit<T[number], K>[]
    : {
        [P in Exclude<keyof T, K>]: DeepOmit<T[P], K>;
      }
  : T;
