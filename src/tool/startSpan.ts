import { Span } from "@opentelemetry/api";
import { DisposableSpan } from "./DisposableSpan.ts";

/**
 * 
 * @param span 
 * @returns 
 * @example ```ts
 * import { context, trace } from "@opentelemetry/api";
 * import { startSpan } from "@juner/opentelemetry-async-stack-context-manager/tool";
 * const tracer = trace.getTracer("sample-tracer");
 * const span = tracer.startSpan("sample-span", undefined, context.active());
 * using s = startSpan(span);
 * await using _ = await s.startContext();
 * span.addEvent("start");
 * // todo...
 * span.addEvent("complete");
 * // auto close span and context...
 * ```
 */
export function startSpan(span: Span) {
  return new DisposableSpan(span);
}