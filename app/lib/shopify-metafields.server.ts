/**
 * Shopify Order metafield 更新 helper (= UI extension の pay button 表示用)。
 *
 * codex r70 必須: orders/create で `pending` 書込、 paid 確定時に `paid` で update。
 * status 値を見て UI extension が表示分岐 (= pending → pay button / paid → 完了 banner)。
 */

import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import { unauthenticated } from "../shopify.server";

const METAFIELDS_SET_MUTATION = `#graphql
  mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields { id namespace key }
      userErrors { field message }
    }
  }
`;

export interface UnipleMetafieldValues {
  checkoutUrl?: string;
  sessionId?: string;
  status: string;
}

export async function setUnipleOrderMetafields(
  shop: string,
  orderGid: string,
  values: UnipleMetafieldValues,
  preconfiguredAdmin?: AdminApiContext,
): Promise<void> {
  const admin = preconfiguredAdmin ?? (await unauthenticated.admin(shop)).admin;
  const entries: Array<{
    ownerId: string;
    namespace: string;
    key: string;
    type: string;
    value: string;
  }> = [
    {
      ownerId: orderGid,
      namespace: "uniple",
      key: "status",
      type: "single_line_text_field",
      value: values.status,
    },
  ];
  if (values.checkoutUrl) {
    entries.push({
      ownerId: orderGid,
      namespace: "uniple",
      key: "checkout_url",
      type: "single_line_text_field",
      value: values.checkoutUrl,
    });
  }
  if (values.sessionId) {
    entries.push({
      ownerId: orderGid,
      namespace: "uniple",
      key: "session_id",
      type: "single_line_text_field",
      value: values.sessionId,
    });
  }

  const res = await admin.graphql(METAFIELDS_SET_MUTATION, {
    variables: { metafields: entries },
  });
  const json = (await res.json()) as {
    data?: { metafieldsSet?: { userErrors?: Array<{ field: string[]; message: string }> } };
  };
  const userErrors = json.data?.metafieldsSet?.userErrors ?? [];
  if (userErrors.length > 0) {
    const message = userErrors
      .map((e) => `${(e.field ?? []).join(".")}: ${e.message}`)
      .join("; ");
    throw new Error(`metafieldsSet userErrors: ${message}`);
  }
}
