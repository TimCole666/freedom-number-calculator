import "./style.css";

import { createAnalytics } from "./analytics.ts";
import {
  calculateCoveragePercent,
  calculateFreedomNumber,
  calculateRemainingGap,
  EXPENSE_CATEGORIES,
  MAX_MONTHLY_AMOUNT,
  normalizeAmount,
  type ExpenseValues,
} from "./calculator.ts";
import {
  buildShareUrl,
  createPropagationId,
  experimentEventContext,
  parseSharedResult,
  resolveAttribution,
  type SharedResult,
} from "./experiment.ts";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("App root was not found.");

const attribution = resolveAttribution(window.location.search);
const incomingSharedResult = parseSharedResult(window.location.search);
const analytics = createAnalytics({
  websiteId: import.meta.env.VITE_UMAMI_WEBSITE_ID,
  scriptUrl: import.meta.env.VITE_UMAMI_SCRIPT_URL,
});
const analyticsContext = experimentEventContext(attribution);

const expenseFields = EXPENSE_CATEGORIES.map(
  ({ id, label }) => `
    <label class="money-field" for="expense-${id}">
      <span class="money-field__label">${label}</span>
      <span class="money-input">
        <span class="money-input__symbol" aria-hidden="true">$</span>
        <input
          id="expense-${id}"
          name="${id}"
          data-expense="${id}"
          type="number"
          inputmode="decimal"
          min="0"
          max="${MAX_MONTHLY_AMOUNT}"
          step="1"
          placeholder="0"
          autocomplete="off"
        />
      </span>
    </label>
  `,
).join("");

app.innerHTML = `
  <div class="page-shell">
    <header class="topbar">
      <a class="brand" href="${window.location.pathname}" aria-label="Freedom Number Calculator home">
        <span class="brand__mark" aria-hidden="true"><span></span></span>
        <span class="brand__name">Freedom Number</span>
      </a>
      <span class="status-pill">Independent tool</span>
    </header>

    <main>
      <section class="hero" aria-labelledby="page-title">
        <p class="eyebrow">ONE MONTHLY TARGET</p>
        <h1 id="page-title">What does <em>freedom</em> cost you each month?</h1>
        <p class="hero__lede">
          Add the monthly cost of the life you want. The total is the independent income target that would cover it.
        </p>
        <a class="hero__jump" href="#calculator">Find my number <span aria-hidden="true">↓</span></a>
      </section>

      <section class="shared-card" id="shared-card" hidden aria-labelledby="shared-title">
        <div class="shared-card__signal" aria-hidden="true"></div>
        <p class="eyebrow">SHARED WITH YOU</p>
        <h2 id="shared-title"></h2>
        <p id="shared-coverage"></p>
        <a class="text-link" href="#calculator">Now calculate yours <span aria-hidden="true">→</span></a>
      </section>

      <section class="calculator-card" id="calculator" aria-labelledby="calculator-title">
        <form id="calculator-form">
          <div class="section-heading">
            <span class="section-heading__number" aria-hidden="true">01</span>
            <div>
              <h2 id="calculator-title">Your monthly life</h2>
              <p>Use realistic, comfortable numbers—not a bare-minimum survival budget.</p>
            </div>
          </div>

          <div class="expense-grid">
            ${expenseFields}
          </div>

          <div class="income-block">
            <div class="income-block__copy">
              <span class="income-block__label">Independent income <span>optional</span></span>
              <p>Side project, freelance, creator, rental, or other income not tied to your main job.</p>
            </div>
            <label class="money-input money-input--income" for="independent-income">
              <span class="money-input__symbol" aria-hidden="true">$</span>
              <input
                id="independent-income"
                name="independent-income"
                type="number"
                inputmode="decimal"
                min="0"
                max="${MAX_MONTHLY_AMOUNT}"
                step="1"
                placeholder="0"
                autocomplete="off"
                aria-label="Current monthly independent income"
              />
            </label>
          </div>

          <p class="form-error" id="form-error" role="alert" hidden></p>

          <button class="calculate-button" type="submit">
            See my Freedom Number
            <span aria-hidden="true">→</span>
          </button>
          <p class="form-note">Monthly amounts in USD. Nothing is sent to a server by this calculator.</p>
        </form>
      </section>

      <section class="result-section" id="result" hidden aria-labelledby="result-title" aria-live="polite">
        <div class="result-card">
          <div class="result-card__topline">
            <p class="eyebrow eyebrow--light">YOUR FREEDOM NUMBER</p>
            <span class="result-card__dot" aria-hidden="true"></span>
          </div>
          <h2 class="sr-only" id="result-title" tabindex="-1">Your Freedom Number result</h2>
          <div class="result-number">
            <strong id="freedom-number">$0</strong>
            <span>/ month</span>
          </div>
          <p class="result-card__meaning">
            That’s the monthly independent income that would cover the lifestyle you entered.
          </p>

          <div class="coverage" id="coverage" hidden>
            <div class="coverage__headline">
              <strong id="coverage-percent">0%</strong>
              <span id="coverage-label">covered independently</span>
            </div>
            <div class="coverage__track" aria-hidden="true"><span id="coverage-bar"></span></div>
            <p id="coverage-detail"></p>
          </div>

          <div class="share-panel">
            <div>
              <p class="share-panel__kicker">MAKE IT SOCIAL</p>
              <h3>Share the number. Keep the breakdown private.</h3>
              <p>A shared link includes your Freedom Number and, if relevant, only your coverage percentage.</p>
            </div>
            <div class="share-actions">
              <button class="share-button share-button--x" id="share-x" type="button">
                <span aria-hidden="true">𝕏</span>
                Post on X
              </button>
              <button class="share-button" id="copy-link" type="button">
                Copy result link
              </button>
            </div>
            <p class="share-feedback" id="share-feedback" role="status" aria-live="polite"></p>
          </div>
        </div>
      </section>

      <section class="explainer" aria-labelledby="explainer-title">
        <div class="section-heading section-heading--compact">
          <span class="section-heading__number" aria-hidden="true">02</span>
          <div>
            <h2 id="explainer-title">One number, not a life plan</h2>
          </div>
        </div>
        <div class="explainer__grid">
          <p>
            The Freedom Number is a simple monthly target: the amount of independent income that would cover the life you actually want to fund.
          </p>
          <p>
            It is a clarity exercise, not a retirement forecast, investment model, tax calculation, or financial-planning recommendation.
          </p>
        </div>
      </section>
    </main>

    <footer>
      <p>
        Inspired by the “Freedom Number” exercise popularized in <cite>Million Dollar Weekend</cite> by Noah Kagan.
        This is an unofficial independent tool and is not affiliated with Noah Kagan, AppSumo, or the book’s publisher.
      </p>
    </footer>
  </div>
`;

function requiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Required element was not found: ${selector}`);
  return element;
}

const form = requiredElement<HTMLFormElement>("#calculator-form");
const resultSection = requiredElement<HTMLElement>("#result");
const resultTitle = requiredElement<HTMLElement>("#result-title");
const freedomNumberEl = requiredElement<HTMLElement>("#freedom-number");
const coverageEl = requiredElement<HTMLElement>("#coverage");
const coveragePercentEl = requiredElement<HTMLElement>("#coverage-percent");
const coverageLabelEl = requiredElement<HTMLElement>("#coverage-label");
const coverageBarEl = requiredElement<HTMLElement>("#coverage-bar");
const coverageDetailEl = requiredElement<HTMLElement>("#coverage-detail");
const formError = requiredElement<HTMLElement>("#form-error");
const incomeInput = requiredElement<HTMLInputElement>("#independent-income");
const shareXButton = requiredElement<HTMLButtonElement>("#share-x");
const copyLinkButton = requiredElement<HTMLButtonElement>("#copy-link");
const shareFeedback = requiredElement<HTMLElement>("#share-feedback");

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

let currentShareableResult: SharedResult | undefined;

function formatUsd(value: number): string {
  return usd.format(value);
}

function formatPercent(value: number): string {
  if (value > 0 && value < 1) return `${value.toFixed(1)}%`;
  return `${Math.round(value)}%`;
}

function readExpenseValues(): ExpenseValues {
  return EXPENSE_CATEGORIES.reduce((values, category) => {
    const input = document.querySelector<HTMLInputElement>(`[data-expense="${category.id}"]`);
    values[category.id] = input ? normalizeAmount(Number(input.value || 0)) : 0;
    return values;
  }, {} as ExpenseValues);
}

function showSharedResult(): void {
  if (!incomingSharedResult) return;
  const sharedCard = document.querySelector<HTMLElement>("#shared-card");
  const sharedTitle = document.querySelector<HTMLElement>("#shared-title");
  const sharedCoverage = document.querySelector<HTMLElement>("#shared-coverage");
  if (!sharedCard || !sharedTitle || !sharedCoverage) return;

  sharedTitle.textContent = `A Freedom Number of ${formatUsd(incomingSharedResult.freedomNumber)} / month was shared with you.`;
  if (incomingSharedResult.coveragePercent !== undefined) {
    sharedCoverage.textContent = `Independent income covers ${formatPercent(incomingSharedResult.coveragePercent)} of that number.`;
  } else {
    sharedCoverage.textContent = "What monthly number would cover the life you want?";
  }
  sharedCard.hidden = false;
}

function renderResult(freedomNumber: number, independentIncome?: number): void {
  freedomNumberEl.textContent = formatUsd(freedomNumber);
  resultSection.hidden = false;

  if (independentIncome !== undefined) {
    const coveragePercent = calculateCoveragePercent(freedomNumber, independentIncome);
    const remainingGap = calculateRemainingGap(freedomNumber, independentIncome);
    coveragePercentEl.textContent = formatPercent(coveragePercent);
    coverageBarEl.style.width = `${Math.min(100, coveragePercent)}%`;

    if (coveragePercent >= 100) {
      const surplus = Math.max(0, independentIncome - freedomNumber);
      coverageLabelEl.textContent = "covered — you’re over the line";
      coverageDetailEl.textContent = `On these numbers, your independent income is ${formatUsd(surplus)} / month above your Freedom Number.`;
    } else {
      coverageLabelEl.textContent = "covered independently";
      coverageDetailEl.textContent = `Your independent income currently covers ${formatPercent(coveragePercent)} of your Freedom Number. That leaves ${formatUsd(remainingGap)} / month to cover independently.`;
    }
    coverageEl.hidden = false;
    currentShareableResult = { freedomNumber, coveragePercent };
  } else {
    coverageEl.hidden = true;
    currentShareableResult = { freedomNumber };
  }

  resultTitle.focus({ preventScroll: true });
  resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function shareText(result: SharedResult): string {
  const first = `My Freedom Number is ${formatUsd(result.freedomNumber)} / month — the independent income that would cover the life I want.`;
  const coverage =
    result.coveragePercent !== undefined
      ? ` I’m already covering ${formatPercent(result.coveragePercent)} independently.`
      : "";
  return `${first}${coverage}\n\nWhat’s yours?`;
}

function createOutgoingShare(method: "x" | "copy") {
  if (!currentShareableResult) return undefined;
  const outgoing = buildShareUrl(
    window.location.href,
    currentShareableResult,
    attribution,
    createPropagationId(),
  );
  analytics.track("share_attempt", {
    ...analyticsContext,
    method,
    outgoing_via: outgoing.attribution.via ?? "",
    outgoing_generation: outgoing.attribution.generation,
  });
  return outgoing;
}

async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the legacy copy path.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  return copied;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  shareFeedback.textContent = "";

  if (!form.reportValidity()) return;

  const expenses = readExpenseValues();
  const freedomNumber = calculateFreedomNumber(expenses);
  if (freedomNumber <= 0) {
    formError.textContent = "Add at least one monthly expense to calculate your Freedom Number.";
    formError.hidden = false;
    const firstExpense = document.querySelector<HTMLInputElement>("[data-expense]");
    firstExpense?.focus();
    return;
  }
  formError.hidden = true;

  const independentIncome =
    incomeInput.value.trim() === "" ? undefined : normalizeAmount(Number(incomeInput.value));

  renderResult(freedomNumber, independentIncome);
  analytics.track("calculation_complete", {
    ...analyticsContext,
    has_independent_income: independentIncome !== undefined,
  });
});

shareXButton.addEventListener("click", () => {
  const outgoing = createOutgoingShare("x");
  if (!outgoing || !currentShareableResult) return;

  const intent = new URL("https://x.com/intent/tweet");
  intent.searchParams.set("text", shareText(currentShareableResult));
  intent.searchParams.set("url", outgoing.url);
  window.open(intent.toString(), "_blank", "noopener,noreferrer");
  shareFeedback.textContent = "Requested the X post composer with your result.";
});

copyLinkButton.addEventListener("click", async () => {
  const outgoing = createOutgoingShare("copy");
  if (!outgoing) return;

  const copied = await copyText(outgoing.url);
  if (!copied) {
    shareFeedback.textContent = "Couldn’t copy automatically. Your browser may block clipboard access.";
    return;
  }

  analytics.track("share_success", {
    ...analyticsContext,
    method: "copy",
    outgoing_via: outgoing.attribution.via ?? "",
    outgoing_generation: outgoing.attribution.generation,
  });
  shareFeedback.textContent = "Result link copied.";
});

showSharedResult();
analytics.track("visit", {
  ...analyticsContext,
  shared_result: Boolean(incomingSharedResult),
});
