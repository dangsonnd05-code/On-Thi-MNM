import json
import re

def clean_html(raw_html):
    cleanr = re.compile('<.*?>')
    cleantext = re.sub(cleanr, '', raw_html)
    return cleantext.strip()

def main():
    try:
        with open('extracted_qa.json', 'r', encoding='utf-8') as f:
            qa_list = json.load(f)
    except:
        print("Wait for extracted_qa.json to be created")
        return

    try:
        with open('quiz_data_real.json', 'r', encoding='utf-8') as f:
            real_data = json.load(f)
            qs = real_data.get('room', {}).get('questions', real_data.get('questions', {}))
            qs_list = list(qs.values())
    except:
        print("quiz_data_real.json not found")
        return

    final_quiz = []
    
    # map by order or by similarity
    for i, q in enumerate(qs_list):
        structure = q.get('structure', {})
        q_text = clean_html(structure.get('query', {}).get('text', ''))
        
        options = [clean_html(opt.get('text', '')) for opt in structure.get('options', [])]
        
        # find matching answer from extracted_qa
        correct_answer = options[0] if options else "Unknown"
        
        if i < len(qa_list):
            extracted = qa_list[i]
            correct_answer = clean_html(extracted.get('correctAnswer', 'Unknown'))
        
        final_quiz.append({
            'id': i + 1,
            'question': q_text,
            'options': options,
            'correct_answer': correct_answer
        })

    with open('quiz_data_final.js', 'w', encoding='utf-8') as f:
        f.write("window.QUIZ_DATA = " + json.dumps(final_quiz, ensure_ascii=False, indent=2) + ";\n")
    
    print(f"Generated quiz_data_final.js with {len(final_quiz)} questions.")
    
    # Also generate dap_an_ban_in.html for printing
    html_content = """<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Mã Nguồn Mở - Đáp Án PDF</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        .question-block { margin-bottom: 25px; page-break-inside: avoid; }
        .q-title { font-weight: bold; font-size: 1.1em; margin-bottom: 10px; }
        .options { margin-left: 20px; }
        .option { margin-bottom: 5px; }
        .correct { color: #10b981; font-weight: bold; }
        .print-btn { display: block; margin: 20px 0; padding: 10px 20px; background: #6366f1; color: white; text-align: center; cursor: pointer; border: none; border-radius: 5px; font-size: 16px; width: 100%; }
        @media print { .print-btn { display: none; } }
    </style>
</head>
<body>
    <button class="print-btn" onclick="window.print()">In Ra PDF (Ctrl+P)</button>
    <h1 style="text-align: center;">BỘ ĐỀ ÔN TẬP MÃ NGUỒN MỞ</h1>
    <h3 style="text-align: center; color: #666;">299 CÂU HỎI TRẮC NGHIỆM</h3>
    <hr>
"""
    letters = ['A', 'B', 'C', 'D', 'E', 'F']
    for idx, item in enumerate(final_quiz):
        html_content += f'<div class="question-block">\n'
        html_content += f'    <div class="q-title">Câu {idx + 1}: {item["question"]}</div>\n'
        html_content += f'    <div class="options">\n'
        
        for o_idx, opt in enumerate(item['options']):
            is_correct = opt == item['correct_answer']
            css_class = 'option correct' if is_correct else 'option'
            mark = '✓ ' if is_correct else ''
            html_content += f'        <div class="{css_class}">{letters[o_idx]}. {mark}{opt}</div>\n'
        
        html_content += f'    </div>\n'
        html_content += f'</div>\n'

    html_content += "</body></html>"
    
    with open('dap_an_ban_in.html', 'w', encoding='utf-8') as f:
        f.write(html_content)

    print("Generated dap_an_ban_in.html")

if __name__ == '__main__':
    main()
