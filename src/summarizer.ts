import OpenAI from 'openai';
import { Article, SummarizedArticle } from './types';

/**
 * OpenAI APIを使用して記事を要約
 * @param article 記事
 * @param apiKey OpenAI APIキー
 * @returns 要約された記事
 */
export async function summarizeArticle(
  article: Article,
  apiKey: string
): Promise<SummarizedArticle> {
  try {
    const openai = new OpenAI({ apiKey });
    
    console.log(`   📝 Summarizing: ${article.title.substring(0, 50)}...`);
    
    // 記事本文が空の場合はタイトルのみで要約
    const contentToSummarize = article.content || article.title;
    
    const prompt = `以下のAI関連記事を日本語で3-4行で要約してください。重要なポイントを簡潔にまとめてください。

タイトル: ${article.title}

本文:
${contentToSummarize.substring(0, 3000)} // 最大3000文字まで

要約を日本語で出力してください。`;
    
    const completion = await openai.chat.completions.create(
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'あなたはAI関連のニュース記事を簡潔に要約する専門家です。重要な情報を3-4行で分かりやすくまとめてください。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 300,
        temperature: 0.3,
      },
      {
        timeout: 30000, // 30秒タイムアウト
      }
    );
    
    const summary = completion.choices[0]?.message?.content || contentToSummarize.substring(0, 200);
    
    return {
      title: article.title,
      url: article.url,
      summary: summary.trim(),
    };
  } catch (error) {
    console.error(`   ⚠️  Error summarizing article: ${article.title}`, error);
    
    // エラーが発生した場合は元の本文の冒頭を使用
    const fallbackSummary = article.content 
      ? article.content.substring(0, 200) + '...'
      : article.title;
    
    return {
      title: article.title,
      url: article.url,
      summary: fallbackSummary,
    };
  }
}

/**
 * 複数の記事を要約（バッチ処理）
 * @param articles 記事の配列
 * @param apiKey OpenAI APIキー
 * @returns 要約された記事の配列
 */
export async function summarizeArticles(
  articles: Article[],
  apiKey: string
): Promise<SummarizedArticle[]> {
  const summarizedArticles: SummarizedArticle[] = [];
  
  console.log(`\n📝 Summarizing ${articles.length} article(s)...`);
  
  for (const article of articles) {
    try {
      const summarized = await summarizeArticle(article, apiKey);
      summarizedArticles.push(summarized);
      
      // API制限を考慮して少し待機
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`   ⚠️  Failed to summarize: ${article.title}`);
      
      // エラーが発生しても処理を継続
      summarizedArticles.push({
        title: article.title,
        url: article.url,
        summary: article.content?.substring(0, 200) || article.title,
      });
    }
  }
  
  console.log(`   ✅ Summarized ${summarizedArticles.length} article(s)`);
  
  return summarizedArticles;
}

