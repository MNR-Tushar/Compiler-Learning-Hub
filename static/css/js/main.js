// main.js - small helpers
document.addEventListener('DOMContentLoaded', ()=>{
  // enhance links or add common listeners if needed
});

function showOutput(el, html){ el.innerHTML = html }

async function postJSON(url, data){
  const res = await fetch(url, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data)});
  return res.json();
}