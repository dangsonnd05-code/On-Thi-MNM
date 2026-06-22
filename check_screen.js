const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating...');
  await page.goto('https://wayground.com/join?gc=24043977&source=liveDashboard', { waitUntil: 'domcontentloaded' });
  
  try {
    await page.waitForSelector('[data-cy="start-game-button"]', { timeout: 10000 });
    const nameInput = await page.$('[data-cy="enter-name-field"]');
    if (nameInput) await nameInput.fill('AutoBotUnique');
    await page.click('[data-cy="start-game-button"]');
  } catch (e) {}

  try {
    await page.waitForSelector('[data-cy="start-game-button-waiting"]', { timeout: 15000 });
    await page.click('[data-cy="start-game-button-waiting"]');
  } catch (e) {}

  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'debug4.png' });
  console.log('Screenshot saved to debug4.png');
  await browser.close();
})();
