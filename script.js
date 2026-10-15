/**
 * AURELIA ATELIER — Modern Interactive Functionality & Commerce Engine
 * Features:
 * - Universal WebP image sanitization & asset management
 * - Interactive Cart Drawer with Free-Shipping Progress Tracker
 * - Real-time Wishlist persistence with heart toggle animations
 * - Homepage Category Filtering
 * - Quick-Size 1-click cart addition
 * - Interactive Lookbook Hotspots & floating popover buy-cards
 * - Sticky mobile purchase bar for PDP
 * - Promo code / courtesy voucher engine
 * - Full checkout calculation & order authentication modal
 */

// Universal WebP Image Sanitizer: guarantees .webp format across all assets
function sanitizeImage(url) {
  if (!url) return 'Assets/logo.webp';
  return url.replace(/\.(jpg|jpeg|webP)$/i, '.webp');
}

// Initial Seed Cart Items using pristine WebP assets
const DEFAULT_CART = [
  {
    id: 'cashmere-trench-01',
    title: 'The Double-Breasted Cashmere Trench',
    price: 1280.00,
    size: 'M',
    color: 'Raw Ecru',
    image: 'Assets/Woman_wearing_tailored_blazer_2K_20261015150558.webp',
    quantity: 1,
    material: '100% Mongolian Cashmere'
  },
  {
    id: 'merino-knit-02',
    title: 'Merino Ribbed Turtleneck',
    price: 280.00,
    size: 'S',
    color: 'Charcoal',
    image: 'Assets/Accessories_flat-lay_on_beige_su__2K_20261015150619.webp',
    quantity: 1,
    material: 'Extra-fine 19.5 Micron Wool'
  }
];

// Free Shipping Threshold (in Euros)
const FREE_SHIPPING_THRESHOLD = 500.00;

// Centralized State Manager
class AtelierStore {
  constructor() {
    this.cart = this.loadCart();
    this.wishlist = this.loadWishlist();
    this.appliedDiscount = 0;
    this.selectedShippingCost = 0; // default complimentary ground
    this.currencySymbol = '€';
    this.init();
  }

  loadCart() {
    try {
      const stored = localStorage.getItem('aurelia_cart');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Sanitize legacy .jpg/.webP URLs to .webp
        return parsed.map((item) => ({
          ...item,
          image: sanitizeImage(item.image)
        }));
      }
      return [...DEFAULT_CART];
    } catch (e) {
      return [...DEFAULT_CART];
    }
  }

  saveCart() {
    try {
      localStorage.setItem('aurelia_cart', JSON.stringify(this.cart));
    } catch (e) {
      console.warn('LocalStorage unavailable', e);
    }
    this.updateBadges();
    this.renderCartDrawer();
    this.updateCheckoutSummary();
  }

  loadWishlist() {
    try {
      const stored = localStorage.getItem('aurelia_wishlist');
      return stored ? JSON.parse(stored) : ['cashmere-trench-01'];
    } catch (e) {
      return ['cashmere-trench-01'];
    }
  }

  saveWishlist() {
    try {
      localStorage.setItem('aurelia_wishlist', JSON.stringify(this.wishlist));
    } catch (e) {
      console.warn('LocalStorage unavailable', e);
    }
    this.updateBadges();
    this.syncWishlistIcons();
  }

  init() {
    this.updateBadges();
    this.renderCartDrawer();
    this.syncWishlistIcons();
  }

  addToCart(item) {
    const cleanImage = sanitizeImage(item.image);
    const existingIndex = this.cart.findIndex(
      (c) => c.id === item.id && c.size === item.size && c.color === item.color
    );

    if (existingIndex > -1) {
      this.cart[existingIndex].quantity += item.quantity || 1;
    } else {
      this.cart.push({
        id: item.id || 'item-' + Date.now(),
        title: item.title,
        price: parseFloat(item.price),
        size: item.size || 'M',
        color: item.color || 'Raw Ecru',
        image: cleanImage,
        quantity: item.quantity || 1,
        material: item.material || 'Organic Virgin Fiber'
      });
    }

    this.saveCart();
    showToast('Added to Atelier Bag', `${item.title} (Size: ${item.size || 'M'})`, 'shopping_bag');
    openCartDrawer();
  }

  removeFromCart(index) {
    if (this.cart[index]) {
      const title = this.cart[index].title;
      this.cart.splice(index, 1);
      this.saveCart();
      showToast('Item Removed', `${title} was removed from your bag.`, 'remove_shopping_cart');
    }
  }

  updateQuantity(index, newQty) {
    if (newQty <= 0) {
      this.removeFromCart(index);
    } else if (this.cart[index]) {
      this.cart[index].quantity = newQty;
      this.saveCart();
    }
  }

  toggleWishlist(productId, productTitle) {
    const index = this.wishlist.indexOf(productId);
    let added = false;
    if (index > -1) {
      this.wishlist.splice(index, 1);
      showToast('Archive Updated', `${productTitle || 'Piece'} removed from saved collection.`, 'favorite_border');
    } else {
      this.wishlist.push(productId);
      added = true;
      showToast('Saved to Archive', `${productTitle || 'Piece'} reserved in your private collection.`, 'favorite');
    }
    this.saveWishlist();
    return added;
  }

  isWishlisted(productId) {
    return this.wishlist.includes(productId);
  }

  syncWishlistIcons() {
    document.querySelectorAll('.card-wishlist-btn, .wishlist-toggle-btn').forEach((btn) => {
      const id = btn.getAttribute('data-product-id');
      if (id) {
        const isSaved = this.isWishlisted(id);
        if (isSaved) {
          btn.classList.add('active');
          const icon = btn.querySelector('.material-symbols-outlined');
          if (icon) icon.style.fontVariationSettings = "'FILL' 1";
        } else {
          btn.classList.remove('active');
          const icon = btn.querySelector('.material-symbols-outlined');
          if (icon) icon.style.fontVariationSettings = "'FILL' 0";
        }
      }
    });
  }

  getCartTotalCount() {
    return this.cart.reduce((total, item) => total + (item.quantity || 1), 0);
  }

  getCartSubtotal() {
    return this.cart.reduce((total, item) => total + item.price * (item.quantity || 1), 0);
  }

  updateBadges() {
    const cartCount = this.getCartTotalCount();
    const wishlistCount = this.wishlist.length;

    document.querySelectorAll('.cart-badge').forEach((el) => {
      el.textContent = cartCount;
      el.style.display = cartCount > 0 ? 'inline-flex' : 'none';
    });

    document.querySelectorAll('.wishlist-badge').forEach((el) => {
      el.textContent = wishlistCount;
      el.style.display = wishlistCount > 0 ? 'inline-flex' : 'none';
    });
  }

  renderCartDrawer() {
    const container = document.getElementById('cart-drawer-items');
    const subtotalEl = document.getElementById('cart-drawer-subtotal');
    if (!container) return;

    const subtotal = this.getCartSubtotal();

    if (this.cart.length === 0) {
      container.innerHTML = `
        <div class="py-16 text-center">
          <span class="material-symbols-outlined text-4xl text-outline mb-3">shopping_bag</span>
          <p class="font-headline-sm text-primary mb-1">Your bag is empty</p>
          <p class="font-body-sm text-on-surface-variant max-w-xs mx-auto mb-6">Explore our curated collections of architectural outerwear and cashmere knitwear.</p>
          <a href="index.html#collection" onclick="closeCartDrawer()" class="btn-primary">Discover Pieces</a>
        </div>
      `;
      if (subtotalEl) subtotalEl.textContent = '€0.00';
      return;
    }

    // Free Shipping Progress Calculation
    const progressPercent = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
    const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

    let html = `
      <!-- Shipping Threshold Progress Card -->
      <div class="free-shipping-card">
        <div class="flex justify-between items-center text-xs font-label-uppercase">
          <span>${remainingForFreeShipping > 0 ? `Add €${remainingForFreeShipping.toFixed(2)} for Free Courier` : '✓ Qualified for Free Worldwide Courier'}</span>
          <span class="text-secondary">${progressPercent}%</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width: ${progressPercent}%;"></div>
        </div>
      </div>

      <div class="space-y-4">
    `;

    this.cart.forEach((item, idx) => {
      html += `
        <div class="flex gap-4 p-3 bg-surface border border-outline-variant relative group">
          <div class="w-20 h-24 bg-surface-container overflow-hidden shrink-0 border border-outline-variant">
            <img src="${sanitizeImage(item.image)}" alt="${item.title}" class="w-full h-full object-cover">
          </div>
          <div class="flex-grow flex flex-col justify-between py-0.5">
            <div>
              <div class="flex justify-between items-start gap-2">
                <h4 class="font-title-md text-sm text-primary line-clamp-1">${item.title}</h4>
                <button type="button" onclick="window.atelierStore.removeFromCart(${idx})" class="text-outline hover:text-primary" title="Remove piece">
                  <span class="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
              <p class="font-body-sm text-xs text-secondary mt-0.5">${item.color} • Size ${item.size}</p>
            </div>
            <div class="flex justify-between items-center pt-2">
              <div class="flex items-center border border-outline-variant">
                <button type="button" class="w-6 h-6 flex items-center justify-center hover:bg-surface-container text-xs" onclick="window.atelierStore.updateQuantity(${idx}, ${item.quantity - 1})">-</button>
                <span class="w-8 text-center text-xs font-mono">${item.quantity}</span>
                <button type="button" class="w-6 h-6 flex items-center justify-center hover:bg-surface-container text-xs" onclick="window.atelierStore.updateQuantity(${idx}, ${item.quantity + 1})">+</button>
              </div>
              <span class="font-body-md font-medium text-primary">€${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          </div>
        </div>
      `;
    });
    html += '</div>';

    container.innerHTML = html;
    if (subtotalEl) {
      subtotalEl.textContent = `€${subtotal.toFixed(2)}`;
    }
  }

  updateCheckoutSummary() {
    const subtotalEl = document.getElementById('checkout-subtotal');
    const totalEl = document.getElementById('checkout-grand-total');
    const itemsCountEl = document.getElementById('checkout-items-count');
    const discountEl = document.getElementById('checkout-discount-row');
    const discountValEl = document.getElementById('checkout-discount-value');
    const listEl = document.getElementById('checkout-items-list');

    if (!subtotalEl || !totalEl) return;

    const subtotal = this.getCartSubtotal();
    const discount = this.appliedDiscount;
    const shipping = this.selectedShippingCost;
    const grandTotal = Math.max(0, subtotal - discount + shipping);

    subtotalEl.textContent = `€${subtotal.toFixed(2)}`;
    totalEl.textContent = `€${grandTotal.toFixed(2)}`;

    if (itemsCountEl) {
      itemsCountEl.textContent = `${this.getCartTotalCount()} Items`;
    }

    if (discountEl && discountValEl) {
      if (discount > 0) {
        discountEl.style.display = 'flex';
        discountValEl.textContent = `-€${discount.toFixed(2)}`;
      } else {
        discountEl.style.display = 'none';
      }
    }

    if (listEl) {
      if (this.cart.length === 0) {
        listEl.innerHTML = `<p class="text-sm text-secondary italic py-4">Your bag is currently empty.</p>`;
      } else {
        listEl.innerHTML = this.cart.map((item) => `
          <article class="flex gap-4 items-start group">
            <div class="w-20 h-[106px] flex-shrink-0 bg-surface border border-outline-variant overflow-hidden relative">
              <img class="w-full h-full object-cover" src="${sanitizeImage(item.image)}" alt="${item.title}">
              <span class="absolute top-1 right-1 bg-primary text-on-primary font-label-uppercase text-[9px] w-4 h-4 flex items-center justify-center">${item.quantity}</span>
            </div>
            <div class="flex-grow flex flex-col justify-between h-[106px] py-0.5">
              <div>
                <h3 class="font-body-md font-medium text-primary leading-snug">${item.title}</h3>
                <p class="font-body-sm text-secondary pt-0.5">Size ${item.size} • ${item.color}</p>
                <p class="font-body-sm text-on-surface-variant">${item.material}</p>
              </div>
              <div class="flex items-baseline justify-between pt-1">
                <span class="font-label-uppercase text-[10px] text-on-surface-variant">Archival Edition</span>
                <span class="font-body-md text-primary font-medium">€${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            </div>
          </article>
        `).join('<div class="border-t border-outline-variant/60 my-2"></div>');
      }
    }
  }
}

// Global Store Instance
window.atelierStore = new AtelierStore();

/* ==========================================================================
   UI Interactive Controls & Modals
   ========================================================================== */

// Cart Drawer Handlers
function openCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  const backdrop = document.getElementById('cart-backdrop');
  if (drawer && backdrop) {
    drawer.classList.add('active');
    backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  const backdrop = document.getElementById('cart-backdrop');
  if (drawer && backdrop) {
    drawer.classList.remove('active');
    backdrop.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Mobile Navigation Drawer Handlers
function openMobileMenu() {
  const drawer = document.getElementById('mobile-nav-drawer');
  const backdrop = document.getElementById('mobile-nav-backdrop');
  if (drawer && backdrop) {
    drawer.classList.add('active');
    backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeMobileMenu() {
  const drawer = document.getElementById('mobile-nav-drawer');
  const backdrop = document.getElementById('mobile-nav-backdrop');
  if (drawer && backdrop) {
    drawer.classList.remove('active');
    backdrop.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Search Modal Handlers
function openSearchModal() {
  const modal = document.getElementById('search-modal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    const input = document.getElementById('search-modal-input');
    if (input) setTimeout(() => input.focus(), 100);
  }
}

function closeSearchModal() {
  const modal = document.getElementById('search-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Toast Notifications
function showToast(title, message, icon = 'verified') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <span class="material-symbols-outlined text-[20px] text-secondary">${icon}</span>
    <div class="flex-grow">
      <div class="font-label-uppercase text-[11px] text-[#faf9f6] tracking-wider">${title}</div>
      <div class="font-body-sm text-xs text-outline-variant mt-0.5">${message}</div>
    </div>
    <button type="button" class="text-outline hover:text-white ml-2 text-sm" onclick="this.parentElement.remove()">
      <span class="material-symbols-outlined text-[16px]">close</span>
    </button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-leaving');
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}

// Quick Size Direct Add to Bag
function quickAddSize(productId, title, price, size, color, image, material) {
  window.atelierStore.addToCart({
    id: productId,
    title: title,
    price: price,
    size: size,
    color: color,
    image: sanitizeImage(image),
    material: material
  });
}

// Homepage Category Filter
function filterProducts(category, chipBtn) {
  // Update chip active classes
  document.querySelectorAll('.filter-chip').forEach((chip) => {
    chip.classList.remove('active');
  });
  if (chipBtn) chipBtn.classList.add('active');

  const cards = document.querySelectorAll('[data-product-category]');
  cards.forEach((card) => {
    const cardCat = card.getAttribute('data-product-category');
    if (category === 'all' || cardCat === category) {
      card.style.display = '';
      card.style.opacity = '1';
    } else {
      card.style.display = 'none';
      card.style.opacity = '0';
    }
  });
}

// Interactive Hotspot Popover Toggle
function toggleHotspot(index, event) {
  if (event) event.stopPropagation();
  const popover = document.getElementById(`hotspot-popover-${index}`);
  const isVisible = popover && popover.classList.contains('active');

  // Close all popovers first
  document.querySelectorAll('.hotspot-popover').forEach((p) => p.classList.remove('active'));

  if (!isVisible && popover) {
    popover.classList.add('active');
  }
}

// Product Page Gallery & Sizing Controls
let activeGalleryIndex = 0;
function focusImage(index) {
  activeGalleryIndex = index;
  const thumbBtns = document.querySelectorAll('.thumb-btn');
  thumbBtns.forEach((btn, i) => {
    if (i === index) {
      btn.classList.add('border-primary');
      btn.classList.remove('border-transparent');
    } else {
      btn.classList.remove('border-primary');
      btn.classList.add('border-transparent');
    }
  });

  const targetImage = document.getElementById(`gallery-img-${index}`);
  if (targetImage) {
    targetImage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

let selectedColorway = 'Raw Ecru';
function selectColor(btn, colorName) {
  selectedColorway = colorName;
  const label = document.getElementById('selected-color');
  if (label) label.textContent = colorName;

  document.querySelectorAll('.color-swatch-btn').forEach((b) => {
    b.classList.remove('border-primary', 'border-2');
    b.classList.add('border-outline-variant', 'border');
    b.setAttribute('aria-checked', 'false');
  });

  btn.classList.remove('border-outline-variant', 'border');
  btn.classList.add('border-primary', 'border-2');
  btn.setAttribute('aria-checked', 'true');
  showToast('Colorway Selected', `${colorName} selected.`, 'palette');
}

let selectedSizeOption = 'M';
function selectSize(btn, size) {
  selectedSizeOption = size;
  document.querySelectorAll('.size-btn').forEach((b) => {
    b.classList.remove('border-primary', 'border-2', 'bg-primary', 'text-surface', 'font-semibold');
    b.classList.add('border-outline-variant', 'border', 'text-on-surface');
    b.setAttribute('aria-checked', 'false');
  });

  btn.classList.remove('border-outline-variant', 'border', 'text-on-surface');
  btn.classList.add('border-primary', 'border-2', 'bg-primary', 'text-surface', 'font-semibold');
  btn.setAttribute('aria-checked', 'true');

  // Stock inventory dynamic text
  const stockEl = document.getElementById('size-stock-indicator');
  if (stockEl) {
    const stockMap = {
      'XS': 'Only 2 pieces remaining in size XS',
      'S': 'In Stock • 5 pieces ready for dispatch',
      'M': 'Only 3 pieces remaining in size M',
      'L': 'In Stock • 4 pieces ready for dispatch',
      'XL': 'Low Stock • 1 piece remaining in size XL'
    };
    stockEl.textContent = stockMap[size] || 'Handmade to order in Biella atelier';
  }
}

function toggleAccordion(drawerId) {
  const drawer = document.getElementById(drawerId);
  const icon = document.getElementById(`icon-${drawerId}`);
  if (!drawer) return;

  const isHidden = drawer.classList.contains('hidden');
  if (isHidden) {
    drawer.classList.remove('hidden');
    if (icon) icon.textContent = '—';
  } else {
    drawer.classList.add('hidden');
    if (icon) icon.textContent = '+';
  }
}

// Size Guide Modal
function openSizeGuide() {
  const modal = document.getElementById('size-guide-modal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeSizeGuide() {
  const modal = document.getElementById('size-guide-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Lightbox Zoom Modal
function openLightbox(imageSrc, altText) {
  const modal = document.getElementById('lightbox-modal');
  const img = document.getElementById('lightbox-image');
  const caption = document.getElementById('lightbox-caption');
  if (modal && img) {
    img.src = sanitizeImage(imageSrc);
    if (caption) caption.textContent = altText || 'Aurelia Atelier Archival View';
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeLightbox() {
  const modal = document.getElementById('lightbox-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Add main product to bag from PDP
function addCurrentProductToBag() {
  window.atelierStore.addToCart({
    id: 'cashmere-trench-01',
    title: 'The Double-Breasted Cashmere Trench',
    price: 1280.00,
    size: selectedSizeOption,
    color: selectedColorway,
    image: 'Assets/Woman_wearing_tailored_blazer_2K_20261015150558.webp',
    quantity: 1,
    material: '100% Mongolian Cashmere'
  });
}

// Checkout Specific Interactions
function initCheckout() {
  const shippingRadios = document.querySelectorAll('input[name="shipping_method"]');
  shippingRadios.forEach((radio) => {
    radio.addEventListener('change', (e) => {
      let cost = 0;
      if (e.target.value === 'express') cost = 35;
      else if (e.target.value === 'white_glove') cost = 75;

      window.atelierStore.selectedShippingCost = cost;
      window.atelierStore.updateCheckoutSummary();

      document.querySelectorAll('input[name="shipping_method"]').forEach((r) => {
        const parentLabel = r.closest('label');
        if (r.checked) {
          parentLabel.classList.add('border-primary');
          parentLabel.classList.remove('border-outline-variant');
        } else {
          parentLabel.classList.remove('border-primary');
          parentLabel.classList.add('border-outline-variant');
        }
      });
    });
  });

  // Payment Selection Tabs
  const tabCC = document.getElementById('tab-cc');
  const tabPP = document.getElementById('tab-pp');
  const tabKlarna = document.getElementById('tab-klarna');
  const ccFields = document.getElementById('card-fields-container');
  const ppFields = document.getElementById('paypal-fields-container');
  const klarnaFields = document.getElementById('klarna-fields-container');

  function setPaymentTab(activeTab, showContainer) {
    [tabCC, tabPP, tabKlarna].forEach((tab) => {
      if (tab) {
        tab.className = 'py-3 px-4 text-center font-label-uppercase text-xs transition-colors ' +
          (tab === activeTab ? 'bg-surface text-primary border-b-2 border-primary font-semibold' : 'bg-surface-container-low text-on-surface-variant hover:text-primary');
      }
    });
    [ccFields, ppFields, klarnaFields].forEach((c) => {
      if (c) c.style.display = (c === showContainer) ? 'block' : 'none';
    });
  }

  if (tabCC) tabCC.addEventListener('click', () => setPaymentTab(tabCC, ccFields));
  if (tabPP) tabPP.addEventListener('click', () => setPaymentTab(tabPP, ppFields));
  if (tabKlarna) tabKlarna.addEventListener('click', () => setPaymentTab(tabKlarna, klarnaFields));

  window.atelierStore.updateCheckoutSummary();
}

// Promo Code / Courtesy Voucher Apply
function applyVoucherCode() {
  const input = document.getElementById('voucher-code-input');
  if (!input) return;
  const code = input.value.trim().toUpperCase();

  if (code === 'ATELIER15' || code === 'AURELIA15') {
    const discount = window.atelierStore.getCartSubtotal() * 0.15;
    window.atelierStore.appliedDiscount = discount;
    window.atelierStore.updateCheckoutSummary();
    showToast('Courtesy Applied', '15% Seasonal Collector discount applied to order.', 'redeem');
    input.value = '';
  } else if (code === 'ATELIER10' || code === 'WELCOME10') {
    const discount = window.atelierStore.getCartSubtotal() * 0.10;
    window.atelierStore.appliedDiscount = discount;
    window.atelierStore.updateCheckoutSummary();
    showToast('Courtesy Applied', '10% Welcome gift applied to order.', 'redeem');
    input.value = '';
  } else if (code === 'VIP50') {
    window.atelierStore.appliedDiscount = 50.00;
    window.atelierStore.updateCheckoutSummary();
    showToast('Courtesy Applied', '€50 Private Invitation credit applied.', 'redeem');
    input.value = '';
  } else {
    showToast('Invalid Code', 'Please enter a valid invitation code (Try: AURELIA15 or ATELIER10)', 'error');
  }
}

// Order Completion Form Submission
function handleCheckoutSubmit(event) {
  event.preventDefault();
  const submitBtn = document.getElementById('complete-order-btn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <span class="inline-block animate-spin mr-2">⟳</span>
      <span>Authenticating Secure Transaction...</span>
    `;
  }

  setTimeout(() => {
    const modal = document.getElementById('order-confirmation-modal');
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      // Reset cart upon successful order
      window.atelierStore.cart = [];
      window.atelierStore.saveCart();
    }
  }, 1200);
}

// Currency Switcher
function switchCurrency(code) {
  showToast('Currency Selected', `Displaying prices in ${code}. Real-time ECB rates applied.`, 'payments');
}

// DOM Ready Initialization
document.addEventListener('DOMContentLoaded', () => {
  // Sticky header scroll elevation
  const header = document.querySelector('.atelier-header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }

  // Sticky Mobile PDP Bar Observer
  const pdpCta = document.getElementById('pdp-main-cta');
  const stickyMobileBar = document.getElementById('sticky-mobile-buybar');
  if (pdpCta && stickyMobileBar) {
    window.addEventListener('scroll', () => {
      const rect = pdpCta.getBoundingClientRect();
      if (rect.bottom < 0) {
        stickyMobileBar.classList.add('visible');
      } else {
        stickyMobileBar.classList.remove('visible');
      }
    });
  }

  // Close open popovers on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.hotspot-pin') && !e.target.closest('.hotspot-popover')) {
      document.querySelectorAll('.hotspot-popover').forEach((p) => p.classList.remove('active'));
    }
  });

  // Check if on Checkout page
  if (document.getElementById('checkout-grand-total')) {
    initCheckout();
  }

  // Sync wishlist icons
  window.atelierStore.syncWishlistIcons();
});
