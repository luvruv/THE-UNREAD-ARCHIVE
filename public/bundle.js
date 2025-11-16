/* bundle.js - updated
   - keeps your ArchiveManager and rendering helpers
   - adds lightweight sign-in (localStorage), post submission, book suggestions & reviews
   - uses the existing highlightMatches helper and adds more rendering hooks
*/

(function () {
  'use strict';

  /* HTML escaping helpers (unchanged pattern) */
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

  /* highlightMatches: wraps matches with <span class="highlight"> */
  function highlightMatches(text, query) {
    if (!query) return text;
    try {
      const re = new RegExp(`(${escapeRegExp(query)})`, 'ig');
      return text.replace(re, '<span class="highlight">$1</span>');
    } catch (err) {
      return text;
    }
  }

  /* Auth helpers (simple localStorage-backed) */
  const Auth = {
    getCurrentUser() {
      try {
        return JSON.parse(localStorage.getItem('currentUser') || 'null');
      } catch (e) {
        return null;
      }
    },
    signIn(email) {
      const user = { email: String(email).toLowerCase(), signedAt: Date.now() };
      localStorage.setItem('currentUser', JSON.stringify(user));
      return user;
    },
    signOut() {
      localStorage.removeItem('currentUser');
    },
    isSignedIn() {
      return !!this.getCurrentUser();
    }
  };

  /* Posts (frontend persistent store) */
  const Posts = {
    key: 'unread_posts_v1',
    fetch() {
      try {
        return JSON.parse(localStorage.getItem(this.key) || '[]');
      } catch (e) {
        return [];
      }
    },
    save(posts) {
      localStorage.setItem(this.key, JSON.stringify(posts || []));
    },
    add(post) {
      const all = this.fetch();
      post.id = 'p' + (Date.now());
      post.createdAt = new Date().toISOString();
      all.unshift(post);
      this.save(all);
    }
  };

  /* Book suggestions & reviews */
  const BookData = {
    suggestionsKey: 'unread_book_suggestions_v1',
    reviewsPrefix: 'unread_book_reviews_', // + bookId
    fetchSuggestions() {
      try {
        return JSON.parse(localStorage.getItem(this.suggestionsKey) || '[]');
      } catch (e) { return []; }
    },
    addSuggestion(s) {
      const arr = this.fetchSuggestions();
      arr.unshift({ id: 's' + Date.now(), text: s, author: (Auth.getCurrentUser() || {}).email || 'Anonymous', createdAt: new Date().toISOString() });
      localStorage.setItem(this.suggestionsKey, JSON.stringify(arr));
    },
    fetchReviews(bookId) {
      try {
        return JSON.parse(localStorage.getItem(this.reviewsPrefix + bookId) || '[]');
      } catch (e) { return []; }
    },
    addReview(bookId, reviewText) {
      const key = this.reviewsPrefix + bookId;
      const arr = this.fetchReviews(bookId);
      arr.unshift({ id: 'r' + Date.now(), text: reviewText, author: (Auth.getCurrentUser() || {}).email || 'Anonymous', createdAt: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(arr));
    }
  };

  /* ArchiveManager unchanged core, but we ensure highlight usage & minor hooks */
  class ArchiveManager {
    constructor(options = {}) {
      this.container = document.querySelector(options.containerSelector);
      this.articles = Array.isArray(options.data?.articles) ? options.data.articles.slice() : [];
      this.books = Array.isArray(options.data?.books) ? options.data.books.slice() : [];
      this.searchInput = document.querySelector(options.searchInputSelector);
      this.clearBtn = options.clearBtnSelector ? document.querySelector(options.clearBtnSelector) : null;

      this.query = '';
      this.activeCategory = 'All';

      this.onSearch = this.onSearch.bind(this);
      this.onClear = this.onClear.bind(this);
      this.onContainerClick = this.onContainerClick.bind(this);

      this.init();
    }

    init() {
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

  /* renderArticlesPage: also injects posts into feed & post UI */
  function renderArticlesPage(articles = [], containerSelector = '.right-grid') {
    const container = document.querySelector(containerSelector) || document.querySelector('.feed');
    if (!container) return;
    container.innerHTML = '';

    // Left column posts (if containerSelector is .right-grid we render cards)
    // Render articles from JSON
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

    // Render user-submitted posts above/beside (if any)
    const posts = Posts.fetch();
    if (posts && posts.length) {
      const postWrapper = document.createElement('article');
      postWrapper.className = 'content-card';
      postWrapper.innerHTML = `<header><h2>Community Posts</h2></header>`;
      const list = document.createElement('div');
      list.style.display = 'flex';
      list.style.flexDirection = 'column';
      list.style.gap = '10px';
      posts.forEach(p => {
        const block = document.createElement('div');
        block.style.background = 'rgba(0,0,0,0.03)';
        block.style.padding = '10px';
        block.style.borderRadius = '6px';
        block.innerHTML = `<div style="font-weight:700">${escapeHtml(p.title || 'Untitled')}</div>
                           <div style="font-size:0.9rem;color:#ccc">${escapeHtml(p.author || 'Anonymous')} • ${new Date(p.createdAt).toLocaleString()}</div>
                           <div style="margin-top:6px">${escapeHtml(p.content || '')}</div>`;
        list.appendChild(block);
      });
      postWrapper.appendChild(list);
      // insert at top
      container.insertBefore(postWrapper, container.firstChild);
    }

    // subscribe button behavior (localStorage toggles)
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

  /* renderBooksPage: books + suggestions + reviews UI */
  function renderBooksPage(books = [], containerId = 'booksContainer') {
    const container = document.getElementById(containerId) || document.querySelector('.books-list');
    if (!container) return;

    container.innerHTML = ''; // clear and re-render

    // Header
    const header = document.createElement('header');
    header.innerHTML = `<h2>Books Collection</h2>`;
    container.appendChild(header);

    // Render each book with review section
    books.forEach(book => {
      const card = document.createElement('div');
      card.className = 'book-card';
      const imgSrc = book.image || '';
      const bookId = book.id || book.title.replace(/\s+/g, '_').toLowerCase();
      card.innerHTML = `
        <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(book.title)}">
        <div class="book-info" style="flex:1">
          <h3><a href="#" onclick="return false;">${escapeHtml(book.title)}</a></h3>
          <p>${escapeHtml(book.description || '')}</p>
          <div class="book-reviews" data-bookid="${escapeHtml(bookId)}" style="margin-top:12px"></div>
          <div style="margin-top:10px;display:flex;gap:8px;align-items:center">
            <textarea class="review-input" placeholder="Write a short review..." rows="2" style="flex:1;border-radius:8px;padding:8px;border:none;background:rgba(255,255,255,0.06);color:#fff"></textarea>
            <button class="review-btn" data-bookid="${escapeHtml(bookId)}">Post</button>
          </div>
        </div>
      `;
      container.appendChild(card);
    });

    // Suggestions box
    const suggCard = document.createElement('div');
    suggCard.className = 'book-card';
    suggCard.style.flexDirection = 'column';
    suggCard.style.alignItems = 'stretch';
    suggCard.innerHTML = `
      <h3 style="margin:0 0 8px 0;color:#ffda79">User Suggestions</h3>
      <p style="margin:0 0 8px 0">Suggest a book and the community will see it below.</p>
      <div style="display:flex;gap:8px;align-items:center">
        <input id="bookSuggestionInput" placeholder="Suggest a book title..." style="flex:1;padding:10px;border-radius:8px;border:none;background:rgba(255,255,255,0.06);color:#fff" />
        <button id="bookSuggestionBtn">Suggest</button>
      </div>
      <div id="bookSuggestionsList" style="margin-top:12px;display:flex;flex-direction:column;gap:8px"></div>
    `;
    container.appendChild(suggCard);

    // Render existing suggestions
    function renderSuggestions() {
      const list = document.getElementById('bookSuggestionsList');
      list.innerHTML = '';
      const suggestions = BookData.fetchSuggestions();
      if (!suggestions.length) {
        list.innerHTML = `<div style="color:#ddd">No suggestions yet — be the first!</div>`;
        return;
      }
      suggestions.forEach(s => {
        const el = document.createElement('div');
        el.style.background = 'rgba(0,0,0,0.03)';
        el.style.padding = '8px';
        el.style.borderRadius = '6px';
        el.innerHTML = `<div style="font-weight:700">${escapeHtml(s.text)}</div><div style="font-size:0.9rem;color:#ccc">${escapeHtml(s.author)} • ${new Date(s.createdAt).toLocaleString()}</div>`;
        list.appendChild(el);
      });
    }
    renderSuggestions();

    // wire suggestion button
    container.querySelector('#bookSuggestionBtn').addEventListener('click', () => {
      const val = document.getElementById('bookSuggestionInput').value.trim();
      if (!val) return alert('Please type a book title to suggest.');
      if (!Auth.isSignedIn()) {
        // redirect to signin with returnTo=book.html#suggest
        window.location.href = 'signin.html?returnTo=book.html#suggest';
        return;
      }
      BookData.addSuggestion(val);
      document.getElementById('bookSuggestionInput').value = '';
      renderSuggestions();
    });

    // render reviews per book
    function renderAllReviews() {
      const reviewWrappers = container.querySelectorAll('.book-reviews');
      reviewWrappers.forEach(wrapper => {
        const bookId = wrapper.dataset.bookid;
        const arr = BookData.fetchReviews(bookId);
        wrapper.innerHTML = '';
        if (!arr || !arr.length) {
          wrapper.innerHTML = `<div style="color:#ddd">No reviews yet.</div>`;
          return;
        }
        arr.forEach(r => {
          const div = document.createElement('div');
          div.style.padding = '8px';
          div.style.borderRadius = '6px';
          div.style.background = 'rgba(0,0,0,0.03)';
          div.style.marginBottom = '8px';
          div.innerHTML = `<div style="font-weight:700">${escapeHtml(r.author)}</div><div style="font-size:0.95rem;margin-top:6px">${escapeHtml(r.text)}</div><div style="font-size:0.8rem;color:#999;margin-top:6px">${new Date(r.createdAt).toLocaleString()}</div>`;
          wrapper.appendChild(div);
        });
      });
    }
    renderAllReviews();

    // review posting handler
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('.review-btn');
      if (!btn) return;
      const bookId = btn.dataset.bookid;
      const textarea = btn.parentNode.querySelector('.review-input');
      const val = textarea.value.trim();
      if (!val) return alert('Please write a short review before posting.');
      if (!Auth.isSignedIn()) {
        // redirect to signin and return to book page fragment for focus
        window.location.href = 'signin.html?returnTo=book.html#review-' + encodeURIComponent(bookId);
        return;
      }
      BookData.addReview(bookId, val);
      textarea.value = '';
      renderAllReviews();
    });
  }

  /* small function to attach clear button to search across pages if not wired */
  function wireGlobalSearch() {
    const searchInput = document.querySelector('#searchInput');
    const clearBtn = document.querySelector('#clearSearchBtn');
    if (!searchInput || !clearBtn) return;
    clearBtn.addEventListener('click', (e) => {
      searchInput.value = '';
      // dispatch input event so the ArchiveManager (if present) updates
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      searchInput.focus();
    });
  }

  /* Home featured rendering (unchanged) */
  function renderHomeFeatured(feature = {}) {
    const container = document.getElementById('homeFeatured') || document.querySelector('.book-page.right-page') || null;
    if (!container) return;
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
    container.appendChild(wrapper);
  }

  /* Expose to window for page scripts */
  if (!window.UnreadArchive) window.UnreadArchive = {};
  window.UnreadArchive.ArchiveManager = ArchiveManager;
  window.UnreadArchive.renderArticlesPage = renderArticlesPage;
  window.UnreadArchive.renderBooksPage = renderBooksPage;
  window.UnreadArchive.renderHomeFeatured = renderHomeFeatured;
  window.UnreadArchive.Auth = Auth;
  window.UnreadArchive.Posts = Posts;
  window.UnreadArchive.BookData = BookData;
  window.UnreadArchive.wireGlobalSearch = wireGlobalSearch;

})();
1