// Left Recursion Elimination Tool
document.addEventListener('DOMContentLoaded', function () {
    const grammarInput = document.getElementById('grammar-input');
    const eliminateBtn = document.getElementById('eliminate-btn');
    const resultsDiv = document.getElementById('results');
    const exampleBtn = document.getElementById('example-btn');
    const clearBtn = document.getElementById('clear-btn');

    // Example grammar
    const exampleGrammar = `E -> E + T | T
T -> T * F | F
F -> ( E ) | id`;

    exampleBtn.addEventListener('click', () => {
        grammarInput.value = exampleGrammar;
    });

    clearBtn.addEventListener('click', () => {
        grammarInput.value = '';
        resultsDiv.innerHTML = '';
    });

    eliminateBtn.addEventListener('click', () => {
        const grammar = grammarInput.value.trim();
        if (!grammar) {
            showNotification('Please enter a grammar', 'error');
            return;
        }

        try {
            const parsedGrammar = parseGrammar(grammar);
            const analysis = analyzeLeftRecursion(parsedGrammar);
            const eliminatedGrammar = eliminateLeftRecursion(parsedGrammar);
            displayResults(analysis, eliminatedGrammar);
        } catch (error) {
            showNotification('Error: ' + error.message, 'error');
        }
    });

    // Parse input grammar into object form
    function parseGrammar(grammarStr) {
        const grammar = {};
        const lines = grammarStr.split('\n').map(line => line.trim()).filter(Boolean);

        for (const line of lines) {
            const [lhs, rhs] = line.split('->').map(s => s.trim());
            if (!lhs || !rhs) throw new Error("Invalid grammar format: " + line);

            const productions = rhs.split('|').map(prod => prod.trim().split(/\s+/));
            grammar[lhs] = productions;
        }
        return grammar;
    }

    // Format grammar object into string
    function formatGrammar(grammar) {
        let output = '';
        for (const [nt, prods] of Object.entries(grammar)) {
            output += nt + ' -> ' + prods.map(p => p.length ? p.join(' ') : 'ε').join(' | ') + '\n';
        }
        return output.trim();
    }

    // Analyze left recursion
    function analyzeLeftRecursion(grammar) {
        const leftRecursive = [];
        const nonTerminals = Object.keys(grammar);

        // Direct left recursion
        for (const [nt, prods] of Object.entries(grammar)) {
            for (const prod of prods) {
                if (prod[0] === nt) {
                    leftRecursive.push({
                        nonTerminal: nt,
                        production: prod,
                        type: 'Direct left recursion'
                    });
                }
            }
        }

        // Indirect left recursion
        const indirect = [];
        for (const nt of nonTerminals) {
            const visited = new Set();
            if (hasIndirectLeftRecursion(grammar, nt, nt, visited, new Set())) {
                indirect.push({ nonTerminal: nt, type: 'Indirect left recursion' });
            }
        }

        return {
            hasDirectLeftRecursion: leftRecursive.length > 0,
            hasIndirectLeftRecursion: indirect.length > 0,
            directLeftRecursive: leftRecursive,
            indirectLeftRecursive: indirect,
            totalLeftRecursive: leftRecursive.length + indirect.length
        };
    }

    function hasIndirectLeftRecursion(grammar, start, current, visited, path) {
        if (path.has(current)) {
            return start === current;
        }
        path.add(current);
        visited.add(current);

        for (const prod of grammar[current] || []) {
            if (grammar[prod[0]]) {
                if (hasIndirectLeftRecursion(grammar, start, prod[0], visited, path)) {
                    return true;
                }
            }
        }
        path.delete(current);
        return false;
    }

    // Eliminate left recursion
    function eliminateLeftRecursion(grammar) {
        const newGrammar = {};
        const nonTerminals = Object.keys(grammar);

        for (const nt of nonTerminals) {
            const leftRecursive = [];
            const nonLeftRecursive = [];

            for (const prod of grammar[nt]) {
                if (prod[0] === nt) {
                    leftRecursive.push(prod.slice(1)); // Remove the left recursion
                } else {
                    nonLeftRecursive.push(prod);
                }
            }

            if (leftRecursive.length > 0) {
                const newNT = nt + "'";
                newGrammar[nt] = [];
                newGrammar[newNT] = [];

                for (const beta of nonLeftRecursive) {
                    newGrammar[nt].push([...beta, newNT]);
                }
                for (const alpha of leftRecursive) {
                    newGrammar[newNT].push([...alpha, newNT]);
                }
                newGrammar[newNT].push([]); // ε production
            } else {
                newGrammar[nt] = grammar[nt];
            }
        }
        return newGrammar;
    }

    // Display results
    function displayResults(analysis, eliminatedGrammar) {
        resultsDiv.innerHTML = '';

        const analysisSection = document.createElement('div');
        analysisSection.innerHTML = `
            <h3>Analysis</h3>
            <p>Direct left recursion: <b>${analysis.hasDirectLeftRecursion ? 'Yes' : 'No'}</b></p>
            <p>Indirect left recursion: <b>${analysis.hasIndirectLeftRecursion ? 'Yes' : 'No'}</b></p>
            <p>Total left recursive productions: ${analysis.totalLeftRecursive}</p>
        `;
        resultsDiv.appendChild(analysisSection);

        const eliminatedSection = document.createElement('div');
        eliminatedSection.innerHTML = `<h3>After Elimination</h3>
            <pre>${formatGrammar(eliminatedGrammar)}</pre>`;
        resultsDiv.appendChild(eliminatedSection);
    }

    // Simple notification
    function showNotification(msg, type) {
        alert(msg);
    }
});
