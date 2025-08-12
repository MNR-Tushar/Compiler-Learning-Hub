// FIRST and FOLLOW sets computation
document.addEventListener('DOMContentLoaded', function() {
    const grammarInput = document.getElementById('grammar-input');
    const startSymbolInput = document.getElementById('start-symbol');
    const computeBtn = document.getElementById('compute-btn');
    const resultsDiv = document.getElementById('results');
    const example1Btn = document.getElementById('example1-btn');
    const example2Btn = document.getElementById('example2-btn');
    const example3Btn = document.getElementById('example3-btn');
    const example4Btn = document.getElementById('example4-btn');
    const clearBtn = document.getElementById('clear-btn');

    // Multiple example grammars
    const examples = {
        arithmetic: {
            grammar: `E -> T E'
E' -> + T E' | ε
T -> F T'
T' -> * F T' | ε
F -> ( E ) | id`,
            start: 'E'
        },
        ifElse: {
            grammar: `stmt -> if_stmt | assign_stmt
if_stmt -> if ( expr ) stmt else stmt
assign_stmt -> id = expr
expr -> id | num | expr + expr | expr * expr`,
            start: 'stmt'
        },
        assignment: {
            grammar: `program -> stmt_list
stmt_list -> stmt stmt_list | ε
stmt -> assign_stmt | if_stmt | while_stmt
assign_stmt -> id = expr ;
if_stmt -> if ( expr ) stmt else stmt
while_stmt -> while ( expr ) stmt
expr -> term | expr + term | expr - term
term -> factor | term * factor | term / factor
factor -> id | num | ( expr )`,
            start: 'program'
        },
        lists: {
            grammar: `list -> [ elements ]
elements -> element elements_tail | ε
elements_tail -> , element elements_tail | ε
element -> num | id | list`,
            start: 'list'
        }
    };

    example1Btn.addEventListener('click', () => {
        grammarInput.value = examples.arithmetic.grammar;
        startSymbolInput.value = examples.arithmetic.start;
    });

    example2Btn.addEventListener('click', () => {
        grammarInput.value = examples.ifElse.grammar;
        startSymbolInput.value = examples.ifElse.start;
    });

    example3Btn.addEventListener('click', () => {
        grammarInput.value = examples.assignment.grammar;
        startSymbolInput.value = examples.assignment.start;
    });

    example4Btn.addEventListener('click', () => {
        grammarInput.value = examples.lists.grammar;
        startSymbolInput.value = examples.lists.start;
    });

    clearBtn.addEventListener('click', () => {
        grammarInput.value = '';
        startSymbolInput.value = '';
        resultsDiv.innerHTML = '';
    });

    computeBtn.addEventListener('click', async () => {
        const grammar = grammarInput.value.trim();
        const startSymbol = startSymbolInput.value.trim();

        if (!grammar) {
            showNotification('Please enter a grammar', 'error');
            return;
        }

        try {
            const response = await fetch('/api/compute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    grammar: grammar,
                    start: startSymbol
                })
            });

            const data = await response.json();
            
            if (data.ok) {
                displayResults(data.result, startSymbol || data.start);
            } else {
                showNotification(data.error, 'error');
            }
        } catch (error) {
            showNotification('Error computing FIRST and FOLLOW sets', 'error');
        }
    });

    function displayResults(result, startSymbol) {
        resultsDiv.innerHTML = '';

        // Display grammar info
        const grammarInfo = document.createElement('div');
        grammarInfo.className = 'result-section';
        grammarInfo.innerHTML = `
            <h3>Grammar Analysis</h3>
            <p><strong>Start Symbol:</strong> ${startSymbol}</p>
            <p><strong>LL(1):</strong> <span class="${result.is_ll1 ? 'success' : 'error'}">${result.is_ll1 ? 'Yes' : 'No'}</span></p>
        `;
        resultsDiv.appendChild(grammarInfo);

        // Display FIRST sets
        const firstSection = document.createElement('div');
        firstSection.className = 'result-section';
        firstSection.innerHTML = '<h3>FIRST Sets</h3>';
        
        const firstTable = createTable(
            ['Non-terminal', 'FIRST Set'],
            Object.entries(result.first).map(([nt, firstSet]) => [nt, firstSet.join(', ')])
        );
        firstSection.appendChild(firstTable);
        resultsDiv.appendChild(firstSection);

        // Display FOLLOW sets
        const followSection = document.createElement('div');
        followSection.className = 'result-section';
        followSection.innerHTML = '<h3>FOLLOW Sets</h3>';
        
        const followTable = createTable(
            ['Non-terminal', 'FOLLOW Set'],
            Object.entries(result.follow).map(([nt, followSet]) => [nt, followSet.join(', ')])
        );
        followSection.appendChild(followTable);
        resultsDiv.appendChild(followSection);

        // Display LL(1) parsing table
        const tableSection = document.createElement('div');
        tableSection.className = 'result-section';
        tableSection.innerHTML = '<h3>LL(1) Parsing Table</h3>';
        
        // Get all terminals
        const terminals = new Set();
        Object.values(result.table).forEach(row => {
            Object.keys(row).forEach(term => {
                if (term !== '$') terminals.add(term);
            });
        });
        const sortedTerminals = ['$', ...Array.from(terminals).sort()];
        
        // Create table data
        const tableData = Object.entries(result.table).map(([nt, row]) => {
            const rowData = [nt];
            sortedTerminals.forEach(term => {
                if (row[term]) {
                    if (Array.isArray(row[term])) {
                        rowData.push(row[term].length === 0 ? 'ε' : row[term].join(' '));
                    } else {
                        rowData.push(row[term]);
                    }
                } else {
                    rowData.push('-');
                }
            });
            return rowData;
        });

        const parsingTable = createTable(['Non-terminal', ...sortedTerminals], tableData);
        tableSection.appendChild(parsingTable);
        resultsDiv.appendChild(tableSection);

        // Add download button
        const downloadBtn = document.createElement('button');
        downloadBtn.textContent = 'Download Results';
        downloadBtn.className = 'download-btn';
        downloadBtn.onclick = () => {
            const content = generateReport(result, startSymbol);
            downloadAsText(content, 'first_follow_analysis.txt');
        };
        resultsDiv.appendChild(downloadBtn);
    }

    function generateReport(result, startSymbol) {
        let report = `FIRST and FOLLOW Sets Analysis\n`;
        report += `================================\n\n`;
        report += `Start Symbol: ${startSymbol}\n`;
        report += `LL(1): ${result.is_ll1 ? 'Yes' : 'No'}\n\n`;
        
        report += `FIRST Sets:\n`;
        Object.entries(result.first).forEach(([nt, firstSet]) => {
            report += `${nt}: {${firstSet.join(', ')}}\n`;
        });
        
        report += `\nFOLLOW Sets:\n`;
        Object.entries(result.follow).forEach(([nt, followSet]) => {
            report += `${nt}: {${followSet.join(', ')}}\n`;
        });
        
        report += `\nLL(1) Parsing Table:\n`;
        const terminals = new Set();
        Object.values(result.table).forEach(row => {
            Object.keys(row).forEach(term => terminals.add(term));
        });
        const sortedTerminals = Array.from(terminals).sort();
        
        report += `Non-terminal\t${sortedTerminals.join('\t')}\n`;
        Object.entries(result.table).forEach(([nt, row]) => {
            report += `${nt}\t`;
            sortedTerminals.forEach(term => {
                if (row[term]) {
                    if (Array.isArray(row[term])) {
                        report += `${row[term].length === 0 ? 'ε' : row[term].join(' ')}\t`;
                    } else {
                        report += `${row[term]}\t`;
                    }
                } else {
                    report += `-\t`;
                }
            });
            report += '\n';
        });
        
        return report;
    }
}); 