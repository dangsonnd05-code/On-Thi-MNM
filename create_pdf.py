import json
import re
from fpdf import FPDF

# Load Data
with open('quiz_data_final.js', 'r', encoding='utf-8') as f:
    js_content = f.read()
    data = json.loads(re.sub(r'^window\.QUIZ_DATA\s*=\s*|;$', '', js_content.strip()))

# Initialize PDF
pdf = FPDF()
pdf.add_page()
pdf.set_auto_page_break(auto=True, margin=15)

# Use Arial font for Vietnamese
pdf.add_font('Arial', '', r'C:\Windows\Fonts\arial.ttf')
pdf.add_font('Arial', 'B', r'C:\Windows\Fonts\arialbd.ttf')
pdf.add_font('Arial', 'I', r'C:\Windows\Fonts\ariali.ttf')

pdf.set_font('Arial', 'B', 16)
pdf.cell(0, 10, 'TÀI LIỆU ÔN THI MÃ NGUỒN MỞ - 299 CÂU (BẢN CHUẨN)', new_x="LMARGIN", new_y="NEXT", align='C')
pdf.ln(10)

for i, item in enumerate(data):
    q_text = f"Câu {item['id']}: {item['question'].replace(chr(10), ' ')}"
    pdf.set_font('Arial', 'B', 12)
    pdf.set_x(10)
    pdf.multi_cell(0, 8, text=q_text, align='L', new_x="LMARGIN", new_y="NEXT")
    
    letters = ['A', 'B', 'C', 'D', 'E', 'F']
    for idx, opt in enumerate(item['options']):
        opt_text = f"{letters[idx]}. {opt.replace(chr(10), ' ')}"
        pdf.set_x(15) # Indent options
        if opt == item['correct_answer']:
            # Highlight correct answer in yellow
            pdf.set_fill_color(255, 255, 0)
            pdf.set_font('Arial', 'B', 12)
            pdf.multi_cell(0, 7, text=opt_text, fill=True, align='L', new_x="LMARGIN", new_y="NEXT")
        else:
            pdf.set_font('Arial', '', 12)
            pdf.multi_cell(0, 7, text=opt_text, fill=False, align='L', new_x="LMARGIN", new_y="NEXT")
            
    if 'explanation' in item and item['explanation']:
        pdf.set_font('Arial', 'I', 11)
        pdf.set_text_color(100, 100, 100)
        pdf.set_x(15)
        pdf.multi_cell(0, 6, text=f"Giải thích: {item['explanation'].replace(chr(10), ' ')}", align='L', new_x="LMARGIN", new_y="NEXT")
        pdf.set_text_color(0, 0, 0)
        
    pdf.ln(5)

pdf.output('Ma_Nguon_Mo_299_Cau_Full_Dap_An_v3.pdf')
print('PDF created successfully.')
