import { assert, describe, it } from 'vitest';
import { AsyncDisposableEnd } from './AsyncDisposableEnd.ts';

describe("AsyncDisposableEnd", () => {

  describe("constructor()", () => {
    
    it("Check the call order", async () => {
      let i = 0;
      assert.equal(i++, 0);
      {
        assert.equal(i++, 1);
        await using _ = new AsyncDisposableEnd(() => {
          assert.equal(i++, 3);
          return Promise.resolve();
        })
        assert.equal(i++, 2);
      }
      assert.equal(i++, 4);
    });
  })

  describe(".start(callback)", () => {

    it("Check the call order", async () => {
      let i = 0;
      assert.equal(i++, 0);
      {
        assert.equal(i++, 1);
        await using _ = await AsyncDisposableEnd.start(async enter => {
          assert.equal(i++, 2);
          await enter();
          assert.equal(i++, 4);
        });
        assert.equal(i++, 3);
      }
      assert.equal(i++, 5);
    });
  });

  it(".toString()", () => {
    const instance = new AsyncDisposableEnd();
    assert.equal(instance.toString(), "[object AsyncDisposableEnd]")
  });

  describe(".end()", () => {
    
    it(".end() always return the same value", () => {
      const instance = new AsyncDisposableEnd();
      const first = instance.end();
      const seconds = instance.end();
      assert.equal(first, seconds);
    });

    it(".end() is callback result", async () => {
      const value = Symbol("value");
      const promise = Promise.resolve(value);
      const instance = new AsyncDisposableEnd(() => promise);
      assert.equal(instance.end(), promise);
      assert.equal(await instance.end(), await promise);
    });

    it(".end() is call is once", async () => {
      let i = 0;
      const instance = new AsyncDisposableEnd(() => i++);
      assert.equal(i, 0);
      await instance.end();
      assert.equal(i, 1);
      await instance.end();
      assert.equal(i, 1);
    });
  });
});