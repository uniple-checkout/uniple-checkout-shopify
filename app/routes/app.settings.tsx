// Copyright (C) 2026 uniple inc.
// SPDX-License-Identifier: GPL-2.0-or-later

/**
 * uniple settings page.
 *
 * Admin → Apps → uniple checkout → Settings で API key + Webhook secret を入力。
 * codex r70 ADJUST: 別 `ShopSettings` table + masked display + capability =
 * Shopify admin context (= authenticate.admin の session) でアクセス制御。
 */

import { useEffect, useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Form, useActionData, useLoaderData, useNavigation } from "react-router";
import {
  AppProvider as PolarisAppProvider,
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  FormLayout,
  InlineStack,
  Layout,
  Page,
  Select,
  Text,
  TextField,
} from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { UnipleClient } from "../lib/uniple-client.server";
import { syncShopifyX402Products, type ShopifyX402SyncResult } from "../lib/shopify-x402-product-sync.server";

const MASK = "••••••••";

interface LoaderData {
  shop: string;
  settings: {
    apiBaseUrl: string;
    apiKey: string; // masked
    webhookSecret: string; // masked
    merchantLabel: string;
    mode: "live" | "test";
    hasApiKey: boolean;
    hasWebhookSecret: boolean;
    x402LastSync?: X402SyncSummary;
    x402LastSyncError?: string;
  };
  x402Products: Array<{
    externalId: string;
    name: string;
    priceJpyc: string;
    active: boolean;
    aiEnabled: boolean;
  }>;
}

interface ActionData {
  ok?: boolean;
  error?: string;
  x402Sync?: X402SyncSummary;
}

type X402SyncSummary = Pick<ShopifyX402SyncResult, "synced" | "active" | "inactive" | "skipped"> & {
  syncedAt?: string;
};

const toX402SyncSummary = (
  result: Pick<ShopifyX402SyncResult, "synced" | "active" | "inactive" | "skipped">,
  syncedAt = new Date(),
): X402SyncSummary => ({
  synced: result.synced,
  active: result.active,
  inactive: result.inactive,
  skipped: result.skipped,
  syncedAt: syncedAt.toISOString(),
});

const persistX402SyncSummary = async (
  shop: string,
  summary: X402SyncSummary,
  syncedAt = new Date(summary.syncedAt ?? Date.now()),
) => {
  await db.shopSettings.update({
    where: { shop },
    data: {
      x402LastSyncSynced: summary.synced,
      x402LastSyncActive: summary.active,
      x402LastSyncInactive: summary.inactive,
      x402LastSyncSkipped: summary.skipped,
      x402LastSyncError: null,
      x402LastSyncAt: syncedAt,
    },
  });
};

const persistX402SyncError = async (shop: string, message: string) => {
  await db.shopSettings.update({
    where: { shop },
    data: {
      x402LastSyncError: message,
      x402LastSyncAt: new Date(),
    },
  });
};

export const loader = async ({ request }: LoaderFunctionArgs): Promise<LoaderData> => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const settings = await db.shopSettings.findUnique({ where: { shop } });
  const x402Products = await db.x402Product.findMany({
    where: { shop },
    orderBy: { externalId: "asc" },
    select: {
      externalId: true,
      name: true,
      priceJpyc: true,
      active: true,
      aiEnabled: true,
    },
    take: 200,
  });
  const storedX402LastSync =
    settings?.x402LastSyncSynced === null || settings?.x402LastSyncSynced === undefined
      ? undefined
      : {
          synced: settings.x402LastSyncSynced,
          active: settings.x402LastSyncActive ?? 0,
          inactive: settings.x402LastSyncInactive ?? 0,
          skipped: settings.x402LastSyncSkipped ?? 0,
          syncedAt: settings.x402LastSyncAt?.toISOString(),
        };
  const currentX402SyncSummary =
    x402Products.length === 0
      ? undefined
      : {
          synced: x402Products.length,
          active: x402Products.filter((product) => product.active).length,
          inactive: x402Products.filter((product) => !product.active).length,
          skipped: 0,
        };

  return {
    shop,
    settings: {
      apiBaseUrl: settings?.apiBaseUrl ?? "https://uniple.io",
      apiKey: settings?.apiKey ? MASK : "",
      webhookSecret: settings?.webhookSecret ? MASK : "",
      merchantLabel: settings?.merchantLabel ?? "",
      mode: ((settings?.mode as "live" | "test") ?? "live") as "live" | "test",
      hasApiKey: Boolean(settings?.apiKey),
      hasWebhookSecret: Boolean(settings?.webhookSecret),
      x402LastSync: storedX402LastSync ?? currentX402SyncSummary,
      x402LastSyncError: settings?.x402LastSyncError ?? undefined,
    },
    x402Products,
  };
};

export const action = async ({ request }: ActionFunctionArgs): Promise<ActionData> => {
  const { session, admin } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "save");

  if (intent === "x402_sync") {
    const settings = await db.shopSettings.findUnique({ where: { shop } });
    if (!settings || !settings.apiKey) {
      return { error: "Merchant API keyを保存してから x402商品同期を実行してください。" };
    }
    try {
      const result = await syncShopifyX402Products(
        admin,
        shop,
        new UnipleClient({
          apiKey: settings.apiKey,
          webhookSecret: settings.webhookSecret,
          merchantLabel: settings.merchantLabel,
          apiBaseUrl: settings.apiBaseUrl,
          mode: settings.mode as "live" | "test",
        }),
      );
      const summary = toX402SyncSummary(result);
      await persistX402SyncSummary(shop, summary);
      return {
        ok: true,
        x402Sync: summary,
      };
    } catch (e) {
      const message = `x402商品同期に失敗しました: ${(e as Error).message}`;
      await persistX402SyncError(shop, message);
      return { error: message };
    }
  }

  if (intent === "x402_settings_save") {
    const enabled = new Set(formData.getAll("x402AiEnabled").map((value) => String(value)));
    const products = await db.x402Product.findMany({
      where: { shop },
      select: { externalId: true },
      take: 200,
    });
    for (const product of products) {
      await db.x402Product.update({
        where: { externalId: product.externalId },
        data: { aiEnabled: enabled.has(product.externalId) },
      });
    }

    const settings = await db.shopSettings.findUnique({ where: { shop } });
    if (!settings || !settings.apiKey) {
      return { ok: true };
    }
    try {
      const result = await syncShopifyX402Products(
        admin,
        shop,
        new UnipleClient({
          apiKey: settings.apiKey,
          webhookSecret: settings.webhookSecret,
          merchantLabel: settings.merchantLabel,
          apiBaseUrl: settings.apiBaseUrl,
          mode: settings.mode as "live" | "test",
        }),
      );
      const summary = toX402SyncSummary(result);
      await persistX402SyncSummary(shop, summary);
      return {
        ok: true,
        x402Sync: summary,
      };
    } catch (e) {
      const message = `x402商品同期に失敗しました: ${(e as Error).message}`;
      await persistX402SyncError(shop, message);
      return { error: message };
    }
  }

  const apiBaseUrl = String(formData.get("apiBaseUrl") ?? "https://uniple.io").trim();
  const merchantLabel = String(formData.get("merchantLabel") ?? "").trim();
  const mode = (String(formData.get("mode") ?? "live") === "test" ? "test" : "live") as
    | "live"
    | "test";
  const apiKeyInput = String(formData.get("apiKey") ?? "");
  const webhookSecretInput = String(formData.get("webhookSecret") ?? "");

  const existing = await db.shopSettings.findUnique({ where: { shop } });

  // mask または空のときは既存値を維持 (= EC-CUBE 4 / WC plugin と同 pattern)
  const preserveIfMasked = (value: string, current: string): string => {
    const trimmed = value.trim();
    if (trimmed === "" || trimmed === MASK) return current;
    return trimmed;
  };

  const apiKey = preserveIfMasked(apiKeyInput, existing?.apiKey ?? "");
  const webhookSecret = preserveIfMasked(webhookSecretInput, existing?.webhookSecret ?? "");

  await db.shopSettings.upsert({
    where: { shop },
    create: {
      shop,
      apiBaseUrl,
      apiKey,
      webhookSecret,
      merchantLabel,
      mode,
    },
    update: {
      apiBaseUrl,
      apiKey,
      webhookSecret,
      merchantLabel,
      mode,
    },
  });
  return { ok: true };
};

export default function Settings() {
  const { shop, settings, x402Products } = useLoaderData<typeof loader>() as LoaderData;
  const actionData = useActionData<typeof action>() as ActionData | undefined;
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";
  const latestX402Sync = actionData?.x402Sync ?? settings.x402LastSync;
  const latestX402SyncError =
    actionData?.error?.startsWith("x402商品同期に失敗しました") ? actionData.error : settings.x402LastSyncError;

  const [apiBaseUrl, setApiBaseUrl] = useState(settings.apiBaseUrl);
  const [merchantLabel, setMerchantLabel] = useState(settings.merchantLabel);
  const [mode, setMode] = useState<"live" | "test">(settings.mode);
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [webhookSecret, setWebhookSecret] = useState(settings.webhookSecret);
  const [savedFlash, setSavedFlash] = useState(false);
  const [x402AiEnabled, setX402AiEnabled] = useState<Set<string>>(
    () => new Set(x402Products.filter((product) => product.aiEnabled).map((product) => product.externalId)),
  );
  const x402ProductStateKey = x402Products
    .map((product) => `${product.externalId}:${product.aiEnabled ? "1" : "0"}`)
    .join("|");

  useEffect(() => {
    if (actionData?.ok && !actionData.x402Sync) {
      setSavedFlash(true);
      const timer = setTimeout(() => setSavedFlash(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [actionData?.ok, actionData?.x402Sync]);

  useEffect(() => {
    setX402AiEnabled(
      new Set(x402Products.filter((product) => product.aiEnabled).map((product) => product.externalId)),
    );
  }, [x402ProductStateKey]);

  const setAllX402Products = (enabled: boolean) => {
    setX402AiEnabled(enabled ? new Set(x402Products.map((product) => product.externalId)) : new Set());
  };

  const setActiveX402Products = () => {
    setX402AiEnabled(new Set(x402Products.filter((product) => product.active).map((product) => product.externalId)));
  };

  const toggleX402Product = (externalId: string, enabled: boolean) => {
    setX402AiEnabled((current) => {
      const next = new Set(current);
      if (enabled) {
        next.add(externalId);
      } else {
        next.delete(externalId);
      }
      return next;
    });
  };

  return (
    <PolarisAppProvider i18n={enTranslations}>
      <Page title="uniple checkout settings" subtitle={`Shop: ${shop}`}>
        <Layout>
          <Layout.Section>
            {savedFlash && (
              <Box paddingBlockEnd="400">
                <Banner tone="success" title="Settings saved">
                  <p>uniple credentials updated.</p>
                </Banner>
              </Box>
            )}
            {actionData?.error && (
              <Box paddingBlockEnd="400">
                <Banner tone="critical" title="Failed to save">
                  <p>{actionData.error}</p>
                </Banner>
              </Box>
            )}
            <Card>
              <Form method="post">
                <input type="hidden" name="intent" value="save" />
                <FormLayout>
                  <TextField
                    label="API base URL"
                    name="apiBaseUrl"
                    value={apiBaseUrl}
                    onChange={setApiBaseUrl}
                    autoComplete="off"
                    helpText="Default: https://uniple.io"
                  />
                  <TextField
                    label="Merchant label"
                    name="merchantLabel"
                    value={merchantLabel}
                    onChange={setMerchantLabel}
                    autoComplete="off"
                    helpText="Displayed on the uniple checkout page."
                  />
                  <Select
                    label="Mode"
                    name="mode"
                    options={[
                      { label: "Live", value: "live" },
                      { label: "Test", value: "test" },
                    ]}
                    value={mode}
                    onChange={(v: string) => setMode(v as "live" | "test")}
                  />
                  <TextField
                    label="API key"
                    name="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={setApiKey}
                    autoComplete="off"
                    helpText="Issued by uniple admin. Stored masked; submit blank or the mask to keep the current value."
                  />
                  <TextField
                    label="Webhook secret"
                    name="webhookSecret"
                    type="password"
                    value={webhookSecret}
                    onChange={setWebhookSecret}
                    autoComplete="off"
                    helpText="HMAC-SHA256 webhook signing secret."
                  />
                  <InlineStack align="end">
                    <Button submit variant="primary" loading={submitting}>
                      Save settings
                    </Button>
                  </InlineStack>
                </FormLayout>
	                </Form>
	                {x402Products.length > 0 && (
	                  <Box paddingBlockStart="400">
	                    <Form method="post">
	                      <input type="hidden" name="intent" value="x402_settings_save" />
	                      <BlockStack gap="300">
	                        <Text as="h2" variant="headingSm">
	                          AI購入対象
	                        </Text>
	                        <InlineStack gap="200">
	                          <Button onClick={() => setAllX402Products(true)}>全て選択</Button>
	                          <Button onClick={() => setAllX402Products(false)}>全て解除</Button>
	                          <Button onClick={setActiveX402Products}>同期済みで有効な商品だけ選択</Button>
	                        </InlineStack>
	                        <div style={{ overflowX: "auto" }}>
	                          <table style={{ width: "100%", borderCollapse: "collapse" }}>
	                            <thead>
	                              <tr>
	                                <th style={{ textAlign: "left", padding: "8px", width: "120px" }}>AI購入対象</th>
	                                <th style={{ textAlign: "left", padding: "8px" }}>Variant</th>
	                                <th style={{ textAlign: "left", padding: "8px", width: "100px" }}>Price</th>
	                                <th style={{ textAlign: "left", padding: "8px", width: "90px" }}>Status</th>
	                              </tr>
	                            </thead>
	                            <tbody>
	                              {x402Products.map((product) => (
	                                <tr key={product.externalId}>
	                                  <td style={{ padding: "8px", borderTop: "1px solid #e3e3e3" }}>
	                                    <input
	                                      type="checkbox"
	                                      name="x402AiEnabled"
	                                      value={product.externalId}
	                                      checked={x402AiEnabled.has(product.externalId)}
	                                      onChange={(event) => toggleX402Product(product.externalId, event.currentTarget.checked)}
	                                    />
	                                  </td>
	                                  <td style={{ padding: "8px", borderTop: "1px solid #e3e3e3" }}>
	                                    <div>{product.name}</div>
	                                    <code>{product.externalId}</code>
	                                  </td>
	                                  <td style={{ padding: "8px", borderTop: "1px solid #e3e3e3" }}>
	                                    {product.priceJpyc} JPYC
	                                  </td>
	                                  <td style={{ padding: "8px", borderTop: "1px solid #e3e3e3" }}>
	                                    {product.active ? "有効" : "無効"}
	                                  </td>
	                                </tr>
	                              ))}
	                            </tbody>
	                          </table>
	                        </div>
	                        <InlineStack align="end">
	                          <Button submit loading={submitting}>
	                            AI購入対象設定を保存
	                          </Button>
	                        </InlineStack>
	                      </BlockStack>
	                    </Form>
	                  </Box>
	                )}
	              </Card>
            <Box paddingBlockStart="400">
              <Card>
                <Form method="post">
                  <input type="hidden" name="intent" value="x402_sync" />
                  <BlockStack gap="300">
                    <Text as="h2" variant="headingMd">
                      x402 / AI購入 商品同期
                    </Text>
                    <Text as="p" tone="subdued">
                      Shopifyの商品バリエーションをunipleの商品catalogへ同期します。公開中・購入可能なバリエーションは有効として同期されます。
                    </Text>
                    <Text as="p" tone="subdued">
                      通常のHosted Checkout / LINE / WalletConnect決済フローは変更されません。
                    </Text>
                    <InlineStack align="end">
                      <Button submit loading={submitting}>
                        x402商品同期
                      </Button>
                    </InlineStack>
                    {latestX402Sync && (
                      <Box
                        padding="300"
                        borderInlineStartWidth="050"
                        borderColor="border-success"
                        background="bg-surface-success"
                      >
                        <BlockStack gap="100">
                          <Text as="p">
                            商品同期: 同期 {latestX402Sync.synced}件 / 有効 {latestX402Sync.active}
                            件 / 無効 {latestX402Sync.inactive}件 / 同期対象外{" "}
                            {latestX402Sync.skipped}件
                          </Text>
                          {latestX402Sync.syncedAt && (
                            <Text as="p" tone="subdued">
                              最終同期: {new Date(latestX402Sync.syncedAt).toLocaleString("ja-JP")}
                            </Text>
                          )}
                        </BlockStack>
                      </Box>
                    )}
                    {latestX402SyncError && (
                      <Banner tone="critical" title="商品同期">
                        <p>{latestX402SyncError}</p>
                      </Banner>
                    )}
                  </BlockStack>
                </Form>
              </Card>
            </Box>
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">
                  Status
                </Text>
                <Text as="p" tone="subdued">
                  API key: {settings.hasApiKey ? "set" : "not set"}
                </Text>
                <Text as="p" tone="subdued">
                  Webhook secret: {settings.hasWebhookSecret ? "set" : "not set"}
                </Text>
                <Text as="p" tone="subdued">
                  Route flow: Manual Payment + order confirmation email pay link
                  (= email-only design).
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </PolarisAppProvider>
  );
}
