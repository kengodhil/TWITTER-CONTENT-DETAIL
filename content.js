(function () {
  'use strict';

  const BADGE_CLASS = 'xcd-origin-badge';
  const PROCESSED = 'data-xcd-processed';

  function getOriginOwner(article) {
    // Repost indicator: "User reposted"
    const context = article.querySelector('[data-testid="socialContext"]');
    if (context) {
      const link = context.querySelector('a[href*="/"]');
      if (link) {
        const href = link.getAttribute('href') || '';
        const match = href.match(/\/([^\/]+)$/);
        if (match) return { handle: match[1], type: 'repost' };
      }
    }

    // Quote tweet – original is inside the nested article/card
    const quote = article.querySelector('[data-testid="quoteTweet"]') ||
                  article.querySelector('div[role="link"][href*="/status/"]');
    if (quote) {
      const userLink = quote.querySelector('a[href^="/"][role="link"]');
      if (userLink) {
        const href = userLink.getAttribute('href') || '';
        const match = href.match(/^\/([^\/\?]+)/);
        if (match) return { handle: match[1], type: 'quote' };
      }
    }

    // Normal post – author
    const authorLink = article.querySelector('a[href^="/"][role="link"][tabindex="-1"]') ||
                       article.querySelector('div[data-testid="User-Name"] a[href^="/"]');
    if (authorLink) {
      const href = authorLink.getAttribute('href') || '';
      const match = href.match(/^\/([^\/\?]+)/);
      if (match) return { handle: match[1], type: 'original' };
    }

    return null;
  }

  function getPostId(article) {
    const statusLink = article.querySelector('a[href*="/status/"]');
    if (statusLink) {
      const m = (statusLink.getAttribute('href') || '').match(/\/status\/(\d+)/);
      if (m) return m[1];
    }
    return null;
  }

  function addBadge(article, origin) {
    if (article.querySelector('.' + BADGE_CLASS)) return;

    const badge = document.createElement('div');
    badge.className = BADGE_CLASS;
    badge.innerHTML = `
      <span class="xcd-type">${origin.type}</span>
      <a href="https://x.com/${origin.handle}" target="_blank" rel="noopener">@${origin.handle}</a>
    `;
    badge.title = `Origin owner: @${origin.handle} (${origin.type})`;

    // Prefer placing near the user name / time area
    const target = article.querySelector('[data-testid="User-Name"]') ||
                   article.querySelector('div[dir="ltr"]') ||
                   article;
    target.appendChild(badge);
  }

  function processArticle(article) {
    if (article.hasAttribute(PROCESSED)) return;
    article.setAttribute(PROCESSED, '1');

    const origin = getOriginOwner(article);
    if (origin) {
      addBadge(article, origin);
    }
  }

  function scan() {
    document.querySelectorAll('article[data-testid="tweet"]').forEach(processArticle);
  }

  // Initial + observer for SPA navigation / infinite scroll
  scan();
  const obs = new MutationObserver(() => scan());
  obs.observe(document.body, { childList: true, subtree: true });

  // Re-scan on history changes (X is a SPA)
  let lastUrl = location.href;
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      setTimeout(scan, 800);
    }
  }, 1000);
})();