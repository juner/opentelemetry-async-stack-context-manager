export function isPromiseLike<T = unknown>(result: T): result is T & PromiseLike<unknown> {
  return typeof result === "object" && result && "then" in result && typeof result["then"] === "function";
}