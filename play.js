const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let quizData = null;

  // Intercept all responses
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/main/game/') || url.includes('/play-api/') || url.includes('game-data') || url.includes('room')) {
      try {
        const text = await response.text();
        if (text.includes('"questions":') && text.includes('"options":')) {
          const json = JSON.parse(text);
          console.log(`[NETWORK] Found quiz data in: ${url}`);
          if (json.data && json.data.questions) {
            quizData = json.data;
          } else if (json.room && json.room.questions) {
            quizData = json.room;
          } else {
            // just save the whole thing
            quizData = json;
          }
        }
      } catch (e) {
      }
    }
  });

  // Inject script to steal window.fetch
  await page.addInitScript(() => {
    const origFetch = window.fetch;
    window.fetch = async (...args) => {
      const res = await origFetch(...args);
      const resClone = res.clone();
      resClone.text().then(text => {
        if (text.includes('"questions"') && text.includes('"options"')) {
          console.log('STEAL_FETCH:', text);
          window.__STOLEN_DATA__ = text;
        }
      }).catch(e => {});
      return res;
    };
  });

  console.log('Navigating to the game link...');
  await page.goto('https://wayground.com/join?gc=24043977&source=liveDashboard', { waitUntil: 'domcontentloaded' });
  
  console.log('Waiting for enter name step...');
  try {
    await page.waitForSelector('[data-cy="start-game-button"]', { timeout: 10000 });
    const nameInput = await page.$('[data-cy="enter-name-field"]');
    if (nameInput) await nameInput.fill('AutoBotFast');
    await page.click('[data-cy="start-game-button"]');
    console.log('Clicked Join button.');
  } catch (e) {
    console.log('No Join button or error:', e.message);
  }

  console.log('Waiting for lobby to start game...');
  try {
    await page.waitForSelector('[data-cy="start-game-button-waiting"]', { timeout: 15000 });
    await page.click('[data-cy="start-game-button-waiting"]');
    console.log('Clicked Start Game button in lobby.');
  } catch (e) {
    console.log('No Lobby Start button or error:', e.message);
  }

  console.log('Waiting 10 seconds for game to load and fetch data...');
  await page.waitForTimeout(10000);

  if (!quizData) {
    // try to get from window.__STOLEN_DATA__
    const stolen = await page.evaluate(() => window.__STOLEN_DATA__);
    if (stolen) {
      console.log('Found data via fetch interception!');
      quizData = JSON.parse(stolen);
    }
  }

  if (!quizData) {
    console.log('Could not intercept data. Let\'s check window state...');
    const state = await page.evaluate(() => {
      return window.__PRELOADED_STATE__ || window.Quizizz || null;
    });
    if (state) quizData = state;
  }

  if (quizData) {
    fs.writeFileSync('quiz_data_real.json', JSON.stringify(quizData, null, 2));
    console.log('Successfully saved real quiz data!');
  } else {
    console.log('Still no data found. Saving screenshot.');
    await page.screenshot({ path: 'debug3.png' });
    fs.writeFileSync('debug3.html', await page.content());
  }

  await browser.close();
})();
