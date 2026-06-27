// Copyright (C) 2026 uniple inc.
// SPDX-License-Identifier: GPL-2.0-or-later

import { describe, expect, it } from "vitest";
import { shopifyVariantCatalogName } from "../shopify-x402-product-sync.server";

describe("shopifyVariantCatalogName", () => {
  it("uses the product title for Shopify default variants", () => {
    expect(
      shopifyVariantCatalogName({
        title: "Default Title",
        displayName: "オリジナルステッカー 50 JPYC - Default Title",
        product: { title: "オリジナルステッカー 50 JPYC" },
      }),
    ).toBe("オリジナルステッカー 50 JPYC");
  });

  it("keeps display names for real variant titles", () => {
    expect(
      shopifyVariantCatalogName({
        title: "Red",
        displayName: "Tシャツ - Red",
        product: { title: "Tシャツ" },
      }),
    ).toBe("Tシャツ - Red");
  });
});
