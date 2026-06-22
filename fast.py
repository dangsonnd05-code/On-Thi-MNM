import json
import re
from duckduckgo_search import DDGS
from concurrent.futures import ThreadPoolExecutor

with open('quiz_data_final.js', 'r', encoding='utf-8') as f:
    data = json.loads(re.sub(r'^window\.QUIZ_DATA\s*=\s*|;$', '', f.read().strip()))

ddgs = DDGS()

def fetch(item):
    if 'explanation' in item and "Trích xuất từ Web" in item.get('explanation', ''):
        return
    query = f"{item['question']} {item['correct_answer']}"
    try:
        res = list(ddgs.text(query, max_results=1, region='vn-vi'))
        if res:
            item['explanation'] = 'Trích xuất từ Web: ' + res[0].get('body', '')
        else:
            item['explanation'] = 'Không tìm thấy thông tin trên mạng cho câu này.'
    except:
        item['explanation'] = 'Lỗi hoặc hết hạn ngạch truy cập.'

print("Đang ép xung hệ thống: Quét giải thích tốc độ cao cho 299 câu...")
with ThreadPoolExecutor(max_workers=5) as executor:
    executor.map(fetch, data)

js_content = 'window.QUIZ_DATA = ' + json.dumps(data, indent=4, ensure_ascii=False) + ';\n'
with open('quiz_data_final.js', 'w', encoding='utf-8') as f:
    f.write(js_content)
print("Xong toàn bộ!")
