import assert from "node:assert/strict";
import test from "node:test";

import {
  buildShareUrl,
  parseSharedResult,
  resolveAttribution,
} from "../src/experiment.ts";

test("parses a clean source identifier and ignores unsafe characters", () => {
  assert.deepEqual(resolveAttribution("?src=x-post-01%20!&gen=9"), {
    source: "x-post-01",
    generation: 0,
  });
});

test("recognizes propagated visits and generation", () => {
  assert.deepEqual(resolveAttribution("?src=x-post-01&via=ABCD2345&gen=2"), {
    source: "x-post-01",
    via: "ABCD2345",
    generation: 2,
  });
});

test("parses only privacy-minimal shared result state", () => {
  assert.deepEqual(parseSharedResult("?fn=4850&cov=28.9&housing=999999&inc=1400"), {
    freedomNumber: 4850,
    coveragePercent: 28.9,
  });
});

test("rejects invalid shared result state", () => {
  assert.equal(parseSharedResult("?fn=-10&cov=20"), undefined);
  assert.equal(parseSharedResult("?fn=not-a-number"), undefined);
  assert.equal(parseSharedResult("?cov=20"), undefined);
});

test("share URLs preserve the base path, carry minimal result state, and increment propagation", () => {
  const shared = buildShareUrl(
    "https://example.com/tools/freedom/?src=x-post-01&junk=drop-me#result",
    { freedomNumber: 4850, coveragePercent: 28.9 },
    { source: "x-post-01", generation: 0 },
    "ZXCV2345",
  );

  assert.equal(
    shared.url,
    "https://example.com/tools/freedom/?fn=4850&cov=28.9&src=x-post-01&via=ZXCV2345&gen=1",
  );
  assert.deepEqual(shared.attribution, {
    source: "x-post-01",
    via: "ZXCV2345",
    generation: 1,
  });
  assert.equal(new URL(shared.url).searchParams.has("inc"), false);
});

test("second-generation shares receive a fresh via and increment generation", () => {
  const shared = buildShareUrl(
    "https://example.com/?fn=4850&via=FIRST234&gen=1",
    { freedomNumber: 5100 },
    { via: "FIRST234", generation: 1 },
    "SECOND56",
  );

  const url = new URL(shared.url);
  assert.equal(url.searchParams.get("fn"), "5100");
  assert.equal(url.searchParams.get("via"), "SECOND56");
  assert.equal(url.searchParams.get("gen"), "2");
  assert.equal(url.searchParams.has("cov"), false);
});
