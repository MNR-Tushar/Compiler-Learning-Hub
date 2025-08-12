// Regular Expression to Language Converter
document.addEventListener('DOMContentLoaded', function() {
    const regexInput = document.getElementById('regex-input');
    const convertBtn = document.getElementById('convert-btn');
    const resultsDiv = document.getElementById('results');
    const exampleBtn = document.getElementById('example-btn');
    const clearBtn = document.getElementById('clear-btn');

    // Example regular expressions
    const examples = [
        {
            name: "Strings starting with 'a' and ending with 'b'",
            regex: "a(a|b)*b",
            description: "All strings over {a,b} that start with 'a' and end with 'b'"
        },
        {
            name: "Binary strings with even number of 1s",
            regex: "(0*10*10*)*",
            description: "Strings over {0,1} with even number of 1s"
        },
        {
            name: "Strings without '11' substring",
            regex: "(0|10)*",
            description: "Strings over {0,1} that don't contain '11' as substring"
        },
        {
            name: "Strings ending with 'abb'",
            regex: "(a|b)*abb",
            description: "All strings over {a,b} that end with 'abb'"
        }
    ];

    exampleBtn.addEventListener('click', () => {
        const randomExample = examples[Math.floor(Math.random() * examples.length)];
        regexInput.value = randomExample.regex;
    });

    clearBtn.addEventListener('click', () => {
        regexInput.value = '';
        resultsDiv.innerHTML = '';
    });

    convertBtn.addEventListener('click', () => {
        const regex = regexInput.value.trim();
        if (!regex) {
            showNotification('Please enter a regular expression', 'error');
            return;
        }

        try {
            const analysis = analyzeRegex(regex);
            const language = generateLanguageDescription(analysis);
            displayResults(analysis, language);
        } catch (error) {
            showNotification('Error processing regex: ' + error.message, 'error');
        }
    });

    function analyzeRegex(regex) {
        const analysis = {
            regex: regex,
            alphabet: new Set(),
            operators: [],
            structure: [],
            complexity: 'simple',
            patterns: []
        };

        // Extract alphabet symbols
        const symbols = regex.match(/[a-zA-Z0-9]/g);
        if (symbols) {
            symbols.forEach(symbol => analysis.alphabet.add(symbol));
        }

        // Analyze operators
        if (regex.includes('*')) analysis.operators.push('Kleene star (*)');
        if (regex.includes('+')) analysis.operators.push('One or more (+)');
        if (regex.includes('?')) analysis.operators.push('Optional (?)');
        if (regex.includes('|')) analysis.operators.push('Alternation (|)');
        if (regex.includes('(') && regex.includes(')')) analysis.operators.push('Grouping ()');

        // Analyze structure
        if (regex.includes('^') || regex.includes('$')) {
            analysis.structure.push('Anchored');
        }

        if (regex.includes('*') && regex.includes('+')) {
            analysis.complexity = 'complex';
        } else if (regex.includes('*') || regex.includes('+')) {
            analysis.complexity = 'moderate';
        }

        // Detect common patterns
        if (regex.match(/^[a-z]\([a-z|]+\*[a-z]$/)) {
            analysis.patterns.push('Starts with specific symbol, ends with specific symbol');
        }

        if (regex.match(/\([01]\*[01][01]\*\)\*/)) {
            analysis.patterns.push('Even count pattern');
        }

        if (regex.match(/\([01]\|[01][01]\)\*/)) {
            analysis.patterns.push('Avoidance pattern');
        }

        if (regex.match(/\([a-z|]+\*[a-z]+$/)) {
            analysis.patterns.push('Ends with specific suffix');
        }

        return analysis;
    }

    function generateLanguageDescription(analysis) {
        let description = "The language described by this regular expression contains ";
        
        // Generate description based on patterns
        if (analysis.patterns.length > 0) {
            description += analysis.patterns[0].toLowerCase();
        } else if (analysis.regex.includes('*') && analysis.regex.includes('|')) {
            description += "strings over the alphabet {" + Array.from(analysis.alphabet).join(',') + "} with specific structural constraints";
        } else if (analysis.regex.includes('*')) {
            description += "strings over the alphabet {" + Array.from(analysis.alphabet).join(',') + "} with repetition patterns";
        } else {
            description += "specific strings over the alphabet {" + Array.from(analysis.alphabet).join(',') + "}";
        }

        description += ".";

        // Add specific details based on regex structure
        if (analysis.regex.includes('^') || analysis.regex.startsWith('a') && analysis.regex.endsWith('b')) {
            description += " The strings start with 'a' and end with 'b'.";
        }

        if (analysis.regex.includes('(0*10*10*)*')) {
            description += " Specifically, it generates binary strings with an even number of 1s.";
        }

        if (analysis.regex.includes('(0|10)*')) {
            description += " It avoids the substring '11' by ensuring 1s are always followed by 0s or appear at the end.";
        }

        if (analysis.regex.includes('(a|b)*abb')) {
            description += " All strings in this language end with the suffix 'abb'.";
        }

        return description;
    }

    function displayResults(analysis, language) {
        resultsDiv.innerHTML = '';

        // Regex analysis
        const analysisSection = document.createElement('div');
        analysisSection.className = 'result-section';
        analysisSection.innerHTML = `
            <h3>Regular Expression Analysis</h3>
            <p><strong>Regex:</strong> <code>${analysis.regex}</code></p>
            <p><strong>Alphabet:</strong> {${Array.from(analysis.alphabet).join(', ')}</p>
            <p><strong>Operators used:</strong> ${analysis.operators.join(', ')}</p>
            <p><strong>Complexity:</strong> ${analysis.complexity}</p>
        `;
        resultsDiv.appendChild(analysisSection);

        // Language description
        const languageSection = document.createElement('div');
        languageSection.className = 'result-section';
        languageSection.innerHTML = `
            <h3>Language Description</h3>
            <p>${language}</p>
        `;
        resultsDiv.appendChild(languageSection);

        // Pattern analysis
        if (analysis.patterns.length > 0) {
            const patternsSection = document.createElement('div');
            patternsSection.className = 'result-section';
            patternsSection.innerHTML = `
                <h3>Detected Patterns</h3>
                <ul>
                    ${analysis.patterns.map(pattern => `<li>${pattern}</li>`).join('')}
                </ul>
            `;
            resultsDiv.appendChild(patternsSection);
        }

        // Test examples
        const testSection = document.createElement('div');
        testSection.className = 'result-section';
        testSection.innerHTML = `
            <h3>Test Examples</h3>
            <div class="test-examples">
                ${generateTestExamples(analysis.regex, analysis.alphabet)}
            </div>
        `;
        resultsDiv.appendChild(testSection);

        // Download button
        const downloadBtn = document.createElement('button');
        downloadBtn.textContent = 'Download Results';
        downloadBtn.className = 'download-btn';
        downloadBtn.onclick = () => {
            const content = generateReport(analysis, language);
            downloadAsText(content, 'regex_to_language.txt');
        };
        resultsDiv.appendChild(downloadBtn);
    }

    function generateTestExamples(regex, alphabet) {
        const examples = [];
        const alphabetArray = Array.from(alphabet);
        
        // Generate test cases based on regex structure
        if (regex.includes('^') || regex.startsWith('a') && regex.endsWith('b')) {
            examples.push('ab');
            examples.push('aab');
            examples.push('abb');
        }
        
        if (regex.includes('(0*10*10*)*')) {
            examples.push(''); // Empty string
            examples.push('00');
            examples.push('11');
            examples.push('1010');
        }
        
        if (regex.includes('(0|10)*')) {
            examples.push(''); // Empty string
            examples.push('0');
            examples.push('10');
            examples.push('010');
        }
        
        if (regex.includes('(a|b)*abb')) {
            examples.push('abb');
            examples.push('aabb');
            examples.push('babb');
        }
        
        // Add some basic examples
        if (examples.length === 0) {
            examples.push(''); // Empty string
            if (alphabetArray.length > 0) {
                examples.push(alphabetArray[0]);
                if (alphabetArray.length > 1) {
                    examples.push(alphabetArray[0] + alphabetArray[1]);
                }
            }
        }
        
        let html = '<div class="test-cases">';
        examples.forEach(example => {
            const matches = testRegex(regex, example);
            html += `<div class="test-case ${matches ? 'match' : 'no-match'}">`;
            html += `<strong>${example || 'ε'}</strong>: ${matches ? '✓ Matches' : '✗ No match'}`;
            html += '</div>';
        });
        html += '</div>';
        
        return html;
    }

    function testRegex(regex, string) {
        try {
            // Handle special cases
            if (regex.includes('^') || regex.includes('$')) {
                const regexObj = new RegExp(regex);
                return regexObj.test(string);
            } else {
                const regexObj = new RegExp('^' + regex + '$');
                return regexObj.test(string);
            }
        } catch (e) {
            return false;
        }
    }

    function generateReport(analysis, language) {
        let report = `Regular Expression to Language Report\n`;
        report += `=====================================\n\n`;
        
        report += `Regular Expression:\n`;
        report += `${analysis.regex}\n\n`;
        
        report += `Analysis:\n`;
        report += `- Alphabet: {${Array.from(analysis.alphabet).join(', ')}}\n`;
        report += `- Operators: ${analysis.operators.join(', ')}\n`;
        report += `- Complexity: ${analysis.complexity}\n\n`;
        
        if (analysis.patterns.length > 0) {
            report += `Detected Patterns:\n`;
            analysis.patterns.forEach(pattern => {
                report += `- ${pattern}\n`;
            });
            report += '\n';
        }
        
        report += `Language Description:\n`;
        report += `${language}\n`;
        
        return report;
    }
}); 