import json
import re

with open('parsed_tho_answers.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Build a dictionary to map question text to correct answer
# To handle minor differences, we'll strip numbers and punctuation
def normalize_text(text):
    # Remove leading numbers and dots/spaces
    text = re.sub(r'^\d+[\.\)\-]\s*', '', text)
    # Remove all whitespace
    text = re.sub(r'\s+', '', text)
    return text.lower()

scraped_dict = {}
for item in data:
    q_norm = normalize_text(item['question'])
    scraped_dict[q_norm] = item['correctAnswer'].strip()

# Now let's read the original 299 questions from quiz_data_real.json or similar?
# Wait, the user already gave me the DOM data earlier or I can just use the scraped data directly!
# The scraped data `parsed_tho_answers.json` HAS 299 questions!
# We just need to extract the options for each question from `du_lieu_tho_299_cau.json`!

with open(r'C:\Users\Admin\Downloads\du_lieu_tho_299_cau.json', 'r', encoding='utf-8') as f:
    raw_data = json.load(f)

final_questions = []
seen = set()

for item in raw_data:
    full_text = item.get('fullText', '')
    options_html = item.get('optionsHtml', [])
    
    question_text = ''
    lines = full_text.split('\n')
    for line in lines:
        line = line.strip()
        if not line or line.startswith('Question ') or re.match(r'^\d+\.\d+s$', line) or re.match(r'^\d+ / \d+ pts$', line) or line.startswith('Điểm:'):
            continue
        if re.match(r'^\d+\.', line):
            question_text = line
            break
            
    if not question_text:
        for line in lines:
            if line and not line.startswith('Question') and not 'pts' in line and not 'Điểm:' in line and 's' not in line:
                question_text = line
                break
                
    if not question_text or question_text in seen:
        continue
    seen.add(question_text)
    
    # Get options text
    options = []
    all_html = " ".join(options_html)
    
    # Trích xuất tất cả các option
    # Thẻ option: <div class="option text-option..."><span class="text...">Text</span></div>
    opt_matches = re.findall(r'<div[^>]*class="[^"]*option[^"]*"[^>]*>(.*?)</div>', all_html)
    
    for match in opt_matches:
        span_match = re.search(r'<span[^>]*class="[^"]*text[^"]*"[^>]*>(.*?)</span>', match)
        if span_match:
            opt_text = span_match.group(1).strip()
            if opt_text and opt_text not in options:
                options.append(opt_text)
        else:
            opt_text = re.sub(r'<[^>]+>', '', match).strip()
            if opt_text and opt_text not in options:
                options.append(opt_text)
                
    # Get correct answer
    correct_ans = ''
    c_matches = re.findall(r'<div[^>]*class="[^"]*option[^"]*is-correct[^"]*"[^>]*>(.*?)</div>', all_html)
    if c_matches:
        for match in c_matches:
            span_match = re.search(r'<span[^>]*class="[^"]*text[^"]*"[^>]*>(.*?)</span>', match)
            if span_match:
                correct_ans = span_match.group(1).strip()
                break
            else:
                correct_ans = re.sub(r'<[^>]+>', '', match).strip()
                break
                
    # Determine question index for sorting
    idx_match = re.search(r'^(\d+)\.', question_text)
    idx = int(idx_match.group(1)) if idx_match else 9999
    
    # Sạch sẽ text câu hỏi
    clean_q = re.sub(r'^\d+\.\s*', '', question_text).strip()
    
    final_questions.append({
        'id': idx,
        'question': clean_q,
        'options': options,
        'correct_answer': correct_ans
    })

# Sort by id
final_questions.sort(key=lambda x: x['id'])

js_content = "const quizData = " + json.dumps(final_questions, indent=4, ensure_ascii=False) + ";\n"

with open('quiz_data_final.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f"Thành công! Đã ghi {len(final_questions)} câu hỏi vào quiz_data_final.js")
