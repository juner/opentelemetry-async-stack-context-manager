import { AsyncDisposableEnd } from "./AsyncDisposableEnd.ts";
import { context as contextApi } from "@opentelemetry/api";
import type { Context } from "@opentelemetry/api";

/**
 * start Context
 * @param context 
 * @returns 
 * @example ```ts
 * import { context, trace } from "@opentelemetry/api";
 * import { startContext } from "@juner/opentelemetry-async-stack-context-manager/tool";
 * const newCotnext = context.active().setValue("value", 1);
 * await using _ = await startContext(newContext);
 * // todo...
 * // auto end context...
 * ```
 */
export function startContext(context: Context) {
  return AsyncDisposableEnd.start(enter => {
    return contextApi.with(context, enter);
  });
}