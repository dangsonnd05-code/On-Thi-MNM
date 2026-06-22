const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const url = 'https://wayground.com/join/game/U2FsdGVkX1%252F96nJgXmy%252FDgW86Eh%252BRFw7ujqqH2OsjlfzWqJCbbRZkAs9YLwFQOrAg2ycAdSy0jEi8U94sR%252BQqw%253D%253D?gameType=async&page=summary';
  console.log('Navigating to summary page...');
  await page.goto(url, { waitUntil: 'networkidle' });

  console.log('Waiting 3 seconds...');
  await page.waitForTimeout(3000);

  // Click on "Review Questions" if there is a tab or button
  try {
    const reviewBtn = await page.$('button:has-text("Review"), button:has-text("Xem lại")');
    if (reviewBtn) await reviewBtn.click();
    await page.waitForTimeout(2000);
  } catch (e) {}

  console.log('Scrolling slowly to load all questions...');
  let lastHeight = 0;
  for (let i = 0; i < 30; i++) { // scroll 30 times
    await page.evaluate(() => window.scrollBy(0, 1000));
    await page.waitForTimeout(800);
    const newHeight = await page.evaluate(() => document.body.scrollHeight);
    if (newHeight === lastHeight && i > 10) break;
    lastHeight = newHeight;
  }

  console.log('Extracting from DOM...');
  const domAnswers = await page.evaluate(() => {
    const results = [];
    // Wayground typically has a list of question containers in summary
    const qBlocks = document.querySelectorAll('.question-review-container, [class*="question-review"], [class*="ReviewQuestion"], [class*="summary-question"]');
    
    // Sometimes it's a generic flex/grid layout
    const fallbackBlocks = qBlocks.length > 0 ? qBlocks : document.querySelectorAll('[class*="question-container"], .border, [class*="card"]');

    for (const block of fallbackBlocks) {
      // Find the query
      const qTextEl = block.querySelector('.question-text, [class*="question-text"], [class*="query"], [class*="QuestionText"]');
      if (!qTextEl) continue;
      const qText = qTextEl.innerText;
      
      // Find the correct option
      let correctAns = "Unknown";
      
      // Look for checkmark icon (success color) or correct classes
      const correctEl = block.querySelector('.is-correct, .correct, [class*="correct"], [class*="is-correct"], [class*="correct-answer"], .text-green-500, .bg-green-100');
      
      if (correctEl) {
        const optTextEl = correctEl.querySelector('.option-text, [class*="text"]') || correctEl;
        correctAns = optTextEl.innerText;
      } else {
        // Fallback: check styles or innerHTML for check icon
        const opts = block.querySelectorAll('.option, [class*="option"], [class*="choice"]');
        for (const o of opts) {
          const style = window.getComputedStyle(o);
          if (style.backgroundColor.includes('191, 106') || style.color.includes('16, 185, 129') || o.innerHTML.includes('fa-check') || o.innerHTML.includes('correct') || o.innerHTML.includes('check')) {
            const t = o.querySelector('.option-text, [class*="text"]') || o;
            correctAns = t.innerText;
            break;
          }
        }
      }
      
      // Filter out empty or too short
      if (qText.length > 5) {
         results.push({ question: qText.trim(), correctAnswer: correctAns.trim() });
      }
    }
    return results;
  });

  console.log(`Extracted ${domAnswers.length} answers from DOM.`);
  fs.writeFileSync('dom_answers.json', JSON.stringify(domAnswers, null, 2));

  // Also take a full page screenshot to debug
  await page.screenshot({ path: 'summary_full.png', fullPage: true });

  await browser.close();
})();
