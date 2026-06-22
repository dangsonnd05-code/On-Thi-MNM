const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const url = 'https://wayground.com/join/game/U2FsdGVkX1%252F96nJgXmy%252FDgW86Eh%252BRFw7ujqqH2OsjlfzWqJCbbRZkAs9YLwFQOrAg2ycAdSy0jEi8U94sR%252BQqw%253D%253D?gameType=async&page=summary';
  console.log('Navigating to ' + url);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

  await page.waitForTimeout(5000);

  // Scroll to bottom slowly
  console.log('Scrolling...');
  await page.evaluate(async () => {
    const scrollable = document.querySelector('.overflow-y-auto, .overflow-auto') || document.body;
    let lastHeight = 0;
    let noChangeCount = 0;
    for (let i = 0; i < 60; i++) {
        if (scrollable !== document.body) {
            scrollable.scrollBy(0, 800);
        } else {
            window.scrollBy(0, 800);
        }
        await new Promise(r => setTimeout(r, 600));
        let newHeight = scrollable.scrollHeight || document.body.scrollHeight;
        if (newHeight === lastHeight) {
            noChangeCount++;
            if (noChangeCount > 5) break;
        } else {
            noChangeCount = 0;
        }
        lastHeight = newHeight;
    }
  });

  console.log('Finished scrolling. Clicking questions...');
  // Click all question texts using Playwright locator
  const questionTexts = await page.$$('.question-text, [class*="question-text"], [class*="query"], [class*="QuestionText"]');
  console.log(`Found ${questionTexts.length} questions. Clicking...`);
  for (let i = 0; i < questionTexts.length; i++) {
     try {
         await questionTexts[i].click({ timeout: 500, force: true });
     } catch (e) {}
  }

  await page.waitForTimeout(3000);
  console.log('Extracting answers...');

  const results = await page.evaluate(() => {
    const qBlocks = document.querySelectorAll('.question-review-container, [class*="question-review"], [class*="ReviewQuestion"], [class*="summary-question"], [class*="question-container"], .border, [class*="card"]');
    const res = [];
    for (const block of qBlocks) {
      const qTextEl = block.querySelector('.question-text, [class*="question-text"], [class*="query"], [class*="QuestionText"]');
      if (!qTextEl) continue;
      const qText = qTextEl.innerText;
      
      let correctAns = "Unknown";
      
      const correctEl = block.querySelector('.is-correct, .correct, [class*="correct"], [class*="is-correct"], [class*="correct-answer"], .text-green-500, .bg-green-100');
      
      if (correctEl) {
        const optTextEl = correctEl.querySelector('.option-text, [class*="text"]') || correctEl;
        correctAns = optTextEl.innerText;
      } else {
        const opts = block.querySelectorAll('.option, [class*="option"], [class*="choice"]');
        for (const o of opts) {
          const style = window.getComputedStyle(o);
          // Check if green color for correct answer
          if (style.backgroundColor.includes('191, 106') || style.backgroundColor.includes('0, 191, 106') || style.color.includes('16, 185, 129') || o.innerHTML.includes('fa-check') || o.innerHTML.includes('correct') || o.innerHTML.includes('check')) {
            const t = o.querySelector('.option-text, [class*="text"]') || o;
            correctAns = t.innerText;
            break;
          }
        }
      }
      
      if (qText.length > 5) res.push({ question: qText.trim(), correctAnswer: correctAns.trim() });
    }
    return res;
  });

  console.log(`Extracted ${results.length} answers.`);
  fs.writeFileSync('correct_answers.json', JSON.stringify(results, null, 2));

  await browser.close();
})();
