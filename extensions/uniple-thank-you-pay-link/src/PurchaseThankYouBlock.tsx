/**
 * Thank you page block (= purchase.thank-you.block.render)。
 *
 * Shopify Checkout 完了直後の Thank you page に表示。 metafield から uniple
 * checkoutUrl を読み取り、 pay button (= 「Pay with uniple (JPYC)」) を提示。
 */

import {
  reactExtension,
  useApi,
  BlockStack,
  Banner,
  Button,
  InlineLayout,
  Text,
} from "@shopify/ui-extensions-react/checkout";

interface AppMetafieldEntry {
  metafield: { namespace: string; key: string; value: unknown };
}

export default reactExtension("purchase.thank-you.block.render", () => <UnipleThankYouBlock />);

function UnipleThankYouBlock() {
  const api = useApi() as unknown as {
    appMetafields: { current: AppMetafieldEntry[] };
  };
  const entries = api.appMetafields?.current ?? [];
  const checkoutUrl = entries.find(
    (m) => m.metafield.namespace === "uniple" && m.metafield.key === "checkout_url",
  )?.metafield.value;
  const status = entries.find(
    (m) => m.metafield.namespace === "uniple" && m.metafield.key === "status",
  )?.metafield.value as string | undefined;

  if (!checkoutUrl || typeof checkoutUrl !== "string") {
    return null;
  }
  if (status === "paid") {
    return (
      <Banner status="success" title="Payment received">
        <Text>uniple checkout completed.</Text>
      </Banner>
    );
  }
  return (
    <BlockStack spacing="base">
      <Banner status="info" title="Complete payment with JPYC">
        <Text>
          Your order is reserved. Pay via uniple to confirm.
        </Text>
      </Banner>
      <InlineLayout columns={["fill"]} spacing="base">
        <Button kind="primary" to={checkoutUrl}>
          Pay with uniple (JPYC)
        </Button>
      </InlineLayout>
    </BlockStack>
  );
}
