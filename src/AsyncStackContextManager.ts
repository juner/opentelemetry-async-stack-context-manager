import type { Context, ContextManager } from "@opentelemetry/api";
import { ROOT_CONTEXT } from "@opentelemetry/api";
import { isPromiseLike } from "./isPromiseLike.ts";

export class AsyncStackContextManager implements ContextManager {
  /**
   * whether the context manager is enabled or not
   */
  #enabled = false;

  /**
   * Keeps the reference to current context
   */
  #currentContext = ROOT_CONTEXT;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  #bindFunction<T extends Function>(
    context = ROOT_CONTEXT,
    target: T
  ): T {
    const manager = this;
    function contextWrapper(this: unknown, ...args: unknown[]) {
      return manager.with(context, () => target.apply(this, args));
    };
    Object.defineProperty(contextWrapper, 'length', {
      enumerable: false,
      configurable: true,
      writable: false,
      value: target.length,
    });
    return contextWrapper as unknown as T;
  }

  /**
   * Returns the active context
   */
  active(): Context {
    return this.#currentContext;
  }

  bind<T>(context: Context, target: T): T {
    // if no specific context to propagate is given, we use the current one
    if (context === undefined) {
      context = this.active();
    }
    if (typeof target === 'function') {
      return this.#bindFunction(context, target);
    }
    return target;
  }

  /**
   * Disable the context manager (clears the current context)
   */
  disable(): this {
    this.#currentContext = ROOT_CONTEXT;
    this.#enabled = false;
    return this;
  }

  /**
   * Enables the context manager and creates a default(root) context
   */
  enable(): this {
    if (this.#enabled) {
      return this;
    }
    this.#enabled = true;
    this.#currentContext = ROOT_CONTEXT;
    return this;
  }

  with<A extends unknown[], F extends (...args: A) => ReturnType<F>>(
    context: Context | null,
    fn: F,
    thisArg?: ThisParameterType<F>,
    ...args: A
  ): ReturnType<F> {
    const previousContext = this.#currentContext;
    this.#currentContext = context || ROOT_CONTEXT;

    let isLikePromise = false;
    try {
      const result = fn.call(thisArg, ...args);
      if (isPromiseLike(result)) {
        isLikePromise = true;
        const restore = () => this.#currentContext = previousContext;
        result.then(restore, restore);
      }
      return result;
    } finally {
      if (!isLikePromise)
        this.#currentContext = previousContext;
    }
  }
  
}
