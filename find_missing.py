import json
import re

# Load JSON
with open('quiz_data_final.js', 'r', encoding='utf-8') as f:
    js_content = f.read()
    data = json.loads(re.sub(r'^window\.QUIZ_DATA\s*=\s*|;$', '', js_content.strip()))

web_questions = []
for item in data:
    q = item['question'].replace('\n', ' ').strip().lower()
    q = re.sub(r'\s+', ' ', q)
    web_questions.append({'id': item['id'], 'text': q})

# Load PDF
with open('pdf_sample.txt', 'r', encoding='utf-8') as f:
    pdf_content = f.read()

pdf_questions = []
lines = pdf_content.split('\n')
for line in lines:
    m = re.match(r'^(\d+)\.(.*)', line.strip())
    if m:
        q_id = int(m.group(1))
        q_text = m.group(2).strip().lower()
        q_text = re.sub(r'\s+', ' ', q_text)
        pdf_questions.append({'id': q_id, 'text': q_text})

missing_in_web = []
for pq in pdf_questions:
    # Ignore if text is too short
    if len(pq['text']) < 10:
        continue
    
    # Check if this pdf question text is in any web question
    found = False
    for wq in web_questions:
        if pq['text'] in wq['text'] or wq['text'] in pq['text']:
            found = True
            break
            
    if not found:
        # Check similarity just in case
        missing_in_web.append(pq)

print("--- CÁC CÂU TRONG PDF NHƯNG KHÔNG CÓ TRÊN WEB ---")
for q in missing_in_web:
    print(f"Câu {q['id']}: {q['text']}")
print(f"Tổng số câu PDF bị thiếu trên Web: {len(missing_in_web)}")
