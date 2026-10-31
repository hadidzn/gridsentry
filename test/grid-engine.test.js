
import test from "node:test";
import assert from "node:assert/strict";

import {
  buildGrid,
  evaluatePrice
} from "../src/grid-engine.js";

test("Grid creates 3 price levels", () => {
  const levels = buildGrid({
    lowerPrice: 100,
    upperPrice: 200,
    levels: 3
  });

  assert.equal(levels.length, 3);
  assert.deepEqual(
    levels.map(item => item.price),
    [100, 150, 200]
  );
});

test("Evaluation remains simulation only", () => {
  const result = evaluatePrice(
    {
      lowerPrice: 100,
      upperPrice: 200,
      levels: 3
    },
    151,
    149
  );

  assert.equal(result.executed, false);
  assert.equal(result.signal, "SIMULATED_SELL");
});

test("Invalid grid configuration is rejected", () => {
  assert.throws(() =>
    buildGrid({
      lowerPrice: 200,
      upperPrice: 100,
      levels: 3
    })
  );
});
