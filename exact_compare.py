import json
import re

# Load JSON
with open('quiz_data_final.js', 'r', encoding='utf-8') as f:
    js_content = f.read()
    data = json.loads(re.sub(r'^window\.QUIZ_DATA\s*=\s*|;$', '', js_content.strip()))

# Clean up JS text
js_texts = []
for item in data:
    # remove number prefix if any
    q = re.sub(r'^\d+\.', '', item['question']).strip().lower()
    q = re.sub(r'\s+', ' ', q)
    js_texts.append(q)

# Load PDF
with open('pdf_sample.txt', 'r', encoding='utf-8') as f:
    pdf_content = f.read()

# Try to extract questions from PDF based on "number."
pdf_texts = []
lines = pdf_content.split('\n')
current_q = ""
for line in lines:
    m = re.match(r'^\d+\.(.*)', line.strip())
    if m:
        if current_q:
            pdf_texts.append(current_q)
        current_q = m.group(1).strip().lower()
    else:
        if current_q and line.strip() and not re.match(r'^[A-F]\.|^Nhiều lựa chọn|^30 sec|^1 pt', line.strip(), re.I):
            current_q += " " + line.strip().lower()
if current_q:
    pdf_texts.append(current_q)

# Clean PDF texts
clean_pdf_texts = []
for q in pdf_texts:
    # Remove some extra lines that might get appended
    q = re.sub(r'messages\.downloaded_by.*', '', q)
    q = re.sub(r'lomoarcpsd\|.*', '', q)
    q = re.sub(r'\s+', ' ', q).strip()
    if q:
        clean_pdf_texts.append(q)

js_set = set(js_texts)
pdf_set = set(clean_pdf_texts)

in_js_not_pdf = js_set - pdf_set
in_pdf_not_js = pdf_set - js_set

print(f"Tổng số câu trong Web: {len(js_set)}")
print(f"Tổng số câu trong PDF: {len(pdf_set)}")
print(f"Số câu có trong Web nhưng KHÔNG có trong PDF: {len(in_js_not_pdf)}")
print(f"Số câu có trong PDF nhưng KHÔNG có trong Web: {len(in_pdf_not_js)}")
