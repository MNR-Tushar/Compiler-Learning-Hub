// Left Recursion Elimination
document.addEventListener('DOMContentLoaded', function() {
    const grammarInput = document.getElementById('grammar-input');
    const eliminateBtn = document.getElementById('eliminate-btn');
    const resultsDiv = document.getElementById('results');
    const exampleBtn = document.getElementById('example-btn');
    const clearBtn = document.getElementById('clear-btn');

    // Example grammar with left recursion
    const exampleGrammar = `E → E + T | T
T → T * F | F
F → ( E ) | id`;

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
            showNotification('Error processing grammar: ' + error.message, 'error');
        }
    });

    function analyzeLeftRecursion(grammar) {
        const leftRecursive = [];
        const nonTerminals = Object.keys(grammar);

        for (const [nt, prods] of Object.entries(grammar)) {
            for (const prod of prods) {
                if (prod.length > 0 && prod[0] === nt) {
                    leftRecursive.push({
                        nonTerminal: nt,
                        production: prod,
                        type: 'Direct left recursion'
                    });
                }
            }
        }

        // Check for indirect left recursion (simplified)
        const indirect = [];
        for (const nt of nonTerminals) {
            const visited = new Set();
            if (hasIndirectLeftRecursion(grammar, nt, nt, visited, new Set())) {
                indirect.push({
                    nonTerminal: nt,
                    type: 'Indirect left recursion'
                });
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
            if (prod.length > 0 && grammar[prod[0]]) {
                if (hasIndirectLeftRecursion(grammar, start, prod[0], visited, path)) {
                    return true;
                }
            }
        }
        path.delete(current);
        return false;
    }

    function eliminateLeftRecursion(grammar) {
        const newGrammar = {};
        const nonTerminals = Object.keys(grammar);
        const processed = new Set();

        // Copy grammar
        for (const [nt, prods] of Object.entries(grammar)) {
            newGrammar[nt] = [...prods];
        }

        // Process each non-terminal
        for (const nt of nonTerminals) {
            if (processed.has(nt)) continue;

            const prods = newGrammar[nt];
            const leftRecursive = [];
            const nonLeftRecursive = [];

            // Separate left recursive and non-left recursive productions
            for (const prod of prods) {
                if (prod.length > 0 && prod[0] === nt) {
                    leftRecursive.push(prod);
                } else {
                    nonLeftRecursive.push(prod);
                }
            }

            if (leftRecursive.length > 0) {
                // Create new non-terminal for elimination
                const newNT = nt + "'";
                newGrammar[newNT] = [];

                // A → Aα | β becomes:
                // A → βA'
                // A' → αA' | ε
                for (const prod of nonLeftRecursive) {
                    if (prod.length === 0) {
                        newGrammar[nt] = [[newNT]];
                    } else {
                        newGrammar[nt] = [...prod, newNT];
                    }
                }

                for (const prod of leftRecursive) {
                    const alpha = prod.slice(1); // Remove first symbol (A)
                    if (alpha.length === 0) {
                        newGrammar[newNT].push([]); // ε production
                    } else {
                        newGrammar[newNT].push([...alpha, newNT]);
                    }
                }

                // Add ε production
                newGrammar[newNT].push([]);
                processed.add(newNT);
            }

            processed.add(nt);
        }

        return newGrammar;
    }

    function displayResults(analysis, eliminatedGrammar) {
        resultsDiv.innerHTML = '';

        // Analysis results
        const analysisSection = document.createElement('div');
        analysisSection.className = 'result-section';
        analysisSection.innerHTML = `
            <h3>Left Recursion Analysis</h3>
            <p><strong>Direct left recursion:</strong> <span class="${analysis.hasDirectLeftRecursion ? 'error' : 'success'}">${analysis.hasDirectLeftRecursion ? 'Yes' : 'No'}</span></p>
            <p><strong>Indirect left recursion:</strong> <span class="${analysis.hasIndirectLeftRecursion ? 'error' : 'success'}">${analysis.hasIndirectLeftRecursion ? 'Yes' : 'No'}</span></p>
            <p><strong>Total left recursive productions:</strong> ${analysis.totalLeftRecursive}</p>
        `;
        resultsDiv.appendChild(analysisSection);

        // Direct left recursion details
        if (analysis.directLeftRecursive.length > 0) {
            const directSection = document.createElement('div');
            directSection.className = 'result-section';
            directSection.innerHTML = '<h3>Direct Left Recursion Found</h3>';
            
            const directData = analysis.directLeftRecursive.map(item => [
                item.nonTerminal,
                item.production.join(' '),
                item.type
            ]);
            
            const directTable = createTable(['Non-terminal', 'Production', 'Type'], directData);
            directSection.appendChild(directTable);
            resultsDiv.appendChild(directSection);
        }

        // Indirect left recursion details
        if (analysis.indirectLeftRecursive.length > 0) {
            const indirectSection = document.createElement('div');
            indirectSection.className = 'result-section';
            indirectSection.innerHTML = '<h3>Indirect Left Recursion Found</h3>';
            
            const indirectData = analysis.indirectLeftRecursive.map(item => [
                item.nonTerminal,
                item.type
            ]);
            
            const indirectTable = createTable(['Non-terminal', 'Type'], indirectData);
            indirectSection.appendChild(indirectTable);
            resultsDiv.appendChild(indirectSection);
        }

        // Eliminated grammar
        const eliminatedSection = document.createElement('div');
        eliminatedSection.className = 'result-section';
        eliminatedSection.innerHTML = '<h3>Grammar After Left Recursion Elimination</h3>';
        
        const eliminatedText = formatGrammar(eliminatedGrammar);
        const pre = document.createElement('pre');
        pre.className = 'grammar-output';
        pre.textContent = eliminatedText;
        eliminatedSection.appendChild(pre);
        resultsDiv.appendChild(eliminatedSection);

        // Download button
        const downloadBtn = document.createElement('button');
        downloadBtn.textContent = 'Download Results';
        downloadBtn.className = 'download-btn';
        downloadBtn.onclick = () => {
            const content = generateReport(analysis, eliminatedGrammar);
            downloadAsText(content, 'left_recursion_elimination.txt');
        };
        resultsDiv.appendChild(downloadBtn);
    }

    function generateReport(analysis, eliminatedGrammar) {
        let report = `Left Recursion Elimination Report\n`;
        report += `==================================\n\n`;
        
        report += `Analysis Results:\n`;
        report += `- Direct left recursion: ${analysis.hasDirectLeftRecursion ? 'Yes' : 'No'}\n`;
        report += `- Indirect left recursion: ${analysis.hasIndirectLeftRecursion ? 'Yes' : 'No'}\n`;
        report += `- Total left recursive productions: ${analysis.totalLeftRecursive}\n\n`;
        
        if (analysis.directLeftRecursive.length > 0) {
            report += `Direct Left Recursion:\n`;
            analysis.directLeftRecursive.forEach((item, i) => {
                report += `${i + 1}. ${item.nonTerminal} → ${item.production.join(' ')}\n`;
            });
            report += '\n';
        }
        
        if (analysis.indirectLeftRecursive.length > 0) {
            report += `Indirect Left Recursion:\n`;
            analysis.indirectLeftRecursive.forEach((item, i) => {
                report += `${i + 1}. ${item.nonTerminal}\n`;
            });
            report += '\n';
        }
        
        report += `Eliminated Grammar:\n`;
        report += formatGrammar(eliminatedGrammar);
        
        return report;
    }
}); 