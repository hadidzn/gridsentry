export function validateGridConfig(config) {
  if (!config || typeof config !== "object") {
    throw new Error("Invalid grid configuration");
  }

  const lower = Number(config.lowerPrice);
  const upper = Number(config.upperPrice);
  const levels = Number(config.levels);
  const orderSize = Number(config.orderSize ?? 1);

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

  if (!Number.isFinite(orderSize) || orderSize <= 0) {
    throw new Error("Order size must be a positive finite number");
  }

  return { lowerPrice: lower, upperPrice: upper, levels, orderSize };
}

export function buildGrid(config) {
  const cfg = validateGridConfig(config);
  const step = (cfg.upperPrice - cfg.lowerPrice) / (cfg.levels - 1);

  return Array.from({ length: cfg.levels }, (_, index) => ({
    index,
    price: Number((cfg.lowerPrice + step * index).toFixed(8))
  }));
}

export function evaluatePrice(config, marketPrice, previousPrice = null) {
  const cfg = validateGridConfig(config);
  const price = Number(marketPrice);

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("Invalid market price");
  }

  let previous = null;
  if (previousPrice !== null) {
    previous = Number(previousPrice);
    if (!Number.isFinite(previous) || previous <= 0) {
      throw new Error("Invalid previous price");
    }
  }

  const grid = buildGrid(cfg);
  const nearest = grid.reduce((best, level) =>
    Math.abs(level.price - price) < Math.abs(best.price - price)
      ? level
      : best
  );

  let signal = "HOLD";
  if (previous !== null) {
    if (
      price > previous &&
      grid.some(level => previous < level.price && price >= level.price)
    ) {
      signal = "SIMULATED_SELL";
    } else if (
      price < previous &&
      grid.some(level => previous > level.price && price <= level.price)
    ) {
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
