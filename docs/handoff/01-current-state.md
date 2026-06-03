# 01 — Current State

最終更新時点 = 2026-06-04

## Repo state

- **Local repo**: `/home/ubuntu/uniple-checkout-shopify/`
- **Branch**: `main`
- **Remote**: `https://github.com/uniple-checkout/uniple-checkout-shopify.git` (= public)
- **Latest commit on main**: `77708ca` (= `chore: remove Shopify template CI workflows and Shopify-specific .github files`)
- **Release tag**: `v0.1.0` on commit `e325cc5` (= 1 つ前の commit、 `chore: prepare v0.1.0 for public GitHub release`)
- **Release URL**: https://github.com/uniple-checkout/uniple-checkout-shopify/releases/tag/v0.1.0
- **GitHub Actions**: なし (= .github/workflows/ 全削除済、 CI failure mail も停止)

## Shopify dev dashboard state

- **App name**: uniple checkout
- **client_id**: `cdf36943d96d6284bdfa212ee9801b45`
- **Partner ID**: `218108954` (= uniple inc.)
- **App URL**: https://dev.shopify.com/dashboard/218108954/apps/362476437505
- **Distribution method**: Custom Distribution
- **Latest active version**: `uniple-checkout-29` (= 「v29 email-only: UI extensions removed, email primary design finalized」)
- **embedded**: true
- **application_url**: `https://shopify.uniple.io`
- **scopes**: `read_orders, write_orders`
- **app_proxy**: `https://shopify.uniple.io/apps/uniple-pay-link`
- **webhooks**: `app/uninstalled`, `app/scopes_update`, `orders/create`, `orders/cancelled`
- **Network access (UI extensions)**: Granted ✓
- **PCD (Protected Customer Data)**: 下書き (= Draft、 dev shop で動作確認用、 production review 別)
- **UI extensions**: なし (= v29 で完全削除、 過去 v22 まで `uniple-thank-you-pay-link` 等 3 個存在したが email-only design 確定で全削除)

## Production code architecture (= 動作中の path)

| Path | 説明 |
|---|---|
| `app/routes/app._index.tsx` | merchant welcome page (= ShopSettings 完備 check → Ready/Setup required 表示) |
| `app/routes/app.settings.tsx` | merchant 用 credentials 入力 form (= apiBaseUrl / apiKey / webhookSecret / mode) |
| `app/routes/webhooks.orders.create.tsx` | Shopify orders/create 受信 → uniple session 作成 → metafield 書込 |
| `app/routes/webhooks.uniple.tsx` | uniple webhook 受信 (= completed → orderMarkAsPaid、 expired → OrderMapping cleanup) |
| `app/routes/apps.uniple-pay-link.tsx` | App Proxy endpoint (= customer email button → uniple session URL に redirect、 lazy create も対応) |
| `app/routes/api.uniple-return.tsx` | uniple checkout 完了後の return handler (= Shopify `Order.statusPageUrl` 3-tier fallback redirect) |
| `app/lib/uniple-client.server.ts` | uniple API client (= session create / status query) |
| `app/lib/uniple-checkout-url.server.ts` | uniple checkout URL helper (= `ShopSettings.apiBaseUrl` ベース、 hardcode 削除済) |
| `app/lib/shopify-metafields.server.ts` | order metafield 書込 helper |
| `prisma/schema.prisma` | DB schema (= ShopSettings + OrderMapping + Session) |

## Documentation 状態

| File | 内容 |
|---|---|
| `README.md` | 概要 / install / setup / email-only design / 関連 plugin / License / Trademark |
| `LICENSE.md` | GPLv2+ + uniple inc. copyright |
| `CHANGELOG.md` | v0.1.0 entry + Unreleased section |
| `SECURITY.md` | 脆弱性報告 path + remediation targets + supported versions |
| `docs/merchant-integration-spec.md` | merchant install + setup 詳細、 email-only design 採択 section、 Block extension 不採用経緯 |
| `docs/app-store-submission-plan.md` | 将来 Payments Apps API 再開時の App Store 申請計画 |
| `docs/release-process.md` | GitHub release 手順 |
| `docs/release-template.md` | release notes template |
| `docs/app-store/*` | App Store listing 用 assets draft (= codex 過去作成、 申請不可確定後は保留) |
| `docs/handoff/*` | 本 handoff 一式 (= 引き継ぎ後 codex はこれを最初に読む) |

## Test + typecheck state

- `npm test`: 6 files / 26 tests pass
- `npm run typecheck`: pass
- `shopify app build`: success (= extensions 0、 bundle size 0、 build artifact なし)
- 最終確認時点 = `77708ca` commit 後

## DB state (= 開発環境 SQLite)

- `prisma/dev.sqlite` (= .gitignore で除外)
- ShopSettings: 2 件 (= `uniple-dev.myshopify.com` + `uniple-fresh-diag-20260525.myshopify.com`)
- Session: 2 件
- OrderMapping: 累積 50+ 件 (= 開発中の test order 全部含む)
- 過去 backup: `backups/shopify-reinstall/2026-05-24T10-57-00-908Z/` (= .gitignore で除外)

## 開発環境

- **Local**: EC2 (= checkout EC2、 18.182.62.104)
- **Working dir**: `/home/ubuntu/uniple-checkout-shopify/`
- **Node**: 22 (= package.json engines 規定)
- **Shopify CLI**: 3.94.3 (= `shopify --version` 確認、 deploy 時最新化推奨)
- **dev server**: react-router dev、 port 8002 (= 過去稼働、 現在停止中)
- **app_proxy host**: shopify.uniple.io (= dev claude 側 nginx + Cloudflare Origin Cert で永続化)

## 公開状態 (= merchant 視点)

- **App Store**: 公開なし
- **Custom Distribution**: 即時可能 (= Partner Dashboard で merchant の shop domain 入力 → 「リンクを生成」 → install URL を merchant に送付)
- **加盟店申請 form**: https://forms.gle/b8kwVZeynA1ffV8j6 (= 既存稼働、 WC/EC4/EC2 と共用)
- **uniple.io plugins page**: WC/EC4/EC2 まで掲載済、 **Shopify は未掲載** (= dev claude 依頼で追加予定)

## 既知の運用前提

- 加盟店 onboarding は **uniple 内部 process** (= form 応募 → 審査 → uniple operator が Partner Dashboard で merchant の shop domain 入力 → install link 生成 → email 送付 → merchant が install + setup)
- merchant が API credentials を Settings page で入力するまで **app は動作しない** (= ShopSettings 不在 → Ready 表示にならない)
- Manual Payment 「uniple checkout (JPYC)」 は merchant が手動で **設定 → 決済 → 手動の決済方法** に追加する必要あり
- Liquid snippet は merchant が手動で **設定 → 通知 → 注文の確認** に貼り込む必要あり (= snippet 内容は `docs/merchant-integration-spec.md` に記載)
- v29 release 後の test order (= fresh shop or uniple-dev shop) で全 flow 動作確認済 = order #1033 paid 化確認実績 (= 2026-05-24)
