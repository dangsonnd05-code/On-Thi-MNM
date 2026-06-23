import docx
import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

doc_in = docx.Document('Dang.docx')

dang_data = []
current_q = None

lines = []
for p in doc_in.paragraphs:
    text = p.text.strip()
    if text:
        lines.append(text)

for line in lines:
    if re.match(r'^((Câu\s*\d+\s*[:\.]\s*)|(\d+\s*[\.\)]\s*))', line, re.IGNORECASE):
        if current_q:
            dang_data.append(current_q)
        current_q = {
            "id": f"D{len(dang_data)+1}",
            "question": line,
            "options": [],
            "correct_answer": "",
            "explanation": "Câu hỏi từ file Dang.docx"
        }
    elif current_q:
        ans_match = re.match(r'^Đáp\s*án\s*([A-Z])', line, re.IGNORECASE)
        if ans_match:
            ans_letter = ans_match.group(1).upper()
            idx = ord(ans_letter) - ord('A')
            if 0 <= idx < len(current_q["options"]):
                current_q["correct_answer"] = current_q["options"][idx]
            else:
                current_q["correct_answer"] = "Lỗi: Không tìm thấy đáp án " + ans_letter
        else:
            if line == "phải":
                current_q["question"] += " " + line
            else:
                current_q["options"].append(line)

if current_q:
    dang_data.append(current_q)

js_out = "window.DANG_QUIZ_DATA = " + json.dumps(dang_data, ensure_ascii=False, indent=4) + ";"
with open('dang_quiz_data.js', 'w', encoding='utf-8') as f:
    f.write(js_out)

print(f"Parsed {len(dang_data)} questions into dang_quiz_data.js")
