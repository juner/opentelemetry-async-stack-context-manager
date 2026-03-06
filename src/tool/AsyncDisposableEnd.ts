import type { IAsyncDisposableEnd } from "./IAsyncDisposableEnd.ts";

export class AsyncDisposableEnd<T = void> implements IAsyncDisposableEnd<T> {
  static async start<T = void>(callback: (enter: () => Promise<void>) => Promise<T>): Promise<IAsyncDisposableEnd> {
    const { promise: enterPromise, resolve: enterResolve } = Promise.withResolvers<void>();
    const { promise: exitPromise, resolve: exitResolve } = Promise.withResolvers<void>();
    const afterPromise = callback(enter);
    await enterPromise;
    const result = new AsyncDisposableEnd(end);
    return result;
    async function enter() {
      enterResolve();
      await exitPromise;
    }
    async function end() {
      exitResolve();
      await afterPromise;
    }
  }
  #end: undefined | (() => T | Promise<T>);
  #endPromise: undefined | Promise<T>;
  constructor(end?: undefined | (() => T | Promise<T>)) {
    this.#end = end;
  }
  end() {
    if (this.#end && !this.#endPromise) {
      this.#endPromise = Promise.resolve(this.#end());
      this.#end = undefined;
    }
    return this.#endPromise ??= (Promise.resolve() as Promise<T>);
  }
  async [Symbol.asyncDispose]() {
    await this.end();
  }
  get [Symbol.toStringTag]() {
    return "AsyncDisposableEnd";
  }
}
