const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let allQuestions = {}; 
  let extractedQA = [];
  let answerMap = {};

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
      
      if (url.includes('proceed') || url.includes('check') || url.includes('submit')) {
        const json = await response.json();
        const data = json.data || json;
        if (data.questionId) {
          const qId = data.questionId;
          const qObj = allQuestions[qId];
          if (qObj) {
            const questionText = qObj.structure?.query?.text || "Unknown";
            const options = qObj.structure?.options || [];
            
            let correctAnsText = "Unknown";
            if (data.correctAnswers && data.correctAnswers.length > 0) {
              const ca = data.correctAnswers[0];
              const opt = options.find(o => o.id === ca || o._id === ca);
              if (opt) correctAnsText = opt.text;
              else if (typeof ca === 'number' && options[ca]) correctAnsText = options[ca].text;
            } else if (data.answer) {
               const ca = data.answer;
               const opt = options.find(o => o.id === ca || o._id === ca);
               if (opt) correctAnsText = opt.text;
               else if (typeof ca === 'number' && options[ca]) correctAnsText = options[ca].text;
            }

            extractedQA.push({
              question: questionText,
              options: options.map(o => o.text),
              correctAnswer: correctAnsText
            });
            answerMap[questionText] = correctAnsText;
            console.log(`Saved answer: ${correctAnsText.substring(0, 20)}...`);
          }
        }
      }
    } catch (e) {}
  });

  console.log('Navigating...');
  await page.goto('https://wayground.com/join?gc=24043977&source=liveDashboard', { waitUntil: 'domcontentloaded' });
  
  try {
    await page.waitForSelector('[data-cy="start-game-button"]', { timeout: 10000 });
    const nameInput = await page.$('[data-cy="enter-name-field"]');
    if (nameInput) await nameInput.fill('AutoBotFast2');
    await page.click('[data-cy="start-game-button"]');
  } catch (e) {}

  try {
    await page.waitForSelector('[data-cy="start-game-button-waiting"]', { timeout: 15000 });
    await page.click('[data-cy="start-game-button-waiting"]');
  } catch (e) {}

  console.log('Starting auto-player loop...');
  let questionsDone = 0;

  for (let i = 0; i < 305; i++) {
    try {
      await page.waitForSelector('.option, [class*="option"]', { timeout: 10000 });
      
      const options = await page.$$('.option, [class*="option"]');
      if (options.length > 0) {
        await options[0].click();
        
        await page.waitForTimeout(500); // Wait for API response
        
        questionsDone++;
        console.log(`Clicked option for Q${questionsDone}`);
        
        // Try to click Next
        try {
          const nextBtn = await page.$('button:has-text("Next"), button:has-text("Tiếp"), [data-cy="proceed-button"]');
          if (nextBtn) {
            await nextBtn.click();
          }
        } catch (e) {}
      } else {
        break;
      }
    } catch (e) {
      console.log('No options found, maybe game ended or transition:', e.message);
      break;
    }
  }

  fs.writeFileSync('extracted_qa_real.json', JSON.stringify(extractedQA, null, 2));
  fs.writeFileSync('answer_map.json', JSON.stringify(answerMap, null, 2));
  console.log(`Saved ${extractedQA.length} extracted_qa_real.json`);
  await browser.close();
})();
