import { describe, expect, it } from "vitest";
import { buildUserAgent, UNIPLE_PLUGIN_VERSION } from "../uniple-user-agent.server";

describe("buildUserAgent", () => {
  it("emits expected format", () => {
    const ua = buildUserAgent();
    expect(ua).toBe(`uniple-plugin-shopify/${UNIPLE_PLUGIN_VERSION} (Shopify Admin App)`);
  });
  it("matches uniple SSR parse regex", () => {
    // uniple 本体 r49 = `uniple-plugin-<source>/<version> (<context>)`
    expect(buildUserAgent()).toMatch(
      /^uniple-plugin-shopify\/\d+\.\d+\.\d+ \(Shopify Admin App\)$/,
    );
  });
});
