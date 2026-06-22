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
    review: document.getElementById('review-screen')
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
    loadQuestion();
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

        if (i === currentQuestionIndex) {
            btn.classList.add('active-nav');
            btn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
}

function jumpToQuestion(index) {
    currentQuestionIndex = index;
    loadQuestion();
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
