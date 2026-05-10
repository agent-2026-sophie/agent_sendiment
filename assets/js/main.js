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
});
