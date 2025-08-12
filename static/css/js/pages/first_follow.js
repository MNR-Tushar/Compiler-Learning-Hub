// first_follow.js
document.addEventListener('DOMContentLoaded', ()=>{
  const run = document.getElementById('run');
  if(!run) return;
  run.addEventListener('click', async ()=>{
    const input = document.getElementById('input').value;
    const start = document.getElementById('start')?.value || '';
    const out = document.getElementById('output');
    out.innerHTML = '<p>Computing...</p>';
    try{
      const res = await postJSON('/api/compute', {grammar: input, start});
      if(!res.ok) { out.innerHTML = `<pre style="color:red">${res.error}</pre>`; return }
      const r = res.result;
      let html = '<h3>FIRST</h3><pre>'+JSON.stringify(r.first,null,2)+'</pre>';
      html += '<h3>FOLLOW</h3><pre>'+JSON.stringify(r.follow,null,2)+'</pre>';
      html += '<h3>LL(1) Table</h3><pre>'+JSON.stringify(r.table,null,2)+'</pre>';
      html += '<p>Is LL(1)? '+(r.is_ll1 ? 'Yes' : 'No')+'</p>';
      out.innerHTML = html;
    }catch(e){ out.innerHTML = `<pre style="color:red">${e}</pre>` }
  })
})