import { WebClient } from '@slack/web-api';
import { SummarizedArticle } from './types';

/**
 * Slackにメッセージを投稿
 * @param channelId 投稿先チャネルID
 * @param siteName サイト名
 * @param articles 要約された記事の配列
 * @param botToken Slack Bot Token
 */
export async function postToSlack(
  channelId: string,
  siteName: string,
  articles: SummarizedArticle[],
  botToken: string
): Promise<void> {
  try {
    if (articles.length === 0) {
      console.log(`   ℹ️  No articles to post for ${siteName}`);
      return;
    }
    
    const client = new WebClient(botToken);
    
    console.log(`\n📤 Posting to Slack: ${siteName} (${articles.length} article(s))`);
    
    // Block Kitを使用してリッチなフォーマットで投稿
    const blocks = buildMessageBlocks(siteName, articles);
    
    await client.chat.postMessage({
      channel: channelId,
      blocks: blocks,
      text: `${siteName} からの最新記事 (${articles.length}件)`, // フォールバックテキスト
    });
    
    console.log(`   ✅ Posted ${articles.length} article(s) to Slack`);
  } catch (error) {
    console.error(`   ❌ Error posting to Slack for ${siteName}:`, error);
    throw error;
  }
}

/**
 * Slack Block Kitのブロックを構築
 * @param siteName サイト名
 * @param articles 要約された記事の配列
 * @returns Slackのブロック配列
 */
function buildMessageBlocks(siteName: string, articles: SummarizedArticle[]): any[] {
  const blocks: any[] = [];
  
  // ヘッダーセクション
  blocks.push({
    type: 'header',
    text: {
      type: 'plain_text',
      text: `🤖 ${siteName} からの最新記事`,
      emoji: true,
    },
  });
  
  blocks.push({
    type: 'divider',
  });
  
  // 各記事のセクション
  articles.forEach((article, index) => {
    // 記事タイトル
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*📰 ${article.title}*`,
      },
    });
    
    // 要約
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: article.summary,
      },
    });
    
    // 記事へのリンク
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `🔗 <${article.url}|記事を読む>`,
      },
    });
    
    // 記事間の区切り（最後の記事以外）
    if (index < articles.length - 1) {
      blocks.push({
        type: 'divider',
      });
    }
  });
  
  // フッター
  blocks.push({
    type: 'divider',
  });
  
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `取得日時: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })} | 記事数: ${articles.length}件`,
      },
    ],
  });
  
  return blocks;
}

/**
 * エラー通知をSlackに投稿
 * @param channelId 投稿先チャネルID
 * @param errorMessage エラーメッセージ
 * @param botToken Slack Bot Token
 */
export async function postErrorToSlack(
  channelId: string,
  errorMessage: string,
  botToken: string
): Promise<void> {
  try {
    const client = new WebClient(botToken);
    
    await client.chat.postMessage({
      channel: channelId,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '❌ AI News Bot - Error',
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*エラーが発生しました*\n\`\`\`${errorMessage}\`\`\``,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `発生日時: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`,
            },
          ],
        },
      ],
      text: `AI News Bot エラー: ${errorMessage}`,
    });
    
    console.log('   ✅ Error notification posted to Slack');
  } catch (error) {
    console.error('   ❌ Failed to post error to Slack:', error);
  }
}

/**
 * 実行サマリーをSlackに投稿
 * @param channelId 投稿先チャネルID
 * @param summary サマリー情報
 * @param botToken Slack Bot Token
 */
export async function postSummaryToSlack(
  channelId: string,
  summary: {
    totalSites: number;
    successfulSites: number;
    totalArticles: number;
    errors: string[];
  },
  botToken: string
): Promise<void> {
  try {
    const client = new WebClient(botToken);
    
    const statusEmoji = summary.errors.length === 0 ? '✅' : '⚠️';
    
    const blocks: any[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${statusEmoji} AI News Bot - 実行サマリー`,
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*対象サイト数:*\n${summary.totalSites}`,
          },
          {
            type: 'mrkdwn',
            text: `*成功:*\n${summary.successfulSites}`,
          },
          {
            type: 'mrkdwn',
            text: `*総記事数:*\n${summary.totalArticles}`,
          },
          {
            type: 'mrkdwn',
            text: `*エラー数:*\n${summary.errors.length}`,
          },
        ],
      },
    ];
    
    if (summary.errors.length > 0) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*エラー詳細:*\n${summary.errors.map(e => `• ${e}`).join('\n')}`,
        },
      });
    }
    
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `実行日時: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`,
        },
      ],
    });
    
    await client.chat.postMessage({
      channel: channelId,
      blocks: blocks,
      text: `AI News Bot 実行サマリー: ${summary.totalArticles}件の記事を投稿`,
    });
    
    console.log('   ✅ Summary posted to Slack');
  } catch (error) {
    console.error('   ❌ Failed to post summary to Slack:', error);
  }
}

