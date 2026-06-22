import json
import re

with open('quiz_data_final.js', 'r', encoding='utf-8') as f:
    js_content = f.read()
    data = json.loads(re.sub(r'^window\.QUIZ_DATA\s*=\s*|;$', '', js_content.strip()))

js_ids = set([item['id'] for item in data])

with open('pdf_sample.txt', 'r', encoding='utf-8') as f:
    pdf_text = f.read()

pdf_ids = set()
for line in pdf_text.split('\n'):
    m = re.match(r'^(\d+)\.', line)
    if m:
        pdf_ids.add(int(m.group(1)))

print('So cau trong JS:', len(js_ids))
print('So cau trong PDF:', len(pdf_ids))

missing_in_js = sorted(list(pdf_ids - js_ids))
missing_in_pdf = sorted(list(js_ids - pdf_ids))

print('Cac cau co trong PDF nhung KHONG co trong Web App:', missing_in_js)
print('Cac cau co trong Web App nhung KHONG co trong PDF:', missing_in_pdf)
