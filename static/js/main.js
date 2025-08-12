// Main JavaScript file for Compiler Learning Hub
class CompilerUtils {
    static showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    static formatGrammar(grammar) {
        return Object.entries(grammar)
            .map(([lhs, prods]) => {
                const rhs = prods.map(prod => 
                    prod.length === 0 ? 'ε' : prod.join(' ')
                ).join(' | ');
                return `${lhs} -> ${rhs}`;
            })
            .join('\n');
    }

    static parseGrammar(text) {
        const grammar = {};
        const lines = text.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));
        
        for (const line of lines) {
            if (!line.includes('->')) continue;
            const [lhs, rhs] = line.split('->', 2);
            const nonTerminal = lhs.trim();
            const productions = rhs.split('|').map(p => p.trim());
            
            grammar[nonTerminal] = [];
            for (const prod of productions) {
                if (prod === 'ε' || prod === '') {
                    grammar[nonTerminal].push([]);
                } else {
                    grammar[nonTerminal].push(prod.split(/\s+/).filter(s => s));
                }
            }
        }
        return grammar;
    }

    static createTable(headers, data) {
        const table = document.createElement('table');
        table.className = 'data-table';
        
        // Create header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Create body
        const tbody = document.createElement('tbody');
        data.forEach(row => {
            const tr = document.createElement('tr');
            row.forEach(cell => {
                const td = document.createElement('td');
                if (typeof cell === 'string' && cell.includes('conflict')) {
                    td.className = 'conflict';
                    td.textContent = 'CONFLICT';
                } else if (Array.isArray(cell)) {
                    td.textContent = cell.length === 0 ? 'ε' : cell.join(' ');
                } else {
                    td.textContent = cell;
                }
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        
        return table;
    }

    static downloadAsText(content, filename) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Global utility functions
window.showNotification = CompilerUtils.showNotification;
window.formatGrammar = CompilerUtils.formatGrammar;
window.parseGrammar = CompilerUtils.parseGrammar;
window.createTable = CompilerUtils.createTable;
window.downloadAsText = CompilerUtils.downloadAsText; 