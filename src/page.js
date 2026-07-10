let ck = localStorage.getItem('crypto_api_key') || '';

function show(id) {
  document.querySelectorAll('.pg').forEach(p => p.classList.remove('ac'));
  document.querySelectorAll('.nl a').forEach(a => a.classList.remove('ac'));
  document.getElementById('p-' + id).classList.add('ac');
  const l = document.querySelector(`.nl a[onclick*="${id}"]`);
  if (l) l.classList.add('ac');
  if (id === 'play') { const e = document.getElementById('pak'); if (e) e.value = ck; }
  if (id === 'account') { loadAccount(); }
  if (id === 'plans') { loadPlans(); }
  if (typeof gtag === 'function') gtag('event', 'page_view', { page_title: 'CryptoBoss - ' + id, page_location: window.location.href.split('#')[0] + '#' + id });
  window.scrollTo(0,0);
}

function toast(m) {
  const t = document.getElementById('toast');
  t.textContent = m; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

function drS(id, data, color) {
  const e = document.getElementById(id); if (!e || !data || data.length < 2) return;
  const x = e.getContext('2d'), r = window.devicePixelRatio || 1, b = e.getBoundingClientRect();
  e.width = b.width * r; e.height = 48 * r; x.scale(r, r);
  const w = b.width, h = 48, mn = Math.min(...data), mx = Math.max(...data), rg = mx - mn || 1;
  const p = data.map((v, j) => ({ x: j / (data.length - 1) * w, y: h - 4 - ((v - mn) / rg) * (h - 8) }));
  // Smooth line
  x.beginPath(); x.strokeStyle = color; x.lineWidth = 2; x.lineJoin = 'round'; x.lineCap = 'round';
  p.forEach((v, j) => j === 0 ? x.moveTo(v.x, v.y) : x.lineTo(v.x, v.y)); x.stroke();
  // Gradient fill
  const grd = x.createLinearGradient(0, 0, 0, h);
  grd.addColorStop(0, color + '30'); grd.addColorStop(1, color + '02');
  x.lineTo(p[p.length-1].x, h-2); x.lineTo(p[0].x, h-2); x.closePath();
  x.fillStyle = grd; x.fill();
  // End dot
  const last = p[p.length-1];
  x.beginPath(); x.arc(last.x, last.y, 3, 0, Math.PI*2); x.fillStyle = color; x.fill();
  x.beginPath(); x.arc(last.x, last.y, 5, 0, Math.PI*2); x.fillStyle = color + '30'; x.fill();
}

const DM = [
  { n:'Aave', p:145, c:12.4 }, { n:'Render', p:7.82, c:8.9 },
  { n:'Fetch.ai', p:1.45, c:6.2 }, { n:'Near', p:4.92, c:5.1 },
  { n:'Ethena', p:0.89, c:-4.3 }, { n:'Arbitrum', p:0.76, c:-3.8 },
  { n:'Optimism', p:1.82, c:-3.1 }, { n:'Celestia', p:5.23, c:-2.9 },
];
const FB = [59000,58500,59200,59800,60100,59500,61000,61500,60800,62000,62500,61800,62800,63304];
const FE = [1680,1720,1700,1690,1710,1750,1730,1740,1760,1755,1770,1765,1772,1775];

async function fPub() {
  try { const r = await fetch('/api/public/market'); if (!r.ok) throw 1; return await r.json(); } catch { return null; }
}

async function loadD() {
  try {
    const [pub, fgR] = await Promise.all([fPub(), fetch('https://api.alternative.me/fng/?limit=1').then(r => r.ok ? r.json() : null).catch(() => null)]);
    if (!pub || pub.error) { showFallbackDash(); return; }
    const p = pub.prices || {};
    if (p.btc == null && p.eth == null && p.sol == null) { showFallbackDash(); return; }
    const fp = (v) => v != null && v > 0 ? '$' + (v > 100 ? v.toLocaleString("en-US",{maxFractionDigits:0}) : v.toFixed(2)) : v === 0 ? '$0.00' : '—';
    const fc = (v) => v != null ? (v >= 0 ? '+' : '') + v.toFixed(2) + '%' : '—';
    const cc = (v) => v != null ? (v >= 0 ? 'g' : 'r') : '';
    const pc = [
      { sym:'BTC', price:p.btc, ch:p.btc_24h, color:'#f7931a' },
      { sym:'ETH', price:p.eth, ch:p.eth_24h, color:'#627eea' },
      { sym:'SOL', price:p.sol, ch:p.sol_24h, color:'#7c3aed' },
    ];
    const h = pc.map(c => `<div class="pc"><div class="pcn">${c.sym}/USD</div><div class="pcp">${fp(c.price)}</div><div class="pcc ${cc(c.ch)}">${fc(c.ch)}</div><canvas id="s-${c.sym}" height="32"></canvas></div>`).join('');
    const e1 = document.getElementById('pcs'); if (e1) e1.innerHTML = h;
    const e2 = document.getElementById('dpcs'); if (e2) e2.innerHTML = h;
    setTimeout(() => {
      try { drS('s-BTC', FB, '#f7931a'); drS('btc-s', FB, '#f7931a'); } catch {}
      try { drS('s-ETH', FE, '#627eea'); drS('eth-s', FE, '#627eea'); } catch {}
      try { drS('s-SOL', FE.map(v=>v/20), '#7c3aed'); } catch {}
    }, 50);
    const tk = document.getElementById('tk');
    if (tk) {
      const items = pc.filter(x => x.price > 0);
      tk.innerHTML = [...items,...items].map(x => '<span class="ti"><span class="sy">'+x.sym+'</span><span class="pr">'+fp(x.price)+'</span><span class="ch '+(x.ch>=0?'g':'r')+'">'+fc(x.ch)+'</span></span>').join('');
    }
    const g = pub?.global;
    if (g?.total_market_cap) {
      const e = document.getElementById('gs2');
      if (e) e.innerHTML = `<div style="margin-bottom:4px"><div style="font-size:10px;color:var(--m)">Market cap</div><div style="font-size:16px;font-weight:600">$${(g.total_market_cap/1e12).toFixed(2)}T</div></div><div style="margin-bottom:4px"><div style="font-size:10px;color:var(--m)">24h volume</div><div style="font-size:16px;font-weight:600">$${(g.total_volume/1e9).toFixed(1)}B</div></div><div><div style="font-size:10px;color:var(--m)">BTC dominance</div><div style="font-size:16px;font-weight:600">${(g.btc_dominance||0).toFixed(1)}%</div></div>`;
    }
    const mv = document.getElementById('mv');
    if (mv) mv.innerHTML = DM.map(x => '<div class="row"><span class="rk">'+(x.c>=0?'+':'−')+'</span><span class="nn">'+x.n+'</span><span class="pr2">$'+x.p.toLocaleString("en-US")+'</span><span class="cg '+(x.c>=0?'g':'r')+'">'+(x.c>=0?'+':'')+x.c.toFixed(1)+'%</span></div>').join('');
    const vc = document.getElementById('vc');
    if (vc) {
      const vi = [{s:'BTC',v:28},{s:'ETH',v:18},{s:'USDT',v:42},{s:'SOL',v:3.5},{s:'BNB',v:2.1},{s:'XRP',v:1.8}];
      vc.innerHTML = vi.map((x,i) => '<div class="bw"><div class="br" style="height:'+(x.v/42*100)+'%;background:'+['#f7931a','#627eea','#22c55e','#7c3aed','#a855f7','#ef4444'][i]+'"></div><div class="bl">'+x.s+'</div></div>').join('');
    }
    const fg = fgR?.data?.[0];
    if (fg) {
      const v = parseInt(fg.value), lb = fg.value_classification || '—';
      const cl = v <= 25 ? '#ef4444' : v <= 45 ? '#eab308' : '#22c55e';
      const ve = document.getElementById('fgv'), le = document.getElementById('fgl'), ae = document.getElementById('fg'), de = document.getElementById('fgd');
      if (ve) { ve.textContent = v; ve.style.fill = cl; }
      if (le) le.textContent = lb;
      if (ae) { ae.setAttribute('stroke-dasharray', v/100*301+' 301'); ae.setAttribute('stroke', cl); }
      if (de) de.textContent = 'Sentiment: ' + lb;
    }
  } catch(e) { console.warn(e); showFallbackDash(); }
}

function showFallbackDash() {
  const fp = (v) => v != null && v > 0 ? '$' + (v > 100 ? v.toLocaleString("en-US",{maxFractionDigits:0}) : v.toFixed(2)) : '—';
  const fc = (v) => v != null ? (v >= 0 ? '+' : '') + v.toFixed(2) + '%' : '—';
  const cc = (v) => v != null ? (v >= 0 ? 'g' : 'r') : '';
  const fb = [
    { sym:'BTC', price:63304, ch:2.4, color:'#f7931a' },
    { sym:'ETH', price:1775, ch:-1.2, color:'#627eea' },
    { sym:'SOL', price:156.42, ch:5.8, color:'#7c3aed' },
  ];
  const h = fb.map(c => `<div class="pc"><div class="pcn">${c.sym}/USD</div><div class="pcp">${fp(c.price)}</div><div class="pcc ${cc(c.ch)}">${fc(c.ch)}</div><canvas id="s-${c.sym}" height="32"></canvas></div>`).join('');
  const e1 = document.getElementById('pcs'); if (e1) e1.innerHTML = h;
  const e2 = document.getElementById('dpcs'); if (e2) e2.innerHTML = h;
  const tk = document.getElementById('tk');
  if (tk) tk.innerHTML = [...fb,...fb].map(x => '<span class="ti"><span class="sy">'+x.sym+'</span><span class="pr">'+fp(x.price)+'</span><span class="ch '+(x.ch>=0?'g':'r')+'">'+fc(x.ch)+'</span></span>').join('');
  const e = document.getElementById('gs2');
  if (e) e.innerHTML = '<div style="margin-bottom:4px"><div style="font-size:10px;color:var(--m)">Market cap</div><div style="font-size:16px;font-weight:600">$2.64T</div></div><div style="margin-bottom:4px"><div style="font-size:10px;color:var(--m)">24h volume</div><div style="font-size:16px;font-weight:600">$98.2B</div></div><div><div style="font-size:10px;color:var(--m)">BTC dominance</div><div style="font-size:16px;font-weight:600">51.3%</div></div>';
  setTimeout(() => {
    try { drS('s-BTC', FB, '#f7931a'); } catch {}
    try { drS('s-ETH', FE, '#627eea'); } catch {}
    try { drS('s-SOL', FE.map(v=>v/20), '#7c3aed'); } catch {}
  }, 50);
  const mv = document.getElementById('mv');
  if (mv) mv.innerHTML = DM.map(x => '<div class="row"><span class="rk">'+(x.c>=0?'+':'−')+'</span><span class="nn">'+x.n+'</span><span class="pr2">$'+x.p.toLocaleString("en-US")+'</span><span class="cg '+(x.c>=0?'g':'r')+'">'+(x.c>=0?'+':'')+x.c.toFixed(1)+'%</span></div>').join('');
  const vc = document.getElementById('vc');
  if (vc) { const vi = [{s:'BTC',v:28},{s:'ETH',v:18},{s:'USDT',v:42},{s:'SOL',v:3.5},{s:'BNB',v:2.1},{s:'XRP',v:1.8}]; vc.innerHTML = vi.map((x,i) => '<div class="bw"><div class="br" style="height:'+(x.v/42*100)+'%;background:'+['#f7931a','#627eea','#22c55e','#7c3aed','#a855f7','#ef4444'][i]+'"></div><div class="bl">'+x.s+'</div></div>').join(''); }
  const ve = document.getElementById('fgv'), le = document.getElementById('fgl'), ae = document.getElementById('fg'), de = document.getElementById('fgd');
  if (ve) { ve.textContent = '55'; ve.style.fill = '#eab308'; }
  if (le) le.textContent = 'Greed';
  if (ae) { ae.setAttribute('stroke-dasharray', '165.55 301'); ae.setAttribute('stroke', '#eab308'); }
  if (de) de.textContent = 'Sentiment: Greed';
}

let lk = '';
async function genKey() {
  const b = document.getElementById('gb');
  b.textContent = 'Generating...'; b.disabled = true;
  try {
    const r = await fetch('/api/register', { method: 'POST' });
    const d = await r.json();
    if (d.key) {
      lk = d.key; ck = d.key; localStorage.setItem('crypto_api_key', d.key);
      document.getElementById('kv').textContent = d.key; document.getElementById('kr').style.display = 'block';
      document.getElementById('uf').style.width = '0%'; document.getElementById('bl').textContent = '$1.00 remaining';
      document.getElementById('ul').textContent = '$0.00 used'; toast('Key generated! $1 free credit.');
      const e = document.getElementById('pak'); if (e) e.value = d.key;
    } else toast(d.error || 'Failed');
  } catch(e) { toast('Error: ' + e.message); }
  b.textContent = 'Generate Free API Key'; b.disabled = false;
}

function copyKey() {
  if (!lk) return;
  navigator.clipboard.writeText(lk).then(() => { document.getElementById('cb').innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'; toast('Copied!'); setTimeout(() => document.getElementById('cb').innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>', 2000); });
}

async function chkUse() {
  if (!ck) { document.getElementById('ur').textContent = 'No key.'; return; }
  try {
    const r = await fetch('/api/usage', { headers: { 'x-api-key': ck } });
    const d = await r.json();
    if (d.balance != null) {
      const bal = d.balance/1000000, used = d.total_used/1000000;
      document.getElementById('uf').style.width = Math.min((used/1)*100, 100) + '%';
      document.getElementById('bl').textContent = '$'+bal.toFixed(2)+' remaining';
      document.getElementById('ul').textContent = '$'+used.toFixed(2)+' used';
      document.getElementById('ur').textContent = 'Balance: $'+bal.toFixed(2)+' | Paid: $'+(d.total_paid/1000000).toFixed(2);
      if (d.requires_payment) document.getElementById('ur').textContent += ' Pay $1';
    } else document.getElementById('ur').textContent = d.error || 'Failed';
  } catch(e) { document.getElementById('ur').textContent = 'Error'; }
}

async function loadAccount() {
  if (!ck) { document.getElementById('acct-key').textContent = 'No key — generate one above.'; return; }
  try {
    const r = await fetch('/api/account', { headers: { 'x-api-key': ck } });
    if (!r.ok) throw 1;
    const d = await r.json();
    document.getElementById('acct-plan').textContent = d.plan + ' · ' + d.daily_limit + ' calls/day · $' + (d.balance/1000000).toFixed(2) + ' remaining';
    document.getElementById('acct-key').textContent = ck;
    document.getElementById('acct-plan-name').textContent = d.plan;
    document.getElementById('acct-plan-limit').textContent = d.daily_limit + ' calls/day' + (d.rate_per_min ? ' · ' + d.rate_per_min + '/min' : '');
    document.getElementById('acct-balance').textContent = d.balance_usd;
    const usedVal = d.total_used/1000000;
    document.getElementById('acct-used').textContent = '$' + usedVal.toFixed(2) + ' used';
    const todayCalls = d.daily_usage_7d ? d.daily_usage_7d[d.daily_usage_7d.length-1]?.calls || 0 : 0;
    document.getElementById('acct-today').textContent = todayCalls ? todayCalls + ' / ' + d.daily_limit : '0 / ' + d.daily_limit;
    document.getElementById('acct-paid').textContent = '$' + (d.total_paid/1000000).toFixed(2);
    document.getElementById('acct-pay-info').innerHTML = d.requires_payment
      ? 'Balance exhausted. Send USDC to <code style="font-size:11px">DEXbxpDbbj5AnZSqfAhuftvjrtXwjoWW1PgrxmVjuZef</code> on Solana, then POST /api/pay with {key, tx}.'
      : 'Send USDC to top up. <a href="#" onclick="show(\'plans\');return false">View plans →</a>';
    const barsEl = document.getElementById('acct-bars');
    if (barsEl && d.daily_usage_7d) {
      const maxCall = Math.max(1, ...d.daily_usage_7d.map(x => x.calls));
      barsEl.innerHTML = d.daily_usage_7d.map(x => {
        const h = Math.max(2, (x.calls / maxCall) * 55);
        const today = x.date === new Date().toISOString().slice(0,10);
        return '<div style="display:flex;flex-direction:column;align-items:center;flex:1"><div class="acct-bar' + (today ? ' acct-bar-today' : '') + '" style="height:' + h + 'px"></div><div class="acct-bar-lbl">' + x.date.slice(5) + '</div></div>';
      }).join('');
    }
    const callsEl = document.getElementById('acct-calls');
    if (callsEl && d.recent_calls && d.recent_calls.length > 0) {
      callsEl.innerHTML = '<div class="acct-call-hdr"><span>Time</span><span>Endpoint</span><span>Cost</span></div>' +
        d.recent_calls.slice(0, 15).map(c => {
          const t = new Date(c.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return '<div class="acct-call-row"><span class="acct-call-time">' + t + '</span><span class="acct-call-path">' + c.p + '</span><span class="acct-call-cost">$' + (c.c / 1000000).toFixed(6) + '</span></div>';
        }).join('');
    }
  } catch { document.getElementById('acct-key').textContent = 'Could not load. Ensure your key is valid.'; }
}

function copyAcctKey() {
  if (!ck) return;
  navigator.clipboard.writeText(ck).then(() => { document.getElementById('acct-cpy').textContent = 'Copied!'; setTimeout(() => document.getElementById('acct-cpy').textContent = 'Copy', 2000); });
}

async function loadPlans() {
  try {
    const r = await fetch('/api/plans');
    if (!r.ok) throw 1;
    const d = await r.json();
    const grid = document.getElementById('plans-grid');
    if (!grid) return;
    grid.innerHTML = d.plans.map(p => {
      const isFree = p.price_usd === 0;
      const isFeatured = p.id === 'pro';
      return '<div class="pr-card' + (isFeatured ? ' featured' : '') + '">' +
        '<div class="pr-name">' + p.name + '</div>' +
        '<div class="pr-price">' + (isFree ? 'Free' : '$' + p.price_usd) + (isFree ? '' : '<span>/mo</span>') + '</div>' +
        '<ul class="pr-features">' +
        '<li>' + p.daily_calls.toLocaleString() + ' API calls per day</li>' +
        '<li>' + p.rate_per_min + ' requests per minute</li>' +
        '<li>$' + p.credit_usd + ' credit per payment</li>' +
        '<li>' + (isFree ? 'Basic endpoints' : 'All 42+ endpoints') + '</li>' +
        '<li>' + (isFree ? 'Community support' : 'Priority support') + '</li>' +
        '</ul>' +
        (isFree
          ? '<button class="btn-std btn-std-sm" onclick="genKey();show(\'keys\')">Get Free Key</button>'
          : '<button class="btn-std btn-std-p btn-std-sm" onclick="upgradeTo(\'' + p.id + '\')">Upgrade for $' + p.price_usd + '</button>') +
        '</div>';
    }).join('');
    document.getElementById('plans-pay-info').innerHTML = 'Pay with USDC on Solana to <code style="font-size:11px">' + d.pay_to + '</code><br><span style="color:var(--m);font-size:12px">Network: ' + d.network + ' · Asset: ' + d.asset + '</span>';
  } catch { const grid = document.getElementById('plans-grid'); if (grid) grid.innerHTML = '<p style="color:var(--m)">Could not load plans.</p>'; }
}

function upgradeTo(planId) {
  if (!ck) { toast('Generate an API key first.'); show('keys'); return; }
  toast('To upgrade: Send USDC, then POST /api/pay with {key, tx}. See Account page.');
  show('account');
}

const EP = {
  'get_price': { params: [{n:'coins',t:'text',d:'bitcoin,ethereum'},{n:'vs',t:'text',d:'usd'}], ep: '/api/price?coins=COINS&vs=VS' },
  'get_trending': { params: [], ep: '/api/trending' },
  'get_top': { params: [{n:'limit',t:'number',d:'20'},{n:'vs',t:'text',d:'usd'}], ep: '/api/top?limit=LIMIT&vs=VS' },
  'get_top_gainers': { params: [{n:'limit',t:'number',d:'10'}], ep: '/api/top-gainers?limit=LIMIT' },
  'get_top_losers': { params: [{n:'limit',t:'number',d:'10'}], ep: '/api/top-losers?limit=LIMIT' },
  'get_global': { params: [], ep: '/api/global' },
  'get_coin': { params: [{n:'id',t:'text',d:'bitcoin'}], ep: '/api/coin/ID' },
  'get_summary': { params: [], ep: '/api/summary' },
  'get_defi_yields': { params: [{n:'minApy',t:'number',d:'0'},{n:'chain',t:'text',d:'all'},{n:'limit',t:'number',d:'20'}], ep: '/api/defi/yields?minApy=MINAPY&chain=CHAIN&limit=LIMIT' },
  'get_defi_tvl': { params: [{n:'limit',t:'number',d:'20'},{n:'chain',t:'text',d:'all'}], ep: '/api/defi/tvl?limit=LIMIT&chain=CHAIN' },
  'get_defi_pools': { params: [{n:'limit',t:'number',d:'20'},{n:'chain',t:'text',d:'all'},{n:'sort',t:'select',o:['tvl','apy'],d:'tvl'}], ep: '/api/defi/pools?limit=LIMIT&chain=CHAIN&sort=SORT' },
  'get_meme_scan': { params: [{n:'chain',t:'text',d:'all'},{n:'limit',t:'number',d:'20'},{n:'minLiq',t:'number',d:'100'}], ep: '/api/meme/scan?chain=CHAIN&limit=LIMIT&minLiq=MINLIQ' },
  'get_meme_analyze': { params: [{n:'address',t:'text',d:'So11111111111111111111111111111111111111112'}], ep: '/api/meme/analyze?address=ADDRESS' },
  'get_meme_trending': { params: [{n:'limit',t:'number',d:'20'},{n:'chain',t:'text',d:'all'}], ep: '/api/meme/trending?limit=LIMIT&chain=CHAIN' },
  'get_gas': { params: [], ep: '/api/gas' },
  'get_gas_all': { params: [], ep: '/api/gas/all' },
  'get_fear_greed': { params: [{n:'limit',t:'number',d:'1'}], ep: '/api/fear-greed?limit=LIMIT' },
};

function initPG() {
  const sel = document.getElementById('pe'); if (!sel) return;
  Object.keys(EP).forEach(k => { const o = document.createElement('option'); o.value = k; o.textContent = k.replace(/_/g,' '); sel.appendChild(o); });
  upP();
}

function upP() {
  const ep = document.getElementById('pe').value, info = EP[ep]; if (!info) return;
  document.getElementById('pp').innerHTML = info.params.map(p => {
    if (p.t === 'select') return `<label>${p.n}<select id="pg-${p.n}">${p.o.map(o => `<option${o===p.d?' selected':''}>${o}</option>`).join('')}</select></label>`;
    return `<label>${p.n}<input type="${p.t}" id="pg-${p.n}" value="${p.d}" placeholder="${p.d}"></label>`;
  }).join('');
}

async function sendPG() {
  const ep = document.getElementById('pe').value, info = EP[ep]; if (!info) return;
  const key = document.getElementById('pak').value.trim() || ck;
  if (!key) { document.getElementById('po').innerHTML = '<span style="color:var(--r)">Enter API key.</span>'; return; }
  let url = info.ep;
  info.params.forEach(p => { const el = document.getElementById('pg-'+p.n); url = url.replace(p.n.toUpperCase(), encodeURIComponent(el?el.value:p.d)); });
  document.getElementById('po').innerHTML = '<div class="sp"></div>';
  try {
    const start = performance.now();
    const r = await fetch(url, { headers: { 'x-api-key': key } });
    const elapsed = ((performance.now()-start)/1000).toFixed(2); const data = await r.json();
    document.getElementById('po').innerHTML = '<span style="color:var(--m);font-size:10px">'+r.status+' · '+elapsed+'s</span>\n\n'+JSON.stringify(data,null,2);
  } catch(e) { document.getElementById('po').innerHTML = '<span style="color:var(--r)">Failed: '+e.message+'</span>'; }
}

function cpMcp() {
  navigator.clipboard.writeText('{\n  "mcpServers": {\n    "cryptoboss": {\n      "type": "streamableHttp",\n      "url": "https://cryptodata-api.datachain.workers.dev/mcp"\n    }\n  }\n}').then(() => toast('MCP config copied!'));
}

function switchCode(el, lang) {
  document.querySelectorAll('.code-tab').forEach(t => t.classList.remove('ac'));
  el.classList.add('ac');
  document.querySelectorAll('.code-body').forEach(b => b.style.display = 'none');
  const id = { curl: 'codeCurl', python: 'codePython', javascript: 'codeJs', mcp: 'codeMcp', cli: 'codeCli' }[lang];
  document.getElementById(id).style.display = 'block';
}

const ED = [
  ['GET','/api/register','Market','Free'],['GET','/api/price','Market','$0.01'],['GET','/api/trending','Market','$0.01'],['GET','/api/top','Market','$0.01'],
  ['GET','/api/top-gainers','Market','$0.02'],['GET','/api/top-losers','Market','$0.02'],['GET','/api/global','Market','$0.01'],
  ['GET','/api/coin/{id}','Market','$0.01'],['GET','/api/categories','Market','$0.01'],['GET','/api/summary','Market','$0.01'],
  ['GET','/api/search','Market','$0.005'],['GET','/api/ohlc','Market','$0.01'],['GET','/api/exchanges','Market','$0.01'],
  ['GET','/api/defi/yields','DeFi','$0.02'],['GET','/api/defi/tvl','DeFi','$0.02'],['GET','/api/defi/pools','DeFi','$0.02'],['GET','/api/defi/protocol/{slug}','DeFi','$0.02'],
  ['GET','/api/meme/scan','Meme','$0.05'],['GET','/api/meme/analyze','Meme','$0.05'],['GET','/api/meme/trending','Meme','$0.03'],
  ['GET','/api/gas','On-Chain','$0.005'],['GET','/api/gas/all','On-Chain','$0.01'],['GET','/api/fear-greed','Sentiment','$0.005'],
  ['GET','/api/security/audit','Security','$0.05'],
  ['GET','/api/whale/transactions','On-Chain','$0.03'],['GET','/api/whale/holders','On-Chain','$0.02'],['GET','/api/market/liquidations','On-Chain','$0.02'],
  ['GET','/api/market/top-volume','Market','$0.01'],
  ['GET','/api/portfolio/value','Portfolio','$0.01'],['GET','/api/portfolio/health','Portfolio','$0.02'],
  ['POST','/api/alerts/create','Alerts','$0.01'],['GET','/api/alerts/list','Alerts','$0.005'],['POST','/api/alerts/delete','Alerts','$0.005'],
  ['GET','/api/arbitrage/scan','Trading','$0.03'],
  ['GET','/api/sentiment/market','Sentiment','$0.02'],
  ['GET','/api/network/status','Infra','$0.01'],
  ['GET','/api/market/compare','Market','$0.02'],['GET','/api/market/correlation','Market','$0.03'],
  ['GET','/api/market/stablecoins','Market','$0.01'],['GET','/api/market/trending-categories','Market','$0.01'],
  ['GET','/api/price/summary','Market','$0.02'],
];
const MT = ['register','check_usage','get_price','get_trending','get_top','get_top_gainers','get_top_losers','get_global','get_coin','get_categories','get_defi_yields','get_defi_tvl','get_defi_pools','get_defi_protocol','get_meme_scan','get_meme_analyze','get_meme_trending','get_gas','get_gas_all','get_fear_greed','get_summary','get_search','get_ohlc','get_exchanges','analyze_contract','check_approvals','get_whale_moves','get_token_holders','get_liquidations','get_portfolio_value','get_portfolio_health','set_price_alert','get_alerts','delete_alert','get_arbitrage','get_social_sentiment','get_top_volume','get_network_health','compare_coins','market_correlation','get_stablecoins','trending_categories','get_price_summary'];

function toggleMob() {
  document.getElementById('mobMenu').classList.toggle('open');
}

// ─── TERMINAL CYCLER ─────────────────────────────
const TERM_CMDS = [
  { cmd: 'curl -X POST /api/register', out: '{"key": "cd_<span style=\"color:#14F195\">abc123</span>", "balance": "$1.00"}' },
  { cmd: 'curl -H "x-api-key: cd_..." /api/price?coins=bitcoin', out: '{"bitcoin": {"usd": 63304, "usd_24h_change": 2.4}}' },
  { cmd: 'curl -H "x-api-key: cd_..." /api/defi/yields?minApy=5', out: '{"pools": [{"protocol": "Aave", "apy": 8.2}, {"protocol": "Compound", "apy": 6.7}]}' },
  { cmd: 'curl -H "x-api-key: cd_..." /api/meme/analyze?address=...', out: '{"risk": "low", "liquidity": "$142K", "holders": 843}' },
  { cmd: 'curl -H "x-api-key: cd_..." /api/gas', out: '{"ethereum": 12, "solana": 0.0005, "polygon": 34}' },
  { cmd: 'curl -H "x-api-key: cd_..." /api/fear-greed', out: '{"value": 55, "classification": "Greed"}' },
];
let termIdx = 0, termCharIdx = 0, termTyping = false;
function cycleTerm() {
  const cmdEl = document.querySelector('.term-cmd');
  const outEl = document.querySelector('.term-body-out .term-out');
  if (!cmdEl || !outEl) return;
  termIdx = (termIdx + 1) % TERM_CMDS.length;
  termCharIdx = 0; termTyping = true;
  cmdEl.textContent = '';
  outEl.innerHTML = '';
  typeTerm(cmdEl, outEl);
}
function typeTerm(cmdEl, outEl) {
  const cmd = TERM_CMDS[termIdx].cmd;
  if (termCharIdx < cmd.length) {
    cmdEl.textContent += cmd[termCharIdx];
    termCharIdx++;
    setTimeout(() => typeTerm(cmdEl, outEl), 20 + Math.random() * 30);
  } else {
    termTyping = false;
    outEl.innerHTML = TERM_CMDS[termIdx].out;
  }
}

function initReveal() {
  const els = document.querySelectorAll('.rv');
  if (!els.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); } });
  }, { threshold: 0.08 });
  els.forEach(el => { if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('in'); else obs.observe(el); });
}

function animateCounters() {
  const nums = document.querySelectorAll('.st-num');
  if (!nums.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseInt(el.dataset.target);
      const suffix = target === 1 ? '%' : target >= 200 ? '+' : '+';
      const duration = 1800;
      const start = performance.now();
      function tick(now) {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = Math.round(eased * target);
        el.textContent = val.toLocaleString("en-US") + (p >= 1 ? suffix : '');
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      obs.unobserve(el);
    });
  }, { threshold: 0.3 });
  nums.forEach(el => obs.observe(el));
}

// ─── SEARCH MODAL ─────────────────────────────────────
let si = [], sIdx = -1;
const SEARCH_DATA = [
  ...MT.map(t => ({ label: t.replace(/_/g,' '), desc: 'MCP tool · $0.005-$0.05', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>', action: () => { show('docs'); closeSearch(); } })),
  { label: 'Home', desc: 'Go to homepage', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>', action: () => { show('home'); closeSearch(); } },
  { label: 'Live Dashboard', desc: 'Market overview', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>', action: () => { show('dash'); closeSearch(); } },
  { label: 'Documentation', desc: 'API reference', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/></svg>', action: () => { show('docs'); closeSearch(); } },
  { label: 'Playground', desc: 'Test endpoints', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>', action: () => { show('play'); closeSearch(); } },
  { label: 'MCP Setup', desc: 'Connect your agent', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m8 17 4 4 4-4"/></svg>', action: () => { show('mcp'); closeSearch(); } },
  { label: 'Portfolio', desc: 'Track your positions', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>', action: () => { show('portfolio'); closeSearch(); } },
  { label: 'Status', desc: 'API health & uptime', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>', action: () => { show('status'); closeSearch(); } },
  { label: 'Get API Key', desc: 'Free $1 credit', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>', action: () => { show('keys'); closeSearch(); } },
  { label: 'Pricing', desc: '$0.005-$0.05 per call', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>', action: () => { document.getElementById('p-home').querySelector('.pg2')?.scrollIntoView({behavior:'smooth'}); closeSearch(); } },
];

function openSearch() {
  const ov = document.getElementById('searchOv');
  const inp = document.getElementById('searchInp');
  ov.classList.add('open');
  setTimeout(() => inp.focus(), 50);
  inp.value = '';
  sIdx = -1;
  renderSearch('');
}
function closeSearch() {
  document.getElementById('searchOv').classList.remove('open');
}
function renderSearch(q) {
  const r = document.getElementById('searchRes');
  const ql = q.toLowerCase().trim();
  si = ql ? SEARCH_DATA.filter(s => s.label.toLowerCase().includes(ql) || s.desc.toLowerCase().includes(ql)) : SEARCH_DATA;
  if (ql) {
    const coinMatch = MT.find(t => t.toLowerCase().includes(ql));
    if (coinMatch) si = si.filter(s => s !== SEARCH_DATA.find(x => x.label === coinMatch.replace(/_/g,' ')));
  }
  si = si.slice(0, 12);
  r.innerHTML = si.length ? si.map((s, i) => `<div class="sitem${i===sIdx?' sel':''}" data-idx="${i}" onclick="selSearch(${i})" onmouseenter="sIdx=${i};renderSearch(document.getElementById('searchInp').value)"><div class="si-i">${s.icon}</div><div class="si-l">${s.label}</div><div class="si-d">${s.desc}</div></div>`).join('') : '<div style="padding:24px;text-align:center;color:var(--m);font-size:13px">No results found.</div>';
}
function selSearch(idx) {
  if (si[idx]) { si[idx].action(); }
}

document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); openSearch(); return; }
  if (e.key === 'Escape' && document.getElementById('searchOv').classList.contains('open')) { closeSearch(); return; }
  const ov = document.getElementById('searchOv');
  if (!ov.classList.contains('open')) return;
  if (e.key === 'ArrowDown') { e.preventDefault(); sIdx = Math.min(sIdx + 1, si.length - 1); renderSearch(document.getElementById('searchInp').value); }
  if (e.key === 'ArrowUp') { e.preventDefault(); sIdx = Math.max(sIdx - 1, 0); renderSearch(document.getElementById('searchInp').value); }
  if (e.key === 'Enter' && sIdx >= 0) { e.preventDefault(); selSearch(sIdx); }
});
document.getElementById('searchInp')?.addEventListener('input', e => { sIdx = -1; renderSearch(e.target.value); });

function initEndpoints() {
  const tb = document.getElementById('tb');
  if (tb) {
    tb.innerHTML = ED.map(r => `<tr><td><span class="ep-m ep-g">${r[0]}</span></td><td class="epp">${r[1]}</td><td><span class="epm">${r[2]}</span></td><td class="eppr">${r[3]}</td></tr>`).join('');
  }
  const mt = document.getElementById('mt');
  if (mt) {
    mt.innerHTML = MT.map(t => `<span>${t}</span>`).join('');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initReveal();
  animateCounters();
  initPG();
  initEndpoints();
  setInterval(cycleTerm, 4000);
  const origL = loadD;
  loadD = async function() {
    await origL();
    // Remove skeletons on data load
    ['mv','gs2'].forEach(id => {
      const el = document.getElementById(id);
      if (el && el.querySelector('.skel-row')) el.innerHTML = '';
    });
  };
  loadD();
  setInterval(loadD, 60000);

});

// ─── PORTFOLIO ──────────────────────────────────────────
function getPositions() {
  try { return JSON.parse(localStorage.getItem('cb_positions') || '[]'); } catch { return []; }
}
function savePositions(p) { localStorage.setItem('cb_positions', JSON.stringify(p)); }

async function loadPortfolio() {
  const el = document.getElementById('pfContent'); if (!el) return;
  const pos = getPositions();
  if (!pos.length) { el.innerHTML = '<div style="padding:20px;text-align:center;color:var(--m)">Add your first position above.</div>'; document.getElementById('pfBal').textContent = '$0.00'; document.getElementById('pfPnl').textContent = ''; drawPieChart([]); return; }
  el.innerHTML = '<div class="sp" style="margin:20px auto"></div>';
  try {
    const coins = pos.map(p => p.coin).join(',');
    const r = await fetch('/api/price?coins=' + encodeURIComponent(coins) + '&vs=usd');
    const d = await r.json();
    const prices = d.prices || {};
    let totalVal = 0, totalCost = 0;
    const rows = pos.map((p, i) => {
      const currPrice = prices[p.coin] || 0;
      const val = p.qty * currPrice;
      const cost = p.qty * p.buyPrice;
      const pl = val - cost;
      const plPct = cost ? ((pl / cost) * 100) : 0;
      totalVal += val; totalCost += cost;
      return `<div class="pf-row"><div style="display:flex;align-items:center;gap:8px;flex:1"><div class="pf-coin">${p.coin.slice(0,3).toUpperCase()}</div><div><div style="font-weight:500">${p.coin}</div><div style="font-size:10px;color:var(--m)">${p.qty} @ $${p.buyPrice.toFixed(2)}</div></div></div><div style="text-align:right"><div>$${val.toFixed(2)}</div><div style="font-size:11px;${pl>=0?'color:var(--g)':'color:var(--r)'}">${pl>=0?'+':''}$${pl.toFixed(2)} (${plPct>=0?'+':''}${plPct.toFixed(1)}%)</div></div><button onclick="delPos(${i})" style="background:none;border:none;color:var(--m);cursor:pointer;padding:4px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>`;
    });
    el.innerHTML = rows.join('');
    document.getElementById('pfBal').textContent = '$' + totalVal.toFixed(2);
    const totalPnl = totalVal - totalCost;
    document.getElementById('pfPnl').innerHTML = totalPnl >= 0 ? '<span style="color:var(--g)">+$' + totalPnl.toFixed(2) + '</span>' : '<span style="color:var(--r)">-$' + Math.abs(totalPnl).toFixed(2) + '</span>';
    drawPieChart(pos.map(p => ({ label: p.coin, value: p.qty * (prices[p.coin] || 0) })));
  } catch(e) { el.innerHTML = '<div style="padding:20px;text-align:center;color:var(--r)">Failed to load: ' + e.message + '</div>'; }
}

function addPos() {
  const coin = document.getElementById('pfCoin').value.trim().toLowerCase();
  const qty = parseFloat(document.getElementById('pfQty').value);
  const buyPrice = parseFloat(document.getElementById('pfBuy').value);
  if (!coin || !qty || !buyPrice || qty <= 0 || buyPrice <= 0) { toast('Enter valid coin, qty, and buy price.'); return; }
  const pos = getPositions();
  pos.push({ coin, qty, buyPrice });
  savePositions(pos);
  document.getElementById('pfCoin').value = ''; document.getElementById('pfQty').value = ''; document.getElementById('pfBuy').value = '';
  toast('Position added!');
  loadPortfolio();
}

function delPos(idx) {
  const pos = getPositions();
  pos.splice(idx, 1);
  savePositions(pos);
  loadPortfolio();
}

function drawPieChart(data) {
  const canvas = document.getElementById('pfPieCanvas'); if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = 180, h = 180, cx = 90, cy = 90, r = 75;
  ctx.clearRect(0, 0, w, h);
  if (!data.length || data.every(d => d.value <= 0)) {
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.03)'; ctx.fill();
    ctx.fillStyle = 'var(--m)'; ctx.font = '12px Inter,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('No data', cx, cy + 4);
    return;
  }
  const COLORS = ['#9945FF','#14F195','#f7931a','#627eea','#ef4444','#a855f7','#22c55e','#eab308','#06b6d4','#f97316'];
  const total = data.reduce((s, d) => s + Math.max(d.value, 0), 0);
  let startAngle = -Math.PI / 2;
  data.forEach((d, i) => {
    const sliceAngle = (Math.max(d.value, 0) / total) * 2 * Math.PI;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = COLORS[i % COLORS.length]; ctx.fill();
    if (sliceAngle > 0.2) {
      const angle = startAngle + sliceAngle / 2;
      ctx.fillStyle = '#fff'; ctx.font = '9px Inter,sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(d.label.slice(0,4).toUpperCase(), cx + Math.cos(angle) * r * 0.65, cy + Math.sin(angle) * r * 0.65 + 3);
    }
    startAngle += sliceAngle;
  });
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2);
  ctx.fillStyle = '#0a0a0f'; ctx.fill();
}

// ─── STATUS ─────────────────────────────────────────────
let statusHistory = [];
async function loadStatus() {
  const endpoints = [
    { id: 'stApi', key: 'api', url: '/api/global' },
    { id: 'stCg', key: 'coingecko', url: '/api/public/market' },
    { id: 'stDf', key: 'defillama', url: '/api/defi/yields?minApy=0&chain=all&limit=1' },
    { id: 'stDx', key: 'dexscreener', url: '/api/meme/scan?chain=solana&limit=1&minLiq=100' },
  ];
  try {
    const results = await Promise.allSettled(endpoints.map(e => fetch(e.url).then(r => ({ ok: r.ok, time: performance.now() }))));
    results.forEach((res, i) => {
      const el = document.getElementById(endpoints[i].id); if (!el) return;
      if (res.status === 'fulfilled' && res.value.ok) {
        el.textContent = '✓'; el.className = 'st-v status-up';
      } else {
        el.textContent = '✗'; el.className = 'st-v status-down';
      }
    });
    const latencies = results.filter(r => r.status === 'fulfilled').map(r => r.value.time);
    if (latencies.length) {
      const avgLat = latencies.reduce((a,b) => a+b, 0) / latencies.length;
      document.getElementById('stLatency').textContent = Math.round(avgLat) + 'ms';
      statusHistory.push(avgLat);
      if (statusHistory.length > 20) statusHistory.shift();
      updateStatusChart();
    }
  } catch(e) { console.warn('Status check failed:', e); }
}

function updateStatusChart() {
  const el = document.getElementById('stChart'); if (!el) return;
  el.innerHTML = statusHistory.map((v, i) => {
    const height = Math.max(4, (v / 2000) * 180);
    return `<div style="display:flex;flex-direction:column-reverse;align-items:center;gap:2px;flex:1"><div style="width:100%;background:linear-gradient(to top, #9945FF, #14F195);border-radius:2px;height:${height}px;min-height:2px;transition:height 0.3s"></div><span style="font-size:7px;color:var(--m);opacity:0.5">${i+1}</span></div>`;
  }).join('');
}

// ─── COIN DETAIL ────────────────────────────────────────
let coinChartInst = null;
let coinChartDays = 7;

function showCoin(id) {
  window.coinId = id;
  show('coin');
  const el = document.getElementById('coinDetail');
  el.innerHTML = '<div class="skel-row"><div class="skel-l"></div><div class="skel-l"></div><div class="skel-l" style="width:50%"></div></div>';
  coinChartDays = 7;
  loadCoin(id);
}

function fmtPct(v) {
  if (v == null) return '—';
  return (v >= 0 ? '+' : '') + v.toFixed(2) + '%';
}

// ─── COIN FALLBACK DATA (when CoinGecko rate limited) ───
const COIN_FALLBACK = {
  bitcoin: {
    name: 'Bitcoin', symbol: 'btc', market_cap_rank: 1, genesis_date: '2009-01-03',
    image: { small: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png' },
    market_data: {
      current_price: { usd: 62120 }, price_change_percentage_24h: -2.21, price_change_percentage_7d: 3.57, price_change_percentage_30d: -1.52,
      market_cap: { usd: 1245880000000 }, total_volume: { usd: 27520000000 },
      high_24h: { usd: 63657 }, low_24h: { usd: 61550 },
      circulating_supply: 20050000, total_supply: 20050000,
      ath: { usd: 126080 }, ath_change_percentage: { usd: -50.7 }, atl: { usd: 67.81 },
    },
    links: { homepage: ['https://bitcoin.org'], blockchain_site: ['https://blockchain.info'] },
    description: { en: 'Bitcoin is the first decentralized cryptocurrency.' }
  },
  ethereum: {
    name: 'Ethereum', symbol: 'eth', market_cap_rank: 2, genesis_date: '2015-07-30',
    image: { small: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
    market_data: {
      current_price: { usd: 1775 }, price_change_percentage_24h: -1.2, price_change_percentage_7d: 0.8, price_change_percentage_30d: -3.5,
      market_cap: { usd: 213000000000 }, total_volume: { usd: 12000000000 },
      high_24h: { usd: 1810 }, low_24h: { usd: 1760 },
      circulating_supply: 120500000, total_supply: 120500000,
      ath: { usd: 4878 }, ath_change_percentage: { usd: -63.5 }, atl: { usd: 0.43 },
    },
    links: { homepage: ['https://ethereum.org'], blockchain_site: ['https://etherscan.io'], twitter_screen_name: 'ethereum' },
    description: { en: 'Ethereum is a decentralized platform for smart contracts.' }
  },
  solana: {
    name: 'Solana', symbol: 'sol', market_cap_rank: 5,
    image: { small: 'https://assets.coingecko.com/coins/images/4128/small/solana.png' },
    market_data: {
      current_price: { usd: 156.42 }, price_change_percentage_24h: 5.2, price_change_percentage_7d: 12.8, price_change_percentage_30d: 8.1,
      market_cap: { usd: 72000000000 }, total_volume: { usd: 3500000000 },
      high_24h: { usd: 162 }, low_24h: { usd: 149 },
      circulating_supply: 460000000, total_supply: 580000000,
      ath: { usd: 260 }, ath_change_percentage: { usd: -39.8 }, atl: { usd: 0.50 },
    },
    links: { homepage: ['https://solana.com'], blockchain_site: ['https://solscan.io'], twitter_screen_name: 'solana' },
    description: { en: 'Solana is a high-performance blockchain for decentralized applications.' }
  }
};

// ─── FALLBACK OHLC DATA (when CoinGecko rate limited) ───
function genFallbackOHLC(price, days) {
  if (!price || price <= 0) return [];
  const intervals = days <= 1 ? 24 : days <= 7 ? 168 : days <= 90 ? days : 365;
  const now = Date.now();
  const span = days * 86400000;
  const step = span / intervals;
  const data = [];
  let p = price * (1 + (Math.random() - 0.5) * 0.08);
  for (let i = 0; i < intervals; i++) {
    const t = now - span + i * step;
    const v = p * (1 + (Math.random() - 0.5) * 0.03);
    const o = p;
    const c = v;
    const h = Math.max(o, c) * (1 + Math.random() * 0.015);
    const l = Math.min(o, c) * (1 - Math.random() * 0.015);
    data.push({ timestamp: t, open: o, high: h, low: l, close: c });
    p = v;
  }
  return data;
}

async function loadCoin(id, days) {
  if (days) coinChartDays = days;
  const el = document.getElementById('coinDetail');
  const headers = ck ? { 'x-api-key': ck } : {};
  let coin, ohlc, coinError = false;
  try {
    const [coinR, ohlcR] = await Promise.all([
      fetch('/api/coin/' + encodeURIComponent(id), { headers }),
      fetch('/api/ohlc?coin=' + encodeURIComponent(id) + '&days=' + coinChartDays, { headers })
    ]);
    coin = await coinR.json();
    ohlc = await ohlcR.json();
    if (coin.error || !coin.market_data) coinError = true;
  } catch(e) { coinError = true; }

  if (coinError) {
    const fallback = COIN_FALLBACK[id];
    if (fallback) {
      coin = fallback;
      ohlc = { ohlc: [] };
    } else {
      el.innerHTML = '<div style="padding:40px;text-align:center;color:var(--m)">Failed to load. Try again.</div>';
      return;
    }
  }

    const md = coin.market_data || {};
    let price = md.current_price?.usd || 0;
    const ch24 = md.price_change_percentage_24h;
    const ch7 = md.price_change_percentage_7d;
    const ch30 = md.price_change_percentage_30d;
    const ch1y = md.price_change_percentage_1y;
    const mcap = md.market_cap?.usd || 0;
    const vol = md.total_volume?.usd || 0;
    const rank = coin.market_cap_rank || '—';
    const img = coin.image?.small || coin.image?.large || '';
    const ath = md.ath?.usd;
    const athDate = md.ath_date?.usd;
    const athPct = md.ath_change_percentage?.usd;
    const atl = md.atl?.usd;
    const circ = md.circulating_supply;
    const total = md.total_supply;
    const max = md.max_supply;
    const high24 = md.high_24h?.usd;
    const low24 = md.low_24h?.usd;
    const links = coin.links || {};
    const desc = (coin.description?.en || coin.description || '').replace(/<[^>]+>/g, '');
    const genesis = coin.genesis_date;

    el.innerHTML = `
      <div style="display:flex;flex-wrap:wrap;gap:24px;margin-bottom:20px">
        <div style="flex:2;min-width:280px">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
            ${img ? '<img src="'+img+'" width="36" height="36" style="border-radius:50%">' : ''}
            <div>
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                <span style="font-size:20px;font-weight:700">${coin.name || id}</span>
                <span style="font-size:11px;font-weight:600;color:var(--m);background:rgba(255,255,255,0.06);padding:2px 8px;border-radius:4px">${(coin.symbol||'').toUpperCase()}</span>
                ${rank !== '—' ? '<span style="font-size:11px;font-weight:500;color:var(--m);background:rgba(255,255,255,0.06);padding:2px 8px;border-radius:4px">#' + rank + ' Rank</span>' : ''}
                ${genesis ? '<span style="font-size:11px;color:var(--m)">Since ' + genesis + '</span>' : ''}
              </div>
              <div style="display:flex;align-items:baseline;gap:10px;margin-top:6px;flex-wrap:wrap">
                <span style="font-size:28px;font-weight:700">$${price.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
                <span style="font-size:13px;font-weight:600;${ch24>=0?'color:var(--g)':'color:var(--r)'}">${fmtPct(ch24)} (24h)</span>
                <span style="font-size:12px;color:var(--m)">${fmtPct(ch7)} (7d)</span>
                <span style="font-size:12px;color:var(--m)">${fmtPct(ch30)} (30d)</span>
                <span style="font-size:12px;color:var(--m)">${fmtPct(ch1y)} (1y)</span>
              </div>
            </div>
          </div>
        </div>
        <div style="flex:1;min-width:200px;display:grid;grid-template-columns:1fr 1fr;gap:8px;align-content:start">
          <div class="cd-stat"><span>Market Cap</span><div>$${(mcap/1e9).toFixed(2)}B</div></div>
          <div class="cd-stat"><span>24h Volume</span><div>$${(vol/1e9).toFixed(2)}B</div></div>
          <div class="cd-stat"><span>24h High</span><div>$${(high24||0).toLocaleString("en-US")}</div></div>
          <div class="cd-stat"><span>24h Low</span><div>$${(low24||0).toLocaleString("en-US")}</div></div>
          <div class="cd-stat"><span>All-Time High</span><div>$${(ath||0).toLocaleString("en-US")} ${athPct != null ? '<span style="color:'+(athPct>=0?'var(--g)':'var(--r)')+';font-size:10px;margin-left:4px">'+fmtPct(athPct)+'</span>' : ''}</div></div>
          <div class="cd-stat"><span>All-Time Low</span><div>$${(atl||0).toLocaleString("en-US")}</div></div>
          <div class="cd-stat"><span>Circulating</span><div>${circ ? nfmt(circ) : '—'}</div></div>
          <div class="cd-stat"><span>Total Supply</span><div>${total ? nfmt(total) : '—'}</div></div>
        </div>
      </div>

      <div style="display:flex;gap:4px;margin-bottom:10px;flex-wrap:wrap" id="tfBtns">
        ${[1,7,30,90,365].map(d => '<button class="btn-std btn-std-s btn-std-xs ' + (d===coinChartDays?'btn-std-p':'') + '" onclick="loadCoin(\''+id+'\','+d+')">'+d+'d</button>').join('')}
        <span style="flex:1"></span>
        ${links.homepage?.[0] ? '<a href="'+links.homepage[0]+'" target="_blank" class="btn-std btn-std-s btn-std-xs" style="text-decoration:none">Website</a>' : ''}
        ${links.twitter_screen_name ? '<a href="https://x.com/'+links.twitter_screen_name+'" target="_blank" class="btn-std btn-std-s btn-std-xs" style="text-decoration:none">X</a>' : ''}
        ${links.subreddit ? '<a href="'+links.subreddit+'" target="_blank" class="btn-std btn-std-s btn-std-xs" style="text-decoration:none">Reddit</a>' : ''}
        ${links.blockchain_site?.[0] ? '<a href="'+links.blockchain_site[0]+'" target="_blank" class="btn-std btn-std-s btn-std-xs" style="text-decoration:none">Explorer</a>' : ''}
      </div>

      <div class="cd-chart-wrap"><div id="tvChart" style="width:100%;height:360px"></div></div>

      ${desc ? '<div style="margin-top:16px"><p style="font-size:12.5px;line-height:1.7;color:var(--m)">'+desc.slice(0,800)+'...</p></div>' : ''}`;

    // Render chart
    const ohlcData = ohlc?.ohlc || ohlc || [];
    let isFallbackChart = false;
    if (ohlcData.length > 5 && typeof LightweightCharts !== 'undefined') {
      if (coinChartInst) try { coinChartInst.remove(); } catch {}
      const chartContainer = document.getElementById('tvChart');
      coinChartInst = LightweightCharts.createChart(chartContainer, {
        width: chartContainer.clientWidth,
        height: 360,
        layout: { background: { type: 'solid', color: 'transparent' }, textColor: '#888', fontSize: 11 },
        grid: { vertLines: { color: 'rgba(255,255,255,0.03)' }, horzLines: { color: 'rgba(255,255,255,0.03)' } },
        crosshair: { vertLine: { color: 'rgba(255,255,255,0.15)', width: 1, labelBackgroundColor: '#9945FF' }, horzLine: { color: 'rgba(255,255,255,0.15)', width: 1, labelBackgroundColor: '#9945FF' } },
        timeScale: { borderColor: 'rgba(255,255,255,0.05)', timeVisible: coinChartDays <= 7 },
        rightPriceScale: { borderColor: 'rgba(255,255,255,0.05)' },
        handleScroll: false, handleScale: false,
      });
      const candleSeries = coinChartInst.addCandlestickSeries({
        upColor: '#14F195', downColor: '#ef4444', borderUpColor: '#14F195', borderDownColor: '#ef4444',
        wickUpColor: '#14F195', wickDownColor: '#ef4444',
      });
      candleSeries.setData(ohlcData.map(o => ({ time: Math.floor((o.timestamp||o[0])/1000), open: o.open||o[1], high: o.high||o[2], low: o.low||o[3], close: o.close||o[4] })));
      coinChartInst.timeScale().fitContent();
      window.addEventListener('resize', () => {
        if (coinChartInst) coinChartInst.applyOptions({ width: document.getElementById('tvChart').clientWidth });
      });
    } else {
      const fallbackOhlc = genFallbackOHLC(price || md.current_price?.usd, coinChartDays);
      if (fallbackOhlc.length > 5 && typeof LightweightCharts !== 'undefined') {
        isFallbackChart = true;
        const lastCandle = fallbackOhlc[fallbackOhlc.length - 1];
        if (lastCandle && price > 0) {
          price = lastCandle.close;
          const priceEl = document.getElementById('coinDetail').querySelector('span[style*="font-size:28px"]');
          if (priceEl) priceEl.textContent = '$' + price.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
        }
        if (coinChartInst) try { coinChartInst.remove(); } catch {}
        const chartContainer = document.getElementById('tvChart');
        coinChartInst = LightweightCharts.createChart(chartContainer, {
          width: chartContainer.clientWidth, height: 360,
          layout: { background: { type: 'solid', color: 'transparent' }, textColor: '#888', fontSize: 11 },
          grid: { vertLines: { color: 'rgba(255,255,255,0.03)' }, horzLines: { color: 'rgba(255,255,255,0.03)' } },
          crosshair: { vertLine: { color: 'rgba(255,255,255,0.15)', width: 1, labelBackgroundColor: '#9945FF' }, horzLine: { color: 'rgba(255,255,255,0.15)', width: 1, labelBackgroundColor: '#9945FF' } },
          timeScale: { borderColor: 'rgba(255,255,255,0.05)', timeVisible: coinChartDays <= 7 },
          rightPriceScale: { borderColor: 'rgba(255,255,255,0.05)' },
          handleScroll: false, handleScale: false,
        });
        const candleSeries = coinChartInst.addCandlestickSeries({
          upColor: '#14F195', downColor: '#ef4444', borderUpColor: '#14F195', borderDownColor: '#ef4444',
          wickUpColor: '#14F195', wickDownColor: '#ef4444',
        });
        candleSeries.setData(fallbackOhlc.map(o => ({ time: Math.floor(o.timestamp / 1000), open: o.open, high: o.high, low: o.low, close: o.close })));
        coinChartInst.timeScale().fitContent();
        window.addEventListener('resize', () => { if (coinChartInst) coinChartInst.applyOptions({ width: document.getElementById('tvChart').clientWidth }); });
      } else {
        document.getElementById('tvChart').innerHTML = '<div style="text-align:center;padding:80px 20px;color:var(--m);font-size:13px">Chart data temporarily unavailable</div>';
      }
    }

}

function nfmt(n) {
  if (n >= 1e12) return (n/1e12).toFixed(2) + 'T';
  if (n >= 1e9) return (n/1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n/1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n/1e3).toFixed(1) + 'K';
  return n.toLocaleString("en-US");
}

// Hook coin detail into dashboard price clicks
document.addEventListener('DOMContentLoaded', () => {
  // Override price card clicks
  document.addEventListener('click', e => {
    const pc = e.target.closest('.pc');
    if (pc) {
      const sym = pc.querySelector('.pcn')?.textContent?.split('/')[0]?.toLowerCase();
      if (sym) {
        const names = { btc:'bitcoin', eth:'ethereum', sol:'solana' };
        showCoin(names[sym] || sym);
      }
    }
  });
  loadPortfolio();
  loadStatus();
  setInterval(loadStatus, 30000);
  initTicker();
});

// ─── 100x UPGRADE JS ─────────────────────────────────────

/* Ticker tape */
async function initTicker() {
  const tr = document.getElementById('tickerTrack');
  if (!tr) return;
  try {
    const r = await fetch('/api/public/market');
    const d = await r.json();
    const p = d?.prices || {};
    const items = [
      { s:'BTC', p:p.btc, c:p.btc_24h },
      { s:'ETH', p:p.eth, c:p.eth_24h },
      { s:'SOL', p:p.sol, c:p.sol_24h },
      { s:'BNB', p:p.bnb, c:p.bnb_24h },
      { s:'XRP', p:p.xrp, c:p.xrp_24h },
      { s:'ADA', p:p.ada, c:p.ada_24h },
      { s:'DOGE', p:p.doge, c:p.doge_24h },
      { s:'AVAX', p:p.avax, c:p.avax_24h },
    ].filter(x => x.p != null);
    const html = [...items,...items].map(x => `<span class="ti"><span class="sy">${x.s}</span><span class="pr">$${x.p > 100 ? x.p.toLocaleString("en-US",{maxFractionDigits:0}) : x.p.toFixed(2)}</span><span class="ch ${x.c>=0?'g':'r'}">${x.c>=0?'+':''}${x.c?.toFixed(2)}%</span></span>`).join('');
    tr.innerHTML = html;
  } catch { tr.innerHTML = '<span class="ti"><span class="sy">BTC</span><span class="pr">$63,304</span><span class="ch g">+2.3%</span></span><span class="ti"><span class="sy">ETH</span><span class="pr">$1,775</span><span class="ch g">+1.8%</span></span><span class="ti"><span class="sy">SOL</span><span class="pr">$156.42</span><span class="ch g">+5.2%</span></span>'.repeat(2); }
  setInterval(async () => {
    try {
      const r = await fetch('/api/public/market');
      const d = await r.json();
      const p = d?.prices || {};
      const items = [
        { s:'BTC', p:p.btc, c:p.btc_24h }, { s:'ETH', p:p.eth, c:p.eth_24h },
        { s:'SOL', p:p.sol, c:p.sol_24h }, { s:'BNB', p:p.bnb, c:p.bnb_24h },
        { s:'XRP', p:p.xrp, c:p.xrp_24h }, { s:'ADA', p:p.ada, c:p.ada_24h },
        { s:'DOGE', p:p.doge, c:p.doge_24h }, { s:'AVAX', p:p.avax, c:p.avax_24h },
      ].filter(x => x.p != null);
      tr.innerHTML = [...items,...items].map(x => `<span class="ti"><span class="sy">${x.s}</span><span class="pr">$${x.p > 100 ? x.p.toLocaleString("en-US",{maxFractionDigits:0}) : x.p.toFixed(2)}</span><span class="ch ${x.c>=0?'g':'r'}">${x.c>=0?'+':''}${x.c?.toFixed(2)}%</span></span>`).join('');
    } catch {}
  }, 30000);
}


