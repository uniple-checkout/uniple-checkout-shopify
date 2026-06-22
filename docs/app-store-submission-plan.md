# App Store submission plan - uniple checkout for Shopify

Status: draft for B path prep. Current production path remains Custom Distribution + email-only design.

This document lists the assets and review notes needed if Shopify App Store / Payments Apps submission becomes available. It is a preparation checklist, not an instruction to submit the current Manual Payment workaround without D user approval.

## 1. Shopify eligibility gate

As of 2026-05-30, Shopify official docs still make payment-app eligibility the critical gate:

- Payment Gateway apps must be authorized through Shopify's application process and built using the Payments API.
- Shopify's payments platform is invitation-only while Shopify continues to build out Payments Apps API access.
- Payments Apps API is available only to approved Payments Partners.

Implication for uniple:

- A path: continue Custom Distribution immediately.
- B path: keep assets and copy ready, but submit only after D user confirms the Shopify route: Payments Partner invitation / Payments Apps access / explicit Shopify guidance.
- If Shopify review requires Payments Apps implementation, reuse these assets for the Payments Partner / payments app review package rather than a standard app listing.

Official references:

- https://shopify.dev/docs/apps/launch/shopify-app-store/app-store-requirements
- https://shopify.dev/docs/apps/build/payments
- https://shopify.dev/docs/apps/build/payments/payments-extension-review
- https://shopify.dev/docs/api/payments-apps/latest

## 2. Asset checklist

Owner: D user unless noted.

- App icon: 1024 x 1024 PNG, uniple logo, no rounded corners baked into the file.
- Screenshots: 5-10 images, recommended 1280 x 800 or Shopify-required dimensions at submission time.
- Privacy Policy URL: official uniple.io URL, D user/legal confirm.
- Terms URL: official uniple.io URL, D user/legal confirm.
- Support email: support@uniple.io.
- Pricing: Free.
- Demo credentials / test shop: prepare only for Shopify review, never include real API key or webhook secret in screenshots.

## 3. Screenshot set

Recommended 6 screenshots:

1. App home: setup status with email-only payment flow.
2. Settings: API base URL, mode, merchant label, masked API key, masked webhook secret.
3. Shopify manual payment method: `uniple checkout (JPYC)` enabled.
4. Order confirmation email: `JPYC のお支払いに進む` button.
5. uniple checkout payment page: JPYC payment screen in test mode.
6. Shopify order status/admin: order paid after uniple webhook.

Rules:

- Do not show secrets, wallet private keys, seed phrases, customer personal data, or real transaction identifiers.
- Keep JPYC wording as `Japanese-yen stablecoin` / `electronic payment instrument` in English and `日本円ステーブルコイン` / `電子決済手段` in Japanese.
- Do not describe JPYC as a different legal category.

## 4. Listing draft - English

App name:

```text
uniple checkout
```

Short description:

```text
Accept JPYC Japanese-yen stablecoin payments through an email-based Shopify order flow.
```

Full description:

```text
uniple checkout lets Shopify merchants accept JPYC, a Japanese-yen stablecoin and electronic payment instrument, using a Manual Payment method and a secure hosted checkout.

Customers select "uniple checkout (JPYC)" at Shopify checkout, receive the Shopify order confirmation email, and open the JPYC payment page from the "Proceed to JPYC payment" button. After payment, uniple sends a signed webhook and the app marks the Shopify order as paid.

The app is designed as an email-only flow. It does not display payment links on the Thank you page or Customer Account Order Status page. This keeps the customer entry point reliable across Shopify themes and account settings.
```

Key benefits:

- Accept JPYC payments for Shopify orders.
- Keep Shopify order status synchronized after signed uniple webhook confirmation.
- Use a clear email-only customer entry point.
- Store merchant credentials in per-shop settings with masked display.
- Support test and live uniple API base URLs.

## 5. Listing draft - Japanese

アプリ名:

```text
uniple checkout
```

短い説明:

```text
Shopify 注文確認メールから JPYC 日本円ステーブルコイン決済を受け付けます。
```

詳細説明:

```text
uniple checkout は、Shopify 加盟店が JPYC 日本円ステーブルコイン（電子決済手段）決済を受け付けるためのアプリです。

Shopify checkout では手動の決済方法「uniple checkout (JPYC)」を選択し、customer は注文確認メールの「JPYC のお支払いに進む」ボタンから uniple checkout の支払い画面に遷移します。支払い完了後、uniple から署名付き webhook が届き、アプリが Shopify order を paid に更新します。

本アプリは email-only design です。Thank you page / Customer Account Order Status page には支払い link を表示せず、確実に customer に届く注文確認メール経路に集中します。
```

主な機能:

- Shopify order 向け JPYC 決済受付。
- uniple 署名付き webhook による Shopify order paid 化。
- 注文確認 email を primary entry point にした明確な customer flow。
- shop ごとの API credentials 保存と masked display。
- test / live API base URL 対応。

## 6. Submission workflow

1. Re-check Shopify payment app eligibility on official docs and Partner Support.
2. Confirm Privacy Policy URL and Terms URL with D user/legal.
3. Export app icon as 1024 x 1024 PNG.
4. Capture screenshots from a clean test shop with fake customer data.
5. Review English/Japanese listing copy for JPYC compliance.
6. Prepare Shopify review instructions:
   - install path
   - test mode credentials
   - manual payment setup
   - order confirmation email snippet
   - test order and JPYC payment walkthrough
7. D user gate: decide whether to submit standard App Store listing, Payments Partner application, or keep Custom Distribution only.

## 7. Current blockers

- Payments Apps / Payments Partner approval is the decisive gate for a canonical Shopify payment app.
- The current A path is a Manual Payment + email-only integration and should be represented exactly as such.
- The app bundle intentionally ships no Shopify UI extensions.
