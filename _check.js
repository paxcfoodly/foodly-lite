

// ══════════════════════════════
// ROUTING
// ══════════════════════════════
const allScreens = ['login','signup','onboard1','onboard2','onboard3','app','admin'];
const allAppScreens = ['dashboard','receipt','receipt-upload','receipt-ocr','receipt-done','receipt-manual','stock','ledger','production','plan','recipe','device','mat-master','semi-master','prod-master','partner-master','process-master'];
const navMap = {dashboard:'nav-dashboard',receipt:'nav-receipt','receipt-upload':'nav-receipt','receipt-ocr':'nav-receipt','receipt-done':'nav-receipt','receipt-manual':'nav-receipt',stock:'nav-stock',ledger:'nav-ledger',production:'nav-production',plan:'nav-plan',recipe:'nav-recipe',device:'nav-device','mat-master':'nav-mat-master','semi-master':'nav-semi-master','prod-master':'nav-prod-master','partner-master':'nav-partner-master','process-master':'nav-process-master'};

function go(screen){
  allScreens.forEach(s=>{ const el=document.getElementById('screen-'+s); if(el) el.classList.add('hidden'); });
  const target = document.getElementById('screen-'+screen);
  if(target) target.classList.remove('hidden');
}

function goApp(page){
  if(page === 'admin-users'){
    go('admin');
    loadAdminUsers();
    // 관리자 화면 상단 사용자명 표시
    const el = document.getElementById('admin-username-disp');
    if(el) el.textContent = localStorage.getItem('foodly_username') || 'paxc';
    return;
  }
  document.getElementById('screen-app').classList.remove('hidden');
  allScreens.filter(s=>s!=='app').forEach(s=>{ const el=document.getElementById('screen-'+s); if(el) el.classList.add('hidden'); });
  allAppScreens.forEach(p=>{ const el=document.getElementById('app-'+p); if(el) el.classList.add('hidden'); });
  const target = document.getElementById('app-'+page);
  if(target) target.classList.remove('hidden');
  // nav active
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  const navEl = navMap[page] ? document.getElementById(navMap[page]) : null;
  if(navEl) navEl.classList.add('active');
  // nav 하단 회사명/유저명 표시
  const nf = document.getElementById('nav-company');
  if(nf) nf.textContent = localStorage.getItem('foodly_company') || '';
  const nf2 = document.getElementById('nav-username');
  if(nf2) nf2.textContent = localStorage.getItem('foodly_username') || '';
  // init chart if needed
  if(page==='dashboard') setTimeout(initDashChart, 50);

  // 페이지별 API 로드
  const loadFns = {
    dashboard: loadDashboard,
    receipt: loadRecentReceipts,
    stock: loadStock,
    production: loadProductions,
    device: loadDevices,
    'mat-master': loadMaterMaster,
    'semi-master': loadSemiMaster,
    'prod-master': loadProductMaster,
    'partner-master': loadPartnerMaster,
    'process-master': loadProcessMaster,
    plan: initPlanView,
    ledger: initLedger,
  };
  if(loadFns[page]) loadFns[page]();
}

// ══════════════════════════════
// AUTH
// ══════════════════════════════
async function doLogin(){
  const username = (document.getElementById('login-username')?.value || '').trim();
  const biznum   = (document.getElementById('login-biznum')?.value || '').trim();
  const pw       = (document.getElementById('login-pw')?.value || '');
  const errEl    = document.getElementById('login-err');
  if(!username || !pw){ errEl.classList.remove('hidden'); return; }
  errEl.classList.add('hidden');

  const isAdmin = (username === 'paxc');
  const url     = isAdmin ? '/api/auth/admin/login' : '/api/auth/login';
  const body    = isAdmin
    ? {username, password: pw}
    : {username, business_number: biznum, password: pw};

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(body),
    });
    if(!res.ok){ errEl.classList.remove('hidden'); return; }
    const data = await res.json();
    localStorage.setItem('foodly_token', data.token);
    localStorage.setItem('foodly_role',  data.role);
    localStorage.setItem('foodly_company', data.company_name || '');
    localStorage.setItem('foodly_username', data.username || username);
    if(data.role === 'admin'){
      goApp('admin-users');
    } else {
      goApp('dashboard');
    }
  } catch(e){
    errEl.classList.remove('hidden');
  }
}

function doLogout(){
  localStorage.removeItem('foodly_token');
  localStorage.removeItem('foodly_role');
  localStorage.removeItem('foodly_company');
  localStorage.removeItem('foodly_username');
  go('login');
}

function togglePw(inputId, btn){
  const inp = document.getElementById(inputId);
  if(inp.type==='password'){ inp.type='text'; btn.textContent='숨기기'; }
  else{ inp.type='password'; btn.textContent='표시'; }
}

function selectHaccp(val){
  const no = document.getElementById('h-no');
  const yes = document.getElementById('h-yes');
  if(val==='no'){
    no.style.borderColor='var(--teal)'; no.style.background='var(--teal-lt)';
    yes.style.borderColor='var(--gray-bd)'; yes.style.background='';
    no.querySelector('div').style.color='var(--teal-dk)';
    yes.querySelector('div').style.color='';
  } else {
    yes.style.borderColor='var(--teal)'; yes.style.background='var(--teal-lt)';
    no.style.borderColor='var(--gray-bd)'; no.style.background='';
    yes.querySelector('div').style.color='var(--teal-dk)';
    no.querySelector('div').style.color='';
  }
}

// ══════════════════════════════
// ONBOARDING TABS
// ══════════════════════════════
function obTab(tab){
  const tabIng = document.getElementById('ob-ing');
  const tabSup = document.getElementById('ob-sup');
  const btnIng = document.getElementById('ob-tab-ing');
  const btnSup = document.getElementById('ob-tab-sup');
  if(tab==='ing'){
    tabIng.classList.remove('hidden'); tabSup.classList.add('hidden');
    btnIng.classList.add('active'); btnSup.classList.remove('active');
  } else {
    tabSup.classList.remove('hidden'); tabIng.classList.add('hidden');
    btnSup.classList.add('active'); btnIng.classList.remove('active');
  }
}

function addObIng(){
  const div = document.createElement('div');
  div.style.cssText = 'display:grid;grid-template-columns:1fr 80px 80px 36px;gap:8px;margin-bottom:8px;align-items:center';
  div.innerHTML = `<input class="finput" style="padding:7px 9px;font-size:12px" type="text" placeholder="원료명 입력"/><select style="height:34px;font-size:12px"><option>kg</option><option>g</option><option>L</option><option>개</option></select><input class="finput" style="padding:7px 9px;font-size:12px;text-align:right" type="number" placeholder="0"/><button onclick="this.closest('div').remove()" style="width:28px;height:28px;border-radius:5px;border:1px solid var(--gray-bd);background:var(--gray-lt);cursor:pointer;color:var(--gray);font-size:14px">×</button>`;
  document.getElementById('ob-ing-list').appendChild(div);
}

function addObSup(){
  const div = document.createElement('div');
  div.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 36px;gap:8px;margin-bottom:8px;align-items:center';
  div.innerHTML = `<input class="finput" style="padding:7px 9px;font-size:12px" type="text" placeholder="업체명"/><input class="finput" style="padding:7px 9px;font-size:11px;font-family:var(--mono)" type="text" placeholder="000-00-00000"/><button onclick="this.closest('div').remove()" style="width:28px;height:28px;border-radius:5px;border:1px solid var(--gray-bd);background:var(--gray-lt);cursor:pointer;color:var(--gray);font-size:14px">×</button>`;
  document.getElementById('ob-sup-list').appendChild(div);
}

// ══════════════════════════════
// CHARTS
// ══════════════════════════════
let dashChartInst = null;
function initDashChart(){
  const canvas = document.getElementById('dash-chart');
  if(!canvas) return;
  if(dashChartInst) dashChartInst.destroy();
  dashChartInst = new Chart(canvas,{
    type:'bar',
    data:{
      labels:['월','화','수','목','금','토','오늘'],
      datasets:[
        {label:'양품',data:[980,1050,1120,890,1200,1180,1207],backgroundColor:'#5DCAA5',borderRadius:3,stack:'s'},
        {label:'불량',data:[20,30,25,40,18,22,33],backgroundColor:'#F09595',borderRadius:3,stack:'s'}
      ]
    },
    options:{
      responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false}},
      scales:{
        x:{stacked:true,grid:{display:false},ticks:{font:{size:11},color:'#888780'}},
        y:{stacked:true,grid:{color:'rgba(0,0,0,.05)'},ticks:{font:{size:11},color:'#888780'}}
      }
    }
  });
}

// ══════════════════════════════
// 대시보드 자동 갱신 (5분마다)
setInterval(()=>{
  if(document.getElementById('app-dashboard') && !document.getElementById('app-dashboard').classList.contains('hidden')){
    loadDashboard();
  }
}, 300000);

// ══════════════════════════════
// INIT
// ══════════════════════════════
(function initAuth(){
  const token = localStorage.getItem('foodly_token');
  const role  = localStorage.getItem('foodly_role');
  if(token && role === 'admin') { go('admin'); loadAdminUsers(); }
  else if(token && role === 'user') { goApp('dashboard'); }
  else go('login');
})();

// ══════════════════════════════════════════════════════
// API 연동 레이어
// ══════════════════════════════════════════════════════
const API = 'http://localhost:8000/api';

// ① 차트 race condition 방지: initDashChart를 no-op으로 교체
//    (loadDashboard가 API 데이터로 차트를 직접 그리므로 원본 함수 불필요)
initDashChart = function() {};

async function apiFetch(path, options={}) {
  try {
    const token = localStorage.getItem('foodly_token') || '';
    const headers = {'Content-Type': 'application/json', 'X-Token': token};
    if(options.headers) Object.assign(headers, options.headers);
    const res = await fetch(API + path, {...options, headers});
    if(res.status === 401){ doLogout(); return null; }
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  } catch(e) {
    console.error('API Error:', path, e.message);
    return null;
  }
}

// ══════════════════════════════════════════════════════
// 관리자 포탈 함수
// ══════════════════════════════════════════════════════
async function loadAdminUsers(){
  const token = localStorage.getItem('foodly_token') || '';
  const res = await fetch('/api/admin/users', {headers:{'X-Token':token}});
  if(!res.ok){ document.getElementById('admin-user-tbody').innerHTML='<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--red)">권한 없음</td></tr>'; return; }
  const users = await res.json();
  const tbody = document.getElementById('admin-user-tbody');
  if(!users.length){ tbody.innerHTML='<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--gray-md)">등록된 계정이 없습니다</td></tr>'; return; }
  tbody.innerHTML = users.map(u=>`
    <tr>
      <td style="font-weight:700">${u.username}</td>
      <td>${u.company_name}</td>
      <td class="mono">${u.business_number}</td>
      <td style="font-size:12px">${u.contact_person||'—'}</td>
      <td style="font-size:12px;color:var(--gray)">${u.created_at}</td>
      <td><span class="bdg ${u.status==='active'?'b-ok':'b-gray'}">${u.status==='active'?'활성':'정지'}</span></td>
      <td><div style="display:flex;gap:5px;white-space:nowrap;padding-right:8px">
        <button class="btn btn-ghost" style="padding:5px 10px;font-size:12px" onclick="openAdminUserModal(${JSON.stringify(u).replace(/"/g,'&quot;')})">수정</button>
        <button class="btn btn-danger" style="padding:5px 10px;font-size:12px" onclick="deleteAdminUser(${u.id})">삭제</button>
      </div></td>
    </tr>`).join('');
}

function openAdminUserModal(user){
  document.getElementById('admin-modal-uid').value = user?.id || '';
  document.getElementById('admin-modal-username').value = user?.username || '';
  document.getElementById('admin-modal-pw').value = '';
  document.getElementById('admin-modal-company').value = user?.company_name || '';
  document.getElementById('admin-modal-biznum').value = user?.business_number || '';
  document.getElementById('admin-modal-person').value = user?.contact_person || '';
  document.getElementById('admin-modal-contact').value = user?.contact || '';
  document.getElementById('admin-modal-status').value = user?.status || 'active';
  document.getElementById('admin-modal-status-row').style.display = user ? 'flex' : 'none';
  document.getElementById('admin-modal-title').textContent = user ? '계정 수정' : '계정 추가';
  document.getElementById('admin-modal-err').classList.add('hidden');
  document.getElementById('admin-modal-username').disabled = !!user;
  document.getElementById('admin-user-modal').classList.remove('hidden');
}

async function submitAdminUser(){
  const uid   = document.getElementById('admin-modal-uid').value;
  const token = localStorage.getItem('foodly_token') || '';
  const body  = {
    username:        document.getElementById('admin-modal-username').value.trim(),
    password:        document.getElementById('admin-modal-pw').value,
    company_name:    document.getElementById('admin-modal-company').value.trim(),
    business_number: document.getElementById('admin-modal-biznum').value.trim(),
    contact_person:  document.getElementById('admin-modal-person').value.trim(),
    contact:         document.getElementById('admin-modal-contact').value.trim(),
    status:          document.getElementById('admin-modal-status').value,
  };
  if(!body.username || !body.company_name || !body.business_number || (!uid && !body.password)){
    document.getElementById('admin-modal-err').textContent='필수 항목을 모두 입력하세요';
    document.getElementById('admin-modal-err').classList.remove('hidden'); return;
  }
  const url    = uid ? `/api/admin/users/${uid}` : '/api/admin/users';
  const method = uid ? 'PUT' : 'POST';
  const res = await fetch(url, {method, headers:{'Content-Type':'application/json','X-Token':token}, body:JSON.stringify(body)});
  if(!res.ok){
    const err = await res.json().catch(()=>({}));
    document.getElementById('admin-modal-err').textContent = err.detail || '저장 실패';
    document.getElementById('admin-modal-err').classList.remove('hidden'); return;
  }
  document.getElementById('admin-user-modal').classList.add('hidden');
  loadAdminUsers();
}

async function deleteAdminUser(userId){
  if(!confirm('이 계정을 삭제하시겠습니까?\n해당 회원의 데이터는 유지됩니다.')) return;
  const token = localStorage.getItem('foodly_token') || '';
  await fetch(`/api/admin/users/${userId}`, {method:'DELETE', headers:{'X-Token':token}});
  loadAdminUsers();
}

// ── 대시보드 API 로드
async function loadDashboard() {
  const data = await apiFetch('/dashboard');
  if (!data) return;

  // 기준 시각
  const ts = document.getElementById('dash-timestamp');
  if (ts) {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    ts.textContent = `${now.getFullYear()}년 ${now.getMonth()+1}월 ${now.getDate()}일 ${pad(now.getHours())}:${pad(now.getMinutes())} 기준`;
  }

  // 알림 배너
  const alertEl = document.getElementById('dash-alerts');
  if (alertEl) {
    alertEl.innerHTML = '';
    if (data.expiry_alerts > 0)
      alertEl.insertAdjacentHTML('beforeend', `<div class="alert alert-danger"><span>⚠ 유통기한 7일 이내 원료 ${data.expiry_alerts}건이 있습니다</span><button class="btn btn-sm btn-ghost" onclick="goApp('stock')">확인</button></div>`);
    if (data.safety_stock_alerts > 0)
      alertEl.insertAdjacentHTML('beforeend', `<div class="alert alert-warn"><span>⚠ 안전재고 이하 원료 ${data.safety_stock_alerts}건</span><button class="btn btn-sm btn-ghost" onclick="goApp('receipt')">입고 등록</button></div>`);
  }

  // KPI — 오늘 생산량
  const kvProd = document.getElementById('dash-kv-prod');
  const ksProd = document.getElementById('dash-ks-prod');
  if (kvProd) kvProd.innerHTML = data.today_quantity.toLocaleString() + ' <span class="ku">개</span>';
  if (ksProd) {
    if (data.yesterday_quantity > 0) {
      const diff = data.today_quantity - data.yesterday_quantity;
      const pct = Math.round(diff / data.yesterday_quantity * 100);
      ksProd.className = 'ks ' + (pct >= 0 ? 'up' : 'dn');
      ksProd.textContent = (pct >= 0 ? '▲' : '▼') + ` 어제 대비 ${pct >= 0 ? '+' : ''}${pct}%`;
    } else {
      ksProd.className = 'ks';
      ksProd.textContent = data.today_plan_qty > 0 ? `계획 ${data.today_plan_qty.toLocaleString()}개` : '생산실적 없음';
    }
  }

  // KPI — 오늘 양품률
  const kvRate = document.getElementById('dash-kv-rate');
  const ksRate = document.getElementById('dash-ks-rate');
  if (kvRate) kvRate.innerHTML = data.today_good_rate + ' <span class="ku">%</span>';
  if (ksRate) {
    if (data.yesterday_good_rate > 0) {
      const diff = +(data.today_good_rate - data.yesterday_good_rate).toFixed(1);
      ksRate.className = 'ks ' + (diff >= 0 ? 'up' : 'dn');
      ksRate.textContent = (diff >= 0 ? '▲' : '▼') + ` ${diff >= 0 ? '+' : ''}${diff}%p`;
    } else {
      ksRate.className = 'ks';
      ksRate.textContent = data.today_quantity > 0 ? '양품률 집계' : '데이터 없음';
    }
  }

  // KPI — 오늘 입고
  const kvRecv = document.getElementById('dash-kv-recv');
  const ksRecv = document.getElementById('dash-ks-recv');
  if (kvRecv) kvRecv.innerHTML = data.today_receipts + ' <span class="ku">건</span>';
  if (ksRecv) ksRecv.textContent = data.today_receipt_qty > 0 ? `총 ${data.today_receipt_qty.toLocaleString()} 단위` : '오늘 입고 없음';

  // KPI — 재고 알림
  const kvAlert = document.getElementById('dash-kv-alert');
  const ksAlert = document.getElementById('dash-ks-alert');
  const kpiAlert = document.getElementById('dash-kpi-alert');
  if (kvAlert) kvAlert.innerHTML = `<span style="color:${data.alert_count > 0 ? 'var(--red)' : 'var(--teal)'}">${data.alert_count}</span> <span class="ku">건</span>`;
  if (ksAlert) { ksAlert.className = data.alert_count > 0 ? 'ks dn' : 'ks'; ksAlert.textContent = `유통기한 ${data.expiry_alerts} · 안전재고 ${data.safety_stock_alerts}`; }
  if (kpiAlert) kpiAlert.className = data.alert_count > 0 ? 'kpi danger' : 'kpi';

  // 주간 차트
  const canvas = document.getElementById('dash-chart');
  if (canvas && data.week_chart && data.week_chart.length) {
    if (dashChartInst) { dashChartInst.destroy(); dashChartInst = null; }
    dashChartInst = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: data.week_chart.map(d => d.label),
        datasets: [
          {label:'양품', data: data.week_chart.map(d => d.good), backgroundColor:'#5DCAA5', borderRadius:3, stack:'s'},
          {label:'불량', data: data.week_chart.map(d => d.defect), backgroundColor:'#F09595', borderRadius:3, stack:'s'},
        ]
      },
      options: {responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}},
        scales:{x:{stacked:true,grid:{display:false},ticks:{font:{size:11},color:'#888780'}},
                y:{stacked:true,grid:{color:'rgba(0,0,0,.05)'},ticks:{font:{size:11},color:'#888780'}}}}
    });
  }

  // 최근 입고
  const recentEl = document.getElementById('dash-recent-receipts');
  if (recentEl) {
    recentEl.innerHTML = data.recent_receipts && data.recent_receipts.length
      ? data.recent_receipts.map((r, i, arr) => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 16px;${i<arr.length-1?'border-bottom:1px solid var(--gray-lt)':''}">
          <div><div style="font-size:13px;font-weight:700">${r.material_name}</div>
          <div style="font-size:11px;color:var(--gray)">${r.supplier_name||'—'} · ${r.lot_number||'—'}</div></div>
          <div style="text-align:right"><div style="font-size:13px;font-weight:700">${r.quantity} ${r.unit}</div>
          <div style="font-size:11px;color:var(--gray)">${r.created_at}</div></div>
        </div>`).join('')
      : '<div style="padding:24px;text-align:center;color:var(--gray-md)">입고 내역 없음</div>';
  }

  // 최근 생산실적
  const prodEl = document.getElementById('dash-recent-prods');
  if (prodEl) {
    const statusLbl = {completed:'완료', in_progress:'생산중', planned:'계획'};
    const statusCls = {completed:'b-ok', in_progress:'b-purple', planned:'b-gray'};
    prodEl.innerHTML = data.recent_productions && data.recent_productions.length
      ? data.recent_productions.map((p, i, arr) => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 16px;${i<arr.length-1?'border-bottom:1px solid var(--gray-lt)':''}">
          <div><div style="font-size:13px;font-weight:700">${p.product_name||'(미지정)'}</div>
          <div style="font-size:11px;color:var(--gray)">${p.lot_number||''} · ${p.start_time}</div></div>
          <div style="text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:3px">
            <div style="font-size:13px;font-weight:700">${(p.produced_quantity||0).toLocaleString()} 개</div>
            <span class="bdg ${statusCls[p.status]||'b-gray'}">${statusLbl[p.status]||p.status}</span>
          </div>
        </div>`).join('')
      : '<div style="padding:24px;text-align:center;color:var(--gray-md)">생산실적 없음</div>';
  }

  // 장비 현황
  const devEl = document.getElementById('dash-device-status');
  if (devEl) {
    const ds = data.device_summary;
    if (!ds || ds.total === 0) {
      devEl.innerHTML = '<div style="text-align:center;color:var(--gray-md);padding:8px">등록된 장비 없음</div>';
    } else {
      devEl.innerHTML = `
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          <div style="flex:1;min-width:80px;text-align:center;padding:12px;background:var(--gray-lt);border-radius:8px">
            <div style="font-size:20px;font-weight:700">${ds.total}</div><div style="font-size:11px;color:var(--gray);margin-top:2px">전체</div>
          </div>
          <div style="flex:1;min-width:80px;text-align:center;padding:12px;background:var(--teal-lt);border-radius:8px">
            <div style="font-size:20px;font-weight:700;color:var(--teal-dk)">${ds.running}</div><div style="font-size:11px;color:var(--teal-dk);margin-top:2px">가동중</div>
          </div>
          <div style="flex:1;min-width:80px;text-align:center;padding:12px;background:var(--gray-lt);border-radius:8px">
            <div style="font-size:20px;font-weight:700;color:var(--gray)">${ds.idle}</div><div style="font-size:11px;color:var(--gray);margin-top:2px">대기</div>
          </div>
          ${ds.error > 0 ? `<div style="flex:1;min-width:80px;text-align:center;padding:12px;background:var(--red-lt);border-radius:8px">
            <div style="font-size:20px;font-weight:700;color:var(--red)">${ds.error}</div><div style="font-size:11px;color:var(--red);margin-top:2px">오류</div>
          </div>` : ''}
        </div>
        ${data.today_plan_qty > 0 ? `<div style="margin-top:12px;padding:10px 14px;background:var(--purple-lt);border-radius:8px;font-size:12px;color:var(--purple)">오늘 생산계획 <b>${data.today_plan_qty.toLocaleString()}개</b> · 실적 <b>${data.today_quantity.toLocaleString()}개</b></div>` : ''}`;
    }
  }

  // 원료 재고 현황
  const stockEl = document.getElementById('dash-stock-list');
  if (stockEl) {
    if (!data.stock_summary || !data.stock_summary.length) {
      stockEl.innerHTML = '<div style="padding:24px;text-align:center;color:var(--gray-md)">등록된 원료가 없습니다</div>';
    } else {
      const statusCfg = {
        danger: {bdg:'b-danger', txt:'부족', color:'var(--red)', bg:'#fff8f8', bar:'#E24B4A'},
        warn:   {bdg:'b-warn',   txt:'주의', color:'var(--gray)', bg:'transparent', bar:'#EF9F27'},
        normal: {bdg:'b-ok',     txt:'정상', color:'var(--gray)', bg:'transparent', bar:'var(--teal)'},
      };
      stockEl.innerHTML = data.stock_summary.map((m, i, arr) => {
        const cfg = statusCfg[m.status] || statusCfg.normal;
        const maxRef = Math.max(m.current_stock, m.safety_stock * 2, 1);
        const fillPct = Math.min(100, m.current_stock / maxRef * 100).toFixed(1);
        const safePct = m.safety_stock ? Math.min(100, m.safety_stock / maxRef * 100).toFixed(1) : '50';
        return `<div style="display:flex;align-items:center;gap:10px;padding:10px 16px;${i<arr.length-1?'border-bottom:1px solid var(--gray-lt);':''}background:${cfg.bg}">
          <span style="flex:1;font-size:13px">${m.name}</span>
          <span class="bdg ${cfg.bdg}">${cfg.txt}</span>
          <div class="bar-wrap" style="flex:2">
            <div class="bar-fill" style="width:${fillPct}%;background:${cfg.bar}"></div>
            ${m.safety_stock ? `<div class="bar-safe" style="left:${safePct}%"></div>` : ''}
          </div>
          <span style="font-size:12px;color:${cfg.color};min-width:110px;text-align:right">${m.current_stock} / ${m.safety_stock} ${m.unit}</span>
        </div>`;
      }).join('');
    }
  }
}

// ── 날짜 범위 헬퍼 ─────────────────────────────────────
function _datePresetRange(preset) {
  const today = new Date();
  const fmt = d => {
    const y = d.getFullYear();
    const mo = String(d.getMonth()+1).padStart(2,'0');
    const day = String(d.getDate()).padStart(2,'0');
    return `${y}-${mo}-${day}`;
  };
  const y = today.getFullYear(), m = today.getMonth();
  if (preset === 'today')     return [fmt(today), fmt(today)];
  if (preset === 'week') {
    const sun = new Date(today); sun.setDate(today.getDate() - today.getDay());
    const sat = new Date(sun);  sat.setDate(sun.getDate() + 6);
    return [fmt(sun), fmt(sat)];
  }
  if (preset === 'month')     return [fmt(new Date(y, m, 1)), fmt(today)];
  if (preset === 'lastmonth') return [fmt(new Date(y, m-1, 1)), fmt(new Date(y, m, 0))];
  return [null, null];
}

function _applyPresetBtns(groupId, active) {
  const ids = ['today','week','month','lastmonth'];
  const prefix = groupId === 'prod-preset-btns' ? 'ppb-' : 'lpb-';
  ids.forEach(id => {
    const el = document.getElementById(prefix + id);
    if (!el) return;
    if (id === active) {
      el.style.cssText = 'background:var(--teal-lt);color:var(--teal-dk);border-color:var(--teal-md);font-weight:700';
    } else {
      el.style.cssText = '';
    }
  });
}

function setProdPreset(preset) {
  if (preset) {
    const [from, to] = _datePresetRange(preset);
    const df = document.getElementById('prod-date-from');
    const dt = document.getElementById('prod-date-to');
    if (df) df.value = from;
    if (dt) dt.value = to;
    _applyPresetBtns('prod-preset-btns', preset);
  }
  loadProductions();
}

function setLedgerPreset(preset) {
  if (preset) {
    const [from, to] = _datePresetRange(preset);
    const df = document.getElementById('ledger-date-from');
    const dt = document.getElementById('ledger-date-to');
    if (df) df.value = from;
    if (dt) dt.value = to;
    _applyPresetBtns('ledger-preset-btns', preset);
  }
  runLedger();
}

// ── 생산실적 초기화 (기본: 이번 달)
function initProductions() {
  const df = document.getElementById('prod-date-from');
  const dt = document.getElementById('prod-date-to');
  if (df && !df.value) {
    const [from, to] = _datePresetRange('month');
    df.value = from; dt.value = to;
    _applyPresetBtns('prod-preset-btns', 'month');
  }
  loadProductions();
}

// ── 생산실적 API 로드
async function loadProductions() {
  const df = document.getElementById('prod-date-from')?.value || '';
  const dt = document.getElementById('prod-date-to')?.value || '';
  const status = document.getElementById('prod-status-filter')?.value || '';
  let url = '/productions?limit=300';
  if (df) url += `&date_from=${df}`;
  if (dt) url += `&date_to=${dt}T23:59:59`;
  if (status) url += `&status=${status}`;
  const data = await apiFetch(url);
  if (!data) return;
  const tbody = document.getElementById('prod-list-tbody');
  if (!tbody) return;
  const statusMap = {completed:'<span class="bdg b-ok">완료</span>', running:'<span class="bdg b-run">진행중</span>', error:'<span class="bdg b-danger">오류</span>'};
  const methodMap = {device:'<span class="tag t-device">장비</span>', device_allocated:'<span class="tag t-device">장비배분</span>', manual:'<span class="tag t-manual">수동</span>', ocr:'<span class="tag t-ocr">OCR</span>'};
  tbody.innerHTML = data.length ? data.map(p => `
    <tr>
      <td><span class="lot">${p.lot_number}</span></td>
      <td style="font-weight:700">${p.product_name}</td>
      <td style="font-size:11px;color:var(--gray)">${p.device_name||'—'}</td>
      <td class="r" style="color:var(--teal);font-weight:700">${p.produced_quantity != null ? p.produced_quantity.toLocaleString() : '—'}</td>
      <td class="r" style="color:var(--red)">${p.defect_quantity != null ? p.defect_quantity : '—'}</td>
      <td class="r">${p.good_rate ? p.good_rate+'%' : '—'}</td>
      <td style="font-size:11px;color:var(--gray)">${p.start_time||'—'}</td>
      <td>${methodMap[p.input_method]||''}</td>
      <td>${statusMap[p.status]||''}</td>
      <td><button class="btn btn-ghost" style="padding:7px 14px;font-size:13px;white-space:nowrap" onclick="openEditProductionModal(${p.id})">수정</button></td>
    </tr>`).join('') : '<tr><td colspan="10" style="text-align:center;color:var(--gray-md);padding:24px">등록된 생산실적이 없습니다</td></tr>';
}

// ── 원료 재고 API 로드
async function loadStock() {
  const data = await apiFetch('/materials');
  if (!data) return;
  const tbody = document.getElementById('stock-tbody');
  if (!tbody) return;
  const statusBdg = {normal:'<span class="bdg b-ok">정상</span>', warn:'<span class="bdg b-warn">주의</span>', danger:'<span class="bdg b-danger">부족</span>'};
  let nDanger = 0, nWarn = 0;
  tbody.innerHTML = data.map(m => {
    const max = Math.max(m.safety_stock * 3, m.current_stock, 1);
    const pct = Math.min(100, m.current_stock / max * 100);
    const safeLeft = Math.min(95, m.safety_stock / max * 100);
    const barColor = m.status==='normal' ? 'var(--teal)' : m.status==='warn' ? '#EF9F27' : '#E24B4A';
    if (m.status==='danger') nDanger++;
    if (m.status==='warn') nWarn++;
    return `<tr>
      <td style="cursor:pointer" onclick="goApp('ledger')"><div style="font-weight:700">${m.name}</div><div style="font-size:10px;color:var(--gray)">${m.unit}</div></td>
      <td class="r" style="font-weight:700;${m.status==='danger'?'color:var(--red)':''}">${m.current_stock}</td>
      <td class="r" style="font-size:12px;color:var(--gray-md)">${m.safety_stock}</td>
      <td><div class="bar-wrap"><div class="bar-fill" style="width:${pct.toFixed(1)}%;background:${barColor}"></div><div class="bar-safe" style="left:${safeLeft.toFixed(1)}%"></div></div>
          <div style="font-size:10px;color:var(--gray-md)">안전 ${m.safety_stock}${m.unit}</div></td>
      <td>${statusBdg[m.status]||''}</td>
      <td><button class="btn btn-ghost" style="padding:7px 14px;font-size:13px;white-space:nowrap" onclick="openAdjustModal(${m.id},'${m.name.replace(/'/g,"\\'")}',${m.current_stock},'${m.unit}')">조정</button></td>
    </tr>`;
  }).join('');
  const el = id => document.getElementById(id);
  const t = el('stock-kpi-total'); if (t) t.textContent = data.length;
  const s = el('stock-kpi-status'); if (s) s.textContent = `정상 ${data.length-nDanger-nWarn} · 주의 ${nWarn} · 부족 ${nDanger}`;
  const d = el('stock-kpi-danger'); if (d) d.innerHTML = `${nDanger} <span class="ku">종</span>`;
  const w = el('stock-kpi-warn'); if (w) w.innerHTML = `${nWarn} <span class="ku">종</span>`;
  const ao = el('stock-as-of'); if (ao) ao.textContent = new Date().toLocaleString('ko-KR') + ' 기준';
}

// ── 레시피 API 로드
async function loadRecipes() {
  const data = await apiFetch('/recipes');
  if (!data) return;
  const container = document.getElementById('recipe-cards-container');
  if (!container) return;
  const statusBdg = s => s==='active' ? '<span class="bdg b-ok">활성</span>' : '<span class="bdg b-gray">초안</span>';
  const cards = data.map(r => `
    <div class="card" style="cursor:pointer" onmouseenter="this.style.borderColor='var(--teal)'" onmouseleave="this.style.borderColor='var(--gray-bd)'">
      <div style="padding:14px 16px 10px;border-bottom:1px solid var(--gray-lt)">
        <div style="display:flex;gap:6px;margin-bottom:8px">${statusBdg(r.status)}<span class="bdg b-purple">${r.category||''}</span><span class="bdg b-warn">${r.version}</span></div>
        <div style="font-size:15px;font-weight:700">${r.product_name}</div><div class="mono">${r.product_code}</div>
      </div>
      <div style="padding:12px 16px;display:flex;flex-direction:column;gap:6px">
        <div style="display:flex;justify-content:space-between;font-size:12px"><span style="color:var(--gray)">기준 생산량</span><span style="font-weight:700">${r.base_quantity} ${r.base_unit}</span></div>
        <div style="display:flex;justify-content:space-between;font-size:12px"><span style="color:var(--gray)">원료 종류</span><span style="font-weight:700">${r.ingredients.length} 종</span></div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">
          ${r.ingredients.slice(0,4).map(i=>`<span class="ing-chip">${i.material_name} ${i.quantity}${i.unit}</span>`).join('')}
          ${r.ingredients.length>4?`<span class="ing-chip">+${r.ingredients.length-4}종</span>`:''}
        </div>
      </div>
      <div style="padding:10px 16px;border-top:1px solid var(--gray-lt);display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:11px;color:var(--gray-md)">${r.version}</span>
        <button class="btn btn-outline btn-sm" onclick="openRecommendModal(${r.id},'${r.product_name}')">AI 추천</button>
      </div>
    </div>`);
  cards.push(`<div class="card" style="cursor:pointer;border-style:dashed;display:flex;align-items:center;justify-content:center;min-height:200px" onmouseenter="this.style.borderColor='var(--teal)'" onmouseleave="this.style.borderColor='var(--gray-bd)'"><div style="text-align:center;color:var(--gray-md)"><div style="font-size:28px;margin-bottom:8px">+</div><div style="font-size:13px">새 레시피 등록</div></div></div>`);
  container.innerHTML = cards.join('');
}

// ── 수불대장 초기화 (기본: 이번 달, 자동 조회)
function initLedger() {
  const df = document.getElementById('ledger-date-from');
  const dt = document.getElementById('ledger-date-to');
  if (df && dt && !df.value) {
    const [from, to] = _datePresetRange('month');
    df.value = from; dt.value = to;
    _applyPresetBtns('ledger-preset-btns', 'month');
  }
  runLedger();
}

async function runLedger() {
  const df = document.getElementById('ledger-date-from')?.value;
  const dt = document.getElementById('ledger-date-to')?.value;
  if (!df || !dt) { alert('조회 기간을 선택하세요.'); return; }
  const data = await apiFetch(`/ledger/all?date_from=${df}&date_to=${dt}`);
  if (!data) return;
  renderLedger(data);
}

function renderLedger(data) {
  const typeMap = {
    '입고': '<span class="bdg b-ok">입고</span>',
    '생산사용': '<span class="bdg b-purple">생산사용</span>',
    '재고조정': '<span class="bdg b-warn">조정</span>',
  };
  const tbody = document.getElementById('ledger-tbody');
  if (!tbody) return;
  tbody.innerHTML = data.entries.length ? data.entries.map(e => `
    <tr>
      <td style="color:var(--gray);font-size:12px">${e.date}</td>
      <td style="font-weight:600">${e.material_name}</td>
      <td style="font-size:12px;color:var(--gray-md)">${e.unit}</td>
      <td>${typeMap[e.type]||e.type}</td>
      <td style="font-size:12px;color:var(--gray)">${e.source||'—'}</td>
      <td class="r" style="color:var(--teal);font-weight:700">${e.in_qty>0?'+'+e.in_qty:'—'}</td>
      <td class="r" style="color:var(--purple);font-weight:700">${e.out_qty>0?'−'+e.out_qty:'—'}</td>
      <td class="r" style="font-weight:700">${e.balance}</td>
      <td style="font-size:12px;color:var(--gray)">${e.note||''}</td>
    </tr>`).join('') :
    '<tr><td colspan="9" style="text-align:center;padding:32px;color:var(--gray-md)">해당 기간 데이터가 없습니다</td></tr>';

  const inEl = document.getElementById('ledger-total-in');
  const outEl = document.getElementById('ledger-total-out');
  const cntEl = document.getElementById('ledger-count');
  if (inEl) inEl.innerHTML = `<span style="color:var(--teal);font-size:20px;font-weight:700">+${data.total_in}</span>`;
  if (outEl) outEl.innerHTML = `<span style="color:var(--purple);font-size:20px;font-weight:700">−${data.total_out}</span>`;
  if (cntEl) cntEl.innerHTML = `<span style="font-size:20px;font-weight:700">${data.entries.length}</span> <span class="ku">건</span>`;
}

// ── 재고현황에서 수불대장 열기
function loadLedger() {
  goApp('ledger');
}

// ── 수불대장 엑셀(CSV) 다운로드
function ledgerExcel() {
  const rows = document.querySelectorAll('#ledger-table tbody tr');
  if (!rows.length) { alert('먼저 조회하세요.'); return; }
  const header = ['날짜','원료명','단위','구분','입고처/출처','입고량','출고량','당일재고','비고'];
  const lines = [header.join(',')];
  rows.forEach(tr => {
    const cells = [...tr.querySelectorAll('td')].map(td => '"' + td.textContent.trim().replace(/"/g,'""') + '"');
    if (cells.length === 9) lines.push(cells.join(','));
  });
  const df = document.getElementById('ledger-date-from')?.value || '';
  const dt = document.getElementById('ledger-date-to')?.value || '';
  const blob = new Blob(['﻿' + lines.join('\n')], {type:'text/csv;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `원료수불대장_${df}_${dt}.csv`;
  a.click();
}

// ── 수불대장 PDF(인쇄)
function ledgerPrint() {
  const area = document.getElementById('ledger-print-area');
  if (!area) return;
  const df = document.getElementById('ledger-date-from')?.value || '';
  const dt = document.getElementById('ledger-date-to')?.value || '';
  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>원료수불대장</title>
    <style>body{font-family:sans-serif;font-size:12px}table{border-collapse:collapse;width:100%}
    th,td{border:1px solid #ccc;padding:4px 6px}th{background:#f5f5f5}
    .r{text-align:right}h2{font-size:15px}</style></head><body>
    <h2>원료수불대장 (${df} ~ ${dt})</h2>${area.innerHTML}</body></html>`);
  w.document.close();
  w.print();
}

// ── 재고 조정
function openAdjustModal(matId, matName, before, unit) {
  document.getElementById('adj-mat-name').textContent = matName;
  document.getElementById('adj-before').textContent = before + ' ' + unit;
  document.getElementById('adj-unit-label').textContent = '(' + unit + ')';
  document.getElementById('adj-actual').value = '';
  document.getElementById('adj-reason').value = '';
  document.getElementById('adj-note').value = '';
  document.getElementById('adj-diff-preview').textContent = '';
  document.getElementById('adjust-modal').dataset.matId = matId;
  document.getElementById('adjust-modal').dataset.before = before;
  document.getElementById('adjust-modal').classList.remove('hidden');
  document.getElementById('adj-actual').oninput = function() {
    const actual = parseFloat(this.value);
    if (!isNaN(actual)) {
      const diff = actual - before;
      const sign = diff >= 0 ? '+' : '';
      document.getElementById('adj-diff-preview').innerHTML =
        `차이: <strong style="color:${diff>=0?'var(--teal)':'var(--red)'}">${sign}${diff.toFixed(3)}</strong> ${unit}`;
    } else {
      document.getElementById('adj-diff-preview').textContent = '';
    }
  };
}

async function saveAdjust() {
  const modal = document.getElementById('adjust-modal');
  const matId = parseInt(modal.dataset.matId);
  const actual = parseFloat(document.getElementById('adj-actual').value);
  const reason = document.getElementById('adj-reason').value;
  const note = document.getElementById('adj-note').value;
  if (isNaN(actual)) { alert('실재고를 입력하세요.'); return; }
  if (!reason) { alert('조정 사유를 선택하세요.'); return; }
  const res = await apiFetch('/stock-adjustments', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({material_id: matId, actual_qty: actual, reason, note: note || null})
  });
  if (!res) return;
  modal.classList.add('hidden');
  alert(`재고 조정 완료\n조정전: ${res.before} → 조정후: ${res.after} (차이: ${res.diff>=0?'+':''}${res.diff})`);
  loadStock();
}

async function showAdjustHistory() {
  const modal = document.getElementById('adjust-history-modal');
  modal.classList.remove('hidden');
  const tbody = document.getElementById('adjust-history-tbody');
  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--gray-md)">로딩 중...</td></tr>';
  const data = await apiFetch('/stock-adjustments');
  if (!data) return;
  tbody.innerHTML = data.length ? data.map(a => `
    <tr>
      <td style="font-size:11px;color:var(--gray)">${a.adjusted_at || '—'}</td>
      <td style="font-weight:600">${a.material_name}</td>
      <td class="r">${a.before_qty}</td>
      <td class="r">${a.after_qty}</td>
      <td class="r" style="color:${a.diff_qty>=0?'var(--teal)':'var(--red)'}${a.diff_qty>=0?';':';'}font-weight:700">${a.diff_qty>=0?'+':''}${a.diff_qty}</td>
      <td><span class="bdg b-warn">${a.reason}</span></td>
      <td style="font-size:11px;color:var(--gray)">${a.note||''}</td>
    </tr>`).join('') :
    '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--gray-md)">조정 이력이 없습니다</td></tr>';
}

// ── 입고 등록 — ID가 HTML에 직접 있으므로 API 데이터로 옵션만 채움
async function populateReceiptForm() {
  const [materials, suppliers] = await Promise.all([apiFetch('/materials'), apiFetch('/suppliers')]);
  const matSel = document.getElementById('form-material-id');
  const supSel = document.getElementById('form-supplier-id');
  if (matSel && materials) {
    if (materials.length === 0) {
      matSel.innerHTML = '<option value="">-- 원재료를 먼저 등록하세요 --</option>';
      const warn = document.getElementById('receipt-no-material-warn');
      if (warn) warn.style.display = 'block';
    } else {
      matSel.innerHTML = '<option value="">-- 선택 --</option>' + materials.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
      const warn = document.getElementById('receipt-no-material-warn');
      if (warn) warn.style.display = 'none';
    }
  }
  if (supSel && suppliers)
    supSel.innerHTML = '<option value="">-- 선택 --</option>' + suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
  // 오늘 날짜 기본값
  const today = new Date().toISOString().split('T')[0];
  const ddEl = document.getElementById('form-delivery-date');
  if (ddEl && !ddEl.value) ddEl.value = today;
}

function setExpiry(days) {
  const d = new Date(); d.setDate(d.getDate() + days);
  const el = document.getElementById('form-expiry-date');
  if (el) el.value = d.toISOString().split('T')[0];
}

async function submitReceipt() {
  const material_id = document.getElementById('form-material-id')?.value;
  const supplier_id = document.getElementById('form-supplier-id')?.value;
  const quantity    = document.getElementById('form-quantity')?.value;
  const unit_price  = document.getElementById('form-unit-price')?.value;
  const delivery_date = document.getElementById('form-delivery-date')?.value;
  const expiry_date   = document.getElementById('form-expiry-date')?.value;
  const lot_number    = document.getElementById('form-lot-number')?.value;
  if (!material_id || !quantity) { alert('원료와 수량은 필수입니다.'); return; }

  // 재고 이전값 기록 (완료 화면에 표시용)
  const matSel = document.getElementById('form-material-id');
  const matName = matSel?.options[matSel?.selectedIndex]?.text || '';
  const unitSel = document.getElementById('form-unit');
  const unit = unitSel?.value || 'kg';

  const result = await apiFetch('/receipts', {
    method: 'POST',
    body: JSON.stringify({
      material_id: parseInt(material_id),
      supplier_id: supplier_id ? parseInt(supplier_id) : null,
      quantity: parseFloat(quantity),
      unit_price: unit_price ? parseFloat(unit_price) : null,
      delivery_date: delivery_date || null,
      expiry_date: expiry_date || null,
      lot_number: lot_number || null,
      input_method: 'manual',
    }),
  });
  if (!result) return;

  // 완료 화면에 실데이터 표시
  const detail = document.getElementById('receipt-done-detail');
  if (detail) {
    const supSel = document.getElementById('form-supplier-id');
    const supName = supSel?.options[supSel?.selectedIndex]?.text || '—';
    const rows = [
      ['품목', matName],
      ['수량', `${parseFloat(quantity).toLocaleString()} ${unit}`],
      ['공급업체', supName],
      ['납품일', delivery_date || '—'],
      ['유통기한', expiry_date || '—'],
      ['로트번호', lot_number || '—'],
    ];
    detail.innerHTML = rows.map(([k,v],i) =>
      `<div style="display:flex;justify-content:space-between;padding:7px 0;${i<rows.length-1?'border-bottom:1px solid var(--gray-lt)':''};font-size:13px"><span style="color:var(--gray)">${k}</span><span style="font-weight:600">${v}</span></div>`
    ).join('');
  }
  goApp('receipt-done');
}

// ── 생산실적 입력
async function submitProduction() {
  const editId    = document.getElementById('prod-edit-id')?.value;
  const product_id = document.getElementById('prod-product-id')?.value;
  const produced   = document.getElementById('prod-produced')?.value;
  const defect     = document.getElementById('prod-defect')?.value;
  const start_time = document.getElementById('prod-start')?.value;
  const end_time   = document.getElementById('prod-end')?.value;
  if (!product_id || !produced) { alert('제품과 생산량은 필수입니다.'); return; }
  const body = {
    finished_product_id: parseInt(product_id),
    produced_quantity: parseFloat(produced),
    defect_quantity: defect ? parseFloat(defect) : 0,
    start_time: start_time || null,
    end_time: end_time || null,
  };
  let result;
  if (editId) {
    result = await apiFetch(`/productions/${editId}`, { method: 'PATCH', body: JSON.stringify(body) });
  } else {
    result = await apiFetch('/productions', { method: 'POST', body: JSON.stringify({ ...body, input_method: 'manual' }) });
  }
  if (result) { closeProductionModal(); loadProductions(); loadStock(); }
}

// BOM 차감 예정 미리보기 (서버 재귀 전개)
let _bomPreviewTimer = null;
async function updateBOMPreviewQty() {
  const pid = document.getElementById('prod-product-id')?.value;
  const qty = parseFloat(document.getElementById('prod-produced')?.value) || 0;
  const previewEl = document.getElementById('prod-bom-preview');
  if (!previewEl) return;
  if (!pid || qty <= 0) { previewEl.innerHTML = ''; return; }
  clearTimeout(_bomPreviewTimer);
  _bomPreviewTimer = setTimeout(async () => {
    const items = await apiFetch(`/productions/bom-preview?product_id=${pid}&qty=${qty}`);
    if (!previewEl) return;
    if (!items || !items.length) {
      previewEl.innerHTML = `<div style="background:var(--amber-lt);border:1px solid var(--amber-md);border-radius:6px;padding:8px 12px;font-size:12px;color:var(--amber)">⚠ 이 제품에 BOM이 등록되어 있지 않습니다.</div>`;
      return;
    }
    const rows = items.map(b =>
      `<div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0;border-bottom:1px solid var(--gray-lt)">
        <span>${b.material_name}</span>
        <span style="color:var(--purple);font-weight:700">−${b.deduct_qty} ${b.unit}</span>
      </div>`
    ).join('');
    previewEl.innerHTML = `<div style="background:var(--teal-lt);border:1px solid var(--teal-md);border-radius:6px;padding:8px 12px;margin-bottom:6px">
      <div style="font-size:11px;font-weight:700;color:var(--teal-dk);margin-bottom:6px">원재료 차감 예정 (${items.length}종)</div>
      ${rows}
    </div>`;
  }, 400);
}

async function openEditProductionModal(prodId) {
  const prod = await apiFetch(`/productions/${prodId}`);
  if (!prod) return;
  await openProductionModal(prod.finished_product_id, prod.produced_quantity, null, prod.defect_quantity,
                            prod.start_time, prod.end_time, prodId);
}

// ── AI 추천 모달
async function openRecommendModal(recipeId, recipeName) {
  const today = new Date().toISOString().split('T')[0];
  const data = await apiFetch(`/productions/recommend?recipe_id=${recipeId}&date=${today}`);
  if (!data) return;
  let modal = document.getElementById('ai-recommend-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'ai-recommend-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:999;display:flex;align-items:center;justify-content:center';
    document.body.appendChild(modal);
  }
  const trendIcon  = {up:'▲', down:'▼', stable:'→'}[data.trend] || '';
  const trendColor = {up:'var(--teal)', down:'var(--red)', stable:'var(--gray)'}[data.trend] || 'var(--gray)';
  const trendLabel = {up:'상승', down:'하락', stable:'안정'}[data.trend] || '';
  modal.innerHTML = `
    <div style="background:#fff;border-radius:14px;padding:28px 32px;width:460px;max-width:95vw;box-shadow:0 8px 32px rgba(0,0,0,.15)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
        <div><div style="font-size:18px;font-weight:700">AI 생산실적 추천</div>
        <div style="font-size:12px;color:var(--gray);margin-top:2px">${recipeName} · ${data.target_date} (${data.day_of_week}요일)</div></div>
        <button onclick="document.getElementById('ai-recommend-modal').remove()" style="border:none;background:transparent;font-size:22px;cursor:pointer;color:var(--gray)">×</button>
      </div>
      ${data.recommended ? `
        <div style="background:var(--teal-lt);border:1px solid var(--teal-md);border-radius:10px;padding:16px 20px;margin-bottom:14px">
          <div style="font-size:12px;color:var(--gray);margin-bottom:12px">${data.message}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;text-align:center">
            <div><div style="font-size:11px;color:var(--gray);margin-bottom:4px">추천 생산량</div>
              <div style="font-size:22px;font-weight:700;color:var(--teal)">${(data.recommended_produced_quantity||0).toLocaleString()}</div>
              <div style="font-size:11px;color:var(--gray)">개</div></div>
            <div><div style="font-size:11px;color:var(--gray);margin-bottom:4px">추천 양품수</div>
              <div style="font-size:22px;font-weight:700;color:var(--teal-dk)">${(data.recommended_good_quantity||0).toLocaleString()}</div>
              <div style="font-size:11px;color:var(--gray)">개</div></div>
            <div><div style="font-size:11px;color:var(--gray);margin-bottom:4px">추천 양품률</div>
              <div style="font-size:22px;font-weight:700;color:var(--purple)">${data.recommended_good_rate}%</div></div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:var(--gray-lt);border-radius:8px;font-size:12px;margin-bottom:16px">
          <span style="color:${trendColor};font-weight:700;font-size:16px">${trendIcon}</span>
          <span>최근 7일 추이: <strong>${trendLabel}</strong> · 참고 <strong>${data.based_on_records}건</strong>${data.same_dow_records>0?' (동일 요일 '+data.same_dow_records+'건)':''}</span>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-primary" style="flex:1" onclick="applyRecommendation(${recipeId},${data.recommended_produced_quantity},${data.recommended_good_quantity},${data.recommended_defect_quantity})">이 값으로 입력하기</button>
          <button class="btn btn-ghost" onclick="document.getElementById('ai-recommend-modal').remove()">닫기</button>
        </div>` : `
        <div style="text-align:center;padding:20px;color:var(--gray)">${data.message}</div>
        <button class="btn btn-ghost btn-w" onclick="document.getElementById('ai-recommend-modal').remove()">닫기</button>`}
    </div>`;
}

function applyRecommendation(recipeId, qty, good, defect) {
  document.getElementById('ai-recommend-modal')?.remove();
  openProductionModal(recipeId, qty, null, defect);
}

async function openProductionModal(productId, qty, good, defect, startTime, endTime, editId) {
  const products = await apiFetch('/master/products?status=active');
  if (!products) return;
  let modal = document.getElementById('prod-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'prod-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:999;display:flex;align-items:center;justify-content:center';
    document.body.appendChild(modal);
  }
  const now = new Date().toISOString().slice(0,16);
  const isEdit = !!editId;
  modal.innerHTML = `
    <div style="background:#fff;border-radius:14px;padding:28px 32px;width:480px;max-width:95vw;box-shadow:0 8px 32px rgba(0,0,0,.15)">
      <input type="hidden" id="prod-edit-id" value="${editId||''}"/>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
        <div><div style="font-size:18px;font-weight:700">${isEdit ? '생산실적 수정' : '생산실적 입력'}</div>
        <div style="font-size:12px;color:var(--gray);margin-top:2px">BOM에 등록된 원재료가 자동 차감됩니다${isEdit ? ' (기존 차감 취소 후 재적용)' : ''}</div></div>
        <button onclick="closeProductionModal()" style="border:none;background:transparent;font-size:22px;cursor:pointer;color:var(--gray)">×</button>
      </div>
      <div class="fl"><div class="fl-lbl">제품 <span class="req">*</span></div>
        <select id="prod-product-id" class="finput" onchange="updateBOMPreviewQty()">
          <option value="">제품 선택</option>
          ${products.map(p=>`<option value="${p.id}"${p.id==productId?' selected':''}>${p.name} (${p.unit})</option>`).join('')}
        </select>
      </div>
      <div id="prod-bom-preview" style="margin-bottom:8px"></div>
      <div class="frow">
        <div class="fl"><div class="fl-lbl">생산량 <span class="req">*</span></div><input id="prod-produced" class="finput" type="number" value="${qty||''}" placeholder="0" oninput="updateBOMPreviewQty()"/></div>
        <div class="fl"><div class="fl-lbl">불량수</div><input id="prod-defect" class="finput" type="number" value="${defect!=null?defect:0}" placeholder="0"/></div>
      </div>
      <div class="frow">
        <div class="fl"><div class="fl-lbl">시작 시간</div><input id="prod-start" class="finput" type="datetime-local" value="${startTime||now}"/></div>
        <div class="fl"><div class="fl-lbl">종료 시간</div><input id="prod-end" class="finput" type="datetime-local" value="${endTime||now}"/></div>
      </div>
      <div style="display:flex;gap:8px;margin-top:12px">
        <button class="btn btn-primary" style="flex:1" onclick="submitProduction()">${isEdit ? '수정 저장' : '저장 (원재료 차감)'}</button>
        <button class="btn btn-ghost" onclick="closeProductionModal()">취소</button>
      </div>
    </div>`;

  if (productId && qty) setTimeout(() => updateBOMPreviewQty(), 50);
}

function closeProductionModal() { document.getElementById('prod-modal')?.remove(); }

function addProductionButton() {
  const actions = document.querySelector('#app-production .page-actions');
  if (actions && !document.getElementById('btn-add-prod')) {
    const btn = document.createElement('button');
    btn.id = 'btn-add-prod';
    btn.className = 'btn btn-primary btn-sm';
    btn.textContent = '+ 생산실적 입력';
    btn.onclick = () => openProductionModal(null, null, null, null);
    actions.appendChild(btn);
  }
}

// ══════════════════════════════════════════════
// OCR 거래명세서 자동 분석
// ══════════════════════════════════════════════
let _ocrResult   = null;
let _ocrPartners = [];
let _ocrMaterials= [];

function handleOCRFileSelect(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('ocr-preview-img').src = e.target.result;
    document.getElementById('ocr-drop-area').style.display = 'none';
    document.getElementById('ocr-preview-wrap').style.display = 'block';
  };
  reader.readAsDataURL(file);
}

async function analyzeOCRReceipt() {
  const fileInput = document.getElementById('ocr-file-input');
  if (!fileInput?.files[0]) return;

  const btn = document.getElementById('ocr-analyze-btn');
  const previewWrap = document.getElementById('ocr-preview-wrap');
  const loading = document.getElementById('ocr-loading');
  btn.disabled = true;
  previewWrap.style.display = 'none';
  loading.style.display = 'block';

  const formData = new FormData();
  formData.append('image', fileInput.files[0]);

  try {
    const [ocrRes, partners, materials] = await Promise.all([
      fetch(`${API}/ocr/receipt`, {method:'POST', body:formData, headers:{'X-Token': localStorage.getItem('foodly_token')||''}})
        .then(r => r.ok ? r.json() : r.text().then(t => { throw new Error(t) })),
      apiFetch('/master/partners?status=active'),
      apiFetch('/master/materials?status=active'),
    ]);
    _ocrResult    = ocrRes;
    _ocrPartners  = (partners||[]).filter(p => p.partner_type==='supplier' || p.partner_type==='both' || p.partner_type==='other');
    _ocrMaterials = materials || [];
    renderOCRReview();
    goApp('receipt-ocr');
  } catch(e) {
    previewWrap.style.display = 'block';
    alert('OCR 분석 실패:\n' + e.message);
  } finally {
    btn.disabled = false;
    loading.style.display = 'none';
  }
}

async function refreshOCRDropdowns() {
  const [partners, materials] = await Promise.all([
    apiFetch('/master/partners?status=active'),
    apiFetch('/master/materials?status=active'),
  ]);
  _ocrPartners  = (partners||[]).filter(p => p.partner_type==='supplier' || p.partner_type==='both' || p.partner_type==='other');
  _ocrMaterials = materials || [];
  renderOCRReview();
}

function renderOCRReview() {
  const data = _ocrResult;
  const el = document.getElementById('ocr-review-body');
  if (!el || !data) return;

  // 공급업체 드롭다운
  const suppOpts = `<option value="">-- 선택 --</option>` +
    _ocrPartners.map(p => `<option value="${p.id}"${p.id===data.matched_supplier_id?' selected':''}>${p.name}</option>`).join('');

  const supplierHtml = `
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
      ${data.supplier_name ? `<span style="font-size:12px;color:var(--gray);background:var(--gray-lt);padding:3px 8px;border-radius:4px">추출: ${data.supplier_name}</span>` : ''}
      ${data.matched_supplier_id ? `<span style="font-size:11px;font-weight:700;padding:3px 8px;background:var(--teal-lt);color:#085041;border-radius:4px">자동매핑</span>` : `<span class="bdg b-danger">미매핑</span>`}
    </div>
    <div style="display:flex;gap:8px;margin-top:6px">
      <select id="ocr-supplier-id" class="finput" style="flex:1">
        ${suppOpts}
      </select>
      <button class="btn btn-outline" style="padding:7px 14px;font-size:13px;white-space:nowrap" onclick="openMasterModal('partner',null)">+ 거래처 등록</button>
    </div>`;

  // 미매핑 개수 계산
  const unmatchedItems = data.items.filter(i => !i.matched_material_id);

  // 배너
  const banner = document.getElementById('ocr-unmatch-banner');
  if (banner) {
    const msgs = [];
    if (!data.matched_supplier_id) msgs.push('공급업체 미매핑');
    if (unmatchedItems.length) msgs.push(`원재료 ${unmatchedItems.length}건 미매핑`);
    banner.style.display = msgs.length ? 'flex' : 'none';
    banner.innerHTML = msgs.length ? `⚠ ${msgs.join(' · ')} — 드롭다운에서 선택하거나 새로 등록하세요` : '';
  }

  // 품목 목록
  const itemsHtml = data.items.map((item, i) => {
    const matOpts = `<option value="">-- 선택 --</option>` +
      _ocrMaterials.map(m => `<option value="${m.id}"${m.id===item.matched_material_id?' selected':''}>${m.name} (${m.unit})</option>`).join('');
    const matched = !!item.matched_material_id;
    return `
      <div style="border:1px solid ${matched?'var(--gray-bd)':'var(--red-md)'};border-radius:10px;padding:16px;margin-bottom:12px;background:${matched?'#fff':'#fff8f8'}">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap">
          <span style="font-size:14px;font-weight:700">항목 ${i+1}</span>
          <span style="font-size:12px;color:var(--gray);background:var(--gray-lt);padding:3px 8px;border-radius:4px">추출: ${item.extracted_name||'—'}</span>
          ${matched ? `<span style="font-size:11px;font-weight:700;padding:3px 8px;background:var(--teal-lt);color:#085041;border-radius:4px">자동매핑</span>` : `<span class="bdg b-danger">미매핑</span>`}
        </div>
        <div style="display:flex;gap:8px;margin-bottom:12px">
          <select id="ocr-mat-${i}" class="finput" style="flex:1">${matOpts}</select>
          <button class="btn btn-outline" style="padding:7px 14px;font-size:13px;white-space:nowrap" onclick="openMasterModal('material',null)">+ 원재료 등록</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
          <div>
            <div style="font-size:11px;color:var(--gray);margin-bottom:3px">수량 <span style="color:var(--red)">*</span></div>
            <input class="finput" id="ocr-qty-${i}" type="number" value="${item.quantity||''}" placeholder="0"/>
          </div>
          <div>
            <div style="font-size:11px;color:var(--gray);margin-bottom:3px">단위</div>
            <input class="finput" id="ocr-unit-${i}" value="${item.unit||item.matched_unit||'kg'}"/>
          </div>
          <div>
            <div style="font-size:11px;color:var(--gray);margin-bottom:3px">단가(원)</div>
            <input class="finput" id="ocr-price-${i}" type="number" value="${item.unit_price||''}" placeholder="선택"/>
          </div>
          <div>
            <div style="font-size:11px;color:var(--gray);margin-bottom:3px">납품일</div>
            <input class="finput" id="ocr-date-${i}" type="date" value="${item.delivery_date||data.delivery_date||''}"/>
          </div>
          <div>
            <div style="font-size:11px;color:var(--gray);margin-bottom:3px">유통기한</div>
            <input class="finput" id="ocr-expiry-${i}" type="date" value="${item.expiry_date||''}"/>
          </div>
          <div>
            <div style="font-size:11px;color:var(--gray);margin-bottom:3px">로트번호</div>
            <input class="finput" id="ocr-lot-${i}" value="${item.lot_number||''}" placeholder="직접 입력"/>
          </div>
        </div>
      </div>`;
  }).join('');

  el.innerHTML = `
    <div style="margin-bottom:20px">
      <div style="font-size:12px;font-weight:700;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">공급업체</div>
      ${supplierHtml}
    </div>
    <div style="margin-bottom:20px">
      <div style="font-size:12px;font-weight:700;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">납품일자</div>
      <input class="finput" id="ocr-delivery-date" type="date" value="${data.delivery_date||''}" style="max-width:200px"/>
    </div>
    <div style="font-size:12px;font-weight:700;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">품목 목록 (${data.items.length}건)</div>
    ${itemsHtml}`;
}

async function confirmOCRReceipt() {
  const data = _ocrResult;
  if (!data) return;

  const btn = document.getElementById('ocr-confirm-btn');
  btn.disabled = true; btn.textContent = '저장 중...';

  const supplierId = parseInt(document.getElementById('ocr-supplier-id')?.value) || null;
  const globalDate  = document.getElementById('ocr-delivery-date')?.value || '';

  let successCount = 0;
  const errors = [];

  for (let i = 0; i < data.items.length; i++) {
    const matId = parseInt(document.getElementById(`ocr-mat-${i}`)?.value) || 0;
    const qty   = parseFloat(document.getElementById(`ocr-qty-${i}`)?.value) || 0;
    if (!matId) { errors.push(`항목 ${i+1}: 원재료 선택 필요`); continue; }
    if (!qty)   { errors.push(`항목 ${i+1}: 수량 입력 필요`); continue; }

    const body = {
      material_id:   matId,
      supplier_id:   supplierId,
      quantity:      qty,
      unit_price:    parseFloat(document.getElementById(`ocr-price-${i}`)?.value) || null,
      delivery_date: document.getElementById(`ocr-date-${i}`)?.value || globalDate || null,
      expiry_date:   document.getElementById(`ocr-expiry-${i}`)?.value || null,
      lot_number:    document.getElementById(`ocr-lot-${i}`)?.value || null,
      input_method:  'ocr',
    };
    const res = await apiFetch('/receipts', {method:'POST', body:JSON.stringify(body)});
    if (res) successCount++;
    else errors.push(`항목 ${i+1}: 저장 실패`);
  }

  btn.disabled = false; btn.textContent = '입고 확정 →';

  if (!successCount && errors.length) {
    alert('저장 오류:\n' + errors.join('\n')); return;
  }

  document.getElementById('receipt-done-detail').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:6px;font-size:14px">
      <div><span style="color:var(--teal);font-weight:700">${successCount}건</span> 입고 완료 (OCR 자동 입력)</div>
      ${errors.length ? `<div style="color:var(--red);font-size:12px">${errors.join('<br/>')}</div>` : ''}
    </div>`;
  goApp('receipt-done');
}

// ── goApp 후크
const _origGoApp = goApp;
window.goApp = function(page) {
  _origGoApp(page);
  if (page === 'production')        { initProductions(); addProductionButton(); loadDeviceProdToday(); }
  else if (page === 'stock')        loadStock();
  else if (page === 'recipe')       loadRecipes();
  else if (page === 'receipt')      loadRecentReceipts();
  else if (page === 'receipt-manual') populateReceiptForm();
  else if (page === 'receipt-upload') {
    document.getElementById('ocr-drop-area').style.display = 'block';
    document.getElementById('ocr-preview-wrap').style.display = 'none';
    document.getElementById('ocr-loading').style.display = 'none';
    const fi = document.getElementById('ocr-file-input');
    if (fi) fi.value = '';
    _ocrResult = null;
  }
  else if (page === 'mat-master')   loadMaterMaster();
  else if (page === 'semi-master')  loadSemiMaster();
  else if (page === 'prod-master')  loadProductMaster();
  else if (page === 'partner-master') loadPartnerMaster();
  else if (page === 'process-master') loadProcessMaster();
  else if (page === 'plan')         initPlanView();
  else if (page === 'ledger')       initLedger();
  else if (page === 'device')       loadDevices();
};

// ══════════════════════════════════════════════════════
// 원료 입고 최근 이력
// ══════════════════════════════════════════════════════
async function loadRecentReceipts() {
  const tbody = document.getElementById('receipt-history-tbody');
  if (!tbody) return;
  const data = await apiFetch('/receipts?limit=10');
  if (!data) return;
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--gray-md)">입고 이력이 없습니다</td></tr>`;
    return;
  }
  const methodTag = m => m === 'ocr'
    ? '<span class="tag t-ocr">OCR</span>'
    : '<span class="tag t-manual">수동</span>';
  tbody.innerHTML = data.map(r => `
    <tr>
      <td><div style="font-weight:700">${r.material_name}</div><div class="mono">${r.supplier_name||'—'}</div></td>
      <td><span class="lot">${r.lot_number||'—'}</span></td>
      <td class="r" style="font-weight:700">${r.quantity} ${r.unit}</td>
      <td class="r" style="color:var(--gray)">${r.delivery_date ? r.delivery_date.slice(5) : '—'}</td>
      <td>${methodTag(r.input_method)}</td>
      <td><span class="bdg b-ok">완료</span></td>
      <td><button class="btn btn-danger" style="padding:4px 10px;font-size:12px" onclick="deleteReceiptRow(${r.id},this)">삭제</button></td>
    </tr>`).join('');
}

async function deleteReceiptRow(id, btn) {
  if (!confirm('이 입고 내역을 삭제하시겠습니까?\n(재고에서 해당 수량이 차감됩니다)')) return;
  btn.disabled = true;
  const res = await apiFetch(`/receipts/${id}`, {method:'DELETE'});
  if (res) loadRecentReceipts();
  else btn.disabled = false;
}


// ══════════════════════════════════════════════════════
// 장비 관리
// ══════════════════════════════════════════════════════
let _devicePeriod = 'day';
let _statsDeviceId = null;
let _statsDeviceName = '';

async function loadDevices() {
  const devices = await apiFetch(`/devices?period=${_devicePeriod}`);
  if (!devices) return;

  const total   = devices.length;
  const running = devices.filter(d => d.status === 'running').length;
  const errored = devices.filter(d => d.status === 'error').length;
  const totalQty = devices.reduce((a, d) => a + d.period_quantity, 0);
  const periodLabel = {day:'오늘', week:'이번 주', month:'이번 달'}[_devicePeriod];

  const kpiEl = document.getElementById('device-kpi');
  if (kpiEl) kpiEl.innerHTML = `
    <div class="kpi"><div class="kl">등록 장비</div><div class="kv">${total} <span class="ku">대</span></div><div class="ks">가동 ${running} · 오류 ${errored}</div></div>
    <div class="kpi good"><div class="kl">가동 중</div><div class="kv">${running} <span class="ku">대</span></div></div>
    <div class="kpi"><div class="kl">${periodLabel} 총 생산량</div><div class="kv">${totalQty.toLocaleString()} <span class="ku">개</span></div></div>
    ${errored ? `<div class="kpi danger"><div class="kl">오류 장비</div><div class="kv" style="color:var(--red)">${errored} <span class="ku">대</span></div></div>` : ''}`;

  const colLabel = document.getElementById('dev-col-qty-label');
  if (colLabel) colLabel.textContent = `생산량 (${periodLabel})`;

  const tbody = document.getElementById('device-tbody');
  if (!tbody) return;
  if (!devices.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--gray-md)">등록된 장비가 없습니다. + 장비 등록을 눌러 추가하세요.</td></tr>`;
    return;
  }
  const devStatusBdg = s => {
    if (s === 'running') return '<span class="bdg b-run">가동 중</span>';
    if (s === 'error')   return '<span class="bdg b-danger">오류</span>';
    return '<span class="bdg b-gray">대기</span>';
  };
  tbody.innerHTML = devices.map(d => {
    const collectOn = d.collect_production;
    const collectBtn = collectOn
      ? `<button class="btn btn-sm" onclick="toggleDeviceCollect(${d.id},false)" style="padding:4px 10px;font-size:12px;background:var(--teal);color:#fff;border:none;border-radius:20px;white-space:nowrap">● 수집 중</button>`
      : `<button class="btn btn-sm" onclick="toggleDeviceCollect(${d.id},true)"  style="padding:4px 10px;font-size:12px;background:var(--gray-lt);color:var(--gray);border:1px solid var(--gray-bd);border-radius:20px;white-space:nowrap">○ 수집 안함</button>`;
    return `
    <tr>
      <td><div style="font-weight:700">${d.name}</div><div class="mono" style="font-size:11px">${d.device_code}</div></td>
      <td>${d.process_name || '—'}</td>
      <td style="text-align:center">${collectBtn}</td>
      <td class="r" style="font-weight:700">${d.period_quantity.toLocaleString()}</td>
      <td class="r">${d.period_hours}h</td>
      <td>${devStatusBdg(d.status)}</td>
      <td style="font-size:12px;color:var(--gray)">${d.last_received_at||'—'}</td>
      <td><div style="display:flex;gap:5px;white-space:nowrap;padding-right:12px">
        <button class="btn btn-ghost" style="padding:7px 14px;font-size:13px" onclick="openDeviceModal(${d.id})">수정</button>
        <button class="btn btn-outline" style="padding:7px 14px;font-size:13px;color:var(--purple);border-color:var(--purple)" onclick="openDeviceStatsModal(${d.id},'${d.name.replace(/'/g,"\\'")}')">통계</button>
        <button class="btn btn-outline" style="padding:7px 14px;font-size:13px;color:var(--teal);border-color:var(--teal)" onclick="openMaintenanceModal(${d.id},'${d.name.replace(/'/g,"\\'")}')">정비일지</button>
        <button class="btn btn-danger" style="padding:7px 14px;font-size:13px" onclick="deleteDevice(${d.id})">삭제</button>
      </div></td>
    </tr>`;
  }).join('');
}

function setDevicePeriod(period) {
  _devicePeriod = period;
  ['day','week','month'].forEach(p => {
    const btn = document.getElementById(`dev-btn-${p}`);
    if (!btn) return;
    if (p === period) {
      btn.className = 'btn btn-primary btn-sm';
      btn.style.cssText = 'padding:4px 14px;font-size:12px';
    } else {
      btn.className = 'btn btn-sm';
      btn.style.cssText = 'padding:4px 14px;font-size:12px;border:none;background:transparent';
    }
  });
  loadDevices();
}

async function openDeviceModal(deviceId) {
  const processes = await apiFetch('/master/processes?status=active');
  let device = null;
  if (deviceId) device = await apiFetch(`/devices/${deviceId}`);

  let modal = document.getElementById('device-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'device-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:999;display:flex;align-items:center;justify-content:center';
    document.body.appendChild(modal);
  }

  const processOpts = `<option value="">-- 선택 안함 --</option>` +
    (processes||[]).map(p => `<option value="${p.id}"${device?.process_id===p.id?' selected':''}>${p.name}</option>`).join('');

  const photoThumb = device?.photo_data
    ? `<img id="device-photo-preview" src="${device.photo_data}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;border:1px solid var(--gray-bd)"/>`
    : `<div id="device-photo-preview" style="width:60px;height:60px;border-radius:8px;border:1px dashed var(--gray-bd);display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--gray-md)">없음</div>`;

  modal.innerHTML = `
    <div style="background:#fff;border-radius:14px;padding:28px 32px;width:500px;max-width:95vw;max-height:90vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,.15)">
      <input type="hidden" id="device-edit-id" value="${deviceId||''}"/>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
        <div style="font-size:18px;font-weight:700">${deviceId ? '장비 수정' : '장비 등록'}</div>
        <button onclick="document.getElementById('device-modal').remove()" style="border:none;background:transparent;font-size:22px;cursor:pointer;color:var(--gray)">×</button>
      </div>
      <div class="fl"><div class="fl-lbl">장비명 <span class="req">*</span></div>
        <input id="device-name" class="finput" placeholder="예: 출하라인 1호기" value="${device?.name||''}"/>
      </div>
      <div class="fl" style="margin-top:10px"><div class="fl-lbl">공정</div>
        <select id="device-process-id" class="finput">${processOpts}</select>
      </div>
      <div class="fl" style="margin-top:10px"><div class="fl-lbl">사진</div>
        <input type="file" id="device-photo-input" accept="image/*" style="display:none" onchange="handleDevicePhotoSelect(this)"/>
        <div style="display:flex;align-items:center;gap:10px">
          ${photoThumb}
          <button class="btn btn-ghost btn-sm" onclick="document.getElementById('device-photo-input').click()">사진 선택</button>
        </div>
        <input type="hidden" id="device-photo-data" value="${device?.photo_data||''}"/>
      </div>
      <div class="fl" style="margin-top:10px"><div class="fl-lbl">정비일지</div>
        <textarea id="device-maintenance" class="finput" rows="4" placeholder="정비 내역, 점검 날짜 등을 자유롭게 입력하세요" style="resize:vertical">${device?.maintenance_notes||''}</textarea>
      </div>
      <div style="display:flex;gap:8px;margin-top:16px">
        <button class="btn btn-primary" style="flex:1" onclick="saveDevice()">저장</button>
        <button class="btn btn-ghost" onclick="document.getElementById('device-modal').remove()">취소</button>
      </div>
    </div>`;
}

function handleDevicePhotoSelect(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const dataUrl = e.target.result;
    document.getElementById('device-photo-data').value = dataUrl;
    const prev = document.getElementById('device-photo-preview');
    if (prev) prev.outerHTML = `<img id="device-photo-preview" src="${dataUrl}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;border:1px solid var(--gray-bd)"/>`;
  };
  reader.readAsDataURL(file);
}

async function saveDevice() {
  const id   = document.getElementById('device-edit-id')?.value;
  const name = document.getElementById('device-name')?.value?.trim();
  if (!name) { alert('장비명은 필수 입력 항목입니다.'); return; }
  const body = {
    name,
    process_id:        parseInt(document.getElementById('device-process-id')?.value) || null,
    photo_data:        document.getElementById('device-photo-data')?.value || null,
    maintenance_notes: document.getElementById('device-maintenance')?.value || null,
  };
  const res = await apiFetch(id ? `/devices/${id}` : '/devices',
    {method: id ? 'PUT' : 'POST', body: JSON.stringify(body)});
  if (!res) return;
  document.getElementById('device-modal')?.remove();
  loadDevices();
}

async function deleteDevice(id) {
  if (!confirm('장비를 삭제하시겠습니까?\n관련 생산실적은 유지됩니다.')) return;
  const res = await apiFetch(`/devices/${id}`, {method:'DELETE'});
  if (res) loadDevices();
}

async function openMaintenanceModal(deviceId, deviceName) {
  const device = await apiFetch(`/devices/${deviceId}`);
  if (!device) return;
  let modal = document.getElementById('maintenance-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'maintenance-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:999;display:flex;align-items:center;justify-content:center';
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <div style="background:#fff;border-radius:14px;padding:28px 32px;width:520px;max-width:95vw;box-shadow:0 8px 32px rgba(0,0,0,.15)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <div style="font-size:18px;font-weight:700">정비일지 — ${deviceName}</div>
        <button onclick="document.getElementById('maintenance-modal').remove()" style="border:none;background:transparent;font-size:22px;cursor:pointer;color:var(--gray)">×</button>
      </div>
      <div style="font-size:12px;color:var(--gray);margin-bottom:8px">날짜와 내용을 자유롭게 입력하세요</div>
      <textarea id="maintenance-notes-text" class="finput" rows="12" style="resize:vertical;font-family:var(--mono);font-size:12px;line-height:1.7">${device.maintenance_notes||''}</textarea>
      <div style="display:flex;gap:8px;margin-top:12px">
        <button class="btn btn-primary" style="flex:1" onclick="saveMaintenanceNotes(${deviceId})">저장</button>
        <button class="btn btn-ghost" onclick="document.getElementById('maintenance-modal').remove()">닫기</button>
      </div>
    </div>`;
}

async function saveMaintenanceNotes(deviceId) {
  const notes = document.getElementById('maintenance-notes-text')?.value || '';
  const res = await apiFetch(`/devices/${deviceId}`, {method:'PUT', body:JSON.stringify({maintenance_notes:notes})});
  if (res) document.getElementById('maintenance-modal')?.remove();
}

async function openDeviceStatsModal(deviceId, deviceName) {
  _statsDeviceId  = deviceId;
  _statsDeviceName = deviceName;
  await renderDeviceStats(_devicePeriod);
}

async function toggleDeviceCollect(deviceId, val) {
  await apiFetch(`/devices/${deviceId}`, {method:'PUT', body:JSON.stringify({collect_production: val})});
  loadDevices();
}


// ══════════════════════════════════════════════════════
// 장비 수집 생산량 — 제품 배분
// ══════════════════════════════════════════════════════
let _devAllocCache = {};
let _allocRowIdx = 0;

async function loadDeviceProdToday() {
  const card = document.getElementById('device-prod-card');
  const list = document.getElementById('device-prod-list');
  if (!list) return;

  const data = await apiFetch('/device-productions/today');
  if (!data) return;

  _devAllocCache = {};
  data.forEach(d => { _devAllocCache[d.device_id] = d; });

  if (!data.length) {
    if (card) card.style.display = 'none';
    return;
  }
  if (card) card.style.display = '';

  list.innerHTML = data.map(d => {
    const alloc = d.is_allocated
      ? d.allocations.map(a => `<span style="background:var(--teal-lt);color:var(--teal-dk);padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700">${a.product_name} ${(a.quantity||0).toLocaleString()}개</span>`).join(' ')
      : `<span style="color:var(--amber)">미배분</span>`;
    return `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--gray-lt);flex-wrap:wrap;gap:8px">
        <div>
          <div style="font-weight:700;font-size:14px">${d.device_name}</div>
          <div style="font-size:12px;margin-top:4px;display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            <span style="color:var(--gray)">수집량: <strong>${d.collected_qty.toLocaleString()}개</strong></span>
            ${alloc}
          </div>
        </div>
        <button class="btn ${d.is_allocated ? 'btn-outline' : 'btn-primary'} btn-sm"
          onclick="openDeviceAllocModal(${d.device_id})"
        >${d.is_allocated ? '배분 수정' : '제품 배분 →'}</button>
      </div>`;
  }).join('');
}

async function openDeviceAllocModal(deviceId) {
  const d = _devAllocCache[deviceId];
  if (!d) return;

  const products = await apiFetch('/master/products?status=active');
  if (!products) return;

  _allocRowIdx = 0;
  window._allocProductOpts = `<option value="">기타</option>` +
    products.map(p => `<option value="${p.id}">${p.name} (${p.unit})</option>`).join('');

  let modal = document.getElementById('device-alloc-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'device-alloc-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:999;display:flex;align-items:center;justify-content:center;padding:16px';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div style="background:#fff;border-radius:14px;padding:28px 32px;width:580px;max-width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,.15)">
      <input type="hidden" id="alloc-device-id" value="${deviceId}"/>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <div>
          <div style="font-size:18px;font-weight:700">제품 배분 — ${d.device_name}</div>
          <div style="font-size:12px;color:var(--gray);margin-top:2px">장비 수집 총량을 제품별로 배분하여 생산실적에 등록합니다</div>
        </div>
        <button onclick="document.getElementById('device-alloc-modal').remove()" style="border:none;background:transparent;font-size:22px;cursor:pointer;color:var(--gray)">×</button>
      </div>

      <div style="background:var(--teal-lt);border:1px solid var(--teal-md);border-radius:8px;padding:12px 16px;margin-bottom:16px">
        <div style="font-size:11px;color:var(--gray);margin-bottom:6px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">오늘 수집 총량 (수정 가능)</div>
        <div style="display:flex;align-items:center;gap:8px">
          <input id="alloc-total-qty" class="finput" type="number" value="${d.collected_qty}" min="0" style="width:110px;font-size:20px;font-weight:700;text-align:right" oninput="updateAllocSum()"/>
          <span style="font-size:14px;color:var(--dark);font-weight:600">개</span>
          ${d.collected_qty > 0 ? `<span style="font-size:11px;color:var(--gray-md)">장비 수신값: ${d.collected_qty}개</span>` : '<span style="font-size:11px;color:var(--gray-md)">직접 입력</span>'}
        </div>
      </div>

      <div style="font-size:12px;font-weight:700;color:var(--gray);margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">제품별 배분</div>
      <div id="alloc-rows-wrap"></div>
      <button class="btn btn-ghost btn-sm" onclick="addAllocRow(null,null,null)" style="width:100%;margin-bottom:14px;border-style:dashed">+ 제품 추가</button>

      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:var(--gray-lt);border-radius:8px;margin-bottom:14px">
        <span style="font-size:13px;color:var(--gray)">배분 합계</span>
        <span id="alloc-sum-display" style="font-size:15px;font-weight:700">0 / 0개</span>
      </div>

      ${d.is_allocated ? `<div class="alert alert-warn" style="margin-bottom:12px;font-size:12px">⚠ 이미 등록된 배분 내역이 있습니다. 저장 시 기존 내역이 교체됩니다.</div>` : ''}

      <div style="display:flex;gap:8px">
        <button class="btn btn-primary" style="flex:1" onclick="saveDeviceAlloc()">저장 (생산실적 등록)</button>
        <button class="btn btn-ghost" onclick="document.getElementById('device-alloc-modal').remove()">취소</button>
      </div>
    </div>`;

  // 기존 배분 또는 빈 행
  const allocWrap = document.getElementById('alloc-rows-wrap');
  if (d.allocations.length > 0) {
    d.allocations.forEach(a => addAllocRow(a.product_id, a.quantity, a.product_id ? null : '기타'));
  } else {
    addAllocRow(null, null, null);
  }
  updateAllocSum();
}

function addAllocRow(productId, qty, note) {
  const wrap = document.getElementById('alloc-rows-wrap');
  if (!wrap) return;
  const idx = ++_allocRowIdx;
  const row = document.createElement('div');
  row.id = `alloc-row-${idx}`;
  row.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;align-items:center';
  row.innerHTML = `
    <select id="alloc-pid-${idx}" class="finput" style="flex:3" onchange="updateAllocSum()">
      ${window._allocProductOpts || ''}
    </select>
    <input id="alloc-qty-${idx}" class="finput" type="number" min="0" placeholder="0" value="${qty != null ? qty : ''}"
      style="width:80px;text-align:right" oninput="updateAllocSum()"/>
    <span style="font-size:12px;color:var(--gray);white-space:nowrap">개</span>
    <button onclick="document.getElementById('alloc-row-${idx}').remove();updateAllocSum()" style="border:none;background:transparent;font-size:18px;cursor:pointer;color:var(--gray);padding:0 4px">×</button>`;
  wrap.appendChild(row);
  if (productId) {
    const sel = document.getElementById(`alloc-pid-${idx}`);
    if (sel) sel.value = String(productId);
  }
}

function updateAllocSum() {
  const total = parseFloat(document.getElementById('alloc-total-qty')?.value) || 0;
  let sum = 0;
  document.querySelectorAll('[id^="alloc-qty-"]').forEach(inp => {
    sum += parseFloat(inp.value) || 0;
  });
  const display = document.getElementById('alloc-sum-display');
  if (!display) return;
  const diff = total - sum;
  let color = Math.abs(diff) < 0.001 ? 'var(--teal)' : diff > 0 ? 'var(--amber)' : 'var(--red)';
  let extra = diff > 0.001 ? ` <span style="font-size:11px;color:var(--amber)">(미배분 ${diff}개)</span>`
    : diff < -0.001 ? ` <span style="font-size:11px;color:var(--red)">(초과 ${Math.abs(diff)}개)</span>` : '';
  display.innerHTML = `<span style="color:${color}">${sum.toLocaleString()} / ${total.toLocaleString()}개</span>${extra}`;
}

async function saveDeviceAlloc() {
  const deviceId = parseInt(document.getElementById('alloc-device-id')?.value);
  const totalQty = parseFloat(document.getElementById('alloc-total-qty')?.value) || 0;
  if (!deviceId) return;

  const allocations = [];
  document.querySelectorAll('[id^="alloc-row-"]').forEach(row => {
    const idxStr = row.id.replace('alloc-row-', '');
    const pid = parseInt(document.getElementById(`alloc-pid-${idxStr}`)?.value) || null;
    const qty = parseFloat(document.getElementById(`alloc-qty-${idxStr}`)?.value) || 0;
    if (qty > 0) allocations.push({product_id: pid, quantity: qty, note: pid ? null : '기타'});
  });

  if (!allocations.length) { alert('배분 항목을 하나 이상 입력해주세요.'); return; }

  const sumQty = allocations.reduce((a, r) => a + r.quantity, 0);
  if (Math.abs(sumQty - totalQty) > 0.001) {
    const ok = confirm(`배분 합계(${sumQty}개)와 수집 총량(${totalQty}개)이 다릅니다.\n그래도 저장하시겠습니까?`);
    if (!ok) return;
  }

  const btn = document.querySelector('#device-alloc-modal .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = '저장 중...'; }

  const res = await apiFetch('/device-productions/save', {
    method: 'POST',
    body: JSON.stringify({device_id: deviceId, total_quantity: totalQty, allocations}),
  });
  if (!res) {
    if (btn) { btn.disabled = false; btn.textContent = '저장 (생산실적 등록)'; }
    return;
  }
  document.getElementById('device-alloc-modal')?.remove();
  await Promise.all([loadDeviceProdToday(), loadProductions()]);
}


async function renderDeviceStats(period) {
  const data = await apiFetch(`/devices/${_statsDeviceId}/stats?period=${period}`);
  if (!data) return;

  let modal = document.getElementById('device-stats-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'device-stats-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:999;display:flex;align-items:center;justify-content:center';
    document.body.appendChild(modal);
  }

  const periodLabels = {day:'일간 (최근 7일)', week:'주간 (최근 8주)', month:'월간 (최근 6개월)'};
  const totalQty   = data.entries.reduce((a, e) => a + e.quantity, 0);
  const totalHours = data.entries.reduce((a, e) => a + e.hours, 0);

  const rows = data.entries.map(e => `
    <tr>
      <td>${e.label}</td>
      <td class="r" style="font-weight:700">${e.quantity.toLocaleString()}</td>
      <td class="r">${e.hours}h</td>
    </tr>`).join('');

  const tabBtns = ['day','week','month'].map(p => {
    const active = p === period;
    const lbl = {day:'일간',week:'주간',month:'월간'}[p];
    return `<button class="btn btn-sm ${active?'btn-primary':''}" onclick="renderDeviceStats('${p}')" style="flex:1;padding:4px 12px;font-size:12px;${active?'':'border:none;background:transparent'}">${lbl}</button>`;
  }).join('');

  modal.innerHTML = `
    <div style="background:#fff;border-radius:14px;padding:28px 32px;width:480px;max-width:95vw;box-shadow:0 8px 32px rgba(0,0,0,.15)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <div>
          <div style="font-size:18px;font-weight:700">통계 — ${_statsDeviceName}</div>
          <div style="font-size:12px;color:var(--gray);margin-top:2px">${periodLabels[period]}</div>
        </div>
        <button onclick="document.getElementById('device-stats-modal').remove()" style="border:none;background:transparent;font-size:22px;cursor:pointer;color:var(--gray)">×</button>
      </div>
      <div style="display:flex;gap:4px;background:var(--gray-lt);border:1px solid var(--gray-bd);border-radius:var(--radius-sm);padding:3px;margin-bottom:16px">${tabBtns}</div>
      <table class="tbl">
        <thead><tr><th>기간</th><th class="r">생산량</th><th class="r">가동시간</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr style="background:var(--gray-lt)">
          <td style="font-weight:700;padding:8px 12px">합계</td>
          <td class="r" style="font-weight:700;padding:8px 12px">${totalQty.toLocaleString()}</td>
          <td class="r" style="padding:8px 12px">${totalHours.toFixed(1)}h</td>
        </tr></tfoot>
      </table>
    </div>`;
}


// ══════════════════════════════════════════════════════
// 기본정보 마스터 CRUD
// ══════════════════════════════════════════════════════
const statusBdg = s => s === 'active'
  ? '<span class="bdg b-ok">활성</span>'
  : '<span class="bdg b-gray">비활성</span>';

const partnerTypeLabel = {
  supplier: '<span class="bdg b-purple">공급업체</span>',
  customer: '<span class="bdg b-ok">납품업체</span>',
  other:    '<span class="bdg b-gray">기타</span>',
  both:     '<span class="bdg b-warn">공급+납품</span>',
};

// ── 원재료 마스터 ─────────────────────────────────────
async function loadMaterMaster() {
  const search = document.getElementById('mat-search')?.value || '';
  const cat    = document.getElementById('mat-cat-filter')?.value || '';
  const stat   = document.getElementById('mat-status-filter')?.value || '';
  let url = '/master/materials?';
  if (search) url += `search=${encodeURIComponent(search)}&`;
  if (cat)    url += `category=${encodeURIComponent(cat)}&`;
  if (stat)   url += `status=${encodeURIComponent(stat)}&`;

  const data = await apiFetch(url);
  if (!data) return;

  // KPI
  const kpiEl = document.getElementById('mat-kpi');
  if (kpiEl) {
    const total   = data.length;
    const active  = data.filter(m => (m.status||'active') === 'active').length;
    const danger  = data.filter(m => m.stock_status === 'danger').length;
    const warn    = data.filter(m => m.stock_status === 'warn').length;
    kpiEl.innerHTML = `
      <div class="kpi"><div class="kl">전체 원재료</div><div class="kv">${total} <span class="ku">종</span></div></div>
      <div class="kpi good"><div class="kl">활성</div><div class="kv">${active} <span class="ku">종</span></div></div>
      <div class="kpi danger"><div class="kl">재고 부족</div><div class="kv" style="color:var(--red)">${danger} <span class="ku">종</span></div></div>
      <div class="kpi warn"><div class="kl">재고 주의</div><div class="kv" style="color:var(--amber)">${warn} <span class="ku">종</span></div></div>`;
  }

  const stockBdg = s => s === 'danger' ? '<span class="bdg b-danger">부족</span>' : s === 'warn' ? '<span class="bdg b-warn">주의</span>' : '<span class="bdg b-ok">정상</span>';
  const tbody = document.getElementById('mat-tbody');
  if (tbody) tbody.innerHTML = data.map(m => `
    <tr>
      <td><span class="lot">${m.material_code}</span></td>
      <td style="font-weight:700">${m.name}<br/><span style="font-size:11px;color:var(--gray)">${m.description||''}</span></td>
      <td>${m.category||'—'}</td>
      <td>${m.unit}</td>
      <td class="r">${m.safety_stock}</td>
      <td class="r">${m.current_stock} ${stockBdg(m.stock_status)}</td>
      <td class="r">${m.unit_price ? m.unit_price.toLocaleString() : '—'}</td>
      <td>${statusBdg(m.status)}</td>
      <td><div style="display:flex;gap:5px;white-space:nowrap;padding-right:12px">
        <button class="btn btn-ghost" style="padding:7px 14px;font-size:13px" onclick="openMasterModal('material',${m.id})">수정</button>
        <button class="btn btn-danger" style="padding:7px 14px;font-size:13px" onclick="deleteMaster('material',${m.id})">삭제</button>
      </div></td>
    </tr>`).join('');
}

// ── 반제품 마스터 ─────────────────────────────────────
async function loadSemiMaster() {
  const search = document.getElementById('semi-search')?.value || '';
  const stat   = document.getElementById('semi-status-filter')?.value || '';
  let url = '/master/semi-products?';
  if (search) url += `search=${encodeURIComponent(search)}&`;
  if (stat)   url += `status=${encodeURIComponent(stat)}&`;

  const data = await apiFetch(url);
  if (!data) return;

  const tbody = document.getElementById('semi-tbody');
  if (tbody) tbody.innerHTML = data.map(s => `
    <tr>
      <td><span class="lot">${s.code}</span></td>
      <td style="font-weight:700">${s.name}<br/><span style="font-size:11px;color:var(--gray)">${s.description||''}</span></td>
      <td>${s.category||'—'}</td>
      <td>${s.unit}</td>
      <td class="r">${s.standard_qty ?? '—'}</td>
      <td class="r">${s.unit_price ? s.unit_price.toLocaleString() : '—'}</td>
      <td>${statusBdg(s.status)}</td>
      <td><div style="display:flex;gap:5px;white-space:nowrap;padding-right:12px">
        <button class="btn btn-ghost" style="padding:7px 14px;font-size:13px" onclick="openMasterModal('semi',${s.id})">수정</button>
        <button class="btn btn-outline" style="padding:7px 14px;font-size:13px" onclick="openSemiBOMModal(${s.id},'${s.name.replace(/'/g,"\\'")}')">BOM</button>
        <button class="btn btn-outline" style="padding:7px 14px;font-size:13px;color:var(--purple);border-color:var(--purple)" onclick="openSemiProcessModal(${s.id},'${s.name.replace(/'/g,"\\'")}')">공정</button>
        <button class="btn btn-danger" style="padding:7px 14px;font-size:13px" onclick="deleteMaster('semi',${s.id})">삭제</button>
      </div></td>
    </tr>`).join('');
}

// ── 거래처 마스터 ─────────────────────────────────────
async function loadPartnerMaster() {
  const search = document.getElementById('partner-search')?.value || '';
  const type   = document.getElementById('partner-type-filter')?.value || '';
  const stat   = document.getElementById('partner-status-filter')?.value || '';
  let url = '/master/partners?';
  if (search) url += `search=${encodeURIComponent(search)}&`;
  if (type)   url += `partner_type=${encodeURIComponent(type)}&`;
  if (stat)   url += `status=${encodeURIComponent(stat)}&`;

  const data = await apiFetch(url);
  if (!data) return;

  // KPI
  const kpiEl = document.getElementById('partner-kpi');
  if (kpiEl) {
    const total    = data.length;
    const suppliers = data.filter(p => p.partner_type === 'supplier' || p.partner_type === 'both').length;
    const customers = data.filter(p => p.partner_type === 'customer' || p.partner_type === 'both').length;
    kpiEl.innerHTML = `
      <div class="kpi"><div class="kl">전체 거래처</div><div class="kv">${total} <span class="ku">개사</span></div></div>
      <div class="kpi"><div class="kl">공급업체</div><div class="kv">${suppliers} <span class="ku">개사</span></div></div>
      <div class="kpi"><div class="kl">고객사</div><div class="kv">${customers} <span class="ku">개사</span></div></div>`;
  }

  const tbody = document.getElementById('partner-tbody');
  if (tbody) tbody.innerHTML = data.map(p => `
    <tr>
      <td>
        <div style="font-weight:700">${p.name}</div>
        <div style="font-size:11px;color:var(--gray)">${p.address||''}</div>
        ${p.log_count>0?`<span style="font-size:10px;background:var(--teal-lt);color:var(--teal-dk);padding:1px 6px;border-radius:3px">일지 ${p.log_count}건</span>`:''}
      </td>
      <td><span class="lot">${p.business_number||'—'}</span></td>
      <td>${partnerTypeLabel[p.partner_type] || p.partner_type}</td>
      <td style="font-size:12px">${p.contact_person||'—'}<br/><span style="color:var(--gray)">${p.contact||''}</span></td>
      <td style="font-size:12px;color:var(--gray)">${p.main_products||'—'}</td>
      <td>${statusBdg(p.status)}</td>
      <td><div style="display:flex;gap:5px;white-space:nowrap;padding-right:12px">
        <button class="btn btn-ghost" style="padding:7px 14px;font-size:13px" onclick="openMasterModal('partner',${p.id})">수정</button>
        <button class="btn btn-outline" style="padding:7px 14px;font-size:13px;color:var(--teal);border-color:var(--teal)" onclick="openSalesLogModal(${p.id},'${p.name.replace(/'/g,"\\'")}')">영업일지</button>
        <button class="btn btn-danger" style="padding:7px 14px;font-size:13px" onclick="deleteMaster('partner',${p.id})">삭제</button>
      </div></td>
    </tr>`).join('');
}

// ── 공통 모달 ─────────────────────────────────────────
const masterApiPath = {
  material: '/master/materials',
  semi:     '/master/semi-products',
  product:  '/master/products',
  partner:  '/master/partners',
  process:  '/master/processes',
};

const masterFormHtml = {
  material: item => `
    <div class="frow">
      <div class="fl"><div class="fl-lbl">원재료코드</div><input id="mf-code" class="finput" value="${item?.material_code||''}"/></div>
      <div class="fl"><div class="fl-lbl">품목명 <span class="req">*</span></div><input id="mf-name" class="finput" value="${item?.name||''}" required/></div>
    </div>
    <div class="frow">
      <div class="fl"><div class="fl-lbl">분류</div>
        <select id="mf-category" class="finput">
          ${['','곡물류','유제품','당류','유지류','향신료','기타'].map(c=>`<option${item?.category===c?' selected':''}>${c}</option>`).join('')}
        </select>
      </div>
      <div class="fl"><div class="fl-lbl">단위</div>
        <select id="mf-unit" class="finput">
          ${['kg','g','L','ml','ea','box','pk'].map(u=>`<option${item?.unit===u?' selected':''}>${u}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="frow">
      <div class="fl"><div class="fl-lbl">안전재고</div><input id="mf-safety" class="finput" type="number" value="${item?.safety_stock||0}"/></div>
      <div class="fl"><div class="fl-lbl">단가(원)</div><input id="mf-price" class="finput" type="number" value="${item?.unit_price||''}"/></div>
    </div>
    <div class="fl"><div class="fl-lbl">비고</div><textarea id="mf-desc" class="finput" style="min-height:56px">${item?.description||''}</textarea></div>
    <div class="fl"><div class="fl-lbl">상태</div>
      <select id="mf-status" class="finput">
        <option value="active"${item?.status!=='inactive'?' selected':''}>활성</option>
        <option value="inactive"${item?.status==='inactive'?' selected':''}>비활성</option>
      </select>
    </div>
    <div class="fl" style="margin-top:12px">
      <div class="fl-lbl" style="margin-bottom:6px">공급 거래처 <span style="font-size:11px;color:var(--gray-md)">(복수 등록 가능)</span></div>
      <div style="display:flex;gap:6px;margin-bottom:6px">
        <select id="mf-supplier-select" class="finput" style="flex:1">
          <option value="">공급업체 선택...</option>
        </select>
        <button type="button" class="btn btn-outline btn-sm" onclick="addSupplierToMaterial()">추가</button>
      </div>
      <div id="mf-selected-suppliers" style="border:1px solid var(--gray-bd);border-radius:var(--radius-sm);padding:4px 8px;min-height:40px;background:var(--white)">
        <div style="color:var(--gray-md);font-size:12px;padding:6px 0">로딩 중...</div>
      </div>
    </div>`,

  semi: item => `
    <div class="frow">
      <div class="fl"><div class="fl-lbl">반제품코드</div><input id="mf-code" class="finput" value="${item?.code||''}"/></div>
      <div class="fl"><div class="fl-lbl">품목명 <span class="req">*</span></div><input id="mf-name" class="finput" value="${item?.name||''}" required/></div>
    </div>
    <div class="frow">
      <div class="fl"><div class="fl-lbl">분류</div><input id="mf-category" class="finput" value="${item?.category||''}"/></div>
      <div class="fl"><div class="fl-lbl">단위</div>
        <select id="mf-unit" class="finput">
          ${['%','kg','g','L','ml','ea','box','pk'].map(u=>`<option${item?.unit===u?' selected':''}>${u}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="frow">
      <div class="fl"><div class="fl-lbl">기준수량</div><input id="mf-stdqty" class="finput" type="number" value="${item?.standard_qty||''}"/></div>
      <div class="fl"><div class="fl-lbl">단가(원)</div><input id="mf-price" class="finput" type="number" value="${item?.unit_price||''}"/></div>
    </div>
    <div class="fl" style="margin-top:4px">
      <div class="fl-lbl">단위환산 <span style="font-size:11px;color:var(--gray-md)">(예: 1box=100ea, 1ea=500g → 기준 kg)</span></div>
      <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
        <span style="font-size:13px;color:var(--gray)">1단위 =</span>
        <input id="mf-conv-qty" class="finput" type="number" step="0.001" style="width:80px" placeholder="수량" value="${item?.unit_conv_qty||''}"/>
        <select id="mf-conv-unit" class="finput" style="width:76px">
          ${['','kg','g','L','ml','ea'].map(u=>`<option value="${u}"${(item?.unit_conv_unit||'')=== u?' selected':''}>${u||'—'}</option>`).join('')}
        </select>
        <span style="font-size:12px;color:var(--gray-md)">ea → 중량:</span>
        <span style="font-size:13px;color:var(--gray)">1ea =</span>
        <input id="mf-conv2-qty" class="finput" type="number" step="0.001" style="width:80px" placeholder="수량" value="${item?.unit_conv2_qty||''}"/>
        <select id="mf-conv2-unit" class="finput" style="width:76px">
          ${['','kg','g','L','ml'].map(u=>`<option value="${u}"${(item?.unit_conv2_unit||'')=== u?' selected':''}>${u||'—'}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="fl"><div class="fl-lbl">비고</div><textarea id="mf-desc" class="finput" style="min-height:56px">${item?.description||''}</textarea></div>
    <div class="fl"><div class="fl-lbl">상태</div>
      <select id="mf-status" class="finput">
        <option value="active"${item?.status!=='inactive'?' selected':''}>활성</option>
        <option value="inactive"${item?.status==='inactive'?' selected':''}>비활성</option>
      </select>
    </div>`,

  product: item => `
    <div class="frow">
      <div class="fl"><div class="fl-lbl">제품코드</div><input id="mf-code" class="finput" value="${item?.code||''}"/></div>
      <div class="fl"><div class="fl-lbl">제품명 <span class="req">*</span></div><input id="mf-name" class="finput" value="${item?.name||''}" required/></div>
    </div>
    <div class="frow">
      <div class="fl"><div class="fl-lbl">분류</div>
        <select id="mf-category" class="finput">
          ${['','식빵류','과자류','케이크류','파이류','기타'].map(c=>`<option${item?.category===c?' selected':''}>${c}</option>`).join('')}
        </select>
      </div>
      <div class="fl"><div class="fl-lbl">단위</div>
        <select id="mf-unit" class="finput">
          ${['%','kg','g','L','ml','ea','box','pk'].map(u=>`<option${item?.unit===u?' selected':''}>${u}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="fl" style="margin-top:4px">
      <div class="fl-lbl">단위환산 <span style="font-size:11px;color:var(--gray-md)">(예: 1box=100ea, 1ea=500g → 기준 kg)</span></div>
      <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
        <span style="font-size:13px;color:var(--gray)">1단위 =</span>
        <input id="mf-conv-qty" class="finput" type="number" step="0.001" style="width:80px" placeholder="수량" value="${item?.unit_conv_qty||''}"/>
        <select id="mf-conv-unit" class="finput" style="width:76px">
          ${['','kg','g','L','ml','ea'].map(u=>`<option value="${u}"${(item?.unit_conv_unit||'')=== u?' selected':''}>${u||'—'}</option>`).join('')}
        </select>
        <span style="font-size:12px;color:var(--gray-md)">ea → 중량:</span>
        <span style="font-size:13px;color:var(--gray)">1ea =</span>
        <input id="mf-conv2-qty" class="finput" type="number" step="0.001" style="width:80px" placeholder="수량" value="${item?.unit_conv2_qty||''}"/>
        <select id="mf-conv2-unit" class="finput" style="width:76px">
          ${['','kg','g','L','ml'].map(u=>`<option value="${u}"${(item?.unit_conv2_unit||'')=== u?' selected':''}>${u||'—'}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="fl"><div class="fl-lbl">판매단가(원)</div><input id="mf-price" class="finput" type="number" value="${item?.unit_price||''}"/></div>
    <div class="fl"><div class="fl-lbl">비고</div><textarea id="mf-desc" class="finput" style="min-height:56px">${item?.description||''}</textarea></div>
    <div class="fl"><div class="fl-lbl">상태</div>
      <select id="mf-status" class="finput">
        <option value="active"${item?.status!=='inactive'?' selected':''}>활성</option>
        <option value="inactive"${item?.status==='inactive'?' selected':''}>비활성</option>
      </select>
    </div>`,

  partner: item => `
    <div class="frow">
      <div class="fl"><div class="fl-lbl">업체명 <span class="req">*</span></div><input id="mf-name" class="finput" value="${item?.name||''}" required/></div>
      <div class="fl"><div class="fl-lbl">사업자등록번호</div><input id="mf-bizno" class="finput" value="${item?.business_number||''}"/></div>
    </div>
    <div class="frow">
      <div class="fl"><div class="fl-lbl">구분</div>
        <select id="mf-type" class="finput">
          <option value="supplier"${item?.partner_type==='supplier'||!item?' selected':''}>공급업체</option>
          <option value="customer"${item?.partner_type==='customer'?' selected':''}>납품업체</option>
          <option value="other"${item?.partner_type==='other'?' selected':''}>기타</option>
        </select>
      </div>
      <div class="fl"><div class="fl-lbl">담당자</div><input id="mf-person" class="finput" value="${item?.contact_person||''}"/></div>
    </div>
    <div class="frow">
      <div class="fl"><div class="fl-lbl">연락처</div><input id="mf-contact" class="finput" value="${item?.contact||''}"/></div>
      <div class="fl"><div class="fl-lbl">이메일</div><input id="mf-email" class="finput" type="email" value="${item?.email||''}"/></div>
    </div>
    <div class="fl"><div class="fl-lbl">주소</div><input id="mf-address" class="finput" value="${item?.address||''}"/></div>
    <div class="fl"><div class="fl-lbl">주요 취급 품목</div><input id="mf-mainprod" class="finput" value="${item?.main_products||''}" placeholder="예: 밀가루, 설탕, 버터"/></div>
    <div class="fl"><div class="fl-lbl">상태</div>
      <select id="mf-status" class="finput">
        <option value="active"${item?.status!=='inactive'?' selected':''}>활성</option>
        <option value="inactive"${item?.status==='inactive'?' selected':''}>비활성</option>
      </select>
    </div>`,

  process: item => `
    <div class="frow">
      <div class="fl"><div class="fl-lbl">공정코드</div><input id="mf-code" class="finput" value="${item?.code||''}"/></div>
      <div class="fl"><div class="fl-lbl">공정명 <span class="req">*</span></div><input id="mf-name" class="finput" value="${item?.name||''}" required/></div>
    </div>
    <div class="fl"><div class="fl-lbl">공정 설명</div><textarea id="mf-desc" class="finput" style="min-height:72px">${item?.description||''}</textarea></div>
    <div class="fl"><div class="fl-lbl">상태</div>
      <select id="mf-status" class="finput">
        <option value="active"${item?.status!=='inactive'?' selected':''}>활성</option>
        <option value="inactive"${item?.status==='inactive'?' selected':''}>비활성</option>
      </select>
    </div>`,
};

const masterTitles = {
  material: ['원재료','원재료 코드·품목·재고 정보'],
  semi:     ['반제품','반제품 코드·품목 정보'],
  product:  ['제품','완제품 코드·판매단가 정보'],
  partner:  ['거래처','공급업체·고객사 기본 정보'],
  process:  ['공정','제조 공정 코드·설명 정보'],
};

let _masterType = null, _masterId = null;

async function openMasterModal(type, id) {
  _masterType = type; _masterId = id;
  let item = null;
  if (id) {
    const list = await apiFetch(`${masterApiPath[type]}?`);
    if (list) item = list.find(x => x.id === id);
  }
  const [typeLabel, typeSub] = masterTitles[type] || ['등록',''];
  const inner = document.getElementById('master-modal-inner');
  if (!inner) return;
  inner.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px">
      <div>
        <div style="font-size:18px;font-weight:700">${id ? typeLabel+' 수정' : typeLabel+' 등록'}</div>
        <div style="font-size:12px;color:var(--gray);margin-top:2px">${typeSub}</div>
      </div>
      <button onclick="closeMasterModal()" style="border:none;background:transparent;font-size:22px;cursor:pointer;color:var(--gray);padding:0">×</button>
    </div>
    ${masterFormHtml[type](item)}
    <div style="display:flex;gap:8px;margin-top:20px">
      <button class="btn btn-primary" style="flex:1" onclick="saveMaster()">저장</button>
      <button class="btn btn-ghost" onclick="closeMasterModal()">취소</button>
    </div>`;
  document.getElementById('master-modal').classList.remove('hidden');

  // 원재료 모달: 거래처 목록 로드
  if (type === 'material') {
    loadSupplierCheckboxes(id);
  }
}

function closeMasterModal() {
  document.getElementById('master-modal')?.classList.add('hidden');
}

function getMasterFormData(type) {
  const g = id => document.getElementById(id)?.value || null;
  const gn = id => { const v = document.getElementById(id)?.value; return v ? parseFloat(v) : null; };
  if (type === 'material') return {
    material_code: g('mf-code'), name: g('mf-name'),
    category: g('mf-category'), unit: g('mf-unit') || 'kg',
    safety_stock: gn('mf-safety') || 0, unit_price: gn('mf-price'),
    description: g('mf-desc'), status: g('mf-status') || 'active',
  };
  if (type === 'semi') return {
    code: g('mf-code'), name: g('mf-name'),
    category: g('mf-category'), unit: g('mf-unit') || 'kg',
    standard_qty: gn('mf-stdqty'), unit_price: gn('mf-price'),
    description: g('mf-desc'), status: g('mf-status') || 'active',
    unit_conv_qty: gn('mf-conv-qty'),
    unit_conv_unit: g('mf-conv-unit') || null,
    unit_conv2_qty: gn('mf-conv2-qty'),
    unit_conv2_unit: g('mf-conv2-unit') || null,
  };
  if (type === 'product') return {
    code: g('mf-code'), name: g('mf-name'),
    category: g('mf-category'), unit: g('mf-unit') || 'ea',
    unit_price: gn('mf-price'),
    description: g('mf-desc'), status: g('mf-status') || 'active',
    unit_conv_qty: gn('mf-conv-qty'),
    unit_conv_unit: g('mf-conv-unit') || null,
    unit_conv2_qty: gn('mf-conv2-qty'),
    unit_conv2_unit: g('mf-conv2-unit') || null,
  };
  if (type === 'partner') return {
    name: g('mf-name'), business_number: g('mf-bizno'),
    partner_type: g('mf-type') || 'supplier',
    contact_person: g('mf-person'), contact: g('mf-contact'),
    email: g('mf-email'), address: g('mf-address'),
    main_products: g('mf-mainprod'),
    status: g('mf-status') || 'active',
  };
  if (type === 'process') return {
    code: g('mf-code'), name: g('mf-name'),
    description: g('mf-desc'), status: g('mf-status') || 'active',
  };
}

const reloadFn = {
  material: loadMaterMaster,
  semi:     loadSemiMaster,
  product:  loadProductMaster,
  partner:  loadPartnerMaster,
  process:  loadProcessMaster,
};

async function saveMaster() {
  const body = getMasterFormData(_masterType);
  if (!body.name) { alert('품목명(업체명)은 필수입니다.'); return; }
  const path = _masterId
    ? `${masterApiPath[_masterType]}/${_masterId}`
    : masterApiPath[_masterType];
  const method = _masterId ? 'PUT' : 'POST';
  const result = await apiFetch(path, { method, body: JSON.stringify(body) });
  if (!result) return;

  // 원재료: 거래처 연결 저장
  if (_masterType === 'material') {
    const materialId = _masterId || result.id;
    const supplierIds = _matSupplierList.map(s => s.supplier_id);
    const primaryId = _matSupplierList.find(s => s.is_primary)?.supplier_id || null;
    await apiFetch(`/master/materials/${materialId}/suppliers`, {
      method: 'PUT',
      body: JSON.stringify({ supplier_ids: supplierIds, primary_id: primaryId }),
    });
  }

  // 제품: 새 등록 시 BOM → 공정 순차 등록 플로우
  if (_masterType === 'product' && !_masterId) {
    const newId = result.id;
    const newName = getMasterFormData('product')?.name || '';
    closeMasterModal();
    reloadFn['product']?.();
    showProductSetupFlow(newId, newName);
    return;
  }

  closeMasterModal();
  reloadFn[_masterType]?.();
}

async function deleteMaster(type, id) {
  if (!confirm('비활성 처리하시겠습니까?')) return;
  const result = await apiFetch(`${masterApiPath[type]}/${id}`, { method: 'DELETE' });
  if (result) reloadFn[type]?.();
}

// ── 공정 마스터 ────────────────────────────────────────
async function loadProcessMaster() {
  const search = document.getElementById('process-search')?.value || '';
  const stat   = document.getElementById('process-status-filter')?.value || '';
  let url = '/master/processes?';
  if (search) url += `search=${encodeURIComponent(search)}&`;
  if (stat)   url += `status=${encodeURIComponent(stat)}&`;

  const data = await apiFetch(url);
  if (!data) return;

  const tbody = document.getElementById('process-tbody');
  if (tbody) tbody.innerHTML = data.length ? data.map(p => `
    <tr>
      <td><span class="lot">${p.code}</span></td>
      <td style="font-weight:700">${p.name}</td>
      <td style="font-size:12px;color:var(--gray)">${p.description||'—'}</td>
      <td>${statusBdg(p.status)}</td>
      <td><div style="display:flex;gap:5px;white-space:nowrap;padding-right:12px">
        <button class="btn btn-ghost" style="padding:7px 14px;font-size:13px" onclick="openMasterModal('process',${p.id})">수정</button>
        <button class="btn btn-danger" style="padding:7px 14px;font-size:13px" onclick="deleteMaster('process',${p.id})">삭제</button>
      </div></td>
    </tr>`).join('') : '<tr><td colspan="5" style="text-align:center;color:var(--gray-md);padding:24px">등록된 공정이 없습니다</td></tr>';
}

// ── 원재료 모달: 거래처 드롭다운 방식 ─────────────────
let _matSupplierList = [];

async function loadSupplierCheckboxes(materialId) {
  const selectEl = document.getElementById('mf-supplier-select');
  if (!selectEl) return;

  const [partners, linked] = await Promise.all([
    apiFetch('/master/partners?status=active'),
    materialId ? apiFetch(`/master/materials/${materialId}/suppliers`) : Promise.resolve([]),
  ]);

  const suppliers = (partners || []).filter(p => p.partner_type === 'supplier');
  if (!suppliers.length) {
    selectEl.innerHTML = '<option value="">등록된 공급업체 없음</option>';
    document.getElementById('mf-selected-suppliers').innerHTML = '<div style="color:var(--gray-md);font-size:12px;padding:6px 0">공급업체를 먼저 거래처에 등록하세요.</div>';
    _matSupplierList = [];
    return;
  }

  selectEl.innerHTML = '<option value="">공급업체 선택...</option>' + suppliers.map(s => `<option value="${s.id}" data-name="${s.name}">${s.name}</option>`).join('');

  const linkedIds = (linked || []).map(l => l.supplier_id);
  const primaryId = (linked || []).find(l => l.is_primary)?.supplier_id;
  _matSupplierList = (linked || []).map(l => ({
    supplier_id: l.supplier_id,
    supplier_name: l.supplier_name,
    is_primary: l.is_primary,
  }));
  renderMatSupplierTags();
}

function addSupplierToMaterial() {
  const sel = document.getElementById('mf-supplier-select');
  const id = parseInt(sel.value);
  if (!id) return;
  if (_matSupplierList.find(s => s.supplier_id === id)) { alert('이미 추가된 거래처입니다.'); return; }
  const name = sel.options[sel.selectedIndex]?.dataset?.name || sel.options[sel.selectedIndex]?.text || '';
  _matSupplierList.push({ supplier_id: id, supplier_name: name, is_primary: _matSupplierList.length === 0 });
  sel.value = '';
  renderMatSupplierTags();
}

function removeMatSupplier(id) {
  _matSupplierList = _matSupplierList.filter(s => s.supplier_id !== id);
  if (_matSupplierList.length && !_matSupplierList.find(s => s.is_primary)) _matSupplierList[0].is_primary = true;
  renderMatSupplierTags();
}

function setMatPrimary(id) {
  _matSupplierList.forEach(s => s.is_primary = s.supplier_id === id);
  renderMatSupplierTags();
}

function renderMatSupplierTags() {
  const el = document.getElementById('mf-selected-suppliers');
  if (!el) return;
  if (!_matSupplierList.length) {
    el.innerHTML = '<div style="color:var(--gray-md);font-size:12px;padding:6px 0">추가된 거래처 없음</div>';
    return;
  }
  el.innerHTML = _matSupplierList.map(s => `
    <div style="display:flex;align-items:center;gap:6px;padding:5px 2px;border-bottom:1px solid var(--gray-lt)">
      <span style="flex:1;font-size:13px">${s.supplier_name}${s.is_primary?'  <span style="font-size:10px;background:var(--teal-lt);color:var(--teal-dk);padding:1px 6px;border-radius:3px">주거래처</span>':''}</span>
      ${!s.is_primary?`<button type="button" class="btn btn-ghost btn-sm" style="padding:2px 8px;font-size:11px" onclick="setMatPrimary(${s.supplier_id})">주거래처 지정</button>`:''}
      <button type="button" class="btn btn-danger btn-sm" style="padding:2px 6px;font-size:11px" onclick="removeMatSupplier(${s.supplier_id})">×</button>
    </div>`).join('');
}

// ── 제품 마스터: BOM 컬럼/버튼 포함 렌더링 ──────────
async function loadProductMaster() {
  const search = document.getElementById('prod-search')?.value || '';
  const cat    = document.getElementById('prod-cat-filter')?.value || '';
  const stat   = document.getElementById('prod-status-filter')?.value || '';
  let url = '/master/products?';
  if (search) url += `search=${encodeURIComponent(search)}&`;
  if (stat)   url += `status=${encodeURIComponent(stat)}&`;

  const data = await apiFetch(url);
  if (!data) return;

  const filtered = cat ? data.filter(p => p.category === cat) : data;
  const tbody = document.getElementById('prod-tbody');
  if (tbody) tbody.innerHTML = filtered.map(p => `
    <tr>
      <td><span class="lot">${p.code}</span></td>
      <td style="font-weight:700">${p.name}<br/><span style="font-size:11px;color:var(--gray)">${p.description||''}</span></td>
      <td>${p.category||'—'}</td>
      <td>${p.unit}</td>
      <td class="r">${p.unit_price ? p.unit_price.toLocaleString()+'원' : '—'}</td>
      <td>${statusBdg(p.status)}</td>
      <td><div style="display:flex;gap:5px;white-space:nowrap;padding-right:12px">
        <button class="btn btn-ghost" style="padding:7px 14px;font-size:13px" onclick="openMasterModal('product',${p.id})">수정</button>
        <button class="btn btn-outline" style="padding:7px 14px;font-size:13px" onclick="openBOMModal(${p.id},'${p.name.replace(/'/g,"\\'")}')">BOM</button>
        <button class="btn btn-outline" style="padding:7px 14px;font-size:13px;color:var(--purple);border-color:var(--purple)" onclick="openProductProcessModal(${p.id},'${p.name.replace(/'/g,"\\'")}')">공정</button>
        <button class="btn btn-danger" style="padding:7px 14px;font-size:13px" onclick="deleteMaster('product',${p.id})">삭제</button>
      </div></td>
    </tr>`).join('');
}

// ── BOM 구성 모달 ──────────────────────────────────────
async function openBOMModal(productId, productName) {
  const modal = document.getElementById('bom-modal');
  const inner = document.getElementById('bom-modal-inner');
  if (!inner) return;

  const [bomItems, materials, semis, products] = await Promise.all([
    apiFetch(`/master/products/${productId}/bom`),
    apiFetch('/master/materials?status=active'),
    apiFetch('/master/semi-products?status=active'),
    apiFetch('/master/products?status=active'),
  ]);
  if (!bomItems || !materials) return;

  const bomTypeBadge = t => t==='material'?'<span class="bdg b-ok">원재료</span>':t==='semi'?'<span class="bdg b-purple">반제품</span>':'<span class="bdg b-amber">완제품</span>';
  const bomItemName = b => b.material_name || b.semi_product_name || b.child_product_name || '—';
  const renderBOMList = (items) => items.length ? items.map(b => `
    <tr>
      <td>${bomTypeBadge(b.item_type)}</td>
      <td style="font-weight:500">${bomItemName(b)}</td>
      <td class="r">${b.quantity}</td>
      <td>${b.unit}</td>
      <td>${b.note||''}</td>
      <td><button class="btn btn-danger btn-sm" onclick="deleteBOMItem(${productId},${b.id})">삭제</button></td>
    </tr>`).join('') : '<tr><td colspan="6" style="text-align:center;color:var(--gray-md);padding:16px">BOM 구성요소가 없습니다</td></tr>';

  inner.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">
      <div><div style="font-size:18px;font-weight:700">BOM 구성</div>
        <div style="font-size:12px;color:var(--gray);margin-top:2px">${productName}</div></div>
      <button onclick="closeBOMModal()" style="border:none;background:transparent;font-size:22px;cursor:pointer;color:var(--gray)">×</button>
    </div>
    <table class="tbl" style="margin-bottom:16px">
      <colgroup><col style="width:70px"/><col/><col style="width:70px"/><col style="width:50px"/><col/><col style="width:55px"/></colgroup>
      <thead><tr><th>구분</th><th>품목명</th><th class="r">수량</th><th>단위</th><th>비고</th><th></th></tr></thead>
      <tbody id="bom-list-tbody">${renderBOMList(bomItems)}</tbody>
    </table>
    <div style="background:var(--gray-lt);border-radius:var(--radius);padding:14px 16px">
      <div style="font-size:13px;font-weight:700;margin-bottom:10px">구성요소 추가</div>
      <div class="frow" style="margin-bottom:8px">
        <div class="fl"><div class="fl-lbl">구분</div>
          <select id="bom-type" class="finput" onchange="refreshBOMItemSelect()">
            <option value="material">원재료</option>
            <option value="semi">반제품</option>
            <option value="product">완제품</option>
          </select>
        </div>
        <div class="fl"><div class="fl-lbl">품목 선택 <span class="req">*</span></div>
          <select id="bom-item-id" class="finput">
            ${materials.map(m=>`<option value="${m.id}">${m.name} (${m.unit})</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="frow">
        <div class="fl"><div class="fl-lbl">수량 <span class="req">*</span></div><input id="bom-qty" class="finput" type="number" step="0.001" placeholder="0"/></div>
        <div class="fl"><div class="fl-lbl">단위</div>
          <select id="bom-unit" class="finput">
            ${['%','kg','g','L','ml','ea','box','pk'].map(u=>`<option>${u}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="fl" style="margin-bottom:10px"><div class="fl-lbl">비고</div><input id="bom-note" class="finput" placeholder=""/></div>
      <button class="btn btn-primary btn-sm" onclick="addBOMItem(${productId})">+ 추가</button>
    </div>`;

  // 품목 목록 저장 for select switch (자기 자신 제외)
  inner._semis = semis || [];
  inner._materials = materials || [];
  inner._products = (products || []).filter(p => p.id !== productId);

  modal.classList.remove('hidden');
}

function closeBOMModal() { document.getElementById('bom-modal')?.classList.add('hidden'); }

function refreshBOMItemSelect() {
  const type = document.getElementById('bom-type')?.value;
  const inner = document.getElementById('bom-modal-inner');
  const sel = document.getElementById('bom-item-id');
  if (!sel || !inner) return;
  const items = type === 'semi' ? (inner._semis || []) : type === 'product' ? (inner._products || []) : (inner._materials || []);
  sel.innerHTML = items.map(it => `<option value="${it.id}">${it.name} (${it.unit})</option>`).join('');
}

async function addBOMItem(productId) {
  const type = document.getElementById('bom-type')?.value;
  const itemId = parseInt(document.getElementById('bom-item-id')?.value);
  const qty = parseFloat(document.getElementById('bom-qty')?.value);
  const unit = document.getElementById('bom-unit')?.value || 'kg';
  const note = document.getElementById('bom-note')?.value || null;
  if (!itemId || isNaN(qty) || qty <= 0) { alert('품목과 수량을 입력하세요.'); return; }

  const body = { quantity: qty, unit, note };
  if (type === 'semi') body.semi_product_id = itemId;
  else if (type === 'product') body.child_product_id = itemId;
  else body.material_id = itemId;

  const r = await apiFetch(`/master/products/${productId}/bom`, { method: 'POST', body: JSON.stringify(body) });
  if (!r) return;

  // refresh list
  const items = await apiFetch(`/master/products/${productId}/bom`);
  const tbody = document.getElementById('bom-list-tbody');
  if (tbody && items) {
    const _bb = t => t==='material'?'<span class="bdg b-ok">원재료</span>':t==='semi'?'<span class="bdg b-purple">반제품</span>':'<span class="bdg b-amber">완제품</span>';
    const _bn = b => b.material_name || b.semi_product_name || b.child_product_name || '—';
    const renderBOMList = (its) => its.length ? its.map(b => `
      <tr>
        <td>${_bb(b.item_type)}</td>
        <td style="font-weight:500">${_bn(b)}</td>
        <td class="r">${b.quantity}</td>
        <td>${b.unit}</td>
        <td>${b.note||''}</td>
        <td><button class="btn btn-danger btn-sm" onclick="deleteBOMItem(${productId},${b.id})">삭제</button></td>
      </tr>`).join('') : '<tr><td colspan="6" style="text-align:center;color:var(--gray-md);padding:16px">BOM 구성요소가 없습니다</td></tr>';
    tbody.innerHTML = renderBOMList(items);
  }
  document.getElementById('bom-qty').value = '';
  document.getElementById('bom-note').value = '';
}

async function deleteBOMItem(productId, bomId) {
  const r = await apiFetch(`/master/products/${productId}/bom/${bomId}`, { method: 'DELETE' });
  if (!r) return;
  const items = await apiFetch(`/master/products/${productId}/bom`);
  const tbody = document.getElementById('bom-list-tbody');
  if (tbody && items) {
    const renderBOMList = (its) => its.length ? its.map(b => `
      <tr>
        <td>${b.item_type === 'material' ? '<span class="bdg b-ok">원재료</span>' : '<span class="bdg b-purple">반제품</span>'}</td>
        <td style="font-weight:500">${b.material_name || b.semi_product_name || '—'}</td>
        <td class="r">${b.quantity}</td>
        <td>${b.unit}</td>
        <td>${b.note||''}</td>
        <td><button class="btn btn-danger btn-sm" onclick="deleteBOMItem(${productId},${b.id})">삭제</button></td>
      </tr>`).join('') : '<tr><td colspan="6" style="text-align:center;color:var(--gray-md);padding:16px">BOM 구성요소가 없습니다</td></tr>';
    tbody.innerHTML = renderBOMList(items);
  }
}

// ── 제품 공정 배정 모달 ────────────────────────────────
async function openProductProcessModal(productId, productName) {
  const modal = document.getElementById('pp-modal');
  const inner = document.getElementById('pp-modal-inner');
  if (!inner) return;

  const [ppItems, processes] = await Promise.all([
    apiFetch(`/master/products/${productId}/processes`),
    apiFetch('/master/processes?status=active'),
  ]);
  if (!ppItems) return;

  const renderPPList = (items) => items.length ? items.map(pp => `
    <tr>
      <td style="font-weight:700;color:var(--teal)">${pp.step_order}</td>
      <td><span class="lot">${pp.process_code||''}</span></td>
      <td style="font-weight:500">${pp.process_name}</td>
      <td style="font-size:12px;color:var(--gray)">${pp.note||''}</td>
      <td><button class="btn btn-danger btn-sm" onclick="deleteProductProcess(${productId},${pp.id})">삭제</button></td>
    </tr>`).join('') : '<tr><td colspan="5" style="text-align:center;color:var(--gray-md);padding:16px">배정된 공정이 없습니다</td></tr>';

  const nextOrder = ppItems.length > 0 ? Math.max(...ppItems.map(p => p.step_order)) + 1 : 1;

  inner.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">
      <div><div style="font-size:18px;font-weight:700">공정 배정</div>
        <div style="font-size:12px;color:var(--gray);margin-top:2px">${productName}</div></div>
      <button onclick="closePPModal()" style="border:none;background:transparent;font-size:22px;cursor:pointer;color:var(--gray)">×</button>
    </div>
    <table class="tbl" style="margin-bottom:16px">
      <colgroup><col style="width:45px"/><col style="width:80px"/><col/><col/><col style="width:55px"/></colgroup>
      <thead><tr><th>순서</th><th>코드</th><th>공정명</th><th>메모</th><th></th></tr></thead>
      <tbody id="pp-list-tbody">${renderPPList(ppItems)}</tbody>
    </table>
    ${(processes && processes.length) ? `
    <div style="background:var(--gray-lt);border-radius:var(--radius);padding:14px 16px">
      <div style="font-size:13px;font-weight:700;margin-bottom:10px">공정 추가</div>
      <div class="frow" style="margin-bottom:8px">
        <div class="fl"><div class="fl-lbl">공정 선택 <span class="req">*</span></div>
          <select id="pp-process-id" class="finput">
            ${processes.map(p=>`<option value="${p.id}">${p.name}</option>`).join('')}
          </select>
        </div>
        <div class="fl"><div class="fl-lbl">순서</div>
          <input id="pp-order" class="finput" type="number" value="${nextOrder}" min="1"/>
        </div>
      </div>
      <div class="fl" style="margin-bottom:10px"><div class="fl-lbl">메모</div><input id="pp-note" class="finput" placeholder=""/></div>
      <button class="btn btn-primary btn-sm" onclick="addProductProcess(${productId})">+ 공정 추가</button>
    </div>` : `<div style="text-align:center;padding:16px;color:var(--gray-md);font-size:13px">등록된 공정이 없습니다. 먼저 <a onclick="closePPModal();goApp('process-master')" style="color:var(--teal);cursor:pointer">공정 관리</a>에서 공정을 등록해주세요.</div>`}`;

  modal.classList.remove('hidden');
}

function closePPModal() { document.getElementById('pp-modal')?.classList.add('hidden'); }

async function addProductProcess(productId) {
  const processId = parseInt(document.getElementById('pp-process-id')?.value);
  const order = parseInt(document.getElementById('pp-order')?.value) || 1;
  const note = document.getElementById('pp-note')?.value || null;
  if (!processId) { alert('공정을 선택하세요.'); return; }

  const r = await apiFetch(`/master/products/${productId}/processes`, {
    method: 'POST',
    body: JSON.stringify({ process_id: processId, step_order: order, note }),
  });
  if (!r) return;

  const items = await apiFetch(`/master/products/${productId}/processes`);
  const tbody = document.getElementById('pp-list-tbody');
  if (tbody && items) {
    tbody.innerHTML = items.length ? items.map(pp => `
      <tr>
        <td style="font-weight:700;color:var(--teal)">${pp.step_order}</td>
        <td><span class="lot">${pp.process_code||''}</span></td>
        <td style="font-weight:500">${pp.process_name}</td>
        <td style="font-size:12px;color:var(--gray)">${pp.note||''}</td>
        <td><button class="btn btn-danger btn-sm" onclick="deleteProductProcess(${productId},${pp.id})">삭제</button></td>
      </tr>`).join('') : '<tr><td colspan="5" style="text-align:center;color:var(--gray-md);padding:16px">배정된 공정이 없습니다</td></tr>';
    const nextOrd = items.length > 0 ? Math.max(...items.map(p => p.step_order)) + 1 : 1;
    if (document.getElementById('pp-order')) document.getElementById('pp-order').value = nextOrd;
  }
  if (document.getElementById('pp-note')) document.getElementById('pp-note').value = '';
}

// ══════════════════════════════════════════════════════
// 영업일지 모달
// ══════════════════════════════════════════════════════
let _salesLogModal = null;

async function openSalesLogModal(partnerId, partnerName) {
  if (!_salesLogModal) {
    _salesLogModal = document.createElement('div');
    _salesLogModal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:1100;display:flex;align-items:center;justify-content:center';
    document.body.appendChild(_salesLogModal);
  }
  const today = new Date().toISOString().split('T')[0];
  const logs = await apiFetch(`/master/partners/${partnerId}/sales-logs`) || [];

  const renderLogs = (items) => items.length ? items.map(lg => `
    <div style="border:1px solid var(--gray-bd);border-radius:var(--radius-sm);padding:10px 14px;margin-bottom:8px;background:var(--white)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <div style="display:flex;gap:8px;align-items:center">
          <span style="font-size:12px;font-weight:700;color:var(--teal-dk)">${lg.log_date}</span>
          ${lg.author?`<span style="font-size:11px;color:var(--gray)">${lg.author}</span>`:''}
        </div>
        <button onclick="deleteSalesLog(${partnerId},${lg.id})" style="border:none;background:transparent;color:var(--gray-md);cursor:pointer;font-size:16px">×</button>
      </div>
      <div style="font-size:13px;white-space:pre-wrap;line-height:1.6">${lg.content}</div>
    </div>`).join('') : '<div style="text-align:center;padding:24px;color:var(--gray-md);font-size:13px">등록된 영업일지가 없습니다</div>';

  _salesLogModal.innerHTML = `
    <div style="background:#fff;border-radius:14px;padding:0;width:580px;max-width:95vw;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 8px 32px rgba(0,0,0,.18)">
      <div style="padding:20px 28px 16px;border-bottom:1px solid var(--gray-bd);display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-size:18px;font-weight:700">영업일지</div>
          <div style="font-size:12px;color:var(--gray);margin-top:2px">${partnerName}</div>
        </div>
        <button onclick="_salesLogModal.style.display='none'" style="border:none;background:transparent;font-size:24px;cursor:pointer;color:var(--gray)">×</button>
      </div>
      <div id="sl-log-list" style="flex:1;overflow-y:auto;padding:16px 28px">
        ${renderLogs(logs)}
      </div>
      <div style="padding:16px 28px;border-top:1px solid var(--gray-bd);background:var(--gray-lt);border-radius:0 0 14px 14px">
        <div style="font-size:13px;font-weight:700;margin-bottom:8px">새 일지 추가</div>
        <div class="frow" style="margin-bottom:8px">
          <div class="fl"><div class="fl-lbl">날짜</div><input id="sl-date" class="finput" type="date" value="${today}"/></div>
          <div class="fl"><div class="fl-lbl">작성자</div><input id="sl-author" class="finput" placeholder="이름 (선택)"/></div>
        </div>
        <div class="fl" style="margin-bottom:8px">
          <div class="fl-lbl">내용 <span class="req">*</span></div>
          <textarea id="sl-content" class="finput" style="min-height:80px" placeholder="상담 내용, 특이사항, 견적 협의 내용 등을 입력하세요..."></textarea>
        </div>
        <button class="btn btn-primary btn-sm" onclick="saveSalesLog(${partnerId})">저장</button>
      </div>
    </div>`;
  _salesLogModal.style.display = 'flex';
  _salesLogModal._partnerId = partnerId;
  _salesLogModal._partnerName = partnerName;
}

async function saveSalesLog(partnerId) {
  const date = document.getElementById('sl-date')?.value;
  const content = document.getElementById('sl-content')?.value?.trim();
  const author = document.getElementById('sl-author')?.value?.trim() || null;
  if (!content) { alert('내용을 입력하세요.'); return; }
  const r = await apiFetch(`/master/partners/${partnerId}/sales-logs`, {
    method: 'POST',
    body: JSON.stringify({ log_date: date, content, author }),
  });
  if (!r) return;
  document.getElementById('sl-content').value = '';
  const logs = await apiFetch(`/master/partners/${partnerId}/sales-logs`) || [];
  const renderLogs = (items) => items.length ? items.map(lg => `
    <div style="border:1px solid var(--gray-bd);border-radius:var(--radius-sm);padding:10px 14px;margin-bottom:8px;background:var(--white)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <div style="display:flex;gap:8px;align-items:center">
          <span style="font-size:12px;font-weight:700;color:var(--teal-dk)">${lg.log_date}</span>
          ${lg.author?`<span style="font-size:11px;color:var(--gray)">${lg.author}</span>`:''}
        </div>
        <button onclick="deleteSalesLog(${partnerId},${lg.id})" style="border:none;background:transparent;color:var(--gray-md);cursor:pointer;font-size:16px">×</button>
      </div>
      <div style="font-size:13px;white-space:pre-wrap;line-height:1.6">${lg.content}</div>
    </div>`).join('') : '<div style="text-align:center;padding:24px;color:var(--gray-md);font-size:13px">등록된 영업일지가 없습니다</div>';
  document.getElementById('sl-log-list').innerHTML = renderLogs(logs);
  loadPartnerMaster();
}

async function deleteSalesLog(partnerId, logId) {
  if (!confirm('이 영업일지를 삭제하시겠습니까?')) return;
  const r = await apiFetch(`/master/partners/${partnerId}/sales-logs/${logId}`, { method: 'DELETE' });
  if (!r) return;
  const logs = await apiFetch(`/master/partners/${partnerId}/sales-logs`) || [];
  const renderLogs = (items) => items.length ? items.map(lg => `
    <div style="border:1px solid var(--gray-bd);border-radius:var(--radius-sm);padding:10px 14px;margin-bottom:8px;background:var(--white)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <div style="display:flex;gap:8px;align-items:center">
          <span style="font-size:12px;font-weight:700;color:var(--teal-dk)">${lg.log_date}</span>
          ${lg.author?`<span style="font-size:11px;color:var(--gray)">${lg.author}</span>`:''}
        </div>
        <button onclick="deleteSalesLog(${partnerId},${lg.id})" style="border:none;background:transparent;color:var(--gray-md);cursor:pointer;font-size:16px">×</button>
      </div>
      <div style="font-size:13px;white-space:pre-wrap;line-height:1.6">${lg.content}</div>
    </div>`).join('') : '<div style="text-align:center;padding:24px;color:var(--gray-md);font-size:13px">등록된 영업일지가 없습니다</div>';
  document.getElementById('sl-log-list').innerHTML = renderLogs(logs);
  loadPartnerMaster();
}

// ══════════════════════════════════════════════════════
// 반제품 BOM / 공정 모달 (제품 모달과 동일 패턴)
// ══════════════════════════════════════════════════════
async function openSemiBOMModal(semiId, semiName) {
  const modal = document.getElementById('bom-modal');
  const inner = document.getElementById('bom-modal-inner');
  if (!inner) return;

  const [bomItems, materials, semis] = await Promise.all([
    apiFetch(`/master/semi-products/${semiId}/bom`),
    apiFetch('/master/materials?status=active'),
    apiFetch('/master/semi-products?status=active'),
  ]);
  if (!bomItems || !materials) return;

  const filteredSemis = (semis || []).filter(s => s.id !== semiId);

  const renderRows = (items) => items.length ? items.map(b => `
    <tr>
      <td>${b.item_type==='material'?'<span class="bdg b-ok">원재료</span>':'<span class="bdg b-purple">반제품</span>'}</td>
      <td style="font-weight:500">${b.material_name||b.sub_semi_name||'—'}</td>
      <td class="r">${b.quantity}</td><td>${b.unit}</td><td>${b.note||''}</td>
      <td><button class="btn btn-danger btn-sm" onclick="deleteSemiBOMItem(${semiId},${b.id})">삭제</button></td>
    </tr>`).join('') : '<tr><td colspan="6" style="text-align:center;color:var(--gray-md);padding:16px">BOM이 없습니다</td></tr>';

  inner.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">
      <div><div style="font-size:18px;font-weight:700">반제품 BOM 구성</div>
        <div style="font-size:12px;color:var(--gray);margin-top:2px">${semiName}</div></div>
      <button onclick="closeBOMModal()" style="border:none;background:transparent;font-size:22px;cursor:pointer;color:var(--gray)">×</button>
    </div>
    <table class="tbl" style="margin-bottom:16px">
      <colgroup><col style="width:70px"/><col/><col style="width:70px"/><col style="width:50px"/><col/><col style="width:55px"/></colgroup>
      <thead><tr><th>구분</th><th>품목명</th><th class="r">수량</th><th>단위</th><th>비고</th><th></th></tr></thead>
      <tbody id="semi-bom-tbody">${renderRows(bomItems)}</tbody>
    </table>
    <div style="background:var(--gray-lt);border-radius:var(--radius);padding:14px 16px">
      <div style="font-size:13px;font-weight:700;margin-bottom:10px">구성요소 추가</div>
      <div class="frow" style="margin-bottom:8px">
        <div class="fl"><div class="fl-lbl">구분</div>
          <select id="semi-bom-type" class="finput" onchange="refreshSemiBOMSelect()">
            <option value="material">원재료</option>
            <option value="semi">반제품</option>
          </select>
        </div>
        <div class="fl"><div class="fl-lbl">품목 <span class="req">*</span></div>
          <select id="semi-bom-item-id" class="finput">
            ${materials.map(m=>`<option value="${m.id}">${m.name} (${m.unit})</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="frow">
        <div class="fl"><div class="fl-lbl">수량 <span class="req">*</span></div><input id="semi-bom-qty" class="finput" type="number" step="0.001" placeholder="0"/></div>
        <div class="fl"><div class="fl-lbl">단위</div>
          <select id="semi-bom-unit" class="finput">
            ${['%','kg','g','L','ml','ea','box','pk'].map(u=>`<option>${u}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="fl" style="margin-bottom:10px"><div class="fl-lbl">비고</div><input id="semi-bom-note" class="finput"/></div>
      <button class="btn btn-primary btn-sm" onclick="addSemiBOMItem(${semiId})">+ 추가</button>
    </div>`;

  inner._semiMaterials = materials || [];
  inner._semis = filteredSemis;
  modal.classList.remove('hidden');
}

function refreshSemiBOMSelect() {
  const type = document.getElementById('semi-bom-type')?.value;
  const inner = document.getElementById('bom-modal-inner');
  const sel = document.getElementById('semi-bom-item-id');
  if (!sel || !inner) return;
  const items = type === 'semi' ? (inner._semis || []) : (inner._semiMaterials || []);
  sel.innerHTML = items.map(it => `<option value="${it.id}">${it.name} (${it.unit})</option>`).join('');
}

async function addSemiBOMItem(semiId) {
  const type = document.getElementById('semi-bom-type')?.value;
  const itemId = parseInt(document.getElementById('semi-bom-item-id')?.value);
  const qty = parseFloat(document.getElementById('semi-bom-qty')?.value);
  const unit = document.getElementById('semi-bom-unit')?.value || 'kg';
  const note = document.getElementById('semi-bom-note')?.value || null;
  if (!itemId || isNaN(qty) || qty <= 0) { alert('품목과 수량을 입력하세요.'); return; }
  const body = { quantity: qty, unit, note };
  if (type === 'semi') body.sub_semi_id = itemId; else body.material_id = itemId;
  const r = await apiFetch(`/master/semi-products/${semiId}/bom`, { method: 'POST', body: JSON.stringify(body) });
  if (!r) return;
  const items = await apiFetch(`/master/semi-products/${semiId}/bom`);
  const tbody = document.getElementById('semi-bom-tbody');
  if (tbody && items) {
    const renderRows = (its) => its.length ? its.map(b => `
      <tr><td>${b.item_type==='material'?'<span class="bdg b-ok">원재료</span>':'<span class="bdg b-purple">반제품</span>'}</td>
      <td style="font-weight:500">${b.material_name||b.sub_semi_name||'—'}</td>
      <td class="r">${b.quantity}</td><td>${b.unit}</td><td>${b.note||''}</td>
      <td><button class="btn btn-danger btn-sm" onclick="deleteSemiBOMItem(${semiId},${b.id})">삭제</button></td></tr>`).join('') : '<tr><td colspan="6" style="text-align:center;color:var(--gray-md);padding:16px">BOM이 없습니다</td></tr>';
    tbody.innerHTML = renderRows(items);
  }
  document.getElementById('semi-bom-qty').value = '';
}

async function deleteSemiBOMItem(semiId, bomId) {
  await apiFetch(`/master/semi-products/${semiId}/bom/${bomId}`, { method: 'DELETE' });
  const items = await apiFetch(`/master/semi-products/${semiId}/bom`);
  const tbody = document.getElementById('semi-bom-tbody');
  if (tbody && items) {
    const renderRows = (its) => its.length ? its.map(b => `
      <tr><td>${b.item_type==='material'?'<span class="bdg b-ok">원재료</span>':'<span class="bdg b-purple">반제품</span>'}</td>
      <td style="font-weight:500">${b.material_name||b.sub_semi_name||'—'}</td>
      <td class="r">${b.quantity}</td><td>${b.unit}</td><td>${b.note||''}</td>
      <td><button class="btn btn-danger btn-sm" onclick="deleteSemiBOMItem(${semiId},${b.id})">삭제</button></td></tr>`).join('') : '<tr><td colspan="6" style="text-align:center;color:var(--gray-md);padding:16px">BOM이 없습니다</td></tr>';
    tbody.innerHTML = renderRows(items);
  }
}

async function openSemiProcessModal(semiId, semiName) {
  const modal = document.getElementById('pp-modal');
  const inner = document.getElementById('pp-modal-inner');
  if (!inner) return;
  const [ppItems, processes] = await Promise.all([
    apiFetch(`/master/semi-products/${semiId}/processes`),
    apiFetch('/master/processes?status=active'),
  ]);
  if (!ppItems) return;
  const nextOrder = ppItems.length > 0 ? Math.max(...ppItems.map(p => p.step_order)) + 1 : 1;
  const renderPP = (items) => items.length ? items.map(pp => `
    <tr><td style="font-weight:700;color:var(--teal)">${pp.step_order}</td>
    <td><span class="lot">${pp.process_code||''}</span></td>
    <td style="font-weight:500">${pp.process_name}</td>
    <td style="font-size:12px;color:var(--gray)">${pp.note||''}</td>
    <td><button class="btn btn-danger btn-sm" onclick="deleteSemiProcess(${semiId},${pp.id})">삭제</button></td></tr>`).join('') :
    '<tr><td colspan="5" style="text-align:center;color:var(--gray-md);padding:16px">배정된 공정이 없습니다</td></tr>';
  inner.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">
      <div><div style="font-size:18px;font-weight:700">반제품 공정 배정</div>
        <div style="font-size:12px;color:var(--gray);margin-top:2px">${semiName}</div></div>
      <button onclick="closePPModal()" style="border:none;background:transparent;font-size:22px;cursor:pointer;color:var(--gray)">×</button>
    </div>
    <table class="tbl" style="margin-bottom:16px">
      <colgroup><col style="width:45px"/><col style="width:80px"/><col/><col/><col style="width:55px"/></colgroup>
      <thead><tr><th>순서</th><th>코드</th><th>공정명</th><th>메모</th><th></th></tr></thead>
      <tbody id="semi-pp-tbody">${renderPP(ppItems)}</tbody>
    </table>
    ${(processes && processes.length) ? `
    <div style="background:var(--gray-lt);border-radius:var(--radius);padding:14px 16px">
      <div class="frow" style="margin-bottom:8px">
        <div class="fl"><div class="fl-lbl">공정 선택 <span class="req">*</span></div>
          <select id="semi-pp-id" class="finput">${processes.map(p=>`<option value="${p.id}">${p.name}</option>`).join('')}</select>
        </div>
        <div class="fl"><div class="fl-lbl">순서</div><input id="semi-pp-order" class="finput" type="number" value="${nextOrder}" min="1"/></div>
      </div>
      <div class="fl" style="margin-bottom:10px"><div class="fl-lbl">메모</div><input id="semi-pp-note" class="finput"/></div>
      <button class="btn btn-primary btn-sm" onclick="addSemiProcess(${semiId})">+ 공정 추가</button>
    </div>` : '<div style="text-align:center;padding:12px;color:var(--gray-md);font-size:13px">공정 관리에서 먼저 공정을 등록하세요.</div>'}`;
  modal.classList.remove('hidden');
}

async function addSemiProcess(semiId) {
  const pid = parseInt(document.getElementById('semi-pp-id')?.value);
  const order = parseInt(document.getElementById('semi-pp-order')?.value) || 1;
  const note = document.getElementById('semi-pp-note')?.value || null;
  if (!pid) { alert('공정을 선택하세요.'); return; }
  await apiFetch(`/master/semi-products/${semiId}/processes`, { method: 'POST', body: JSON.stringify({ process_id: pid, step_order: order, note }) });
  const items = await apiFetch(`/master/semi-products/${semiId}/processes`);
  const tbody = document.getElementById('semi-pp-tbody');
  if (tbody && items) {
    const renderPP = (its) => its.length ? its.map(pp => `
      <tr><td style="font-weight:700;color:var(--teal)">${pp.step_order}</td>
      <td><span class="lot">${pp.process_code||''}</span></td>
      <td style="font-weight:500">${pp.process_name}</td>
      <td style="font-size:12px;color:var(--gray)">${pp.note||''}</td>
      <td><button class="btn btn-danger btn-sm" onclick="deleteSemiProcess(${semiId},${pp.id})">삭제</button></td></tr>`).join('') :
      '<tr><td colspan="5" style="text-align:center;color:var(--gray-md);padding:16px">배정된 공정이 없습니다</td></tr>';
    tbody.innerHTML = renderPP(items);
    const nextOrd = items.length > 0 ? Math.max(...items.map(p => p.step_order)) + 1 : 1;
    if (document.getElementById('semi-pp-order')) document.getElementById('semi-pp-order').value = nextOrd;
  }
}

async function deleteSemiProcess(semiId, ppId) {
  await apiFetch(`/master/semi-products/${semiId}/processes/${ppId}`, { method: 'DELETE' });
  const items = await apiFetch(`/master/semi-products/${semiId}/processes`);
  const tbody = document.getElementById('semi-pp-tbody');
  if (tbody && items) {
    const renderPP = (its) => its.length ? its.map(pp => `
      <tr><td style="font-weight:700;color:var(--teal)">${pp.step_order}</td>
      <td><span class="lot">${pp.process_code||''}</span></td>
      <td style="font-weight:500">${pp.process_name}</td>
      <td style="font-size:12px;color:var(--gray)">${pp.note||''}</td>
      <td><button class="btn btn-danger btn-sm" onclick="deleteSemiProcess(${semiId},${pp.id})">삭제</button></td></tr>`).join('') :
      '<tr><td colspan="5" style="text-align:center;color:var(--gray-md);padding:16px">배정된 공정이 없습니다</td></tr>';
    tbody.innerHTML = renderPP(items);
  }
}

// ══════════════════════════════════════════════════════
// 제품 순차 등록 플로우: 저장 → BOM → 공정
// ══════════════════════════════════════════════════════
let _setupModal = null;

function showProductSetupFlow(productId, productName) {
  if (!_setupModal) {
    _setupModal = document.createElement('div');
    _setupModal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:1200;display:flex;align-items:center;justify-content:center';
    document.body.appendChild(_setupModal);
  }
  _setupModal.innerHTML = `
    <div style="background:#fff;border-radius:16px;padding:32px 36px;width:400px;max-width:95vw;box-shadow:0 12px 40px rgba(0,0,0,.2);text-align:center">
      <div style="font-size:48px;margin-bottom:12px">✅</div>
      <div style="font-size:20px;font-weight:700;margin-bottom:6px">"${productName}" 등록 완료</div>
      <div style="font-size:13px;color:var(--gray);margin-bottom:24px;line-height:1.6">BOM(원재료 구성)을<br/>이어서 등록하시겠습니까?</div>
      <div style="display:flex;gap:10px;justify-content:center">
        <button class="btn btn-primary" style="min-width:130px" onclick="startProductBOMSetup(${productId},'${productName.replace(/'/g,"\\'")}')">BOM 등록</button>
        <button class="btn btn-ghost" style="min-width:100px" onclick="skipToProcessSetup(${productId},'${productName.replace(/'/g,"\\'")}')">건너뛰기</button>
      </div>
    </div>`;
  _setupModal.style.display = 'flex';
}

function startProductBOMSetup(productId, productName) {
  _setupModal.style.display = 'none';
  // BOM 모달 열기 - 완료 콜백 포함
  openBOMModalWithCallback(productId, productName, () => {
    closeBOMModal();
    showProcessSetupPrompt(productId, productName);
  });
}

async function openBOMModalWithCallback(productId, productName, onClose) {
  await openBOMModal(productId, productName);
  // BOM 모달 닫기 버튼에 콜백 연결
  const closeBtn = document.querySelector('#bom-modal-inner button[onclick="closeBOMModal()"]');
  if (closeBtn) closeBtn.onclick = () => { closeBOMModal(); if (onClose) onClose(); };

  // "완료" 버튼 추가
  const inner = document.getElementById('bom-modal-inner');
  if (inner) {
    const doneDiv = document.createElement('div');
    doneDiv.style.cssText = 'margin-top:12px;text-align:right';
    doneDiv.innerHTML = `<button class="btn btn-primary" onclick="closeBOMModal();showProcessSetupPrompt(${productId},'${productName.replace(/'/g,"\\'")}')">다음: 공정 등록 →</button>
      <button class="btn btn-ghost" style="margin-left:8px" onclick="closeBOMModal();loadProductMaster()">완료</button>`;
    inner.appendChild(doneDiv);
  }
}

function skipToProcessSetup(productId, productName) {
  _setupModal.style.display = 'none';
  showProcessSetupPrompt(productId, productName);
}

function showProcessSetupPrompt(productId, productName) {
  if (!_setupModal) return;
  _setupModal.innerHTML = `
    <div style="background:#fff;border-radius:16px;padding:32px 36px;width:400px;max-width:95vw;box-shadow:0 12px 40px rgba(0,0,0,.2);text-align:center">
      <div style="font-size:48px;margin-bottom:12px">⚙️</div>
      <div style="font-size:18px;font-weight:700;margin-bottom:6px">공정을 등록하시겠습니까?</div>
      <div style="font-size:13px;color:var(--gray);margin-bottom:24px;line-height:1.6">"${productName}"의 제조 공정 순서를<br/>지금 등록할 수 있습니다.</div>
      <div style="display:flex;gap:10px;justify-content:center">
        <button class="btn btn-primary" style="min-width:130px" onclick="_setupModal.style.display='none';openProductProcessModal(${productId},'${productName.replace(/'/g,"\\'")}')">공정 등록</button>
        <button class="btn btn-ghost" style="min-width:100px" onclick="_setupModal.style.display='none';loadProductMaster()">완료</button>
      </div>
    </div>`;
  _setupModal.style.display = 'flex';
}

async function deleteProductProcess(productId, ppId) {
  const r = await apiFetch(`/master/products/${productId}/processes/${ppId}`, { method: 'DELETE' });
  if (!r) return;
  const items = await apiFetch(`/master/products/${productId}/processes`);
  const tbody = document.getElementById('pp-list-tbody');
  if (tbody && items) {
    tbody.innerHTML = items.length ? items.map(pp => `
      <tr>
        <td style="font-weight:700;color:var(--teal)">${pp.step_order}</td>
        <td><span class="lot">${pp.process_code||''}</span></td>
        <td style="font-weight:500">${pp.process_name}</td>
        <td style="font-size:12px;color:var(--gray)">${pp.note||''}</td>
        <td><button class="btn btn-danger btn-sm" onclick="deleteProductProcess(${productId},${pp.id})">삭제</button></td>
      </tr>`).join('') : '<tr><td colspan="5" style="text-align:center;color:var(--gray-md);padding:16px">배정된 공정이 없습니다</td></tr>';
  }
}

// ══════════════════════════════════════════════════════
// 생산계획 캘린더
// ══════════════════════════════════════════════════════
let _planView = 'month';
let _planCursor = new Date();
let _planProducts = [];

async function initPlanView() {
  _planProducts = await apiFetch('/master/products?status=active') || [];
  _planCursor = new Date();
  _planView = 'month';
  updatePlanViewButtons();
  renderPlanCalendar();
}

function setPlanView(v) {
  _planView = v;
  updatePlanViewButtons();
  renderPlanCalendar();
}

function updatePlanViewButtons() {
  ['day','week','month'].forEach(v => {
    const btn = document.getElementById(`plan-btn-${v}`);
    if (!btn) return;
    btn.className = 'btn btn-sm';
    btn.style.cssText = 'padding:4px 12px;font-size:12px;border:none;background:transparent';
    if (v === _planView) {
      btn.className = 'btn btn-primary btn-sm';
      btn.style.cssText = 'padding:4px 12px;font-size:12px;border-radius:5px';
    }
  });
}

function navigatePlan(dir) {
  if (_planView === 'month') {
    _planCursor = new Date(_planCursor.getFullYear(), _planCursor.getMonth() + dir, 1);
  } else if (_planView === 'week') {
    _planCursor = new Date(_planCursor.getTime() + dir * 7 * 86400000);
  } else {
    _planCursor = new Date(_planCursor.getTime() + dir * 86400000);
  }
  renderPlanCalendar();
}

async function renderPlanCalendar() {
  const container = document.getElementById('plan-calendar');
  const titleEl   = document.getElementById('plan-nav-title');
  if (!container) return;

  const y = _planCursor.getFullYear(), m = _planCursor.getMonth();
  const KO_DAYS = ['일','월','화','수','목','금','토'];

  if (_planView === 'month') {
    titleEl.textContent = `${y}년 ${m+1}월`;
    const plans = await apiFetch(`/production-plans?year=${y}&month=${m+1}`) || [];
    const planByDate = {};
    plans.forEach(p => { (planByDate[p.planned_date] = planByDate[p.planned_date]||[]).push(p); });

    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m+1, 0).getDate();
    const today = new Date().toISOString().split('T')[0];

    let html = `<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:0;border:1px solid var(--gray-bd);border-radius:var(--radius);overflow:hidden;background:var(--white)">`;
    // 요일 헤더
    ['일','월','화','수','목','금','토'].forEach((d,i) => {
      const color = i===0?'var(--red)':i===6?'#5B8FDE':'var(--gray)';
      html += `<div style="background:var(--gray-lt);padding:8px;text-align:center;font-size:12px;font-weight:700;color:${color};border-bottom:1px solid var(--gray-bd)">${d}</div>`;
    });
    // 빈칸 채우기
    for (let i = 0; i < firstDay; i++)
      html += `<div style="min-height:100px;border-right:1px solid var(--gray-lt);border-bottom:1px solid var(--gray-lt);background:var(--bg)"></div>`;
    // 날짜 셀
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const isToday = dateStr === today;
      const dow = (firstDay + d - 1) % 7;
      const dayColor = dow===0?'var(--red)':dow===6?'#5B8FDE':'var(--dark)';
      const dayPlans = planByDate[dateStr] || [];
      const bgStyle = isToday ? 'background:var(--teal-lt)' : '';
      html += `<div style="min-height:100px;border-right:1px solid var(--gray-lt);border-bottom:1px solid var(--gray-lt);padding:6px;${bgStyle};cursor:pointer" onclick="openPlanModal('${dateStr}',null)">
        <div style="font-size:13px;font-weight:700;color:${dayColor};margin-bottom:4px">${isToday?`<span style="background:var(--teal);color:#fff;border-radius:50%;width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center">${d}</span>`:d}</div>
        ${dayPlans.map(p=>`<div onclick="event.stopPropagation();openPlanModal('${dateStr}',${p.id})" style="font-size:11px;background:${p.has_shortage?'#fff0f0':'var(--teal-lt)'};border:1px solid ${p.has_shortage?'var(--red)':'var(--teal-md)'};border-radius:3px;padding:2px 5px;margin-bottom:2px;cursor:pointer;overflow:hidden;white-space:nowrap;text-overflow:ellipsis" title="${p.product_name} ${p.planned_quantity}${p.product_unit}${p.has_shortage?' ⚠ 원재료 부족':''}">
          ${p.has_shortage?'⚠ ':''}${p.product_name} <strong>${p.planned_quantity.toLocaleString()}</strong>${p.product_unit}
          ${p.status==='completed'?'<span style="color:var(--teal-dk)">✓</span>':p.status==='cancelled'?'<span style="color:var(--red)">✕</span>':''}
        </div>`).join('')}
      </div>`;
    }
    // 나머지 빈칸
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    for (let i = firstDay + daysInMonth; i < totalCells; i++)
      html += `<div style="min-height:100px;border-right:1px solid var(--gray-lt);border-bottom:1px solid var(--gray-lt);background:var(--bg)"></div>`;
    html += '</div>';
    container.innerHTML = html;

  } else if (_planView === 'week') {
    const mon = new Date(_planCursor);
    const dow = mon.getDay();
    mon.setDate(mon.getDate() - dow); // 일요일 기준 주 시작
    const sun = new Date(mon); sun.setDate(sun.getDate() + 6);
    titleEl.textContent = `${mon.getMonth()+1}월 ${mon.getDate()}일 ~ ${sun.getMonth()+1}월 ${sun.getDate()}일`;

    const fromStr = mon.toISOString().split('T')[0];
    const toStr = sun.toISOString().split('T')[0];
    const plans = await apiFetch(`/production-plans?date_from=${fromStr}&date_to=${toStr}`) || [];
    const planByDate = {};
    plans.forEach(p => { (planByDate[p.planned_date] = planByDate[p.planned_date]||[]).push(p); });
    const today = new Date().toISOString().split('T')[0];

    let html = `<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:8px">`;
    for (let i = 0; i < 7; i++) {
      const d = new Date(mon); d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const isToday = dateStr === today;
      const dayColor = i===0?'var(--red)':i===6?'#5B8FDE':'var(--dark)';
      const dayPlans = planByDate[dateStr] || [];
      html += `<div style="border:${isToday?'2px solid var(--teal)':'1px solid var(--gray-bd)'};border-radius:var(--radius);min-height:180px;overflow:hidden">
        <div style="background:${isToday?'var(--teal)':'var(--gray-lt)'};padding:8px 10px;text-align:center">
          <div style="font-size:11px;color:${isToday?'rgba(255,255,255,.8)':dayColor}">${KO_DAYS[i]}</div>
          <div style="font-size:18px;font-weight:700;color:${isToday?'#fff':dayColor}">${d.getDate()}</div>
        </div>
        <div style="padding:6px;cursor:pointer" onclick="openPlanModal('${dateStr}',null)">
          ${dayPlans.length ? dayPlans.map(p=>`<div onclick="event.stopPropagation();openPlanModal('${dateStr}',${p.id})" style="font-size:11px;background:${p.has_shortage?'#fff0f0':'var(--teal-lt)'};border:1px solid ${p.has_shortage?'var(--red)':'var(--teal-md)'};border-radius:3px;padding:4px 6px;margin-bottom:4px;cursor:pointer">
            <div style="font-weight:700;color:${p.has_shortage?'var(--red)':'var(--dark)'}">${p.has_shortage?'⚠ ':''}${p.product_name}</div>
            <div style="color:${p.has_shortage?'var(--red)':'var(--teal-dk)'}">${p.planned_quantity.toLocaleString()} ${p.product_unit}${p.has_shortage?' — 재고부족':''}</div>
          </div>`).join('') : `<div style="text-align:center;padding:20px 0;color:var(--gray-md);font-size:11px">+ 추가</div>`}
        </div>
      </div>`;
    }
    html += '</div>';
    container.innerHTML = html;

  } else { // day
    const dateStr = _planCursor.toISOString().split('T')[0];
    const wd = KO_DAYS[_planCursor.getDay()];
    titleEl.textContent = `${y}년 ${m+1}월 ${_planCursor.getDate()}일 (${wd})`;
    const plans = await apiFetch(`/production-plans?date_from=${dateStr}&date_to=${dateStr}`) || [];

    const statusBadge = s => s==='planned'?'<span class="bdg b-warn">계획</span>':s==='completed'?'<span class="bdg b-ok">완료</span>':'<span class="bdg b-danger">취소</span>';
    container.innerHTML = `<div class="card">
      <div class="card-head"><div class="card-title">${dateStr} 생산계획</div>
        <button class="btn btn-primary btn-sm" onclick="openPlanModal('${dateStr}',null)">+ 계획 추가</button></div>
      <div style="padding:12px 16px">
        ${plans.length ? plans.map(p=>`
          <div onclick="openPlanModal('${dateStr}',${p.id})" style="border:1px solid var(--gray-bd);border-radius:var(--radius-sm);margin-bottom:12px;cursor:pointer;background:var(--white);overflow:hidden">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px">
              <div>
                <div style="font-size:15px;font-weight:700">${p.product_name}</div>
                ${p.note?`<div style="font-size:12px;color:var(--gray)">${p.note}</div>`:''}
              </div>
              <div style="text-align:right">
                <div style="font-size:20px;font-weight:700;color:var(--teal)">${p.planned_quantity.toLocaleString()} <span style="font-size:13px;color:var(--gray)">${p.product_unit}</span></div>
                <div style="font-size:11px">${statusBadge(p.status)}</div>
              </div>
            </div>
            <div id="day-bom-${p.id}" style="border-top:1px solid var(--gray-lt);padding:8px 14px;font-size:12px;color:var(--gray-md)">원재료 소요량 확인 중…</div>
          </div>`).join('') : `<div style="text-align:center;padding:40px 0;color:var(--gray-md)">이 날짜에 등록된 생산계획이 없습니다<br/><button class="btn btn-outline btn-sm" style="margin-top:12px" onclick="openPlanModal('${dateStr}',null)">+ 계획 등록</button></div>`}
      </div>
    </div>`;

    // 각 계획 카드에 BOM 재고 현황 비동기 렌더링
    plans.forEach(p => loadDayPlanBomStatus(p.id, p.product_id, p.planned_quantity));
  }
}

// 생산계획 등록/편집 모달
let _planModal = null;
let _planBomTimer = null;

async function openPlanModal(dateStr, planId) {
  if (!_planModal) {
    _planModal = document.createElement('div');
    _planModal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:1100;display:flex;align-items:center;justify-content:center;padding:16px';
    document.body.appendChild(_planModal);
  }

  let plan = null;
  if (planId) {
    const byDate = await apiFetch(`/production-plans?date_from=${dateStr||'2000-01-01'}&date_to=${dateStr||'2099-12-31'}`) || [];
    plan = byDate.find(p => p.id === planId);
  }

  const products = _planProducts.length ? _planProducts : (await apiFetch('/master/products?status=active') || []);
  const today = dateStr || new Date().toISOString().split('T')[0];
  const statusOpts = ['planned','completed','cancelled'];
  const statusLabel = {planned:'계획',completed:'완료',cancelled:'취소'};

  _planModal.innerHTML = `
    <div style="background:#fff;border-radius:14px;padding:28px 32px;width:580px;max-width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,.18)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
        <div style="font-size:18px;font-weight:700">${planId ? '생산계획 수정' : '생산계획 등록'}</div>
        <button onclick="_planModal.style.display='none'" style="border:none;background:transparent;font-size:22px;cursor:pointer;color:var(--gray)">×</button>
      </div>
      <div class="fl"><div class="fl-lbl">날짜 <span class="req">*</span></div>
        <input id="pm-date" class="finput" type="date" value="${plan?.planned_date||today}"/></div>
      <div class="fl"><div class="fl-lbl">제품 <span class="req">*</span></div>
        <select id="pm-product" class="finput" onchange="loadPlanBomPreview()">
          <option value="">제품 선택</option>
          ${products.map(p=>`<option value="${p.id}"${plan?.product_id===p.id?' selected':''}>${p.name} (${p.unit})</option>`).join('')}
        </select>
      </div>
      <div class="fl"><div class="fl-lbl">계획 수량 <span class="req">*</span></div>
        <input id="pm-qty" class="finput" type="number" value="${plan?.planned_quantity||''}" placeholder="0" oninput="loadPlanBomPreview()"/></div>
      <div class="fl"><div class="fl-lbl">메모</div>
        <input id="pm-note" class="finput" value="${plan?.note||''}" placeholder="생산 지시 내용 등"/></div>
      <div class="fl"><div class="fl-lbl">상태</div>
        <select id="pm-status" class="finput">
          ${statusOpts.map(s=>`<option value="${s}"${(plan?.status||'planned')===s?' selected':''}>${statusLabel[s]}</option>`).join('')}
        </select>
      </div>

      <!-- 원재료 소요 예측 패널 -->
      <div id="plan-bom-preview" style="margin-top:16px"></div>

      <div style="display:flex;gap:8px;margin-top:16px">
        <button class="btn btn-primary" style="flex:1" onclick="savePlan(${planId||'null'})">저장</button>
        ${planId ? `<button class="btn btn-danger" onclick="deletePlan(${planId})">삭제</button>` : ''}
        <button class="btn btn-ghost" onclick="_planModal.style.display='none'">취소</button>
      </div>
    </div>`;
  _planModal.style.display = 'flex';

  // 기존 계획 수정 시 BOM 자동 로드
  if (plan?.product_id && plan?.planned_quantity) loadPlanBomPreview();
}

async function loadPlanBomPreview() {
  clearTimeout(_planBomTimer);
  _planBomTimer = setTimeout(async () => {
    const productId = document.getElementById('pm-product')?.value;
    const qty = parseFloat(document.getElementById('pm-qty')?.value || '0');
    const previewEl = document.getElementById('plan-bom-preview');
    if (!previewEl) return;

    if (!productId || !qty || qty <= 0) {
      previewEl.innerHTML = '';
      return;
    }

    previewEl.innerHTML = '<div style="padding:10px 0;color:var(--gray-md);font-size:13px">원재료 소요량 계산 중…</div>';
    const bom = await apiFetch(`/production-plans/bom-preview?product_id=${productId}&quantity=${qty}`);
    if (!bom) { previewEl.innerHTML = ''; return; }

    if (bom.length === 0) {
      previewEl.innerHTML = `
        <div style="background:var(--gray-lt);border-radius:8px;padding:12px 14px;font-size:13px;color:var(--gray)">
          이 제품에 등록된 BOM이 없습니다.
          <a href="javascript:void(0)" onclick="_planModal.style.display='none';goApp('prod-master')" style="color:var(--teal);font-weight:600">제품 관리</a>에서 BOM을 설정하면 원재료 소요량이 표시됩니다.
        </div>`;
      return;
    }

    const fmt = n => parseFloat(n.toFixed(2)).toLocaleString();
    const hasShortage = bom.some(b => !b.sufficient);

    previewEl.innerHTML = `
      <div style="border:1px solid ${hasShortage ? 'var(--red)' : 'var(--gray-bd)'};border-radius:8px;overflow:hidden">
        <div style="background:${hasShortage ? '#fff0f0' : 'var(--gray-lt)'};padding:9px 14px;font-size:13px;font-weight:700;color:${hasShortage ? 'var(--red)' : 'var(--dark)'}">
          ${hasShortage ? '⚠ 원재료 부족 — 재고 확인 필요' : '✓ 원재료 소요 예측 (재고 충분)'}
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead>
            <tr style="background:#f8f9fa">
              <th style="padding:7px 12px;text-align:left;font-weight:600;color:var(--gray);border-bottom:1px solid var(--gray-bd)">원재료</th>
              <th style="padding:7px 12px;text-align:right;font-weight:600;color:var(--gray);border-bottom:1px solid var(--gray-bd)">필요 수량</th>
              <th style="padding:7px 12px;text-align:right;font-weight:600;color:var(--gray);border-bottom:1px solid var(--gray-bd)">현재 재고</th>
              <th style="padding:7px 12px;text-align:center;font-weight:600;color:var(--gray);border-bottom:1px solid var(--gray-bd)">상태</th>
            </tr>
          </thead>
          <tbody>
            ${bom.map(b => `
              <tr style="${!b.sufficient ? 'background:#fff8f8' : ''}">
                <td style="padding:8px 12px;font-weight:${!b.sufficient ? '700' : '500'};color:${!b.sufficient ? 'var(--red)' : 'var(--dark)'};border-bottom:1px solid var(--gray-lt)">
                  ${b.material_name}
                </td>
                <td style="padding:8px 12px;text-align:right;font-weight:700;border-bottom:1px solid var(--gray-lt)">
                  ${fmt(b.required_qty)} <span style="color:var(--gray);font-size:11px">${b.unit}</span>
                </td>
                <td style="padding:8px 12px;text-align:right;color:${!b.sufficient ? 'var(--red)' : 'var(--teal)'};font-weight:600;border-bottom:1px solid var(--gray-lt)">
                  ${fmt(b.current_stock)} <span style="color:var(--gray);font-size:11px">${b.unit}</span>
                </td>
                <td style="padding:8px 12px;text-align:center;border-bottom:1px solid var(--gray-lt)">
                  ${b.sufficient
                    ? '<span style="color:var(--teal);font-weight:600;font-size:12px">✓ 충분</span>'
                    : `<span style="color:var(--red);font-weight:700;font-size:12px">⚠ ${fmt(Math.abs(b.shortage))} 부족</span>`}
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }, 350);
}

async function loadDayPlanBomStatus(planId, productId, plannedQty) {
  const el = document.getElementById(`day-bom-${planId}`);
  if (!el) return;
  const bom = await apiFetch(`/production-plans/bom-preview?product_id=${productId}&quantity=${plannedQty}`);
  if (!bom) { el.style.display = 'none'; return; }

  if (bom.length === 0) {
    el.innerHTML = '<span style="color:var(--gray-md)">BOM 미등록</span>';
    return;
  }

  const fmt = n => parseFloat(n.toFixed(2)).toLocaleString();
  const hasShortage = bom.some(b => !b.sufficient);
  const shortItems = bom.filter(b => !b.sufficient);

  if (hasShortage) {
    el.style.background = '#fff8f8';
    el.innerHTML = `<span style="color:var(--red);font-weight:700">⚠ 재고 부족:</span> `
      + shortItems.map(b => `<span style="color:var(--red)">${b.material_name} (${fmt(Math.abs(b.shortage))}${b.unit} 부족)</span>`).join(', ')
      + `<span style="color:var(--gray-md);margin-left:8px">— 충분: ${bom.filter(b=>b.sufficient).map(b=>b.material_name).join(', ')||'없음'}</span>`;
  } else {
    el.style.color = 'var(--teal)';
    el.innerHTML = `✓ 원재료 ${bom.length}종 모두 재고 충분 (${bom.map(b=>`${b.material_name} ${fmt(b.current_stock)}${b.unit}`).join(', ')})`;
  }
}

async function savePlan(planId) {
  const date = document.getElementById('pm-date')?.value;
  const product_id = document.getElementById('pm-product')?.value;
  const qty  = document.getElementById('pm-qty')?.value;
  const note = document.getElementById('pm-note')?.value;
  const status = document.getElementById('pm-status')?.value;
  if (!date || !product_id || !qty) { alert('날짜, 제품, 수량은 필수입니다.'); return; }
  const body = JSON.stringify({ product_id: parseInt(product_id), planned_date: date, planned_quantity: parseFloat(qty), note: note||null, status });
  const r = planId
    ? await apiFetch(`/production-plans/${planId}`, { method: 'PUT', body })
    : await apiFetch('/production-plans', { method: 'POST', body });
  if (r) { _planModal.style.display = 'none'; renderPlanCalendar(); }
}

async function deletePlan(planId) {
  if (!confirm('이 생산계획을 삭제하시겠습니까?')) return;
  const r = await apiFetch(`/production-plans/${planId}`, { method: 'DELETE' });
  if (r) { _planModal.style.display = 'none'; renderPlanCalendar(); }
}
