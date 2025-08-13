# app.py
from flask import Flask, render_template, request, jsonify
from algos.grammar_utils import parse_grammar, build_ll1_table


app = Flask(__name__, static_folder='static', template_folder='templates')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/tools')
def tools():
    return render_template('tools.html')
@app.route('/first-follow')
def first_follow():
    return render_template('pages/first_follow.html')

@app.route('/ambiguity')
def ambiguity():
    return render_template('pages/ambiguity.html')

@app.route('/left-recursion')
def left_recursion():
    return render_template('pages/left_recursion.html')

@app.route('/left-factoring')
def left_factoring():
    return render_template('pages/left_factoring.html')

@app.route('/lang-to-regex')
def lang_to_regex():
    return render_template('pages/lang_to_regex.html')

@app.route('/regex-to-lang')
def regex_to_lang():
    return render_template('pages/regex_to_lang.html')

@app.route('/lr0')
def lr0():
    return render_template('pages/lr0.html')

@app.route('/tac')
def tac():
    return render_template('pages/tac.html')

@app.route('/cfg')
def cfg():
    return render_template('pages/cfg.html')

@app.route('/api/compute', methods=['POST'])
def compute():
    data = request.json
    raw = data.get('grammar', '')
    start = data.get('start', '').strip()
    try:
        grammar = parse_grammar(raw)
        if not start:
            # choose first LHS as start if not provided
            start = next(iter(grammar.keys()))
        res = build_ll1_table(grammar, start)
        return jsonify({'ok': True, 'start': start, 'result': res})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True)
