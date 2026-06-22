# uniple checkout for Shopify v{{VERSION}}

## Highlights

- Manual Payment + 注文確認 email + App Proxy redirect pattern
- Email-only design: customer 動線は注文確認 email の `JPYC のお支払いに進む` button のみ
- JPYC 日本円ステーブルコイン / 電子決済手段 payment integration
- Custom Distribution install link は加盟店申請 form 経由で個別発行

## Supported environments

| Component | Version |
|---|---|
| Shopify | Basic 以上 |
| Node.js | 20.19+ / 22.12+ |
| Distribution | Shopify Custom Distribution |

## Installation

This app is not distributed through the Shopify App Store.

1. Submit the merchant application form: https://forms.gle/b8kwVZeynA1ffV8j6
2. uniple issues a shop-specific Custom Distribution install link after approval.
3. Install the app from the link and configure API credentials in Shopify admin.
4. Add the manual payment method and Order Confirmation email Liquid snippet.

Detailed setup: `docs/merchant-integration-spec.md`

## Checksums

Shopify install is OAuth-based, so no plugin zip is required for merchant install.
If source/docs archives are attached to this GitHub release, see `SHA256SUMS`.

## Support

- Merchant application: https://forms.gle/b8kwVZeynA1ffV8j6
- Bug reports / questions: support@uniple.io
- Security reports: support@uniple.io
