// Ambiguity Checker
document.addEventListener('DOMContentLoaded', function () {
    const grammarInput = document.getElementById('grammar-input');
    const checkBtn = document.getElementById('check-btn');
    const resultsDiv = document.getElementById('results');
    const exampleBtn = document.getElementById('example-btn');
    const clearBtn = document.getElementById('clear-btn');

    // Example ambiguous grammar
    const exampleGrammar = `E -> E + E | E * E | ( E ) | id`;

    exampleBtn.addEventListener('click', () => {
        grammarInput.value = exampleGrammar;
    });

    clearBtn.addEventListener('click', () => {
        grammarInput.value = '';
        resultsDiv.innerHTML = '';
    });

    checkBtn.addEventListener('click', () => {
        const grammarText = grammarInput.value.trim();
        if (!grammarText) {
            showNotification('Please enter a grammar', 'error');
            return;
        }

        try {
            const parsedGrammar = parseGrammar(grammarText);
            const analysis = analyzeAmbiguity(parsedGrammar);
            displayResults(analysis, parsedGrammar);
        } catch (error) {
            showNotification('Error parsing grammar: ' + error.message, 'error');
        }
    });

    // Parse grammar input text into object
    function parseGrammar(input) {
        const grammar = {};
        const lines = input.split('\n').map(line => line.trim()).filter(line => line);

        lines.forEach(line => {
            const [left, right] = line.split(/->|→/).map(part => part.trim());
            if (!left || !right) throw new Error("Invalid grammar format. Use 'A -> B | C' syntax.");

            if (!grammar[left]) grammar[left] = [];

            right.split('|').forEach(prod => {
                const symbols = prod.trim().split(/\s+/).filter(s => s.length > 0);
                grammar[left].push(symbols);
            });
        });

        return grammar;
    }

    function analyzeAmbiguity(grammar) {
        const nonTerminals = Object.keys(grammar);
        const terminals = new Set();
        const nullable = new Set();
        const first = {};

        // Find terminals and initialize FIRST sets
        for (const [nt, prods] of Object.entries(grammar)) {
            first[nt] = new Set();
            for (const prod of prods) {
                if (prod.length === 0) {
                    nullable.add(nt);
                } else {
                    for (const symbol of prod) {
                        if (!nonTerminals.includes(symbol)) {
                            terminals.add(symbol);
                        }
                    }
                }
            }
        }

        // Compute FIRST sets
        let changed = true;
        while (changed) {
            changed = false;
            for (const [nt, prods] of Object.entries(grammar)) {
                for (const prod of prods) {
                    if (prod.length === 0) {
                        if (!first[nt].has('ε')) {
                            first[nt].add('ε');
                            changed = true;
                        }
                    } else {
                        let allNullable = true;
                        for (const symbol of prod) {
                            if (nonTerminals.includes(symbol)) {
                                const before = first[nt].size;
                                for (let val of first[symbol]) first[nt].add(val);
                                if (first[nt].size !== before) changed = true;
                                if (!nullable.has(symbol)) {
                                    allNullable = false;
                                    break;
                                }
                            } else {
                                if (!first[nt].has(symbol)) {
                                    first[nt].add(symbol);
                                    changed = true;
                                }
                                allNullable = false;
                                break;
                            }
                        }
                        if (allNullable && !first[nt].has('ε')) {
                            first[nt].add('ε');
                            changed = true;
                        }
                    }
                }
            }
        }

        // Check for FIRST-FIRST conflicts
        const conflicts = [];
        for (const [nt, prods] of Object.entries(grammar)) {
            const firstSets = prods.map(prod => {
                if (prod.length === 0) return new Set(['ε']);
                const result = new Set();
                let allNullable = true;
                for (const symbol of prod) {
                    if (nonTerminals.includes(symbol)) {
                        for (let val of first[symbol]) result.add(val);
                        if (!nullable.has(symbol)) {
                            allNullable = false;
                            break;
                        }
                    } else {
                        result.add(symbol);
                        allNullable = false;
                        break;
                    }
                }
                if (allNullable) result.add('ε');
                return result;
            });

            for (let i = 0; i < firstSets.length; i++) {
                for (let j = i + 1; j < firstSets.length; j++) {
                    const intersection = new Set([...firstSets[i]].filter(x => firstSets[j].has(x)));
                    if (intersection.size > 0) {
                        conflicts.push({
                            nonTerminal: nt,
                            production1: prods[i],
                            production2: prods[j],
                            conflictSymbols: Array.from(intersection),
                            type: 'FIRST-FIRST conflict'
                        });
                    }
                }
            }
        }

        return {
            grammar: grammar,
            nonTerminals: nonTerminals,
            terminals: Array.from(terminals),
            nullable: Array.from(nullable),
            first: first,
            conflicts: conflicts,
            isAmbiguous: conflicts.length > 0
        };
    }

    function displayResults(analysis) {
        resultsDiv.innerHTML = '';

        const infoSection = document.createElement('div');
        infoSection.className = 'result-section';
        infoSection.innerHTML = `
            <h3>Grammar Analysis</h3>
            <p><strong>Non-terminals:</strong> ${analysis.nonTerminals.join(', ')}</p>
            <p><strong>Terminals:</strong> ${analysis.terminals.join(', ')}</p>
            <p><strong>Nullable symbols:</strong> ${analysis.nullable.length > 0 ? analysis.nullable.join(', ') : 'None'}</p>
            <p><strong>Ambiguous:</strong> <span class="${analysis.isAmbiguous ? 'error' : 'success'}">${analysis.isAmbiguous ? 'Yes' : 'No'}</span></p>
        `;
        resultsDiv.appendChild(infoSection);

        const firstSection = document.createElement('div');
        firstSection.className = 'result-section';
        firstSection.innerHTML = '<h3>FIRST Sets</h3>';

        const firstTable = createTable(
            ['Non-terminal', 'FIRST Set'],
            Object.entries(analysis.first).map(([nt, set]) => [nt, Array.from(set).sort().join(', ')])
        );
        firstSection.appendChild(firstTable);
        resultsDiv.appendChild(firstSection);

        if (analysis.conflicts.length > 0) {
            const conflictsSection = document.createElement('div');
            conflictsSection.className = 'result-section';
            conflictsSection.innerHTML = '<h3>Ambiguity Conflicts</h3>';

            const conflictsTable = createTable(
                ['Non-terminal', 'Production 1', 'Production 2', 'Conflict Symbols', 'Type'],
                analysis.conflicts.map(c => [
                    c.nonTerminal,
                    c.production1.join(' '),
                    c.production2.join(' '),
                    c.conflictSymbols.join(', '),
                    c.type
                ])
            );
            conflictsSection.appendChild(conflictsTable);
            resultsDiv.appendChild(conflictsSection);
        }
    }

    // Helper function to create HTML tables
    function createTable(headers, rows) {
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tr = document.createElement('tr');
        headers.forEach(h => {
            const th = document.createElement('th');
            th.textContent = h;
            tr.appendChild(th);
        });
        thead.appendChild(tr);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        rows.forEach(row => {
            const tr = document.createElement('tr');
            row.forEach(cell => {
                const td = document.createElement('td');
                td.textContent = cell;
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        return table;
    }

    // Dummy notification function
    function showNotification(message, type) {
        alert(`${type.toUpperCase()}: ${message}`);
    }
});
