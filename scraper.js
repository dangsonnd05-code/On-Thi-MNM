const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let extractedData = null;

  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/main/game/') || url.includes('/game-data')) {
      try {
        const json = await response.json();
        if (json && json.data && json.data.questions) {
          console.log(`Intercepted quiz data! Found ${json.data.questions.length} questions.`);
          extractedData = json.data;
        } else if (json && json.room && json.room.questions) {
          console.log(`Intercepted room data! Found ${json.room.questions.length} questions.`);
          extractedData = json.room;
        }
      } catch (e) {
      }
    }
  });

  console.log('Navigating to the game link...');
  await page.goto('https://wayground.com/join?gc=24043977&source=liveDashboard', { waitUntil: 'networkidle' });
  
  console.log('Waiting for start button...');
  try {
    await page.waitForSelector('[data-cy="start-game-button"]', { timeout: 10000 });
    
    // Fill the name just in case
    const nameInput = await page.$('[data-cy="enter-name-field"]');
    if (nameInput) {
      await nameInput.fill('AutoBot');
    }
    
    console.log('Clicking start button...');
    await page.click('[data-cy="start-game-button"]');
    
    console.log('Waiting for game to load...');
    await page.waitForTimeout(10000); // wait for 10 seconds to let network catch the game data
  } catch (e) {
    console.log('Error during click or wait:', e.message);
  }

  if (extractedData) {
    fs.writeFileSync('quiz_data_raw.json', JSON.stringify(extractedData, null, 2));
    console.log('Successfully saved raw quiz data to quiz_data_raw.json');
  } else {
    console.log('Could not intercept data. Let\'s check window state...');
    const state = await page.evaluate(() => {
      return window.__PRELOADED_STATE__ || window.Quizizz || null;
    });
    if (state) {
      fs.writeFileSync('quiz_data_raw.json', JSON.stringify(state, null, 2));
      console.log('Successfully saved window state to quiz_data_raw.json');
    } else {
      console.log('Could not find data in window state.');
      await page.screenshot({ path: 'debug2.png' });
      fs.writeFileSync('debug2.html', await page.content());
    }
  }

  await browser.close();
})();
