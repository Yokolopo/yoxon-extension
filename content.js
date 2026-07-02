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

  function findApplyButton() {
    // Search ALL buttons on the page
    const buttons = Array.from(document.querySelectorAll('button'));

    return buttons.find(btn => {
      const text = btn.innerText?.trim().toLowerCase();
      const label = btn.getAttribute('aria-label')?.toLowerCase() || '';
      return text === 'easy apply' ||
             text === 'apply' ||
             label.includes('easy apply') ||
             label.includes('apply now');
    });
  }

  function injectButton() {
    if (document.getElementById('yoxon-btn')) return;
    console.log('Yoxon: looking for Apply button...');

    const applyBtn = findApplyButton();
    if (!applyBtn) {
      console.log('Yoxon: Apply button not found');
      return;
    }

    console.log('Yoxon: found button:', applyBtn.innerText);

    const btn = document.createElement('button');
    btn.id = 'yoxon-btn';
    btn.className = 'yoxon-tailor-btn';
    btn.innerHTML = '⚡ Tailor CV with Yoxon';
    btn.addEventListener('click', () => {
      const { jobTitle, jobDesc } = extractJobDescription();
      if (!jobDesc) {
        alert('Scroll down to load the full job description first.');
        return;
      }
      const params = new URLSearchParams({
        jd: jobDesc.slice(0, 2000),
        title: jobTitle,
        source: 'linkedin-extension'
      });
      window.open('https://yoxon.co/builder?' + params.toString(), '_blank');
    });

    // Insert directly after the apply button
    applyBtn.insertAdjacentElement('afterend', btn);
    console.log('Yoxon: button injected ✓');
  }

  // Poll every 2 seconds for 60 seconds total
  // (LinkedIn SPA can take a long time to render job details)
  let pollCount = 0;
  const poll = setInterval(() => {
    injectButton();
    pollCount++;
    if (pollCount > 30 || document.getElementById('yoxon-btn')) {
      clearInterval(poll);
    }
  }, 2000);

  // Reset on URL change
  let lastUrl = location.href;
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      const old = document.getElementById('yoxon-btn');
      if (old) old.remove();
      pollCount = 0;
    }
  }, 1000);
})();
