# Merchant integration spec - uniple checkout for Shopify

Status: v0.2.0 email-only design / Custom Distribution merchant onboarding.

この document は Shopify 加盟店が `uniple checkout` を install し、JPYC 支払いを
受け付けるための integration spec です。現在の公開経路は Custom Distribution です。
App Store / Payments Apps path の準備メモは `docs/app-store-submission-plan.md` に分離します。

## 1. 概要

`uniple checkout for Shopify` は、Shopify merchant に JPYC
日本円ステーブルコイン（電子決済手段）支払いを提供する Shopify app です。

Shopify checkout では手動の決済方法 `uniple checkout (JPYC)` を追加し、注文作成後
の注文確認 email から uniple checkout hosted payment page に遷移します。customer が
JPYC を送金すると、uniple から app に signed webhook が届き、app が Shopify Admin
API の `orderMarkAsPaid` で order を paid 化します。

Customer entry point は注文確認 email の `JPYC のお支払いに進む` button のみです (=
email-only design 採択、 2026-05-26 確定)。Thank you page / Customer Account Order
Status page には支払い button を表示しません。

## 2. 対応 plan

- 動作確認対象: Shopify Basic 以上。
- Shopify Payments 対応 plan の merchant は、既存の Shopify Payments 設定を維持しつつ、
  `uniple checkout (JPYC)` を手動の決済方法として併用設定します。
- 現 MVP は Shopify Payments Platform / Payments App Extension ではなく、Shopify manual
  payment + uniple webhook confirmation 方式です。
- app scope は `read_orders, write_orders` のみです。`write_products` は要求しません。

## 3. Install 手順

### 3.1 Custom Distribution install

1. [uniple 加盟店申請 form](https://forms.gle/b8kwVZeynA1ffV8j6) から申請します。
2. uniple から受領した Custom Distribution install link を開きます。
3. install 先 Shopify shop を選択します。
4. requested scopes `read_orders, write_orders` を確認して承認します。
5. Shopify admin の `Apps -> uniple checkout` を開きます。
6. [4. 設定 (Setup)](#4-設定-setup) に進みます。

API key / webhook secret は install link では共有しません。加盟店申請承認後に別経路で
発行されます。

## 4. 設定 (Setup)

### 4.1 uniple 加盟店申請

加盟店は以下の form から uniple 加盟店申請を行います。

https://forms.gle/b8kwVZeynA1ffV8j6

承認後、uniple から以下を受領します。

- `apiKey`
- `webhookSecret`
- `mode`: `test` または `live`
- API base URL:
  - test: `https://dev.uniple.io`
  - live: `https://uniple.io`

### 4.2 app 内 settings page で credentials 保存

Shopify admin:

1. `Apps -> uniple checkout` を開きます。
2. `Settings` を開きます。
3. API base URL、merchant label、mode、API key、webhook secret を入力します。
4. `Save settings` をクリックします。
5. app home の setup status が `Ready` になっていることを確認します。

app home は `ShopSettings` に `apiBaseUrl`, `apiKey`, `webhookSecret` が揃っている場合に
`Ready` と表示します。settings page の UI polish / onboarding copy は backlog として
継続改善します。

### 4.3 手動の決済方法を追加

Shopify admin:

1. `設定 -> 決済` を開きます。
2. `手動の決済方法を追加` を選択します。
3. `カスタム決済方法を作成` を選択します。
4. name:

```text
uniple checkout (JPYC)
```

5. 支払い手順 text:

```text
注文確認メールの「JPYC のお支払いに進む」ボタンから、uniple checkout で JPYC をお支払いください。お支払い完了後、注文ステータスは自動で更新されます。
```

6. 手動の決済方法を有効化します。

### 4.4 注文確認 email に Liquid snippet を追加

Shopify admin:

1. `設定 -> 通知` を開きます。
2. `注文の確認` を開きます。
3. `コードを編集` をクリックします。
4. `{{ email_body }}` を探します。
5. 以下の snippet を `{{ email_body }}` の直後に貼り込みます。
6. 保存します。

```liquid
{% comment %}
uniple checkout (JPYC) payment CTA.
Place this immediately after {{ email_body }} in the Order confirmation notification.
{% endcomment %}
{% assign uniple_gateway_selected = false %}
{% for gateway in payment_gateway_names %}
  {% assign gateway_name = gateway | downcase %}
  {% if gateway_name contains 'uniple' or gateway_name contains 'jpyc' %}
    {% assign uniple_gateway_selected = true %}
  {% endif %}
{% endfor %}

{% assign uniple_order_pending = false %}
{% if financial_status == 'pending' %}
  {% assign uniple_order_pending = true %}
{% endif %}

{% assign uniple_pay_url = '' %}
{% if shop.permanent_domain and id %}
  {% assign uniple_pay_url = 'https://' | append: shop.permanent_domain | append: '/apps/uniple-pay-link?orderId=' | append: id %}
{% endif %}
{% if uniple_gateway_selected and uniple_order_pending and uniple_pay_url != blank %}
<table class="row section">
  <tr>
    <td class="section__cell">
      <center>
        <table class="container">
          <tr>
            <td>
              <h3>JPYC のお支払い</h3>
              <p>
                JPYC は日本円ステーブルコイン（電子決済手段）です。以下のボタンから
                uniple checkout を開き、JPYC でお支払いください。
              </p>
              <table class="row actions">
                <tr>
                  <td class="actions__cell">
                    <table class="button main-action-cell">
                      <tr>
                        <td class="button__cell" style="background: #16449A; border-radius: 4px;">
                          <a href="{{ uniple_pay_url }}" class="button__text" style="background: #16449A; border-color: #16449A; color: #ffffff;">
                            JPYC のお支払いに進む
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="font-size: 12px; color: #6d7175;">
                お支払い完了後、Shopify の注文ステータスは自動で更新されます。
              </p>
            </td>
          </tr>
        </table>
      </center>
    </td>
  </tr>
</table>
{% endif %}
```

App Proxy URL (`/apps/uniple-pay-link`) が唯一の customer payment link です。
`orders/create` webhook の session 作成が email 生成時点でまだ完了していない場合でも、
customer click 時に lazy create して uniple checkout に redirect できます。

## 5. 動作 flow (customer 視点)

1. customer が Shopify storefront で商品を購入します。
2. checkout で `uniple checkout (JPYC)` を選択します。
3. 注文が作成され、Shopify order は pending payment status になります。
4. customer が注文確認 email を受信します。
5. email の `JPYC のお支払いに進む` button をクリックします。
6. uniple checkout 画面に遷移します。
   - test mode: `https://dev.uniple.io/checkout/<sessionId>`
   - live mode: `https://uniple.io/checkout/<sessionId>`
7. wallet を接続し、JPYC を送金します。
8. uniple checkout の支払い完了画面が表示されます。
9. Shopify Order Status page に redirect されます。
10. uniple webhook により Shopify order が paid 化され、Order Status page で
    `Confirmed` / paid state を確認できます。

## 6. Email-only design (= 採用方針)

uniple checkout for Shopify は **email-only design** を採択しています。
Customer は注文確認 email の link からのみ支払い画面に遷移します。

Thank you page / Customer Account Order Status page には支払い link を表示しません。
Shopify UI extension 制約により、確実に customer に届く注文確認 email 経路に集中します。
この方針に合わせて、Block extension は app bundle から削除済みです。

### Customer 動線
- Customer は注文確認 email の **「JPYC のお支払いに進む」 button** から uniple checkout に遷移します。
- 支払い完了後は uniple checkout 側「支払い完了」 表示 + 自動 redirect で Shopify Order Status page に戻ります。
- Order Status page では Shopify 標準の `Confirmed` / `paid` 表示で支払い状態を確認できます。

### Optional: customer 向け補助 channel
加盟店が独自で customer 通知を強化したい場合は、 [7. Optional: 「お支払い受領」 customer email 自動送信](#7-optional-お支払い受領-customer-email-自動送信)
の path (= Shopify Flow + Klaviyo / 自社 SMTP 等) を採用できます。 uniple plugin は最小限の payment
integration と webhook confirmation を提供し、 加盟店の email automation 選択肢を制約しません。

## 7. Optional: 「お支払い受領」 customer email 自動送信

Shopify manual payment + `orderMarkAsPaid` flow では、customer 向けの
`payment received` email が Shopify native で必ず自動送信されるわけではありません。

加盟店が支払い受領 email を追加したい場合は、加盟店側で以下を設定します。

- Shopify Flow + Klaviyo: production 推奨。利用可否は加盟店 plan と installed app に依存します。
- Shopify Flow + HTTP request -> 加盟店 own SMTP / email service: 自由度が高く、sender domain
  と template を加盟店が管理できます。
- Shopify Flow Email action 単体: staff 向け通知であり、customer 向け送信には不足します。
  customer email には Klaviyo 等の third-party app が必要です。

uniple は payment integration と webhook confirmation を提供します。customer notification
policy、sender domain、email automation は加盟店管理です。

## 8. 運用メモ

app side records:

- `ShopSettings`: shop-level API base URL、API key、webhook secret、merchant label、mode。
- `OrderMapping`: Shopify order ID、uniple session ID、amount、status、tx hash、payer、
  retry count、processed webhook event IDs。

important routes:

- `/webhooks/orders/create`: pending manual payment order の uniple checkout session 作成。
- `/apps/uniple-pay-link`: 注文確認 email button から使う App Proxy endpoint (= primary customer entry)。
- `/webhooks/uniple`: signed uniple webhook receiver。
- `/api/uniple-return`: uniple checkout completion 後の return handler。

expected lifecycle:

1. Shopify order が pending で作成されます。
2. `OrderMapping.status = pending` になります。
3. uniple が `checkout.session.completed` webhook を送信します。
4. app が HMAC signature を検証し、Shopify `orderMarkAsPaid` を実行します。
5. `OrderMapping.status = paid` になります。

Shopify mutation が失敗した場合、mapping は `paid_pending` となり、`lastError` と
`retryCount` で follow-up します。

## 9. Troubleshooting FAQ

### email button が出ない

以下を確認します。

- Liquid snippet が `注文の確認` notification の `{{ email_body }}` 直後に貼られている。
- order が `uniple checkout (JPYC)` の手動決済で作成されている。
- Shopify financial status が `pending`。
- payment method name に `uniple` または `JPYC` が含まれている。

### 支払い後 Shopify side で paid 化されない

以下を確認します。

- uniple webhook が `/webhooks/uniple` に着弾している。
- webhook signature verification が成功している。
- uniple session に対応する `OrderMapping` が存在する。
- `OrderMapping.status`, `lastError`, `retryCount`。
- Shopify `orderMarkAsPaid` mutation が user errors を返していない。

### Order Status / Thank you page に支払い button が出ない

uniple checkout は **email-only design** を採択しているため、 Order Status / Thank you
page には支払い button を表示しません。Customer entry point は注文確認 email の
「JPYC のお支払いに進む」 button のみです。
詳細は [6. Email-only design](#6-email-only-design--採用方針) を参照してください。

### customer が注文確認 email を見逃した / 削除した

merchant が Shopify admin から注文確認 email を resend してください。customer が
merchant に連絡できない場合は、support@uniple.io への問い合わせで救済します。

### customer paid email が届かない

Shopify manual payment flow では customer-facing payment received email が native で
必ず送信されるわけではありません。[7. Optional: 「お支払い受領」 customer email 自動送信](#7-optional-お支払い受領-customer-email-自動送信)
の merchant-owned automation を設定してください。

## 10. JPYC 表記コンプライアンス

JPYC は以下の表記を使います。

- `JPYC 日本円ステーブルコイン`
- `電子決済手段`
- `日本円ステーブルコイン（電子決済手段）決済`

`暗号資産` 表記は資金決済法上 NG です。merchant site、payment instructions、customer
email、support material でも `日本円ステーブルコイン` / `電子決済手段`
の表記に統一してください。

recommended merchant-facing note:

```text
JPYC は日本円ステーブルコイン（電子決済手段）です。
```

JPYC brand color:

- JPYC Blue: `#16449A`

JPYC logo を使う場合は official assets を改変せず、JPYC logo guidelines に従います。

## 11. 支援 / お問い合わせ

- Support: support@uniple.io
- uniple 加盟店申請: https://forms.gle/b8kwVZeynA1ffV8j6
- GitHub issues: public bug reports / feature requests only

問い合わせ時は以下を添えてください。

- Shopify shop domain
- order name / number
- 支払い時刻の目安
- uniple session ID (分かる場合)
- customer-facing issue の screenshot (必要な場合)

API key、webhook secret、wallet private key、seed phrase は送らないでください。
