/**
 * User-Agent header builder for uniple Merchant API calls.
 *
 * 形式: `uniple-plugin-shopify/<plugin-version> (Shopify Admin App)`
 * = uniple 本体 r49 UA parse の `pluginSourceHint` / `pluginVersionHint` /
 *   `platformContextHint` に分解格納される。
 *
 * EC-CUBE 4 / EC-CUBE 2 / WooCommerce plugin と同 pattern (= request 時生成、
 * plugin 起動時の bootstrap 順序に依存しない)。
 */

export const UNIPLE_PLUGIN_VERSION = "0.1.0";

export function buildUserAgent(): string {
  return `uniple-plugin-shopify/${UNIPLE_PLUGIN_VERSION} (Shopify Admin App)`;
}
