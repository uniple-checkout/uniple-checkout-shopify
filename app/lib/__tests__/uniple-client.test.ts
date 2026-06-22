// Copyright (C) 2026 uniple inc.
// SPDX-License-Identifier: GPL-2.0-or-later

import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { UnipleClient, UnipleConfig } from "../uniple-client.server";

function makeClient(overrides: Partial<UnipleConfig> = {}): UnipleClient {
  return new UnipleClient({
    apiKey: "sk_test",
    webhookSecret: "whsec_test",
    merchantLabel: "demo",
    apiBaseUrl: "https://uniple.io",
    mode: "live",
    ...overrides,
  });
}

describe("UnipleClient.verifySignature", () => {
  it("accepts valid signature with sha256= prefix", () => {
    const body = '{"foo":"bar"}';
    const sig = "sha256=" + createHmac("sha256", "whsec_test").update(body).digest("hex");
    expect(makeClient().verifySignature(body, sig)).toBe(true);
  });
  it("accepts valid signature without prefix", () => {
    const body = '{"foo":"bar"}';
    const sig = createHmac("sha256", "whsec_test").update(body).digest("hex");
    expect(makeClient().verifySignature(body, sig)).toBe(true);
  });
  it("rejects wrong secret", () => {
    const body = '{"foo":"bar"}';
    const sig = "sha256=" + createHmac("sha256", "whsec_other").update(body).digest("hex");
    expect(makeClient().verifySignature(body, sig)).toBe(false);
  });
  it("rejects tampered body", () => {
    const sig = "sha256=" + createHmac("sha256", "whsec_test").update('{"foo":"bar"}').digest("hex");
    expect(makeClient().verifySignature('{"foo":"baz"}', sig)).toBe(false);
  });
  it("rejects empty", () => {
    expect(makeClient().verifySignature("", "")).toBe(false);
    expect(makeClient().verifySignature("body", "")).toBe(false);
    expect(makeClient().verifySignature("body", "sha256=deadbeef")).toBe(false);
  });
  it("rejects when secret missing", () => {
    expect(makeClient({ webhookSecret: "" }).verifySignature("body", "sha256=abc")).toBe(false);
  });
});
