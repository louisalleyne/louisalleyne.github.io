fetch("content.json")
  .then(response => response.json())
  .then(data => {
    // simple text bindings: elements with data-content="key" -> value (string)
    document.querySelectorAll("[data-content]").forEach(el => {
      const key = el.dataset.content;
      const value = key.split('.').reduce((o, k) => (o ? o[k] : undefined), data);
      if (typeof value === "string" || typeof value === "number") {
        el.textContent = value;
      }
    });

    // hero links and background
    if (data.hero) {
      const hero = data.hero;
      const header = document.getElementById('hero');
      if (hero.backgroundImage && header) {
        header.style.backgroundImage = `url('${hero.backgroundImage}')`;
        header.style.backgroundSize = 'cover';
        header.style.backgroundPosition = 'center';
      }
      // set link hrefs if present
      [['hero.link1', 'hero.link1'], ['hero.link2', 'hero.link2']].forEach(([attr, key]) => {
        const els = document.querySelectorAll(`[data-content-link="${attr}"], [data-content-link="${key}"]`);
        els.forEach(el => {
          const value = key.split('.').reduce((o, k) => (o ? o[k] : undefined), data);
          if (value && value.url) el.setAttribute('href', value.url);
        });
      });
    }

    // render partners list (array)
    if (Array.isArray(data.partners)) {
      renderPartners(data.partners);
    }

    // render news and products arrays
    if (Array.isArray(data.news)) renderNews(data.news);
    if (Array.isArray(data.products)) renderProducts(data.products);

    // render expertise and services
    if (Array.isArray(data.expertise)) renderExpertise(data.expertise);
    if (data.services) renderServices(data.services);

  })
  .catch(error => {
    console.error("Failed to load content:", error);
  });

// Render helpers (exports not needed; used internally)
// Exposed names for reference: [`renderPartners`](script.js), [`renderNews`](script.js), [`renderProducts`](script.js), [`renderExpertise`](script.js), [`renderServices`](script.js)
function renderPartners(partners) {
  const container = document.querySelector('[data-content="partners"]');
  if (!container) return;
  container.innerHTML = '';
  partners.forEach(p => {
    const wrap = document.createElement('a');
    wrap.className = 'partner-item';
    wrap.href = p.url || '#';
    const img = document.createElement('img');
    img.className = 'partner-logo';
    img.src = p.logo || '';
    img.alt = p.name || '';
    wrap.appendChild(img);
    container.appendChild(wrap);
  });
}

function renderNews(news) {
  const carousel = document.querySelector('[data-content="news"]') || document.getElementById('article-carousel');
  if (!carousel) return;
  carousel.innerHTML = '';
  news.forEach(item => {
    const a = document.createElement('a');
    a.href = item.link || '#';
    a.className = 'min-w-[400px] max-w-[400px] min-h-56 rounded-xl article-card m-6';
    a.style.backgroundImage = item.image ? `url('${item.image}')` : '';
    a.style.backgroundSize = 'cover';
    a.style.backgroundPosition = 'center';

    a.innerHTML = `
      <div class="article-overlay pointer-events-none" aria-hidden="true"></div>
      <div class="p-4 article-content flex flex-col justify-end h-full">
        <h3 class="text-lg font-semibold article-title">${escapeHtml(item.title || '')}</h3>
        <p class="text-gray-300 text-xs mb-2">${escapeHtml(item.date || '')}</p>
        <div class="flex justify-around items-center">
          <p class="article-excerpt text-xs">${escapeHtml(item.excerpt || '')}</p>
          <div class="mx-auto mt-2 text-white px-4">
            <i class="fa-solid fa-circle-arrow-right fa-lg" aria-hidden="true"></i>
          </div>
        </div>
      </div>
    `;
    carousel.appendChild(a);
  });
}

function renderProducts(products) {
  if (!Array.isArray(products)) return;

  // find candidate containers where product cards should go
  const selectors = [
    '[data-content="products"]',
    '.products-grid',
    'section.grid.grid-cols-5',
    '#product-list'
  ];
  const containers = [];
  selectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => containers.push(el));
  });
  // if none found, fallback to the first .product-container or body
  if (containers.length === 0) {
    const fallback = document.querySelector('.product-container') || document.body;
    containers.push(fallback);
  }

  const createCard = (prod) => {
    const a = document.createElement('a');
    a.href = prod.link || '#';
    a.className = 'bg-white w-56 h-82 rounded-xl product-card border border-gray-300 hover:border-[#09AFFF] hover:border-2 hover:shadow-lg transition-colors duration-200 ease-out flex flex-col';
    // image
    if (prod.image) {
      const img = document.createElement('img');
      img.src = prod.image;
      img.alt = prod.name || '';
      img.className = 'p-6 max-w-48 max-h-36 mx-auto object-contain';
      a.appendChild(img);
    }
    // content wrapper
    const content = document.createElement('div');
    content.className = 'px-4 product-content flex flex-col justify-between h-full';

    const top = document.createElement('div');

    const h3 = document.createElement('h3');
    h3.className = 'text-sm font-semibold product-title truncate';
    h3.textContent = prod.name || '';
    top.appendChild(h3);

    if (prod.description) {
      const p = document.createElement('p');
      p.className = 'text-gray-400 text-xs mb-4 truncate';
      p.textContent = prod.description;
      top.appendChild(p);
    }

    if (Array.isArray(prod.categories) && prod.categories.length) {
      const tags = document.createElement('div');
      tags.className = 'flex gap-2';
      prod.categories.forEach(cat => {
        const span = document.createElement('span');
        span.className = 'text-[0.5rem] rounded bg-gray-100 p-1';
        span.textContent = cat;
        tags.appendChild(span);
      });
      top.appendChild(tags);
    }

    content.appendChild(top);

    // arrow area (hidden unless hovered — CSS already present)
    const bottomWrap = document.createElement('div');
    bottomWrap.className = 'flex flex-col justify-between mt-4';
    const arrowWrap = document.createElement('div');
    arrowWrap.className = 'flex-1 text-right py-4 text-[#EB3F4D] h-full flex items-end justify-end';
    arrowWrap.innerHTML = '<i class="fa-solid fa-circle-arrow-right fa-lg" aria-hidden="true"></i>';
    bottomWrap.appendChild(arrowWrap);

    content.appendChild(bottomWrap);
    a.appendChild(content);
    return a;
  };

  // render into each container
  containers.forEach(container => {
    container.innerHTML = '';
    products.forEach(p => container.appendChild(createCard(p)));
  });

  // update product counts if present
  const countEl = document.getElementById('productCount');
  if (countEl) countEl.textContent = String(products.length);
}

/* --- NEW: renderExpertise --- */
function renderExpertise(expertise) {
  const section = document.getElementById('expertise');
  if (!section) return;
  // target the container that currently holds the three boxes
  const container = section.querySelector('div.flex');
  if (!container) return;
  container.innerHTML = '';
  expertise.forEach(entry => {
    const card = document.createElement('div');
    card.className = 'bg-neutral-300 rounded-xl p-6 w-72 h-72 text-center mx-auto flex flex-col items-center justify-center gap-4';
    const iconWrap = document.createElement('div');
    iconWrap.innerHTML = `<i class="${escapeHtml(entry.icon || '')} text-6xl" style="color: #283242;"></i>`;
    const p = document.createElement('p');
    p.className = 'mt-4 text-gray-600';
    p.textContent = entry.description || '';
    card.appendChild(iconWrap);
    card.appendChild(p);
    container.appendChild(card);
  });
}

/* --- NEW: renderServices --- */
function renderServices(services) {
  const section = document.getElementById('services');
  if (!section) return;
  // set title/description if present
  if (services.title) {
    const h = section.querySelector('h2');
    if (h) h.textContent = services.title;
  }
  if (services.description) {
    const p = section.querySelector('p');
    if (p) p.textContent = services.description;
  }
  // find the cards container (the large flex wrapper directly under section)
  const cardsContainer = section.querySelector(':scope > .flex');
  if (!cardsContainer) return;
  cardsContainer.innerHTML = '';
  (services.cards || []).forEach(card => {
    const a = document.createElement('a');
    a.className = 'bg-white border border-[#283242] rounded-xl p-4 w-96 h-96 text-center mx-auto flex flex-col items-center gap-4 hover:bg-blue-50 transition-colors duration-200 ease-out';
    a.href = card.href || '#';
    a.innerHTML = `
      ${card.image ? `<img src="${escapeHtml(card.image)}" alt="${escapeHtml(card.title || '')}" class="object-cover rounded-t-xl max-h-48 w-full">` : ''}
      <div class="flex flex-1 justify-center items-center my-auto mt-4">
        <div class="rounded-xl border border-[#283242] p-3 mr-4 flex items-center justify-center">
          <i class="${escapeHtml(card.icon || '')} text-3xl" style="color: #283242;"></i>
        </div>
        <div class="text-left">
          <h3 class="text-xl font-semibold text-[#283242] mb-2">${escapeHtml(card.title || '')}</h3>
          <p class="text-gray-600 text-xs">${escapeHtml(card.description || '')}</p>
        </div>
      </div>
    `;
    cardsContainer.appendChild(a);
  });
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}