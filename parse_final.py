import json
import re

def clean_html(raw_html):
    cleanr = re.compile('<.*?>')
    cleantext = re.sub(cleanr, '', raw_html)
    return cleantext.strip().replace('&nbsp;', ' ')

def main():
    try:
        with open('quiz_data_real.json', 'r', encoding='utf-8') as f:
            real_data = json.load(f)
            qs = real_data.get('room', {}).get('questions', real_data.get('questions', {}))
            qs_list = list(qs.values())
    except Exception as e:
        print("quiz_data_real.json not found", e)
        return

    final_quiz = []
    
    for i, q in enumerate(qs_list):
        structure = q.get('structure', {})
        q_text = clean_html(structure.get('query', {}).get('text', ''))
        
        options = [clean_html(opt.get('text', '')) for opt in structure.get('options', [])]
        
        # We don't have the correct answers from the server.
        # We will just leave it empty.
        correct_answer = ""
        
        final_quiz.append({
            'id': i + 1,
            'question': q_text,
            'options': options,
            'correct_answer': correct_answer
        })

    with open('quiz_data_final.js', 'w', encoding='utf-8') as f:
        f.write("window.QUIZ_DATA = " + json.dumps(final_quiz, ensure_ascii=False, indent=2) + ";\n")
    
    print(f"Generated quiz_data_final.js with {len(final_quiz)} questions.")
    
    html_content = """<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Mã Nguồn Mở - 299 Câu Hỏi (Bản In)</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; max-width: 800px; margin: 0 auto; padding: 30px; background-color: #f8fafc; }
        .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0; }
        .header h1 { color: #0f172a; margin-bottom: 10px; font-size: 28px; }
        .header p { color: #64748b; font-size: 16px; margin: 0; }
        .question-block { background: #ffffff; border: 1px solid #e2e8f0; padding: 20px; margin-bottom: 25px; border-radius: 8px; page-break-inside: avoid; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .q-title { font-weight: 600; font-size: 1.1em; margin-bottom: 15px; color: #0f172a; }
        .options { margin-left: 10px; }
        .option { margin-bottom: 8px; padding: 8px 12px; border-radius: 4px; border: 1px solid #f1f5f9; background: #f8fafc; }
        .print-btn { display: block; margin: 20px auto; padding: 12px 24px; background: #4f46e5; color: white; text-align: center; cursor: pointer; border: none; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2); transition: all 0.2s; }
        .print-btn:hover { background: #4338ca; transform: translateY(-1px); }
        @media print { 
            .print-btn { display: none; } 
            body { background-color: white; padding: 0; }
            .question-block { border: none; box-shadow: none; padding: 10px 0; border-bottom: 1px solid #eee; margin-bottom: 15px; }
        }
    </style>
</head>
<body>
    <button class="print-btn" onclick="window.print()"><i class="fa-solid fa-print"></i> Lưu PDF / In Tài Liệu</button>
    <div class="header">
        <h1>BỘ ĐỀ ÔN TẬP MÃ NGUỒN MỞ</h1>
        <p>Tổng hợp 299 câu hỏi trắc nghiệm tự ôn luyện</p>
    </div>
"""
    letters = ['A', 'B', 'C', 'D', 'E', 'F']
    for idx, item in enumerate(final_quiz):
        html_content += f'<div class="question-block">\n'
        html_content += f'    <div class="q-title">Câu {idx + 1}: {item["question"]}</div>\n'
        html_content += f'    <div class="options">\n'
        
        for o_idx, opt in enumerate(item['options']):
            html_content += f'        <div class="option"><strong>{letters[o_idx]}.</strong> {opt}</div>\n'
        
        html_content += f'    </div>\n'
        html_content += f'</div>\n'

    html_content += "</body></html>"
    
    with open('dap_an_ban_in.html', 'w', encoding='utf-8') as f:
        f.write(html_content)

    print("Generated dap_an_ban_in.html")

if __name__ == '__main__':
    main()
