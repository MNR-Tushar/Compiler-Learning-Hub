// LR(0) Parser Generator
document.addEventListener('DOMContentLoaded', function() {
    const grammarInput = document.getElementById('grammar-input');
    const generateBtn = document.getElementById('generate-btn');
    const resultsDiv = document.getElementById('results');
    const exampleBtn = document.getElementById('example-btn');
    const clearBtn = document.getElementById('clear-btn');

    // Example grammar for LR(0)
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

    generateBtn.addEventListener('click', () => {
        const grammar = grammarInput.value.trim();
        if (!grammar) {
            showNotification('Please enter a grammar', 'error');
            return;
        }

        try {
            const parsedGrammar = parseGrammar(grammar);
            const lr0Table = generateLR0Table(parsedGrammar);
            displayResults(parsedGrammar, lr0Table);
        } catch (error) {
            showNotification('Error processing grammar: ' + error.message, 'error');
        }
    });

    function generateLR0Table(grammar) {
        const nonTerminals = Object.keys(grammar);
        const terminals = new Set();
        const items = [];
        const states = [];
        const gotoTable = {};
        const actionTable = {};

        // Extract terminals
        for (const [nt, prods] of Object.entries(grammar)) {
            for (const prod of prods) {
                for (const symbol of prod) {
                    if (!nonTerminals.includes(symbol)) {
                        terminals.add(symbol);
                    }
                }
            }
        }
        terminals.add('$'); // End marker

        // Generate LR(0) items
        for (const [nt, prods] of Object.entries(grammar)) {
            for (const prod of prods) {
                for (let i = 0; i <= prod.length; i++) {
                    items.push({
                        nonTerminal: nt,
                        production: prod,
                        position: i,
                        lookahead: null
                    });
                }
            }
        }

        // Generate canonical collection of LR(0) items
        const startSymbol = Object.keys(grammar)[0];
        const augmentedGrammar = { "S'": [[startSymbol]] };
        const initialItems = generateClosure([{
            nonTerminal: "S'",
            production: [startSymbol],
            position: 0,
            lookahead: null
        }], augmentedGrammar);

        states.push(initialItems);
        const unprocessedStates = [0];

        while (unprocessedStates.length > 0) {
            const stateIndex = unprocessedStates.shift();
            const currentState = states[stateIndex];

            // Group items by symbol after dot
            const transitions = {};
            for (const item of currentState) {
                if (item.position < item.production.length) {
                    const nextSymbol = item.production[item.position];
                    if (!transitions[nextSymbol]) {
                        transitions[nextSymbol] = [];
                    }
                    transitions[nextSymbol].push({
                        nonTerminal: item.nonTerminal,
                        production: item.production,
                        position: item.position + 1,
                        lookahead: null
                    });
                }
            }

            // Generate new states for each transition
            for (const [symbol, newItems] of Object.entries(transitions)) {
                const closure = generateClosure(newItems, grammar);
                let targetStateIndex = -1;

                // Check if this state already exists
                for (let i = 0; i < states.length; i++) {
                    if (statesEqual(states[i], closure)) {
                        targetStateIndex = i;
                        break;
                    }
                }

                if (targetStateIndex === -1) {
                    targetStateIndex = states.length;
                    states.push(closure);
                    unprocessedStates.push(targetStateIndex);
                }

                // Update goto table
                if (!gotoTable[stateIndex]) gotoTable[stateIndex] = {};
                gotoTable[stateIndex][symbol] = targetStateIndex;
            }
        }

        // Generate action table
        for (let i = 0; i < states.length; i++) {
            actionTable[i] = {};
            const state = states[i];

            for (const item of state) {
                if (item.position === item.production.length) {
                    // Reduce action
                    const productionIndex = findProductionIndex(grammar, item.nonTerminal, item.production);
                    for (const terminal of terminals) {
                        if (terminal !== '$') {
                            actionTable[i][terminal] = `r${productionIndex}`;
                        }
                    }
                } else {
                    const nextSymbol = item.production[item.position];
                    if (terminals.has(nextSymbol)) {
                        // Shift action
                        if (gotoTable[i] && gotoTable[i][nextSymbol] !== undefined) {
                            actionTable[i][nextSymbol] = `s${gotoTable[i][nextSymbol]}`;
                        }
                    }
                }
            }

            // Accept action for final state
            if (state.some(item => item.nonTerminal === "S'" && item.position === 1)) {
                actionTable[i]['$'] = 'acc';
            }
        }

        return {
            states: states,
            actionTable: actionTable,
            gotoTable: gotoTable,
            terminals: Array.from(terminals),
            nonTerminals: nonTerminals,
            grammar: grammar
        };
    }

    function generateClosure(items, grammar) {
        const closure = [...items];
        let changed = true;

        while (changed) {
            changed = false;
            for (const item of closure) {
                if (item.position < item.production.length) {
                    const nextSymbol = item.production[item.position];
                    if (grammar[nextSymbol]) {
                        // Add all productions for this non-terminal
                        for (const prod of grammar[nextSymbol]) {
                            const newItem = {
                                nonTerminal: nextSymbol,
                                production: prod,
                                position: 0,
                                lookahead: null
                            };
                            if (!itemExists(closure, newItem)) {
                                closure.push(newItem);
                                changed = true;
                            }
                        }
                    }
                }
            }
        }

        return closure;
    }

    function statesEqual(state1, state2) {
        if (state1.length !== state2.length) return false;
        
        for (const item1 of state1) {
            let found = false;
            for (const item2 of state2) {
                if (item1.nonTerminal === item2.nonTerminal &&
                    item1.position === item2.position &&
                    arraysEqual(item1.production, item2.production)) {
                    found = true;
                    break;
                }
            }
            if (!found) return false;
        }
        return true;
    }

    function itemExists(items, item) {
        return items.some(existing => 
            existing.nonTerminal === item.nonTerminal &&
            existing.position === item.position &&
            arraysEqual(existing.production, item.production)
        );
    }

    function arraysEqual(arr1, arr2) {
        if (arr1.length !== arr2.length) return false;
        for (let i = 0; i < arr1.length; i++) {
            if (arr1[i] !== arr2[i]) return false;
        }
        return true;
    }

    function findProductionIndex(grammar, nonTerminal, production) {
        let index = 0;
        for (const [nt, prods] of Object.entries(grammar)) {
            for (const prod of prods) {
                if (nt === nonTerminal && arraysEqual(prod, production)) {
                    return index;
                }
                index++;
            }
        }
        return -1;
    }

    function displayResults(grammar, lr0Table) {
        resultsDiv.innerHTML = '';

        // Grammar info
        const grammarSection = document.createElement('div');
        grammarSection.className = 'result-section';
        grammarSection.innerHTML = `
            <h3>Grammar Analysis</h3>
            <p><strong>Non-terminals:</strong> ${lr0Table.nonTerminals.join(', ')}</p>
            <p><strong>Terminals:</strong> ${lr0Table.terminals.join(', ')}</p>
            <p><strong>Total states:</strong> ${lr0Table.states.length}</p>
        `;
        resultsDiv.appendChild(grammarSection);

        // LR(0) items for each state
        const itemsSection = document.createElement('div');
        itemsSection.className = 'result-section';
        itemsSection.innerHTML = '<h3>LR(0) Items by State</h3>';
        
        for (let i = 0; i < lr0Table.states.length; i++) {
            const stateDiv = document.createElement('div');
            stateDiv.className = 'state-items';
            stateDiv.innerHTML = `<h4>State ${i}:</h4>`;
            
            const itemsList = document.createElement('ul');
            lr0Table.states[i].forEach(item => {
                const li = document.createElement('li');
                const production = item.production.length === 0 ? 'ε' : item.production.join(' ');
                li.innerHTML = `${item.nonTerminal} → ${production.slice(0, item.position)}<strong>•</strong>${production.slice(item.position)}`;
                itemsList.appendChild(li);
            });
            stateDiv.appendChild(itemsList);
            itemsSection.appendChild(stateDiv);
        }
        resultsDiv.appendChild(itemsSection);

        // Action table
        const actionSection = document.createElement('div');
        actionSection.className = 'result-section';
        actionSection.innerHTML = '<h3>Action Table</h3>';
        
        const actionData = [];
        for (let i = 0; i < lr0Table.states.length; i++) {
            const row = [i];
            lr0Table.terminals.forEach(terminal => {
                row.push(lr0Table.actionTable[i][terminal] || '-');
            });
            actionData.push(row);
        }
        
        const actionTable = createTable(['State', ...lr0Table.terminals], actionData);
        actionSection.appendChild(actionTable);
        resultsDiv.appendChild(actionSection);

        // Goto table
        const gotoSection = document.createElement('div');
        gotoSection.className = 'result-section';
        gotoSection.innerHTML = '<h3>Goto Table</h3>';
        
        const gotoData = [];
        for (let i = 0; i < lr0Table.states.length; i++) {
            const row = [i];
            lr0Table.nonTerminals.forEach(nt => {
                row.push(lr0Table.gotoTable[i] && lr0Table.gotoTable[i][nt] !== undefined ? lr0Table.gotoTable[i][nt] : '-');
            });
            gotoData.push(row);
        }
        
        const gotoTable = createTable(['State', ...lr0Table.nonTerminals], gotoData);
        gotoSection.appendChild(gotoTable);
        resultsDiv.appendChild(gotoSection);

        // Download button
        const downloadBtn = document.createElement('button');
        downloadBtn.textContent = 'Download Results';
        downloadBtn.className = 'download-btn';
        downloadBtn.onclick = () => {
            const content = generateReport(grammar, lr0Table);
            downloadAsText(content, 'lr0_parser_table.txt');
        };
        resultsDiv.appendChild(downloadBtn);
    }

    function generateReport(grammar, lr0Table) {
        let report = `LR(0) Parser Table Report\n`;
        report += `==========================\n\n`;
        
        report += `Grammar:\n`;
        report += formatGrammar(grammar);
        report += `\n\n`;
        
        report += `Analysis:\n`;
        report += `- Non-terminals: ${lr0Table.nonTerminals.join(', ')}\n`;
        report += `- Terminals: ${lr0Table.terminals.join(', ')}\n`;
        report += `- Total states: ${lr0Table.states.length}\n\n`;
        
        report += `LR(0) Items by State:\n`;
        for (let i = 0; i < lr0Table.states.length; i++) {
            report += `State ${i}:\n`;
            lr0Table.states[i].forEach(item => {
                const production = item.production.length === 0 ? 'ε' : item.production.join(' ');
                report += `  ${item.nonTerminal} → ${production.slice(0, item.position)}•${production.slice(item.position)}\n`;
            });
            report += '\n';
        }
        
        report += `Action Table:\n`;
        report += `State\t${lr0Table.terminals.join('\t')}\n`;
        for (let i = 0; i < lr0Table.states.length; i++) {
            report += `${i}\t`;
            lr0Table.terminals.forEach(terminal => {
                report += `${lr0Table.actionTable[i][terminal] || '-'}\t`;
            });
            report += '\n';
        }
        
        report += `\nGoto Table:\n`;
        report += `State\t${lr0Table.nonTerminals.join('\t')}\n`;
        for (let i = 0; i < lr0Table.states.length; i++) {
            report += `${i}\t`;
            lr0Table.nonTerminals.forEach(nt => {
                report += `${lr0Table.gotoTable[i] && lr0Table.gotoTable[i][nt] !== undefined ? lr0Table.gotoTable[i][nt] : '-'}\t`;
            });
            report += '\n';
        }
        
        return report;
    }
}); 