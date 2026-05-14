/**
 * Customer account / Order status page block。
 *
 * 購入者が後で order status / customer account から戻ってきたときも
 * uniple pay link を再表示できる (= Thank you page を閉じた user の retry path)。
 */

import {
  reactExtension,
  useApi,
  BlockStack,
  Banner,
  Button,
  Text,
} from "@shopify/ui-extensions-react/customer-account";

interface AppMetafieldEntry {
  metafield: { namespace: string; key: string; value: unknown };
}

export default reactExtension("customer-account.order-status.block.render", () => (
  <UnipleOrderStatusBlock />
));

function UnipleOrderStatusBlock() {
  const api = useApi() as unknown as {
    appMetafields: { current: AppMetafieldEntry[] };
  };
  const entries = api.appMetafields?.current ?? [];
  const checkoutUrl = entries.find(
    (m) => m.metafield.namespace === "uniple" && m.metafield.key === "checkout_url",
  )?.metafield.value as string | undefined;
  const status = entries.find(
    (m) => m.metafield.namespace === "uniple" && m.metafield.key === "status",
  )?.metafield.value as string | undefined;

  if (!checkoutUrl) return null;
  if (status === "paid") {
    return (
      <Banner status="success" title="Paid">
        <Text>uniple checkout completed for this order.</Text>
      </Banner>
    );
  }
  return (
    <BlockStack spacing="base">
      <Banner status="info" title="Payment pending">
        <Text>Click below to complete payment via uniple.</Text>
      </Banner>
      <Button kind="primary" to={checkoutUrl}>
        Pay with uniple (JPYC)
      </Button>
    </BlockStack>
  );
}
