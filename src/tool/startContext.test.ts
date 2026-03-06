import { createContextKey, ROOT_CONTEXT, context as contextApi } from '@opentelemetry/api';
import { assert, describe, it } from 'vitest';
import { AsyncStackContextManager } from '../AsyncStackContextManager.ts';
import { startContext } from './startContext.ts';

describe("AsyncStackContextManager", ({ beforeEach, afterEach }) => {
  let contextManager: AsyncStackContextManager;
  const key1 = createContextKey("test key 1");

  beforeEach(() => {
    contextManager = new AsyncStackContextManager();
    contextManager.enable();
    contextApi.setGlobalContextManager(contextManager);
  });

  afterEach(() => {
    contextManager.disable();
    contextApi.disable();
  });
  describe('.startContext()', () => {

    it('should run the callback (object as target)', async () => {
      const test = ROOT_CONTEXT.setValue(key1, 1);
      {
        await using _ = await startContext(test);
        assert.strictEqual(
          contextApi.active(),
          test,
          'should have context'
        );
      }
    });

    it('should finally restore an old context', async () => {
      const ctx1 = ROOT_CONTEXT.setValue(key1, 'ctx1');
      const ctx2 = ROOT_CONTEXT.setValue(key1, 'ctx2');
      const ctx3 = ROOT_CONTEXT.setValue(key1, 'ctx3');
      assert.strictEqual(contextApi.active(), ROOT_CONTEXT);
      {
        await using _ = await startContext(ctx1);
        assert.strictEqual(contextApi.active(), ctx1);
        {
          await using _ = await startContext(ctx2);
          assert.strictEqual(contextApi.active(), ctx2);
          {
            await using _ = await startContext(ctx3);
            assert.strictEqual(contextApi.active(), ctx3);
          }
          assert.strictEqual(contextApi.active(), ctx2);
        }
        assert.strictEqual(contextApi.active(), ctx1);
      }
      assert.strictEqual(contextApi.active(), ROOT_CONTEXT);
    });
  });
});
