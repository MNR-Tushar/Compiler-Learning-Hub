// Left Factoring
document.addEventListener('DOMContentLoaded', function() {
    const grammarInput = document.getElementById('grammar-input');
    const factorBtn = document.getElementById('factor-btn');
    const resultsDiv = document.getElementById('results');
    const exampleBtn = document.getElementById('example-btn');
    const clearBtn = document.getElementById('clear-btn');

    // Example grammar for left factoring
    const exampleGrammar = `S → iEtS | iEtSeS | a
E → b`;

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
            showNotification('Please enter a grammar', 'error');
            return;
        }

        try {
            const parsedGrammar = parseGrammar(grammar);
            const analysis = analyzeLeftFactoring(parsedGrammar);
            const factoredGrammar = applyLeftFactoring(parsedGrammar);
            displayResults(analysis, factoredGrammar);
        } catch (error) {
            showNotification('Error processing grammar: ' + error.message, 'error');
        }
    });

    function analyzeLeftFactoring(grammar) {
        const commonPrefixes = [];
        const nonTerminals = Object.keys(grammar);

        for (const [nt, prods] of Object.entries(grammar)) {
            if (prods.length < 2) continue;

            // Find common prefixes
            const prefixes = findCommonPrefixes(prods);
            if (prefixes.length > 0) {
                commonPrefixes.push({
                    nonTerminal: nt,
                    productions: prods,
                    prefixes: prefixes,
                    canBeFactored: true
                });
            }
        }

        return {
            hasCommonPrefixes: commonPrefixes.length > 0,
            commonPrefixes: commonPrefixes,
            totalFactoringOpportunities: commonPrefixes.length
        };
    }

    function findCommonPrefixes(productions) {
        const prefixes = [];
        
        for (let i = 0; i < productions.length; i++) {
            for (let j = i + 1; j < productions.length; j++) {
                const prefix = findLongestCommonPrefix(productions[i], productions[j]);
                if (prefix.length > 0) {
                    prefixes.push({
                        prefix: prefix,
                        productions: [productions[i], productions[j]],
                        indices: [i, j]
                    });
                }
            }
        }

        return prefixes;
    }

    function findLongestCommonPrefix(prod1, prod2) {
        const minLength = Math.min(prod1.length, prod2.length);
        let commonPrefix = [];

        for (let i = 0; i < minLength; i++) {
            if (prod1[i] === prod2[i]) {
                commonPrefix.push(prod1[i]);
            } else {
                break;
            }
        }

        return commonPrefix;
    }

    function applyLeftFactoring(grammar) {
        const newGrammar = {};
        const nonTerminals = Object.keys(grammar);
        let newNonTerminalCounter = 1;

        // Copy grammar
        for (const [nt, prods] of Object.entries(grammar)) {
            newGrammar[nt] = [...prods];
        }

        // Apply left factoring to each non-terminal
        for (const nt of nonTerminals) {
            const prods = newGrammar[nt];
            if (prods.length < 2) continue;

            let changed = true;
            while (changed) {
                changed = false;
                const commonPrefix = findLongestCommonPrefixAmongAll(prods);
                
                if (commonPrefix.length > 0) {
                    // Create new non-terminal
                    const newNT = nt + newNonTerminalCounter++;
                    newGrammar[newNT] = [];

                    // Separate productions with common prefix
                    const withPrefix = [];
                    const withoutPrefix = [];

                    for (const prod of prods) {
                        if (startsWith(prod, commonPrefix)) {
                            const suffix = prod.slice(commonPrefix.length);
                            if (suffix.length === 0) {
                                newGrammar[newNT].push([]); // ε production
                            } else {
                                newGrammar[newNT].push(suffix);
                            }
                            withPrefix.push(prod);
                        } else {
                            withoutPrefix.push(prod);
                        }
                    }

                    // Update original non-terminal
                    if (withPrefix.length > 0) {
                        newGrammar[nt] = [...commonPrefix, newNT];
                        if (withoutPrefix.length > 0) {
                            newGrammar[nt] = [newGrammar[nt], ...withoutPrefix];
                        }
                        changed = true;
                    }
                }
            }
        }

        return newGrammar;
    }

    function findLongestCommonPrefixAmongAll(productions) {
        if (productions.length < 2) return [];

        let maxPrefix = [];
        for (let i = 0; i < productions.length; i++) {
            for (let j = i + 1; j < productions.length; j++) {
                const prefix = findLongestCommonPrefix(productions[i], productions[j]);
                if (prefix.length > maxPrefix.length) {
                    maxPrefix = prefix;
                }
            }
        }

        return maxPrefix;
    }

    function startsWith(production, prefix) {
        if (production.length < prefix.length) return false;
        for (let i = 0; i < prefix.length; i++) {
            if (production[i] !== prefix[i]) return false;
        }
        return true;
    }

    function displayResults(analysis, factoredGrammar) {
        resultsDiv.innerHTML = '';

        // Analysis results
        const analysisSection = document.createElement('div');
        analysisSection.className = 'result-section';
        analysisSection.innerHTML = `
            <h3>Left Factoring Analysis</h3>
            <p><strong>Common prefixes found:</strong> <span class="${analysis.hasCommonPrefixes ? 'info' : 'success'}">${analysis.hasCommonPrefixes ? 'Yes' : 'No'}</span></p>
            <p><strong>Factoring opportunities:</strong> ${analysis.totalFactoringOpportunities}</p>
        `;
        resultsDiv.appendChild(analysisSection);

        // Common prefixes details
        if (analysis.commonPrefixes.length > 0) {
            const prefixesSection = document.createElement('div');
            prefixesSection.className = 'result-section';
            prefixesSection.innerHTML = '<h3>Common Prefixes Found</h3>';
            
            for (const item of analysis.commonPrefixes) {
                const prefixDiv = document.createElement('div');
                prefixDiv.className = 'prefix-item';
                prefixDiv.innerHTML = `
                    <h4>Non-terminal: ${item.nonTerminal}</h4>
                    <p><strong>Common prefix:</strong> ${item.prefixes[0].prefix.join(' ')}</p>
                    <p><strong>Productions with prefix:</strong></p>
                    <ul>
                        ${item.prefixes[0].productions.map(prod => 
                            `<li>${prod.length === 0 ? 'ε' : prod.join(' ')}</li>`
                        ).join('')}
                    </ul>
                `;
                prefixesSection.appendChild(prefixDiv);
            }
            resultsDiv.appendChild(prefixesSection);
        }

        // Factored grammar
        const factoredSection = document.createElement('div');
        factoredSection.className = 'result-section';
        factoredSection.innerHTML = '<h3>Grammar After Left Factoring</h3>';
        
        const factoredText = formatGrammar(factoredGrammar);
        const pre = document.createElement('pre');
        pre.className = 'grammar-output';
        pre.textContent = factoredText;
        factoredSection.appendChild(pre);
        resultsDiv.appendChild(factoredSection);

        // Download button
        const downloadBtn = document.createElement('button');
        downloadBtn.textContent = 'Download Results';
        downloadBtn.className = 'download-btn';
        downloadBtn.onclick = () => {
            const content = generateReport(analysis, factoredGrammar);
            downloadAsText(content, 'left_factoring_results.txt');
        };
        resultsDiv.appendChild(downloadBtn);
    }

    function generateReport(analysis, factoredGrammar) {
        let report = `Left Factoring Report\n`;
        report += `====================\n\n`;
        
        report += `Analysis Results:\n`;
        report += `- Common prefixes found: ${analysis.hasCommonPrefixes ? 'Yes' : 'No'}\n`;
        report += `- Factoring opportunities: ${analysis.totalFactoringOpportunities}\n\n`;
        
        if (analysis.commonPrefixes.length > 0) {
            report += `Common Prefixes:\n`;
            analysis.commonPrefixes.forEach((item, i) => {
                report += `${i + 1}. Non-terminal: ${item.nonTerminal}\n`;
                report += `   Common prefix: ${item.prefixes[0].prefix.join(' ')}\n`;
                report += `   Productions with prefix:\n`;
                item.prefixes[0].productions.forEach(prod => {
                    report += `     - ${prod.length === 0 ? 'ε' : prod.join(' ')}\n`;
                });
                report += '\n';
            });
        }
        
        report += `Factored Grammar:\n`;
        report += formatGrammar(factoredGrammar);
        
        return report;
    }
}); 