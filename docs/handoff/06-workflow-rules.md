# 06 — Workflow Rules

D user / claude / codex の collaboration rules。 codex が引き継ぎ後に守るべき conventions。

## 役割分担 (= 既存 CLAUDE.md ベース)

過去の構成では:

| 区分 | 担当 | 内容 |
|---|---|---|
| **司令塔** | Claude Code | 方針確定 / codex 報告の統合 / production touch gate / memory 更新 / D user とのやりとり |
| **実行** | codex | 実装 / 調査 / 単一ファイル修正 / file 直読み |

引き継ぎ後は codex 単独で **司令塔 + 実行両方** を担う。 D user 一人を相手にする。

## Token 節約方針

- claude session が終了し、 codex に集約された理由 = token 節約
- codex は **長文 dispatch は避け、 短く focused に**
- file 直読みは codex の通常 task として行う (= claude のように 「Bash で file 直読みは避ける」 制約 なし)

## production touch gate (= 重要、 維持)

production touch / deploy / restart / 取り消し不可操作の前は **必ず D user の short YES**を取る。

trigger (= 全部 D user gate 必要):
- `shopify app deploy` (= Shopify dev dashboard 側の新 version release)
- `git push origin main` / `git push origin <tag>` (= GitHub side)
- `systemctl restart` / `sudo` 系
- file 削除 / db schema 変更
- production env vars 変更
- nginx 設定変更 (= dev claude 領域)

operating model:
- D user に「YES/NO?」 直接質問する形でなく、 「これこれをこう変えます、 YES なら deploy します」 と presentation + confirmation
- D user が short YES (= 「YES」「OK」「進めて」 等) で実行
- D user が止めたら即停止

## D user との communication style

D user の特徴:
- 経営判断速い、 直感鋭い (= 過去複数回 「根本的に何か間違っている」 が正解)
- 細部より全体像優先
- 短い質問 + 短い回答を好む
- 同じ質問繰り返す場合は context が伝わっていないサイン (= explanation を再構成する)

codex の responses:
- **短く焦点絞る** (= 長文 walls of text 避ける)
- 「私の推奨は X、 理由は Y」 + 選択肢提示 + 「どうしますか？」 で D user 判断仰ぐ
- ただし D user が「お任せ」 ニュアンスを出したら 自走 OK
- D user の経営判断は 尊重 + 実装 (= 過度に反論しない、 ただし重要 risk は明示)

## tool 使用 conventions

### 既存使用 tool (= 過去 session で多用)

- `Bash` (= file 編集前の read、 shell command、 git 操作)
- `Read` / `Edit` / `Write` (= file 操作、 ただし Write 前は必ず Read 先行)
- `WebFetch` / `WebSearch` (= 公式 docs / community thread 取得、 deferred tool として `ToolSearch select:WebFetch,WebSearch` で読込)
- `RemoteTrigger` (= claude.ai routine 管理、 watcher 確認 / 更新)
- `Skill` (= schedule / update-config 等の skills 起動)

### 避ける tool / 操作

- `shopify app dev` (= local 起動が必要なため避ける、 既に deploy 済の version で動作確認)
- 過去 codex background dispatch (= 本 session で複数回試したが output が空になり信頼性低、 foreground でやる方が確実)
- shopify CLI で 「shopify app generate」 等の interactive prompt (= 過去 D user terminal で実行依頼してきた、 codex 側で自動化不可)

## memory 連携

claude memory (= `/home/ubuntu/.claude/projects/-home-ubuntu/memory/`) の主要 file:

- `MEMORY.md` (= index、 全 memory file への link)
- `project_shopify_path_a_prime_completion.md` (= 本 plugin の最重要 memory、 累積 29 deploy + audit + 全意思決定 反映済)
- `feedback_codex_judgement_default.md` (= codex 査読 → 自走 default の rule)
- `feedback_production_touch_codex_review_default.md` (= production touch gate の rule)
- `feedback_token_saving_codex_default.md` (= token 節約 rule)
- `reference_jpyc_legal_classification.md` (= JPYC 表記 compliance)
- `reference_uniple_servers.md` (= uniple 関連 server 役割分担)
- `project_phase1_github_release.md` (= 4 plugin の Phase 1 release 完了状況)

codex は memory file の直接 read OK (= file 経由で context 取得)。

## relay convention (= claude 間連携)

dev claude / production claude との連携は **D user 経由 paste** が前提:

format:
```
【checkout claude → dev claude】 件名

内容...

参照 memory: [[xxx]]
```

D user が paste して dev claude / production claude に伝達、 反応も D user 経由で paste して戻ってくる。

直接 chat 接続はなし。

## JPYC 表記 compliance (= 重要、 全 communication で守る)

- ✓ 「日本円ステーブルコイン」 / 「Japanese yen stablecoin」
- ✓ 「電子決済手段」 / 「electronic payment instrument」
- ✗ 「暗号資産」 / 「cryptocurrency」 (= 法令違反 risk)

JPYC 株式会社 (= 資金移動業者、 関東財務局長第 00099 号) の登録商標表記:
- 「JPYC」 および JPYC ロゴ → 株式会社 JPYC の登録商標

uniple plugin は 「uniple inc. による非公式配布、 公式認定 / 保証なし」 と明記。

## auto memory 更新

codex は memory 直接更新する場合、 既存 file (= `project_shopify_path_a_prime_completion.md`) に section 追記する form を保つ (= 全部書き換えしない、 timeline 順に追記)。

頻度 = 重要 decision / state change 時のみ (= 毎回更新しない、 token 節約)。

## 最後の確認 ritual (= 議論終了時 推奨)

各 task 完了時、 codex は以下を行う:

1. todo list を update (= TodoWrite で進捗反映)
2. 必要なら memory 追記 (= 重要 decision のみ)
3. 「次は何しますか？」 と D user 判断仰ぐ (= 自走で続けない、 D user 主導性 尊重)
4. 議論終了サインあれば 「お疲れさまでした、 watcher は daily 稼働継続です」 等で締める
