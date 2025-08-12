// Three Address Code Generator
document.addEventListener('DOMContentLoaded', function() {
    const expressionInput = document.getElementById('expression-input');
    const generateBtn = document.getElementById('generate-btn');
    const resultsDiv = document.getElementById('results');
    const exampleBtn = document.getElementById('example-btn');
    const clearBtn = document.getElementById('clear-btn');

    // Example expressions for TAC generation
    const examples = [
        "a + b * c",
        "x = (a + b) * (c - d)",
        "if (x > 0) then y = x + 1 else y = x - 1",
        "while (i < n) do i = i + 1"
    ];

    exampleBtn.addEventListener('click', () => {
        const randomExample = examples[Math.floor(Math.random() * examples.length)];
        expressionInput.value = randomExample;
    });

    clearBtn.addEventListener('click', () => {
        expressionInput.value = '';
        resultsDiv.innerHTML = '';
    });

    generateBtn.addEventListener('click', () => {
        const expression = expressionInput.value.trim();
        if (!expression) {
            showNotification('Please enter an expression', 'error');
            return;
        }

        try {
            const tac = generateTAC(expression);
            displayResults(expression, tac);
        } catch (error) {
            showNotification('Error generating TAC: ' + error.message, 'error');
        }
    });

    function generateTAC(expression) {
        // Simple TAC generator for arithmetic expressions
        const tokens = tokenize(expression);
        const postfix = infixToPostfix(tokens);
        const tac = postfixToTAC(postfix);
        
        return {
            original: expression,
            tokens: tokens,
            postfix: postfix,
            tac: tac,
            symbolTable: generateSymbolTable(tokens)
        };
    }

    function tokenize(expression) {
        const tokens = [];
        let current = '';
        
        for (let i = 0; i < expression.length; i++) {
            const char = expression[i];
            
            if (char === ' ') continue;
            
            if (char === '(' || char === ')') {
                if (current) {
                    tokens.push(current);
                    current = '';
                }
                tokens.push(char);
            } else if (isOperator(char)) {
                if (current) {
                    tokens.push(current);
                    current = '';
                }
                tokens.push(char);
            } else {
                current += char;
            }
        }
        
        if (current) {
            tokens.push(current);
        }
        
        return tokens;
    }

    function isOperator(char) {
        return '+-*/^><=!&|'.includes(char);
    }

    function getPrecedence(operator) {
        const precedences = {
            '^': 4,
            '*': 3, '/': 3,
            '+': 2, '-': 2,
            '>': 1, '<': 1, '>=': 1, '<=': 1, '==': 1, '!=': 1,
            '&&': 0, '||': 0
        };
        return precedences[operator] || 0;
    }

    function infixToPostfix(tokens) {
        const output = [];
        const stack = [];
        
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            
            if (token === '(') {
                stack.push(token);
            } else if (token === ')') {
                while (stack.length > 0 && stack[stack.length - 1] !== '(') {
                    output.push(stack.pop());
                }
                if (stack.length > 0 && stack[stack.length - 1] === '(') {
                    stack.pop();
                }
            } else if (isOperator(token)) {
                while (stack.length > 0 && 
                       stack[stack.length - 1] !== '(' && 
                       getPrecedence(stack[stack.length - 1]) >= getPrecedence(token)) {
                    output.push(stack.pop());
                }
                stack.push(token);
            } else {
                output.push(token);
            }
        }
        
        while (stack.length > 0) {
            output.push(stack.pop());
        }
        
        return output;
    }

    function postfixToTAC(postfix) {
        const stack = [];
        const tac = [];
        let tempCounter = 1;
        
        for (const token of postfix) {
            if (!isOperator(token)) {
                stack.push(token);
            } else {
                const b = stack.pop();
                const a = stack.pop();
                
                if (a === undefined || b === undefined) {
                    throw new Error('Invalid expression');
                }
                
                const tempVar = `t${tempCounter++}`;
                tac.push(`${tempVar} = ${a} ${token} ${b}`);
                stack.push(tempVar);
            }
        }
        
        return tac;
    }

    function generateSymbolTable(tokens) {
        const symbols = new Set();
        
        for (const token of tokens) {
            if (!isOperator(token) && token !== '(' && token !== ')' && !isNumber(token)) {
                symbols.add(token);
            }
        }
        
        return Array.from(symbols);
    }

    function isNumber(str) {
        return !isNaN(str) && !isNaN(parseFloat(str));
    }

    function displayResults(expression, tac) {
        resultsDiv.innerHTML = '';

        // Original expression
        const originalSection = document.createElement('div');
        originalSection.className = 'result-section';
        originalSection.innerHTML = `
            <h3>Original Expression</h3>
            <p><code>${tac.original}</code></p>
        `;
        resultsDiv.appendChild(originalSection);

        // Tokenization
        const tokensSection = document.createElement('div');
        tokensSection.className = 'result-section';
        tokensSection.innerHTML = `
            <h3>Tokenization</h3>
            <p><strong>Tokens:</strong> [${tac.tokens.join(', ')}]</p>
        `;
        resultsDiv.appendChild(tokensSection);

        // Postfix notation
        const postfixSection = document.createElement('div');
        postfixSection.className = 'result-section';
        postfixSection.innerHTML = `
            <h3>Postfix Notation</h3>
            <p><strong>Postfix:</strong> ${tac.postfix.join(' ')}</p>
        `;
        resultsDiv.appendChild(postfixSection);

        // Three Address Code
        const tacSection = document.createElement('div');
        tacSection.className = 'result-section';
        tacSection.innerHTML = `
            <h3>Three Address Code</h3>
            <div class="tac-code">
                ${tac.tac.map((line, index) => `<div class="tac-line">${index + 1}: ${line}</div>`).join('')}
            </div>
        `;
        resultsDiv.appendChild(tacSection);

        // Symbol table
        const symbolSection = document.createElement('div');
        symbolSection.className = 'result-section';
        symbolSection.innerHTML = `
            <h3>Symbol Table</h3>
            <p><strong>Variables:</strong> ${tac.symbolTable.join(', ')}</p>
        `;
        resultsDiv.appendChild(symbolSection);

        // Download button
        const downloadBtn = document.createElement('button');
        downloadBtn.textContent = 'Download Results';
        downloadBtn.className = 'download-btn';
        downloadBtn.onclick = () => {
            const content = generateReport(tac);
            downloadAsText(content, 'three_address_code.txt');
        };
        resultsDiv.appendChild(downloadBtn);
    }

    function generateReport(tac) {
        let report = `Three Address Code Generation Report\n`;
        report += `=====================================\n\n`;
        
        report += `Original Expression:\n`;
        report += `${tac.original}\n\n`;
        
        report += `Tokenization:\n`;
        report += `Tokens: [${tac.tokens.join(', ')}]\n\n`;
        
        report += `Postfix Notation:\n`;
        report += `${tac.postfix.join(' ')}\n\n`;
        
        report += `Three Address Code:\n`;
        tac.tac.forEach((line, index) => {
            report += `${index + 1}: ${line}\n`;
        });
        report += '\n';
        
        report += `Symbol Table:\n`;
        report += `Variables: ${tac.symbolTable.join(', ')}\n`;
        
        return report;
    }
}); 