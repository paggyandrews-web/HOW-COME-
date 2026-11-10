import json, os, sys
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '_incoming_001_2026_OL.json')
PID = '1-2026-OL-M'
def load():
    return json.load(open(OUT, encoding='utf-8')) if os.path.exists(OUT) else []
def add(items):
    cur = [x for x in load() if x['questionNumber'] not in {i['questionNumber'] for i in items}]
    cur.extend(items); cur.sort(key=lambda x: x['questionNumber'])
    json.dump(cur, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    print('stored', len(cur), [x['questionNumber'] for x in cur])
def Q(n, topic, text, a, b, c, d, ans, correct, rule, wrong, tip):
    opt = {'A': a, 'B': b, 'C': c, 'D': d}[ans]
    return {'id': f'{PID}-Q{n}', 'paperId': PID, 'questionNumber': n, 'topic': topic, 'questionText': text,
            'optionA': a, 'optionB': b, 'optionC': c, 'optionD': d, 'correctAnswer': ans,
            'explanation': {
                'correct': f'✅ ശരിയുത്തരം: ({ans}) {opt}\n' + correct.strip(),
                'rule': '📌 വ്യാകരണ നിയമം\n' + rule.strip(),
                'wrong': '❌ തെറ്റായ ഉത്തരങ്ങൾ\n' + wrong.strip(),
                'tip': '💡 HOW COME Tip\n' + tip.strip()}}
