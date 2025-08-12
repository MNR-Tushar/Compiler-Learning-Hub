# algos/grammar_utils.py
EPS = 'ε'

def parse_grammar(text):
    """
    Parse grammar from simple text format:
    Each line: A -> a B | b | ε
    Returns: grammar dict: NT -> list of productions (each prod is list of symbols)
    Nonterminals are LHS tokens (strings). Terminals are any symbols not in nonterms.
    """
    grammar = {}
    lines = [ln.strip() for ln in text.splitlines() if ln.strip() and not ln.strip().startswith('#')]
    for ln in lines:
        if '->' not in ln:
            raise ValueError(f"Invalid production (missing ->): {ln}")
        lhs, rhs = ln.split('->', 1)
        A = lhs.strip()
        prods = [p.strip() for p in rhs.split('|')]
        grammar.setdefault(A, [])
        for p in prods:
            if p == '' or p == EPS:
                grammar[A].append([])
            else:
                # split by spaces for tokens
                symbols = [tok for tok in p.split() if tok != '']
                grammar[A].append(symbols)
    return grammar

def compute_first(grammar):
    nonterms = set(grammar.keys())
    first = {A: set() for A in nonterms}
    changed = True
    while changed:
        changed = False
        for A, prods in grammar.items():
            for prod in prods:
                if not prod:
                    if EPS not in first[A]:
                        first[A].add(EPS); changed = True
                    continue
                add_eps = True
                for X in prod:
                    if X in nonterms:
                        before = len(first[A])
                        # add FIRST(X) except EPS
                        first[A].update(s for s in first[X] if s != EPS)
                        if EPS in first[X]:
                            add_eps = True
                        else:
                            add_eps = False
                        if len(first[A]) != before: changed = True
                    else:
                        # terminal
                        if X not in first[A]:
                            first[A].add(X); changed = True
                        add_eps = False
                        break
                if add_eps:
                    if EPS not in first[A]:
                        first[A].add(EPS); changed = True
    return first

def first_of_sequence(seq, first, nonterms):
    """
    seq: list of symbols
    returns set of terminals and possibly EPS
    """
    res = set()
    if not seq:
        res.add(EPS)
        return res
    for X in seq:
        if X in nonterms:
            res.update(s for s in first[X] if s != EPS)
            if EPS in first[X]:
                continue
            else:
                break
        else:
            res.add(X)
            break
    else:
        res.add(EPS)
    return res

def compute_follow(grammar, start_symbol):
    nonterms = set(grammar.keys())
    first = compute_first(grammar)
    follow = {A: set() for A in nonterms}
    follow[start_symbol].add('$')
    changed = True
    while changed:
        changed = False
        for A, prods in grammar.items():
            for prod in prods:
                trailer = follow[A].copy()
                for symbol in reversed(prod):
                    if symbol in nonterms:
                        before = len(follow[symbol])
                        follow[symbol].update(trailer)
                        if EPS in first[symbol]:
                            trailer = trailer.union(s for s in first[symbol] if s != EPS)
                        else:
                            trailer = set(s for s in first[symbol] if s != EPS)
                        if len(follow[symbol]) != before:
                            changed = True
                    else:
                        trailer = {symbol}
    return first, follow

def build_ll1_table(grammar, start_symbol):
    """
    Returns:
      table: dict (A -> dict(term -> production (list) or 'conflict'))
      is_ll1: bool
    """
    nonterms = set(grammar.keys())
    first = compute_first(grammar)
    _, follow = compute_follow(grammar, start_symbol)
    table = {A: {} for A in grammar}
    is_ll1 = True
    for A, prods in grammar.items():
        for prod in prods:
            first_alpha = first_of_sequence(prod, first, nonterms)
            for terminal in (first_alpha - {EPS}):
                if terminal in table[A]:
                    # conflict
                    table[A][terminal] = '<<conflict>>'
                    is_ll1 = False
                else:
                    table[A][terminal] = prod
            if EPS in first_alpha:
                for b in follow[A]:
                    if b in table[A]:
                        table[A][b] = '<<conflict>>'
                        is_ll1 = False
                    else:
                        table[A][b] = prod
    return {
        'first': {k: sorted(list(v)) for k,v in first.items()},
        'follow': {k: sorted(list(v)) for k,v in follow.items()},
        'table': table,
        'is_ll1': is_ll1
    } 