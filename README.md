# AI News Slack Bot 🤖

[![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-automated-blue)](https://github.com/junozone1110/ainews-bot/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

AI関連の最新ニュースを自動でスクレイピングし、要約してSlackチャネルに投稿するBotです。

## 特徴 ✨

- 📊 Google Spreadsheetでトラックするサイトを簡単管理
- 🔍 Playwrightによる高度なWebスクレイピング
- 🤖 OpenAI APIで記事を自動要約
- 💬 Slack Block Kitによる美しいメッセージフォーマット
- ⏰ GitHub Actionsで完全自動化（毎日定期実行）
- 🔄 リトライ機能とエラーハンドリング完備
- 📈 実行サマリーとエラー通知

## 動作フロー 🔄

1. Google Spreadsheetからトラックサイト一覧を取得
2. 各サイトをPlaywrightでスクレイピング（前日の記事のみ）
3. OpenAI APIで記事を要約
4. Slackチャネルに投稿（サイトごとに1メッセージ）
5. 実行サマリーを投稿

## セットアップ 🚀

### 1. リポジトリのクローン

```bash
git clone https://github.com/junozone1110/ainews-bot.git
cd ainews-bot
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env.example`をコピーして`.env`を作成：

```bash
cp .env.example .env
```

`.env`ファイルを編集して以下の環境変数を設定：

```env
# Google Spreadsheet CSV Export URL
SPREADSHEET_URL=https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/export?format=csv&gid=0

# OpenAI API Key
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Slack Bot Token (starts with xoxb-)
SLACK_BOT_TOKEN=xoxb-xxxxxxxxxxxxx-xxxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx

# Slack Channel ID (e.g., C01234567890)
SLACK_CHANNEL_ID=C01234567890
```

### 4. Google Spreadsheetの準備

このプロジェクトでは以下のスプレッドシートを使用しています：
- [AI記事トラックサイト一覧](https://docs.google.com/spreadsheets/d/17vTAz4pufd-P0hB7uhF0jFV-Y4q7iJBAoAOZmsAS1ko/edit?gid=0#gid=0)

**トラック中のサイト:**
- OpenAI News (https://openai.com/ja-JP/news/)
- Anthropic News (https://www.anthropic.com/news)
- Google Gemini Blog (https://blog.google/products/gemini/)
- GitHub Blog (https://github.blog/)

**独自のスプレッドシートを作成する場合:**
1. 新しいGoogle Spreadsheetを作成
2. A列にトラックしたいサイトのURLを1行ずつ記入
3. シートを「リンクを知っている全員」に公開
4. URLから`/export?format=csv&gid=0`形式のURLを生成して環境変数に設定

**CSVエクスポートURL形式:**
```
https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/export?format=csv&gid={SHEET_ID}
```

### 5. Slack Appの作成

1. [Slack API](https://api.slack.com/apps)にアクセス
2. "Create New App" → "From scratch"
3. App名とワークスペースを選択
4. "OAuth & Permissions"で以下のスコープを追加：
   - `chat:write`
   - `chat:write.public`
5. "Install to Workspace"でアプリをインストール
6. "Bot User OAuth Token"（`xoxb-`で始まる）をコピー
7. Slackでチャネルを開き、URLからチャネルIDを取得
   - 例: `https://app.slack.com/client/T.../C01234567890` → `C01234567890`

### 6. OpenAI APIキーの取得

1. [OpenAI Platform](https://platform.openai.com/)にアクセス
2. APIキーを発行（`sk-`で始まる）
3. 環境変数に設定

### 7. ローカルでのテスト実行

```bash
npm run dev
```

または

```bash
npm run start
```

## GitHub Actionsでの自動実行設定 ⚙️

### 1. GitHub Secretsの設定

リポジトリの設定で以下のSecretsを追加：

- `SPREADSHEET_URL`: SpreadsheetのCSVエクスポートURL
- `OPENAI_API_KEY`: OpenAI APIキー
- `SLACK_BOT_TOKEN`: Slack Bot Token
- `SLACK_CHANNEL_ID`: Slack投稿先チャネルID

**設定方法:**
1. GitHubリポジトリページで「Settings」→「Secrets and variables」→「Actions」
2. 「New repository secret」で各シークレットを追加

### 2. 実行スケジュールの変更

`.github/workflows/daily-news.yml`の`cron`式を編集：

```yaml
schedule:
  - cron: '0 0 * * *'  # 毎日UTC 0時（JST 9時）
```

**Cron式の例:**
- `'0 0 * * *'` - 毎日0時（UTC）
- `'0 0,12 * * *'` - 毎日0時と12時（UTC）
- `'0 9 * * 1-5'` - 平日の9時（UTC）

### 3. 手動実行

GitHubリポジトリの「Actions」タブから「Daily AI News Bot」を選択し、「Run workflow」で手動実行可能。

## 動作実績 📊

**テスト実行結果（2025-10-31）:**
- ✅ Anthropic: 5記事取得・要約・投稿成功
- ✅ GitHub Blog: 4記事取得・要約・投稿成功
- ✅ 合計9記事をSlackに投稿
- ⏱️ 実行時間: 約97秒

## プロジェクト構成 📁

```
ainews-bot/
├── .github/
│   └── workflows/
│       └── daily-news.yml      # GitHub Actions定期実行設定
├── src/
│   ├── index.ts                # メインエントリーポイント
│   ├── spreadsheet.ts          # スプレッドシート取得
│   ├── scraper.ts              # Playwright記事スクレイピング
│   ├── summarizer.ts           # OpenAI要約
│   ├── slack.ts                # Slack投稿
│   └── types.ts                # 型定義
├── package.json
├── tsconfig.json
├── .env.example                # 環境変数サンプル
├── .gitignore
└── README.md
```

## Slack投稿フォーマット 💬

各サイトごとに以下のフォーマットでメッセージが投稿されます：

```
🤖 OpenAI からの最新記事
─────────────────────────────────

📰 記事タイトル1
要約内容がここに表示されます。
OpenAI APIによって自動生成された
簡潔な要約です。

🔗 記事を読む

─────────────────────────────────
取得日時: 2025-10-31 09:00:00 | 記事数: 3件
```

## トラブルシューティング 🔧

### スクレイピングが失敗する

- サイトの構造が変わった可能性があります
- `src/scraper.ts`のセレクタを調整してください
- Playwrightのタイムアウトを延長してください

### OpenAI APIでエラーが発生する

- APIキーが正しいか確認
- API利用制限に達していないか確認
- [OpenAI Status](https://status.openai.com/)でサービス状態を確認

### Slackに投稿されない

- Bot Tokenが正しいか確認
- チャネルIDが正しいか確認
- Slack Appに必要なスコープが付与されているか確認
- Botがチャネルに招待されているか確認（`chat:write.public`を使用しない場合）

### GitHub Actionsが実行されない

- Secretsが正しく設定されているか確認
- ワークフローファイルが`.github/workflows/`に配置されているか確認
- リポジトリのActionsが有効になっているか確認

## カスタマイズ 🎨

### トラックするサイトの追加

Google Spreadsheetに新しい行を追加するだけでOK！

### スクレイピングロジックのカスタマイズ

`src/scraper.ts`の各サイト専用関数を編集：

- `scrapeOpenAI()` - OpenAI用
- `scrapeAnthropic()` - Anthropic用
- `scrapeGoogleBlog()` - Google Blog用
- `scrapeGeneric()` - 汎用

### 要約プロンプトの変更

`src/summarizer.ts`の`summarizeArticle()`関数内のプロンプトを編集。

### Slackメッセージフォーマットの変更

`src/slack.ts`の`buildMessageBlocks()`関数を編集。

## 開発 👩‍💻

### TypeScriptのビルド

```bash
npm run build
```

ビルド後のファイルは`dist/`に出力されます。

### 型チェック

```bash
npm run type-check
```

### Playwrightのデバッグ

ヘッドレスモードを無効にする場合は、`src/scraper.ts`を編集：

```typescript
const browser = await chromium.launch({
  headless: false, // デバッグ用
});
```

## 技術スタック 🛠️

- **言語**: TypeScript 5.3
- **実行環境**: Node.js 20+
- **スクレイピング**: Playwright (Chromium)
- **AI要約**: OpenAI API (GPT-4o-mini)
- **通知**: Slack Web API (Block Kit)
- **自動実行**: GitHub Actions
- **データソース**: Google Spreadsheet (CSV Export)

## パフォーマンス ⚡

- 平均実行時間: 約90-120秒（サイト数・記事数による）
- API呼び出し: 記事数分のOpenAI API呼び出し
- コスト: 1記事あたり約0.01円程度（GPT-4o-mini使用時）

## ライセンス 📄

MIT

## 作者 👤

- GitHub: [@junozone1110](https://github.com/junozone1110)

## 貢献 🤝

プルリクエストやIssueは大歓迎です！

## サポート ❓

問題が発生した場合は、[GitHubのIssue](https://github.com/junozone1110/ainews-bot/issues)を作成してください。

