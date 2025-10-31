import { parse } from 'csv-parse/sync';

/**
 * Google SpreadsheetからサイトURLのリストを取得
 * @param csvUrl SpreadsheetのCSVエクスポートURL
 * @returns サイトURLの配列
 */
export async function fetchSiteUrls(csvUrl: string): Promise<string[]> {
  try {
    console.log('📊 Fetching site URLs from spreadsheet...');
    
    // CSVをフェッチ
    const response = await fetch(csvUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch spreadsheet: ${response.status} ${response.statusText}`);
    }
    
    const csvText = await response.text();
    
    // CSVをパース
    const records = parse(csvText, {
      skip_empty_lines: true,
      trim: true,
    }) as string[][];
    
    // A列（1列目）のURLを抽出し、空行をフィルタリング
    const urls = records
      .map(row => row[0])
      .filter(url => url && url.trim().length > 0)
      .filter(url => url.startsWith('http://') || url.startsWith('https://'));
    
    console.log(`✅ Found ${urls.length} site URL(s)`);
    urls.forEach((url, index) => {
      console.log(`   ${index + 1}. ${url}`);
    });
    
    return urls;
  } catch (error) {
    console.error('❌ Error fetching site URLs:', error);
    throw error;
  }
}

/**
 * URLからサイト名を生成
 * @param url サイトのURL
 * @returns サイト名
 */
export function extractSiteName(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '');
    
    // ドメイン名を取得（例: openai.com, anthropic.com）
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      return parts[parts.length - 2].charAt(0).toUpperCase() + parts[parts.length - 2].slice(1);
    }
    
    return hostname;
  } catch (error) {
    console.warn(`⚠️  Could not parse URL: ${url}`);
    return url;
  }
}

