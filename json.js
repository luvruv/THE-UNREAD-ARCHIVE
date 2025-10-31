/* json.js
   Loads JSON data files and initializes ArchiveManager + page renders.
   - Expects `articles.json` (contains articles & books)
   - Expects `home.json` (contains home featured content)
   - After fetching, creates ArchiveManager on Archive page and calls renderers on Articles/Books/Home
*/

(async function () {
  'use strict';

  async function fetchJson(path) {
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error('Fetch failed: ' + res.status);
      return await res.json();
    } catch (err) {
      console.warn('Fetch failed for', path, '-', err.message);
      return null;
    }
  }

  const [articlesData, homeData] = await Promise.all([
    fetchJson('articles.json'),
    fetchJson('home.json')
  ]);

  const DEFAULT = {
    articles: [
      { id: 1, title: "After Babel", tag: "Culture • Staff pick", author: "Jane Doe", subscribers: "12k subscribers", readTime: "3 min", excerpt: "A fascinating newsletter about language, culture, and the tiny textures of everyday life.", image: "https://images.unsplash.com/photo-1508921912186-1d1a45ebb3c1?q=80&w=1200&auto=format&fit=crop" }
    ],
    books: [
      { id: "b1", title: "The Way of Nagomi", description: "Explains a unique Japanese concept that helps find effortless balance.", image: "./the way of nagomi.jpg" }
    ]
  };

  const DATA = {
    articles: (articlesData && articlesData.articles) ? articlesData.articles : DEFAULT.articles,
    books: (articlesData && articlesData.books) ? articlesData.books : DEFAULT.books,
    home: (homeData && homeData.feature) ? homeData.feature : { title: "Featured", summary: "No featured item loaded.", type: "Feature", author: "" }
  };

  // Initialize ArchiveManager on Archive page
  try {
    if (document.querySelector('.feed') && document.querySelector('#searchInput')) {
      const manager = new window.UnreadArchive.ArchiveManager({
        containerSelector: '.feed',
        data: { articles: DATA.articles, books: DATA.books },
        searchInputSelector: '#searchInput',
        clearBtnSelector: '#clearSearchBtn'
      });

      const categories = document.querySelectorAll('.cat');
      categories.forEach(cat => {
        cat.addEventListener('click', (e) => {
          const text = (e.target.textContent || '').trim();
          if (manager.searchInput) {
            manager.searchInput.value = text;
            manager.searchInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
        });
      });
    }
  } catch (err) {
    console.error('Archive initialization error:', err);
  }

  // Render Articles page (if present)
  try {
    if (document.querySelector('.right-grid')) {
      window.UnreadArchive.renderArticlesPage(DATA.articles, '.right-grid');

      const search = document.querySelector('#searchInput');
      if (search) {
        search.addEventListener('input', (e) => {
          const q = (e.target.value || '').trim().toLowerCase();
          const filtered = DATA.articles.filter(a => {
            return (a.title + ' ' + (a.excerpt||'') + ' ' + (a.author||'')).toLowerCase().includes(q);
          });
          window.UnreadArchive.renderArticlesPage(filtered, '.right-grid');
        });
      }
    }
  } catch (err) {
    console.error('Articles initialization error:', err);
  }

  // Render Books page (if present)
  try {
    if (document.getElementById('booksContainer') || document.querySelector('.books-list')) {
      window.UnreadArchive.renderBooksPage(DATA.books, 'booksContainer');

      const searchInput = document.querySelector('#searchInput');
      const clearBtn = document.getElementById('clearSearchBtn');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          const q = (e.target.value || '').trim().toLowerCase();
          const filtered = DATA.books.filter(b => (b.title + ' ' + (b.description||'')).toLowerCase().includes(q));
          window.UnreadArchive.renderBooksPage(filtered, 'booksContainer');
        });
      }
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          const s = document.querySelector('#searchInput');
          if (s) { s.value = ''; s.dispatchEvent(new Event('input', { bubbles: true })); }
        });
      }
    }
  } catch (err) {
    console.error('Books initialization error:', err);
  }

  // Render Home featured (if present)
  try {
    if (document.getElementById('homeFeatured') || document.querySelector('.book-page.right-page')) {
      window.UnreadArchive.renderHomeFeatured(DATA.home);
    }
  } catch (err) {
    console.error('Home featured error:', err);
  }

  console.log('json.js finished initialization — data loaded:', { articles: DATA.articles.length, books: DATA.books.length });
})();
