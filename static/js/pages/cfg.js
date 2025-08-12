// Control Flow Graph Generator
document.addEventListener('DOMContentLoaded', function() {
    const tacInput = document.getElementById('tac-input');
    const generateBtn = document.getElementById('generate-btn');
    const resultsDiv = document.getElementById('results');
    const exampleBtn = document.getElementById('example-btn');
    const clearBtn = document.getElementById('clear-btn');

    // Example TAC for CFG generation
    const exampleTAC = `1: t1 = a + b
2: t2 = t1 * c
3: if t2 > 0 goto 6
4: t3 = t2 + 1
5: goto 7
6: t3 = t2 - 1
7: x = t3`;

    exampleBtn.addEventListener('click', () => {
        tacInput.value = exampleTAC;
    });

    clearBtn.addEventListener('click', () => {
        tacInput.value = '';
        resultsDiv.innerHTML = '';
    });

    generateBtn.addEventListener('click', () => {
        const tac = tacInput.value.trim();
        if (!tac) {
            showNotification('Please enter three address code', 'error');
            return;
        }

        try {
            const parsedTAC = parseTAC(tac);
            const cfg = generateCFG(parsedTAC);
            displayResults(parsedTAC, cfg);
        } catch (error) {
            showNotification('Error generating CFG: ' + error.message, 'error');
        }
    });

    function parseTAC(tac) {
        const lines = tac.split('\n').filter(line => line.trim());
        const instructions = [];
        
        for (const line of lines) {
            const match = line.match(/^(\d+):\s*(.+)$/);
            if (match) {
                const lineNumber = parseInt(match[1]);
                const instruction = match[2].trim();
                
                instructions.push({
                    lineNumber: lineNumber,
                    instruction: instruction,
                    type: getInstructionType(instruction),
                    target: extractTarget(instruction),
                    successors: []
                });
            }
        }
        
        return instructions;
    }

    function getInstructionType(instruction) {
        if (instruction.startsWith('if')) return 'conditional';
        if (instruction.startsWith('goto')) return 'unconditional';
        if (instruction.includes('=')) return 'assignment';
        return 'other';
    }

    function extractTarget(instruction) {
        if (instruction.startsWith('goto')) {
            const match = instruction.match(/goto\s+(\d+)/);
            return match ? parseInt(match[1]) : null;
        }
        if (instruction.startsWith('if')) {
            const match = instruction.match(/goto\s+(\d+)/);
            return match ? parseInt(match[1]) : null;
        }
        return null;
    }

    function generateCFG(instructions) {
        // Find basic blocks
        const basicBlocks = findBasicBlocks(instructions);
        
        // Build control flow graph
        const cfg = buildCFG(basicBlocks, instructions);
        
        return {
            instructions: instructions,
            basicBlocks: basicBlocks,
            cfg: cfg
        };
    }

    function findBasicBlocks(instructions) {
        const leaders = new Set([1]); // First instruction is always a leader
        
        // Find leaders
        for (let i = 0; i < instructions.length; i++) {
            const inst = instructions[i];
            
            if (inst.type === 'conditional' || inst.type === 'unconditional') {
                // Target of jump is a leader
                if (inst.target) {
                    leaders.add(inst.target);
                }
                // Instruction after jump is a leader
                if (i < instructions.length - 1) {
                    leaders.add(instructions[i + 1].lineNumber);
                }
            }
        }
        
        // Group instructions into basic blocks
        const sortedLeaders = Array.from(leaders).sort((a, b) => a - b);
        const basicBlocks = [];
        
        for (let i = 0; i < sortedLeaders.length; i++) {
            const start = sortedLeaders[i];
            const end = i < sortedLeaders.length - 1 ? sortedLeaders[i + 1] - 1 : instructions.length;
            
            const block = {
                id: i,
                start: start,
                end: end,
                instructions: instructions.filter(inst => inst.lineNumber >= start && inst.lineNumber <= end),
                successors: [],
                predecessors: []
            };
            
            basicBlocks.push(block);
        }
        
        return basicBlocks;
    }

    function buildCFG(basicBlocks, instructions) {
        // Build successor relationships
        for (let i = 0; i < basicBlocks.length; i++) {
            const block = basicBlocks[i];
            const lastInstruction = block.instructions[block.instructions.length - 1];
            
            if (lastInstruction.type === 'unconditional') {
                // Unconditional jump
                const targetBlock = findBlockByLineNumber(basicBlocks, lastInstruction.target);
                if (targetBlock) {
                    block.successors.push(targetBlock.id);
                    targetBlock.predecessors.push(block.id);
                }
            } else if (lastInstruction.type === 'conditional') {
                // Conditional jump - two successors
                const targetBlock = findBlockByLineNumber(basicBlocks, lastInstruction.target);
                const nextBlock = i < basicBlocks.length - 1 ? basicBlocks[i + 1] : null;
                
                if (targetBlock) {
                    block.successors.push(targetBlock.id);
                    targetBlock.predecessors.push(block.id);
                }
                if (nextBlock) {
                    block.successors.push(nextBlock.id);
                    nextBlock.predecessors.push(block.id);
                }
            } else if (i < basicBlocks.length - 1) {
                // Fall through to next block
                block.successors.push(i + 1);
                basicBlocks[i + 1].predecessors.push(i);
            }
        }
        
        return basicBlocks;
    }

    function findBlockByLineNumber(basicBlocks, lineNumber) {
        return basicBlocks.find(block => 
            block.start <= lineNumber && block.end >= lineNumber
        );
    }

    function displayResults(parsedTAC, cfg) {
        resultsDiv.innerHTML = '';

        // TAC analysis
        const tacSection = document.createElement('div');
        tacSection.className = 'result-section';
        tacSection.innerHTML = `
            <h3>Three Address Code Analysis</h3>
            <p><strong>Total instructions:</strong> ${parsedTAC.length}</p>
            <p><strong>Instruction types:</strong> ${countInstructionTypes(parsedTAC)}</p>
        `;
        resultsDiv.appendChild(tacSection);

        // Basic blocks
        const blocksSection = document.createElement('div');
        blocksSection.className = 'result-section';
        blocksSection.innerHTML = '<h3>Basic Blocks</h3>';
        
        cfg.basicBlocks.forEach((block, index) => {
            const blockDiv = document.createElement('div');
            blockDiv.className = 'basic-block';
            blockDiv.innerHTML = `
                <h4>Block ${index}:</h4>
                <p><strong>Lines:</strong> ${block.start}-${block.end}</p>
                <p><strong>Instructions:</strong></p>
                <ul>
                    ${block.instructions.map(inst => `<li>${inst.lineNumber}: ${inst.instruction}</li>`).join('')}
                </ul>
                <p><strong>Successors:</strong> ${block.successors.map(s => `Block ${s}`).join(', ')}</p>
                <p><strong>Predecessors:</strong> ${block.predecessors.map(p => `Block ${p}`).join(', ')}</p>
            `;
            blocksSection.appendChild(blockDiv);
        });
        resultsDiv.appendChild(blocksSection);

        // Control flow graph
        const cfgSection = document.createElement('div');
        cfgSection.className = 'result-section';
        cfgSection.innerHTML = `
            <h3>Control Flow Graph</h3>
            <p><strong>Total blocks:</strong> ${cfg.basicBlocks.length}</p>
            <div class="cfg-visualization">
                ${generateCFGVisualization(cfg.basicBlocks)}
            </div>
        `;
        resultsDiv.appendChild(cfgSection);

        // Download button
        const downloadBtn = document.createElement('button');
        downloadBtn.textContent = 'Download Results';
        downloadBtn.className = 'download-btn';
        downloadBtn.onclick = () => {
            const content = generateReport(parsedTAC, cfg);
            downloadAsText(content, 'control_flow_graph.txt');
        };
        resultsDiv.appendChild(downloadBtn);
    }

    function countInstructionTypes(instructions) {
        const counts = {};
        instructions.forEach(inst => {
            counts[inst.type] = (counts[inst.type] || 0) + 1;
        });
        return Object.entries(counts).map(([type, count]) => `${type}: ${count}`).join(', ');
    }

    function generateCFGVisualization(basicBlocks) {
        let html = '<div class="cfg-graph">';
        
        basicBlocks.forEach((block, index) => {
            html += `<div class="cfg-node">`;
            html += `<div class="node-header">Block ${index}</div>`;
            html += `<div class="node-content">Lines ${block.start}-${block.end}</div>`;
            html += `</div>`;
        });
        
        html += '<div class="cfg-edges">';
        basicBlocks.forEach((block, index) => {
            block.successors.forEach(successor => {
                html += `<div class="edge" data-from="${index}" data-to="${successor}"></div>`;
            });
        });
        html += '</div>';
        
        html += '</div>';
        return html;
    }

    function generateReport(parsedTAC, cfg) {
        let report = `Control Flow Graph Generation Report\n`;
        report += `=====================================\n\n`;
        
        report += `Three Address Code Analysis:\n`;
        report += `- Total instructions: ${parsedTAC.length}\n`;
        report += `- Instruction types: ${countInstructionTypes(parsedTAC)}\n\n`;
        
        report += `Basic Blocks:\n`;
        cfg.basicBlocks.forEach((block, index) => {
            report += `Block ${index}:\n`;
            report += `- Lines: ${block.start}-${block.end}\n`;
            report += `- Instructions:\n`;
            block.instructions.forEach(inst => {
                report += `  ${inst.lineNumber}: ${inst.instruction}\n`;
            });
            report += `- Successors: ${block.successors.map(s => `Block ${s}`).join(', ')}\n`;
            report += `- Predecessors: ${block.predecessors.map(p => `Block ${p}`).join(', ')}\n\n`;
        });
        
        report += `Control Flow Graph:\n`;
        report += `- Total blocks: ${cfg.basicBlocks.length}\n`;
        report += `- Edges:\n`;
        cfg.basicBlocks.forEach((block, index) => {
            block.successors.forEach(successor => {
                report += `  Block ${index} → Block ${successor}\n`;
            });
        });
        
        return report;
    }
}); 