import json
import re

def normalize_text(text):
    # Remove leading numbers like "1. ", "306. ", etc.
    text = re.sub(r'^\d+\.\s*', '', text)
    text = re.sub(r'^\d+\.\s*', '', text) # Do it twice for cases like "1.  306. "
    # Remove all whitespace, lowercase
    text = re.sub(r'\s+', '', text).lower()
    return text

def main():
    # Load correct answers
    with open(r'C:\Users\Admin\Downloads\correct_answers_final (2).json', 'r', encoding='utf-8') as f:
        correct_data = json.load(f)
    
    # Map normalized question text to correct answer text
    ans_map = {}
    for item in correct_data:
        norm_q = normalize_text(item['question'])
        ans_map[norm_q] = item['correctAnswer'].strip()
    
    # Load quiz_data_final.js
    with open('quiz_data_final.js', 'r', encoding='utf-8') as f:
        js_content = f.read()
    
    # Extract JSON string
    json_str = js_content.replace('window.QUIZ_DATA = ', '').strip()
    if json_str.endswith(';'):
        json_str = json_str[:-1]
    
    quiz_data = json.loads(json_str)
    
    matched = 0
    not_matched = []
    
    for item in quiz_data:
        norm_q = normalize_text(item['question'])
        
        # Try exact normalized match
        if norm_q in ans_map:
            item['correct_answer'] = ans_map[norm_q]
            matched += 1
            continue
            
        # Try substring match
        found = False
        for k, v in ans_map.items():
            if norm_q in k or k in norm_q:
                item['correct_answer'] = v
                matched += 1
                found = True
                break
        
        if not found:
            not_matched.append(item['question'])
    
    print(f"Matched {matched} out of {len(quiz_data)} questions.")
    if not_matched:
        print("First 5 not matched:", not_matched[:5])
    
    # Write back
    with open('quiz_data_final.js', 'w', encoding='utf-8') as f:
        f.write('window.QUIZ_DATA = ' + json.dumps(quiz_data, ensure_ascii=False, indent=2) + ';\n')

if __name__ == '__main__':
    main()
