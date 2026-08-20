import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateCoveragePercent,
  calculateFreedomNumber,
  calculateRemainingGap,
  normalizeAmount,
} from "../src/calculator.ts";

test("calculates a Freedom Number from the six monthly categories", () => {
  const total = calculateFreedomNumber({
    housing: 2200,
    food: 700,
    transportation: 450,
    dependents: 800,
    lifestyle: 500,
    other: 350,
  });

  assert.equal(total, 5000);
});

test("normalizes negative and non-finite values to zero", () => {
  assert.equal(normalizeAmount(-10), 0);
  assert.equal(normalizeAmount(Number.NaN), 0);
  assert.equal(normalizeAmount(Number.POSITIVE_INFINITY), 0);
});

test("calculates independent-income coverage without capping at 100 percent", () => {
  assert.equal(calculateCoveragePercent(5000, 1450), 29);
  assert.equal(calculateCoveragePercent(5000, 6250), 125);
});

test("remaining gap bottoms out at zero", () => {
  assert.equal(calculateRemainingGap(5000, 1450), 3550);
  assert.equal(calculateRemainingGap(5000, 6250), 0);
});
