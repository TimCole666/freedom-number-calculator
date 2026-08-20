import { MAX_FREEDOM_NUMBER } from "./calculator.ts";

export type Attribution = {
  source?: string;
  via?: string;
  generation: number;
};

export type SharedResult = {
  freedomNumber: number;
  coveragePercent?: number;
};

export type ExperimentEventData = Record<string, string | number | boolean>;

const SOURCE_MAX_LENGTH = 64;
const VIA_MAX_LENGTH = 24;
const PROPAGATION_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const MAX_SHARED_COVERAGE = 9_999;

function sanitizeToken(raw: string | null, maxLength: number): string | undefined {
  if (!raw) return undefined;
  const cleaned = raw.trim().replace(/[^A-Za-z0-9._-]/g, "").slice(0, maxLength);
  return cleaned || undefined;
}

function parseGeneration(raw: string | null, hasVia: boolean): number {
  if (!hasVia) return 0;
  if (!raw) return 1;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(99, Math.max(1, parsed));
}

function parseFreedomNumber(raw: string | null): number | undefined {
  if (raw === null || raw.trim() === "") return undefined;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > MAX_FREEDOM_NUMBER) return undefined;
  return Math.round((parsed + Number.EPSILON) * 100) / 100;
}

function parseCoverage(raw: string | null): number | undefined {
  if (raw === null || raw.trim() === "") return undefined;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > MAX_SHARED_COVERAGE) return undefined;
  return Math.round((parsed + Number.EPSILON) * 10) / 10;
}

function formatCompactNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

export function resolveAttribution(search: string): Attribution {
  const params = new URLSearchParams(search);
  const source = sanitizeToken(params.get("src"), SOURCE_MAX_LENGTH);
  const via = sanitizeToken(params.get("via"), VIA_MAX_LENGTH);

  return {
    ...(source ? { source } : {}),
    ...(via ? { via } : {}),
    generation: parseGeneration(params.get("gen"), Boolean(via)),
  };
}

export function parseSharedResult(search: string): SharedResult | undefined {
  const params = new URLSearchParams(search);
  const freedomNumber = parseFreedomNumber(params.get("fn"));
  if (freedomNumber === undefined) return undefined;

  const coveragePercent = parseCoverage(params.get("cov"));
  return {
    freedomNumber,
    ...(coveragePercent !== undefined ? { coveragePercent } : {}),
  };
}

export function createPropagationId(length = 8): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => PROPAGATION_ALPHABET[value % PROPAGATION_ALPHABET.length]).join("");
}

export function buildShareUrl(
  currentUrl: string,
  result: SharedResult,
  attribution: Attribution,
  propagationId: string,
): { url: string; attribution: Attribution } {
  const via = sanitizeToken(propagationId, VIA_MAX_LENGTH);
  if (!via) throw new Error("Propagation ID must contain a share-safe character.");

  const outgoing: Attribution = {
    ...(attribution.source ? { source: attribution.source } : {}),
    via,
    generation: Math.min(99, attribution.generation + 1),
  };

  const url = new URL(currentUrl);
  url.hash = "";
  url.search = "";
  const freedomNumber = Math.max(0, Math.min(MAX_FREEDOM_NUMBER, result.freedomNumber));
  url.searchParams.set("fn", formatCompactNumber(Math.round((freedomNumber + Number.EPSILON) * 100) / 100));
  if (result.coveragePercent !== undefined) {
    url.searchParams.set("cov", formatCompactNumber(Math.max(0, Math.min(MAX_SHARED_COVERAGE, result.coveragePercent))));
  }
  if (outgoing.source) url.searchParams.set("src", outgoing.source);
  url.searchParams.set("via", outgoing.via ?? via);
  url.searchParams.set("gen", String(outgoing.generation));

  return { url: url.toString(), attribution: outgoing };
}

export function experimentEventContext(attribution: Attribution): ExperimentEventData {
  return {
    generation: attribution.generation,
    ...(attribution.source ? { source: attribution.source } : {}),
    ...(attribution.via ? { via: attribution.via } : {}),
  };
}
