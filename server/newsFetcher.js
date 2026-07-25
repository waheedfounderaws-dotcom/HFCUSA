const Parser = require('rss-parser');
const parser = new Parser();
const News = require('./models/News');

// Fetch from Cointelegraph RSS (free, reliable, high volume crypto news)
const RSS_URLS = [
  'https://cointelegraph.com/rss'
];

async function fetchAndSaveNews() {
  console.log('[News] Fetching latest news...');
  let newArticlesCount = 0;
  
  for (const url of RSS_URLS) {
    try {
      const feed = await parser.parseURL(url);
      
      for (const item of feed.items) {
        // Check if article already exists
        const existing = await News.findOne({ link: item.link });
        if (!existing) {
          const newsData = new News({
            title: item.title,
            link: item.link,
            pubDate: new Date(item.pubDate),
            categories: item.categories || [],
            description: item.contentSnippet || '',
            imageUrl: item.enclosure ? item.enclosure.url : '',
            source: feed.title || 'Crypto News'
          });
          await newsData.save();
          newArticlesCount++;
        }
      }
    } catch (err) {
      console.error(`[News] Error fetching from ${url}:`, err.message);
    }
  }
  
  console.log(`[News] Saved ${newArticlesCount} new articles.`);
}

function startNewsFetcher() {
  // Fetch immediately on startup
  fetchAndSaveNews();
  
  // Schedule to run every 30 minutes (30 * 60 * 1000 = 1800000 ms)
  setInterval(fetchAndSaveNews, 30 * 60 * 1000);
}

module.exports = { startNewsFetcher, fetchAndSaveNews };
