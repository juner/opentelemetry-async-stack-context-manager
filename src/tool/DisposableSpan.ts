import type { Context, Span } from "@opentelemetry/api";
import { AsyncDisposableEnd } from "./AsyncDisposableEnd.ts";
import { context as contextApi, trace } from "@opentelemetry/api";
import { IDisposableSpan } from "./IDisposableSpan.ts";

export class DisposableSpan implements Disposable, IDisposableSpan {
  #span: Span;
  constructor(span: Span) {
    this.#span = span;
  }
  end(): void {
    this.#span.end();
  }
  get span(): Span {
    return this.#span;
  }
  [Symbol.dispose](): void {
    this.end();
  }
  startContext(context?: Context) {
    const ctx = trace.setSpan(context ?? contextApi.active(), this.#span);
    return AsyncDisposableEnd.start(enter => {
      return contextApi.with(ctx, enter);
    });
  }
  
  get [Symbol.toStringTag]() {
    return "DisposableSpan";
  }
}