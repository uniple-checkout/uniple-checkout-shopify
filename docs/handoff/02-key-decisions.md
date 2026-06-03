# 02 — Key Decisions

時系列に整理した主要意思決定と根拠。 codex は意思決定の前提を理解した上で議論を再開すること。

## 決定 1 — Path A 採択 (2026-05-14)

**判断**: uniple Shopify plugin の初期設計を 「Manual Payment + post-checkout Block extension banner」 (= Path A) で実装する。

**alternative (= 当時の比較対象)**:
- Path B: Shopify Payments Platform / Payments App Extension (= native checkout 内 redirect)。 Plus + Approved Partner 要件、 審査厳格、 MVP 段階で見送り (= 当時の codex 査読 r70)。

**根拠**:
- Plus / 大手 merchant 限定 path を避けて、 Basic merchant でも動く方式を選択
- 4 plugin (= WC / EC4 / EC2 / Shopify) 統一の onboarding 体験

**現在の評価**: Path A の中で 「Block extension primary」 設計が後で破綻 (= 決定 2 で転換)。 ただし 「Manual Payment + email」 自体は最終形に残っている。

## 決定 2 — Path A' (email primary + Block 補助) に転換 (2026-05-24)

**判断**: Block extension を primary 動線にする設計を諦め、 注文確認 email の Liquid snippet button を primary、 Block extension は補助 CTA に格下げ。

**契機**:
- Path A 実装の v16-v21 で `customer-account.order-status.block.render` target が render しない問題が継続
- 6 deploy 試行 (= network_access / capability / install reset 等) でも復活せず
- D user 直感 「根本的に何か間違っている」 → codex web search arch review で Block を primary にする設計の脆さを指摘
- codex 推奨 = Manual Payment は維持、 customer payment entry を 「durable App Proxy pay link in email」 に切替

**実装**: v22 で Liquid snippet (= JPYC blue button #16449A) を Order Confirmation email template に追加。 customer 動線 E2E 確認 (= order #1033 paid 化、 2026-05-24)。

## 決定 3 — Resend impl rollback (= 1A 採択、 2026-05-25)

**判断**: 「Payment received」 customer email を app 側で SES / SendGrid / Resend 等で送信する案 (= 1C standard feature 化) を rollback、 各加盟店が自分の Shopify Flow / Klaviyo / 自社 SMTP で設定する model に確定。

**根拠** (= D user 経営洞察):
- plugin provider と email sender は別 layer
- uniple が Resend を抱えて全加盟店分の email 送る design は scale / 法的 (= GDPR / 特商法 / branding 整合) に NG
- 各 merchant の transactional email が uniple branding で送られる → 加盟店 brand 損なう
- customer 連絡先 list を uniple が握る → privacy risk

**rollback 実施**: `app/lib/email.server.ts` + 関連 test + migration + Resend dep + `.env.example` vars 削除。 DB の `OrderMapping` 27 件は無傷で保持 (= `prisma migrate diff` + `db execute` で SQLite table rebuild)。

## 決定 4 — Email-only design 確定 + Block extension 完全廃止 (2026-05-26)

**判断**: Block extension (= Thank you page / Customer Account Order Status page の補助 CTA banner) を **完全廃止**。 customer 動線は注文確認 email button のみ。

**契機**:
- accumulating 29 deploy + minimal app A/B audit で **block target が dev shop で render しない問題は app-level config 要因**と確定 (= `03-audit-findings.md` 参照)
- 真因は uniple checkout app の app-level config (= application_url / AppDistribution explicit / Partner Dashboard 設定 のいずれか) に絞り込み、 我々で解決不可 (= Shopify 内部 log access が必要、 community thread で escalation 中)
- D user 経営判断 = 「email-only として明示公開、 Block extension 完全廃止」

**実装** (= v29 release):
- 3 extension (= `uniple-thank-you-pay-link` / `uniple-static-diag` / `uniple-other-targets`) 完全削除
- `docs/merchant-integration-spec.md` section 6 を 「Email-only design 採択」 に書換
- `shopify.app.toml` comments update
- README.md / CHANGELOG.md / SECURITY.md / LICENSE.md 整備
- build + test 26/26 + typecheck pass
- `shopify app deploy --allow-updates --allow-deletes` で v29 release

## 決定 5 — App Store 申請断念 → A2 採択 (= Custom Distribution + GitHub public、 2026-05-27)

**判断**: Shopify App Store 申請を放棄。 「Custom Distribution + GitHub public + uniple.io page」 = 「野良 plugin」 path で運用。

**根拠** (= web search で公式 docs 確認):
- 公式 docs section 5.2: 「Payments apps aren't permitted to use any Shopify APIs other than the Payments Apps API」
- 公式 docs section 5.11: 「Don't sell, transfer, or modify fungible tokens unless they are a payment partner」 = cryptocurrency / stablecoin functionality は Payments Partner approval 必須
- 我々の Manual Payment + Liquid + App Proxy pattern は App Store 不適合 = 申請しても reject 確定
- Path B (= Payments Apps V2 / Payments Partner Platform) は invitation-only で application 受付なし (= 2026-05-26 Shopify Partner Support chat で確認)

**代替**: A2 path
- A. Custom Distribution (= 加盟店申請 form 経由 merchant 個別 install link 発行)
- + GitHub public repo (= WC plugin の WP.org / EC4-EC2 GitHub release と並列)
- + uniple.io page で公開 (= 「申請 form 経由」 と案内、 install link 自体は載せない)

**実装** (= 2026-05-27):
- GitHub repo `https://github.com/uniple-checkout/uniple-checkout-shopify` を public で作成 (= D user 操作)
- README / CHANGELOG / SECURITY / LICENSE / .gitignore 全面整備 (= commit `e325cc5`)
- `v0.1.0` tag + GitHub release (= D user 操作、 not pre-release)
- .github/workflows/ Shopify template CI 削除 (= commit `77708ca`、 CI failure mail 停止)

## 決定 6 — Payments Apps API reopen watcher 設置 (2026-05-26)

**判断**: Payments Apps API access の 再開告知を自動 monitoring するため、 Claude Code remote agent を daily cron で稼働させる。

**実装**:
- routine name: "Shopify Payments Apps API reopening watcher"
- cron: `0 1 * * *` (= daily 01:00 UTC = 10:00 JST)
- 動作: WebFetch + WebSearch で Shopify Changelog (= https://changelog.shopify.com/) + Developer Changelog (= https://shopify.dev/changelog) を取得、 keywords (= 「Payments Apps」 / 「PPP」 / 「Payments Partner Platform」 / 「stablecoin」 / 「JPYC」 / 「applications reopen」) で grep、 match 時 ALERT 通知
- routine ID: `trig_01DLNKXvX9roiS57wAttYuXM`
- routine URL: https://claude.ai/code/routines/trig_01DLNKXvX9roiS57wAttYuXM
- model: claude-sonnet-4-6
- enabled: true、 環境 `env_01SRoJbt1zNXAojn2nr27wbd`

**期待**: PPP reopen → application 提出 → 承認 → Path B (= Payments Apps V2) 再実装 → App Store 公開 path 復活、 のロードマップで catch する。

## 決定 7 — community thread escalation 投稿 (2026-05-26)

**判断**: Block extension 不可問題の真因確定のため、 Shopify community thread に検証結果を投稿して Shopify staff の escalation を受ける。

**実装**:
- Thread URL: https://community.shopify.dev/t/customer-account-ui-extension-static-target-not-invoked-for-embedded-app-works-for-extension-only-app-on-same-dev-shop/34643
- 4 仮説 verify 結果 + app handles (= 2 app の client_id) + Partner ID + test shop 名を投稿
- Shopify staff 回答待ち (= 内部 log で真因確定可能性)

**現状**: 投稿済、 反応待ち (= 2026-06-04 時点で公式回答未受領)。

## 意思決定の根底にある D user 経営方針 (= 教訓)

- **完璧主義より動くものを優先** (= Block 不可で何ヶ月も悩むより email-only で公開)
- **multi-merchant model に scale する design** (= uniple が個別 merchant の email infra を抱えない)
- **plugin provider と service provider は別 layer** (= uniple は plugin 提供、 customer notification は merchant 設定)
- **4 plugin の onboarding 体験を統一** (= WC = WP.org、 EC4/EC2 = GitHub、 Shopify = Custom Distribution + GitHub、 全部加盟店申請 form 経由)
- **法令 compliance 最優先** (= JPYC は 「日本円ステーブルコイン」「電子決済手段」 表記、 「暗号資産」 NG)
