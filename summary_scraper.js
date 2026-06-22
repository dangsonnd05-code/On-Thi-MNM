const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let summaryData = null;
  let questionsData = null;

  page.on('response', async (response) => {
    const url = response.url();
    try {
      if (url.includes('/api/main/game/') || url.includes('/play-api/') || url.includes('game-data') || url.includes('room')) {
        const text = await response.text();
        if (text.includes('"questions":') || text.includes('"correctAnswers":') || text.includes('"answers":')) {
          const json = JSON.parse(text);
          console.log('[NETWORK] Found game data in:', url);
          // If it contains the questions, save it
          if (json.data && json.data.questions) {
            questionsData = json.data.questions;
          } else if (json.room && json.room.questions) {
            questionsData = json.room.questions;
          } else if (json.questions) {
            questionsData = json.questions;
          }
          
          if (json.data && json.data.players) {
             // maybe player stats have answers?
          }
          fs.writeFileSync('network_summary_' + Date.now() + '.json', JSON.stringify(json, null, 2));
        }
      }
    } catch (e) {}
  });

  const url = 'https://wayground.com/join/game/U2FsdGVkX1%252F96nJgXmy%252FDgW86Eh%252BRFw7ujqqH2OsjlfzWqJCbbRZkAs9YLwFQOrAg2ycAdSy0jEi8U94sR%252BQqw%253D%253D?gameType=async&page=summary';
  console.log('Navigating to summary page...');
  await page.goto(url, { waitUntil: 'networkidle' });

  console.log('Waiting for 5 seconds to ensure everything loads...');
  await page.waitForTimeout(5000);

  // Scroll to bottom to trigger any lazy loading of questions
  console.log('Scrolling to bottom...');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(2000);

  // Try to extract from DOM
  console.log('Extracting from DOM...');
  const domAnswers = await page.evaluate(() => {
    const results = [];
    // The summary page usually has a list of questions
    // In Wayground/Quizizz, each question review block has specific classes
    const qBlocks = document.querySelectorAll('.question-review-container, [class*="question-review"], [class*="question-card"], [class*="ReviewQuestion"]');
    for (const block of qBlocks) {
      const qTextEl = block.querySelector('.question-text, [class*="question-text"], [class*="query"]');
      if (!qTextEl) continue;
      const qText = qTextEl.innerText;
      
      // The correct answer usually has a green checkmark or a 'correct' class
      const correctEl = block.querySelector('.is-correct, .correct, [class*="correct"], [class*="is-correct"], [class*="correct-answer"]');
      let correctAns = "Unknown";
      if (correctEl) {
        // sometimes the element itself is the option box
        const optTextEl = correctEl.querySelector('.option-text, [class*="text"]') || correctEl;
        correctAns = optTextEl.innerText;
      } else {
        // maybe it's just the text color?
        const opts = block.querySelectorAll('.option, [class*="option"]');
        for (const o of opts) {
          const style = window.getComputedStyle(o);
          if (style.backgroundColor.includes('0, 191, 106') || o.innerHTML.includes('fa-check') || o.innerHTML.includes('correct')) {
            const t = o.querySelector('.option-text, [class*="text"]') || o;
            correctAns = t.innerText;
            break;
          }
        }
      }
      results.push({ question: qText, correctAnswer: correctAns });
    }
    return results;
  });

  console.log(`Extracted ${domAnswers.length} answers from DOM.`);
  fs.writeFileSync('dom_answers.json', JSON.stringify(domAnswers, null, 2));

  // Extract from window object
  const state = await page.evaluate(() => {
    return window.__PRELOADED_STATE__ || window.Quizizz || window.initialState || null;
  });
  if (state) {
    fs.writeFileSync('window_state.json', JSON.stringify(state, null, 2));
    console.log('Extracted window state.');
  }

  await browser.close();
})();
