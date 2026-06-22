import json
import re
import time
from duckduckgo_search import DDGS
import logging

logging.basicConfig(level=logging.INFO, format='%(message)s')

# Load existing data
with open('quiz_data_final.js', 'r', encoding='utf-8') as f:
    content = f.read()

json_str = re.sub(r'^window\.QUIZ_DATA\s*=\s*|;$', '', content.strip())
data = json.loads(json_str)

ddgs = DDGS()

print("Bắt đầu tự động tìm kiếm giải thích cho 299 câu hỏi trên mạng (DuckDuckGo)...")
print("Quá trình này có thể mất khoảng 5-10 phút để tránh bị chặn kết nối. Vui lòng đợi...\n")

for i, item in enumerate(data):
    if 'explanation' in item and item['explanation'] and item['explanation'] != "Không có thông tin giải thích chi tiết trên mạng.":
        continue # Bỏ qua nếu đã có
        
    q = item['question']
    ans = item['correct_answer']
    
    # Chỉ tìm kiếm nếu câu hỏi dài hơn vài từ để có context
    query = f"{q} {ans}"
    
    explanation = "Không có thông tin giải thích chi tiết trên mạng."
    
    try:
        results = list(ddgs.text(query, max_results=1, region='vn-vi'))
        if results:
            body = results[0].get('body', '')
            if body:
                explanation = f"Trích xuất từ Web: {body}"
    except Exception as e:
        # Rate limit or connection error, wait longer
        logging.info(f"Lỗi kết nối ở câu {item['id']}, đang thử lại sau...")
        time.sleep(5)
        try:
            results = list(ddgs.text(query, max_results=1, region='vn-vi'))
            if results:
                body = results[0].get('body', '')
                if body:
                    explanation = f"Trích xuất từ Web: {body}"
        except:
            pass
            
    item['explanation'] = explanation
    
    if i % 10 == 0:
        print(f"Đã tra cứu xong {i+1}/{len(data)} câu...")
        # Save progress every 10 items
        js_content = "window.QUIZ_DATA = " + json.dumps(data, indent=4, ensure_ascii=False) + ";\n"
        with open('quiz_data_final.js', 'w', encoding='utf-8') as out_f:
            out_f.write(js_content)
            
    time.sleep(1.5) # Delay 1.5s between requests to avoid rate limits

# Final save
js_content = "window.QUIZ_DATA = " + json.dumps(data, indent=4, ensure_ascii=False) + ";\n"
with open('quiz_data_final.js', 'w', encoding='utf-8') as out_f:
    out_f.write(js_content)

print("\nHOÀN THÀNH! Đã cập nhật xong giải thích cho 299 câu hỏi.")
