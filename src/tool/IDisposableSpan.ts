import type { Span } from "@opentelemetry/api";
import type { IAsyncDisposableEnd } from "./IAsyncDisposableEnd.ts";

export interface IDisposableSpan extends Disposable {
  end(): void;
  get span(): Span;
  [Symbol.dispose](): void;
  startContext(): Promise<IAsyncDisposableEnd>;
}