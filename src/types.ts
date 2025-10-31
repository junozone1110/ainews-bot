/**
 * 記事の型定義
 */
export interface Article {
  /** 記事のタイトル */
  title: string;
  /** 記事のURL */
  url: string;
  /** 記事の本文（抜粋） */
  content: string;
  /** 公開日時（取得できた場合） */
  publishedAt?: Date;
}

/**
 * サイトごとの記事グループ
 */
export interface SiteArticles {
  /** サイトのURL */
  siteUrl: string;
  /** サイト名（URLから生成） */
  siteName: string;
  /** 取得した記事のリスト */
  articles: Article[];
}

/**
 * 要約された記事
 */
export interface SummarizedArticle {
  /** 記事のタイトル */
  title: string;
  /** 記事のURL */
  url: string;
  /** AI生成の要約 */
  summary: string;
}

/**
 * 環境変数の型定義
 */
export interface EnvConfig {
  /** SpreadsheetのCSVエクスポートURL */
  spreadsheetUrl: string;
  /** OpenAI APIキー */
  openaiApiKey: string;
  /** Slack Bot Token */
  slackBotToken: string;
  /** Slack投稿先チャネルID */
  slackChannelId: string;
}

