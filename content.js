(function () {
  'use strict';

  console.log('Yoxon: content script loaded on', location.href);

  // Job detail panel — split view (search results + panel) or full page view.
  const DETAIL_PANEL_SELECTORS = [
    '.jobs-search__job-details--container',
    '.jobs-unified-top-card__content',
  ];

  function getDetailPanel() {
    for (const sel of DETAIL_PANEL_SELECTORS) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  function extractJobDescription() {
    const titleSelectors = [
      '.job-details-jobs-unified-top-card__job-title h1',
      '.jobs-unified-top-card__job-title h1',
      'h1[class*="job-title"]',
      'h1',
    ];

    const descSelectors = [
      '.jobs-description__content .jobs-box__html-content',
      '.jobs-description-content__text',
      '#job-details',
      '[class*="description__text"]',
      '.jobs-box__html-content',
    ];

    let jobTitle = '';
    let jobDesc = '';

    for (const sel of titleSelectors) {
      const el = document.querySelector(sel);
      if (el?.innerText?.trim()) { jobTitle = el.innerText.trim(); break; }
    }

    for (const sel of descSelectors) {
      const el = document.querySelector(sel);
      if (el?.innerText?.length > 100) {
        jobDesc = el.innerText.trim().slice(0, 4000);
        break;
      }
    }

    // Fallback: grab the largest plausible text block on the page.
    if (!jobDesc) {
      const candidates = Array.from(document.querySelectorAll('div'))
        .filter((d) => d.children.length < 5 && d.innerText?.length > 200);
      const largest = candidates.sort((a, b) => b.innerText.length - a.innerText.length)[0];
      if (largest) jobDesc = largest.innerText.trim().slice(0, 4000);
    }

    return { jobTitle, jobDesc };
  }

  // The external "Apply" button wraps its label and an arrow icon inside
  // the button — innerText (which respects rendered layout) can come back
  // as just whitespace/newlines from the icon's box, and `innerText ||
  // textContent` still picks that non-empty whitespace string over the
  // fallback, so the actual "Apply" text (present in textContent) never
  // gets checked. Fall back based on the *trimmed* value instead.
  function getButtonText(btn) {
    const inner = btn.innerText || ''
    const raw = inner.trim() ? inner : (btn.textContent || '')
    return raw.replace(/\s+/g, ' ').trim().toLowerCase()
  }

  // LinkedIn's "Easy Apply to X at Y" / "Apply to X at Y" aria-labels are
  // reliable in English, but both the label and button text are localized
  // ("candidature" shows up in the French UI) — and exact-string matching
  // previously missed real buttons here (see git history), so match loosely
  // on includes() rather than requiring an exact string.
  function isApplyButton(btn) {
    const label = (btn.getAttribute('aria-label') || '').toLowerCase();
    const text = getButtonText(btn);
    return (
      label.includes('easy apply') ||
      label.includes('apply') ||
      label.includes('candidature') ||
      text.includes('easy apply') ||
      text.includes('apply') ||
      text.includes('candidature')
    );
  }

  function isEasyApplyButton(btn) {
    const label = (btn.getAttribute('aria-label') || '').toLowerCase();
    const text = getButtonText(btn);
    return label.includes('easy apply') || text.includes('easy apply');
  }

  function findApplyButtons(root) {
    const buttons = Array.from(root.querySelectorAll('button'));
    const results = buttons.filter(isApplyButton);
    if (results.length) {
      console.log('Yoxon: found', results.length, 'apply button(s):',
        results.map((b) => ({ label: b.getAttribute('aria-label'), text: getButtonText(b) })));
    }
    return results;
  }

  function injectYoxonButton(applyBtn) {
    if (applyBtn.dataset.yoxonInjected) return;
    applyBtn.dataset.yoxonInjected = 'true';

    const isEasyApply = isEasyApplyButton(applyBtn);

    const btn = document.createElement('button');
    btn.className = 'yoxon-tailor-btn';
    btn.innerHTML = '⚡ Tailor CV with Yoxon';
    btn.title = isEasyApply
      ? 'Tailor your CV before applying via LinkedIn Easy Apply'
      : 'Tailor your CV before applying to this job';

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const { jobTitle, jobDesc } = extractJobDescription();

      if (!jobDesc) {
        // No JD extracted yet — still open the builder, user can paste manually.
        window.open('https://yoxon.co/builder?source=linkedin-extension', '_blank');
        return;
      }

      const params = new URLSearchParams({
        jd: jobDesc,
        title: jobTitle,
        source: isEasyApply ? 'linkedin-easy-apply' : 'linkedin-apply',
      });
      window.open('https://yoxon.co/builder?' + params.toString(), '_blank');
    });

    applyBtn.insertAdjacentElement('afterend', btn);
    console.log('Yoxon: injected button next to', applyBtn.getAttribute('aria-label') || getButtonText(applyBtn));
  }

  function scanAndInject() {
    findApplyButtons(getDetailPanel() || document).forEach(injectYoxonButton);
  }

  // Initial scan with retries — LinkedIn's SPA can take a while to render
  // job details after navigation.
  scanAndInject();
  setTimeout(scanAndInject, 1000);
  setTimeout(scanAndInject, 2500);
  setTimeout(scanAndInject, 5000);

  let lastUrl = location.href;
  let panelObserver = null;
  let watchedPanel = null;

  // Once the detail panel exists, scope the real observer to it instead of
  // the whole document — LinkedIn's SPA mutates document.body constantly
  // outside the job panel (feed, nav, ads), and scanning on every one of
  // those mutations is wasted work.
  function watchDetailPanel() {
    const panel = getDetailPanel();
    if (!panel || panel === watchedPanel) return;
    if (panelObserver) panelObserver.disconnect();
    watchedPanel = panel;
    panelObserver = new MutationObserver(scanAndInject);
    panelObserver.observe(panel, { childList: true, subtree: true });
    scanAndInject();
  }

  // The detail panel doesn't exist yet on first paint after a LinkedIn SPA
  // navigation, so document.body still needs watching — just to notice the
  // panel appearing and to catch URL changes, not to scan for buttons itself.
  const bodyObserver = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      console.log('Yoxon: URL changed, rescanning...');
      document.querySelectorAll('.yoxon-tailor-btn').forEach((b) => b.remove());
      document.querySelectorAll('[data-yoxon-injected]').forEach((b) => delete b.dataset.yoxonInjected);
      if (panelObserver) { panelObserver.disconnect(); panelObserver = null; watchedPanel = null; }
      setTimeout(scanAndInject, 1500);
      setTimeout(scanAndInject, 3000);
    }
    watchDetailPanel();
  });

  bodyObserver.observe(document.body, { childList: true, subtree: true });
  watchDetailPanel();
})();
