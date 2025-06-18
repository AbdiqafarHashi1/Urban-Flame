// script.js - v5 FINAL (Full-Stack Connected & Complete)

// --- API & Global Configuration ---
const API_BASE_URL = 'http://127.0.0.1:5000/api';
let menuConfig = {}; // Will be populated from the backend API
const CONFIG_ENDPOINT = `${API_BASE_URL}/config`;
const MENU_ENDPOINT   = `${API_BASE_URL}/menu`;

/*
// The original hardcoded menuConfig is now obsolete and replaced by an API call.
const menuConfig = {
    // ... all old hardcoded data from your original file ...
};
*/

// --- Global State Variables ---
let currentMeal = {};
let finalCart = [];
let editingMealId = null;
let currentUser = null; // Will hold user data from the backend
let currentOrderType = 'delivery';
let currentDiscount = { code: null, amount: 0 };
let currentGlobalPeriod = null;

// --- DOM Element References ---
let builderTitleEl, mealTypeSelectorEl, proteinSectionWrapper, baseSectionWrapper,
    toppingsSectionWrapper, saucesSectionWrapper, extrasSectionWrapper,
    proteinOptionsContainer, baseOptionsContainer, toppingOptionsContainer,
    sauceOptionsContainer, extraOptionsContainer, orderItemsEl, emptyOrderPlaceholderEl,
    currentItemTotalEl, currentMealActionTitleEl, finalCartItemsSidebarEl,
    emptyFinalCartPlaceholderSidebarEl, grandTotalSidebarEl, addToFinalCartBtn,
    checkoutBtnHeader, cartCountHeaderEl, checkoutBtnSidebar, mobileMenuToggle,
    mobileNavMenu, mobileMenuClose, checkoutModalEl, paymentFormEl, deliveryAddressSectionEl,
    pickupInfoSectionEl, modalFinalCartItemsEl, modalSubtotalEl, modalDeliveryFeeContainerEl,
    modalDeliveryFeeEl, modalDiscountContainerEl, modalDiscountAmountEl, modalGrandTotalEl,
    promoCodeInputEl, applyPromoBtnEl, promoCodeMessageEl, confirmationModalEl,
    confirmationEtaEl, standardItemsContainerEl, storeStatusIndicatorEl, userAuthSectionEl,
    orderHistoryLinkMobileEl, saveAddressCheckboxContainerEl, clearCurrentMealBtn, resetEntireMealBtn,
    dynamicMenuTitleEl, currentPeriodIndicatorEl, setMealsContainerEl;
/* ---------- TOAST HELPER ---------- */
function showToast(msg, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return alert(msg);                 // graceful fallback

  const t = document.createElement("div");
  t.className =
    `px-4 py-2 rounded shadow-lg text-white animate-fade-in-up
     ${type === "error" ? "bg-red-600" : "bg-emerald-600"}`;
  t.textContent = msg;
  container.appendChild(t);

  // auto-fade + remove
  setTimeout(() => t.classList.add("animate-fade-out"), 3500);
  setTimeout(() => t.remove(),                          4100);
}


// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
    assignDomElements();
    addStaticEventListeners();

    try {
        // 1. Fetch static config   (contains meal periods, fees, promo codes…)
        const cfgRes = await fetch(CONFIG_ENDPOINT);
        if (!cfgRes.ok) throw new Error(`Config HTTP ${cfgRes.status}`);
        menuConfig = await cfgRes.json();

        // 2. Fetch actual menu items
        const menuRes = await fetch(MENU_ENDPOINT);
        if (!menuRes.ok) throw new Error(`Menu HTTP ${menuRes.status}`);

        Object.assign(menuConfig, await menuRes.json());   // <-- merge, don’t overwrite
        // or: menuConfig = { ...menuConfig, ...(await menuRes.json()) };        

        await initializeUserSession();
        updateActiveMealPeriodAndUI();
        populateMealTypeSelector();

        setInterval(updateActiveMealPeriodAndUI, 5 * 60 * 1000);

    } catch (error) {
        console.error("Critical error initializing app:", error);
        document.body.innerHTML = '<div style="padding: 40px; text-align: center; color: #e63946;"><h1>Connection Error</h1><p>Could not connect to the Urban Flame server. Please try again later.</p></div>';
    }
}

// --- USER AUTHENTICATION (Connected to Backend) ---

async function initializeUserSession() {
    const token = localStorage.getItem('urbanFlameToken');
    if (token) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                currentUser = await response.json();
            } else {
                logoutUser(false); // Token is invalid or expired, logout silently
            }
        } catch (error) {
            console.error("Error validating session:", error);
            logoutUser(false); // Logout silently on network error
        }
    }
    updateUserAuthUI();
}

async function handleRegisterSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    if (!name || !email || !password) {
        showToast("Please fill out all fields."); return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await response.json();
        if (response.ok) {
            showToast('Registration successful! Please log in.');
            closeModal('register-modal');
            openModal('login-modal');
        } else {
            showToast(`Registration failed: ${data.msg}`);
        }
    } catch (error) {
        showToast('An error occurred. Please try again.');
    }
}

/* --------------------------------------------------------------------------
   LOGIN HANDLER
   -------------------------------------------------------------------------- */
async function handleLoginSubmit(e) {
  e.preventDefault();

  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();

  // quick client-side validation
  if (!email || !password) {
    showToast('Please enter both email and password.', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      // store JWT, refresh session UI, close modal, notify user
      localStorage.setItem('urbanFlameToken', data.access_token);
      await initializeUserSession();
      closeModal('login-modal');
      showToast('Login successful!');
    } else {
      // backend returned a 4xx/5xx with JSON {msg: "..."}
      showToast(`Login failed: ${data.msg}`, 'error');
    }
  } catch (err) {
    // network error or unexpected exception
    console.error('Login error:', err);
    showToast('An error occurred during login.', 'error');
  }
}

// --- USER LOGOUT ------------------------------------------------------------
function logoutUser(shouldToast = true) {      // renamed flag to avoid shadowing
  localStorage.removeItem('urbanFlameToken');
  currentUser = null;
  updateUserAuthUI();

  if (shouldToast) showToast('Logged out successfully!');
}

function updateUserAuthUI() {
    if (!userAuthSectionEl || !orderHistoryLinkMobileEl) return;
    if (currentUser) {
        userAuthSectionEl.innerHTML = `
            <span class="mr-1 sm:mr-2 text-xs sm:text-sm">Hi, ${currentUser.name.split(' ')[0]}!</span>
            <button onclick="openModal('order-history-modal'); loadOrderHistory();" class="hover:text-urbanYellow underline mr-1 sm:mr-2 text-xs sm:text-sm">History</button>
            <button onclick="logoutUser()" class="hover:text-urbanYellow underline text-xs sm:text-sm">Logout</button>
        `;
        orderHistoryLinkMobileEl.classList.remove('hidden');
    } else {
        userAuthSectionEl.innerHTML = `
            <button onclick="openModal('login-modal')" class="hover:text-urbanYellow underline mr-1 sm:mr-2 text-xs sm:text-sm">Login</button>
            <button onclick="openModal('register-modal')" class="hover:text-urbanYellow underline text-xs sm:text-sm">Register</button>
        `;
        orderHistoryLinkMobileEl.classList.add('hidden');
    }
}

// --- HELPER FUNCTION TO FIND ANY MENU ITEM ---
function findMenuItemById(itemId) {
    for (const categoryKey in menuConfig) {
        if (Array.isArray(menuConfig[categoryKey])) {
            const item = menuConfig[categoryKey].find(i => i.id === itemId);
            if (item) return item;
        }
    }
    return null; // Return null if not found in any category
}

// --- DOM ASSIGNMENT AND STATIC LISTENERS ---

function assignDomElements() {
    builderTitleEl = document.getElementById('builder-title');
    mealTypeSelectorEl = document.getElementById('meal-type-selector');
    proteinSectionWrapper = document.getElementById('protein-section-wrapper');
    baseSectionWrapper = document.getElementById('base-section-wrapper');
    toppingsSectionWrapper = document.getElementById('saladToppings-section-wrapper');
    saucesSectionWrapper = document.getElementById('sauces-section-wrapper');
    extrasSectionWrapper = document.getElementById('extras-section-wrapper');
    proteinOptionsContainer = document.getElementById('protein-options-container');
    baseOptionsContainer = document.getElementById('base-options-container');
    toppingOptionsContainer = document.getElementById('saladToppings-options-container');
    sauceOptionsContainer = document.getElementById('sauces-options-container');
    extraOptionsContainer = document.getElementById('extras-options-container');
    orderItemsEl = document.getElementById('order-items');
    emptyOrderPlaceholderEl = document.getElementById('empty-order-placeholder');
    currentItemTotalEl = document.getElementById('current-item-total');
    currentMealActionTitleEl = document.getElementById('current-meal-action-title');
    finalCartItemsSidebarEl = document.getElementById('final-cart-items');
    emptyFinalCartPlaceholderSidebarEl = document.getElementById('empty-final-cart-placeholder');
    grandTotalSidebarEl = document.getElementById('grand-total');
    addToFinalCartBtn = document.getElementById('add-to-final-cart-btn');
    checkoutBtnHeader = document.getElementById('checkout-btn-header');
    cartCountHeaderEl = document.getElementById('cart-count-header');
    checkoutBtnSidebar = document.getElementById('checkout-btn-sidebar');
    mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    mobileNavMenu = document.getElementById('mobile-nav-menu');
    mobileMenuClose = document.getElementById('mobile-menu-close');
    checkoutModalEl = document.getElementById('checkout-modal');
    paymentFormEl = document.getElementById('payment-form');
    deliveryAddressSectionEl = document.getElementById('delivery-address-section');
    pickupInfoSectionEl = document.getElementById('pickup-info-section');
    modalFinalCartItemsEl = document.getElementById('modal-final-cart-items');
    modalSubtotalEl = document.getElementById('modal-subtotal');
    modalDeliveryFeeContainerEl = document.getElementById('modal-delivery-fee-container');
    modalDeliveryFeeEl = document.getElementById('modal-delivery-fee');
    modalDiscountContainerEl = document.getElementById('modal-discount-container');
    modalDiscountAmountEl = document.getElementById('modal-discount-amount');
    modalGrandTotalEl = document.getElementById('modal-grand-total');
    promoCodeInputEl = document.getElementById('promo-code');
    applyPromoBtnEl = document.getElementById('apply-promo-btn');
    promoCodeMessageEl = document.getElementById('promo-code-message');
    confirmationModalEl = document.getElementById('confirmation-modal');
    confirmationEtaEl = document.getElementById('confirmation-eta');
    drinksSidesContainerEl  = document.getElementById('drinks-sides-container');
    storeStatusIndicatorEl = document.getElementById('store-status-indicator');
    userAuthSectionEl = document.getElementById('user-auth-section');
    orderHistoryLinkMobileEl = document.getElementById('order-history-link-mobile');
    saveAddressCheckboxContainerEl = document.getElementById('save-address-checkbox-container');
    clearCurrentMealBtn = document.getElementById('clear-current-meal-btn');
    resetEntireMealBtn = document.getElementById('reset-entire-meal-btn');
    dynamicMenuTitleEl = document.getElementById('dynamic-menu-title');
    currentPeriodIndicatorEl = document.getElementById('current-period-indicator');
    setMealsContainerEl = document.getElementById('set-meals-container');
}

function addStaticEventListeners() {
    document.getElementById('current-year').textContent = new Date().getFullYear();
    clearCurrentMealBtn.addEventListener('click', clearCurrentMealSelections);
    resetEntireMealBtn.addEventListener('click', resetCurrentMealBuilder);
    addToFinalCartBtn.addEventListener('click', addCurrentMealToFinalCart);
    checkoutBtnHeader.addEventListener('click', openCheckoutModal);
    checkoutBtnSidebar.addEventListener('click', openCheckoutModal);
    mobileMenuToggle.addEventListener('click', () => mobileNavMenu.classList.toggle('hidden'));
    mobileMenuClose.addEventListener('click', () => mobileNavMenu.classList.add('hidden'));
    document.querySelectorAll('#mobile-nav-menu a').forEach(link => {
        link.addEventListener('click', () => mobileNavMenu.classList.add('hidden'));
    });
    paymentFormEl.addEventListener('submit', handlePaymentFormSubmit);
    applyPromoBtnEl.addEventListener('click', () => applyPromoCode(true));
     document.querySelectorAll('input[name="orderType"]').forEach(radio => {
        radio.addEventListener('change', handleOrderTypeChange);
    });
    const feedbackLink = document.getElementById('feedback-link');
    const feedbackLinkMobile = document.getElementById('feedback-link-mobile');
    const feedbackForm = document.getElementById('feedback-form');

    if(feedbackLink) feedbackLink.addEventListener('click', (e) => { e.preventDefault(); openModal('feedback-modal'); });
    if(feedbackLinkMobile) feedbackLinkMobile.addEventListener('click', (e) => { e.preventDefault(); openModal('feedback-modal'); });
    if(feedbackForm) feedbackForm.addEventListener('submit', (e) => {
        e.preventDefault();
        showToast('Feedback submitted (simulated). Thank you!');
        closeModal('feedback-modal');
        e.target.reset();
    });

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    if(loginForm) loginForm.addEventListener('submit', handleLoginSubmit);
    if(registerForm) registerForm.addEventListener('submit', handleRegisterSubmit);

    const deliveryAreaInput = document.getElementById('delivery-area');
    const deliveryDetailsInput = document.getElementById('delivery-details');
    if(deliveryAreaInput) deliveryAreaInput.addEventListener('input', updateSaveAddressCheckbox);
    if(deliveryDetailsInput) deliveryDetailsInput.addEventListener('input', updateSaveAddressCheckbox);
}

// --- UI POPULATION & MEAL PERIODS (ALL UNCHANGED FROM YOUR FILE) ---

function updateSaveAddressCheckbox() {
    if (!saveAddressCheckboxContainerEl) return;
    saveAddressCheckboxContainerEl.innerHTML = '';
    if (currentUser && currentOrderType === 'delivery') {
        const deliveryAreaInput = document.getElementById('delivery-area');
        const deliveryDetailsInput = document.getElementById('delivery-details');
        if(!deliveryAreaInput) return;

        const currentArea = deliveryAreaInput.value.trim();
        const currentDetails = deliveryDetailsInput ? deliveryDetailsInput.value.trim() : '';
        if (!currentArea) return;

        const addressExists = currentUser.saved_addresses && currentUser.saved_addresses.some(addr =>
            addr.area === currentArea && addr.details === currentDetails
        );

        if (!addressExists) {
             saveAddressCheckboxContainerEl.innerHTML = `
                <label class="flex items-center text-sm mt-1 text-gray-700">
                    <input type="checkbox" id="save-address-checkout" class="form-checkbox text-urbanOrange mr-2 focus:ring-urbanOrange border-gray-300">
                    Save this address for future orders
                </label>`;
        }
    }
}

function getCurrentMealPeriodId() {
    if (!menuConfig.mealPeriods) return null;
    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;
    for (const period of menuConfig.mealPeriods) {
        if (currentHour >= period.from && currentHour < period.to) return period.id;
    }
    return null;
}

/* --------------------------------------------------------------------------
   STORE-STATUS CHIP  – shows “We’re Open!” / “We’re Closed”
   -------------------------------------------------------------------------- */
function updateStoreStatus() {
  if (!storeStatusIndicatorEl) return;             // element absent? bail

  currentGlobalPeriod = getCurrentMealPeriodId();  // breakfast / lunch / dinner id

  if (currentGlobalPeriod) {
    // ---------------- OPEN ----------------
    storeStatusIndicatorEl.textContent = "We're Open!";
    storeStatusIndicatorEl.className =
      "ml-3 px-2 py-1 text-xs rounded font-semibold text-white " +
      "bg-emerald-600 transition-colors duration-300 ease-in-out";
  } else {
    // ---------------- CLOSED --------------
    storeStatusIndicatorEl.textContent = "We're Closed";
    storeStatusIndicatorEl.className =
      "ml-3 px-2 py-1 text-xs rounded font-semibold text-white " +
      "bg-gray-500 transition-colors duration-300 ease-in-out";
  }
}

function updateActiveMealPeriodAndUI() {
    updateStoreStatus();
    const periodName = currentGlobalPeriod ? menuConfig.mealPeriods.find(p => p.id === currentGlobalPeriod).name : "Closed";
    if (dynamicMenuTitleEl) dynamicMenuTitleEl.textContent = currentGlobalPeriod ? `Today's ${periodName} Menu` : "Menu (Currently Closed)";
    if (currentPeriodIndicatorEl) currentPeriodIndicatorEl.textContent = currentGlobalPeriod ? `Currently Serving: ${periodName}` : "Please check our opening hours.";
    if (builderTitleEl) {
        if (currentGlobalPeriod && currentMeal && currentMeal.type) {
             builderTitleEl.textContent = `Customize Your ${periodName} ${currentMeal.type}`;
        } else if (currentGlobalPeriod) {
            builderTitleEl.textContent = `Build Your ${periodName} Meal`;
        } else {
            builderTitleEl.textContent = `Build Your Meal (Currently Closed)`;
        }
    }
    populateSetMealsForCurrentPeriod();
    populateStandardItems();
    if (currentMeal && currentMeal.type && !editingMealId) {
        const isProteinSectionVisible = proteinSectionWrapper && !proteinSectionWrapper.classList.contains('hidden');
        if (isProteinSectionVisible) {
            loadOptions('proteins', proteinOptionsContainer, handleProteinSelection, currentMeal.protein ? [currentMeal.protein] : []);
        }
        const isBaseSectionVisible = baseSectionWrapper && !baseSectionWrapper.classList.contains('hidden');
         if (isBaseSectionVisible && currentMeal.protein) {
            loadOptions('bases', baseOptionsContainer, handleSingleSelection, currentMeal.base ? [currentMeal.base] : []);
        }
    } else if (!currentMeal.type) {
        resetCurrentMealBuilder();
    }
     updateCurrentMealSummaryDisplay();
}

function populateSetMealsForCurrentPeriod() {
    if (!setMealsContainerEl) return;
    setMealsContainerEl.innerHTML = '';
    if (!currentGlobalPeriod) {
        setMealsContainerEl.innerHTML = `<p class="text-gray-500 col-span-full text-center py-8">Please check back during our service hours for today's meals!</p>`;
        return;
    }
    const periodName = menuConfig.mealPeriods.find(p => p.id === currentGlobalPeriod).name;
    const setMeals = menuConfig.set_meal || [];
    const pizzas = menuConfig.pizza || [];
    const specials = menuConfig.special || [];
    let mealsToShow = [...setMeals, ...pizzas, ...specials].filter(item => item.availableFor.includes(currentGlobalPeriod));

    if (mealsToShow.length === 0) {
        setMealsContainerEl.innerHTML = `<p class="text-gray-500 col-span-full text-center py-8">No special set meals or featured items currently available for ${periodName}.</p>`;
        return;
    }
    
    mealsToShow.forEach(item => {
        const card = document.createElement('div');
        card.className = `bg-urbanLight rounded-xl overflow-hidden custom-shadow transition hover:scale-105 flex flex-col ${item.soldOut ? 'disabled opacity-60 cursor-not-allowed' : ''}`;
        if(item.soldOut) card.title = "Currently unavailable";
        const itemPrice = item.price || 0;
        card.innerHTML = `
            <div class="h-48 bg-urbanDark flex items-center justify-center overflow-hidden"><i class="${item.icon || 'fas fa-utensils'} text-6xl text-urbanYellow"></i></div>
            <div class="p-4 sm:p-6 flex flex-col flex-grow">
                <h3 class="text-lg sm:text-xl font-bold text-urbanDark mb-2">${item.name} ${item.soldOut ? '<span class="text-xs text-red-500">(Sold Out)</span>': ''}</h3>
                <p class="text-gray-600 text-sm mb-3 flex-grow">${item.description || 'A delicious choice from our menu.'}</p>
                <button onclick="showItemDetails('${item.id}')" class="text-xs text-urbanOrange hover:underline mb-3 text-left self-start">More info/Allergens</button>
                <div class="flex justify-between items-center mt-auto pt-2 border-t border-gray-200">
                    <span class="text-urbanOrange font-bold text-md sm:text-lg">KES ${itemPrice.toFixed(2)}</span>
                    <button ${item.soldOut ? 'disabled' : ''} onclick="addStandardItemToCart('${item.id}', 1)" class="bg-urbanRed text-white px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm hover:bg-opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed">Add <i class="fas fa-plus ml-1"></i></button>
                </div>
            </div>`;
        setMealsContainerEl.appendChild(card);
    });
}

function populateStandardItems() {
    if (!drinksSidesContainerEl) return;
    drinksSidesContainerEl.innerHTML = '';
    if (!currentGlobalPeriod) {
       drinksSidesContainerEl.innerHTML = `<p class="text-gray-500 col-span-full text-center py-8">Available during service hours.</p>`;
        return;
    }
    const periodName = menuConfig.mealPeriods.find(p => p.id === currentGlobalPeriod).name;
    const drinks = menuConfig.drink || [];
    const sides = menuConfig.side || [];
    const desserts = menuConfig.dessert || [];
    const itemsToShow = [...drinks, ...sides, ...desserts].filter(item => item.availableFor.includes(currentGlobalPeriod));

    if (itemsToShow.length === 0) {
        drinksSidesContainerEl.innerHTML = `<p class="text-gray-500 col-span-full text-center py-8">No drinks, sides, or desserts listed for ${periodName} at the moment.</p>`;
        return;
    }

    itemsToShow.forEach(item => {
        const card = document.createElement('div');
        card.className = `bg-urbanLight rounded-xl overflow-hidden custom-shadow transition hover:scale-105 p-4 flex flex-col justify-between ${item.soldOut ? 'disabled opacity-60 cursor-not-allowed' : ''}`;
        if(item.soldOut) card.title = "Currently unavailable";
        const itemPrice = item.price || 0;
        card.innerHTML = `
            <div>
                <div class="h-24 bg-gray-200 flex items-center justify-center rounded-md mb-3 overflow-hidden"><i class="${item.icon || 'fas fa-utensils'} text-3xl text-urbanOrange"></i></div>
                <h3 class="text-md font-semibold text-urbanDark mb-1">${item.name}  ${item.soldOut ? '<span class="text-xs text-red-500">(Sold Out)</span>': ''}</h3>
                <p class="text-urbanOrange font-bold text-sm mb-3">KES ${itemPrice.toFixed(2)}</p>
            </div>
            <div class="flex items-center justify-between mt-auto pt-2 border-t border-gray-200">
                <div class="flex items-center">
                    <button ${item.soldOut ? 'disabled' : ''} onclick="updateStandardItemQuantity('${item.id}', -1, this)">-</button>
                    <input type="number" id="qty-${item.id}" value="1" min="1" class="quantity-input border-t border-b" readonly>
                    <button ${item.soldOut ? 'disabled' : ''} onclick="updateStandardItemQuantity('${item.id}', 1, this)">+</button>
                </div>
                <button ${item.soldOut ? 'disabled' : ''} onclick="addStandardItemToCart('${item.id}')" class="bg-urbanRed text-white px-3 py-1.5 rounded-full text-xs hover:bg-opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed">Add</button>
            </div>`;
        drinksSidesContainerEl.appendChild(card);
    });
}

function updateStandardItemQuantity(itemId, change, btnElement) {
    const qtyInput = btnElement.parentElement.querySelector(`#qty-${itemId}`);
    if (!qtyInput) return;
    let currentQty = parseInt(qtyInput.value);
    currentQty += change;
    if (currentQty < 1) currentQty = 1;
    qtyInput.value = currentQty;
}

function addStandardItemToCart(itemId, quantityFromButton = null) {
    const itemConfig = findMenuItemById(itemId);
    if (!itemConfig || itemConfig.soldOut) {
        showToast(`${itemConfig ? itemConfig.name : 'Item'} is currently unavailable.`); return;
    }
    let quantity = quantityFromButton;
    if (quantity === null) {
        const qtyInput = document.getElementById(`qty-${itemId}`);
        if (!qtyInput) { console.error(`Quantity input for ${itemId} not found.`); return; }
        quantity = parseInt(qtyInput.value);
    }
    if (isNaN(quantity) || quantity < 1) {
        showToast("Please enter a valid quantity."); return;
    }
    const existingCartItemIndex = finalCart.findIndex(cartItem => cartItem.id === itemId && cartItem.itemType === 'standard');
    if (existingCartItemIndex > -1) {
        finalCart[existingCartItemIndex].quantity += quantity;
        finalCart[existingCartItemIndex].totalPrice = finalCart[existingCartItemIndex].quantity * itemConfig.price;
    } else {
        finalCart.push({ id: itemConfig.id, name: itemConfig.name, price: itemConfig.price, quantity: quantity, totalPrice: itemConfig.price * quantity, itemType: 'standard', icon: itemConfig.icon, category: itemConfig.category });
    }
    updateFinalCartDisplay();
    showToast(`${quantity} x ${itemConfig.name} added to cart.`);
    if (quantityFromButton === null) {
        const qtyInput = document.getElementById(`qty-${itemId}`);
        if (qtyInput) qtyInput.value = 1;
    }
}

function populateMealTypeSelector() {
    if (!mealTypeSelectorEl || !menuConfig.mealTypes) return;
    mealTypeSelectorEl.innerHTML = '';
    menuConfig.mealTypes.forEach(type => {
        const card = document.createElement('div');
        card.className = 'ingredient-card bg-urbanLight rounded-lg p-4 cursor-pointer transition text-center';
        card.dataset.id = type.id;
        card.innerHTML = `<i class="${type.icon || 'fas fa-question-circle'} text-3xl text-urbanOrange mb-2"></i><h5 class="font-medium">${type.name}</h5>`;
        card.onclick = () => selectMealType(type.id, type.name);
        mealTypeSelectorEl.appendChild(card);
    });
}

function resetCurrentMealBuilder() {
    const mealIdToPreserve = editingMealId || currentMeal.id || Date.now();
    currentMeal = { id: mealIdToPreserve, type: null, typeId: null, protein: null, base: null, toppings: [], sauces: [], extras: [], totalPrice: 0, itemType: 'custom' };
    const periodName = currentGlobalPeriod ? menuConfig.mealPeriods.find(p => p.id === currentGlobalPeriod).name : "Meal";
    if (builderTitleEl) builderTitleEl.textContent = editingMealId ? `Editing Your ${currentMeal.type || periodName + ' Meal'}` : `Build Your ${periodName} Meal`;
    if(currentMealActionTitleEl) currentMealActionTitleEl.textContent = 'Your Current Meal';
    if(addToFinalCartBtn) addToFinalCartBtn.textContent = 'Add Meal to Cart';
    if (mealTypeSelectorEl) mealTypeSelectorEl.querySelectorAll('.ingredient-card.selected').forEach(c => c.classList.remove('selected'));
    [proteinSectionWrapper, baseSectionWrapper, toppingsSectionWrapper, saucesSectionWrapper, extrasSectionWrapper].forEach(section => { if (section) section.classList.add('hidden'); });
    [proteinOptionsContainer, baseOptionsContainer, toppingOptionsContainer, sauceOptionsContainer, extraOptionsContainer].forEach(container => { if (container) container.innerHTML = ''; });
    updateCurrentMealSummaryDisplay();
    if(addToFinalCartBtn) addToFinalCartBtn.disabled = true;
}

function clearCurrentMealSelections() {
    if (!currentMeal.typeId) { showToast("Please select a meal type first."); return; }
    const mealType = currentMeal.type;
    const mealTypeId = currentMeal.typeId;
    const mealId = editingMealId || currentMeal.id;
    const isEditing = !!editingMealId;
    resetCurrentMealBuilder();
    currentMeal.id = mealId;
    currentMeal.type = mealType;
    currentMeal.typeId = mealTypeId;
    const mealTypeCard = mealTypeSelectorEl.querySelector(`.ingredient-card[data-id="${mealTypeId}"]`);
    if (mealTypeCard) mealTypeCard.classList.add('selected');
    const periodName = currentGlobalPeriod ? menuConfig.mealPeriods.find(p => p.id === currentGlobalPeriod).name : "Meal";
    if (builderTitleEl) builderTitleEl.textContent = `Customize Your ${periodName} ${mealType}`;
    if (proteinSectionWrapper) proteinSectionWrapper.classList.remove('hidden');
    loadOptions('proteins', proteinOptionsContainer, handleProteinSelection);
    [baseSectionWrapper, toppingsSectionWrapper, saucesSectionWrapper, extrasSectionWrapper].forEach(section => { if(section) section.classList.add('hidden'); });
    if(isEditing) {
         if(currentMealActionTitleEl) currentMealActionTitleEl.textContent = `Editing Your ${currentMeal.type || 'Meal'}`;
         if(addToFinalCartBtn) addToFinalCartBtn.textContent = 'Update Meal in Cart';
    }
    updateCurrentMealSummaryDisplay();
}

function selectMealType(typeId, typeName) {
    if (currentMeal.typeId && currentMeal.typeId !== typeId && (currentMeal.protein || currentMeal.base || currentMeal.toppings.length > 0)) {
        if (!confirm("Changing meal type will reset your current selections. Are you sure?")) return;
    }
    if (currentMeal.typeId === typeId && !editingMealId && currentMeal.protein) return;
    const mealIdToPreserve = editingMealId || currentMeal.id || Date.now();
    const isEditing = !!editingMealId;
    resetCurrentMealBuilder();
    currentMeal.id = mealIdToPreserve;
    currentMeal.typeId = typeId;
    currentMeal.type = typeName;
    const periodName = currentGlobalPeriod ? menuConfig.mealPeriods.find(p => p.id === currentGlobalPeriod).name : "Meal";
    if (builderTitleEl) builderTitleEl.textContent = `Customize Your ${periodName} ${typeName}`;
    if(mealTypeSelectorEl) mealTypeSelectorEl.querySelectorAll('.ingredient-card').forEach(c => c.classList.remove('selected'));
    const selectedCard = mealTypeSelectorEl.querySelector(`.ingredient-card[data-id="${typeId}"]`);
    if (selectedCard) selectedCard.classList.add('selected');
    if (proteinSectionWrapper) proteinSectionWrapper.classList.remove('hidden');
    loadOptions('proteins', proteinOptionsContainer, handleProteinSelection);
    [baseSectionWrapper, toppingsSectionWrapper, saucesSectionWrapper, extrasSectionWrapper].forEach(section => { if (section) section.classList.add('hidden'); });
    if(isEditing) {
        if(currentMealActionTitleEl) currentMealActionTitleEl.textContent = `Editing Your ${currentMeal.type || 'Meal'}`;
        if(addToFinalCartBtn) addToFinalCartBtn.textContent = 'Update Meal in Cart';
    } else {
        if(currentMealActionTitleEl) currentMealActionTitleEl.textContent = 'Your Current Meal';
        if(addToFinalCartBtn) addToFinalCartBtn.textContent = 'Add Meal to Cart';
    }
    updateCurrentMealSummaryDisplay();
}

function loadOptions(categoryKey, container, selectionHandler, currentSelections = []) {
    if (!container) { console.error("Container not found for", categoryKey); return; }
    container.innerHTML = '';
    if (!currentGlobalPeriod) {
        container.innerHTML = `<p class="text-gray-500 p-4 text-center">The kitchen is closed.</p>`;
        return;
    }
    let itemsToLoad = menuConfig[categoryKey] || [];
    itemsToLoad = itemsToLoad.filter(item =>
        item.availableFor
            .map(p => p.trim().toLowerCase())
            .includes(currentGlobalPeriod.trim().toLowerCase())
    );    
    if (itemsToLoad.length === 0) {
        container.innerHTML = `<p class="text-gray-500 p-4 text-center">No options available.</p>`;
        return;
    }
    itemsToLoad.forEach(item => {
        const card = document.createElement('div');
        card.className = `ingredient-card bg-urbanLight rounded-lg p-3 cursor-pointer transition ${item.soldOut ? 'disabled' : ''}`;
        card.dataset.id = item.id;
        if(item.soldOut) card.title = "Currently unavailable";
        let content = `<div class="flex items-center"><div class="w-10 h-10 bg-urbanYellow bg-opacity-20 rounded-full flex items-center justify-center mr-3 shrink-0"><i class="${item.icon || 'fas fa-question-circle'} text-urbanOrange text-lg"></i></div><div class="flex-grow"><h5 class="font-medium text-sm text-left">${item.name} ${item.soldOut ? '<span class="text-xs text-red-500">(Sold Out)</span>': ''}</h5>`;
        const itemPrice = item.price || 0;
        const basePrice = item.attributes?.basePrice;
        if (basePrice) {
            content += `<p class="text-xs text-gray-500 text-left">KES ${basePrice} (for ${item.attributes.defaultGrams}g)</p>`;
        } else if (itemPrice > 0) {
            content += `<p class="text-xs text-gray-500 text-left">+ KES ${itemPrice.toFixed(2)}</p>`;
        }
        content += `</div></div>`;
        card.innerHTML = content;
        if (!item.soldOut) {
            card.addEventListener('click', (event) => {
                if (event.target.tagName === 'INPUT') event.stopPropagation();
                selectionHandler(item, card, categoryKey);
            });
        }
        container.appendChild(card);
    });
}

// And the rest of your original functions follow here... all the way to the end.
// ... handleProteinSelection, handleGramChange, ... calculateCurrentMealPrice, ...
// ... updateFinalCartDisplay, ... handlePaymentFormSubmit, ... showItemDetails, etc.
// The functions below are copied directly from your original file, with minor updates where needed.

function handleProteinSelection(proteinItem, card) {
    if (proteinItem.soldOut) return;
    if (currentMeal.protein && currentMeal.protein.id === proteinItem.id) return;
    if (currentMeal.protein) {
        const prevCard = proteinOptionsContainer.querySelector(`.ingredient-card.selected[data-id="${currentMeal.protein.id}"]`);
        if (prevCard) {
            prevCard.classList.remove('selected');
            const prevGramControls = prevCard.querySelector(`#gram-controls-${currentMeal.protein.id}`);
            if (prevGramControls) prevGramControls.classList.add('hidden');
        }
    }
    currentMeal.protein = { ...proteinItem, grams: proteinItem.attributes.defaultGrams || menuConfig.defaultProteinGrams };
    card.classList.add('selected');
    if (proteinItem.type !== 'patty') {
        const gramControls = card.querySelector(`#gram-controls-${proteinItem.id}`);
        if (gramControls) gramControls.classList.remove('hidden');
    }
    baseSectionWrapper.classList.remove('hidden');
    loadOptions('bases', baseOptionsContainer, handleSingleSelection);
    toppingsSectionWrapper.classList.remove('hidden');
    loadOptions('saladToppings', toppingOptionsContainer, handleMultiSelection);
    saucesSectionWrapper.classList.remove('hidden');
    loadOptions('sauces', sauceOptionsContainer, handleMultiSelection);
    extrasSectionWrapper.classList.remove('hidden');
    loadOptions('extras', extraOptionsContainer, handleExtraSelection);
    updateCurrentMealSummaryDisplay();
}

function handleGramChange(proteinItem, gramInput) {
    if (!currentMeal.protein || currentMeal.protein.id !== proteinItem.id) return;
    if (proteinItem.type === 'patty') return;
    let grams = parseInt(gramInput.value);
    const itemMinGrams = proteinItem.attributes.minGrams || menuConfig.minProteinGrams;
    if (isNaN(grams) || grams < itemMinGrams) {
        grams = itemMinGrams;
        gramInput.value = grams;
    }
    currentMeal.protein.grams = grams;
    updateCurrentMealSummaryDisplay();
}

function handleSingleSelection(item, card, categoryKey) {
    if (item.soldOut) return;
    const modelKey = categoryKey === 'bases' ? 'base' : categoryKey;
    if (currentMeal[modelKey] && currentMeal[modelKey].id === item.id) {
        currentMeal[modelKey] = null;
        card.classList.remove('selected');
    } else {
        const container = card.parentElement;
        if (container) {
            container.querySelectorAll('.ingredient-card.selected').forEach(c => c.classList.remove('selected'));
        }
        currentMeal[modelKey] = { ...item };
        card.classList.add('selected');
    }
    updateCurrentMealSummaryDisplay();
}

function handleMultiSelection(item, card, categoryKey) {
    if (item.soldOut) return;
    const categoryArrayName = categoryKey === 'saladToppings' ? 'toppings' : 'sauces';
    const categoryArray = currentMeal[categoryArrayName];
    const itemIndex = categoryArray.findIndex(i => i.id === item.id);
    if (itemIndex > -1) {
        categoryArray.splice(itemIndex, 1);
        card.classList.remove('selected');
    } else {
        categoryArray.push({ ...item });
        card.classList.add('selected');
    }
    updateCurrentMealSummaryDisplay();
}

function handleExtraSelection(item, card, categoryKey) {
    if (item.soldOut) return;
    if (item.type === 'extra_protein_trigger') {
        const detailsContainer = card.querySelector(`#extra-protein-details-${item.id}`);
        if (detailsContainer) {
            const isHidden = detailsContainer.classList.toggle('hidden');
            card.classList.toggle('selected', !isHidden);
        }
        return;
    }
    const itemIndex = currentMeal.extras.findIndex(i => i.id === item.id);
    if (itemIndex > -1) {
        currentMeal.extras.splice(itemIndex, 1);
        card.classList.remove('selected');
    } else {
        currentMeal.extras.push({ ...item });
        card.classList.add('selected');
    }
    updateCurrentMealSummaryDisplay();
}

function calculateCurrentMealPrice() {
    if (!currentMeal.typeId || currentMeal.itemType !== 'custom') return currentMeal.totalPrice || 0;
    let total = 0;
    if (currentMeal.protein) {
        total += currentMeal.protein.attributes.basePrice;
        if (currentMeal.protein.type !== 'patty' && currentMeal.protein.grams > (currentMeal.protein.attributes.defaultGrams || menuConfig.defaultProteinGrams)) {
            const extraGrams = currentMeal.protein.grams - (currentMeal.protein.attributes.defaultGrams || menuConfig.defaultProteinGrams);
            total += extraGrams * currentMeal.protein.attributes.perGramExtra;
        }
    }
    if (currentMeal.base && currentMeal.base.price > 0) total += currentMeal.base.price;
    if (currentMeal.toppings.length > menuConfig.freeToppingsCount) {
        for (let i = menuConfig.freeToppingsCount; i < currentMeal.toppings.length; i++) {
            total += currentMeal.toppings[i].price;
        }
    }
    currentMeal.sauces.forEach(sauce => { if(sauce.price > 0) total += sauce.price; });
    currentMeal.extras.forEach(extra => { total += extra.price; });
    currentMeal.totalPrice = total;
    return total;
}

function updateCurrentMealSummaryDisplay() {
    if(!orderItemsEl || !emptyOrderPlaceholderEl || !currentItemTotalEl || !addToFinalCartBtn) return;
    const price = calculateCurrentMealPrice();
    currentItemTotalEl.textContent = `KES ${price.toFixed(2)}`;
    if (!currentMeal.typeId || currentMeal.itemType !== 'custom') {
        orderItemsEl.innerHTML = ''; emptyOrderPlaceholderEl.classList.remove('hidden');
        addToFinalCartBtn.disabled = true; return;
    }
    emptyOrderPlaceholderEl.classList.add('hidden');
    orderItemsEl.innerHTML = '';
    const summaryDisplayContainer = document.createElement('div');
    summaryDisplayContainer.className = 'current-item-summary-display space-y-1 text-sm';
    const mealTypeP = document.createElement('p');
    mealTypeP.className = 'font-semibold text-urbanDark';
    mealTypeP.innerHTML = `${currentMeal.type || 'Meal'}`;
    summaryDisplayContainer.appendChild(mealTypeP);
    const detailsList = document.createElement('ul');
    detailsList.className = 'list-none pl-2 text-xs text-gray-700 space-y-1';
    const createSummaryItem = (label, value, category, itemId = null, itemName = null) => {
        const li = document.createElement('li');
        let itemHtml = `<span class="font-medium">${label}:</span> ${value}`;
        if (category) {
            itemHtml += ` <button class="summary-remove-btn" onclick="removePreviewItem('${category}', '${itemId}')" title="Remove ${itemName || label.toLowerCase()}"><i class="fas fa-times-circle"></i></button>`;
        }
        li.innerHTML = itemHtml;
        return li;
    };
    if (currentMeal.protein) detailsList.appendChild(createSummaryItem('Protein', `${currentMeal.protein.name} (${currentMeal.protein.grams}g)`, 'protein', currentMeal.protein.id, currentMeal.protein.name));
    if (currentMeal.base) detailsList.appendChild(createSummaryItem('Base', currentMeal.base.name, 'base', currentMeal.base.id, currentMeal.base.name));
    if (currentMeal.toppings.length > 0) {
        const toppingsLi = document.createElement('li');
        toppingsLi.innerHTML = `<span class="font-medium">Toppings (${currentMeal.toppings.length} selected, ${menuConfig.freeToppingsCount} free):</span>`;
        const toppingsUl = document.createElement('ul'); toppingsUl.className = 'list-disc list-inside pl-3';
        currentMeal.toppings.forEach(t => {
            const toppingDetailLi = document.createElement('li');
            toppingDetailLi.innerHTML = `${t.name} ${t.price > 0 && currentMeal.toppings.indexOf(t) >= menuConfig.freeToppingsCount ? `(+KES ${t.price.toFixed(2)})` : ''} <button class="summary-remove-btn" onclick="removePreviewItem('toppings', '${t.id}')" title="Remove ${t.name}"><i class="fas fa-times-circle"></i></button>`;
            toppingsUl.appendChild(toppingDetailLi);
        });
        toppingsLi.appendChild(toppingsUl);
        detailsList.appendChild(toppingsLi);
    }
    if (currentMeal.sauces.length > 0) {
        const saucesLi = document.createElement('li');
        saucesLi.innerHTML = `<span class="font-medium">Sauces:</span>`;
        const saucesUl = document.createElement('ul'); saucesUl.className = 'list-disc list-inside pl-3';
        currentMeal.sauces.forEach(s => {
            const sauceDetailLi = document.createElement('li');
            sauceDetailLi.innerHTML = `${s.name} <button class="summary-remove-btn" onclick="removePreviewItem('sauces', '${s.id}')" title="Remove ${s.name}"><i class="fas fa-times-circle"></i></button>`;
            saucesUl.appendChild(sauceDetailLi);
        });
        saucesLi.appendChild(saucesUl);
        detailsList.appendChild(saucesLi);
    }
    if (currentMeal.extras.length > 0) {
        const extrasLi = document.createElement('li');
        extrasLi.innerHTML = `<span class="font-medium">Extras:</span>`;
        const extrasUl = document.createElement('ul'); extrasUl.className = 'list-disc list-inside pl-3';
        currentMeal.extras.forEach(e => {
            const categoryForRemove = e.type === 'extra_protein_instance' ? 'extras_protein_instance' : 'extras_general';
            const extraDetailLi = document.createElement('li');
            extraDetailLi.innerHTML = `${e.name} (+KES ${e.price.toFixed(2)}) <button class="summary-remove-btn" onclick="removePreviewItem('${categoryForRemove}', '${e.id}')" title="Remove ${e.name}"><i class="fas fa-times-circle"></i></button>`;
            extrasUl.appendChild(extraDetailLi);
        });
        extrasLi.appendChild(extrasUl);
        detailsList.appendChild(extrasLi);
    }
    summaryDisplayContainer.appendChild(detailsList);
    orderItemsEl.appendChild(summaryDisplayContainer);
    addToFinalCartBtn.disabled = !(currentMeal.typeId && currentMeal.protein && currentMeal.base);
}

function removePreviewItem(category, itemId) {
    let itemRemoved = false;
    switch (category) {
        case 'protein':
            if (currentMeal.protein?.id === itemId) {
                deselectCard(proteinOptionsContainer, currentMeal.protein.id);
                currentMeal.protein = null; itemRemoved = true;
                currentMeal.base = null; currentMeal.toppings = []; currentMeal.sauces = [];
                currentMeal.extras = currentMeal.extras.filter(ex => ex.type !== 'extra_protein_instance');
                deselectAllCards(baseOptionsContainer); deselectAllCards(toppingOptionsContainer); deselectAllCards(sauceOptionsContainer);
                deselectCard(extraOptionsContainer, 'extra_protein_trigger_item');
                if (baseSectionWrapper) baseSectionWrapper.classList.add('hidden');
                if (toppingsSectionWrapper) toppingsSectionWrapper.classList.add('hidden');
                if (saucesSectionWrapper) saucesSectionWrapper.classList.add('hidden');
            }
            break;
        case 'base':
            if (currentMeal.base?.id === itemId) {
                deselectCard(baseOptionsContainer, currentMeal.base.id); currentMeal.base = null; itemRemoved = true;
            }
            break;
        case 'toppings':
            const topIdx = currentMeal.toppings.findIndex(t => t.id === itemId);
            if (topIdx > -1) { currentMeal.toppings.splice(topIdx, 1); itemRemoved = true; deselectCard(toppingOptionsContainer, itemId); }
            break;
        case 'sauces':
            const sauIdx = currentMeal.sauces.findIndex(s => s.id === itemId);
            if (sauIdx > -1) { currentMeal.sauces.splice(sauIdx, 1); itemRemoved = true; deselectCard(sauceOptionsContainer, itemId); }
            break;
        case 'extras_general':
        case 'extras_protein_instance':
            const extIdx = currentMeal.extras.findIndex(e => e.id === itemId);
            if (extIdx > -1) { currentMeal.extras.splice(extIdx, 1); itemRemoved = true; deselectCard(extraOptionsContainer, itemId); }
            break;
        default: return;
    }
    if(itemRemoved) updateCurrentMealSummaryDisplay();
}

function deselectCard(container, itemId) {
    if (!container || !itemId) return;
    const card = container.querySelector(`.ingredient-card[data-id="${itemId}"]`);
    if (card) {
        card.classList.remove('selected');
        const gramControls = card.querySelector(`#gram-controls-${itemId}`);
        if (gramControls) gramControls.classList.add('hidden');
        const extraProteinDetails = card.querySelector(`#extra-protein-details-${itemId}`);
        if (extraProteinDetails && !extraProteinDetails.classList.contains('hidden')) {
             extraProteinDetails.classList.add('hidden');
        }
    }
}

function deselectAllCards(container) {
    if (!container) return;
    container.querySelectorAll('.ingredient-card.selected').forEach(c => deselectCard(container, c.dataset.id));
}

function addCurrentMealToFinalCart() {
    if (currentMeal.itemType === 'custom' && (!currentMeal.typeId || !currentMeal.protein || !currentMeal.base)) {
        showToast("Please complete your meal selection (type, protein, and base are required)."); return;
    }
    calculateCurrentMealPrice();
    if (editingMealId) {
        const mealIndex = finalCart.findIndex(meal => meal.id === editingMealId && meal.itemType === 'custom');
        if (mealIndex > -1) finalCart[mealIndex] = { ...currentMeal };
        editingMealId = null;
    } else {
        finalCart.push(JSON.parse(JSON.stringify(currentMeal)));
    }
    updateFinalCartDisplay();
    resetCurrentMealBuilder();
    document.getElementById('build').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function editMealInCart(mealId) {
    const mealToEdit = finalCart.find(meal => meal.id === mealId && meal.itemType === 'custom');
    if (!mealToEdit) { showToast("Could not find this custom meal to edit."); return; }
    editingMealId = mealId;
    currentMeal = JSON.parse(JSON.stringify(mealToEdit));
    const periodName = currentGlobalPeriod ? menuConfig.mealPeriods.find(p => p.id === currentGlobalPeriod).name : "Meal";
    if(builderTitleEl) builderTitleEl.textContent = `Editing Your ${currentMeal.type || periodName + ' Meal'}`;
    if(currentMealActionTitleEl) currentMealActionTitleEl.textContent = `Editing Your ${currentMeal.type || 'Meal'}`;
    if(addToFinalCartBtn) { addToFinalCartBtn.textContent = 'Update Meal in Cart'; addToFinalCartBtn.disabled = false; }
    if(mealTypeSelectorEl) mealTypeSelectorEl.querySelectorAll('.ingredient-card').forEach(c => c.classList.remove('selected'));
    const mealTypeCard = mealTypeSelectorEl.querySelector(`.ingredient-card[data-id="${currentMeal.typeId}"]`);
    if (mealTypeCard) mealTypeCard.classList.add('selected');
    if(proteinSectionWrapper) proteinSectionWrapper.classList.remove('hidden');
    loadOptions('proteins', proteinOptionsContainer, handleProteinSelection, [currentMeal.protein]);
    if(currentMeal.protein){
        if(baseSectionWrapper) baseSectionWrapper.classList.remove('hidden');
        loadOptions('bases', baseOptionsContainer, handleSingleSelection, [currentMeal.base]);
        if(toppingsSectionWrapper) toppingsSectionWrapper.classList.remove('hidden');
        loadOptions('saladToppings', toppingOptionsContainer, handleMultiSelection, currentMeal.toppings);
        if(saucesSectionWrapper) saucesSectionWrapper.classList.remove('hidden');
        loadOptions('sauces', sauceOptionsContainer, handleMultiSelection, currentMeal.sauces);
        if(extrasSectionWrapper) extrasSectionWrapper.classList.remove('hidden');
        loadOptions('extras', extraOptionsContainer, handleExtraSelection, currentMeal.extras);
    }
    updateCurrentMealSummaryDisplay();
    document.getElementById('build').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function updateFinalCartDisplay() {
    if (!grandTotalSidebarEl || !modalSubtotalEl || !modalGrandTotalEl || !cartCountHeaderEl) return;
    [finalCartItemsSidebarEl, modalFinalCartItemsEl].forEach(container => { if (container) container.innerHTML = ''; });
    let subtotal = 0;
    let cartItemCount = 0;
    if (finalCart.length === 0) {
        if (emptyFinalCartPlaceholderSidebarEl) emptyFinalCartPlaceholderSidebarEl.classList.remove('hidden');
        const emptyModalCartPlaceholder = document.getElementById('empty-modal-cart-placeholder');
        if(emptyModalCartPlaceholder) emptyModalCartPlaceholder.classList.remove('hidden');
    } else {
        if (emptyFinalCartPlaceholderSidebarEl) emptyFinalCartPlaceholderSidebarEl.classList.add('hidden');
        const emptyModalCartPlaceholder = document.getElementById('empty-modal-cart-placeholder');
        if(emptyModalCartPlaceholder) emptyModalCartPlaceholder.classList.add('hidden');
        finalCart.forEach((item) => {
            subtotal += item.totalPrice;
            cartItemCount += (item.itemType === 'standard' ? item.quantity : 1);
            const itemEl = document.createElement('div');
            itemEl.className = 'p-2 border-b border-gray-200 text-xs';
            let itemDescription = item.itemType === 'custom' ? `${item.type} w/ ${item.protein ? item.protein.name : 'N/A'} (${item.protein.grams}g)` : `${item.quantity} x ${item.name}`;
            itemEl.innerHTML = `<div class="flex justify-between items-start"><div class="flex-grow pr-2"><span class="font-medium text-urbanDark">${itemDescription}</span></div><div class="flex items-center shrink-0"><span class="text-gray-700 mr-2 sm:mr-3">KES ${item.totalPrice.toFixed(2)}</span>${item.itemType === 'custom' ? `<button class="text-blue-500 hover:text-blue-700 mr-1 sm:mr-2 text-xs" onclick="editMealInCart('${item.id}')" title="Edit this meal"><i class="fas fa-edit"></i></button>` : ''}<button class="text-red-500 hover:text-red-700 text-xs" onclick="removeFromFinalCart('${item.id}')" title="Remove this item"><i class="fas fa-trash-alt"></i></button></div></div>`;
            if (finalCartItemsSidebarEl) finalCartItemsSidebarEl.appendChild(itemEl.cloneNode(true));
            if (modalFinalCartItemsEl) modalFinalCartItemsEl.appendChild(itemEl);
        });
    }
    grandTotalSidebarEl.textContent = `KES ${subtotal.toFixed(2)}`;
    modalSubtotalEl.textContent = `KES ${subtotal.toFixed(2)}`;
    const deliveryFee = (currentOrderType === 'delivery' && finalCart.length > 0 && subtotal > 0) ? menuConfig.deliveryFee : 0;
    let discountedSubtotal = subtotal;
    if (currentDiscount.amount > 0) {
        discountedSubtotal = Math.max(0, subtotal - currentDiscount.amount);
        if(modalDiscountAmountEl) modalDiscountAmountEl.textContent = `- KES ${currentDiscount.amount.toFixed(2)}`;
        if(modalDiscountContainerEl) modalDiscountContainerEl.classList.remove('hidden');
    } else {
        if(modalDiscountContainerEl) modalDiscountContainerEl.classList.add('hidden');
    }
    const grandTotalValue = discountedSubtotal + deliveryFee;
    if(modalDeliveryFeeEl) modalDeliveryFeeEl.textContent = `KES ${deliveryFee.toFixed(2)}`;
    if(modalDeliveryFeeContainerEl) modalDeliveryFeeContainerEl.style.display = (deliveryFee > 0) ? 'flex' : 'none';
    modalGrandTotalEl.textContent = `KES ${grandTotalValue.toFixed(2)}`;
    cartCountHeaderEl.textContent = cartItemCount;
    if(checkoutBtnSidebar) checkoutBtnSidebar.disabled = finalCart.length === 0;
    if(checkoutBtnHeader) checkoutBtnHeader.disabled = finalCart.length === 0;
}

function removeFromFinalCart(itemId) {
    finalCart = finalCart.filter(item => item.id !== itemId);
    if (editingMealId === itemId) { editingMealId = null; resetCurrentMealBuilder(); }
    applyPromoCode(false); updateFinalCartDisplay();
}

function openCheckoutModal() {
    if (finalCart.length === 0) { showToast("Your cart is empty."); return; }
    currentDiscount = { code: null, amount: 0 };
    if(promoCodeInputEl) promoCodeInputEl.value = '';
    if(promoCodeMessageEl) { promoCodeMessageEl.textContent = ''; promoCodeMessageEl.className = 'mt-2 text-sm text-gray-600'; }
    updateFinalCartDisplay(); handleOrderTypeChange(); updateSaveAddressCheckbox();
    openModal('checkout-modal');
}

function handleOrderTypeChange() {
    const selectedOrderType = document.querySelector('input[name="orderType"]:checked');
    if(!selectedOrderType) return;
    currentOrderType = selectedOrderType.value;
    const deliveryAreaInput = document.getElementById('delivery-area');
    if (currentOrderType === 'delivery') {
        if(deliveryAddressSectionEl) deliveryAddressSectionEl.classList.remove('hidden');
        if(pickupInfoSectionEl) pickupInfoSectionEl.classList.add('hidden');
        if(deliveryAreaInput) deliveryAreaInput.required = true;
    } else {
        if(deliveryAddressSectionEl) deliveryAddressSectionEl.classList.add('hidden');
        if(pickupInfoSectionEl) pickupInfoSectionEl.classList.remove('hidden');
        if(deliveryAreaInput) deliveryAreaInput.required = false;
    }
    updateSaveAddressCheckbox(); updateFinalCartDisplay();
}

/* --------------------------------------------------------------------------
   PROMO CODES
   -------------------------------------------------------------------------- */
function applyPromoCode(shouldToast = true) {          // <— renamed flag
  if (!promoCodeInputEl || !promoCodeMessageEl) return;

  const code  = promoCodeInputEl.value.trim().toUpperCase();
  const promo = menuConfig.promoCodes?.[code];         // <— see step 2
  currentDiscount = { code: null, amount: 0 };

  if (promo) {
    let subtotal = 0;
    finalCart.forEach(item => subtotal += item.totalPrice);
    if (subtotal > 0) {
      currentDiscount.amount = promo.type === "percentage"
        ? (subtotal * promo.value) / 100
        : promo.value;
      currentDiscount.amount = Math.min(currentDiscount.amount, subtotal);
      currentDiscount.code   = code;

      promoCodeMessageEl.textContent =
        `Promo "${code}" applied! You saved KES ${currentDiscount.amount.toFixed(2)}.`;
      promoCodeMessageEl.className = 'mt-2 text-sm text-green-600';

      if (shouldToast) showToast(`Promo "${code}" applied!`);
    } else {
      promoCodeMessageEl.textContent = "Promo cannot be applied to an empty cart.";
      promoCodeMessageEl.className   = 'mt-2 text-sm text-red-500';
    }
  } else if (code !== "") {
    promoCodeMessageEl.textContent = "Invalid promo code.";
    promoCodeMessageEl.className   = 'mt-2 text-sm text-red-500';
    if (shouldToast) showToast("Invalid promo code.", "error");
  } else {
    promoCodeMessageEl.textContent = "";
  }

  updateFinalCartDisplay();
}

function handlePaymentFormSubmit(e) {
    e.preventDefault();
    let deliveryAddressForLog = null;
    const phoneInput = document.getElementById('phone');
    const termsCheckbox = document.getElementById('terms');
    if (currentOrderType === 'delivery') {
        const deliveryArea = document.getElementById('delivery-area').value.trim();
        if (!deliveryArea) { showToast("Please enter Street / Estate / Area."); return; }
        const deliveryDetails = document.getElementById('delivery-details').value.trim();
        const deliveryInstructions = document.getElementById('delivery-instructions').value.trim();
        deliveryAddressForLog = { area: deliveryArea, details: deliveryDetails, instructions: deliveryInstructions };
        const saveAddressCheckbox = document.getElementById('save-address-checkout');
        if (currentUser && saveAddressCheckbox?.checked) {
            if (!currentUser.saved_addresses) currentUser.saved_addresses = [];
            if (!currentUser.saved_addresses.some(addr => addr.area === deliveryArea && addr.details === deliveryDetails)) {
                // Here you would make an API call to save the address to the backend
                console.log("Simulating save new address for user:", currentUser.id);
            }
        }
    }
    if (!phoneInput || !phoneInput.value.match(/^(254\d{9}|0\d{9})$/)) { showToast("Please enter a valid M-Pesa phone number."); return; }
    if (!termsCheckbox || !termsCheckbox.checked) { showToast("Please agree to the Terms & Conditions."); return; }
    
    // In the future, this function will make a POST request to /api/orders
    console.log("Order submission logic will be connected to the backend here.");
    showToast("Order functionality is not yet connected to the backend. See console for data.");

    const orderDataForLog = { items: finalCart, orderType: currentOrderType, deliveryAddress: deliveryAddressForLog, subtotal: /* calculate */ 0, grandTotal: /* calculate */ 0, mpesaPhone: phoneInput.value };
    console.log("Order Data to send:", orderDataForLog);
}

// NOTE: The original saveOrderToHistory and loadOrderHistory used localStorage.
// These will be replaced with API calls in the next phase.
function saveOrderToHistory(orderData) {
    if(!currentUser) return;
    console.log("This will be an API call to save an order.");
}
function loadOrderHistory() {
    if(!currentUser) return;
    const historyContentEl = document.getElementById('order-history-content');
    historyContentEl.innerHTML = '<p>Order history will be loaded from the backend.</p>';
}

function closeConfirmationAndReset() {
    finalCart = []; currentDiscount = { code: null, amount: 0 };
    if(promoCodeInputEl) promoCodeInputEl.value = '';
    if(promoCodeMessageEl) promoCodeMessageEl.textContent = '';
    updateFinalCartDisplay();
    resetCurrentMealBuilder();
    if(paymentFormEl) paymentFormEl.reset();
    closeModal('confirmation-modal');
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if(modal) modal.classList.remove('hidden');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if(modal) modal.classList.add('hidden');
}

function showItemDetails(itemId) {
    const itemDetailsTitleEl = document.getElementById('item-details-title');
    const itemDetailsContentEl = document.getElementById('item-details-content');
    if(!itemDetailsTitleEl || !itemDetailsContentEl) return;
    const itemData = findMenuItemById(itemId);
    if(!itemData) {
        itemDetailsTitleEl.textContent = "Item Not Found";
        itemDetailsContentEl.innerHTML = "<p>Details could not be loaded.</p>";
        openModal('item-details-modal');
        return;
    }
    itemDetailsTitleEl.textContent = `Details for ${itemData.name}`;
    itemDetailsContentEl.innerHTML = `
        <div class="w-full h-32 bg-gray-200 flex items-center justify-center rounded-md mb-4"><i class="${itemData.icon || 'fas fa-utensils'} text-4xl text-gray-400"></i></div>
        <p class="text-gray-700 mb-2">${itemData.description || 'A delicious choice from Urban Flame.'}</p>
        <p class="font-semibold text-urbanOrange">Price: KES ${itemData.price.toFixed(2)}</p>
        <p class="mt-3 text-sm text-gray-500">Allergen information not specified (Simulated). Please ask staff for details.</p>`;
    openModal('item-details-modal');
}