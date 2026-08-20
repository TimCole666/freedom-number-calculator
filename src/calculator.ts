export const EXPENSE_CATEGORIES = [
  { id: "housing", label: "Housing" },
  { id: "food", label: "Food" },
  { id: "transportation", label: "Transportation" },
  { id: "dependents", label: "Family / dependents" },
  { id: "lifestyle", label: "Fun / lifestyle" },
  { id: "other", label: "Other" },
] as const;

export type ExpenseCategoryId = (typeof EXPENSE_CATEGORIES)[number]["id"];
export type ExpenseValues = Record<ExpenseCategoryId, number>;

export const MAX_MONTHLY_AMOUNT = 9_999_999;
export const MAX_FREEDOM_NUMBER = MAX_MONTHLY_AMOUNT * EXPENSE_CATEGORIES.length;

export function normalizeAmount(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const bounded = Math.min(value, MAX_MONTHLY_AMOUNT);
  return Math.round((bounded + Number.EPSILON) * 100) / 100;
}

export function calculateFreedomNumber(expenses: Partial<ExpenseValues>): number {
  const total = EXPENSE_CATEGORIES.reduce((sum, category) => {
    return sum + normalizeAmount(expenses[category.id] ?? 0);
  }, 0);

  return Math.round((total + Number.EPSILON) * 100) / 100;
}

export function calculateCoveragePercent(freedomNumber: number, independentIncome: number): number {
  const target = normalizeAmount(freedomNumber);
  if (target === 0) return 0;
  const percent = (normalizeAmount(independentIncome) / target) * 100;
  return Math.round((percent + Number.EPSILON) * 10) / 10;
}

export function calculateRemainingGap(freedomNumber: number, independentIncome: number): number {
  return Math.max(0, normalizeAmount(freedomNumber) - normalizeAmount(independentIncome));
}
