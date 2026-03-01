import { Context, createContextKey, ROOT_CONTEXT } from '@opentelemetry/api';
import { assert, describe, expect, it } from 'vitest';
import { AsyncStackContextManager } from './AsyncStackContextManager.ts';

describe("AsyncStackContextManager", ({ beforeEach, afterEach }) => {
  let contextManager: AsyncStackContextManager;
  const key1 = createContextKey("test key 1");

  beforeEach(() => {
    contextManager = new AsyncStackContextManager();
    contextManager.enable();
  });

  afterEach(() => {
    contextManager.disable();
  });

  describe(".enable()", () => {
    it("should work", () => {
      assert.doesNotThrow(() => {
        assert.ok(
          contextManager.enable() === contextManager,
          'should return this'
        );
        assert.ok(
          contextManager.active() === ROOT_CONTEXT,
          'should have root context'
        );
      });
    });
  });

  describe('.disable()', () => {
    it('should work', () => {
      assert.doesNotThrow(() => {
        assert.ok(
          contextManager.disable() === contextManager,
          'should return this'
        );
        assert.ok(
          contextManager.active() === ROOT_CONTEXT,
          'should have no context'
        );
      });
    });
  });
  describe('.with()', () => {
    it('should run the callback (null as target)', async () => {
      const { promise, resolve: done } = Promise.withResolvers<void>();
      contextManager.with(null, done);
      await promise;
    });

    it('should run the callback (object as target)', async () => {
      const { promise, resolve: done } = Promise.withResolvers<void>();
      const test = ROOT_CONTEXT.setValue(key1, 1);
      contextManager.with(test, () => {
        assert.strictEqual(
          contextManager.active(),
          test,
          'should have context'
        );
        return done();
      });
      await promise;
    });

    it('should run the callback (when disabled)', async () => {
      const { promise, resolve: done } = Promise.withResolvers<void>();
      contextManager.disable();
      contextManager.with(null, () => {
        contextManager.enable();
        return done();
      });
      await promise;
    });

    it('should rethrow errors sync version', () => {
      expect(() => {
        contextManager.with(null, () => {
          throw new Error('This should be rethrown');
        });
      }).toThrowError();
    });
    it('should rethrow errors async version', async () => {
      expect(async () => {
        await contextManager.with(null, async () => {
          await timeout(5);
          throw new Error('This should be rethrown');
        });
      }).rejects.toThrowError()
    });

    it('should finally restore an old context', async () => {
      const { promise, resolve: done } = Promise.withResolvers<void>();
      const ctx1 = ROOT_CONTEXT.setValue(key1, 'ctx1');
      const ctx2 = ROOT_CONTEXT.setValue(key1, 'ctx2');
      const ctx3 = ROOT_CONTEXT.setValue(key1, 'ctx3');
      contextManager.with(ctx1, () => {
        assert.strictEqual(contextManager.active(), ctx1);
        contextManager.with(ctx2, () => {
          assert.strictEqual(contextManager.active(), ctx2);
          contextManager.with(ctx3, () => {
            assert.strictEqual(contextManager.active(), ctx3);
          });
          assert.strictEqual(contextManager.active(), ctx2);
        });
        assert.strictEqual(contextManager.active(), ctx1);
        return done();
      });
      await promise;
      assert.strictEqual(contextManager.active(), ROOT_CONTEXT);
    });

    it('should finally restore an old context when context is an object sync version', async () => {
      const { promise, resolve: done } = Promise.withResolvers<void>();
      assert.strictEqual(contextManager.active(), ROOT_CONTEXT);
      const ctx1 = ROOT_CONTEXT.setValue(key1, 1);
      const ctx2 = ROOT_CONTEXT.setValue(key1, 2);
      const ctx3 = ROOT_CONTEXT.setValue(key1, 3);
      contextManager.with(ctx1, () => {
        assert.strictEqual(contextManager.active(), ctx1);
        contextManager.with(ctx2, () => {
          assert.strictEqual(contextManager.active(), ctx2);
          contextManager.with(ctx3, () => {
            assert.strictEqual(contextManager.active(), ctx3);
          });
          assert.strictEqual(contextManager.active(), ctx2);
        });
        assert.strictEqual(contextManager.active(), ctx1);
        return done();
      });
      await promise;
      assert.strictEqual(contextManager.active(), ROOT_CONTEXT);
    });

    it('should finally restore an old context when context is an object async version', async () => {
      assert.strictEqual(contextManager.active(), ROOT_CONTEXT);
      const ctx1 = ROOT_CONTEXT.setValue(key1, 1);
      const ctx2 = ROOT_CONTEXT.setValue(key1, 2);
      const ctx3 = ROOT_CONTEXT.setValue(key1, 3);
      await contextManager.with(ctx1, async () => {
        assert.strictEqual(contextManager.active(), ctx1);
        await timeout(5);
        await contextManager.with(ctx2, async () => {
          assert.strictEqual(contextManager.active(), ctx2);
          await timeout(10);
          await contextManager.with(ctx3, async () => {
            assert.strictEqual(contextManager.active(), ctx3);
            await timeout(15);
          });
          assert.strictEqual(contextManager.active(), ctx2);
        });
        assert.strictEqual(contextManager.active(), ctx1);
      });
      assert.strictEqual(contextManager.active(), ROOT_CONTEXT);
    });

    it('should forward this, arguments and return value', () => {
      function fnWithThis(this: string, a: string, b: number): string {
        assert.strictEqual(this, 'that');
        assert.strictEqual(arguments.length, 2);
        assert.strictEqual(a, 'one');
        assert.strictEqual(b, 2);
        return 'done';
      }

      const res = contextManager.with(
        ROOT_CONTEXT,
        fnWithThis,
        'that',
        'one',
        2
      );
      assert.strictEqual(res, 'done');

      assert.strictEqual(
        contextManager.with(ROOT_CONTEXT, () => 3.14),
        3.14
      );
    });
  });

  describe('.bind(function)', () => {

    it('should call the function with previously assigned context', () => {
      class Obj {
        title: string;

        constructor(title: string) {
          this.title = title;
        }

        getTitle() {
          return (contextManager.active().getValue(key1) as Obj).title;
        }
      }

      const obj1 = new Obj('a1');
      const ctx = ROOT_CONTEXT.setValue(key1, obj1);
      obj1.title = 'a2';
      const obj2 = new Obj('b1');
      const wrapper: any = contextManager.bind(ctx, obj2.getTitle);
      assert.ok(wrapper(), 'a2');
    });

    it('should return the same target (when enabled)', () => {
      const test = ROOT_CONTEXT.setValue(key1, 1);
      assert.deepStrictEqual(
        contextManager.bind(contextManager.active(), test),
        test
      );
    });

    it('should undefined context to active context', () => {
      const test = ROOT_CONTEXT.setValue(key1, 1);
      assert.deepStrictEqual(
        contextManager.bind(undefined as unknown as Context, test),
        test
      );
    });

    it('should return the same target (when disabled)', () => {
      contextManager.disable();
      const test = ROOT_CONTEXT.setValue(key1, 1);
      assert.deepStrictEqual(
        contextManager.bind(contextManager.active(), test),
        test
      );
      contextManager.enable();
    });

    it('should return current context (when enabled)', async () => {
      const { promise, resolve: done } = Promise.withResolvers<void>();
      const context = ROOT_CONTEXT.setValue(key1, 1);
      const fn = contextManager.bind(context, () => {
        assert.strictEqual(
          contextManager.active(),
          context,
          'should have context'
        );
        return done();
      });
      fn();
      await promise;
    });

    it('should return current context (when disabled)', async () => {
      const { promise, resolve: done } = Promise.withResolvers<void>();
      contextManager.disable();
      const context = ROOT_CONTEXT.setValue(key1, 1);
      const fn = contextManager.bind(context, () => {
        assert.strictEqual(
          contextManager.active(),
          context,
          'should have context'
        );
        return done();
      });
      fn();
      await promise;
    });
  });
});

/**
 * Promise with setTimeout
 * @param milliseonds 
 * @param options 
 * @returns 
 */
function timeout(milliseonds?: number, options?: { signal?: AbortSignal }) {
  if (options?.signal?.aborted) return;
  const { promise, resolve } = Promise.withResolvers<void>();
  const clear = setTimeout(resolve, milliseonds);
  if (options?.signal) {
    const signal = options.signal;
    signal.addEventListener("abort", abort);
    promise.finally(() => signal.removeEventListener("abort", abort));
  }
  return promise;
  function abort() {
    clearTimeout(clear);
    resolve();
  }
}