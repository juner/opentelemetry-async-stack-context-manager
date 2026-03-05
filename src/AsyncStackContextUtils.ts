import { context as globalContext } from "@opentelemetry/api";
import type { Context, Exception, Link, Span, SpanAttributes, SpanAttributeValue, SpanContext, SpanStatus, TimeInput, } from "@opentelemetry/api";
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

export function startContext(context: Context) {
  return AsyncDisposableEnd.start(enter => {
    return globalContext.with(context, enter);
  });
}

class DisposableSpan implements Span, Disposable {
  #span: Span;
  constructor(span: Span) {
    this.#span = span;
  }
  end(endTime?: TimeInput): void {
    this.#span.end(endTime);
  }
  get span(): Span {
    return this.#span;
  }
  [Symbol.dispose](): void {
    this.end();
  }
  spanContext(): SpanContext {
    return this.#span.spanContext();
  }

  setAttribute(key: string, value: SpanAttributeValue): this {
    this.#span.setAttribute(key, value);
    return this;
  }
  setAttributes(attributes: SpanAttributes): this {
    this.#span.setAttributes(attributes);
    return this;
  }
  addEvent(name: string, attributesOrStartTime?: SpanAttributes | TimeInput, startTime?: TimeInput): this {
    this.#span.addEvent(name, attributesOrStartTime, startTime);
    return this;
  }
  addLink(link: Link): this {
    this.#span.addLink(link);
    return this;
  }
  addLinks(links: Link[]): this {
    this.#span.addLinks(links);
    return this;
  }
  setStatus(status: SpanStatus): this {
    this.#span.setStatus(status);
    return this;
  }
  updateName(name: string): this {
    this.#span.updateName(name);
    return this;
  }
  isRecording(): boolean {
    return this.#span.isRecording();
  }
  recordException(exception: Exception, time?: TimeInput): void {
    return this.#span.recordException(exception, time);
  }
}

export function startSpan(span: Span) {
  new DisposableSpan(span);
}