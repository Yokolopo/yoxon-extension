// Manifest V3's default CSP for extension pages blocks inline event
// handlers (onclick="...") — everything here is wired via addEventListener.

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

const TAB_NAMES = ['cv', 'ghost', 'tracker'];

function showTab(name) {
  document.querySelectorAll('.tab').forEach((t, i) => {
    t.classList.toggle('active', TAB_NAMES[i] === name);
  });
  document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
}

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => showTab(tab.dataset.tab));
});

// Ghost Job Checker
async function checkGhostJob() {
  const jd = document.getElementById('jd-input').value.trim();
  const btn = document.getElementById('check-btn');
  const result = document.getElementById('ghost-result');

  if (jd.length < 50) {
    result.className = 'result error';
    result.textContent = 'Paste at least 50 characters of the job posting.';
    result.style.display = 'block';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Analyzing...';
  result.style.display = 'none';

  try {
    const res = await fetch('https://yoxon.co/api/ghost-job-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobText: jd }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not analyze job posting');

    const labels = { low: '✅ Looks legitimate', medium: '⚠️ Proceed with caution', high: '🚨 Likely ghost job' };
    result.className = 'result ' + data.riskLevel;
    result.innerHTML = `
      <div class="result-score">${labels[data.riskLevel]} — Risk ${data.score}/10</div>
      <div>${(data.flags || []).slice(0, 2).map(escapeHtml).join('<br>')}</div>
      ${data.riskLevel !== 'high' ? '<div style="margin-top:6px; font-size:11px; color:rgba(255,255,255,0.5)">' + escapeHtml(data.summary || '') + '</div>' : ''}
    `;
    result.style.display = 'block';
  } catch (err) {
    result.className = 'result error';
    result.innerHTML = `${escapeHtml(err.message || 'Could not connect.')} <a href="https://yoxon.co/ghost-checker" target="_blank" style="color:#00D4C5">Try on yoxon.co →</a>`;
    result.style.display = 'block';
  }

  btn.disabled = false;
  btn.textContent = 'Check again →';
}

document.getElementById('check-btn').addEventListener('click', checkGhostJob);

// Application Tracker (persisted via chrome.storage.local)
function loadApps() {
  chrome.storage.local.get(['yoxon_apps'], (result) => {
    renderApps(result.yoxon_apps || []);
  });
}

function addApplication() {
  const companyInput = document.getElementById('t-company');
  const roleInput = document.getElementById('t-role');
  const company = companyInput.value.trim();
  const role = roleInput.value.trim();
  const status = document.getElementById('t-status').value;

  if (!company) return;

  chrome.storage.local.get(['yoxon_apps'], (result) => {
    const apps = result.yoxon_apps || [];
    apps.unshift({
      id: Date.now(), company, role, status,
      date: new Date().toISOString().slice(0, 10),
    });
    chrome.storage.local.set({ yoxon_apps: apps }, () => {
      companyInput.value = '';
      roleInput.value = '';
      renderApps(apps);
    });
  });
}

document.getElementById('add-app-btn').addEventListener('click', addApplication);

function renderApps(apps) {
  const list = document.getElementById('apps-list');
  if (!apps.length) {
    list.innerHTML = '<div class="empty-state">No applications yet.<br>Log your first one above.</div>';
    return;
  }
  list.innerHTML = apps.slice(0, 8).map((app) => `
    <div class="app-item">
      <div class="app-company">${escapeHtml(app.company)}<br>
        <span style="color:rgba(255,255,255,0.4); font-size:10px">${escapeHtml(app.role || '')}</span>
      </div>
      <span class="app-status status-${escapeHtml(app.status)}">${escapeHtml(app.status)}</span>
    </div>
  `).join('');
}

loadApps();
