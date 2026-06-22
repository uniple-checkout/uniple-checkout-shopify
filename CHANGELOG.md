# Changelog

All notable changes to uniple checkout for Shopify will be documented in this file.

このプロジェクトの形式は [Keep a Changelog](https://keepachangelog.com/) に準拠し、
[Semantic Versioning](https://semver.org/) を採用しています。

## [Unreleased]

### Changed

- email-only design をコード・docs・merchant UI copy で明示。
- 注文確認 email の App Proxy link を唯一の customer payment entry として整理。

### Removed

- Shopify UI extension workspace / dependency / `.graphqlrc` extension scanning。
- UI extension 用の order metafield helper と webhook / App Proxy 側の metafield 書き込み。

## [0.1.0] - 2026-05-26

### Added

- 初回 GitHub release: Manual Payment + 注文確認 email + App Proxy redirect pattern
- Email-only design (= UI extension 不採用、 customer 動線は email 注文確認 button のみ)
- Liquid snippet for Order Confirmation email (= JPYC blue button #16449A)
- App Proxy `/apps/uniple-pay-link` for lazy session create + redirect
- Webhook handlers (= `orders/create` / uniple completed / uniple expired)
- Settings page for per-shop credentials (= `apiBaseUrl` / `apiKey` / `webhookSecret` / `mode`)
- JPYC compliance (= 「日本円ステーブルコイン」 / 「電子決済手段」 表記、 「暗号資産」 NG)
