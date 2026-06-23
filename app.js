let quizQuestions = [];
let currentQuestionIndex = 0;
let userAnswers = {};
let score = 0;
let timerInterval;
let timeElapsed = 0;
let isRandomMode = false;

// Elements
const screens = {
    home: document.getElementById('home-screen'),
    quiz: document.getElementById('quiz-screen'),
    result: document.getElementById('result-screen'),
    review: document.getElementById('review-screen'),
    study: document.getElementById('study-screen'),
    groupStudy: document.getElementById('group-study-screen')
};

function switchScreen(screenId) {
    Object.values(screens).forEach(screen => {
        screen.classList.remove('active');
        screen.classList.remove('fade-in');
    });
    screens[screenId].classList.add('active', 'fade-in');

    // Handle Sidebar and Home button visibility
    const sidebar = document.getElementById('sidebar');
    const btnToggle = document.getElementById('btn-toggle-sidebar');
    const btnHome = document.getElementById('btn-home');

    if (screenId === 'quiz') {
        if (window.innerWidth > 768) {
            sidebar.classList.remove('hidden');
        } else {
            sidebar.classList.add('hidden');
        }
        btnToggle.classList.remove('hidden');
        btnHome.classList.remove('hidden');
    } else {
        sidebar.classList.add('hidden');
        btnToggle.classList.add('hidden');
        if (screenId === 'home') {
            btnHome.classList.add('hidden');
        } else {
            btnHome.classList.remove('hidden');
        }
    }
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('hidden');
}

function goHome() {
    if (Object.keys(userAnswers).length > 0 && !screens.result.classList.contains('active')) {
        if (!confirm('Bạn có chắc muốn thoát? Kết quả bài làm sẽ không được lưu.')) return;
    }
    clearInterval(timerInterval);
    switchScreen('home');
}

function startQuiz(mode) {
    isRandomMode = (mode === 'random');
    
    if (!window.QUIZ_DATA || window.QUIZ_DATA.length === 0) {
        alert('Dữ liệu câu hỏi chưa sẵn sàng!');
        return;
    }

    if (isRandomMode) {
        let shuffled = JSON.parse(JSON.stringify(window.QUIZ_DATA)).sort(() => 0.5 - Math.random());
        quizQuestions = shuffled.slice(0, 60);
        quizQuestions.forEach(q => {
            q.options.sort(() => 0.5 - Math.random());
        });
    } else {
        quizQuestions = JSON.parse(JSON.stringify(window.QUIZ_DATA));
    }

    currentQuestionIndex = 0;
    userAnswers = {};
    score = 0;
    timeElapsed = 0;

    buildSidebar();
    switchScreen('quiz');
    startTimer();
    
    const displayMode = document.getElementById('display-mode').value;
    if (displayMode === 'single') {
        document.getElementById('single-question-container').classList.remove('hidden');
        document.getElementById('all-questions-container').classList.add('hidden');
        loadQuestion();
    } else {
        document.getElementById('single-question-container').classList.add('hidden');
        document.getElementById('all-questions-container').classList.remove('hidden');
        renderAllQuestions();
    }
}

function buildSidebar() {
    const grid = document.getElementById('question-nav-grid');
    grid.innerHTML = '';
    for (let i = 0; i < quizQuestions.length; i++) {
        const btn = document.createElement('button');
        btn.className = 'nav-btn';
        btn.id = `nav-btn-${i}`;
        btn.innerText = quizQuestions[i].id;
        btn.onclick = () => jumpToQuestion(i);
        grid.appendChild(btn);
    }
}

function updateSidebar() {
    for (let i = 0; i < quizQuestions.length; i++) {
        const btn = document.getElementById(`nav-btn-${i}`);
        if (!btn) continue;
        
        btn.classList.remove('active-nav');
        
        // Cập nhật trạng thái đúng sai nếu đã trả lời
        if (userAnswers[i] !== undefined) {
            if (isRandomMode) {
                btn.style.background = 'rgba(99, 102, 241, 0.2)'; // Blueish neutral
                btn.style.borderColor = 'var(--primary)';
            } else {
                const q = quizQuestions[i];
                const chosenIndex = userAnswers[i];
                if (q.options[chosenIndex] === q.correct_answer) {
                    btn.classList.add('answered');
                } else {
                    btn.classList.add('answered-wrong');
                }
            }
        }

        const displayMode = document.getElementById('display-mode') ? document.getElementById('display-mode').value : 'single';
        if (displayMode === 'single') {
            if (i === currentQuestionIndex) {
                btn.classList.add('active-nav');
                btn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }
}

function jumpToQuestion(index) {
    const displayMode = document.getElementById('display-mode') ? document.getElementById('display-mode').value : 'single';
    if (displayMode === 'single') {
        currentQuestionIndex = index;
        loadQuestion();
    } else {
        const block = document.getElementById(`q-block-${index}`);
        if (block) {
            block.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.add('hidden');
    }
}

function startTimer() {
    clearInterval(timerInterval);
    const timeDisplay = document.getElementById('time-display');
    
    if (isRandomMode) {
        let timeLeft = 60 * 60; // 60 minutes
        timeDisplay.innerText = formatTime(timeLeft);
        timerInterval = setInterval(() => {
            timeLeft--;
            timeElapsed++;
            timeDisplay.innerText = formatTime(timeLeft);
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                submitQuiz();
            }
        }, 1000);
    } else {
        timeDisplay.innerText = formatTime(timeElapsed);
        timerInterval = setInterval(() => {
            timeElapsed++;
            timeDisplay.innerText = formatTime(timeElapsed);
        }, 1000);
    }
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

function loadQuestion() {
    const q = quizQuestions[currentQuestionIndex];
    document.getElementById('question-text').innerHTML = `<strong>Câu ${q.id}:</strong> ${q.question}`;
    document.getElementById('question-counter').innerText = `Câu ${currentQuestionIndex + 1}/${quizQuestions.length}`;
    
    const progress = ((currentQuestionIndex) / quizQuestions.length) * 100;
    document.getElementById('progress-bar').style.width = `${progress}%`;

    const optionsGrid = document.getElementById('options-grid');
    optionsGrid.innerHTML = '';

    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    
    q.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        
        if (userAnswers[currentQuestionIndex] !== undefined) {
            if (isRandomMode) {
                if (idx === userAnswers[currentQuestionIndex]) {
                    btn.classList.add('selected');
                }
            } else {
                btn.disabled = true;
                if (idx === userAnswers[currentQuestionIndex]) {
                    btn.classList.add('selected');
                }
                if (opt === q.correct_answer) {
                    btn.classList.add('correct-ans');
                } else if (idx === userAnswers[currentQuestionIndex]) {
                    btn.classList.add('wrong-ans');
                }
            }
        }
        
        btn.onclick = () => selectOption(idx, opt);
        
        btn.innerHTML = `
            <div class="option-icon">${letters[idx] || '-'}</div>
            <div class="option-text">${opt}</div>
        `;
        optionsGrid.appendChild(btn);
    });

    // Xử lý nút và giải thích
    const explainBox = document.getElementById('explanation-box');
    if (userAnswers[currentQuestionIndex] !== undefined && !isRandomMode) {
        explainBox.classList.remove('hidden');
        document.getElementById('explanation-correct-ans').innerText = q.correct_answer;
        document.getElementById('explanation-text').innerText = q.explanation || "Đang cập nhật giải thích chi tiết từ hệ thống...";
        
        // Add Google Search button
        const searchBtn = document.getElementById('btn-google-search');
        if (!searchBtn) {
            const btn = document.createElement('button');
            btn.id = 'btn-google-search';
            btn.className = 'btn secondary btn-sm mt-2';
            btn.innerHTML = '<i class="fa-brands fa-google"></i> Tra cứu giải thích trên mạng';
            btn.style.marginTop = '10px';
            btn.onclick = () => {
                const query = encodeURIComponent(`${q.question} ${q.correct_answer}`);
                window.open(`https://www.google.com/search?q=${query}`, '_blank');
            };
            document.querySelector('.explanation-content').appendChild(btn);
        } else {
            searchBtn.onclick = () => {
                const query = encodeURIComponent(`${q.question} ${q.correct_answer}`);
                window.open(`https://www.google.com/search?q=${query}`, '_blank');
            };
        }
    } else {
        explainBox.classList.add('hidden');
    }

    document.getElementById('btn-prev').disabled = currentQuestionIndex === 0;
    
    // Nếu là chế độ ngẫu nhiên thì luôn cho phép chuyển câu.
    // Nếu đã làm hết tất cả các câu (hoặc ở câu cuối), hiện nút Nộp Bài
    if (currentQuestionIndex === quizQuestions.length - 1) {
        document.getElementById('btn-next').classList.add('hidden');
        document.getElementById('btn-submit').classList.remove('hidden');
    } else {
        document.getElementById('btn-next').classList.remove('hidden');
        document.getElementById('btn-submit').classList.add('hidden');
    }

    updateSidebar();
}

function selectOption(idx, optText) {
    const q = quizQuestions[currentQuestionIndex];
    userAnswers[currentQuestionIndex] = idx;
    
    if (isRandomMode) {
        const options = document.querySelectorAll('.option-btn');
        options.forEach((btn, i) => {
            btn.classList.remove('selected');
            if (i === idx) {
                btn.classList.add('selected');
            }
        });
        updateSidebar();
        return;
    }
    
    const options = document.querySelectorAll('.option-btn');
    options.forEach((btn, i) => {
        btn.disabled = true;
        if (i === idx) {
            btn.classList.add('selected');
            if (optText !== q.correct_answer) {
                btn.classList.add('wrong-ans');
            }
        }
        if (q.options[i] === q.correct_answer) {
            btn.classList.add('correct-ans');
        }
    });

    // Practice mode score update
    if (optText === q.correct_answer) {
        score++;
    }

    // Hiện giải thích
    const explainBox = document.getElementById('explanation-box');
    explainBox.classList.remove('hidden');
    document.getElementById('explanation-correct-ans').innerText = q.correct_answer;
    document.getElementById('explanation-text').innerText = q.explanation || "Đang cập nhật giải thích chi tiết từ hệ thống...";
    
    // Add Google Search button
    const searchBtn = document.getElementById('btn-google-search');
    if (!searchBtn) {
        const btn = document.createElement('button');
        btn.id = 'btn-google-search';
        btn.className = 'btn secondary btn-sm mt-2';
        btn.innerHTML = '<i class="fa-brands fa-google"></i> Tra cứu giải thích trên mạng';
        btn.style.marginTop = '10px';
        btn.onclick = () => {
            const query = encodeURIComponent(`${q.question} ${q.correct_answer}`);
            window.open(`https://www.google.com/search?q=${query}`, '_blank');
        };
        document.querySelector('.explanation-content').appendChild(btn);
    } else {
        searchBtn.onclick = () => {
            const query = encodeURIComponent(`${q.question} ${q.correct_answer}`);
            window.open(`https://www.google.com/search?q=${query}`, '_blank');
        };
    }

    updateSidebar();

    // Auto next logic disabled by user request
}

function nextQuestion() {
    if (currentQuestionIndex < quizQuestions.length - 1) {
        currentQuestionIndex++;
        loadQuestion();
    }
}

function prevQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        loadQuestion();
    }
}

function submitQuiz() {
    clearInterval(timerInterval);
    
    // Check if any questions are unanswered
    const total = quizQuestions.length;
    const unanswered = total - Object.keys(userAnswers).length;
    if (unanswered > 0) {
        if (!confirm(`Bạn còn ${unanswered} câu chưa làm. Bạn có chắc chắn muốn nộp bài?`)) return;
    }
    
    // Calculate final score
    score = 0;
    quizQuestions.forEach((q, i) => {
        if (userAnswers[i] !== undefined && q.options[userAnswers[i]] === q.correct_answer) {
            score++;
        }
    });
    
    document.getElementById('progress-bar').style.width = '100%';
    
    setTimeout(() => {
        switchScreen('result');
        
        const total = quizQuestions.length;
        const percentage = Math.round((score / total) * 100);
        const score10 = (score / total * 10).toFixed(2); // Thang điểm 10
        
        document.getElementById('correct-count').innerText = score;
        document.getElementById('incorrect-count').innerText = total - score;
        document.getElementById('time-spent').innerText = formatTime(timeElapsed);
        
        document.getElementById('score-percentage').innerHTML = `${score10}<span style="font-size: 14px">/10</span>`;
        const circlePath = document.getElementById('score-circle-path');
        circlePath.style.strokeDasharray = `${percentage}, 100`;
        
        if (percentage >= 80) {
            circlePath.style.stroke = 'var(--success)';
        } else if (percentage >= 50) {
            circlePath.style.stroke = 'var(--warning)';
        } else {
            circlePath.style.stroke = 'var(--danger)';
        }
        
    }, 500);
}

function reviewAnswers() {
    switchScreen('review');
    const reviewList = document.getElementById('review-list');
    reviewList.innerHTML = '';
    
    quizQuestions.forEach((q, qIndex) => {
        const item = document.createElement('div');
        item.className = 'review-item';
        
        let optsHtml = '';
        q.options.forEach((opt, oIndex) => {
            let cssClass = 'rev-opt';
            if (opt === q.correct_answer) {
                cssClass += ' correct';
            } else if (userAnswers[qIndex] === oIndex) {
                cssClass += ' incorrect';
            }
            
            optsHtml += `<div class="${cssClass}">
                ${opt}
                ${opt === q.correct_answer ? ' <i class="fa-solid fa-check float-right text-success"></i>' : ''}
                ${userAnswers[qIndex] === oIndex && opt !== q.correct_answer ? ' <i class="fa-solid fa-times float-right text-danger"></i>' : ''}
            </div>`;
        });
        
        item.innerHTML = `
            <div class="review-q">Câu ${q.id}: ${q.question}</div>
            <div class="review-opts">${optsHtml}</div>
        `;
        reviewList.appendChild(item);
    });
}

function showResultScreen() {
    switchScreen('result');
}

// =====================================
// ALL QUESTIONS MODE LOGIC
// =====================================
function renderAllQuestions() {
    const container = document.getElementById('all-questions-container');
    container.innerHTML = '';
    
    quizQuestions.forEach((q, qIndex) => {
        const qBlock = document.createElement('div');
        qBlock.className = 'question-block';
        qBlock.id = `q-block-${qIndex}`;
        qBlock.style.marginBottom = '40px';
        qBlock.style.borderBottom = '1px solid var(--border-color)';
        qBlock.style.paddingBottom = '20px';
        
        let html = `
            <div class="question-box" style="margin-bottom: 15px;">
                <h2><strong>Câu ${q.id}:</strong> ${q.question}</h2>
            </div>
            <div class="options-grid" id="opts-grid-${qIndex}">
        `;
        
        const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
        q.options.forEach((opt, optIndex) => {
            const escapedOpt = opt.replace(/'/g, "\\'").replace(/"/g, '&quot;');
            html += `
                <button class="option-btn" id="btn-opt-${qIndex}-${optIndex}" onclick="selectOptionAllMode(${qIndex}, ${optIndex}, '${escapedOpt}')">
                    <div class="option-icon">${letters[optIndex] || '-'}</div>
                    <div class="option-text">${opt}</div>
                </button>
            `;
        });
        
        html += `</div>`; // end options-grid
        
        html += `
            <div id="explain-box-${qIndex}" class="explanation-box hidden" style="margin-top: 15px;">
                <h4><i class="fa-solid fa-lightbulb"></i> Đáp án & Giải thích</h4>
                <div class="explanation-content">
                    <p><strong>Đáp án đúng:</strong> <span class="text-success">${q.correct_answer}</span></p>
                    <p class="explanation-detail">${q.explanation || 'Đang cập nhật giải thích chi tiết từ hệ thống...'}</p>
                </div>
            </div>
        `;
        
        qBlock.innerHTML = html;
        container.appendChild(qBlock);
    });
    
    // Add Submit button at the very bottom
    const submitBtn = document.createElement('button');
    submitBtn.className = 'btn success';
    submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Nộp bài (Kéo lên trên để xem tiến độ)';
    submitBtn.style.marginTop = '20px';
    submitBtn.style.width = '100%';
    submitBtn.onclick = submitQuiz;
    container.appendChild(submitBtn);
}

function selectOptionAllMode(qIndex, optIndex, optText) {
    const q = quizQuestions[qIndex];
    userAnswers[qIndex] = optIndex;
    
    const grid = document.getElementById(`opts-grid-${qIndex}`);
    const btns = grid.querySelectorAll('.option-btn');
    
    if (isRandomMode) {
        btns.forEach((btn, i) => {
            btn.classList.remove('selected');
            if (i === optIndex) btn.classList.add('selected');
        });
    } else {
        btns.forEach((btn, i) => {
            btn.disabled = true;
            if (i === optIndex) {
                btn.classList.add('selected');
                if (optText !== q.correct_answer) btn.classList.add('wrong-ans');
            }
            if (q.options[i] === q.correct_answer) {
                btn.classList.add('correct-ans');
            }
        });
        
        // Show explanation
        document.getElementById(`explain-box-${qIndex}`).classList.remove('hidden');
        
        if (optText === q.correct_answer) {
            score++;
        }
    }
    
    // Update progress bar
    const progress = (Object.keys(userAnswers).length / quizQuestions.length) * 100;
    document.getElementById('progress-bar').style.width = `${progress}%`;
    document.getElementById('question-counter').innerText = `Đã làm ${Object.keys(userAnswers).length}/${quizQuestions.length}`;
    
    updateSidebar();
}

// =====================================
// STUDY MODE LOGIC
// =====================================
function openStudyMode() {
    if (!window.QUIZ_DATA) return;
    switchScreen('study');
    const container = document.getElementById('study-list');
    container.innerHTML = '';
    
    window.QUIZ_DATA.forEach((q) => {
        const item = document.createElement('div');
        item.className = 'review-item study-item';
        let optsHtml = '';
        const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
        q.options.forEach((opt, oIndex) => {
            const isCorrect = (opt === q.correct_answer);
            const cssClass = isCorrect ? 'rev-opt correct' : 'rev-opt';
            const icon = isCorrect ? ' <i class="fa-solid fa-check float-right text-success" style="float: right;"></i>' : '';
            optsHtml += `<div class="${cssClass}" style="margin-top: 4px;"><strong>${letters[oIndex] || '-'}.</strong> ${opt}${icon}</div>`;
        });

        item.innerHTML = `
            <div class="review-q" style="margin-bottom: 8px;"><strong>Câu ${q.id}:</strong> ${q.question}</div>
            <div class="review-opts">${optsHtml}</div>
        `;
        container.appendChild(item);
    });
}

function filterStudyQuestions() {
    const query = document.getElementById('search-input').value.toLowerCase();
    const items = document.querySelectorAll('.study-item');
    items.forEach(item => {
        const text = item.innerText.toLowerCase();
        if (text.includes(query)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function openGroupStudyMode() {
    if (!window.QUIZ_DATA) return;
    switchScreen('groupStudy');
    const container = document.getElementById('group-study-list');
    container.innerHTML = '';
    
    const groups = {};
    const originalOptsMap = {};
    
    window.QUIZ_DATA.forEach(q => {
        const options = q.options || [];
        const normOpts = options.map(opt => String(opt).trim().toLowerCase()).sort().join('|');
        
        if (!groups[normOpts]) {
            groups[normOpts] = [];
            originalOptsMap[normOpts] = [...options].map(opt => String(opt).trim()).sort();
        }
        groups[normOpts].push(q);
    });
    
    const multiGroups = [];
    const singleGroups = [];
    
    Object.keys(groups).forEach(key => {
        if (groups[key].length > 1) {
            multiGroups.push(key);
        } else {
            singleGroups.push(groups[key][0]);
        }
    });
    
    multiGroups.sort((a, b) => groups[b].length - groups[a].length);
    
    let groupCounter = 1;
    multiGroups.forEach(key => {
        const qList = groups[key];
        const preview = originalOptsMap[key].slice(0, 4).join(', ') + (originalOptsMap[key].length > 4 ? ',...' : '');
        
        const groupHeader = document.createElement('div');
        groupHeader.className = 'group-study-header';
        groupHeader.innerHTML = `<h3>Dạng ${groupCounter}: Nhóm có đáp án (${preview}) - ${qList.length} câu <i class="fa-solid fa-chevron-down"></i></h3>`;
        container.appendChild(groupHeader);
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'group-study-content hidden';
        renderQuestionsToContainer(qList, contentDiv);
        container.appendChild(contentDiv);
        
        groupHeader.onclick = () => {
            contentDiv.classList.toggle('hidden');
            const icon = groupHeader.querySelector('i');
            if(contentDiv.classList.contains('hidden')){
                icon.classList.remove('fa-chevron-up');
                icon.classList.add('fa-chevron-down');
            } else {
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-up');
            }
        };

        groupCounter++;
    });
    
    if (singleGroups.length > 0) {
        const groupHeader = document.createElement('div');
        groupHeader.className = 'group-study-header';
        groupHeader.innerHTML = `<h3>Các câu hỏi có bộ đáp án riêng biệt - ${singleGroups.length} câu <i class="fa-solid fa-chevron-down"></i></h3>`;
        container.appendChild(groupHeader);
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'group-study-content hidden';
        singleGroups.sort((a, b) => parseInt(a.id) - parseInt(b.id));
        renderQuestionsToContainer(singleGroups, contentDiv);
        container.appendChild(contentDiv);
        
        groupHeader.onclick = () => {
            contentDiv.classList.toggle('hidden');
            const icon = groupHeader.querySelector('i');
            if(contentDiv.classList.contains('hidden')){
                icon.classList.remove('fa-chevron-up');
                icon.classList.add('fa-chevron-down');
            } else {
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-up');
            }
        };
    }
}

function renderQuestionsToContainer(qList, container) {
    qList.forEach(q => {
        const item = document.createElement('div');
        item.className = 'review-item study-item';
        let optsHtml = '';
        const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
        q.options.forEach((opt, oIndex) => {
            const isCorrect = (String(opt).trim() === String(q.correct_answer).trim());
            const cssClass = isCorrect ? 'rev-opt correct' : 'rev-opt';
            const icon = isCorrect ? ' <i class="fa-solid fa-check float-right text-success" style="float: right;"></i>' : '';
            optsHtml += `<div class="${cssClass}" style="margin-top: 4px;"><strong>${letters[oIndex] || '-'}.</strong> ${opt}${icon}</div>`;
        });

        item.innerHTML = `
            <div class="review-q" style="margin-bottom: 8px;"><strong>Câu ${q.id}:</strong> ${q.question}</div>
            <div class="review-opts">${optsHtml}</div>
        `;
        container.appendChild(item);
    });
}

const modeToggle = document.querySelector('.mode-toggle');
modeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    const icon = modeToggle.querySelector('i');
    if (document.body.classList.contains('light-mode')) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
});
