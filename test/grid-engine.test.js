import test from "node:test";
import assert from "node:assert/strict";

import {
  buildGrid,
  evaluatePrice,
  validateGridConfig
} from "../src/grid-engine.js";

test("Grid creates 3 price levels", () => {
  const levels = buildGrid({
    lowerPrice: 100,
    upperPrice: 200,
    levels: 3
  });

  assert.equal(levels.length, 3);
  assert.deepEqual(levels.map(item => item.price), [100, 150, 200]);
});

test("Evaluation remains simulation only", () => {
  const result = evaluatePrice(
    { lowerPrice: 100, upperPrice: 200, levels: 3 },
    151,
    149
  );

  assert.equal(result.executed, false);
  assert.equal(result.signal, "SIMULATED_SELL");
});

test("Invalid grid price range is rejected", () => {
  assert.throws(() =>
    buildGrid({ lowerPrice: 200, upperPrice: 100, levels: 3 })
  );
});

test("Order size must be positive and finite", () => {
  for (const orderSize of [0, -1, NaN, Infinity, "invalid"]) {
    assert.throws(() =>
      validateGridConfig({
        lowerPrice: 100,
        upperPrice: 200,
        levels: 3,
        orderSize
      }),
      /Order size/
    );
  }
});

test("Invalid previous price is rejected", () => {
  assert.throws(() =>
    evaluatePrice(
      { lowerPrice: 100, upperPrice: 200, levels: 3 },
      150,
      NaN
    ),
    /previous price/
  );
});
