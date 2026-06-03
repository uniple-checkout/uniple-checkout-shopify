# 04 — External Systems

外部 system / URL / ID の一覧。 codex は必要時 reference。

## GitHub

| Item | URL |
|---|---|
| Repo | https://github.com/uniple-checkout/uniple-checkout-shopify |
| Org | https://github.com/uniple-checkout |
| Release v0.1.0 | https://github.com/uniple-checkout/uniple-checkout-shopify/releases/tag/v0.1.0 |
| Latest commit on main | `77708ca` |
| Release tag | `v0.1.0` on commit `e325cc5` |

関連 repo (= 同 org 内、 別 plugin):
- https://github.com/uniple-checkout/uniple-checkout-woocommerce (= WC v0.1.2)
- https://github.com/uniple-checkout/uniple-checkout-eccube4 (= EC4 v0.1.1)
- https://github.com/uniple-checkout/uniple-checkout-eccube2 (= EC2 v0.1.1)

## Shopify Partner / Dev Dashboard

| Item | URL / value |
|---|---|
| Partner org | uniple inc. |
| Partner ID | `218108954` |
| Dev Dashboard | https://dev.shopify.com/dashboard/218108954 |
| uniple checkout app | https://dev.shopify.com/dashboard/218108954/apps/362476437505 |
| uniple checkout app client_id | `cdf36943d96d6284bdfa212ee9801b45` |
| uniple checkout app handle | `uniple-checkout` |
| uniple checkout app name | uniple checkout |
| uniple checkout app latest version | `uniple-checkout-29` |
| uniple-min-ca-diag app | (= 別 client_id 経由) |
| uniple-min-ca-diag client_id | `c7c56953953d5f52671b5a3d0c72cda3` |
| uniple-min-ca-diag handle | `uniple-min-ca-diag` |
| uniple-min-ca-diag latest version | `uniple-min-ca-diag-12` (= Hypothesis 4 test 用) |

### Dev stores (= 開発 store)

| Store | URL | 用途 |
|---|---|---|
| uniple-dev | https://uniple-dev.myshopify.com | 初期 audit 用、 install 汚れあり |
| uniple-fresh-diag-20260525 | https://uniple-fresh-diag-20260525.myshopify.com | fresh shop test 用、 Customer Account fully authenticated |

Customer Account URL pattern (= 認証 state):
- Bare direct URL (= unauthenticated): `https://shopify.com/<store_id>/account/orders/<id>` で直接 access (= Block extension は render しない仕様)
- Authenticated: customer login 後の `/account/orders/<id>` (= Block extension が render される条件、 ただし uniple app は依然 silent disable)
- uniple-fresh-diag-20260525 の store ID: `100361404730`

## Community thread

| Item | URL |
|---|---|
| Thread | https://community.shopify.dev/t/customer-account-ui-extension-static-target-not-invoked-for-embedded-app-works-for-extension-only-app-on-same-dev-shop/34643 |
| 内容 | 4 仮説 verify 結果 + app handles + Partner ID + test shop、 Shopify staff escalation 待ち |
| 投稿日 | 2026-05-26 |
| 反応 | 2026-06-04 時点で未受領 (= 確認時に再 fetch 推奨) |

## Remote agent (= Payments Apps API reopen watcher)

| Item | value |
|---|---|
| Routine name | "Shopify Payments Apps API reopening watcher" |
| Routine ID | `trig_01DLNKXvX9roiS57wAttYuXM` |
| Web URL | https://claude.ai/code/routines/trig_01DLNKXvX9roiS57wAttYuXM |
| Cron | `0 1 * * *` (= daily 01:00 UTC = 10:00 JST) |
| Environment | `env_01SRoJbt1zNXAojn2nr27wbd` |
| Model | claude-sonnet-4-6 |
| Enabled | true |
| 動作 | Shopify Changelog + Developer Changelog を WebFetch + WebSearch fallback で取得、 keywords (= Payments Apps / PPP / stablecoin / JPYC / applications reopen) で grep、 match 時 ALERT 通知 |

codex は watcher 状態確認時に `RemoteTrigger` tool (= claude API) で `{action: "get", trigger_id: "trig_01DLNKXvX9roiS57wAttYuXM"}` で取得可。

## uniple infra (= dev claude 領域)

| Item | URL / value |
|---|---|
| uniple 公式 site | https://uniple.io |
| dev 環境 | https://dev.uniple.io |
| Shopify plugin 用 backend | https://shopify.uniple.io (= app_url / app_proxy 先) |
| 加盟店申請 form | https://forms.gle/b8kwVZeynA1ffV8j6 |
| sender email | support@uniple.io |

shopify.uniple.io の reverse proxy 構成:
- Cloudflare DNS + Cloudflare Origin Cert
- nginx (= EC2 18.182.62.104 上)
- proxy_pass http://127.0.0.1:8002 (= dev 環境では react-router dev、 production は別構成)
- 詳細は dev claude 領域 ([[reference_uniple_demo_subdomains]] memory 参照)

## API credentials (= per-shop ShopSettings)

DB: SQLite `prisma/dev.sqlite` の `ShopSettings` table (= 開発環境)

各 record:
- `shop`: `<shop>.myshopify.com`
- `apiBaseUrl`: `https://dev.uniple.io` (= dev mode、 production は `https://uniple.io`)
- `apiKey`: `ums_*` prefix の 68 文字 token (= uniple 側 merchant 個別発行)
- `webhookSecret`: 64 文字 hex (= HMAC-SHA256 検証用)
- `merchantLabel`: 表示用 label
- `mode`: `test` / `live`

⚠️ Secret 直書き禁止: 過去 chat / docs / code に api key / webhook secret の literal 値を含めない。 D user に相談 file (= `~/.rollback/uniple-shopify-merchantsite-credentials-20260514.md` 等) 経由で別途 relay。

## Shopify Partner Support 履歴

2026-05-26 chat 履歴 (= D user 経由):
- 問い合わせ: Payments Apps API access 申請したい
- 回答: 「Payments Partner Platform (PPP) は現在 invitation-only、 新規 application 受付なし、 Shopify 直接接触企業のみ参加可、 再開時は Shopify Changelog / Developer Changelog で告知」
- product team feedback form を案内されたが、 D user で feedback 投稿は未実施 (= 任意 task として残置)

## Payments Apps V2 関連 docs (= future Path B 再構築用 reference)

- https://shopify.dev/docs/api/payments-apps/latest
- https://shopify.dev/docs/apps/build/payments
- https://shopify.dev/docs/apps/build/payments/requirements
- https://shopify.dev/docs/apps/build/payments/payments-extension-review
- https://shopify.dev/docs/apps/launch/shopify-app-store/app-store-requirements (= Section 5.2 + 5.11)
- https://shopify.dev/docs/apps/build/blockchain
- https://shopify.engineering/commerce-payments-protocol

## docs/handoff/ 内 cross reference

- 設計判断の根拠 → `02-key-decisions.md`
- audit 詳細 → `03-audit-findings.md`
- 残作業 → `05-pending-tasks.md`
- 議論再開手順 → `07-resume-instructions.md`
