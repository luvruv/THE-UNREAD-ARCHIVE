/* oop.js
   Corrected / final ArchiveManager + render helpers
   Exports a global window.UnreadArchive with:
     - ArchiveManager (class)
     - renderArticlesPage(articles, containerSelector)
     - renderBooksPage(books, containerId)
     - renderHomeFeatured(featureObj)
*/

(function () {
  'use strict';

  // Utility helpers
  function escapeHtml(unsafe) {
    if (unsafe === undefined || unsafe === null) return '';
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  function escapeRegExp(string) {
    return String(string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  function highlightMatches(text, query) {
    if (!query) return text;
    const re = new RegExp(`(${escapeRegExp(query)})`, 'ig');
    return text.replace(re, '<span class="highlight">$1</span>');
  }

  // ArchiveManager (OOP)
  class ArchiveManager {
    constructor(options = {}) {
      this.container = document.querySelector(options.containerSelector);
      this.articles = Array.isArray(options.data?.articles) ? options.data.articles.slice() : [];
      this.books = Array.isArray(options.data?.books) ? options.data.books.slice() : [];
      this.searchInput = document.querySelector(options.searchInputSelector);
      this.clearBtn = options.clearBtnSelector ? document.querySelector(options.clearBtnSelector) : null;

      this.query = '';
      this.activeCategory = 'All';

      // bind handlers
      this.onSearch = this.onSearch.bind(this);
      this.onClear = this.onClear.bind(this);
      this.onContainerClick = this.onContainerClick.bind(this);

      this.init();
    }

    init() {
      // Initial render
      this.renderFeed(this.articles);

      if (this.searchInput) this.searchInput.addEventListener('input', this.onSearch);
      if (this.clearBtn) this.clearBtn.addEventListener('click', this.onClear);
      if (this.container) this.container.addEventListener('click', this.onContainerClick);
    }

    onSearch(e) {
      this.query = (e.target.value || '').trim();
      const lower = this.query.toLowerCase();
      if (['all', 'culture', 'food', 'business', 'technology'].includes(lower)) {
        this.activeCategory = this.query ? (this.query.charAt(0).toUpperCase() + this.query.slice(1)) : 'All';
      } else {
        this.activeCategory = 'All';
      }
      this.renderFeed(this.articles);
    }

    onClear() {
      if (this.searchInput) this.searchInput.value = '';
      this.query = '';
      this.activeCategory = 'All';
      this.renderFeed(this.articles);
    }

    onContainerClick(e) {
      const btn = e.target.closest('.subscribe');
      if (!btn) return;
      const id = btn.dataset.id;
      if (!id) return;
      this.toggleSubscribe(id, btn);
    }

    filterItems(items) {
      const q = (this.query || '').trim().toLowerCase();
      return items.filter(item => {
        // category filter
        if (this.activeCategory && this.activeCategory !== 'All') {
          if (!item.tag || !item.tag.toLowerCase().includes(this.activeCategory.toLowerCase())) {
            return false;
          }
        }
        if (!q) return true;
        const combined = `${item.title || ''} ${item.excerpt || ''} ${item.author || ''}`.toLowerCase();
        return combined.includes(q);
      });
    }

    renderFeed(items) {
      if (!this.container) return;
      const filtered = this.filterItems(items);
      if (filtered.length === 0) {
        this.container.innerHTML = `<div style="color:#fff;padding:20px;">No results found.</div>`;
        return;
      }
      const q = this.query;
      const html = filtered.map(item => {
        const title = highlightMatches(escapeHtml(item.title), q);
        const excerpt = highlightMatches(escapeHtml(item.excerpt || ''), q);
        const image = escapeHtml(item.image || '');
        const tag = escapeHtml(item.tag || '');
        const author = escapeHtml(item.author || '');
        const subscribers = escapeHtml(item.subscribers || '');
        const readTime = escapeHtml(item.readTime || '');
        return `
          <article class="card">
            <div class="media" style="background-image:url('${image}')"></div>
            <div class="body">
              <div class="tag">${tag}</div>
              <h3 class="title">${title}</h3>
              <div class="meta">by ${author} — ${subscribers}</div>
              <p class="excerpt">${excerpt}</p>
              <div class="cta">
                <div class="flex muted">Read • ${readTime}</div>
                <button class="subscribe" data-id="${escapeHtml(item.id)}">Subscribe</button>
              </div>
            </div>
          </article>
        `;
      }).join('\n');
      this.container.innerHTML = html;

      // reflect subscription state
      this.container.querySelectorAll('.subscribe').forEach(btn => {
        const id = btn.dataset.id;
        if (localStorage.getItem(`subscribed_${id}`)) {
          btn.textContent = 'Subscribed';
          btn.style.background = '#ffda79';
          btn.style.color = '#111';
        } else {
          btn.textContent = 'Subscribe';
          btn.style.background = '';
          btn.style.color = '';
        }
      });
    }

    toggleSubscribe(id, button) {
      const key = `subscribed_${id}`;
      const now = !!localStorage.getItem(key);
      if (now) {
        localStorage.removeItem(key);
        button.textContent = 'Subscribe';
        button.style.background = '';
        button.style.color = '';
      } else {
        localStorage.setItem(key, '1');
        button.textContent = 'Subscribed';
        button.style.background = '#ffda79';
        button.style.color = '#111';
      }
    }
  }

  // Render helper: Articles page (grid)
  function renderArticlesPage(articles = [], containerSelector = '.right-grid') {
    const container = document.querySelector(containerSelector) || document.querySelector('.feed');
    if (!container) return;
    container.innerHTML = '';
    articles.forEach(article => {
      const card = document.createElement('article');
      card.className = 'content-card';
      card.innerHTML = `
        <header><h2>${escapeHtml(article.title)}</h2></header>
        <div style="display:flex;flex-direction:column;gap:8px">
          <div class="meta">${escapeHtml(article.tag || '')} — by ${escapeHtml(article.author || '')}</div>
          <p>${escapeHtml(article.excerpt || '')}</p>
          <div style="margin-top:auto;display:flex;justify-content:space-between;align-items:center">
            <small class="muted">${escapeHtml(article.subscribers || '')}</small>
            <button class="subscribe" data-id="${escapeHtml(article.id)}">Subscribe</button>
          </div>
        </div>
      `;
      container.appendChild(card);
    });

    // subscribe handling (idempotent)
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('.subscribe');
      if (!btn) return;
      const id = btn.dataset.id;
      const key = `subscribed_${id}`;
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        btn.textContent = 'Subscribe';
      } else {
        localStorage.setItem(key, '1');
        btn.textContent = 'Subscribed';
      }
    });
  }

  // Render helper: Books page (booksContainer is id)
  function renderBooksPage(books = [], containerId = 'booksContainer') {
    const container = document.getElementById(containerId) || document.querySelector('.books-list');
    if (!container) return;
    // Clear only the dynamic area (if page already has static book cards, we append below header)
    // If the container has a header element as first child, keep it; otherwise clear.
    let startClear = 0;
    if (container.querySelector('header')) {
      // remove all nodes after header
      const header = container.querySelector('header');
      while (header.nextSibling) header.parentNode.removeChild(header.nextSibling);
      startClear = 1;
    } else {
      container.innerHTML = '';
    }

    books.forEach(book => {
      const card = document.createElement('div');
      card.className = 'book-card';
      const imgSrc = book.image || '';
      card.innerHTML = `
        <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(book.title)}">
        <div class="book-info">
          <h3><a href="#" onclick="return false;">${escapeHtml(book.title)}</a></h3>
          <p>${escapeHtml(book.description || '')}</p>
        </div>
      `;
      container.appendChild(card);
    });
  }

  // Render helper: Home featured
  function renderHomeFeatured(feature = {}) {
    const container = document.getElementById('homeFeatured') || document.querySelector('.book-page.right-page') || null;
    if (!container) return;
    // Create a small feature block (append to container)
    const wrapper = document.createElement('div');
    wrapper.className = 'home-feature';
    wrapper.style.marginTop = '18px';
    wrapper.innerHTML = `
      <div style="background: rgba(0,0,0,0.03); padding:14px; border-radius:8px;">
        <h3 style="margin:0 0 8px 0;">${escapeHtml(feature.title || '')}</h3>
        <div style="font-size:0.9rem;color:#555;margin-bottom:8px">${escapeHtml(feature.type || '')} — ${escapeHtml(feature.author || '')}</div>
        <p style="margin:0">${escapeHtml(feature.summary || '')}</p>
      </div>
    `;
    // Append but do not remove existing text; this keeps layout unchanged
    container.appendChild(wrapper);
  }

  // Attach to global
  if (!window.UnreadArchive) window.UnreadArchive = {};
  window.UnreadArchive.ArchiveManager = ArchiveManager;
  window.UnreadArchive.renderArticlesPage = renderArticlesPage;
  window.UnreadArchive.renderBooksPage = renderBooksPage;
  window.UnreadArchive.renderHomeFeatured = renderHomeFeatured;

  // Expose for debugging (optional)
  // window.UnreadArchive._debug = { escapeHtml, highlightMatches };

})();
