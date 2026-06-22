const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let allQuestions = {}; // mapping id -> question text & options
  let allAnswers = {}; // mapping id -> correct answer

  page.on('response', async (response) => {
    const url = response.url();
    try {
      if (url.includes('/api/main/game/') || url.includes('/play-api/') || url.includes('game-data') || url.includes('room')) {
        const text = await response.text();
        if (text.includes('"questions":') && text.includes('"options":')) {
          const json = JSON.parse(text);
          const qs = json.data?.questions || json.room?.questions || json.questions || {};
          for (const key of Object.keys(qs)) {
            const q = qs[key];
            if (q && q.structure) {
              allQuestions[q._id] = q;
            }
          }
        }
      }
      // Intercept the check/proceed answer response
      if (url.includes('proceed') || url.includes('check') || url.includes('submit')) {
        const json = await response.json();
        // Wait, Wayground/Quizizz usually returns the correct answer in the response to the user's answer
        // Check for 'correctAnswers' or 'answer' or 'feedback'
        if (json.data && json.data.questionId) {
           // Maybe we can extract the correct answer from the DOM instead?
           // We will rely on DOM or intercepting here.
        }
      }
    } catch (e) {}
  });

  console.log('Navigating...');
  await page.goto('https://wayground.com/join?gc=24043977&source=liveDashboard', { waitUntil: 'domcontentloaded' });
  
  try {
    await page.waitForSelector('[data-cy="start-game-button"]', { timeout: 10000 });
    const nameInput = await page.$('[data-cy="enter-name-field"]');
    if (nameInput) await nameInput.fill('AutoBotP2');
    await page.click('[data-cy="start-game-button"]');
  } catch (e) {}

  try {
    await page.waitForSelector('[data-cy="start-game-button-waiting"]', { timeout: 15000 });
    await page.click('[data-cy="start-game-button-waiting"]');
  } catch (e) {}

  console.log('Starting auto-player loop...');
  let questionsDone = 0;
  
  // We'll extract Q&A directly from the DOM!
  // In Wayground, after clicking an answer, if it's wrong, it highlights the correct answer in Green.
  // Or maybe we can just extract from the internal React state for each question!
  
  const extractedQA = [];

  for (let i = 0; i < 305; i++) {
    // Wait for options to appear
    try {
      await page.waitForSelector('.option, [class*="option"]', { timeout: 10000 });
      
      // Before clicking, get question text and options
      const questionText = await page.evaluate(() => {
        const qEl = document.querySelector('.question-text, [class*="question-text"], .question-content');
        return qEl ? qEl.innerText : '';
      });
      
      const options = await page.$$('.option, [class*="option"]');
      if (options.length > 0) {
        // Click the first option
        await options[0].click();
        
        // Wait for answer reveal. Wayground usually shows the correct answer with a specific class like 'correct' or 'is-correct'
        await page.waitForTimeout(1000);
        
        // Extract correct answer from DOM
        const correctAnswer = await page.evaluate(() => {
          // Find the option with 'correct' class or green color
          const correctEl = document.querySelector('.option.correct, .is-correct, [class*="correct"]');
          if (correctEl) return correctEl.innerText;
          
          // If not found, maybe look for checkmarks
          const allOpts = document.querySelectorAll('.option, [class*="option"]');
          for (let opt of allOpts) {
            if (opt.innerHTML.includes('correct') || opt.innerHTML.includes('check') || getComputedStyle(opt).backgroundColor === 'rgb(0, 191, 106)') { // Green color
              return opt.innerText;
            }
          }
          return 'Unknown';
        });
        
        extractedQA.push({
          question: questionText,
          correctAnswer: correctAnswer
        });
        questionsDone++;
        console.log(`Done ${questionsDone}/299`);
        
        // Try to click "Next" or "Proceed" if it doesn't auto-proceed
        try {
          const nextBtn = await page.$('button:has-text("Next"), button:has-text("Tiếp"), [data-cy="proceed-button"]');
          if (nextBtn) {
            await nextBtn.click();
          }
        } catch (e) {}
      }
    } catch (e) {
      console.log('No options found, maybe game ended or transition:', e.message);
      break;
    }
  }

  fs.writeFileSync('extracted_qa.json', JSON.stringify(extractedQA, null, 2));
  console.log('Saved extracted_qa.json');
  await browser.close();
})();
