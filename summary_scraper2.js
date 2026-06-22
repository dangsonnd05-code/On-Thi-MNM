const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('response', async (response) => {
    const url = response.url();
    try {
      if (response.request().resourceType() === 'fetch' || response.request().resourceType() === 'xhr') {
         console.log('API Call:', url);
         if (url.includes('api') || url.includes('game')) {
            const text = await response.text();
            fs.appendFileSync('network_logs.txt', 'URL: ' + url + '\n' + text.substring(0, 500) + '\n\n');
            if (text.includes('"questions"')) {
               fs.writeFileSync('game_summary.json', text);
               console.log('Saved game_summary.json!');
            }
         }
      }
    } catch (e) {}
  });

  const url = 'https://wayground.com/join/game/U2FsdGVkX1%252F96nJgXmy%252FDgW86Eh%252BRFw7ujqqH2OsjlfzWqJCbbRZkAs9YLwFQOrAg2ycAdSy0jEi8U94sR%252BQqw%253D%253D?gameType=async&page=summary';
  console.log('Navigating...');
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);
  await browser.close();
})();
