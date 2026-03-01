import { context as globalContext, trace } from "@opentelemetry/api";
import type { Context, Span, SpanOptions, Tracer } from "@opentelemetry/api";
import { isPromiseLike } from "./isPromiseLike.ts";

interface IAsyncDisposableEnd extends AsyncDisposable {
  end(): Promise<void>;
}
class AsyncDisposableEnd implements IAsyncDisposableEnd {
  static async start(callback: (enter: () => Promise<void>) => Promise<unknown>) {
    const { promise: enterPromise, resolve: enterResolve } = Promise.withResolvers<void>();
    const { promise: exitPromise, resolve: exitResolve } = Promise.withResolvers<void>();
    const afterPromise = callback(enter);
    await enterPromise;
    return new AsyncDisposableEnd(end);
    async function enter() {
      enterResolve();
      await exitPromise;
    }
    async function end() {
      exitResolve();
      await waitResultReverse(afterPromise);
    }
  }
  #end: () => Promise<void>
  constructor(end:() => Promise<void>) {
    this.#end = end;
  }
  end() {
    return this.#end();
  }
  [Symbol.asyncDispose]() {
    return this.end();
  }
}

export async function startContext(context: Context) {
  return AsyncDisposableEnd.start(enter => {
    return globalContext.with(context, enter);
  });
}

export async function startSpan(span: Span): Promise<IAsyncDisposableEnd> {
  const context = trace.setSpan(globalContext.active(), span);
  const result = await startContext(context);
  return {
    get end() { return end; }
  };
  async function end() {
    await result.end();
    span.end();
  }
}

export async function startSpan2(...args:
  [tracer: Tracer, name: string, options?: SpanOptions, context?: Context]
  | [span: Span]) {
  let span: Span;
  if (typeof args[1] === "string") {
    const tracer = args[0];
    const name = args[1];
    const options = args[2];
    const context = args[3];
    tracer
  }

}

async function waitResultReverse(v: Promise<unknown>) {
    const result = await v;
    if (Array.isArray(result)) {
      for (const element of [...(result as unknown[])].reverse()) {
        if (element && typeof element === "object") {
          if ("end" in element && typeof element["end"] === "function") {
            const result = element.end();
            if (isPromiseLike(result)) {
              await result;
            }
          } else if (isPromiseLike(element)) {
            await element;
          }
        }
      }
    }
  }