// static/js/ff_ll1.js
document.addEventListener('DOMContentLoaded', function(){
  const runBtn = document.getElementById('run');
  runBtn.addEventListener('click', async () => {
    const grammar = document.getElementById('grammar').value;
    const start = document.getElementById('start').value;
    const resArea = document.getElementById('result_area');
    resArea.innerHTML = '<p>Computing...</p>';
    try {
      const resp = await fetch('/api/compute', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({grammar, start})
      });
      const data = await resp.json();
      if(!data.ok){
        resArea.innerHTML = `<pre style="color:red">${data.error}</pre>`;
        return;
      }
      const r = data.result;
      let html = '';
      html += `<h3>Start symbol: ${data.start}</h3>`;
      html += '<h4>FIRST sets</h4>';
      html += '<table><tr><th>Nonterminal</th><th>FIRST</th></tr>';
      for(const A of Object.keys(r.first)){
        html += `<tr><td>${A}</td><td>${r.first[A].join(', ')}</td></tr>`;
      }
      html += '</table>';

      html += '<h4>FOLLOW sets</h4>';
      html += '<table><tr><th>Nonterminal</th><th>FOLLOW</th></tr>';
      for(const A of Object.keys(r.follow)){
        html += `<tr><td>${A}</td><td>${r.follow[A].join(', ')}</td></tr>`;
      }
      html += '</table>';

      html += `<h4>LL(1) Parse Table (shows production as space-separated RHS; '$' denotes end)</h4>`;
      html += '<table><tr><th>Nonterminal</th><th>Terminal</th><th>Production</th></tr>';
      for(const A of Object.keys(r.table)){
        const row = r.table[A];
        const keys = Object.keys(row);
        if(keys.length === 0){
          html += `<tr><td>${A}</td><td colspan="2"><i>no entries</i></td></tr>`;
        } else {
          for(const t of keys){
            const prod = row[t];
            let prodText = '';
            if(prod === '<<conflict>>') prodText = '<<CONFLICT>>';
            else if(Array.isArray(prod)) prodText = prod.join(' ') || 'ε';
            else prodText = String(prod);
            html += `<tr><td>${A}</td><td>${t}</td><td>${prodText}</td></tr>`;
          }
        }
      }
      html += '</table>';
      html += `<p><b>Is LL(1)?</b> ${r.is_ll1 ? '<span style="color:green">Yes</span>' : '<span style="color:red">No (conflicts found)</span>'}</p>`;
      resArea.innerHTML = html;
    } catch(err){
      document.getElementById('result_area').innerHTML = `<pre style="color:red">${err}</pre>`;
    }
  });
});
