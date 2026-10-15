/**
 * AURELIA ATELIER — Interactive Functionality & Commerce Engine
 * Coordinates Cart Drawer, Wishlist, Gallery switcher, Filters, and Checkout Funnel.
 */

// Initial Seed Cart Items
const DEFAULT_CART = [
  {
    id: 'cashmere-trench-01',
    title: 'The Double-Breasted Cashmere Trench',
    price: 1280.00,
    size: 'M',
    color: 'Raw Ecru',
    image: 'Assets/Woman_wearing_tailored_blazer_2K_20261015150558.webP',
    quantity: 1,
    material: '100% Mongolian Cashmere'
  },
  {
    id: 'merino-knit-02',
    title: 'Merino Ribbed Turtleneck',
    price: 280.00,
    size: 'S',
    color: 'Charcoal',
    image: 'Assets/Accessories_flat-lay_on_beige_su__2K_20261015150619.webP',
    quantity: 1,
    material: 'Extra-fine 19.5 Micron Wool'
  }
];

// State Manager
class AtelierStore {
  constructor() {
    this.cart = this.loadCart();
    this.wishlist = this.loadWishlist();
    this.appliedDiscount = 0;
    this.selectedShippingCost = 0; // default complimentary ground
    this.init();
  }

  loadCart() {
    try {
      const stored = localStorage.getItem('aurelia_cart');
      return stored ? JSON.parse(stored) : [...DEFAULT_CART];
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
  }

  init() {
    this.updateBadges();
    this.renderCartDrawer();
  }

  addToCart(item) {
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
        color: item.color || 'Natural',
        image: item.image,
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
      showToast('Wishlist Updated', `${productTitle || 'Piece'} removed from your archive.`, 'favorite_border');
    } else {
      this.wishlist.push(productId);
      added = true;
      showToast('Saved to Wishlist', `${productTitle || 'Piece'} reserved in your private archive.`, 'favorite');
    }
    this.saveWishlist();
    return added;
  }

  isWishlisted(productId) {
    return this.wishlist.includes(productId);
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

    let html = '<div class="space-y-4">';
    this.cart.forEach((item, idx) => {
      html += `
        <div class="flex gap-4 p-3 bg-surface border border-outline-variant relative group">
          <div class="w-20 h-24 bg-surface-container overflow-hidden shrink-0 border border-outline-variant">
            <img src="${item.image}" alt="${item.title}" class="w-full h-full object-cover">
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
      subtotalEl.textContent = `€${this.getCartSubtotal().toFixed(2)}`;
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

    // Render list items on checkout page if element exists
    if (listEl) {
      if (this.cart.length === 0) {
        listEl.innerHTML = `<p class="text-sm text-secondary italic py-4">Your bag is currently empty.</p>`;
      } else {
        listEl.innerHTML = this.cart.map((item) => `
          <article class="flex gap-4 items-start group">
            <div class="w-20 h-[106px] flex-shrink-0 bg-surface border border-outline-variant overflow-hidden relative">
              <img class="w-full h-full object-cover" src="${item.image}" alt="${item.title}">
              <span class="absolute top-1 right-1 bg-primary text-on-primary font-label-uppercase text-[9px] w-4 h-4 flex items-center justify-center">${item.quantity}</span>
            </div>
            <div class="flex-grow flex flex-col justify-between h-[106px] py-0.5">
              <div>
                <h3 class="font-body-md text-body-md font-medium text-primary leading-snug">${item.title}</h3>
                <p class="font-body-sm text-body-sm text-secondary pt-0.5">Size ${item.size} • ${item.color}</p>
                <p class="font-body-sm text-body-sm text-on-surface-variant">${item.material}</p>
              </div>
              <div class="flex items-baseline justify-between pt-1">
                <span class="font-label-uppercase text-[10px] text-on-surface-variant">Archival Edition</span>
                <span class="font-body-md text-body-md text-primary font-medium">€${(item.price * item.quantity).toFixed(2)}</span>
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
   UI Interactive Controls
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

// Product Page Interactive Features
let activeGalleryIndex = 0;
function focusImage(index) {
  activeGalleryIndex = index;
  // Update thumbnail buttons
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

  // Scroll or highlight primary image
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
    img.src = imageSrc;
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
    image: 'Assets/Woman_wearing_tailored_blazer_2K_20261015150558.jpg',
    quantity: 1,
    material: '100% Mongolian Cashmere'
  });
}

// Checkout Specific Interactions
function initCheckout() {
  // Shipping Radio Options
  const shippingRadios = document.querySelectorAll('input[name="shipping_method"]');
  shippingRadios.forEach((radio) => {
    radio.addEventListener('change', (e) => {
      let cost = 0;
      if (e.target.value === 'express') cost = 35;
      else if (e.target.value === 'white_glove') cost = 75;

      window.atelierStore.selectedShippingCost = cost;
      window.atelierStore.updateCheckoutSummary();

      // Style active radio container
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

  // Payment Tabs
  const tabCC = document.getElementById('tab-cc');
  const tabPP = document.getElementById('tab-pp');
  const ccFields = document.getElementById('card-fields-container');
  const ppFields = document.getElementById('paypal-fields-container');

  if (tabCC && tabPP) {
    tabCC.addEventListener('click', () => {
      tabCC.className = 'bg-surface py-3 px-4 text-center font-label-uppercase text-label-uppercase text-primary border-b-2 border-primary';
      tabPP.className = 'bg-surface-container-low py-3 px-4 text-center font-label-uppercase text-label-uppercase text-on-surface-variant hover:text-primary transition-colors';
      if (ccFields) ccFields.style.display = 'block';
      if (ppFields) ppFields.style.display = 'none';
    });

    tabPP.addEventListener('click', () => {
      tabPP.className = 'bg-surface py-3 px-4 text-center font-label-uppercase text-label-uppercase text-primary border-b-2 border-primary';
      tabCC.className = 'bg-surface-container-low py-3 px-4 text-center font-label-uppercase text-label-uppercase text-on-surface-variant hover:text-primary transition-colors';
      if (ccFields) ccFields.style.display = 'none';
      if (ppFields) ppFields.style.display = 'block';
    });
  }

  // Initial Summary Render
  window.atelierStore.updateCheckoutSummary();
}

// Promo Code Apply
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
  } else if (code === 'VIP50') {
    window.atelierStore.appliedDiscount = 50.00;
    window.atelierStore.updateCheckoutSummary();
    showToast('Courtesy Applied', '€50 Private Invitation credit applied.', 'redeem');
    input.value = '';
  } else {
    showToast('Invalid Code', 'Please enter a valid invitation code (Try: AURELIA15)', 'error');
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
    // Show Confirmation Modal
    const modal = document.getElementById('order-confirmation-modal');
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      // Clear cart
      window.atelierStore.cart = [];
      window.atelierStore.saveCart();
    }
  }, 1200);
}

// DOM Ready initialization
document.addEventListener('DOMContentLoaded', () => {
  // Sticky header scroll shadow
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

  // Check if on Checkout page
  if (document.getElementById('checkout-grand-total')) {
    initCheckout();
  }

  // Global Wishlist button listeners
  document.querySelectorAll('.wishlist-toggle-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.getAttribute('data-product-id') || 'product-item';
      const title = btn.getAttribute('data-product-title') || 'Atelier Garment';
      const isAdded = window.atelierStore.toggleWishlist(id, title);
      const icon = btn.querySelector('.material-symbols-outlined');
      if (icon) {
        icon.style.fontVariationSettings = isAdded ? "'FILL' 1" : "'FILL' 0";
      }
    });
  });
});
