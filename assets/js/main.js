document.addEventListener('DOMContentLoaded', function() {
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  
  if (mobileMenuToggle && mobileNav) {
    mobileMenuToggle.addEventListener('click', function() {
      mobileNav.classList.toggle('active');
    });
  }
  
  const navLinks = document.querySelectorAll('.mobile-nav-list a');
  navLinks.forEach(link => {
    link.addEventListener('click', function() {
      mobileNav.classList.remove('active');
    });
  });
  
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  const timelineSearch = document.querySelector('[data-timeline-search]');
  if (timelineSearch) {
    const toggle = timelineSearch.querySelector('.search-toggle');
    const overlay = timelineSearch.querySelector('.search-overlay');
    const input = timelineSearch.querySelector('.timeline-search-input');
    const results = Array.from(timelineSearch.querySelectorAll('.search-result'));
    const empty = timelineSearch.querySelector('.search-empty');
    const closeTriggers = timelineSearch.querySelectorAll('[data-search-close]');

    const escapeHTML = function(value) {
      return value.replace(/[&<>"']/g, function(char) {
        return {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        }[char];
      });
    };

    const escapeRegExp = function(value) {
      return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    const highlightText = function(value, query) {
      const safeValue = escapeHTML(value);
      if (!query) return safeValue;
      const pattern = new RegExp(escapeRegExp(query), 'gi');
      return safeValue.replace(pattern, '<mark>$&</mark>');
    };

    const getMatchedSnippet = function(item, query) {
      const fallback = item.dataset.searchExcerpt || '';
      const body = item.dataset.searchBody || fallback;
      const normalizedBody = body.toLowerCase();
      const index = normalizedBody.indexOf(query);

      if (index === -1) return fallback;

      const radius = 58;
      const start = Math.max(0, index - radius);
      const end = Math.min(body.length, index + query.length + radius);
      const prefix = start > 0 ? '...' : '';
      const suffix = end < body.length ? '...' : '';

      return prefix + body.slice(start, end) + suffix;
    };

    const resetResults = function() {
      results.forEach(item => {
        const title = item.querySelector('.search-result-title');
        const excerpt = item.querySelector('.search-result-excerpt');

        item.hidden = true;
        if (title) title.textContent = item.dataset.searchTitle || '';
        if (excerpt) excerpt.textContent = item.dataset.searchExcerpt || '';
      });

      if (empty) {
        empty.hidden = true;
      }
    };

    const updateResults = function(query) {
      const normalizedQuery = query.trim().toLowerCase();
      let visibleCount = 0;

      results.forEach(item => {
        const matched = Boolean(normalizedQuery) && item.dataset.searchText.includes(normalizedQuery);
        const title = item.querySelector('.search-result-title');
        const excerpt = item.querySelector('.search-result-excerpt');

        item.hidden = !matched;
        if (matched) {
          if (title) title.innerHTML = highlightText(item.dataset.searchTitle || '', normalizedQuery);
          if (excerpt) excerpt.innerHTML = highlightText(getMatchedSnippet(item, normalizedQuery), normalizedQuery);
          visibleCount += 1;
        } else {
          if (title) title.textContent = item.dataset.searchTitle || '';
          if (excerpt) excerpt.textContent = item.dataset.searchExcerpt || '';
        }
      });

      if (empty) {
        empty.hidden = !normalizedQuery || visibleCount > 0;
      }
    };

    const openSearch = function() {
      overlay.hidden = false;
      document.body.classList.add('is-search-open');
      toggle.setAttribute('aria-expanded', 'true');
      input.value = '';
      resetResults();
      window.requestAnimationFrame(() => input.focus());
    };

    const closeSearch = function() {
      overlay.hidden = true;
      document.body.classList.remove('is-search-open');
      toggle.setAttribute('aria-expanded', 'false');
      input.value = '';
      resetResults();
    };

    if (toggle && overlay && input) {
      toggle.addEventListener('click', openSearch);
      input.addEventListener('input', resetResults);
      input.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
          event.preventDefault();
          updateResults(input.value);
        }
      });
      closeTriggers.forEach(trigger => {
        trigger.addEventListener('click', closeSearch);
      });

      document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && !overlay.hidden) {
          closeSearch();
        }
      });
    }
  }

  const siteLayout = document.querySelector('.site-layout');
  const sidebarToggle = document.querySelector('.sidebar-toggle');
  if (siteLayout && sidebarToggle) {
    const storageKey = 'agent-sendiment-sidebar-collapsed';

    const setSidebarState = function(collapsed) {
      siteLayout.classList.toggle('is-sidebar-collapsed', collapsed);
      sidebarToggle.setAttribute('aria-expanded', String(!collapsed));
      sidebarToggle.textContent = collapsed ? '展开目录' : '收起目录';
      localStorage.setItem(storageKey, String(collapsed));
    };

    setSidebarState(localStorage.getItem(storageKey) === 'true');

    sidebarToggle.addEventListener('click', function() {
      setSidebarState(!siteLayout.classList.contains('is-sidebar-collapsed'));
    });
  }

  const tocSection = document.querySelector('[data-post-toc]');
  const tocList = document.querySelector('[data-post-toc-list]');
  const postContent = document.querySelector('.post-content');
  const writeClipboard = async function(value) {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      throw new Error('Clipboard API unavailable');
    }
    await navigator.clipboard.writeText(value);
  };

  if (postContent) {
    const codeBlocks = Array.from(postContent.querySelectorAll('pre'));
    codeBlocks.forEach(function(pre) {
      const block = pre.closest('.highlighter-rouge') || pre;
      if (block.querySelector('.code-copy-button')) return;

      block.classList.add('code-block');

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'code-copy-button';
      button.textContent = '复制';

      button.addEventListener('click', async function() {
        const code = pre.innerText.replace(/\n$/, '');
        try {
          await writeClipboard(code);
          button.textContent = '已复制';
          button.classList.remove('is-error');
          button.classList.add('is-copied');
        } catch (error) {
          button.textContent = '失败';
          button.classList.remove('is-copied');
          button.classList.add('is-error');
        }

        window.setTimeout(function() {
          button.textContent = '复制';
          button.classList.remove('is-copied', 'is-error');
        }, 1800);
      });

      block.insertBefore(button, block.firstChild);
    });
  }

  if (tocSection && tocList && postContent) {
    const headings = Array.from(postContent.querySelectorAll('h2, h3'));

    const ensureId = function(heading) {
      if (heading.id) return heading.id;
      const generatedId = heading.textContent
        .trim()
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
        .replace(/\s+/g, '-');
      heading.id = generatedId || ('section-' + Math.random().toString(36).slice(2, 8));
      return heading.id;
    };

    if (headings.length > 0) {
      const tocLinks = headings.map(function(heading) {
        const id = ensureId(heading);
        const item = document.createElement('li');
        item.className = 'post-toc-item post-toc-item-depth-' + heading.tagName.slice(1);

        const link = document.createElement('a');
        link.href = '#' + id;
        link.textContent = heading.textContent.trim();

        item.appendChild(link);
        tocList.appendChild(item);
        return { heading, link };
      });

      tocSection.hidden = false;

      const setActiveLink = function(id) {
        tocLinks.forEach(function(entry) {
          entry.link.classList.toggle('is-active', entry.heading.id === id);
        });
      };

      const observer = new IntersectionObserver(function(entries) {
        const visibleEntry = entries
          .filter(function(entry) { return entry.isIntersecting; })
          .sort(function(a, b) { return b.intersectionRatio - a.intersectionRatio; })[0];

        if (visibleEntry) {
          setActiveLink(visibleEntry.target.id);
        }
      }, {
        rootMargin: '0px 0px -70% 0px',
        threshold: [0.1, 0.4, 0.7]
      });

      tocLinks.forEach(function(entry) {
        observer.observe(entry.heading);
      });

      setActiveLink(tocLinks[0].heading.id);
    }
  }
});
