(function () {
  const data = window.PLH_DATA;
  const CART_KEY = 'plh_cart_v1';

  const formatMoney = (value) => `$${Number(value).toFixed(2)}`;

  const getCart = () => {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch {
      return [];
    }
  };

  const saveCart = (cart) => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
  };

  const findProduct = (id) => data.products.find((p) => p.id === id);

  const addToCart = (id) => {
    const cart = getCart();
    const existing = cart.find((item) => item.id === id);
    if (existing) existing.qty += 1;
    else cart.push({ id, qty: 1 });
    saveCart(cart);
    flashNotice('Added to cart');
  };

  const updateQuantity = (id, nextQty) => {
    let cart = getCart();
    if (nextQty <= 0) cart = cart.filter((item) => item.id !== id);
    else cart = cart.map((item) => item.id === id ? { ...item, qty: nextQty } : item);
    saveCart(cart);
    renderCartPage();
    renderCheckoutSummary();
  };

  const removeItem = (id) => updateQuantity(id, 0);

  const getDetailedCart = () => getCart().map((item) => ({
    ...item,
    product: findProduct(item.id)
  })).filter((item) => item.product);

  const getCartTotals = () => {
    const detailed = getDetailedCart();
    const subtotal = detailed.reduce((sum, item) => sum + item.qty * item.product.price, 0);
    const shipping = subtotal > 0 ? 7 : 0;
    const total = subtotal + shipping;
    return { detailed, subtotal, shipping, total };
  };

  const updateCartCount = () => {
    const count = getCart().reduce((sum, item) => sum + item.qty, 0);
    document.querySelectorAll('[data-cart-count]').forEach((el) => {
      el.textContent = count;
    });
  };

  const createProductCard = (product) => `
    <article class="product-card card">
      <div class="product-image">
        <img src="${product.image}" alt="${product.name}" loading="lazy" />
      </div>
      <div class="product-body">
        <span class="tag">${product.badge}</span>
        <div class="product-meta">
          <div>
            <h3>${product.name}</h3>
            <p>${product.description}</p>
          </div>
          <div class="price">${formatMoney(product.price)}</div>
        </div>
        <div class="product-actions">
          <button class="btn btn-primary" data-add-to-cart="${product.id}">Add to Cart</button>
        </div>
      </div>
    </article>
  `;

  const renderCategories = () => {
    const target = document.querySelector('[data-category-grid]');
    if (!target) return;
    target.innerHTML = data.categories.map((category) => `
      <article class="category-card card">
        <div class="category-icon" aria-hidden="true">${category.icon}</div>
        <div>
          <h3>${category.name}</h3>
          <p>${category.description}</p>
        </div>
        <a class="category-link" href="shop.html?category=${category.id}">Shop ${category.name}</a>
      </article>
    `).join('');
  };

  const renderFeaturedProducts = () => {
    const target = document.querySelector('[data-featured-products]');
    if (!target) return;
    target.innerHTML = data.products.filter((product) => product.featured).slice(0, 4).map(createProductCard).join('');
  };

  const renderTestimonials = () => {
    const target = document.querySelector('[data-testimonials]');
    if (!target) return;
    target.innerHTML = data.testimonials.map((item) => `
      <article class="testimonial-card card">
        <div class="quote">“${item.quote}”</div>
        <div class="quote-meta">${item.author}</div>
        <p>${item.detail}</p>
      </article>
    `).join('');
  };

  const renderShopPage = () => {
    const grid = document.querySelector('[data-shop-grid]');
    const filterWrap = document.querySelector('[data-filters]');
    if (!grid || !filterWrap) return;

    const query = new URLSearchParams(window.location.search);
    let activeCategory = query.get('category') || 'all';

    const filters = [{ id: 'all', name: 'All Products' }, ...data.categories.map(({ id, name }) => ({ id, name }))];
    filterWrap.innerHTML = filters.map((filter) => `
      <button class="filter-btn ${filter.id === activeCategory ? 'active' : ''}" data-filter="${filter.id}">${filter.name}</button>
    `).join('');

    const renderGrid = () => {
      const products = activeCategory === 'all'
        ? data.products
        : data.products.filter((product) => product.category === activeCategory);
      grid.innerHTML = products.map(createProductCard).join('');
      document.querySelectorAll('[data-filter]').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.filter === activeCategory);
      });
    };

    filterWrap.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-filter]');
      if (!btn) return;
      activeCategory = btn.dataset.filter;
      const url = new URL(window.location.href);
      if (activeCategory === 'all') url.searchParams.delete('category');
      else url.searchParams.set('category', activeCategory);
      window.history.replaceState({}, '', url);
      renderGrid();
    });

    renderGrid();
  };

  const renderCartPage = () => {
    const cartTarget = document.querySelector('[data-cart-items]');
    const summaryTarget = document.querySelector('[data-cart-summary]');
    if (!cartTarget || !summaryTarget) return;

    const { detailed, subtotal, shipping, total } = getCartTotals();

    if (!detailed.length) {
      cartTarget.innerHTML = `
        <div class="card center-empty">
          <h2>Your cart is waiting</h2>
          <p>Choose a few self-care favorites and come back when you are ready.</p>
          <a class="btn btn-primary" href="shop.html">Shop the Collection</a>
        </div>
      `;
      summaryTarget.innerHTML = `
        <div class="summary-card card">
          <h3>Order Summary</h3>
          <p>Your cart is currently empty.</p>
        </div>
      `;
      return;
    }

    cartTarget.innerHTML = detailed.map(({ product, qty }) => `
      <article class="cart-item">
        <div class="cart-thumb"><img src="${product.image}" alt="${product.name}" /></div>
        <div>
          <h3>${product.name}</h3>
          <p>${product.description}</p>
          <div class="qty-row">
            <button aria-label="Decrease quantity" data-decrease="${product.id}">−</button>
            <strong>${qty}</strong>
            <button aria-label="Increase quantity" data-increase="${product.id}">+</button>
          </div>
        </div>
        <div>
          <div class="price">${formatMoney(product.price * qty)}</div>
          <button class="btn btn-ghost" data-remove="${product.id}">Remove</button>
        </div>
      </article>
    `).join('');

    summaryTarget.innerHTML = `
      <div class="summary-card card">
        <h3>Order Summary</h3>
        <div class="summary-row"><span>Subtotal</span><strong>${formatMoney(subtotal)}</strong></div>
        <div class="summary-row"><span>Estimated shipping</span><strong>${formatMoney(shipping)}</strong></div>
        <div class="summary-row"><span>Total</span><strong>${formatMoney(total)}</strong></div>
        <div class="notice">Payment gateway setup will be connected by the client during final launch. This version keeps the shopping flow fully reviewable now.</div>
        <div style="display:grid;gap:12px;margin-top:16px;">
          <a class="btn btn-primary" href="checkout.html">Continue to Checkout</a>
          <a class="btn btn-secondary" href="shop.html">Keep Shopping</a>
        </div>
      </div>
    `;

    cartTarget.querySelectorAll('[data-decrease]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = getCart().find((entry) => entry.id === btn.dataset.decrease);
        updateQuantity(btn.dataset.decrease, (item?.qty || 1) - 1);
      });
    });
    cartTarget.querySelectorAll('[data-increase]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = getCart().find((entry) => entry.id === btn.dataset.increase);
        updateQuantity(btn.dataset.increase, (item?.qty || 0) + 1);
      });
    });
    cartTarget.querySelectorAll('[data-remove]').forEach((btn) => {
      btn.addEventListener('click', () => removeItem(btn.dataset.remove));
    });
  };

  const renderCheckoutSummary = () => {
    const target = document.querySelector('[data-checkout-summary]');
    if (!target) return;
    const { detailed, subtotal, shipping, total } = getCartTotals();

    if (!detailed.length) {
      target.innerHTML = `
        <div class="summary-card card">
          <h3>Checkout</h3>
          <p>Your cart is empty. Add products before moving to checkout.</p>
          <a class="btn btn-primary" href="shop.html">Return to Shop</a>
        </div>
      `;
      return;
    }

    target.innerHTML = `
      <div class="summary-card card">
        <h3>Your Order</h3>
        ${detailed.map(({ product, qty }) => `
          <div class="summary-row"><span>${product.name} × ${qty}</span><strong>${formatMoney(product.price * qty)}</strong></div>
        `).join('')}
        <div class="summary-row"><span>Subtotal</span><strong>${formatMoney(subtotal)}</strong></div>
        <div class="summary-row"><span>Estimated shipping</span><strong>${formatMoney(shipping)}</strong></div>
        <div class="summary-row"><span>Total</span><strong>${formatMoney(total)}</strong></div>
        <div class="notice">Checkout connection can be finalized with Stripe or the client’s preferred payment provider during launch. This handoff page keeps the customer flow clear and professional in the meantime.</div>
      </div>
    `;
  };

  const bindAddToCartButtons = () => {
    document.body.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-add-to-cart]');
      if (!btn) return;
      addToCart(btn.dataset.addToCart);
    });
  };

  const flashNotice = (message) => {
    let notice = document.querySelector('[data-flash-notice]');
    if (!notice) {
      notice = document.createElement('div');
      notice.dataset.flashNotice = 'true';
      notice.style.position = 'fixed';
      notice.style.right = '18px';
      notice.style.bottom = '18px';
      notice.style.zIndex = '60';
      notice.style.padding = '14px 18px';
      notice.style.borderRadius = '16px';
      notice.style.background = 'rgba(75, 34, 73, 0.96)';
      notice.style.color = 'white';
      notice.style.boxShadow = '0 16px 40px rgba(0,0,0,0.18)';
      notice.style.fontWeight = '700';
      document.body.appendChild(notice);
    }
    notice.textContent = message;
    notice.style.opacity = '1';
    clearTimeout(notice._timeout);
    notice._timeout = setTimeout(() => { notice.style.opacity = '0'; }, 1600);
  };

  const bindMobileNav = () => {
    const toggle = document.querySelector('[data-mobile-toggle]');
    const sheet = document.querySelector('[data-mobile-sheet]');
    if (!toggle || !sheet) return;
    toggle.addEventListener('click', () => sheet.classList.toggle('open'));
  };

  const bindCheckoutForm = () => {
    const form = document.querySelector('[data-checkout-form]');
    if (!form) return;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      flashNotice('Checkout request captured for review');
      form.reset();
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-brand-name]').forEach((el) => el.textContent = data.brand.shortName);
    document.querySelectorAll('[data-brand-email]').forEach((el) => el.textContent = data.brand.email);
    document.querySelectorAll('[data-brand-phone]').forEach((el) => el.textContent = data.brand.phone);
    renderCategories();
    renderFeaturedProducts();
    renderTestimonials();
    renderShopPage();
    renderCartPage();
    renderCheckoutSummary();
    bindAddToCartButtons();
    bindMobileNav();
    bindCheckoutForm();
    updateCartCount();
  });
})();
