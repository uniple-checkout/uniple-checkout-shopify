# 03 — Audit Findings (= Block extension 不可問題の技術的 evidence)

累積 29 deploy + minimal app A/B audit + community escalation の summary。 codex は **「Block extension は dev shop で動かない」 が前提**で議論を進めて OK。 ただし真因は app-level config に絞り込まれたが完全解明されていない (= 内部 log access が必要)。

## 問題の発生

uniple checkout app v16-v23 で 以下 target が一切 render しなかった:
- `purchase.thank-you.block.render` (= Thank you page)
- `customer-account.order-status.block.render` (= Customer Account Order Status page)

bundle は CDN から 200 OK で fetch される (= 確認済) が、 host が handler を invoke しない silent fail。

## Phase 1 audit (= v16-v23)

各 deploy 試行と結果:

| Version | 試行 | 結果 |
|---|---|---|
| v16 | diagnostic console.log 追加 | log 出ない |
| v17 | network_access gate hit (= draft 残り) | n/a |
| v18 | network_access + loading banner | banner 出ない |
| v19 | static target `customer-account.order-status.payment-details.render-after` 追加 (= 配置不要) | static も出ない |
| v20 | no-op deploy (= force-sync 試行) | 効果なし |
| v21 | AppDistribution.SingleMerchant explicit + api_version 2026-01 | 効果なし |
| v22 | production-ready (= Block 補助化、 静かに fail) | render 0 (= production fix 一旦確定だった) |
| v23 | JSX preact fix (= bundle 内 `react/jsx-runtime` 削除確認) | 効果なし |

D user 直感 = 「fresh shop で試したら？」 → Phase 2 audit へ。

## Phase 2 audit = fresh dev shop (2026-05-25)

新 shop `uniple-fresh-diag-20260525.myshopify.com` 作成 + clean install + 全 config 完備:
- 商品作成 + Manual Payment 追加 + Liquid snippet 貼り込み + Block 配置 + Publish
- v23 uniple checkout app install

**結果**: Block render 0 (= uniple-dev shop の install 汚れ仮説否定)。 D user 「plugin 側不備かも？」 → codex 全 audit。

## Phase 3 audit = plugin audit + JSX fix (2026-05-25)

codex で plugin の徹底 audit (= JSX transform / network_access / api_version / SingleMerchant / metafields / scopes / capabilities) を実施。 1 件 deficient 発見:

**JSX transform 設定漏れ**: `tsconfig.json` に `jsxImportSource: "preact"` がなく、 React JSX runtime が bundle に混入していた → preact 用 fix 適用、 v23 で deploy。 ただし **fresh shop でも block render 復活せず** = JSX fix は必要だったが不十分。

## Phase 4 audit = T minimal app comparison (2026-05-25)

別 app (= `uniple-min-ca-diag`、 client_id `c7c56953953d5f52671b5a3d0c72cda3`、 extension-only、 no backend、 no scopes、 jsxImportSource preact) を作成 + 同 fresh shop に install。

**Static target test**:
- minimal app + `customer-account.order-status.payment-details.render-after` = ✓ render (= 赤 banner 「MINIMAL TEST: customer-account UI extension host invoke OK」 表示)
- → **Shopify dev shop platform は正常、 minimal app の customer-account UI extension は機能する**
- → **uniple checkout app 固有差分が host invoke blocking している**

## Phase 5 audit = A/B 段階追加 = Step A-G (2026-05-25)

minimal app に uniple checkout app の差分を 1 つずつ追加して、 static target が壊れる瞬間を特定する作戦。

| Step | 追加内容 | 結果 |
|---|---|---|
| Step A | `customer-account.order-status.block.render` target 追加 + editor 配置 + Publish | static は出る、 block は出ない = **block target は dev env で render しない確定** (= app 無関係の Shopify 制約) |
| Step B | metafields × 3 (uniple/checkout_url/session_id/status) | not cause |
| Step C | access_scopes `read_orders,write_orders` | not cause |
| Step D | mandatory webhooks (= app/uninstalled + app/scopes_update) | not cause |
| Step D' | orders/* webhooks (= PCD 必要、 Step F 後に追加) | not cause |
| Step E | app_proxy 宣言 (= unique subpath `minimal-diag`) | not cause |
| Step F | PCD 承認設定 (= Partner Dashboard で 「下書き」 状態に) | not cause |
| Step G-1 | network_access = true capability | not cause |
| Step G-2 | orders/* webhooks (= PCD 承認後 再 declare) | not cause |
| Step G-3 | `purchase.thank-you.block.render` target 追加 (= 3-target 構成) | not cause |

→ **9 候補全部否定**。 残差分 = backend / runtime 系 (= application_url / 実 backend / AppDistribution explicit in code / webhooks api_version / Partner Dashboard 設定)。

## Phase 6 audit = 真因絞り込み (2026-05-25 〜 26)

### v24: 既存 uid を static target に swap
uniple checkout app の `customer-account.order-status.block.render` → `customer-account.order-status.payment-details.render-after` (= static) に変更、 module file 内容は変更なし。

**結果**: fresh shop で **uniple v24 banner も render しない**。 = target 選択ではなく app-level cause 確定強化。

### v25: 新 uid で別 extension 追加
既存 uid `9414993e-...` の cache 仮説を否定するため、 新 uid `a1b2c3d4-...` で extension `uniple-static-diag` を同 uniple checkout app 内に追加 (= static-only)。

**結果**: 新 uid でも render しない。 = uid cache でもなく **uniple checkout app の app-level cause 確定**。

### v26: application_url swap (= invasive 実験)
uniple checkout app の `application_url` を 一時的に `https://shopify.dev/apps/default-app-home` に変更 (= 実 backend と切離してテスト)。

**結果**: 依然 render しない。 = **application_url も真因ではない**。 即 v27 で restore。

### v28: Hypothesis 4 (= community member 推奨) = 別 target test
community thread reply で提案された hypothesis 4 = 「別 target (`customer-account.order-index.block.render` + `customer-account.profile.block.render`) で test」 を minimal + uniple 両 app に追加。

**結果**:
- minimal app + order-index target on `/account/orders` page = ✓ render
- minimal app + profile target = 要 editor placement のため別 case
- **uniple checkout app + order-index target = ✗ render しない**
- = uniple app の customer-account UI extension が **target を越えて全て silent disable** されている確定

## 真因の最終結論 (= 2026-06-04 時点)

確定: **uniple checkout app の app-level config が customer-account UI extension の host invoke を target を越えて全て silent disable している**。

残候補 (= 我々の audit では完全特定できず、 内部 log access 必要):
1. `application_url` (= v26 test で否定済、 でも単独試行のみ。 backend が動いていることが重要かも)
2. `AppDistribution.SingleMerchant` explicit in `app/shopify.server.ts` (= ただし Partner Dashboard 側 distribution と同じ)
3. embedded backend 自体の存在 (= minimal は extension-only でこの差が大)
4. webhooks api_version 2025-10 vs minimal の 2026-07
5. Partner Dashboard 累積 state (= 過去の AppDistribution 変更経験など)

## 結論への影響

決定 4 (= Email-only design 確定) と 決定 5 (= App Store 申請断念 + A2 採択) はこの audit 結論に基づく。

community thread に escalation 投稿済 (= 2026-05-26)、 Shopify staff 内部 log 確認で真因解明可能性あり。 ただし反応待ち長期、 公開 path は email-only で確定実施済。

## codex への注意

- **「block extension を render させる」 ことに時間を割かない** (= 我々で解決不可、 内部 log 必要)
- **email-only design が production 動線として確定**、 議論再開時は前提として扱う
- もし Shopify staff 回答が来て真因確定したら、 その時 Block 復活を検討する (= ただし「公式に unsupported」 = `customer-account.order-status.block.render` target も unsupported docs 上明記、 復活しても block target は将来 deprecate 可能性)
- 詳細な過去 deploy ログは git log で参照可能 (= ただし v24-v28 等の audit 用 deploy 自体は git に残らない、 deploy 履歴は Shopify Partner Dashboard Versions tab で確認)
