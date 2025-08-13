// Language to Regular Expression Converter (Improved)
document.addEventListener('DOMContentLoaded', function() {
    const languageInput = document.getElementById('language-input');
    const convertBtn = document.getElementById('convert-btn');
    const resultsDiv = document.getElementById('results');
    const exampleBtn = document.getElementById('example-btn');
    const clearBtn = document.getElementById('clear-btn');

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
            description,
            alphabet: new Set(),
            constraints: [],
            startSymbol: null,
            endSymbol: null,
            forbidden: [],
            required: [],
            length: null
        };

        const alphabetMatch = description.match(/\{([^}]+)\}/);
        if (alphabetMatch) {
            alphabetMatch[1].split(',').map(s => s.trim()).forEach(sym => analysis.alphabet.add(sym));
        }

        const startMatch = description.match(/start with ['"`]([^'"`])['"`]/);
        if (startMatch) {
            analysis.startSymbol = startMatch[1];
            analysis.constraints.push("starts with " + startMatch[1]);
        }

        const endMatch = description.match(/end with ['"`]([^'"`])['"`]/);
        if (endMatch) {
            analysis.endSymbol = endMatch[1];
            analysis.constraints.push("ends with " + endMatch[1]);
        }

        if (/even number/.test(description)) analysis.constraints.push("even count");
        if (/odd number/.test(description)) analysis.constraints.push("odd count");

        const forbiddenMatches = [...description.matchAll(/(?:don't|doesn't) contain ['"`]([^'"`]+)['"`]/g)];
        forbiddenMatches.forEach(m => {
            analysis.forbidden.push(m[1]);
            analysis.constraints.push("forbidden substring: " + m[1]);
        });

        const requiredMatches = [...description.matchAll(/contain ['"`]([^'"`]+)['"`]/g)];
        requiredMatches.forEach(m => {
            analysis.required.push(m[1]);
            analysis.constraints.push("required substring: " + m[1]);
        });

        const lengthMatch = description.match(/length is (\w+)/);
        if (lengthMatch) {
            analysis.length = lengthMatch[1];
            analysis.constraints.push("length constraint: " + lengthMatch[1]);
        }

        return analysis;
    }

    function generateRegex(analysis) {
        let regex = "";
        const alphabet = Array.from(analysis.alphabet);
        if (alphabet.length === 0) {
            alphabet.push('0','1'); // default
        }
        const alphaRegex = alphabet.map(escapeRegex).join('|');

        // Start + End
        if (analysis.startSymbol && analysis.endSymbol) {
            regex = `${escapeRegex(analysis.startSymbol)}(${alphaRegex})*${escapeRegex(analysis.endSymbol)}`;
        } else if (analysis.startSymbol) {
            regex = `${escapeRegex(analysis.startSymbol)}(${alphaRegex})*`;
        } else if (analysis.endSymbol) {
            regex = `(${alphaRegex})*${escapeRegex(analysis.endSymbol)}`;
        } else {
            regex = `(${alphaRegex})*`;
        }

        // Forbidden substrings
        analysis.forbidden.forEach(f => {
            if (f === "11") regex = `(0|10)*`;
            if (f === "00") regex = `(1|01)*`;
        });

        // Required substrings
        analysis.required.forEach(r => {
            regex = `(${alphaRegex})*${escapeRegex(r)}(${alphaRegex})*`;
        });

        // Even/Odd length
        if (analysis.length === "even") regex = `(${alphaRegex}{2})*`;
        if (analysis.length === "odd") regex = `${alphaRegex}(${alphaRegex}{2})*`;

        // Even/Odd count (only binary supported)
        if (analysis.constraints.includes("even count")) regex = `(0*10*10*)*`;
        if (analysis.constraints.includes("odd count")) regex = `(0*10*10*)*0*10*`;

        return regex;
    }

    function escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function displayResults(analysis, regex) {
        resultsDiv.innerHTML = '';

        const summarySection = document.createElement('div');
        summarySection.className = 'result-section';
        summarySection.innerHTML = `
            <h3>Language Analysis</h3>
            <p><strong>Description:</strong> ${analysis.description}</p>
            <p><strong>Alphabet:</strong> {${Array.from(analysis.alphabet).join(', ')}}</p>
            <p><strong>Constraints:</strong> ${analysis.constraints.length > 0 ? analysis.constraints.join(', ') : 'None'}</p>
        `;
        resultsDiv.appendChild(summarySection);

        const regexSection = document.createElement('div');
        regexSection.className = 'result-section';
        regexSection.innerHTML = `
            <h3>Generated Regular Expression</h3>
            <div class="regex-display"><code>${regex}</code></div>
            <p><strong>Explanation:</strong> ${explainRegex(regex, analysis)}</p>
        `;
        resultsDiv.appendChild(regexSection);

        const testSection = document.createElement('div');
        testSection.className = 'result-section';
        testSection.innerHTML = `
            <h3>Test Examples</h3>
            <div class="test-examples">
                ${generateTestExamples(regex, analysis)}
            </div>
        `;
        resultsDiv.appendChild(testSection);

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
        let explanation = [];
        if (analysis.startSymbol) explanation.push(`Starts with '${analysis.startSymbol}'`);
        if (analysis.endSymbol) explanation.push(`Ends with '${analysis.endSymbol}'`);
        if (analysis.forbidden.length > 0) explanation.push(`Avoids forbidden substrings: ${analysis.forbidden.join(', ')}`);
        if (analysis.required.length > 0) explanation.push(`Must contain: ${analysis.required.join(', ')}`);
        if (analysis.constraints.includes("even count")) explanation.push("Even number of 1s");
        if (analysis.constraints.includes("odd count")) explanation.push("Odd number of 1s");
        if (analysis.length) explanation.push(`Length constraint: ${analysis.length}`);
        if (explanation.length === 0) explanation.push("Generates all possible strings over the alphabet");
        return explanation.join('; ') + ".";
    }

    function generateTestExamples(regex, analysis) {
        const examples = [];
        const alphabet = Array.from(analysis.alphabet);
        if (analysis.startSymbol && analysis.endSymbol) examples.push(analysis.startSymbol + analysis.endSymbol);
        if (alphabet.length >= 2) {
            examples.push(alphabet[0]+alphabet[1]);
            examples.push(alphabet[0]+alphabet[0]+alphabet[1]);
        }
        examples.push("");
        let html = '<div class="test-cases">';
        examples.forEach(ex => {
            const matches = testRegex(regex, ex);
            html += `<div class="test-case ${matches ? 'match' : 'no-match'}"><strong>${ex||'ε'}</strong>: ${matches ? '✓ Matches' : '✗ No match'}</div>`;
        });
        html += '</div>';
        return html;
    }

    function testRegex(regex, string) {
        try { return new RegExp('^'+regex+'$').test(string); } 
        catch(e){ return false; }
    }

    function generateReport(analysis, regex) {
        return `Language to Regular Expression Report
=====================================

Language Description:
${analysis.description}

Analysis:
- Alphabet: {${Array.from(analysis.alphabet).join(', ')}}
- Constraints: ${analysis.constraints.join(', ')}

Generated Regular Expression:
${regex}

Explanation:
${explainRegex(regex, analysis)}
`;
    }
});
