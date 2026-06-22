import json
import re

with open(r'C:\Users\Admin\Downloads\du_lieu_tho_299_cau.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

parsed_results = []
for item in data:
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
                
    correct_ans = ''
    # Combine all options_html to make sure we search everything
    all_html = " ".join(options_html)
    
    # Lấy chính xác cái thẻ có "is-correct"
    # Thẻ option có dạng: <div class="option ... is-correct" ...> <span class="text...">Nội dung</span> </div>
    matches = re.findall(r'<div[^>]*class="[^"]*option[^"]*is-correct[^"]*"[^>]*>(.*?)</div>', all_html)
    if matches:
        for match in matches:
            # Lấy nội dung bên trong thẻ span
            span_match = re.search(r'<span[^>]*class="[^"]*text[^"]*"[^>]*>(.*?)</span>', match)
            if span_match:
                correct_ans = span_match.group(1).strip()
                break
            else:
                correct_ans = re.sub(r'<[^>]+>', '', match).strip()
                break

    parsed_results.append({
        'question': question_text,
        'correctAnswer': correct_ans
    })

unique_results = []
seen = set()
for r in parsed_results:
    q = r['question']
    if q not in seen:
        seen.add(q)
        unique_results.append(r)

print(f'Tổng số câu hỏi duy nhất: {len(unique_results)}')
if len(unique_results) > 0:
    print('Câu 1:', unique_results[0])
    print('Câu cuối:', unique_results[-1])

with open('parsed_tho_answers.json', 'w', encoding='utf-8') as f:
    json.dump(unique_results, f, indent=2, ensure_ascii=False)
