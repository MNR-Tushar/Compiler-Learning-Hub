// Language to Regular Expression Converter
document.addEventListener('DOMContentLoaded', function() {
    const languageInput = document.getElementById('language-input');
    const convertBtn = document.getElementById('convert-btn');
    const resultsDiv = document.getElementById('results');
    const exampleBtn = document.getElementById('example-btn');
    const clearBtn = document.getElementById('clear-btn');

    // Example language descriptions
    const examples = [
        {
            name: "Strings starting with 'a' and ending with 'b'",
            description: "All strings over {a,b} that start with 'a' and end with 'b'",
            regex: "a(a|b)*b"
        },
        {
            name: "Binary strings with even number of 1s",
            description: "Strings over {0,1} with even number of 1s",
            regex: "(0*10*10*)*"
        },
        {
            name: "Strings without '11' substring",
            description: "Strings over {0,1} that don't contain '11' as substring",
            regex: "(0|10)*"
        }
    ];

    exampleBtn.addEventListener('click', () => {
        const randomExample = examples[Math.floor(Math.random() * examples.length)];
        languageInput.value = randomExample.description;
    });

    clearBtn.addEventListener('click', () => {
        languageInput.value = '';
        resultsDiv.innerHTML = '';
    });

    convertBtn.addEventListener('click', () => {
        const language = languageInput.value.trim();
        if (!language) {
            showNotification('Please enter a language description', 'error');
            return;
        }

        try {
            const analysis = analyzeLanguage(language);
            const regex = generateRegex(analysis);
            displayResults(analysis, regex);
        } catch (error) {
            showNotification('Error processing language: ' + error.message, 'error');
        }
    });

    function analyzeLanguage(description) {
        const analysis = {
            description: description,
            alphabet: new Set(),
            constraints: [],
            patterns: [],
            length: null,
            startSymbol: null,
            endSymbol: null,
            forbidden: [],
            required: []
        };

        // Extract alphabet
        const alphabetMatch = description.match(/\{([^}]+)\}/g);
        if (alphabetMatch) {
            alphabetMatch.forEach(match => {
                const symbols = match.slice(1, -1).split(',').map(s => s.trim());
                symbols.forEach(symbol => analysis.alphabet.add(symbol));
            });
        }

        // Extract common patterns
        if (description.includes("start with")) {
            const startMatch = description.match(/start with ['"`]([^'"`])['"`]/);
            if (startMatch) {
                analysis.startSymbol = startMatch[1];
                analysis.constraints.push("starts with " + startMatch[1]);
            }
        }

        if (description.includes("end with")) {
            const endMatch = description.match(/end with ['"`]([^'"`])['"`]/);
            if (endMatch) {
                analysis.endSymbol = endMatch[1];
                analysis.constraints.push("ends with " + endMatch[1]);
            }
        }

        if (description.includes("even number")) {
            analysis.constraints.push("even count");
        }

        if (description.includes("odd number")) {
            analysis.constraints.push("odd count");
        }

        if (description.includes("don't contain") || description.includes("doesn't contain")) {
            const forbiddenMatch = description.match(/don't contain ['"`]([^'"`]+)['"`]/);
            if (forbiddenMatch) {
                analysis.forbidden.push(forbiddenMatch[1]);
                analysis.constraints.push("forbidden substring: " + forbiddenMatch[1]);
            }
        }

        if (description.includes("contain")) {
            const requiredMatch = description.match(/contain ['"`]([^'"`]+)['"`]/);
            if (requiredMatch) {
                analysis.required.push(requiredMatch[1]);
                analysis.constraints.push("required substring: " + requiredMatch[1]);
            }
        }

        // Extract length constraints
        if (description.includes("length")) {
            const lengthMatch = description.match(/length is (\w+)/);
            if (lengthMatch) {
                analysis.length = lengthMatch[1];
                analysis.constraints.push("length constraint: " + lengthMatch[1]);
            }
        }

        return analysis;
    }

    function generateRegex(analysis) {
        let regex = "";
        const alphabet = Array.from(analysis.alphabet).join('|');
        
        if (analysis.alphabet.size === 0) {
            // Default to binary if no alphabet specified
            analysis.alphabet.add('0');
            analysis.alphabet.add('1');
        }

        // Handle different constraint types
        if (analysis.startSymbol && analysis.endSymbol) {
            regex = `${escapeRegex(analysis.startSymbol)}(${alphabet})*${escapeRegex(analysis.endSymbol)}`;
        } else if (analysis.startSymbol) {
            regex = `${escapeRegex(analysis.startSymbol)}(${alphabet})*`;
        } else if (analysis.endSymbol) {
            regex = `(${alphabet})*${escapeRegex(analysis.endSymbol)}`;
        } else if (analysis.constraints.includes("even count")) {
            // Even number of 1s in binary
            regex = `(0*10*10*)*`;
        } else if (analysis.constraints.includes("odd count")) {
            // Odd number of 1s in binary
            regex = `(0*10*10*)*0*10*`;
        } else if (analysis.forbidden.length > 0) {
            // Avoid forbidden substrings
            const forbidden = analysis.forbidden[0];
            if (forbidden === "11") {
                regex = `(0|10)*`;
            } else if (forbidden === "00") {
                regex = `(1|01)*`;
            } else {
                regex = `(${alphabet})*`;
            }
        } else if (analysis.required.length > 0) {
            // Must contain required substrings
            const required = analysis.required[0];
            regex = `(${alphabet})*${escapeRegex(required)}(${alphabet})*`;
        } else if (analysis.length === "even") {
            regex = `(${alphabet}{2})*`;
        } else if (analysis.length === "odd") {
            regex = `${alphabet}(${alphabet}{2})*`;
        } else {
            // Default: any string over the alphabet
            regex = `(${alphabet})*`;
        }

        return regex;
    }

    function escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function displayResults(analysis, regex) {
        resultsDiv.innerHTML = '';

        // Analysis summary
        const summarySection = document.createElement('div');
        summarySection.className = 'result-section';
        summarySection.innerHTML = `
            <h3>Language Analysis</h3>
            <p><strong>Description:</strong> ${analysis.description}</p>
            <p><strong>Alphabet:</strong> {${Array.from(analysis.alphabet).join(', ')}</p>
            <p><strong>Constraints:</strong> ${analysis.constraints.length > 0 ? analysis.constraints.join(', ') : 'None'}</p>
        `;
        resultsDiv.appendChild(summarySection);

        // Generated regex
        const regexSection = document.createElement('div');
        regexSection.className = 'result-section';
        regexSection.innerHTML = `
            <h3>Generated Regular Expression</h3>
            <div class="regex-display">
                <code>${regex}</code>
            </div>
            <p><strong>Explanation:</strong> ${explainRegex(regex, analysis)}</p>
        `;
        resultsDiv.appendChild(regexSection);

        // Test examples
        const testSection = document.createElement('div');
        testSection.className = 'result-section';
        testSection.innerHTML = `
            <h3>Test Examples</h3>
            <div class="test-examples">
                ${generateTestExamples(regex, analysis)}
            </div>
        `;
        resultsDiv.appendChild(testSection);

        // Download button
        const downloadBtn = document.createElement('button');
        downloadBtn.textContent = 'Download Results';
        downloadBtn.className = 'download-btn';
        downloadBtn.onclick = () => {
            const content = generateReport(analysis, regex);
            downloadAsText(content, 'language_to_regex.txt');
        };
        resultsDiv.appendChild(downloadBtn);
    }

    function explainRegex(regex, analysis) {
        if (regex.includes("start")) {
            return "This regex ensures the string starts with the specified symbol, followed by any sequence of alphabet symbols, and ends with the specified symbol.";
        } else if (regex.includes("even count")) {
            return "This regex generates strings with an even number of 1s by grouping pairs of 1s with any number of 0s in between.";
        } else if (regex.includes("forbidden")) {
            return "This regex avoids the forbidden substring by carefully structuring the pattern to prevent its occurrence.";
        } else if (regex.includes("required")) {
            return "This regex ensures the required substring appears somewhere in the string, with any symbols before and after.";
        } else {
            return "This regex generates all possible strings over the given alphabet.";
        }
    }

    function generateTestExamples(regex, analysis) {
        const examples = [];
        const alphabet = Array.from(analysis.alphabet);
        
        // Generate some simple test cases
        if (analysis.startSymbol && analysis.endSymbol) {
            examples.push(analysis.startSymbol + analysis.endSymbol);
            examples.push(analysis.startSymbol + alphabet[0] + analysis.endSymbol);
        }
        
        if (alphabet.length >= 2) {
            examples.push(alphabet[0] + alphabet[1]);
            examples.push(alphabet[0] + alphabet[0] + alphabet[1]);
        }
        
        examples.push(""); // Empty string
        
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
            const regexObj = new RegExp('^' + regex + '$');
            return regexObj.test(string);
        } catch (e) {
            return false;
        }
    }

    function generateReport(analysis, regex) {
        let report = `Language to Regular Expression Report\n`;
        report += `=====================================\n\n`;
        
        report += `Language Description:\n`;
        report += `${analysis.description}\n\n`;
        
        report += `Analysis:\n`;
        report += `- Alphabet: {${Array.from(analysis.alphabet).join(', ')}}\n`;
        report += `- Constraints: ${analysis.constraints.join(', ')}\n\n`;
        
        report += `Generated Regular Expression:\n`;
        report += `${regex}\n\n`;
        
        report += `Explanation:\n`;
        report += `${explainRegex(regex, analysis)}\n`;
        
        return report;
    }
}); 