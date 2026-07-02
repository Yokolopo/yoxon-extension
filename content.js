(function () {
  'use strict';

  function extractJobDescription() {
    const selectors = [
      '.job-details-jobs-unified-top-card__job-title',
      '.jobs-description__content',
      '.jobs-box__html-content',
      '[class*="jobs-description"]',
      '.description__text',
    ];

    let jobTitle = '';
    let jobDesc = '';

    const titleEl = document.querySelector(
      'h1.job-details-jobs-unified-top-card__job-title, h1[class*="job-title"]'
    );
    if (titleEl) jobTitle = titleEl.innerText.trim();

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText.length > 100) {
        jobDesc = el.innerText.trim().slice(0, 4000);
        break;
      }
    }

    return { jobTitle, jobDesc };
  }

  // Try multiple strategies to find the apply button container.
  // LinkedIn frequently changes CSS class names, so we fall back through
  // text-match → known selectors rather than relying on a single class.
  function findApplyContainer() {
    // Strategy 1: find by button text content
    const allButtons = document.querySelectorAll('button');
    for (const btn of allButtons) {
      if (btn.innerText.trim().match(/^(Apply|Easy Apply)$/i)) {
        return btn.parentElement;
      }
    }

    // Strategy 2: common LinkedIn apply button classes (2024-2025)
    const selectors = [
      '.jobs-apply-button--top-card',
      '.jobs-unified-top-card__apply-button',
      '[data-job-id] .jobs-apply-button',
      '.job-details-jobs-unified-top-card__container--two-pane .jobs-apply-button',
      'button[aria-label*="Apply"]',
      'button[aria-label*="Easy Apply"]',
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el.parentElement || el;
    }

    return null;
  }

  function injectButton() {
    console.log('Yoxon: looking for Apply button...');
    if (document.getElementById('yoxon-btn')) return;

    const applyContainer = findApplyContainer();
    if (!applyContainer) {
      console.log('Yoxon: Apply container not found');
      return;
    }

    const btn = document.createElement('button');
    btn.id = 'yoxon-btn';
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2" style="margin-right:6px;vertical-align:middle">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
      Tailor CV with Yoxon
    `;
    btn.className = 'yoxon-tailor-btn';

    btn.addEventListener('click', () => {
      const { jobTitle, jobDesc } = extractJobDescription();

      if (!jobDesc) {
        alert('Could not extract job description. Please scroll down to load the full job posting first.');
        return;
      }

      const params = new URLSearchParams({
        jd: jobDesc.slice(0, 2000),
        title: jobTitle,
        source: 'linkedin-extension',
      });

      window.open(`https://yoxon.co/builder?${params.toString()}`, '_blank');
    });

    // applyContainer is the parent of the Apply button — append inside it
    // so our button sits alongside Apply in the same flex row
    applyContainer.appendChild(btn);
    console.log('Yoxon: button injected successfully');
  }

  // Debounced inject scheduler — collapses bursts of DOM mutations into
  // a single attempt after the dust settles
  let injectTimer = null;
  function scheduleInject() {
    clearTimeout(injectTimer);
    injectTimer = setTimeout(injectButton, 2000);
  }

  // Track URL so we detect SPA job-card clicks that don't reload the page
  let lastUrl = location.href;

  function onMutation() {
    // When LinkedIn navigates to a different job (URL param changes),
    // the old button is inside the replaced panel DOM and is already gone,
    // but reset lastUrl so the next navigation is also caught
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      // Remove stale button in case it survived a partial re-render
      const stale = document.getElementById('yoxon-btn');
      if (stale) stale.remove();
      console.log('Yoxon: URL changed, will reinject');
    }
    scheduleInject();
  }

  // Broad body observer catches all SPA navigations
  const bodyObserver = new MutationObserver(onMutation);
  bodyObserver.observe(document.body, { childList: true, subtree: true });

  // Also target the right-side job detail panel once it's in the DOM —
  // this fires more precisely when the panel content swaps on job-card clicks
  function tryObserveDetailPanel() {
    const detailPanel = document.querySelector(
      '.jobs-search__job-details, .job-view-layout, [class*="job-details"]'
    );
    if (detailPanel) {
      const panelObserver = new MutationObserver(onMutation);
      panelObserver.observe(detailPanel, { childList: true, subtree: true });
      console.log('Yoxon: observing detail panel', detailPanel.className);
    }
  }

  // Initial attempt + panel setup
  injectButton();
  tryObserveDetailPanel();
})();
