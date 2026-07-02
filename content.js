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

  function injectButton() {
    if (document.getElementById('yoxon-btn')) return;

    const applyContainer = document.querySelector(
      '.jobs-apply-button--top-card, .jobs-unified-top-card__apply-button, [class*="apply-button"]'
    );
    if (!applyContainer) return;

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

    applyContainer.parentNode.insertBefore(btn, applyContainer.nextSibling);
  }

  injectButton();

  // Re-run on LinkedIn SPA navigation
  const observer = new MutationObserver(() => {
    setTimeout(injectButton, 1000);
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
