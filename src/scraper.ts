import { chromium, Browser, Page } from 'playwright';
import { Article } from './types';

/**
 * 指定されたサイトから記事を取得
 * @param siteUrl サイトのURL
 * @returns 記事の配列
 */
export async function scrapeArticles(siteUrl: string): Promise<Article[]> {
  let browser: Browser | null = null;
  
  try {
    console.log(`\n🔍 Scraping articles from: ${siteUrl}`);
    
    browser = await chromium.launch({
      headless: true,
    });
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    
    const page = await context.newPage();
    
    // ページを開く（タイムアウト60秒）
    await page.goto(siteUrl, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    
    // ページが完全に読み込まれるまで待機
    await page.waitForTimeout(2000);
    
    // サイトごとに適切なセレクタで記事を取得
    let articles: Article[] = [];
    
    if (siteUrl.includes('openai.com')) {
      articles = await scrapeOpenAI(page);
    } else if (siteUrl.includes('anthropic.com')) {
      articles = await scrapeAnthropic(page);
    } else if (siteUrl.includes('blog.google')) {
      articles = await scrapeGoogleBlog(page);
    } else {
      // 汎用的なスクレイピング
      articles = await scrapeGeneric(page);
    }
    
    // 前日（24時間以内）の記事のみフィルタリング
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);
    
    const recentArticles = articles.filter(article => {
      if (!article.publishedAt) {
        // 日付が取得できない場合は含める（後で要約時にフィルタリング可能）
        return true;
      }
      return article.publishedAt >= yesterday;
    });
    
    console.log(`   ✅ Found ${articles.length} article(s), ${recentArticles.length} from last 24 hours`);
    
    await browser.close();
    
    return recentArticles;
  } catch (error) {
    console.error(`   ❌ Error scraping ${siteUrl}:`, error);
    
    if (browser) {
      await browser.close();
    }
    
    // エラーが発生しても他のサイトの処理を続けるため、空配列を返す
    return [];
  }
}

/**
 * OpenAIニュースページから記事を取得
 */
async function scrapeOpenAI(page: Page): Promise<Article[]> {
  const articles: Article[] = [];
  
  try {
    // 記事リンクを取得
    const articleElements = await page.$$('a[href*="/news/"]');
    
    for (const element of articleElements.slice(0, 5)) { // 最新5件まで
      const href = await element.getAttribute('href');
      if (!href) continue;
      
      const url = href.startsWith('http') ? href : `https://openai.com${href}`;
      
      // タイトルを取得
      const titleElement = await element.$('h3, h2, h4');
      const title = titleElement ? await titleElement.textContent() : '';
      
      if (title && title.trim()) {
        articles.push({
          title: title.trim(),
          url: url,
          content: '', // 詳細は後で取得
        });
      }
    }
    
    // 各記事の詳細を取得
    for (const article of articles) {
      try {
        await page.goto(article.url, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(1000);
        
        // 記事本文を取得
        const contentElements = await page.$$('article p, main p, .content p');
        const paragraphs = await Promise.all(
          contentElements.slice(0, 3).map((el: any) => el.textContent())
        );
        article.content = paragraphs.filter((p: any) => p).join('\n\n');
        
        // 日付を取得（可能であれば）
        const dateElement = await page.$('time');
        if (dateElement) {
          const dateStr = await dateElement.getAttribute('datetime');
          if (dateStr) {
            article.publishedAt = new Date(dateStr);
          }
        }
      } catch (error) {
        console.warn(`   ⚠️  Could not fetch details for: ${article.url}`);
      }
    }
  } catch (error) {
    console.warn('   ⚠️  Error in OpenAI scraping:', error);
  }
  
  return articles;
}

/**
 * Anthropicニュースページから記事を取得
 */
async function scrapeAnthropic(page: Page): Promise<Article[]> {
  const articles: Article[] = [];
  
  try {
    // 記事リンクを取得
    const articleElements = await page.$$('a[href*="/news/"]');
    
    for (const element of articleElements.slice(0, 5)) { // 最新5件まで
      const href = await element.getAttribute('href');
      if (!href) continue;
      
      const url = href.startsWith('http') ? href : `https://www.anthropic.com${href}`;
      
      // タイトルを取得
      const titleElement = await element.$('h3, h2, h4');
      const title = titleElement ? await titleElement.textContent() : '';
      
      if (title && title.trim()) {
        articles.push({
          title: title.trim(),
          url: url,
          content: '', // 詳細は後で取得
        });
      }
    }
    
    // 各記事の詳細を取得
    for (const article of articles) {
      try {
        await page.goto(article.url, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(1000);
        
        // 記事本文を取得
        const contentElements = await page.$$('article p, main p, .content p');
        const paragraphs = await Promise.all(
          contentElements.slice(0, 3).map((el: any) => el.textContent())
        );
        article.content = paragraphs.filter((p: any) => p).join('\n\n');
        
        // 日付を取得（可能であれば）
        const dateElement = await page.$('time');
        if (dateElement) {
          const dateStr = await dateElement.getAttribute('datetime');
          if (dateStr) {
            article.publishedAt = new Date(dateStr);
          }
        }
      } catch (error) {
        console.warn(`   ⚠️  Could not fetch details for: ${article.url}`);
      }
    }
  } catch (error) {
    console.warn('   ⚠️  Error in Anthropic scraping:', error);
  }
  
  return articles;
}

/**
 * Google Blogから記事を取得
 */
async function scrapeGoogleBlog(page: Page): Promise<Article[]> {
  const articles: Article[] = [];
  
  try {
    // 記事リンクを取得
    const articleElements = await page.$$('a[href*="/products/gemini/"]');
    
    for (const element of articleElements.slice(0, 5)) { // 最新5件まで
      const href = await element.getAttribute('href');
      if (!href) continue;
      
      const url = href.startsWith('http') ? href : `https://blog.google${href}`;
      
      // タイトルを取得
      const titleElement = await element.$('h3, h2, h4');
      const title = titleElement ? await titleElement.textContent() : '';
      
      if (title && title.trim()) {
        articles.push({
          title: title.trim(),
          url: url,
          content: '', // 詳細は後で取得
        });
      }
    }
    
    // 各記事の詳細を取得
    for (const article of articles) {
      try {
        await page.goto(article.url, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(1000);
        
        // 記事本文を取得
        const contentElements = await page.$$('article p, main p, .content p');
        const paragraphs = await Promise.all(
          contentElements.slice(0, 3).map((el: any) => el.textContent())
        );
        article.content = paragraphs.filter((p: any) => p).join('\n\n');
        
        // 日付を取得（可能であれば）
        const dateElement = await page.$('time');
        if (dateElement) {
          const dateStr = await dateElement.getAttribute('datetime');
          if (dateStr) {
            article.publishedAt = new Date(dateStr);
          }
        }
      } catch (error) {
        console.warn(`   ⚠️  Could not fetch details for: ${article.url}`);
      }
    }
  } catch (error) {
    console.warn('   ⚠️  Error in Google Blog scraping:', error);
  }
  
  return articles;
}

/**
 * 汎用的な記事スクレイピング
 */
async function scrapeGeneric(page: Page): Promise<Article[]> {
  const articles: Article[] = [];
  
  try {
    // 一般的な記事リンクのセレクタ
    const articleElements = await page.$$('article a, .post a, .news-item a, a[href*="/article"], a[href*="/post"]');
    
    for (const element of articleElements.slice(0, 5)) { // 最新5件まで
      const href = await element.getAttribute('href');
      if (!href) continue;
      
      // 相対URLを絶対URLに変換
      let url: string;
      if (href.startsWith('http')) {
        url = href;
      } else {
        try {
          url = new URL(href, page.url()).toString();
        } catch {
          url = href;
        }
      }
      
      // タイトルを取得
      const title = await element.textContent();
      
      if (title && title.trim()) {
        articles.push({
          title: title.trim(),
          url: url,
          content: '', // 詳細は後で取得
        });
      }
    }
  } catch (error) {
    console.warn('   ⚠️  Error in generic scraping:', error);
  }
  
  return articles;
}

