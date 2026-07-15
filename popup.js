// Manifest V3's default CSP for extension pages blocks inline event
// handlers (onclick="...") — everything here is wired via addEventListener.
//
// This popup is a pure launcher: each tab is a plain outbound link to a
// yoxon.co tool, opened in a new tab. No fetch, no chrome.storage, no data
// ever leaves the browser from here — tab-switching is the only logic.

const TAB_NAMES = ['audit', 'ghost', 'studio'];

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
