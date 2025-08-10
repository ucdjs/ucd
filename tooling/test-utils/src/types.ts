export type HTTPMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";
// eslint-disable-next-line ts/no-empty-object-type
export interface EmptyObject {}
export type NonEmptyArray<T> = [T, ...T[]];
