document.addEventListener('DOMContentLoaded', function () {
    const grammarInput = document.getElementById('grammar-input');
    const factorBtn = document.getElementById('factor-btn');
    const resultsDiv = document.getElementById('results');
    const exampleBtn = document.getElementById('example-btn');
    const clearBtn = document.getElementById('clear-btn');

    const exampleGrammar = `A -> aB | aC | bD
B -> b
C -> c
D -> d`;

    exampleBtn.addEventListener('click', () => {
        grammarInput.value = exampleGrammar;
    });

    clearBtn.addEventListener('click', () => {
        grammarInput.value = '';
        resultsDiv.innerHTML = '';
    });

    factorBtn.addEventListener('click', () => {
        const grammar = grammarInput.value.trim();
        if (!grammar) {
            alert('Please enter a grammar');
            return;
        }

        try {
            const parsedGrammar = parseGrammar(grammar);
            const factoredGrammar = applyLeftFactoring(parsedGrammar);
            displayResults(factoredGrammar);
        } catch (error) {
            alert('Error: ' + error.message);
        }
    });

    function parseGrammar(grammarStr) {
        const grammar = {};
        const lines = grammarStr.split('\n').map(l => l.trim()).filter(Boolean);
        for (const line of lines) {
            const [lhs, rhs] = line.split('->').map(s => s.trim());
            if (!lhs || !rhs) throw new Error("Invalid grammar line: " + line);
            const productions = rhs.split('|').map(p => p.trim().split(/\s+/));
            grammar[lhs] = productions;
        }
        return grammar;
    }

    function formatGrammar(grammar) {
        let output = '';
        for (const [nt, prods] of Object.entries(grammar)) {
            output += `${nt} -> ${prods.map(p => p.length ? p.join(' ') : 'ε').join(' | ')}\n`;
        }
        return output.trim();
    }

    function startsWith(prod, prefix) {
        return prefix.every((symbol, i) => prod[i] === symbol);
    }

    function findLongestCommonPrefix(a, b) {
        const minLen = Math.min(a.length, b.length);
        const prefix = [];
        for (let i = 0; i < minLen; i++) {
            if (a[i] === b[i]) prefix.push(a[i]);
            else break;
        }
        return prefix;
    }

    function applyLeftFactoring(grammar) {
        const newGrammar = {};
        let counter = 1;

        for (const [nt, prods] of Object.entries(grammar)) {
            let currentProds = [...prods];
            let changed = true;

            while (changed) {
                changed = false;
                if (currentProds.length < 2) break;

                let maxPrefix = [];
                for (let i = 0; i < currentProds.length; i++) {
                    for (let j = i + 1; j < currentProds.length; j++) {
                        const prefix = findLongestCommonPrefix(currentProds[i], currentProds[j]);
                        if (prefix.length > maxPrefix.length) maxPrefix = prefix;
                    }
                }

                if (maxPrefix.length > 0) {
                    const newNT = nt + counter++;
                    newGrammar[newNT] = [];

                    const withoutPrefix = [];
                    currentProds.forEach(prod => {
                        if (startsWith(prod, maxPrefix)) {
                            const suffix = prod.slice(maxPrefix.length);
                            newGrammar[newNT].push(suffix.length ? suffix : ['ε']);
                        } else {
                            withoutPrefix.push(prod);
                        }
                    });

                    currentProds = [[...maxPrefix, newNT], ...withoutPrefix];
                    changed = true;
                }
            }

            newGrammar[nt] = currentProds;
        }

        return newGrammar;
    }

    function displayResults(factoredGrammar) {
        resultsDiv.innerHTML = '';
        const section = document.createElement('div');
        section.innerHTML = `<h3>Grammar After Left Factoring</h3>
            <pre>${formatGrammar(factoredGrammar)}</pre>`;
        resultsDiv.appendChild(section);

        const downloadBtn = document.createElement('button');
        downloadBtn.textContent = 'Download Results';
        downloadBtn.onclick = () => {
            const blob = new Blob([formatGrammar(factoredGrammar)], { type: 'text/plain' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'left_factoring.txt';
            link.click();
        };
        resultsDiv.appendChild(downloadBtn);
    }
});