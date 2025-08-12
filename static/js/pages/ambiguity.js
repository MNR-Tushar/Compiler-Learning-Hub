// Ambiguity Checker
document.addEventListener('DOMContentLoaded', function() {
    const grammarInput = document.getElementById('grammar-input');
    const checkBtn = document.getElementById('check-btn');
    const resultsDiv = document.getElementById('results');
    const exampleBtn = document.getElementById('example-btn');
    const clearBtn = document.getElementById('clear-btn');

    // Example ambiguous grammar
    const exampleGrammar = `E → E + E | E * E | ( E ) | id`;

    exampleBtn.addEventListener('click', () => {
        grammarInput.value = exampleGrammar;
    });

    clearBtn.addEventListener('click', () => {
        grammarInput.value = '';
        resultsDiv.innerHTML = '';
    });

    checkBtn.addEventListener('click', () => {
        const grammar = grammarInput.value.trim();
        if (!grammar) {
            showNotification('Please enter a grammar', 'error');
            return;
        }

        try {
            const parsedGrammar = parseGrammar(grammar);
            const analysis = analyzeAmbiguity(parsedGrammar);
            displayResults(analysis, parsedGrammar);
        } catch (error) {
            showNotification('Error parsing grammar: ' + error.message, 'error');
        }
    });

    function analyzeAmbiguity(grammar) {
        const nonTerminals = Object.keys(grammar);
        const terminals = new Set();
        const nullable = new Set();
        const first = {};
        const follow = {};

        // Find terminals and compute nullable
        for (const [nt, prods] of Object.entries(grammar)) {
            first[nt] = new Set();
            follow[nt] = new Set();
            
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
                                first[nt].update(first[symbol]);
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

        // Check for conflicts
        const conflicts = [];
        for (const [nt, prods] of Object.entries(grammar)) {
            const firstSets = prods.map(prod => {
                if (prod.length === 0) return new Set(['ε']);
                const result = new Set();
                let allNullable = true;
                for (const symbol of prod) {
                    if (nonTerminals.includes(symbol)) {
                        result.update(first[symbol]);
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

            // Check for overlapping FIRST sets
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

    function displayResults(analysis, parsedGrammar) {
        resultsDiv.innerHTML = '';

        // Grammar info
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

        // FIRST sets
        const firstSection = document.createElement('div');
        firstSection.className = 'result-section';
        firstSection.innerHTML = '<h3>FIRST Sets</h3>';
        
        const firstData = Object.entries(analysis.first).map(([nt, firstSet) => [
            nt, 
            Array.from(firstSet).sort().join(', ')
        ]);
        const firstTable = createTable(['Non-terminal', 'FIRST Set'], firstData);
        firstSection.appendChild(firstTable);
        resultsDiv.appendChild(firstSection);

        // Conflicts
        if (analysis.conflicts.length > 0) {
            const conflictsSection = document.createElement('div');
            conflictsSection.className = 'result-section';
            conflictsSection.innerHTML = '<h3>Ambiguity Conflicts</h3>';
            
            const conflictsData = analysis.conflicts.map(conflict => [
                conflict.nonTerminal,
                conflict.production1.length === 0 ? 'ε' : conflict.production1.join(' '),
                conflict.production2.length === 0 ? 'ε' : conflict.production2.join(' '),
                conflict.conflictSymbols.join(', '),
                conflict.type
            ]);
            
            const conflictsTable = createTable([
                'Non-terminal', 'Production 1', 'Production 2', 'Conflict Symbols', 'Type'
            ], conflictsData);
            conflictsSection.appendChild(conflictsTable);
            resultsDiv.appendChild(conflictsSection);
        }

        // Suggestions
        if (analysis.isAmbiguous) {
            const suggestionsSection = document.createElement('div');
            suggestionsSection.className = 'result-section';
            suggestionsSection.innerHTML = `
                <h3>Suggestions to Remove Ambiguity</h3>
                <ul>
                    <li>Use operator precedence rules</li>
                    <li>Introduce intermediate non-terminals</li>
                    <li>Use left or right associativity</li>
                    <li>Restructure grammar to be unambiguous</li>
                </ul>
            `;
            resultsDiv.appendChild(suggestionsSection);
        }

        // Download button
        const downloadBtn = document.createElement('button');
        downloadBtn.textContent = 'Download Analysis';
        downloadBtn.className = 'download-btn';
        downloadBtn.onclick = () => {
            const content = generateReport(analysis);
            downloadAsText(content, 'ambiguity_analysis.txt');
        };
        resultsDiv.appendChild(downloadBtn);
    }

    function generateReport(analysis) {
        let report = `Grammar Ambiguity Analysis\n`;
        report += `==========================\n\n`;
        
        report += `Grammar:\n`;
        report += formatGrammar(analysis.grammar);
        report += `\n\n`;
        
        report += `Analysis Results:\n`;
        report += `- Non-terminals: ${analysis.nonTerminals.join(', ')}\n`;
        report += `- Terminals: ${analysis.terminals.join(', ')}\n`;
        report += `- Nullable symbols: ${analysis.nullable.join(', ')}\n`;
        report += `- Ambiguous: ${analysis.isAmbiguous ? 'Yes' : 'No'}\n\n`;
        
        report += `FIRST Sets:\n`;
        Object.entries(analysis.first).forEach(([nt, firstSet) => {
            report += `${nt}: {${Array.from(firstSet).sort().join(', ')}}\n`;
        });
        
        if (analysis.conflicts.length > 0) {
            report += `\nConflicts:\n`;
            analysis.conflicts.forEach((conflict, i) => {
                report += `${i + 1}. ${conflict.nonTerminal}: ${conflict.production1.join(' ')} vs ${conflict.production2.join(' ')}\n`;
                report += `   Conflict symbols: {${conflict.conflictSymbols.join(', ')}}\n`;
                report += `   Type: ${conflict.type}\n\n`;
            });
        }
        
        return report;
    }
}); 