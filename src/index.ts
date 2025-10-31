import dotenv from 'dotenv';
import { fetchSiteUrls, extractSiteName } from './spreadsheet';
import { scrapeArticles } from './scraper';
import { summarizeArticles } from './summarizer';
import { postToSlack, postErrorToSlack, postSummaryToSlack } from './slack';
import { EnvConfig } from './types';

// 環境変数を読み込み
dotenv.config();

/**
 * 環境変数を取得して検証
 */
function getEnvConfig(): EnvConfig {
  const spreadsheetUrl = process.env.SPREADSHEET_URL;
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const slackBotToken = process.env.SLACK_BOT_TOKEN;
  const slackChannelId = process.env.SLACK_CHANNEL_ID;

  if (!spreadsheetUrl) {
    throw new Error('SPREADSHEET_URL is not set in environment variables');
  }
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY is not set in environment variables');
  }
  if (!slackBotToken) {
    throw new Error('SLACK_BOT_TOKEN is not set in environment variables');
  }
  if (!slackChannelId) {
    throw new Error('SLACK_CHANNEL_ID is not set in environment variables');
  }

  return {
    spreadsheetUrl,
    openaiApiKey,
    slackBotToken,
    slackChannelId,
  };
}

/**
 * リトライ処理付きの関数実行
 * @param fn 実行する関数
 * @param retries リトライ回数
 * @param delay 遅延時間（ミリ秒）
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    
    console.log(`   ⏳ Retrying in ${delay}ms... (${retries} retries left)`);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
}

/**
 * メイン処理
 */
async function main() {
  console.log('🚀 AI News Slack Bot Started');
  console.log('=' .repeat(60));
  
  const startTime = Date.now();
  const errors: string[] = [];
  let totalArticles = 0;
  let successfulSites = 0;
  
  try {
    // 環境変数を取得
    const config = getEnvConfig();
    console.log('✅ Environment variables loaded');
    
    // Google Spreadsheetからサイト一覧を取得
    const siteUrls = await retryWithBackoff(
      () => fetchSiteUrls(config.spreadsheetUrl),
      3,
      2000
    );
    
    if (siteUrls.length === 0) {
      console.log('⚠️  No site URLs found in spreadsheet');
      return;
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`📰 Processing ${siteUrls.length} site(s)...`);
    console.log('='.repeat(60));
    
    // 各サイトを順次処理
    for (const siteUrl of siteUrls) {
      try {
        const siteName = extractSiteName(siteUrl);
        
        console.log(`\n🌐 Processing: ${siteName} (${siteUrl})`);
        console.log('-'.repeat(60));
        
        // 記事をスクレイピング
        const articles = await retryWithBackoff(
          () => scrapeArticles(siteUrl),
          2,
          3000
        );
        
        if (articles.length === 0) {
          console.log(`   ℹ️  No recent articles found for ${siteName}`);
          successfulSites++;
          continue;
        }
        
        // 記事を要約
        const summarizedArticles = await summarizeArticles(
          articles,
          config.openaiApiKey
        );
        
        if (summarizedArticles.length === 0) {
          console.log(`   ℹ️  No articles to post for ${siteName}`);
          successfulSites++;
          continue;
        }
        
        // Slackに投稿
        await retryWithBackoff(
          () => postToSlack(
            config.slackChannelId,
            siteName,
            summarizedArticles,
            config.slackBotToken
          ),
          2,
          2000
        );
        
        totalArticles += summarizedArticles.length;
        successfulSites++;
        
        console.log(`   ✅ Successfully processed ${siteName}`);
        
        // 次のサイトまで少し待機（API制限対策）
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        const siteName = extractSiteName(siteUrl);
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`   ❌ Failed to process ${siteName}: ${errorMessage}`);
        errors.push(`${siteName}: ${errorMessage}`);
        
        // エラーが発生しても次のサイトの処理を続行
        continue;
      }
    }
    
    // 実行サマリーを投稿
    console.log('\n' + '='.repeat(60));
    console.log('📊 Execution Summary');
    console.log('='.repeat(60));
    console.log(`Total sites: ${siteUrls.length}`);
    console.log(`Successful sites: ${successfulSites}`);
    console.log(`Total articles posted: ${totalArticles}`);
    console.log(`Errors: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\nError details:');
      errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    // サマリーをSlackに投稿
    await postSummaryToSlack(
      config.slackChannelId,
      {
        totalSites: siteUrls.length,
        successfulSites,
        totalArticles,
        errors,
      },
      config.slackBotToken
    );
    
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n⏱️  Execution time: ${elapsedTime}s`);
    console.log('✅ AI News Slack Bot Completed Successfully');
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('\n❌ Fatal Error:', errorMessage);
    
    // 致命的なエラーをSlackに通知
    try {
      const config = getEnvConfig();
      await postErrorToSlack(
        config.slackChannelId,
        errorMessage,
        config.slackBotToken
      );
    } catch (slackError) {
      console.error('Failed to post error to Slack:', slackError);
    }
    
    process.exit(1);
  }
}

// スクリプトを実行
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

