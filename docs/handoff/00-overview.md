# 00 — Project Overview

## uniple inc. + 4 plugin 配布 background

uniple inc. (= Partner ID `218108954`、 support@uniple.io、 https://uniple.io) は JPYC (= 日本円ステーブルコイン、 電子決済手段) 決済 provider。 主要事業 = 加盟店 (= merchant) に対して e-commerce 上で JPYC 決済を受付ける integration を 4 つの主要 platform で提供:

| Platform | Plugin name | 公開方法 | 状態 |
|---|---|---|---|
| WooCommerce | uniple checkout for WooCommerce | **WP.org 公式 directory** + GitHub release | v0.1.2 公開済 (= 2026-05-21) |
| EC-CUBE 4 | uniple checkout for EC-CUBE 4 | GitHub release (= 公式 store 未対応) | v0.1.1 公開済 (= 2026-05-21) |
| EC-CUBE 2 | uniple checkout for EC-CUBE 2 | GitHub release | v0.1.1 公開済 (= 2026-05-21) |
| **Shopify** | **uniple checkout for Shopify** | **Custom Distribution** + GitHub release (= App Store 不可) | **v0.1.0 公開済 (= 2026-05-27)** |

本 handoff は **Shopify plugin 専用**。 他 3 plugin の memory 参照は `MEMORY.md` の `project_phase1_github_release` 等。

## uniple checkout for Shopify の core 設計

### Customer 動線 (= Email-only Design)

```
[customer] Shopify shop で商品購入
    ↓
[checkout] 支払い方法で 「uniple checkout (JPYC)」 (= Manual Payment) を選択
    ↓
[Shopify] order を pending state で確定
    ↓
[plugin] orders/create webhook 受信 → uniple checkout session 作成 → metafield 書込
    ↓
[Shopify] 注文確認 email 自動送信 (= Liquid snippet で 「JPYC のお支払いに進む」 button 表示)
    ↓
[customer] email button click → App Proxy `/apps/uniple-pay-link` → uniple checkout session URL に redirect
    ↓
[uniple] customer が wallet 接続 → JPYC 送金
    ↓
[uniple] webhook で plugin に payment success 通知
    ↓
[plugin] Shopify Admin API の orderMarkAsPaid で order paid 化
    ↓
[Shopify] return URL (= `/api/uniple-return`) → Order Status page に redirect → customer 「支払い済」 確認
```

### 設計原則

1. **Email-only**: customer の payment entry point は注文確認 email の button **のみ**。 Thank you page / Customer Account Order Status page には **支払い button を表示しない** (= Shopify UI extension は意図的に不採用、 理由は audit findings 参照)。
2. **Minimal scope**: `read_orders, write_orders` のみ。 `write_products` 等は不要。
3. **per-merchant credentials**: 加盟店ごとに `apiBaseUrl` / `apiKey` / `webhookSecret` / `merchantLabel` / `mode` を ShopSettings DB に保存。
4. **Idempotent webhooks**: uniple webhook は `processedEventIds` で重複排除。
5. **JPYC compliance**: 「日本円ステーブルコイン」「電子決済手段」 表記、 「暗号資産」 NG (= 資金決済法準拠)。

### 配布方法 = Custom Distribution

Shopify App Store **公開しない**確定:
- 公式 docs section 5.2: 「Payments apps aren't permitted to use any Shopify APIs other than the Payments Apps API」 = 我々の Manual Payment + Liquid + App Proxy pattern は payment app として App Store では不適合
- 公式 docs section 5.11: cryptocurrency 系 functionality は Approved Payments Partner 必須、 PPP (= Payments Partner Platform) 現状 invitation-only
- 詳細は `02-key-decisions.md` 「決定 5: App Store 申請断念」 参照

代わりに **Custom Distribution** = 加盟店申請 form (= https://forms.gle/b8kwVZeynA1ffV8j6) 経由 merchant 個別に install link 発行で運用。

## 関連 stakeholder

| Stakeholder | role | 連絡 channel |
|---|---|---|
| D user (Ryoichi) | uniple 経営判断、 最終意思決定者 | 直接 chat |
| dev claude | uniple.io 本体 (= dev.uniple.io / uniple.io domain、 API gate、 webhook 等) 担当 | D user 経由 paste relay |
| production claude | production env / 経営判断レイヤ relay 用 | D user 経由 paste relay |
| Shopify Partner Support | Payments Apps API access 申請窓口 (= 現状 PPP closed と回答済) | help.shopify.com → Partner organization 選択 → chat |
| Shopify community | https://community.shopify.dev/ thread でescalation 待ち | 公開 thread + DM |
| codex (引き継ぎ先) | 本 handoff 受領 | 本 chat |

## scope outside (= 本 handoff の対象外)

- WC / EC4 / EC2 plugin の内部状態 (= 既存 4 plugin の関連 memory 参照)
- uniple.io 本体 (= dev.uniple.io) の API / domain / webhook gate 等 (= dev claude 領域)
- JPYC 株式会社の業務 (= 我々は加盟店 onboarding 仲介、 JPYC 自体の運用は JPYC 株式会社が担当)
