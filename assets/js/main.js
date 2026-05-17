document.addEventListener('DOMContentLoaded', function() {
  const input = document.querySelector('[data-search-input]');
  const results = document.querySelectorAll('.search-result');
  const empty = document.querySelector('.search-empty');
  const overlay = document.getElementById('searchOverlay');
  const toggle = document.querySelector('.search-toggle');

  const highlightText = function(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
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

  if (toggle && overlay) {
    toggle.addEventListener('click', function() {
      const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', !isExpanded);
      overlay.hidden = isExpanded;
      if (!isExpanded) {
        input.focus();
      }
    });

    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape' && !overlay.hidden) {
        toggle.setAttribute('aria-expanded', 'false');
        overlay.hidden = true;
      }
    });

    overlay.addEventListener('click', function(event) {
      if (event.target === overlay) {
        toggle.setAttribute('aria-expanded', 'false');
        overlay.hidden = true;
      }
    });
  }

  if (input) {
    input.addEventListener('input', resetResults);

    input.addEventListener('keydown', function(event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        updateResults(input.value);
      }
    });
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
          button.classList.remove('is-copied', 'is-error');
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
    const headings = Array.from(postContent.querySelectorAll('h1, h2, h3, h4'));

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
      const buildToc = function() {
        tocList.innerHTML = '';
        // Start with level 0 as root to accommodate H1 (level 1)
        const stack = [{ level: 0, container: tocList }];
        const tocItems = [];

        headings.forEach(heading => {
          const level = parseInt(heading.tagName.substring(1));
          const id = ensureId(heading);

          // Pop from stack until we find the parent level
          while (stack.length > 1 && stack[stack.length - 1].level >= level) {
            stack.pop();
          }

          const item = document.createElement('li');
          item.className = 'post-toc-item post-toc-item-depth-' + level;

          const link = document.createElement('a');
          link.href = '#' + id;
          link.textContent = heading.textContent.trim();
          item.appendChild(link);

          const parent = stack[stack.length - 1];
          let container = parent.container;
          
          if (level > parent.level) {
            const lastItem = container.lastElementChild;
            if (lastItem) {
              lastItem.classList.add('has-children');
              let subList = lastItem.querySelector('ul');
              if (!subList) {
                subList = document.createElement('ul');
                subList.className = 'post-toc-list';
                lastItem.appendChild(subList);
                
                const toggleBtn = document.createElement('span');
                toggleBtn.className = 'post-toc-toggle';
                toggleBtn.innerHTML = '▶';
                toggleBtn.addEventListener('click', (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  lastItem.classList.toggle('expanded');
                });
                lastItem.insertBefore(toggleBtn, lastItem.firstChild);
              }
              container = subList;
            }
          }

          container.appendChild(item);
          stack.push({ level: level, container: container });
          tocItems.push({ heading, item });
        });
        return tocItems;
      };

      const tocItems = buildToc();
      tocSection.hidden = false;

      const handleScroll = function() {
        const scrollPos = window.scrollY + 100;
        let activeIndex = -1;

        headings.forEach((heading, index) => {
          if (scrollPos >= heading.offsetTop) {
            activeIndex = index;
          }
        });

        tocItems.forEach((toc, index) => {
          const isActive = index === activeIndex;
          toc.item.classList.toggle('active', isActive);
          
          // Auto expand active parents
          if (isActive) {
            let parent = toc.item.parentElement;
            while (parent && parent !== tocList) {
              if (parent.tagName === 'LI') parent.classList.add('expanded');
              parent = parent.parentElement;
            }
          }
        });
      };

      window.addEventListener('scroll', handleScroll);
      handleScroll();
    }
  }
});
