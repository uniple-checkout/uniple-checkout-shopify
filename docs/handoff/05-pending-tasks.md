# 05 — Pending Tasks

優先度順の残作業。 codex は議論再開時にこれを上から処理 / D user 判断仰ぐ。

## P0 (= 公開動線完成のため必須)

### 1. dev claude 経由 uniple.io に Shopify plugin page 追加

**何を**: 既存 uniple.io の plugins page (= WC / EC4 / EC2 への link あり) に Shopify plugin 情報を追加。

**担当**: D user が dev claude (= 別 chat) に paste して依頼、 dev claude が uniple.io 本体を更新。

**paste 内容** (= codex は D user に paste 用 text を提示する):

```
【checkout claude → dev claude】 uniple.io に Shopify plugin page 追加依頼

2026-05-27、 Shopify plugin v0.1.0 を GitHub public release 完成。 既存 uniple.io の
plugins page に Shopify plugin の情報を追加お願いします。

追加内容:
- plugin 名: uniple checkout for Shopify
- GitHub repo: https://github.com/uniple-checkout/uniple-checkout-shopify
- GitHub release: https://github.com/uniple-checkout/uniple-checkout-shopify/releases/tag/v0.1.0
- 配布方法: Custom Distribution (= Shopify App Store 公開なし、 加盟店申請 form 経由で
  uniple 個別発行 install link)
- 加盟店申請 form: https://forms.gle/b8kwVZeynA1ffV8j6
- 説明文: 「JPYC (日本円ステーブルコイン / 電子決済手段) を Shopify store で受け
  付けられる Custom Distribution plugin。 Customer は注文確認 email の 『JPYC のお
  支払いに進む』 button から uniple checkout で支払い完了。」
- License: GPLv2 or later

uniple.io page の layout は既存 WC / EC4 / EC2 page と一貫させてください。 install
link は page では発行せず 「加盟店申請 → uniple から個別 install link をメールでお
送りします」 と明記。

詳細: [[project_shopify_path_a_prime_completion]] memory 参照。
```

**状態**: D user 未送付。 codex は引き継ぎ後に「dev claude へ paste しましたか？」 と確認推奨。

## P1 (= 監視 + 受動的 task)

### 2. community thread の Shopify staff 反応 catch

**何を**: 投稿済 thread (= https://community.shopify.dev/t/.../34643) に Shopify staff からの reply / DM 要求が来ているか定期確認。

**頻度**: 週 1-2 回 程度 (= D user か codex が WebFetch で thread 状態確認)。

**反応あった場合の action**:
- 内部 log 共有依頼が来たら → app handles (= 既存 docs に記載) + 詳細 reproduction step を提供
- 真因確定 → Block extension 復活検討 (= ただし `customer-account.order-status.block.render` が公式 unsupported なので static target に変更する path 探索)

### 3. Payments Apps API reopen watcher の動作確認 + alert catch

**何を**: `trig_01DLNKXvX9roiS57wAttYuXM` watcher が daily 動作しているか定期確認、 ALERT 来たら即対応。

**頻度**: 月 1 回 程度 (= 通常は silent 動作、 hit したら通知)。

**ALERT 来た場合の action**:
- changelog entry の内容を read
- D user に報告 + Path B 再開可否判断 → 申請 path 再起動
- 申請手順は 既存 `docs/app-store-submission-plan.md` 参照可

## P2 (= optional / 余裕あれば)

### 4. Shopify Product Feedback form 投稿

**何を**: 2026-05-26 Partner Support chat で案内された 「product team feedback form」 に JPYC use case + Payments Apps API reopen 要望を投稿。

**目的**: PPP reopen の demand 表明 (= 我々の case を Shopify 内部で record)。

**状態**: D user 未投稿。 codex は引き継ぎ後に着手判断仰ぐ。

### 5. uniple.io page 公開後の SEO / discoverability

**何を**:
- GitHub repo + uniple.io page を press release / 加盟店向け案内 / social 等で告知
- community thread に「uniple checkout for Shopify v0.1.0 公開しました」 と告知 (= 別 reply)

**頻度**: 1 回完了型。 timing は D user 判断 (= 急がない)。

### 6. Phase 2 docs 拡充 (= 将来余裕あれば)

- Block extension audit findings の technical writeup を blog / Medium 等で公開 (= community thread 同等の evidence、 future Shopify dev に役立つ可能性)
- Path B 再構築 plan の詳細化 (= Payments Apps V2 integration sketch、 reopen 後 即着手できる準備)

## 完了済 (= 参考、 codex 再実施不要)

- [x] v29 Shopify dev dashboard release (= 2026-05-26)
- [x] community thread 4 仮説 verify 投稿 (= 2026-05-26)
- [x] Payments Apps API reopen watcher 設置 (= 2026-05-26)
- [x] GitHub repo create + push + tag + release v0.1.0 (= 2026-05-27)
- [x] CI workflow cleanup (= 2026-05-27 commit `77708ca`)
- [x] memory final update (= claude memory 反映済)

## 完了済 (= D user 任意判断で done 扱い)

- [-] Partner Dashboard で sample install link 生成 → **不要 / skip 判断** (= per-merchant 都度生成、 sample は無効 link になる)
- [-] App icon 1024x1024 / Screenshots / App listing 説明文等 → **App Store 申請断念で不要**
- [-] Resend impl → **rollback 済** (= 各加盟店が自分の email automation 設定)

## 議論再開時の優先順位 (= codex への指示)

1. **P0 task #1** (= dev claude 依頼 paste の進行確認) を最初に確認
2. もし D user が新規 task 指示済ならそれを優先
3. P1 / P2 は D user 判断仰ぐ (= 「community 確認しますか？」 「watcher 状態見ますか？」)
4. 完了済 task は再実施しない (= 重複作業避ける)
