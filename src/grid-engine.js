
export function validateGridConfig(config) {
  const lower = Number(config.lowerPrice);
  const upper = Number(config.upperPrice);
  const levels = Number(config.levels);

  if (
    !Number.isFinite(lower) ||
    !Number.isFinite(upper) ||
    lower <= 0 ||
    upper <= lower
  ) {
    throw new Error("Invalid price range");
  }

  if (!Number.isInteger(levels) || levels < 2 || levels > 100) {
    throw new Error("Levels must be between 2 and 100");
  }

  return {
    lowerPrice: lower,
    upperPrice: upper,
    levels,
    orderSize: Number(config.orderSize ?? 1)
  };
}

export function buildGrid(config) {
  const cfg = validateGridConfig(config);
  const step =
    (cfg.upperPrice - cfg.lowerPrice) / (cfg.levels - 1);

  return Array.from({ length: cfg.levels }, (_, index) => ({
    index,
    price: Number(
      (cfg.lowerPrice + step * index).toFixed(8)
    )
  }));
}

export function evaluatePrice(
  config,
  marketPrice,
  previousPrice = null
) {
  const cfg = validateGridConfig(config);
  const price = Number(marketPrice);

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("Invalid market price");
  }

  const grid = buildGrid(cfg);

  const nearest = grid.reduce((best, level) =>
    Math.abs(level.price - price) <
    Math.abs(best.price - price)
      ? level
      : best
  );

  let signal = "HOLD";

  if (previousPrice !== null) {
    const previous = Number(previousPrice);

    if (price > previous &&
        grid.some(level =>
          previous < level.price && price >= level.price
        )) {
      signal = "SIMULATED_SELL";
    }

    if (price < previous &&
        grid.some(level =>
          previous > level.price && price <= level.price
        )) {
      signal = "SIMULATED_BUY";
    }
  }

  return {
    mode: "simulation",
    executed: false,
    marketPrice: price,
    nearestGridLevel: nearest,
    signal,
    orderSize: cfg.orderSize,
    note: "Simulation only. No transaction sent."
  };
    }
