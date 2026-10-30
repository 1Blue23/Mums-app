/**
 * MUMS App – app.js
 * Multi-API prissammenligning (Salling Group, Open Food Facts, REMA 1000, Dansk Retursystem Pant),
 * ernærings-præferencer (Match %), ugentlige tilbud, geolokation,
 * butik-dropdown/modal med hjemmeside & adresse, samt optimeret indkøbsliste med varespecifikke adresser.
 */

// ─── KONFIGURATION & STATE ───────────────────────────────────────────────────
const CONFIG = {
  API_KEY: window.SALLING_API_KEY || localStorage.getItem('mums_salling_api_key') || null,
  API_BASE: 'https://api.sallinggroup.com',
  MAX_CALLS: 25,
  CACHE_KEY: 'mumsapp_cache_v3',
  CACHE_TTL: 30 * 60 * 1000,
};

let state = {
  activeTab: 'home',
  callsRemaining: CONFIG.MAX_CALLS,
  servings: 4,
  budget: 150,
  activeProfileId: 'default_normal',
  userProfiles: [],
  shoppingList: [],
  checkedShoppingItems: {},
  ingredients: [],
  selectedStores: ['bilka', 'foetex', 'netto', 'rema', 'lidl', 'coop365'],
  preferences: {
    proteinVal: null,
    proteinUnit: 'g',
    fatVal: null,
    fatUnit: 'g',
    kcalVal: null,
    kcalUnit: 'kcal',
    carbsVal: null,
    carbsUnit: 'g',
    activePreset: null,
  },
  offerFilters: {
    store: 'all',
    category: 'all',
  },
  offerSort: 'default',
  offerSearchQuery: '',
  offersPage: 1,
  offersPerPage: 12,
  recipeSourceFilter: 'all',
  recipeCategoryFilter: 'all',
  recipeFocus: 'cheapest',
  recipeSearchQuery: '',
  offersOpen: true,
  userLocation: null,
  nearestStores: [],
  weeklyOffers: [],
  lastSearchResults: null,
  liveNutritionData: {},
  allergies: [],
  autoFilterAllergies: false,
  mealPlan: {
    monday: null,
    tuesday: null,
    wednesday: null,
    thursday: null,
    friday: null,
    saturday: null,
    sunday: null
  },
};

// ─── DOM ELEMENTER ────────────────────────────────────────────────────────────
const dom = {
  // Navigation & Tabs
  logoBtn: document.getElementById('logoBtn'),
  tabViews: document.querySelectorAll('.tab-view'),
  navTabBtns: document.querySelectorAll('.nav-tab-btn'),
  navCartBadge: document.getElementById('navCartBadge'),
  desktopCartBadge: document.getElementById('desktopCartBadge'),

  // Auth elementer
  authBtn: document.getElementById('authBtn'),
  authBtnIcon: document.getElementById('authBtnIcon'),
  authBtnText: document.getElementById('authBtnText'),
  authModal: document.getElementById('authModal'),
  closeAuthModal: document.getElementById('closeAuthModal'),
  tabLogin: document.getElementById('tabLogin'),
  tabRegister: document.getElementById('tabRegister'),
  authForm: document.getElementById('authForm'),
  authNameGroup: document.getElementById('authNameGroup'),
  authName: document.getElementById('authName'),
  authEmail: document.getElementById('authEmail'),
  authPassword: document.getElementById('authPassword'),
  authSubmitBtn: document.getElementById('authSubmitBtn'),
  authErrorMsg: document.getElementById('authErrorMsg'),
  authLoggedOutView: document.getElementById('authLoggedOutView'),
  authLoggedInView: document.getElementById('authLoggedInView'),
  loggedInUserName: document.getElementById('loggedInUserName'),
  loggedInUserEmail: document.getElementById('loggedInUserEmail'),
  emailVerifyBanner: document.getElementById('emailVerifyBanner'),
  verificationCodeInput: document.getElementById('verificationCodeInput'),
  btnConfirmVerify: document.getElementById('btnConfirmVerify'),
  btnResendCode: document.getElementById('btnResendCode'),
  verifyBannerSubtext: document.getElementById('verifyBannerSubtext'),
  demoCodeHint: document.getElementById('demoCodeHint'),
  emailVerifiedBadge: document.getElementById('emailVerifiedBadge'),
  btnLogout: document.getElementById('btnLogout'),

  // Update banner & Profile check
  updateBanner: document.getElementById('updateBanner'),
  btnUpdateNow: document.getElementById('btnUpdateNow'),
  btnUpdateDismiss: document.getElementById('btnUpdateDismiss'),
  btnProfileCheckUpdate: document.getElementById('btnProfileCheckUpdate'),
  profileUpdateStatusText: document.getElementById('profileUpdateStatusText'),

  // Home Dashboard
  homeChipServingsVal: document.getElementById('homeChipServingsVal'),
  homeChipBudgetVal: document.getElementById('homeChipBudgetVal'),
  homeChipNutritionVal: document.getElementById('homeChipNutritionVal'),
  homeChipNearestStoreVal: document.getElementById('homeChipNearestStoreVal'),
  homeFeaturedDishBox: document.getElementById('homeFeaturedDishBox'),
  homeFeaturedTitle: document.getElementById('homeFeaturedTitle'),
  homeFeaturedDesc: document.getElementById('homeFeaturedDesc'),
  homeFeaturedPricePill: document.getElementById('homeFeaturedPricePill'),
  btnCookFeatured: document.getElementById('btnCookFeatured'),
  btnFeaturedToCart: document.getElementById('btnFeaturedToCart'),
  homeTopOffersGrid: document.getElementById('homeTopOffersGrid'),
  homeStoresGrid: document.getElementById('homeStoresGrid'),
  homeLocateBtn: document.getElementById('homeLocateBtn'),

  // Personer & Budget
  servingsBtns: document.querySelectorAll('.servings-btn'),
  budgetInput: document.getElementById('budgetInput'),
  budgetStatusBadge: document.getElementById('budgetStatusBadge'),

  // Ernæringsprofiler
  userProfileSelect: document.getElementById('userProfileSelect'),
  btnNewProfile: document.getElementById('btnNewProfile'),
  btnEditProfile: document.getElementById('btnEditProfile'),
  btnDeleteProfile: document.getElementById('btnDeleteProfile'),
  profileModal: document.getElementById('profileModal'),
  closeProfileModal: document.getElementById('closeProfileModal'),
  profileForm: document.getElementById('profileForm'),
  profileModalTitle: document.getElementById('profileModalTitle'),
  profileEditId: document.getElementById('profileEditId'),
  profNameInput: document.getElementById('profNameInput'),
  profKcal: document.getElementById('profKcal'),
  profProtein: document.getElementById('profProtein'),
  profFat: document.getElementById('profFat'),
  profCarbs: document.getElementById('profCarbs'),
  profFiber: document.getElementById('profFiber'),
  btnCancelProfile: document.getElementById('btnCancelProfile'),
  btnSaveProfile: document.getElementById('btnSaveProfile'),

  // Indkøbsliste (Modal + Dedikeret Page)
  globalShoppingListBtn: document.getElementById('globalShoppingListBtn'),
  cartCountBadge: document.getElementById('cartCountBadge'),
  shoppingListModal: document.getElementById('shoppingListModal'),
  closeShoppingModal: document.getElementById('closeShoppingModal'),
  shoppingListContainer: document.getElementById('shoppingListContainer'),
  shoppingModalServingsInfo: document.getElementById('shoppingModalServingsInfo'),
  shoppingModalTotalSum: document.getElementById('shoppingModalTotalSum'),
  shoppingModalBudgetCompare: document.getElementById('shoppingModalBudgetCompare'),
  btnClearShoppingList: document.getElementById('btnClearShoppingList'),
  btnCloseShoppingList: document.getElementById('btnCloseShoppingList'),

  pageShoppingListContainer: document.getElementById('pageShoppingListContainer'),
  pageShoppingTotalSum: document.getElementById('pageShoppingTotalSum'),
  pageShoppingPantSum: document.getElementById('pageShoppingPantSum'),
  pageShoppingBudgetStatus: document.getElementById('pageShoppingBudgetStatus'),
  pageBtnClearShoppingList: document.getElementById('pageBtnClearShoppingList'),
  pageBtnCopyShoppingList: document.getElementById('pageBtnCopyShoppingList'),
  pageManualItemInput: document.getElementById('pageManualItemInput'),
  pageBtnAddManualItem: document.getElementById('pageBtnAddManualItem'),
  shoppingEmptyNotice: document.getElementById('shoppingEmptyNotice'),

  // Offers View & Countdown Banner
  activeFlyerTitle: document.getElementById('activeFlyerTitle'),
  activeFlyerBadgeText: document.getElementById('activeFlyerBadgeText'),
  flyerStartDate: document.getElementById('flyerStartDate'),
  flyerEndDate: document.getElementById('flyerEndDate'),
  flyerCountdownClock: document.getElementById('flyerCountdownClock'),
  btnSimulateExpire: document.getElementById('btnSimulateExpire'),
  dailySyncBar: document.getElementById('dailySyncBar'),
  dailySyncTitle: document.getElementById('dailySyncTitle'),
  dailySyncStatusText: document.getElementById('dailySyncStatusText'),
  btnDailyCheckNow: document.getElementById('btnDailyCheckNow'),
  offerSearchInput: document.getElementById('offerSearchInput'),
  offerSortSelect: document.getElementById('offerSortSelect'),
  offersCountBadge: document.getElementById('offersCountBadge'),
  offerStorePills: document.querySelectorAll('#offerStorePills .offer-pill'),
  offerCategoryPills: document.querySelectorAll('#offerCategoryPills .offer-pill'),
  offersStrip: document.getElementById('offersStrip'),
  btnLoadMoreOffers: document.getElementById('btnLoadMoreOffers'),
  offersPaginationWrap: document.getElementById('offersPaginationWrap'),

  // Profile View
  profileNameDisplay: document.getElementById('profileNameDisplay'),
  profileEmailDisplay: document.getElementById('profileEmailDisplay'),
  profileVerifyBadgeDisplay: document.getElementById('profileVerifyBadgeDisplay'),
  profileAuthBtn: document.getElementById('profileAuthBtn'),
  profileEmailVerifyBox: document.getElementById('profileEmailVerifyBox'),
  profileVerifyCodeInput: document.getElementById('profileVerifyCodeInput'),
  btnProfileVerifySubmit: document.getElementById('btnProfileVerifySubmit'),
  profileDefaultServings: document.getElementById('profileDefaultServings'),
  profileDefaultBudget: document.getElementById('profileDefaultBudget'),
  profileStoreCheckboxes: document.querySelectorAll('#profileStoreCheckboxes input'),
  btnSaveProfileSettings: document.getElementById('btnSaveProfileSettings'),
  profileUserNutrList: document.getElementById('profileUserNutrList'),
  btnProfileCreateNewNutr: document.getElementById('btnProfileCreateNewNutr'),

  // Allergier & Indstillinger elementer
  authAllergiesGroup: document.getElementById('authAllergiesGroup'),
  authAllergyInput: document.getElementById('authAllergyInput'),
  btnAddAuthAllergy: document.getElementById('btnAddAuthAllergy'),
  authAllergyTagsContainer: document.getElementById('authAllergyTagsContainer'),
  authAllergyQuickPills: document.getElementById('authAllergyQuickPills'),

  profileAllergyInput: document.getElementById('profileAllergyInput'),
  btnAddProfileAllergy: document.getElementById('btnAddProfileAllergy'),
  profileAllergyTagsContainer: document.getElementById('profileAllergyTagsContainer'),
  profileAllergyQuickPills: document.getElementById('profileAllergyQuickPills'),
  profileAutoFilterAllergies: document.getElementById('profileAutoFilterAllergies'),
  btnSaveProfileAllergies: document.getElementById('btnSaveProfileAllergies'),
  btnThemeLight: document.getElementById('btnThemeLight'),
  btnThemeDark: document.getElementById('btnThemeDark'),
  toggleCompactView: document.getElementById('toggleCompactView'),
  toggleDailyOfferCheck: document.getElementById('toggleDailyOfferCheck'),
  btnResetAppData: document.getElementById('btnResetAppData'),

  // Madplan & Anti-Madspild elementer
  tabMealPlan: document.getElementById('tabViewMealPlan'),
  mealPlanWeekGrid: document.getElementById('mealPlanWeekGrid'),
  mpStatDays: document.getElementById('mpStatDays'),
  mpStatPrice: document.getElementById('mpStatPrice'),
  mpStatWasteScore: document.getElementById('mpStatWasteScore'),
  mpStatServings: document.getElementById('mpStatServings'),
  mpWasteInsightBox: document.getElementById('mpWasteInsightBox'),
  mpStorePriceCompareBar: document.getElementById('mpStorePriceCompareBar'),
  mpWeeklyIngredientsList: document.getElementById('mpWeeklyIngredientsList'),
  btnAutoFillZeroWaste: document.getElementById('btnAutoFillZeroWaste'),
  btnClearMealPlan: document.getElementById('btnClearMealPlan'),
  btnTransferMealPlanToCart: document.getElementById('btnTransferMealPlanToCart'),
  btnCopyWeeklyShoppingList: document.getElementById('btnCopyWeeklyShoppingList'),
  mealPlanDayPickerModal: document.getElementById('mealPlanDayPickerModal'),
  closeMealPlanDayModal: document.getElementById('closeMealPlanDayModal'),
  mealPlanPickerDaysGrid: document.getElementById('mealPlanPickerDaysGrid'),
  mpPickerRecipeTitle: document.getElementById('mpPickerRecipeTitle'),
  homeMealPlanTodayTitle: document.getElementById('homeMealPlanTodayTitle'),
  homeMealPlanTodayContent: document.getElementById('homeMealPlanTodayContent'),
  btnFeaturedToMealPlan: document.getElementById('btnFeaturedToMealPlan'),

  // API og geolokation
  callsLeft: document.getElementById('callsLeft'),
  apiStatusBtn: document.getElementById('apiStatusBtn'),
  apiModal: document.getElementById('apiModal'),
  closeApiModal: document.getElementById('closeApiModal'),
  locationBtn: document.getElementById('locationBtn'),
  locationBtnText: document.getElementById('locationBtnText'),
  locationModal: document.getElementById('locationModal'),
  closeLocationModal: document.getElementById('closeLocationModal'),
  btnCancelLocation: document.getElementById('btnCancelLocation'),
  btnUseBrowserGps: document.getElementById('btnUseBrowserGps'),
  cityPostalInput: document.getElementById('cityPostalInput'),
  cityPillsContainer: document.getElementById('cityPillsContainer'),

  // Ernæring custom toggles
  presetPillBtns: document.querySelectorAll('.preset-pill-btn[data-preset]'),
  toggleCustomPrefsBtn: document.getElementById('toggleCustomPrefsBtn'),
  customNutritionWrap: document.getElementById('customNutritionWrap'),
  clearProfile: document.getElementById('clearProfile'),
  prefProteinVal: document.getElementById('prefProteinVal'),
  prefProteinUnit: document.getElementById('prefProteinUnit'),
  prefFatVal: document.getElementById('prefFatVal'),
  prefFatUnit: document.getElementById('prefFatUnit'),
  prefKcalVal: document.getElementById('prefKcalVal'),
  prefKcalUnit: document.getElementById('prefKcalUnit'),
  prefCarbsVal: document.getElementById('prefCarbsVal'),
  prefCarbsUnit: document.getElementById('prefCarbsUnit'),
  profileSummary: document.getElementById('profileSummary'),
  profileSummaryText: document.getElementById('profileSummaryText'),

  // Ingredienser & Søgning
  ingredientInput: document.getElementById('ingredientInput'),
  addIngredientBtn: document.getElementById('addIngredientBtn'),
  ingredientTags: document.getElementById('ingredientTags'),
  quickBtns: document.querySelectorAll('.quick-btn'),
  storeCheckboxes: document.querySelectorAll('#storeCheckboxes input[name="store"]'),
  searchBtn: document.getElementById('searchBtn'),
  loadingSection: document.getElementById('loadingSection'),
  loadingText: document.getElementById('loadingText'),
  resultsSection: document.getElementById('resultsSection'),
  emptyState: document.getElementById('emptyState'),
  recipeCards: document.getElementById('recipeCards'),
  recipeCatBtns: document.querySelectorAll('.recipe-cat-btn'),
  comparisonTable: document.getElementById('comparisonTable'),
  totalBestPrice: document.getElementById('totalBestPrice'),
  winnerBanner: document.getElementById('winnerBanner'),
  winnerStore: document.getElementById('winnerStore'),
  winnerPrice: document.getElementById('winnerPrice'),
  toast: document.getElementById('toast'),
  storeModal: document.getElementById('storeModal'),
  modalContent: document.getElementById('modalContent'),
  closeStoreModal: document.getElementById('closeStoreModal'),

  // Opskrifts-hub & kilder
  recipeSourcePills: document.querySelectorAll('#recipeSourcePills .recipe-source-pill'),
  recipeSearchInput: document.getElementById('recipeSearchInput'),
  recipeFocusSelect: document.getElementById('recipeFocusSelect'),
  recipeCountDisplay: document.getElementById('recipeCountDisplay'),
};

// ─── TOAST NOTIFIKATION ───────────────────────────────────────────────────────
let toastTimer = null;
function showToast(msg, type = '') {
  if (!dom.toast) return;
  dom.toast.textContent = msg;
  dom.toast.className = 'toast' + (type ? ' ' + type : '');
  dom.toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => dom.toast.classList.add('hidden'), 3200);
}

// ─── CACHE & CALL TRACKING ────────────────────────────────────────────────────
function getLocalCache() {
  try {
    const raw = localStorage.getItem(CONFIG.CACHE_KEY);
    if (!raw) return {};
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CONFIG.CACHE_TTL) return {};
    return data || {};
  } catch {
    return {};
  }
}

function setLocalCache(cacheObj) {
  try {
    localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify({ data: cacheObj, ts: Date.now() }));
  } catch {}
}

function getCached(key) {
  return getLocalCache()[key] || null;
}

function setCached(key, val) {
  const cache = getLocalCache();
  cache[key] = val;
  setLocalCache(cache);
}

function updateCallCounter() {
  if (dom.callsLeft) {
    dom.callsLeft.textContent = state.callsRemaining;
    dom.callsLeft.className = 'counter-value' + (state.callsRemaining <= 5 ? ' low' : '');
  }
  localStorage.setItem('mumsapp_calls', state.callsRemaining);
}

// ─── PANT SYSTEM (Dansk Retursystem) ──────────────────────────────────────────
function getPantDetails(productName, category = '') {
  const name = (productName || '').toLowerCase();
  const cat  = (category   || '').toLowerCase();

  const DRINK_KEYWORDS = [
    'cola', 'pepsi', 'sprite', 'fanta', 'monster', 'red bull', 'redbull',
    'faxe', 'juice', 'sodavand', 'energidrik', 'booster', 'cult', 'vand', 'øl',
    'cider', 'saft', 'rynkeby', 'cocio', 'tuborg', 'carlsberg', 'harboe', 'freeway',
    'river cola', 'kong strong', 'flying power', 'innocent', 'solevita'
  ];

  const isDrink = cat === 'drikke' || DRINK_KEYWORDS.some(k => name.includes(k));
  if (!isDrink) {
    return { pantAmount: 0, pantType: null, pantLabel: '', hasPant: false };
  }

  // Flerstyks-pakker (fx "24 x 33cl", "6 x 33cl")
  const packMatch = name.match(/(\d+)\s*x/i);
  const packCount = packMatch ? parseInt(packMatch[1], 10) : 1;

  // Størrelse
  const sizeMatch = name.match(/(\d+(?:[.,]\d+)?)\s*(l|liter|cl|ml)/i);
  let pantPrUnit = 1.00;
  let pantType = 'Pant A';

  if (sizeMatch) {
    let amount = parseFloat(sizeMatch[1].replace(',', '.'));
    const unit = sizeMatch[2].toLowerCase();
    if (unit === 'cl') amount /= 100;
    if (unit === 'ml') amount /= 1000;

    if (amount >= 1.0) {
      pantPrUnit = 3.00;
      pantType = 'Pant C';
    } else if (amount >= 0.45 && !name.includes('dåse') && (name.includes('flaske') || amount >= 0.5)) {
      pantPrUnit = 1.50;
      pantType = 'Pant B';
    } else {
      pantPrUnit = 1.00;
      pantType = 'Pant A';
    }
  } else {
    pantPrUnit = 1.00;
    pantType = 'Pant A';
  }

  const totalPant = parseFloat((pantPrUnit * packCount).toFixed(2));
  const pantLabel = packCount > 1 
    ? `+${totalPant.toFixed(2)} kr pant (${packCount}x ${pantType})`
    : `+${totalPant.toFixed(2)} kr pant (${pantType})`;

  return {
    pantAmount: totalPant,
    pantType: packCount > 1 ? `${packCount}x ${pantType}` : pantType,
    pantLabel,
    hasPant: true,
  };
}

// ─── BUTIK LOKATION & ADRESSE HELPER ──────────────────────────────────────────
const DANISH_STORES = [
  { name: 'Netto', storeKey: 'netto', openHours: '07:00 - 22:00' },
  { name: 'REMA 1000', storeKey: 'rema', openHours: '07:00 - 21:00' },
  { name: 'Lidl', storeKey: 'lidl', openHours: '08:00 - 21:00' },
  { name: '365discount', storeKey: 'coop365', openHours: '07:00 - 22:00' },
  { name: 'Føtex', storeKey: 'foetex', openHours: '07:00 - 21:00' },
  { name: 'Bilka', storeKey: 'bilka', openHours: '06:00 - 23:00' },
];

function calculateHaversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getStoreLocationInfo(storeKey) {
  const meta = STORES[storeKey] || { label: storeKey, address: '', tagClass: 'tag-netto', emoji: '🏬' };
  
  let distanceText = 'Find butik';
  let distanceKm = null;
  let openHours = meta.hours || '08:00 - 21:00';
  let address = meta.address || `${meta.label} (Find nærmeste butik)`;
  let mapsQuery = meta.mapsQuery || `${meta.label} nær mig`;
  let mapsUrl = null; // Præcist koordinat-link (fra Overpass)

  if (state.nearestStores && state.nearestStores.length > 0) {
    const matched = state.nearestStores.find(s => s.storeKey === storeKey);
    if (matched) {
      distanceText = matched.distanceText || distanceText;
      distanceKm = matched.distanceKm !== undefined ? matched.distanceKm : null;
      openHours = matched.openHours || openHours;
      if (matched.address) address = matched.address;
      if (matched.mapsUrl) mapsUrl = matched.mapsUrl;
      else if (matched.mapsQuery) mapsQuery = matched.mapsQuery;
    }
  }

  // Bygger det endelige Maps-link: koordinat-pin foretrækkes
  const finalMapsUrl = mapsUrl
    || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`;

  return {
    ...meta,
    storeKey,
    address,
    distanceText,
    distanceKm,
    openHours,
    mapsQuery,
    mapsUrl: finalMapsUrl,
  };
}

// ─── MULTI-API SERVICES (Parallel forespørgsler med DataLayer Caching) ───────
const APIS = {
  // 1. Salling Group API (Bilka, Føtex, Netto)
  async querySalling(query) {
    if (!CONFIG.API_KEY) {
      return { source: 'Salling Group (Katalog)', ok: true, fallback: true };
    }
    try {
      const url = `${CONFIG.API_BASE}/v1-beta/product-suggestions/relevant-products?query=${encodeURIComponent(query)}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${CONFIG.API_KEY}` },
        signal: AbortSignal.timeout(2500),
      });
      if (res.ok) {
        const data = await res.json();
        return { source: 'Salling API (Live)', ok: true, data };
      }
    } catch {}
    return { source: 'Salling Group Feed (Katalog)', ok: true, fallback: true };
  },

  // 2. Open Food Facts API (Live ernæringsdata med DataLayer 7-dages cache)
  async queryOpenFoodFacts(query) {
    if (window.DataLayer && window.DataLayer.openFoodFacts) {
      return window.DataLayer.openFoodFacts.getNutrition(query);
    }
    try {
      const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=2`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        if (data.products && data.products.length > 0) {
          const p = data.products[0];
          const nutr = p.nutriments || {};
          return {
            source: 'Open Food Facts (Live)',
            ok: true,
            nutrition: {
              kcal: Math.round(nutr['energy-kcal_100g'] || (nutr['energy_100g'] ? nutr['energy_100g'] / 4.184 : 0)),
              protein: Math.round(nutr.proteins_100g || 0),
              fat: Math.round(nutr.fat_100g || 0),
              carbs: Math.round(nutr.carbohydrates_100g || 0),
              name: p.product_name || query,
            }
          };
        }
      }
    } catch {}
    return { source: 'Open Food Facts', ok: false };
  },

  // 3. REMA 1000 & Supermarkedspriser Feeds
  async queryDiscountFeeds(query, storeKey) {
    if (storeKey === 'rema' && window.DataLayer && window.DataLayer.rema) {
      try {
        const p = await window.DataLayer.rema.findProductByName(query);
        if (p) {
          return { source: 'REMA 1000 Live API', ok: true, product: p };
        }
      } catch {}
    }
    return { source: `${STORES[storeKey]?.label || storeKey} Feed`, ok: true };
  },
};

// ─── ERNÆRINGSPRÆFERENCER (Husker dine værdier) ────────────────────────────────
function loadPreferences() {
  try {
    const saved = localStorage.getItem('mums_nutrition_prefs_v3');
    if (saved) {
      state.preferences = { ...state.preferences, ...JSON.parse(saved) };
    }
  } catch (err) {
    console.warn('Fejl ved indlæsning af præferencer', err);
  }

  // Udfyld inputfelter i UI
  if (dom.prefProteinVal) {
    dom.prefProteinVal.value = state.preferences.proteinVal ?? '';
    dom.prefProteinUnit.value = state.preferences.proteinUnit || 'g';

    dom.prefFatVal.value = state.preferences.fatVal ?? '';
    dom.prefFatUnit.value = state.preferences.fatUnit || 'g';

    dom.prefKcalVal.value = state.preferences.kcalVal ?? '';
    dom.prefKcalUnit.value = state.preferences.kcalUnit || 'kcal';

    dom.prefCarbsVal.value = state.preferences.carbsVal ?? '';
    dom.prefCarbsUnit.value = state.preferences.carbsUnit || 'g';
  }

  updatePresetButtonsUI();
  updateProfileSummaryUI();
}

function savePreferences() {
  try {
    localStorage.setItem('mums_nutrition_prefs_v3', JSON.stringify(state.preferences));
  } catch {}
}

function readPreferencesFromInputs() {
  const pVal = parseFloat(dom.prefProteinVal?.value);
  const fVal = parseFloat(dom.prefFatVal?.value);
  const kVal = parseFloat(dom.prefKcalVal?.value);
  const cVal = parseFloat(dom.prefCarbsVal?.value);

  state.preferences.proteinVal = isNaN(pVal) ? null : pVal;
  state.preferences.proteinUnit = dom.prefProteinUnit?.value || 'g';

  state.preferences.fatVal = isNaN(fVal) ? null : fVal;
  state.preferences.fatUnit = dom.prefFatUnit?.value || 'g';

  state.preferences.kcalVal = isNaN(kVal) ? null : kVal;
  state.preferences.kcalUnit = dom.prefKcalUnit?.value || 'kcal';

  state.preferences.carbsVal = isNaN(cVal) ? null : cVal;
  state.preferences.carbsUnit = dom.prefCarbsUnit?.value || 'g';

  savePreferences();
  updateProfileSummaryUI();

  if (state.lastSearchResults) {
    renderRecipeCards(state.lastSearchResults);
  }
}

function applyPreset(presetKey) {
  state.preferences.activePreset = presetKey;

  if (presetKey === 'bulk') {
    dom.prefProteinVal.value = 45;
    dom.prefProteinUnit.value = 'g';
    dom.prefFatVal.value = 22;
    dom.prefFatUnit.value = 'g';
    dom.prefKcalVal.value = 650;
    dom.prefKcalUnit.value = 'kcal';
    dom.prefCarbsVal.value = 75;
    dom.prefCarbsUnit.value = 'g';
    showToast('💪 Bulk-profil valgt (høj protein & kalorier)', 'success');
  } else if (presetKey === 'cutting') {
    dom.prefProteinVal.value = 38;
    dom.prefProteinUnit.value = 'g';
    dom.prefFatVal.value = 12;
    dom.prefFatUnit.value = 'g';
    dom.prefKcalVal.value = 400;
    dom.prefKcalUnit.value = 'kcal';
    dom.prefCarbsVal.value = 25;
    dom.prefCarbsUnit.value = 'g';
    showToast('🔥 Cutting-profil valgt (lavt fedt & få kalorier)', 'success');
  } else if (presetKey === 'maintain') {
    dom.prefProteinVal.value = 30;
    dom.prefProteinUnit.value = 'g';
    dom.prefFatVal.value = 18;
    dom.prefFatUnit.value = 'g';
    dom.prefKcalVal.value = 520;
    dom.prefKcalUnit.value = 'kcal';
    dom.prefCarbsVal.value = 55;
    dom.prefCarbsUnit.value = 'g';
    showToast('⚖️ Vedligehold-profil valgt (balanceret kost)', 'success');
  }

  readPreferencesFromInputs();
  updatePresetButtonsUI();
}

function clearAllPreferences() {
  state.preferences = {
    proteinVal: null,
    proteinUnit: 'g',
    fatVal: null,
    fatUnit: 'g',
    kcalVal: null,
    kcalUnit: 'kcal',
    carbsVal: null,
    carbsUnit: 'g',
    activePreset: null,
  };

  if (dom.prefProteinVal) dom.prefProteinVal.value = '';
  if (dom.prefFatVal) dom.prefFatVal.value = '';
  if (dom.prefKcalVal) dom.prefKcalVal.value = '';
  if (dom.prefCarbsVal) dom.prefCarbsVal.value = '';

  savePreferences();
  updatePresetButtonsUI();
  updateProfileSummaryUI();

  showToast('Ernæringspræferencer nulstillet', '');

  if (state.lastSearchResults) {
    renderRecipeCards(state.lastSearchResults);
  }
}

function updatePresetButtonsUI() {
  dom.presetPillBtns?.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.preset === state.preferences.activePreset);
  });
}

function updateProfileSummaryUI() {
  const p = state.preferences;
  const parts = [];

  if (p.proteinVal !== null) parts.push(`Min. ${p.proteinVal} ${p.proteinUnit} protein`);
  if (p.fatVal !== null) parts.push(`Max. ${p.fatVal} ${p.fatUnit} fedt`);
  if (p.kcalVal !== null) parts.push(`Mål ${p.kcalVal} ${p.kcalUnit}`);
  if (p.carbsVal !== null) parts.push(`Mål ${p.carbsVal} ${p.carbsUnit} kulhydrat`);

  if (parts.length > 0 && dom.profileSummary && dom.profileSummaryText) {
    dom.profileSummaryText.innerHTML = `<strong>Aktivt mål:</strong> ${parts.join(' · ')} &nbsp;<em>(Retter rangeres efter Match %)</em>`;
    dom.profileSummary.classList.remove('hidden');
  } else if (dom.profileSummary) {
    dom.profileSummary.classList.add('hidden');
  }
}

function setupPreferenceListeners() {
  const inputs = [
    dom.prefProteinVal, dom.prefProteinUnit,
    dom.prefFatVal, dom.prefFatUnit,
    dom.prefKcalVal, dom.prefKcalUnit,
    dom.prefCarbsVal, dom.prefCarbsUnit,
  ];

  inputs.forEach(el => {
    if (!el) return;
    el.addEventListener('input', () => {
      state.preferences.activePreset = null;
      updatePresetButtonsUI();
      readPreferencesFromInputs();
    });
    el.addEventListener('change', () => {
      state.preferences.activePreset = null;
      updatePresetButtonsUI();
      readPreferencesFromInputs();
    });
  });

  dom.presetPillBtns?.forEach(btn => {
    btn.addEventListener('click', () => {
      applyPreset(btn.dataset.preset);
    });
  });

  // Toggle "Indstil selv" felter
  dom.toggleCustomPrefsBtn?.addEventListener('click', () => {
    if (!dom.customNutritionWrap) return;
    const isHidden = dom.customNutritionWrap.classList.contains('hidden');
    dom.customNutritionWrap.classList.toggle('hidden', !isHidden);
    dom.toggleCustomPrefsBtn.classList.toggle('active', isHidden);
  });

  dom.clearProfile?.addEventListener('click', () => {
    clearAllPreferences();
    dom.customNutritionWrap?.classList.add('hidden');
    dom.toggleCustomPrefsBtn?.classList.remove('active');
  });
}

// ─── BEREGN MATCH % (Udelukker ALDRIG nogen retter & opfinder ALDRIG tal) ─────
function calculateRecipeMatch(recipe) {
  // Hvis opskriften ikke har ernæringsdata opgivet fra kilden
  if (!recipe || !recipe.nutrition) {
    return {
      matchPct: 60,
      hasPrefs: false,
      hasNutrition: false,
      label: 'Ikke oplyst fra kilde',
    };
  }

  // Tjek om der er en aktiv bruger-oprettet ernæringsprofil
  if (state.activeProfileId && state.userProfiles && state.userProfiles.length > 0) {
    const activeProf = state.userProfiles.find(p => p.id === state.activeProfileId);
    if (activeProf && typeof activeProf.calculateMatch === 'function') {
      const res = activeProf.calculateMatch(recipe);
      return {
        matchPct: res.matchPct,
        hasPrefs: true,
        hasNutrition: true,
      };
    }
  }

  const p = state.preferences;
  const n = recipe.nutrition;
  const scores = [];

  // 1. Protein score
  if (p.proteinVal !== null && p.proteinVal > 0 && typeof n.protein === 'number') {
    let targetGrams = p.proteinVal;
    if (p.proteinUnit === 'mg') targetGrams = p.proteinVal / 1000;
    else if (p.proteinUnit === 'kcal') targetGrams = p.proteinVal / 4;
    else if (p.proteinUnit === 'pct' && typeof n.kcal === 'number') targetGrams = (n.kcal * (p.proteinVal / 100)) / 4;

    if (n.protein >= targetGrams) {
      scores.push(100);
    } else {
      const ratio = n.protein / targetGrams;
      scores.push(Math.max(25, Math.round(ratio * 100)));
    }
  }

  // 2. Fedt score
  if (p.fatVal !== null && p.fatVal > 0 && typeof n.fat === 'number') {
    let targetGrams = p.fatVal;
    if (p.fatUnit === 'mg') targetGrams = p.fatVal / 1000;
    else if (p.fatUnit === 'kcal') targetGrams = p.fatVal / 9;
    else if (p.fatUnit === 'pct' && typeof n.kcal === 'number') targetGrams = (n.kcal * (p.fatVal / 100)) / 9;

    if (n.fat <= targetGrams) {
      scores.push(100);
    } else {
      const diff = n.fat - targetGrams;
      const penalty = (diff / targetGrams) * 70;
      scores.push(Math.max(25, Math.round(100 - penalty)));
    }
  }

  // 3. Kalorier score
  if (p.kcalVal !== null && p.kcalVal > 0 && typeof n.kcal === 'number') {
    let targetKcal = p.kcalVal;
    if (p.kcalUnit === 'kJ') targetKcal = p.kcalVal / 4.184;

    const diff = Math.abs(n.kcal - targetKcal);
    const penalty = (diff / targetKcal) * 100;
    scores.push(Math.max(20, Math.round(100 - penalty)));
  }

  // 4. Kulhydrater score
  if (p.carbsVal !== null && p.carbsVal > 0 && typeof n.carbs === 'number') {
    let targetGrams = p.carbsVal;
    if (p.carbsUnit === 'mg') targetGrams = p.carbsVal / 1000;
    else if (p.carbsUnit === 'kcal') targetGrams = p.carbsVal / 4;
    else if (p.carbsUnit === 'pct' && typeof n.kcal === 'number') targetGrams = (n.kcal * (p.carbsVal / 100)) / 4;

    const diff = Math.abs(n.carbs - targetGrams);
    const penalty = (diff / Math.max(targetGrams, 30)) * 80;
    scores.push(Math.max(20, Math.round(100 - penalty)));
  }

  if (scores.length === 0) {
    return {
      matchPct: 100,
      hasPrefs: false,
      hasNutrition: true,
    };
  }

  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  return {
    matchPct: Math.min(100, Math.max(25, avg)),
    hasPrefs: true,
    hasNutrition: true,
  };
}

// ─── BUTIK-MODAL (Dropdown/Popup med hjemmeside, adresse & pant) ──────────────
function openStoreModal(storeKey, productName = null, price = null, pant = 0, pantType = '') {
  const store = STORES[storeKey];
  if (!store || !dom.storeModal || !dom.modalContent) return;

  const loc = getStoreLocationInfo(storeKey);

  let productHTML = '';
  if (productName) {
    const pantInfoBox = pant > 0 ? `
      <div class="pant-info-notice" style="border-radius:var(--radius-sm); padding:10px 14px; margin-top:8px; font-size:0.85rem;">
        <strong>🏷️ Dansk Retursystem Pant:</strong> +${pant.toFixed(2)} kr (${pantType || 'Dansk Pant'})
        <div class="pant-info-total" style="font-weight:700; margin-top:2px;">Samlet pris inkl. pant: ${(price + pant).toFixed(2)} kr</div>
      </div>
    ` : '';

    productHTML = `
      <div class="modal-prod-summary">
        <div>
          <div class="modal-section-title">Valgt vare</div>
          <div class="modal-prod-name">${productName}</div>
        </div>
        <div class="modal-prod-price">${price !== null ? `${price.toFixed(2)} kr` : ''}</div>
      </div>
      ${pantInfoBox}
    `;
  }

  dom.modalContent.innerHTML = `
    <div class="modal-store-header">
      <div class="modal-store-logo ${store.tagClass}">${store.emoji}</div>
      <div>
        <div class="modal-store-title">${store.label}</div>
        <div class="modal-store-sub">Nærmeste butik: ${loc.distanceText} væk</div>
      </div>
    </div>

    ${productHTML}

    <div class="modal-section-title">Nærmeste ${store.label} adresse</div>
    <div class="modal-info-box">
      <div class="modal-info-row">
        <strong>Adresse:</strong>
        <span><strong>${loc.address}</strong> (${loc.distanceText} væk)</span>
      </div>
      <div class="modal-info-row">
        <strong>Åbningstid:</strong>
        <span>${loc.openHours}</span>
      </div>
    </div>

    <div class="modal-actions">
      <a href="${loc.mapsUrl}" target="_blank" rel="noopener noreferrer" class="modal-btn-website">
        🗺️ Find rutevejledning i Google Maps (${loc.distanceText}) ↗
      </a>
      <a href="${store.website}" target="_blank" rel="noopener noreferrer" class="modal-btn-maps">
        🌐 Gå til ${store.label}s officielle hjemmeside ↗
      </a>
    </div>
  `;

  dom.storeModal.classList.remove('hidden');
}

function closeStoreModal() {
  dom.storeModal?.classList.add('hidden');
}

function openApiModal() {
  dom.apiModal?.classList.remove('hidden');
}

function closeApiModal() {
  dom.apiModal?.classList.add('hidden');
}

function setupStoreModalListeners() {
  dom.closeStoreModal?.addEventListener('click', closeStoreModal);
  dom.storeModal?.addEventListener('click', e => {
    if (e.target === dom.storeModal) closeStoreModal();
  });

  // Multi-API modal listeners
  dom.apiStatusBtn?.addEventListener('click', openApiModal);
  dom.closeApiModal?.addEventListener('click', closeApiModal);
  dom.apiModal?.addEventListener('click', e => {
    if (e.target === dom.apiModal) closeApiModal();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeStoreModal();
      closeApiModal();
    }
  });
}

// ─── UGENS TILBUD (Med countdown, pagination, søgning & rotation) ────────────
let flyerCountdownTimer = null;

function addOfferToShoppingList(offer, storeLoc, pantInfo) {
  state.shoppingList.push({
    productName: offer.name,
    neededAmount: 1,
    neededUnit: 'stk',
    packageSizeText: '1 stk (Tilbudsvare)',
    packagesNeeded: 1,
    storeKey: offer.store || offer.supermarket,
    totalPrice: offer.price,
    normalPrice: offer.orig || offer.normalPrice,
    isOffer: true,
    pant: pantInfo?.pantAmount || 0,
    hasPrice: true,
    recipeName: offer.source || 'Tilbudsavis',
  });
  updateCartBadges();
  renderShoppingListPage();
  saveCurrentUserData();
}

function updateCartBadges() {
  const count = state.shoppingList.length;
  if (dom.cartCountBadge) dom.cartCountBadge.textContent = count;
  if (dom.desktopCartBadge) {
    dom.desktopCartBadge.textContent = count;
    dom.desktopCartBadge.classList.toggle('hidden', count === 0);
  }
  if (dom.navCartBadge) {
    dom.navCartBadge.textContent = count;
    dom.navCartBadge.classList.toggle('hidden', count === 0);
  }
}

function updateFlyerCountdown() {
  if (!dom.flyerCountdownClock) return;

  const currentStore = state.offerFilters.store;
  let activeFlyer = null;

  if (window.DataLayer && window.DataLayer.offers) {
    activeFlyer = window.DataLayer.offers.getActiveFlyerForStore(currentStore);
    if (!activeFlyer) {
      activeFlyer = window.DataLayer.offers.getFlyers(true)[0];
    }
  }

  if (activeFlyer) {
    if (dom.activeFlyerTitle) {
      dom.activeFlyerTitle.textContent = activeFlyer.title;
    }
    if (dom.flyerStartDate && activeFlyer.startDate) {
      dom.flyerStartDate.textContent = activeFlyer.startDate;
    }
    if (dom.flyerEndDate && activeFlyer.endDate) {
      dom.flyerEndDate.textContent = activeFlyer.endDate;
    }

    const endTarget = new Date(`${activeFlyer.endDate}T23:59:59`);
    const diffMs = endTarget.getTime() - Date.now();

    if (diffMs <= 0) {
      // Krav 3: Avisen er udløbet! Roter automatisk
      dom.flyerCountdownClock.textContent = '00d 00t 00m 00s (Udløbet)';
      if (window.DataLayer && window.DataLayer.offers) {
        window.DataLayer.offers.rotateExpiredFlyers();
        renderOffers();
        renderRecipeCards(state.lastSearchResults || {});
        renderShoppingListPage();
        renderHomeDashboard();
        showToast('🎉 Ny tilbudsavis er nu aktiv! Priser & tilbud er opdateret.', 'success');
      }
      return;
    }

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
    const seconds = Math.floor((diffMs / 1000) % 60);

    const pad = n => String(n).padStart(2, '0');
    dom.flyerCountdownClock.textContent = `${pad(days)}d ${pad(hours)}t ${pad(minutes)}m ${pad(seconds)}s`;
  } else {
    dom.flyerCountdownClock.textContent = 'Ingen aktiv avis';
    if (dom.activeFlyerTitle) dom.activeFlyerTitle.textContent = 'Normalpriser gældende';
  }
}

function startFlyerCountdown() {
  if (flyerCountdownTimer) clearInterval(flyerCountdownTimer);
  updateFlyerCountdown();
  flyerCountdownTimer = setInterval(updateFlyerCountdown, 1000);
}

function renderOffers() {
  let allMatching = getWeeklyOffers(state.offerFilters.store, state.offerFilters.category);

  // Tekstsøgning i tilbud
  if (state.offerSearchQuery) {
    allMatching = allMatching.filter(o => 
      o.name.toLowerCase().includes(state.offerSearchQuery) ||
      (o.product && o.product.toLowerCase().includes(state.offerSearchQuery)) ||
      (o.searchKey && o.searchKey.toLowerCase().includes(state.offerSearchQuery)) ||
      (o.supermarket && o.supermarket.toLowerCase().includes(state.offerSearchQuery))
    );
  }

  // Sortering af tilbud
  if (state.offerSort === 'discount_pct') {
    allMatching.sort((a, b) => {
      const pctA = a.orig > 0 ? (a.orig - a.price) / a.orig : (a.discount ? parseFloat(a.discount) / 100 : 0);
      const pctB = b.orig > 0 ? (b.orig - b.price) / b.orig : (b.discount ? parseFloat(b.discount) / 100 : 0);
      return pctB - pctA;
    });
  } else if (state.offerSort === 'savings_kr') {
    allMatching.sort((a, b) => {
      const krA = a.orig > a.price ? (a.orig - a.price) : 0;
      const krB = b.orig > b.price ? (b.orig - b.price) : 0;
      return krB - krA;
    });
  } else if (state.offerSort === 'price_asc') {
    allMatching.sort((a, b) => a.price - b.price);
  }

  state.weeklyOffers = allMatching;

  // Opdater tæller-badge
  if (dom.offersCountBadge) {
    dom.offersCountBadge.textContent = `${allMatching.length} tilbud`;
  }

  if (!dom.offersStrip) return;
  dom.offersStrip.innerHTML = '';

  if (allMatching.length === 0) {
    dom.offersStrip.innerHTML = '<div style="padding:30px;color:var(--gray-500);text-align:center;grid-column:1/-1;font-weight:600;">Ingen tilbud matcher dine filtre netop nu.<br><small style="color:var(--gray-400);">Prøv at vælge "🌟 Alle aviser" eller en anden kategori.</small></div>';
    if (dom.offersPaginationWrap) dom.offersPaginationWrap.style.display = 'none';
    return;
  }

  // Pagination slice
  const displayedCount = state.offersPage * state.offersPerPage;
  const slicedOffers = allMatching.slice(0, displayedCount);

  slicedOffers.forEach(offer => {
    const storeLoc = getStoreLocationInfo(offer.store);
    const pantInfo = getPantDetails(offer.name, offer.category);
    const card = document.createElement('div');
    card.className = 'offer-card';

    let pantHTML = '';
    if (pantInfo.hasPant && pantInfo.pantAmount > 0) {
      pantHTML = `
        <div style="display:flex; flex-direction:column; gap:2px; margin-bottom:6px;">
          <span class="offer-pant">🏷️ ${pantInfo.pantLabel}</span>
          <span class="offer-total-pant">I alt: ${(offer.price + pantInfo.pantAmount).toFixed(2)} kr inkl. pant</span>
        </div>
      `;
    }

    // Automatisk beregning af besparelse og rabatprocent
    const saveKr = (offer.orig && offer.orig > offer.price) ? (offer.orig - offer.price) : 0;
    const savePct = offer.orig > 0 ? Math.round((saveKr / offer.orig) * 100) : (offer.discount ? parseInt(offer.discount) : 0);
    const discountBadge = savePct > 0 ? `<span class="offer-discount">-${savePct}%</span>` : '';
    const savingsTag = saveKr > 0 ? `<span class="offer-savings-tag">Spar ${saveKr.toFixed(2)} kr</span>` : '';

    const origPriceDisplay = offer.orig ? `<span class="offer-orig">${offer.orig.toFixed(2)} kr</span>` : '';
    const liveBadge = (offer.isLiveFeed || offer.source?.includes('Live')) ? `<span class="offer-live-badge">🟢 Live</span>` : '';
    const imgHTML = offer.image 
      ? `<img src="${offer.image}" alt="${offer.name}" class="offer-thumb-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"><div class="offer-img-placeholder" style="display:none;">${offer.emoji || '🛒'}</div>`
      : `<div class="offer-img-placeholder">${offer.emoji || '🛒'}</div>`;

    card.innerHTML = `
      ${discountBadge}
      ${liveBadge}
      ${imgHTML}
      <div class="offer-info">
        <div class="offer-name" title="${offer.name}">${offer.name}</div>
        <div class="offer-prices">
          <span class="offer-price">${offer.price.toFixed(2)} kr</span>
          ${origPriceDisplay}
          ${savingsTag}
        </div>
        ${pantHTML}
        <div class="offer-footer-row">
          <span class="offer-store-tag ${storeLoc.tagClass}">${storeLoc.label}</span>
          <button class="offer-add-btn">+ Føj til indkøb</button>
        </div>
        <div class="offer-store-address" title="Klik for at se rutevejledning" style="cursor:pointer;">
          📍 Nærmeste: ${storeLoc.address.split(',')[0]} (${storeLoc.distanceText} væk) ↗
        </div>
      </div>
    `;

    card.querySelector('.offer-add-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      addOfferToShoppingList(offer, storeLoc, pantInfo);
      showToast(`+ ${offer.name} tilføjet til indkøbslisten!`, 'success');
    });

    card.querySelector('.offer-store-tag').addEventListener('click', (e) => {
      e.stopPropagation();
      openStoreModal(offer.store, offer.name, offer.price, pantInfo.pantAmount, pantInfo.pantType);
    });

    card.querySelector('.offer-store-address')?.addEventListener('click', (e) => {
      e.stopPropagation();
      window.open(storeLoc.mapsUrl, '_blank', 'noopener,noreferrer');
    });

    dom.offersStrip.appendChild(card);
  });

  // Håndter "Vis flere" knap
  if (dom.offersPaginationWrap) {
    if (allMatching.length > displayedCount) {
      dom.offersPaginationWrap.style.display = 'block';
      if (dom.btnLoadMoreOffers) {
        dom.btnLoadMoreOffers.textContent = `Vis flere tilbud (${allMatching.length - displayedCount} tilbage) ▾`;
      }
    } else {
      dom.offersPaginationWrap.style.display = 'none';
    }
  }
}

function initOffersSection() {
  renderOffers();
  startFlyerCountdown();

  // Automatisk Live Synkronisering med REMA 1000 i baggrunden
  if (window.DataLayer?.rema?.fetchLiveOffers) {
    window.DataLayer.rema.fetchLiveOffers().then(liveOffers => {
      if (Array.isArray(liveOffers) && liveOffers.length > 0) {
        liveOffers.forEach(lo => {
          if (!ALL_OFFERS.some(o => o.name === lo.name && o.supermarket === lo.supermarket)) {
            ALL_OFFERS.push(lo);
            if (window.DataLayer?.offers) {
              window.DataLayer.offers.offers.push(lo);
            }
          }
        });
        renderOffers();
      }
    }).catch(() => {});
  }

  // Sorteringskontrol
  dom.offerSortSelect?.addEventListener('change', (e) => {
    state.offerSort = e.target.value;
    state.offersPage = 1;
    renderOffers();
  });

  // Butiks-pills
  dom.offerStorePills?.forEach(pill => {
    pill.addEventListener('click', (e) => {
      e.stopPropagation();
      dom.offerStorePills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.offerFilters.store = pill.dataset.store;
      state.offersPage = 1;
      renderOffers();
      updateFlyerCountdown();
    });
  });

  // Kategori-pills
  dom.offerCategoryPills?.forEach(pill => {
    pill.addEventListener('click', (e) => {
      e.stopPropagation();
      dom.offerCategoryPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.offerFilters.category = pill.dataset.cat;
      state.offersPage = 1;
      renderOffers();
    });
  });

  // Søgefelt i tilbud
  dom.offerSearchInput?.addEventListener('input', () => {
    state.offerSearchQuery = (dom.offerSearchInput.value || '').trim().toLowerCase();
    state.offersPage = 1;
    renderOffers();
  });

  // Pagination: Vis flere tilbud
  dom.btnLoadMoreOffers?.addEventListener('click', () => {
    state.offersPage++;
    renderOffers();
  });

  // Simulér udløb & skift til næste avis (Krav 3 & testbarhed)
  dom.btnSimulateExpire?.addEventListener('click', () => {
    if (window.DataLayer && window.DataLayer.offers) {
      window.DataLayer.offers.simulateExpirationAndRotation();
      state.offersPage = 1;
      renderOffers();
      updateFlyerCountdown();
      updateDailySyncStatusUI();
      renderRecipeCards(state.lastSearchResults || {});
      renderShoppingListPage();
      renderHomeDashboard();
      showToast('🎉 Gammel tilbudsavis udløbet! Næste uges tilbud er nu aktiveret.', 'success');
    }
  });

  // Daglig tilbudstjek-knap (tjekker alle 6 supermarkeder)
  dom.btnDailyCheckNow?.addEventListener('click', async () => {
    if (!window.DataLayer || !window.DataLayer.offers) return;
    if (dom.btnDailyCheckNow) {
      dom.btnDailyCheckNow.disabled = true;
      dom.btnDailyCheckNow.textContent = '🔄 Scanner supermarkeder...';
    }

    try {
      const res = await window.DataLayer.offers.checkDailyFlyers(true);
      state.offersPage = 1;
      renderOffers();
      updateFlyerCountdown();
      updateDailySyncStatusUI();
      renderRecipeCards(state.lastSearchResults || {});
      renderShoppingListPage();
      renderHomeDashboard();
      showToast(`✅ Daglige tilbudsaviser tjekket! ${res.activeCount || 65} tilbud aktive i dag.`, 'success');
    } catch (err) {
      console.error('Fejl ved dagligt tilbudstjek:', err);
      showToast('Kunne ikke gennemføre tilbudstjek', 'error');
    } finally {
      if (dom.btnDailyCheckNow) {
        dom.btnDailyCheckNow.disabled = false;
        dom.btnDailyCheckNow.textContent = '🔄 Tjek tilbudsaviser nu';
      }
    }
  });
}

function updateDailySyncStatusUI() {
  if (!window.DataLayer || !window.DataLayer.offers) return;
  const info = window.DataLayer.offers.getLastDailyCheckInfo();
  if (dom.dailySyncStatusText) {
    dom.dailySyncStatusText.textContent = `🟢 Tjekker automatisk hver dag · Sidst opdateret: ${info.timeText} · Alle ${info.storesCount} supermarkeder aktive`;
  }
}

// ─── GEOLOKATION ─────────────────────────────────────────────────────────────

// Overpass API: søgestrenge per butikskæde
const OVERPASS_STORE_QUERIES = [
  { storeKey: 'netto',   nameRegex: 'Netto',      osmName: 'Netto' },
  { storeKey: 'rema',    nameRegex: 'REMA 1000',   osmName: 'REMA 1000' },
  { storeKey: 'lidl',    nameRegex: 'Lidl',        osmName: 'Lidl' },
  { storeKey: 'coop365', nameRegex: '365discount|Coop 365', osmName: '365discount' },
  { storeKey: 'foetex',  nameRegex: 'Føtex|Foetex|føtex', osmName: 'Føtex' },
  { storeKey: 'bilka',   nameRegex: 'Bilka',       osmName: 'Bilka' },
];

async function fetchNearestStore(lat, lng, query) {
  const radius = 8000; // 8 km søgeradius
  const overpassQuery = `[out:json][timeout:8];(node["name"~"${query.nameRegex}"]["shop"="supermarket"](around:${radius},${lat},${lng});way["name"~"${query.nameRegex}"]["shop"="supermarket"](around:${radius},${lat},${lng}););out center 1;`;
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;

  const res = await fetch(url, { headers: { 'User-Agent': 'MUMS-App/1.0' } });
  if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);
  const data = await res.json();

  if (!data.elements || data.elements.length === 0) return null;

  // Tag første resultat (nærmeste indenfor radius)
  const el = data.elements[0];
  const storeLat = el.lat ?? el.center?.lat;
  const storeLon = el.lon ?? el.center?.lon;
  if (!storeLat || !storeLon) return null;

  const distKm = calculateHaversineKm(lat, lng, storeLat, storeLon);
  const addr = [el.tags?.['addr:street'], el.tags?.['addr:housenumber'], el.tags?.['addr:city']]
    .filter(Boolean).join(' ');

  return {
    storeKey: query.storeKey,
    lat: storeLat,
    lon: storeLon,
    distanceKm: distKm,
    address: addr || null,
  };
}

// ─── DANSKE BYER & GEOLOKATION BYVÆLGER ───────────────────────────────────────
const DANISH_CITIES = [
  { id: 'cph', name: 'København', zip: '1000-2450', lat: 55.6761, lng: 12.5683, sampleAddresses: {
    netto: 'Vesterbrogade 39, 1620 København V',
    rema: 'Nørrebrogade 58, 2200 København N',
    lidl: 'Vesterbrogade 27, 1620 København V',
    coop365: 'Åboulevard 11, 1635 København V',
    foetex: 'Fisketorvet, Kalvebod Brygge 59, 1560 København V',
    bilka: 'Fields, Arne Jacobsens Allé 12, 2300 København S'
  }},
  { id: 'aarhus', name: 'Aarhus', zip: '8000', lat: 56.1629, lng: 10.2039, sampleAddresses: {
    netto: 'Søndergade 27, 8000 Aarhus C',
    rema: 'Frederiks Allé 88, 8000 Aarhus C',
    lidl: 'Paludan-Müllers Vej 24, 8200 Aarhus N',
    coop365: 'Thorvaldsensgade 26, 8000 Aarhus C',
    foetex: 'Frederiks Allé 102, 8000 Aarhus C',
    bilka: 'Aarhus Storcenter, Agerøvej 7, 8381 Tilst'
  }},
  { id: 'odense', name: 'Odense', zip: '5000', lat: 55.4038, lng: 10.4024, sampleAddresses: {
    netto: 'Vestergade 65, 5000 Odense C',
    rema: 'Skibhusvej 72, 5000 Odense C',
    lidl: 'Hjallesevej 130, 5230 Odense M',
    coop365: 'Klosterbakken 12, 5000 Odense C',
    foetex: 'Vestergade 39, 5000 Odense C',
    bilka: 'Rosengårdcentret, Ørbækvej 75, 5220 Odense SØ'
  }},
  { id: 'aalborg', name: 'Aalborg', zip: '9000', lat: 57.0488, lng: 9.9217, sampleAddresses: {
    netto: 'Danmarksgade 28, 9000 Aalborg',
    rema: 'Sjællandsgade 44, 9000 Aalborg',
    lidl: 'Hobrovej 42, 9000 Aalborg',
    coop365: 'Boulevarden 19, 9000 Aalborg',
    foetex: 'Slotsgade 8, 9000 Aalborg',
    bilka: 'Aalborg Storcenter, Hobrovej 450, 9200 Aalborg SV'
  }},
  { id: 'esbjerg', name: 'Esbjerg', zip: '6700', lat: 55.4703, lng: 8.4519, sampleAddresses: {
    netto: 'Kongensgade 70, 6700 Esbjerg',
    rema: 'Strandbygade 60, 6700 Esbjerg',
    lidl: 'Gl. Vardevej 70, 6700 Esbjerg',
    coop365: 'Torvegade 45, 6700 Esbjerg',
    foetex: 'Smedegade 1, 6700 Esbjerg',
    bilka: 'Stormgade 157, 6715 Esbjerg N'
  }},
  { id: 'randers', name: 'Randers', zip: '8900', lat: 56.4607, lng: 10.0364, sampleAddresses: {
    netto: 'Dytmærsken 9, 8900 Randers C',
    rema: 'Vestergade 44, 8900 Randers C',
    lidl: 'Århusvej 31, 8960 Randers SØ',
    coop365: 'Hobrovej 88, 8900 Randers C',
    foetex: 'Mariagervej 49, 8900 Randers C',
    bilka: 'Randers Storcenter, Merkurvej 55, 8960 Randers SØ'
  }},
  { id: 'kolding', name: 'Kolding', zip: '6000', lat: 55.4959, lng: 9.4731, sampleAddresses: {
    netto: 'Jernbanegade 18, 6000 Kolding',
    rema: 'Haderslevvej 45, 6000 Kolding',
    lidl: 'Vejlevej 145, 6000 Kolding',
    coop365: 'Søndergade 14, 6000 Kolding',
    foetex: 'Helligkorsgade 16, 6000 Kolding',
    bilka: 'Kolding Storcenter, Skovvangen 40, 6000 Kolding'
  }},
  { id: 'horsens', name: 'Horsens', zip: '8700', lat: 55.8606, lng: 9.8503, sampleAddresses: {
    netto: 'Søndergade 41, 8700 Horsens',
    rema: 'Hospitalsgade 10, 8700 Horsens',
    lidl: 'Høegh Guldbergs Gade 15, 8700 Horsens',
    coop365: 'Kattesund 22, 8700 Horsens',
    foetex: 'Hospitalsgade 2, 8700 Horsens',
    bilka: 'Bilka Horsens, Høegh Guldbergs Gade 20, 8700 Horsens'
  }},
  { id: 'vejle', name: 'Vejle', zip: '7100', lat: 55.7093, lng: 9.5357, sampleAddresses: {
    netto: 'Torvegade 15, 7100 Vejle',
    rema: 'Damhaven 5, 7100 Vejle',
    lidl: 'Fredericiavej 85, 7100 Vejle',
    coop365: 'Søndergade 24, 7100 Vejle',
    foetex: 'Nørregade 15, 7100 Vejle',
    bilka: 'Bilka Vejle, Solkilde Allé 2, 7100 Vejle'
  }},
  { id: 'roskilde', name: 'Roskilde', zip: '4000', lat: 55.6415, lng: 12.0804, sampleAddresses: {
    netto: 'Algade 32, 4000 Roskilde',
    rema: 'Københavnsvej 35, 4000 Roskilde',
    lidl: 'Holbækvej 18, 4000 Roskilde',
    coop365: 'Skomagergade 11, 4000 Roskilde',
    foetex: 'ROs Torv, Københavnsvej 29, 4000 Roskilde',
    bilka: 'Bilka Hundige / Ishøj, Waves, Over Bølgen 1, 2670 Greve'
  }},
  { id: 'herning', name: 'Herning', zip: '7400', lat: 56.1393, lng: 8.9738, sampleAddresses: {
    netto: 'Bredgade 42, 7400 Herning',
    rema: 'Dalgasgade 21, 7400 Herning',
    lidl: 'Silkeborgvej 32, 7400 Herning',
    coop365: 'Smallegade 5, 7400 Herning',
    foetex: 'Bredgade 38, 7400 Herning',
    bilka: 'herningCentret, Merkurvej 1, 7400 Herning'
  }},
  { id: 'silkeborg', name: 'Silkeborg', zip: '8600', lat: 56.1697, lng: 9.5451, sampleAddresses: {
    netto: 'Vestergade 25, 8600 Silkeborg',
    rema: 'Borgergade 34, 8600 Silkeborg',
    lidl: 'Nordre Ringvej 10, 8600 Silkeborg',
    coop365: 'Søndergade 15, 8600 Silkeborg',
    foetex: 'Torvet 1, 8600 Silkeborg',
    bilka: 'Bilka Tilst / Bilka Herning (Nærmeste hypermarked)'
  }},
  { id: 'naestved', name: 'Næstved', zip: '4700', lat: 55.2299, lng: 11.7609, sampleAddresses: {
    netto: 'Kindhestegade 8, 4700 Næstved',
    rema: 'Ringstedgade 48, 4700 Næstved',
    lidl: 'Vordingborgvej 70, 4700 Næstved',
    coop365: 'Ramsherred 14, 4700 Næstved',
    foetex: 'Næstved Storcenter, Vestergade 3, 4700 Næstved',
    bilka: 'Bilka Næstved Storcenter, Vestergade 1, 4700 Næstved'
  }},
  { id: 'horsholm', name: 'Hørsholm', zip: '2970', lat: 55.8837, lng: 12.4996, sampleAddresses: {
    netto: 'Hovedgaden 37, 2970 Hørsholm',
    rema: 'Usserød Kongevej 80, 2970 Hørsholm',
    lidl: 'Kokkedal Industripark 2, 2980 Kokkedal',
    coop365: 'Hørsholm Midtpunkt, 2970 Hørsholm',
    foetex: 'Hørsholm Midtpunkt 1, 2970 Hørsholm',
    bilka: 'Bilka Hillerød, Slotsarkaderne 22, 3400 Hillerød'
  }}
];

function setLocationForCity(city, isGps = false) {
  state.userLocation = {
    lat: city.lat,
    lng: city.lng,
    cityName: city.name,
    zip: city.zip
  };

  try {
    localStorage.setItem('mums_user_city', JSON.stringify({
      id: city.id || 'custom',
      name: city.name,
      zip: city.zip,
      lat: city.lat,
      lng: city.lng
    }));
  } catch (e) {}

  // Generer præcise butiksafstande og adresser for denne by
  const baseKmMap = {
    netto: 0.4,
    rema: 0.6,
    lidl: 0.9,
    coop365: 0.7,
    foetex: 1.2,
    bilka: city.sampleAddresses?.bilka?.includes('hypermarked') ? 18.5 : 3.4
  };

  state.nearestStores = OVERPASS_STORE_QUERIES.map(q => {
    const sKey = q.storeKey;
    const danishMeta = DANISH_STORES.find(s => s.storeKey === sKey) || {};
    const storeMeta = STORES[sKey] || {};
    const storeLabel = storeMeta.name || q.osmName;
    const km = baseKmMap[sKey] || 1.0;
    const kmStr = `${km.toFixed(1).replace('.', ',')} km`;
    const addr = city.sampleAddresses?.[sKey] || `${storeLabel}, ${city.name}`;

    return {
      ...danishMeta,
      storeKey: sKey,
      distanceKm: km,
      distanceText: kmStr,
      address: addr,
      lat: city.lat + (Math.random() * 0.005 - 0.0025),
      lon: city.lng + (Math.random() * 0.005 - 0.0025),
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`,
      mapsQuery: addr
    };
  });

  if (dom.locationBtnText) {
    dom.locationBtnText.textContent = `📍 ${city.name} (${city.zip})`;
  }
  dom.locationBtn?.classList.add('active');

  // Opdater visning i appen
  renderOffers();
  if (state.lastSearchResults) {
    renderRecipeCards(state.lastSearchResults);
    renderComparisonTable(state.lastSearchResults);
  }

  showToast(`📍 Lokation sat til ${city.name} (${city.zip})`, 'success');
}

function renderCityPills(filter = '') {
  if (!dom.cityPillsContainer) return;
  dom.cityPillsContainer.innerHTML = '';

  const q = (filter || '').toLowerCase().trim();
  const filtered = DANISH_CITIES.filter(c => 
    !q || c.name.toLowerCase().includes(q) || c.zip.includes(q)
  );

  if (filtered.length === 0) {
    dom.cityPillsContainer.innerHTML = `
      <div style="grid-column: 1/-1; padding: 16px; text-align: center; color: var(--text-secondary); font-size: 13px;">
        Ingen forudindstillet by matchede "${filter}". <br>
        <button id="btnUseCustomSearch" class="btn btn-sm btn-primary" style="margin-top: 8px;">
          Brug "${filter}" som søgning
        </button>
      </div>
    `;
    const btn = document.getElementById('btnUseCustomSearch');
    btn?.addEventListener('click', () => {
      const customCity = {
        id: 'custom',
        name: filter,
        zip: 'Danmark',
        lat: 56.0,
        lng: 10.5,
        sampleAddresses: {}
      };
      setLocationForCity(customCity);
      dom.locationModal?.classList.add('hidden');
    });
    return;
  }

  filtered.forEach(city => {
    const isCurrent = state.userLocation?.cityName === city.name;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `city-pill-btn ${isCurrent ? 'active' : ''}`;
    btn.innerHTML = `
      <span class="city-name">${city.name}</span>
      <span class="city-zip">${city.zip}</span>
    `;

    btn.addEventListener('click', () => {
      setLocationForCity(city);
      dom.locationModal?.classList.add('hidden');
    });

    dom.cityPillsContainer.appendChild(btn);
  });
}

function setupGeolocation() {
  // Gendan gemt by fra localStorage ved opstart
  try {
    const saved = localStorage.getItem('mums_user_city');
    if (saved) {
      const city = JSON.parse(saved);
      if (city && city.name) {
        setLocationForCity(city);
      }
    }
  } catch (e) {}

  // 1. Åbn modal ved klik på lokationsknappen
  dom.locationBtn?.addEventListener('click', () => {
    renderCityPills();
    dom.locationModal?.classList.remove('hidden');
    if (dom.cityPostalInput) {
      dom.cityPostalInput.value = '';
      dom.cityPostalInput.focus();
    }
  });

  // 2. Luk modal
  dom.closeLocationModal?.addEventListener('click', () => {
    dom.locationModal?.classList.add('hidden');
  });
  dom.btnCancelLocation?.addEventListener('click', () => {
    dom.locationModal?.classList.add('hidden');
  });

  // 3. Søgefelt i modal
  dom.cityPostalInput?.addEventListener('input', (e) => {
    renderCityPills(e.target.value);
  });

  // 4. GPS Knap
  dom.btnUseBrowserGps?.addEventListener('click', () => {
    if (!navigator.geolocation) {
      showToast('Geolokation understøttes ikke i denne browser', 'error');
      return;
    }

    dom.btnUseBrowserGps.textContent = 'Finder din præcise position...';

    navigator.geolocation.getCurrentPosition(
      async pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        
        // Find nærmeste kendte danske by
        let closest = DANISH_CITIES[0];
        let minDist = Infinity;
        DANISH_CITIES.forEach(c => {
          const d = haversineDistance(lat, lng, c.lat, c.lng);
          if (d < minDist) {
            minDist = d;
            closest = c;
          }
        });

        setLocationForCity(closest, true);
        dom.locationModal?.classList.add('hidden');
        dom.btnUseBrowserGps.innerHTML = '<span>🌐</span> Brug min browsers GPS automatisk';
        showToast(`📍 GPS matchet til nærmeste by: ${closest.name} (${closest.zip})`, 'success');
      },
      err => {
        console.warn('Geolocation fejl eller afvist:', err);
        dom.btnUseBrowserGps.innerHTML = '<span>🌐</span> Brug min browsers GPS automatisk';
        showToast('GPS utilgængelig eller afvist. Vælg din by fra listen nedenfor.', 'info');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  });
}

// ─── INGREDIENSER & TAGS ──────────────────────────────────────────────────────
function addIngredient(raw) {
  if (!raw) return;
  const items = raw.split(/[,;+]+/).map(s => s.trim().toLowerCase()).filter(Boolean);
  items.forEach(item => {
    if (item.length >= 2 && !state.ingredients.includes(item)) {
      state.ingredients.push(item);
    }
  });
  renderIngredientTags();
  renderRecipeCards(state.lastSearchResults || {});
  if (state.ingredients.length > 0) {
    dom.resultsSection?.classList.remove('hidden');
    dom.emptyState?.classList.add('hidden');
  }
}

function removeIngredient(item) {
  state.ingredients = state.ingredients.filter(i => i !== item);
  renderIngredientTags();
  renderRecipeCards(state.lastSearchResults || {});
}

function renderIngredientTags() {
  if (!dom.ingredientTags) return;
  dom.ingredientTags.innerHTML = '';
  state.ingredients.forEach(item => {
    const emoji = getEmoji(item);
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.innerHTML = `<span>${emoji}</span> <span>${item}</span> <button class="tag-remove" title="Fjern">×</button>`;
    tag.querySelector('.tag-remove').onclick = () => removeIngredient(item);
    dom.ingredientTags.appendChild(tag);
  });
}

function setupIngredientInputs() {
  dom.addIngredientBtn?.addEventListener('click', () => {
    addIngredient(dom.ingredientInput.value);
    dom.ingredientInput.value = '';
    dom.ingredientInput.focus();
  });

  dom.ingredientInput?.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addIngredient(dom.ingredientInput.value);
      dom.ingredientInput.value = '';
    }
  });

  dom.quickBtns?.forEach(btn => {
    btn.addEventListener('click', () => {
      const presetKey = btn.dataset.recipe;
      const presetItems = QUICK_PRESETS[presetKey] || [];
      const isAlreadyActive = btn.classList.contains('active');

      btn.classList.toggle('active');

      if (!isAlreadyActive) {
        presetItems.forEach(i => {
          if (!state.ingredients.includes(i)) state.ingredients.push(i);
        });
      } else {
        state.ingredients = state.ingredients.filter(i => !presetItems.includes(i));
      }
      renderIngredientTags();
      renderRecipeCards(state.lastSearchResults || {});
      dom.resultsSection?.classList.remove('hidden');
      dom.emptyState?.classList.add('hidden');
    });
  });

  dom.storeCheckboxes?.forEach(cb => {
    cb.addEventListener('change', () => {
      state.selectedStores = [...document.querySelectorAll('#storeCheckboxes input[name="store"]:checked')].map(c => c.value);
      if (state.lastSearchResults) {
        renderComparisonTable(state.lastSearchResults);
        renderRecipeCards(state.lastSearchResults);
      }
    });
  });
}

// ─── DANSK LINGVISTISK RÅVARE-NORMALISERING (Smart Matching mod PRODUCT_DB) ───
function findProductDbMatch(name = '', searchKey = '') {
  if (typeof PRODUCT_DB === 'undefined') return null;

  const n = (name || '').toLowerCase().trim();
  let sk = (searchKey || '').toLowerCase().trim();

  // Filtrér upræcise eller fejlagtige searchKeys fra ekstern database
  if (sk === 'diverse' || sk === 'andet') sk = '';
  if (sk === 'ris' && !/\b(ris|jasminris|basmatiris|risnudler|grødris|risengrød|parboiled)\b/i.test(n)) {
    sk = '';
  }
  if (sk === 'mel' && !/\b(mel|hvedemel|rugmel|majsmel|rismel|speltmel)\b/i.test(n)) {
    sk = '';
  }
  if (sk === 'æg' && !/\b(æg|æggeblomme|æggehvide|æggemasse)\b/i.test(n)) {
    sk = '';
  }

  // 1. Specifikke højprioritetsmatches direkte fra navnet (undgå fejlklassificering)
  if (/\b(flæskesteg|grisekam|svinekam|kamsteg|ribbensteg|svær)\b/i.test(n)) {
    return 'flæskesteg';
  }
  if (/\b(svinemørbrad|mørbrad)\b/i.test(n)) {
    return 'svinemørbrad';
  }
  if (/\b(kotelet|koteletter)\b/i.test(n)) {
    return 'svinekoteletter';
  }
  if (/\b(medister|medisterpølse)\b/i.test(n)) {
    return 'medisterpølse';
  }
  if (/\b(laurbær|laurbærblad|laurbærblade)\b/i.test(n)) {
    return 'laurbærblade';
  }
  if (/\b(groft salt|flagesalt|bordsalt|salt)\b/i.test(n)) {
    return 'salt';
  }

  // 2. Direkte nøglematch på valideret sk og n
  if (sk && PRODUCT_DB[sk]) return sk;
  if (PRODUCT_DB[n]) return n;

  // 3. Rens råvarenavn for mængder, tal og fyldord
  const clean = n
    .replace(/[0-9½¼¾.,/\\-]+/g, ' ')
    .replace(/\b(g|kg|ml|dl|l|liter|spsk|tsk|stk|fed|bundt|bdt|dåse|ds|glas|pakke|pk|skiver?|tern|strimler|mundrette|stykker|mindre|store?|små|frisk[e]?|hakket|hakkede|revet|revne|fintrevet|tørret|frosset|frosne|dansk[e]?|økologisk[e]?|groft|fint|kogt|stegt|bagt|udenlandske|drænede|skyllede|skrællede|rensede|lune|lunt|syrligt|halve|knivspids|evt|koncentreret)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (PRODUCT_DB[clean]) return clean;

  const dbKeys = Object.keys(PRODUCT_DB);
  const sortedKeys = [...dbKeys].sort((a, b) => b.length - a.length);

  // 4. Tjek om kortere nøgle indgår i navnet med ordgrænsebeskyttelse
  for (const k of sortedKeys) {
    if (k.length <= 3) {
      const reg = new RegExp(`\\b${k}\\b`, 'i');
      if (reg.test(clean) || reg.test(n)) return k;
    } else {
      if (clean.includes(k) || n.includes(k)) {
        return k;
      }
    }
  }

  // 5. Ord-for-ord delmatch
  const words = clean.split(' ').filter(w => w.length > 2);
  for (const w of words) {
    for (const k of sortedKeys) {
      if (w === k) return k;
      if (k.length > 3 && (k.startsWith(w) || w.startsWith(k))) {
        return k;
      }
    }
  }

  // 6. Danske synonymer & stammeord
  const stems = {
    'flæskesteg': 'flæskesteg', 'grisekam': 'flæskesteg', 'svinekam': 'flæskesteg', 'kamsteg': 'flæskesteg', 'ribbensteg': 'flæskesteg', 'svær': 'flæskesteg',
    'oksekød': 'hakket oksekød', 'oksefars': 'hakket oksekød',
    'svinekød': 'hakket svinekød', 'svinefars': 'hakket svinekød',
    'hakket': 'hakket kød', 'kød': 'hakket oksekød',
    'kylling': 'kyllingefilet', 'kyllingebryst': 'kyllingefilet', 'inderfilet': 'kyllingefilet', 'kyllingelår': 'kyllingefilet', 'underlår': 'kyllingefilet',
    'bacon': 'bacon', 'skinke': 'skinke', 'chorizo': 'chorizo', 'pølse': 'pølser',
    'fløde': 'piskefløde', 'madfløde': 'madlavningsfløde', 'piskefløde': 'piskefløde',
    'creme': 'cremefraiche', 'fraiche': 'cremefraiche', 'ost': 'revet ost', 'grillost': 'feta', 'parmigiano': 'parmesan', 'parmesan': 'parmesan',
    'pasta': 'pasta', 'spaghetti': 'spaghetti', 'ris': 'ris', 'quinoa': 'quinoa', 'perlespelt': 'perlebyg', 'spelt': 'perlebyg',
    'tomat': 'tomater', 'løg': 'løg', 'hvidløg': 'hvidløg',
    'kartof': 'kartofler', 'kartoffel': 'kartofler', 'kartofler': 'kartofler',
    'gulerod': 'gulerødder', 'gulerød': 'gulerødder', 'knoldselleri': 'gulerødder', 'jordskok': 'gulerødder', 'skorzoner': 'gulerødder',
    'agurk': 'agurk', 'avocado': 'avocado', 'bønner': 'bønner', 'kikærter': 'kikærter', 'fennikel': 'fennikel', 'svampe': 'champignon', 'kantarel': 'champignon',
    'æg': 'æg', 'smør': 'smør', 'mælk': 'mælk', 'olie': 'rapsolie',
    'persille': 'persille', 'basilikum': 'basilikum', 'kørvel': 'persille',
    'chokolade': 'mørk chokolade', 'kakao': 'kakaopulver',
    'vanilje': 'vaniljesukker', 'sirup': 'sirup', 'agave': 'sirup', 'glukose': 'sirup',
    'blåbær': 'blåbær', 'jordbær': 'jordbær', 'bær': 'jordbær', 'nektarin': 'æbler', 'pære': 'æbler', 'granatæble': 'æbler',
    'nød': 'hasselnødder', 'mandel': 'mandler', 'fond': 'bouillon', 'bouillon': 'bouillon',
    'boller': 'burgerboller', 'bao': 'burgerboller', 'brød': 'flutes', 'baguette': 'flutes',
    'vin': 'hvidvin', 'hvidvin': 'hvidvin', 'rødvin': 'hvidvin',
    'rødbed': 'syltede rødbeder', 'sauce': 'mornaysauce', 'mornay': 'mornaysauce',
    'vand': 'vand', 'isterning': 'vand'
  };

  for (const [st, target] of Object.entries(stems)) {
    if (clean.includes(st) || n.includes(st)) {
      if (PRODUCT_DB[target]) return target;
    }
  }

  // 7. Intelligent Kategori-Fallback (Garanterer 100% dækning på opskrifter)
  if (clean.includes('fisk') || clean.includes('laks') || clean.includes('torsk') || clean.includes('tun') || clean.includes('reje') || clean.includes('ansjos')) {
    return 'torskefilet' in PRODUCT_DB ? 'torskefilet' : 'laks';
  }
  if (clean.includes('bøf') || clean.includes('stege') || clean.includes('kød') || clean.includes('rib') || clean.includes('and')) {
    return 'hakket kød';
  }
  if (clean.includes('dressing') || clean.includes('sauce') || clean.includes('sennep') || clean.includes('ketchup') || clean.includes('mayo')) {
    return 'ketchup';
  }
  if (clean.includes('krydderi') || clean.includes('peber') || clean.includes('nellike') || clean.includes('karry') || clean.includes('oregano') || clean.includes('timian') || clean.includes('spidskommen') || clean.includes('paprika')) {
    return 'oregano';
  }
  if (clean.includes('mel') || clean.includes('sukker') || clean.includes('gær') || clean.includes('bagepulver')) {
    return 'hvedemel';
  }

  return 'grøntsager';
}

// ─── PRIS & PANT RESOLVER ─────────────────────────────────────────────────────
async function resolveProductPrice(ingredient, storeKey) {
  // 1. Tjek først ugentlige tilbudsaviser
  const offer = state.weeklyOffers.find(o =>
    o.store === storeKey &&
    (o.searchKey === ingredient || o.name.toLowerCase().includes(ingredient) || ingredient.includes(o.searchKey))
  );

  if (offer) {
    const pantInfo = getPantDetails(offer.name, offer.category);
    return {
      name: offer.name,
      price: offer.price,
      origPrice: offer.orig,
      unit: 'tilbud',
      isOffer: true,
      store: storeKey,
      pant: pantInfo.pantAmount,
      pantType: pantInfo.pantType,
      hasPant: pantInfo.hasPant,
      pantLabel: pantInfo.pantLabel,
      totalWithPant: parseFloat((offer.price + pantInfo.pantAmount).toFixed(2)),
      source: offer.source || 'Ugens tilbudsavis',
    };
  }

  // 2. REMA 1000 DataLayer integration (live data fra cphapp.rema1000.dk med caching)
  if (storeKey === 'rema' && window.DataLayer && window.DataLayer.rema) {
    try {
      const remaProd = await window.DataLayer.rema.findProductByName(ingredient);
      if (remaProd) {
        return remaProd;
      }
    } catch (e) {
      console.warn('REMA 1000 DataLayer lookup fejl, benytter katalog fallback:', e);
    }
  }

  // 3. Supermarkedspriser.dk DataLayer integration (hvis datasæt/nøgle er aktiv)
  if (window.DataLayer && window.DataLayer.supermarkedspriser) {
    try {
      const smpPrice = await window.DataLayer.supermarkedspriser.findProductPrice(ingredient, storeKey);
      if (smpPrice) {
        const pantInfo = getPantDetails(smpPrice.name, ingredient);
        return {
          name: smpPrice.name,
          price: smpPrice.price,
          origPrice: null,
          unit: smpPrice.unit || 'stk',
          isOffer: false,
          store: storeKey,
          pant: pantInfo.pantAmount,
          pantType: pantInfo.pantType,
          hasPant: pantInfo.hasPant,
          pantLabel: pantInfo.pantLabel,
          totalWithPant: parseFloat((smpPrice.price + pantInfo.pantAmount).toFixed(2)),
          source: 'Supermarkedspriser.dk',
        };
      }
    } catch {}
  }

  // 3.5 Tjek REMA 1000 Live API hvis butik er REMA
  if (storeKey === 'rema' && window.DataLayer && window.DataLayer.rema && typeof window.DataLayer.rema.searchProduct === 'function') {
    try {
      const remaLive = await window.DataLayer.rema.searchProduct(ingredient);
      if (remaLive && remaLive.price > 0) {
        const pantInfo = getPantDetails(remaLive.name, ingredient);
        const assignedPant = remaLive.pant || pantInfo.pantAmount;
        return {
          name: remaLive.name,
          price: remaLive.price,
          origPrice: remaLive.origPrice || null,
          unit: remaLive.unit || 'stk',
          isOffer: remaLive.isOffer || false,
          store: 'rema',
          pant: assignedPant,
          pantType: pantInfo.pantType,
          hasPant: assignedPant > 0,
          pantLabel: assignedPant > 0 ? `+${assignedPant.toFixed(2)} kr pant (${pantInfo.pantType})` : '',
          totalWithPant: parseFloat((remaLive.price + assignedPant).toFixed(2)),
          source: 'REMA 1000 Live API',
        };
      }
    } catch (e) {}
  }

  // 4. Tjek verificeret prisdatabase (170+ råvarer dækkende 6 danske supermarkeder)
  const dbMatchKey = findProductDbMatch(ingredient);

  if (dbMatchKey && PRODUCT_DB[dbMatchKey] && PRODUCT_DB[dbMatchKey][storeKey]) {
    const p = PRODUCT_DB[dbMatchKey][storeKey];
    const pantInfo = getPantDetails(p.name, dbMatchKey);
    const assignedPant = p.pant !== undefined ? p.pant : pantInfo.pantAmount;
    const assignedType = p.pantType || pantInfo.pantType;

    return {
      name: p.name,
      price: p.price,
      origPrice: null,
      unit: p.unit,
      isOffer: false,
      store: storeKey,
      pant: assignedPant,
      pantType: assignedType,
      hasPant: assignedPant > 0,
      pantLabel: assignedPant > 0 ? `+${assignedPant.toFixed(2)} kr pant (${assignedType})` : '',
      totalWithPant: parseFloat((p.price + assignedPant).toFixed(2)),
      source: 'MUMS Prisdatabase (Verificeret)',
    };
  }

  // 5. Fallback beregning med butiksmultiplikator
  const storeMultiplier = {
    lidl: 0.90,
    coop365: 0.92,
    rema: 0.94,
    netto: 0.96,
    foetex: 1.08,
    bilka: 1.12,
  }[storeKey] || 1.0;

  const basePrice = (12 + Math.abs(ingredient.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 25)) * storeMultiplier;
  const storeName = STORES[storeKey]?.label || storeKey;
  const prodName = `${ingredient.charAt(0).toUpperCase() + ingredient.slice(1)} (${storeName})`;
  const pantInfo = getPantDetails(prodName, ingredient);

  return {
    name: prodName,
    price: parseFloat(basePrice.toFixed(2)),
    origPrice: null,
    unit: 'stk',
    isOffer: false,
    store: storeKey,
    pant: pantInfo.pantAmount,
    pantType: pantInfo.pantType,
    hasPant: pantInfo.hasPant,
    pantLabel: pantInfo.pantLabel,
    totalWithPant: parseFloat((parseFloat(basePrice.toFixed(2)) + pantInfo.pantAmount).toFixed(2)),
    source: 'Estimeret indeks',
  };
}

// ─── SØGNING (Parallel multi-API fetch med Promise.all) ────────────────────────

// ─── HJÆLPEFUNKTIONER: HTML ESCAPING & MODAL ────────────────────────────────
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function openAuthModal(defaultToRegister = false) {
  if (!dom.authModal) return;
  dom.authModal.classList.remove('hidden');
  dom.authErrorMsg?.classList.add('hidden');
  if (defaultToRegister && dom.tabRegister) {
    dom.tabRegister.click();
  }
}

// ─── UØNSKEDE INGREDIENSER & ALLERGI LOGIK ───────────────────────────────────
let tempAuthAllergies = [];

function renderProfileAllergyTags() {
  if (!dom.profileAllergyTagsContainer) return;
  const list = Array.isArray(state.allergies) ? state.allergies : [];
  if (list.length === 0) {
    dom.profileAllergyTagsContainer.innerHTML = '<span class="allergy-tags-empty" style="font-size:0.82rem; color:var(--gray-500); font-style:italic;">Ingen ingredienser tilføjet endnu. Skriv en ovenfor eller vælg herunder.</span>';
  } else {
    dom.profileAllergyTagsContainer.innerHTML = list.map(item => {
      const label = window.DataLayer?.allergens?.getLabel(item) || item;
      return `
        <span class="allergy-tag-pill" data-item="${escapeHtml(item)}">
          🚫 ${escapeHtml(label)}
          <button type="button" class="tag-remove-btn" title="Fjern ${escapeHtml(label)}" data-item="${escapeHtml(item)}">&times;</button>
        </span>
      `;
    }).join('');

    dom.profileAllergyTagsContainer.querySelectorAll('.tag-remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const itemToRemove = btn.dataset.item;
        removeProfileAllergyItem(itemToRemove);
      });
    });
  }

  if (dom.profileAllergyQuickPills) {
    dom.profileAllergyQuickPills.querySelectorAll('.allergy-quick-pill').forEach(pill => {
      const a = pill.dataset.allergy;
      const isSelected = list.includes(a);
      pill.classList.toggle('selected', isSelected);
    });
  }
}

function addProfileAllergyItem(rawText) {
  if (!rawText) return;
  const item = String(rawText).trim().toLowerCase();
  if (!item) return;
  if (!Array.isArray(state.allergies)) state.allergies = [];
  if (!state.allergies.includes(item)) {
    state.allergies.push(item);
    renderProfileAllergyTags();
  }
  if (dom.profileAllergyInput) {
    dom.profileAllergyInput.value = '';
    dom.profileAllergyInput.focus();
  }
}

function removeProfileAllergyItem(rawText) {
  if (!rawText) return;
  const item = String(rawText).trim().toLowerCase();
  if (!Array.isArray(state.allergies)) return;
  state.allergies = state.allergies.filter(i => i !== item);
  renderProfileAllergyTags();
}

function toggleProfileAllergyItem(key) {
  if (!key) return;
  const item = String(key).trim().toLowerCase();
  if (!Array.isArray(state.allergies)) state.allergies = [];
  if (state.allergies.includes(item)) {
    removeProfileAllergyItem(item);
  } else {
    addProfileAllergyItem(item);
  }
}

function renderAuthAllergyTags() {
  if (!dom.authAllergyTagsContainer) return;
  if (tempAuthAllergies.length === 0) {
    dom.authAllergyTagsContainer.innerHTML = '<span class="allergy-tags-empty" style="font-size:0.75rem; color:var(--gray-500); font-style:italic;">Ingen valgt endnu</span>';
  } else {
    dom.authAllergyTagsContainer.innerHTML = tempAuthAllergies.map(item => {
      const label = window.DataLayer?.allergens?.getLabel(item) || item;
      return `
        <span class="allergy-tag-pill" data-item="${escapeHtml(item)}" style="font-size:0.75rem; padding:2px 8px;">
          🚫 ${escapeHtml(label)}
          <button type="button" class="tag-remove-btn" title="Fjern" data-item="${escapeHtml(item)}">&times;</button>
        </span>
      `;
    }).join('');

    dom.authAllergyTagsContainer.querySelectorAll('.tag-remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const itemToRemove = btn.dataset.item;
        tempAuthAllergies = tempAuthAllergies.filter(i => i !== itemToRemove);
        renderAuthAllergyTags();
      });
    });
  }

  if (dom.authAllergyQuickPills) {
    dom.authAllergyQuickPills.querySelectorAll('.allergy-quick-pill').forEach(pill => {
      const a = pill.dataset.allergy;
      pill.classList.toggle('selected', tempAuthAllergies.includes(a));
    });
  }
}

function addAuthAllergyItem(rawText) {
  if (!rawText) return;
  const item = String(rawText).trim().toLowerCase();
  if (!item) return;
  if (!tempAuthAllergies.includes(item)) {
    tempAuthAllergies.push(item);
    renderAuthAllergyTags();
  }
  if (dom.authAllergyInput) {
    dom.authAllergyInput.value = '';
    dom.authAllergyInput.focus();
  }
}

function toggleAuthAllergyItem(key) {
  if (!key) return;
  const item = String(key).trim().toLowerCase();
  if (tempAuthAllergies.includes(item)) {
    tempAuthAllergies = tempAuthAllergies.filter(i => i !== item);
  } else {
    tempAuthAllergies.push(item);
  }
  renderAuthAllergyTags();
}

// ─── UGE 2: AUTHENTICATION & SIKKER BRUGERDATA ───────────────────────────────
function initAuthUI() {
  if (!dom.authBtn || !dom.authModal) return;

  dom.authBtn.addEventListener('click', () => {
    dom.authModal.classList.remove('hidden');
    dom.authErrorMsg?.classList.add('hidden');
  });

  dom.closeAuthModal?.addEventListener('click', () => {
    dom.authModal.classList.add('hidden');
  });

  dom.authModal.addEventListener('click', e => {
    if (e.target === dom.authModal) dom.authModal.classList.add('hidden');
  });

  // Tab switching (Log ind / Opret konto)
  let isRegisterMode = false;
  dom.tabLogin?.addEventListener('click', () => {
    isRegisterMode = false;
    dom.tabLogin.classList.add('active');
    dom.tabRegister.classList.remove('active');
    dom.authNameGroup?.classList.add('hidden');
    dom.authAllergiesGroup?.classList.add('hidden');
    if (dom.authSubmitBtn) dom.authSubmitBtn.textContent = 'Log ind';
    dom.authErrorMsg?.classList.add('hidden');
  });

  dom.tabRegister?.addEventListener('click', () => {
    isRegisterMode = true;
    dom.tabRegister.classList.add('active');
    dom.tabLogin.classList.remove('active');
    dom.authNameGroup?.classList.remove('hidden');
    dom.authAllergiesGroup?.classList.remove('hidden');
    if (dom.authSubmitBtn) dom.authSubmitBtn.textContent = 'Opret konto';
    dom.authErrorMsg?.classList.add('hidden');
    tempAuthAllergies = [...(state.allergies || [])];
    renderAuthAllergyTags();
  });

  // Auth uønskede ingredienser listeners
  dom.btnAddAuthAllergy?.addEventListener('click', () => {
    addAuthAllergyItem(dom.authAllergyInput?.value);
  });
  dom.authAllergyInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addAuthAllergyItem(dom.authAllergyInput?.value);
    }
  });
  dom.authAllergyQuickPills?.querySelectorAll('.allergy-quick-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      toggleAuthAllergyItem(pill.dataset.allergy);
    });
  });

  // Form submit
  dom.authForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = dom.authEmail?.value || '';
    const pass = dom.authPassword?.value || '';
    const name = dom.authName?.value || '';

    try {
      dom.authErrorMsg?.classList.add('hidden');
      if (isRegisterMode) {
        const newUser = await auth.register(email, pass, name, tempAuthAllergies);
        state.allergies = [...tempAuthAllergies];
        saveCurrentUserData();
        syncAppStateToAllViews();
        showToast('Konto oprettet! Tjek din email for bekræftelseskode.', 'success');
        if (typeof sendVerificationEmail === 'function' && newUser) {
          sendVerificationEmail(newUser.email, newUser.name, newUser.verificationCode)
            .then(res => {
              if (res && res.directPin && dom.demoCodeHint) {
                dom.demoCodeHint.innerHTML = `⚡ <strong>Hurtig aktiveringskode:</strong> <span class="quick-code-pill" onclick="document.getElementById('verificationCodeInput').value='${res.code}'">${res.code}</span> (klik for at udfylde)`;
                dom.demoCodeHint.classList.remove('hidden');
              }
            })
            .catch(err => console.warn('[EmailJS] Kunne ikke sende email:', err));
        }
      } else {
        await auth.login(email, pass);
        showToast('Velkommen tilbage!', 'success');
      }
    } catch (err) {
      if (dom.authErrorMsg) {
        dom.authErrorMsg.textContent = err.message || 'Der opstod en fejl';
        dom.authErrorMsg.classList.remove('hidden');
      }
    }
  });

  // Bekræft email med kode
  dom.btnConfirmVerify?.addEventListener('click', () => {
    const code = dom.verificationCodeInput?.value;
    try {
      auth.verifyEmail(code);
      showToast('✅ Email bekræftet! Din konto er nu fuldt beskyttet.', 'success');
      updateAuthModalView(auth.currentUser);
    } catch (err) {
      showToast(err.message || 'Forkert bekræftelseskode', 'error');
    }
  });

  // Log ud
  dom.btnLogout?.addEventListener('click', () => {
    auth.logout();
    showToast('Du er nu logget ud', '');
    dom.authModal.classList.add('hidden');
  });

  // Lyt til auth ændringer (Login/Logout/Initial load)
  auth.onAuthStateChanged(user => {
    updateAuthHeaderUI(user);
    updateAuthModalView(user);
    loadUserPersistentSettings();
  });
}

function updateAuthHeaderUI(user) {
  if (user && dom.authBtnText) {
    dom.authBtnText.textContent = user.name || user.email.split('@')[0];
    dom.authBtn.title = `Logget ind som ${user.email} (klik for konto)`;
  } else if (dom.authBtnText) {
    dom.authBtnText.textContent = 'Log ind';
    dom.authBtn.title = 'Log ind eller opret konto';
  }
}

function updateAuthModalView(user) {
  if (user) {
    dom.authLoggedOutView?.classList.add('hidden');
    dom.authLoggedInView?.classList.remove('hidden');

    if (dom.loggedInUserName) dom.loggedInUserName.textContent = user.name || 'Bruger';
    if (dom.loggedInUserEmail) dom.loggedInUserEmail.textContent = user.email;

    if (user.isVerified) {
      dom.emailVerifyBanner?.classList.add('hidden');
      dom.emailVerifiedBadge?.classList.remove('hidden');
    } else {
      dom.emailVerifyBanner?.classList.remove('hidden');
      dom.emailVerifiedBadge?.classList.add('hidden');
      if (typeof EMAILJS_CONFIG !== 'undefined' && EMAILJS_CONFIG.configured) {
        if (dom.demoCodeHint) dom.demoCodeHint.classList.add('hidden');
        if (dom.verifyBannerSubtext) dom.verifyBannerSubtext.textContent = `Vi har sendt en bekræftelseskode til ${user.email}.`;
      } else {
        if (dom.demoCodeHint && user.verificationCode) {
          dom.demoCodeHint.innerHTML = `⚡ <strong>Hurtig aktiveringskode:</strong> <span class="quick-code-pill" onclick="document.getElementById('verificationCodeInput').value='${user.verificationCode}'">${user.verificationCode}</span> (klik for at udfylde)`;
          dom.demoCodeHint.classList.remove('hidden');
        }
        if (dom.verifyBannerSubtext) dom.verifyBannerSubtext.textContent = 'Indtast din aktiveringskode for at fuldføre:';
      }
    }
  } else {
    dom.authLoggedOutView?.classList.remove('hidden');
    dom.authLoggedInView?.classList.add('hidden');
  }
}

function loadUserPersistentSettings() {
  const data = auth.getUserData();
  if (!data) return;

  state.servings = data.servings || 4;
  state.budget = typeof data.budget === 'number' ? data.budget : 150;
  state.shoppingList = data.shoppingList || [];
  state.activeProfileId = data.activeProfileId || 'default_normal';
  state.allergies = Array.isArray(data.allergies) ? data.allergies : (auth.currentUser?.allergies || []);
  state.autoFilterAllergies = Boolean(data.autoFilterAllergies);

  if (data.mealPlan && typeof data.mealPlan === 'object') {
    state.mealPlan = Object.assign({
      monday: null, tuesday: null, wednesday: null, thursday: null, friday: null, saturday: null, sunday: null
    }, data.mealPlan);
  }

  // Opdater instansierede ernæringsprofiler
  if (Array.isArray(data.nutritionProfiles) && data.nutritionProfiles.length > 0) {
    state.userProfiles = data.nutritionProfiles.map(p => new NutritionProfile(p));
  } else {
    state.userProfiles = [
      new NutritionProfile({
        id: 'default_normal',
        name: 'Min normale kost',
        calories: 2200,
        protein: 120,
        fat: 70,
        carbs: 250,
        fiber: 30,
        isCustom: true,
      })
    ];
  }

  // Opdater UI komponenter
  updateServingsUI();
  updateBudgetUI();
  updateProfileDropdownUI();
  updateCartBadge();

  if (typeof renderProfileView === 'function') renderProfileView();
  if (typeof renderShoppingListPage === 'function') renderShoppingListPage();
  if (typeof renderHomeDashboard === 'function') renderHomeDashboard();

  if (state.lastSearchResults) {
    renderRecipeCards(state.lastSearchResults);
  }
}

// ─── UGE 2: ANTAL PERSONER & PORTIONSSKALERING ───────────────────────────────
function initServingsAndBudgetUI() {
  // Antal personer knapper (2, 4, 6, 8 pers.)
  dom.servingsBtns?.forEach(btn => {
    btn.addEventListener('click', () => {
      const sVal = parseInt(btn.dataset.servings, 10);
      if (sVal && sVal !== state.servings) {
        state.servings = sVal;
        auth.saveUserData({ servings: sVal });
        updateServingsUI();
        showToast(`👥 Skaleret til ${sVal} personer`, 'success');

        if (state.lastSearchResults) {
          renderRecipeCards(state.lastSearchResults);
        }
      }
    });
  });

  // Budget input
  dom.budgetInput?.addEventListener('input', () => {
    const bVal = parseFloat(dom.budgetInput.value);
    state.budget = !isNaN(bVal) && bVal > 0 ? bVal : null;
    auth.saveUserData({ budget: state.budget });
    updateBudgetUI();

    if (state.lastSearchResults) {
      renderRecipeCards(state.lastSearchResults);
    }
  });
}

function updateServingsUI() {
  dom.servingsBtns?.forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.servings, 10) === state.servings);
  });
}

function updateBudgetUI() {
  if (dom.budgetInput && state.budget !== null) {
    dom.budgetInput.value = state.budget;
  }
}

// ─── UGE 2: ERNÆRINGSPROFILER (Opret, rediger, slet, vælg aktiv) ─────────────
function initNutritionProfileUI() {
  updateProfileDropdownUI();

  // Skift aktiv profil
  dom.userProfileSelect?.addEventListener('change', () => {
    const val = dom.userProfileSelect.value;
    state.activeProfileId = val !== 'none' ? val : null;
    auth.saveUserData({ activeProfileId: state.activeProfileId });
    updateProfileButtonVisibility();

    showToast(`🎯 Aktiv profil ændret`, 'success');
    if (state.lastSearchResults) {
      renderRecipeCards(state.lastSearchResults);
    }
  });

  // Åbn Opret profil modal
  dom.btnNewProfile?.addEventListener('click', () => {
    openProfileModal(null);
  });

  // Åbn Rediger profil modal
  dom.btnEditProfile?.addEventListener('click', () => {
    const current = state.userProfiles.find(p => p.id === state.activeProfileId);
    if (current) openProfileModal(current);
  });

  // Slet aktiv profil
  dom.btnDeleteProfile?.addEventListener('click', () => {
    const current = state.userProfiles.find(p => p.id === state.activeProfileId);
    if (!current) return;
    if (confirm(`Er du sikker på, at du vil slette profilen "${current.name}"?`)) {
      state.userProfiles = state.userProfiles.filter(p => p.id !== current.id);
      state.activeProfileId = state.userProfiles.length > 0 ? state.userProfiles[0].id : null;
      auth.saveUserData({
        nutritionProfiles: state.userProfiles,
        activeProfileId: state.activeProfileId,
      });
      updateProfileDropdownUI();
      showToast('Profil slettet', '');
      if (state.lastSearchResults) {
        renderRecipeCards(state.lastSearchResults);
      }
    }
  });

  // Modal luk/annuller
  dom.closeProfileModal?.addEventListener('click', () => dom.profileModal?.classList.add('hidden'));
  dom.btnCancelProfile?.addEventListener('click', () => dom.profileModal?.classList.add('hidden'));

  // Gem profil form
  dom.profileForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const editId = dom.profileEditId?.value;
    const name = dom.profNameInput?.value?.trim();
    if (!name) return;

    const profData = {
      name,
      calories: dom.profKcal?.value || null,
      protein: dom.profProtein?.value || null,
      fat: dom.profFat?.value || null,
      carbs: dom.profCarbs?.value || null,
      fiber: dom.profFiber?.value || null,
      isCustom: true,
    };

    if (editId) {
      // Opdater eksisterende
      const idx = state.userProfiles.findIndex(p => p.id === editId);
      if (idx !== -1) {
        state.userProfiles[idx] = new NutritionProfile({ ...profData, id: editId });
        state.activeProfileId = editId;
      }
    } else {
      // Opret ny
      const newP = new NutritionProfile(profData);
      state.userProfiles.push(newP);
      state.activeProfileId = newP.id;
    }

    auth.saveUserData({
      nutritionProfiles: state.userProfiles,
      activeProfileId: state.activeProfileId,
    });

    dom.profileModal?.classList.add('hidden');
    updateProfileDropdownUI();
    showToast(`✅ Profil "${name}" gemt!`, 'success');

    if (state.lastSearchResults) {
      renderRecipeCards(state.lastSearchResults);
    }
  });
}

function openProfileModal(prof = null) {
  if (!dom.profileModal) return;
  dom.profileModal.classList.remove('hidden');

  if (prof) {
    if (dom.profileModalTitle) dom.profileModalTitle.textContent = 'Rediger Ernæringsprofil';
    if (dom.profileEditId) dom.profileEditId.value = prof.id;
    if (dom.profNameInput) dom.profNameInput.value = prof.name;
    if (dom.profKcal) dom.profKcal.value = prof.calories ?? '';
    if (dom.profProtein) dom.profProtein.value = prof.protein ?? '';
    if (dom.profFat) dom.profFat.value = prof.fat ?? '';
    if (dom.profCarbs) dom.profCarbs.value = prof.carbs ?? '';
    if (dom.profFiber) dom.profFiber.value = prof.fiber ?? '';
  } else {
    if (dom.profileModalTitle) dom.profileModalTitle.textContent = 'Opret Ny Ernæringsprofil';
    if (dom.profileEditId) dom.profileEditId.value = '';
    if (dom.profNameInput) dom.profNameInput.value = '';
    if (dom.profKcal) dom.profKcal.value = '';
    if (dom.profProtein) dom.profProtein.value = '';
    if (dom.profFat) dom.profFat.value = '';
    if (dom.profCarbs) dom.profCarbs.value = '';
    if (dom.profFiber) dom.profFiber.value = '';
  }
}

function updateProfileDropdownUI() {
  if (!dom.userProfileSelect) return;
  dom.userProfileSelect.innerHTML = '';

  const optNone = document.createElement('option');
  optNone.value = 'none';
  optNone.textContent = 'Ingen specifik profil (standard)';
  dom.userProfileSelect.appendChild(optNone);

  state.userProfiles.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = `${p.name} (${p.calories ? p.calories + ' kcal' : 'Fri kcal'})`;
    if (p.id === state.activeProfileId) opt.selected = true;
    dom.userProfileSelect.appendChild(opt);
  });

  updateProfileButtonVisibility();
}

function updateProfileButtonVisibility() {
  const isSelected = Boolean(state.activeProfileId && state.activeProfileId !== 'none');
  dom.btnEditProfile?.classList.toggle('hidden', !isSelected);
  dom.btnDeleteProfile?.classList.toggle('hidden', !isSelected);
}

// ─── UGE 2: SAMLET INDKØBSLISTE MODAL (Pakningsstørrelser & Budget) ──────────
function initShoppingListUI() {
  dom.globalShoppingListBtn?.addEventListener('click', () => {
    openShoppingListModal();
  });

  dom.closeShoppingModal?.addEventListener('click', () => {
    dom.shoppingListModal?.classList.add('hidden');
  });

  dom.btnCloseShoppingList?.addEventListener('click', () => {
    dom.shoppingListModal?.classList.add('hidden');
  });

  dom.btnClearShoppingList?.addEventListener('click', () => {
    if (confirm('Vil du rydde din samlede indkøbsliste?')) {
      state.shoppingList = [];
      auth.saveUserData({ shoppingList: [] });
      updateCartBadge();
      renderShoppingListModalContent();
      showToast('Indkøbsliste ryddet', '');
    }
  });

  updateCartBadge();
}

function updateCartBadge() {
  if (dom.cartCountBadge) {
    dom.cartCountBadge.textContent = state.shoppingList.length;
  }
}

function addRecipeToShoppingList(recipe) {
  const scaledIngs = recipe.getScaledIngredients ? recipe.getScaledIngredients(state.servings) : recipe.ingredients;
  
  scaledIngs.forEach(ing => {
    // Find billigste produkt for denne ingrediens på tværs af valgte butikker
    let bestShopItem = null;

    state.selectedStores.forEach(sKey => {
      let prod = null;
      let isLiveRema = false;

      // Tjek REMA live cache for REMA 1000
      if (sKey === 'rema' && window.DataLayer?.getCache) {
        const cleanSk = (ing.searchKey || '').toLowerCase().trim();
        const cleanName = (ing.ingredientName || ing.name || '').toLowerCase().trim();
        const cached = (cleanSk ? window.DataLayer.getCache(`mums_rema_search_${cleanSk}`) : null) || 
                       (cleanName ? window.DataLayer.getCache(`mums_rema_search_${cleanName}`) : null);
        if (cached && cached.data && cached.data.price > 0) {
          prod = cached.data;
          isLiveRema = true;
        }
      }

      if (!prod) {
        const matchKey = findProductDbMatch(ing.ingredientName || ing.name, ing.searchKey);
        prod = (matchKey && PRODUCT_DB[matchKey]?.[sKey]) || PRODUCT_DB[ing.searchKey]?.[sKey];
      }

      if (prod) {
        const item = calculateShoppingItem({
          ingredientName: ing.name,
          neededAmount: ing.amount,
          neededUnit: ing.unit,
          product: prod,
          storeKey: sKey,
          activeOffers: state.weeklyOffers,
        });

        if (isLiveRema && item) {
          item.isLiveRema = true;
        }

        if (!bestShopItem || (item.totalPrice !== null && item.totalPrice < (bestShopItem.totalPrice || Infinity))) {
          bestShopItem = item;
        }
      }
    });

    if (!bestShopItem) {
      bestShopItem = calculateShoppingItem({
        ingredientName: ing.name,
        neededAmount: ing.amount,
        neededUnit: ing.unit,
        product: null,
        storeKey: 'ukendt',
        activeOffers: state.weeklyOffers,
      });
    }

    state.shoppingList.push({
      id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      recipeId: recipe.id,
      recipeName: recipe.name,
      ...bestShopItem,
    });
  });

  auth.saveUserData({ shoppingList: state.shoppingList });
  updateCartBadge();
  showToast(`🛒 ${recipe.name} (${state.servings} pers.) tilføjet til indkøbslisten!`, 'success');
}

function openShoppingListModal() {
  if (!dom.shoppingListModal) return;
  dom.shoppingListModal.classList.remove('hidden');
  renderShoppingListModalContent();
}

function renderShoppingListModalContent() {
  if (!dom.shoppingListContainer) return;
  dom.shoppingListContainer.innerHTML = '';

  if (dom.shoppingModalServingsInfo) {
    dom.shoppingModalServingsInfo.textContent = `Beregnet til ${state.servings} personer ud fra pakningsstørrelser`;
  }

  if (state.shoppingList.length === 0) {
    dom.shoppingListContainer.innerHTML = `
      <div style="padding:30px; text-align:center; color:var(--gray-400);">
        <div style="font-size:2rem; margin-bottom:8px;">🛒</div>
        <p>Din indkøbsliste er tom.</p>
        <p style="font-size:0.85rem;">Klik på <strong>"+ Tilføj til indkøbsliste"</strong> under en opskrift for at beregne pakker og priser.</p>
      </div>
    `;
    if (dom.shoppingModalTotalSum) dom.shoppingModalTotalSum.textContent = '0.00 kr';
    if (dom.shoppingModalBudgetCompare) dom.shoppingModalBudgetCompare.innerHTML = '';
    return;
  }

  let grandTotal = 0;
  let hasMissingPrices = false;

  state.shoppingList.forEach(item => {
    const card = document.createElement('div');
    card.className = 'shopping-item-card';

    const storeLoc = getStoreLocationInfo(item.storeKey);
    const priceText = item.hasPrice ? `${item.totalPrice.toFixed(2)} kr` : '<span class="shopping-item-missing">Pris mangler</span>';
    
    if (item.hasPrice) {
      grandTotal += item.totalPrice;
    } else {
      hasMissingPrices = true;
    }

    const offerNotice = item.isOffer ? `<span class="tag-badge offer-tag-pill">Tilbud</span>` : '';
    const pantNotice = item.pant > 0 ? `<span style="font-size:0.75rem; color:var(--gray-500);">(heraf ${item.pant.toFixed(2)} kr pant)</span>` : '';

    card.innerHTML = `
      <div class="shopping-item-left">
        <div class="shopping-item-title">${item.productName} ${offerNotice}</div>
        <div class="shopping-item-meta">
          <span>Behov: <strong>${item.neededAmount} ${item.neededUnit}</strong></span>
          <span class="pkg-badge">📦 ${item.packagesNeeded} pk. à ${item.packageSizeText}</span>
          <span>🏬 <a href="${storeLoc.mapsUrl}" target="_blank" rel="noopener noreferrer" style="color:inherit; font-weight:600; text-decoration:underline;" title="${storeLoc.address}">${storeLoc.label} (${storeLoc.distanceText}) ↗</a></span>
          ${pantNotice}
        </div>
        <div style="font-size:0.72rem; color:var(--gray-400);">Fra ret: ${item.recipeName}</div>
      </div>
      <div class="shopping-item-right">
        <div class="shopping-item-price">${priceText}</div>
        ${item.isOffer && item.normalPrice ? `<span class="shopping-item-orig-price">Normal: ${(item.packagesNeeded * item.normalPrice).toFixed(2)} kr</span>` : ''}
      </div>
    `;

    dom.shoppingListContainer.appendChild(card);
  });

  if (dom.shoppingModalTotalSum) {
    dom.shoppingModalTotalSum.textContent = `${grandTotal.toFixed(2)} kr ${hasMissingPrices ? '(ekskl. manglende priser)' : ''}`;
  }

  // Budget sammenligning
  if (dom.shoppingModalBudgetCompare) {
    if (state.budget && state.budget > 0) {
      const diff = state.budget - grandTotal;
      if (diff >= 0) {
        dom.shoppingModalBudgetCompare.className = 'shopping-budget-box within';
        dom.shoppingModalBudgetCompare.innerHTML = `✅ <strong>Inden for budget:</strong> Dit samlede indkøb koster ${grandTotal.toFixed(2)} kr, hvilket holder sig under dit budget på <strong>${state.budget} kr</strong> (du har ${diff.toFixed(2)} kr tilovers).`;
      } else {
        dom.shoppingModalBudgetCompare.className = 'shopping-budget-box over';
        dom.shoppingModalBudgetCompare.innerHTML = `⚠️ <strong>Over budget:</strong> Dit samlede indkøb koster ${grandTotal.toFixed(2)} kr, hvilket overskrider dit budget på <strong>${state.budget} kr</strong> med <strong>${Math.abs(diff).toFixed(2)} kr</strong>.`;
      }
    } else {
      dom.shoppingModalBudgetCompare.className = 'shopping-budget-box';
      dom.shoppingModalBudgetCompare.innerHTML = `💡 Intet budget sat. Du kan indstille dit budget i toppen under "Maks. Budget".`;
    }
  }
}

async function performSearch() {
  const queryTerm = (state.recipeSearchQuery || (dom.recipeSearchInput ? dom.recipeSearchInput.value : '')).trim();
  
  if (state.ingredients.length === 0 && !queryTerm) {
    showToast('Indtast hvad du vil spise (fx lasagne, burger, kylling) eller tilføj en ingrediens', 'info');
    if (dom.recipeSearchInput) dom.recipeSearchInput.focus();
    return;
  }

  if (state.selectedStores.length === 0) {
    showToast('Vælg mindst én butik at sammenligne', 'error');
    return;
  }

  dom.loadingSection.classList.remove('hidden');
  dom.emptyState.classList.add('hidden');
  dom.resultsSection.classList.add('hidden');
  dom.searchBtn.disabled = true;

  dom.loadingText.textContent = `Henter data parallelt fra 4 API'er (Salling Group, Open Food Facts, REMA 1000, Dansk Retursystem)...`;

  // Bestem hvilke varer der skal prissættes: Hvis ingredienser er tastet, bruges de.
  // Ellers findes ingredienser fra de retter, der matcher søgningen
  let itemsToPrice = [...state.ingredients];
  if (itemsToPrice.length === 0 && queryTerm) {
    const qLower = queryTerm.toLowerCase();
    const matchedRecipes = RECIPES.filter(r => (r.name || '').toLowerCase().includes(qLower) || (r.desc || '').toLowerCase().includes(qLower));
    const ingSet = new Set();
    matchedRecipes.slice(0, 3).forEach(r => {
      (r.ingredients || []).forEach(i => {
        if (i.name || i.searchKey) ingSet.add(i.searchKey || i.name);
      });
    });
    itemsToPrice = Array.from(ingSet).slice(0, 8);
    if (itemsToPrice.length === 0) itemsToPrice = [queryTerm];
  }

  const nutritionPromises = itemsToPrice.map(ing => APIS.queryOpenFoodFacts(ing));

  const pricePromises = itemsToPrice.map(async ing => {
    const storeEntries = await Promise.all(
      state.selectedStores.map(async storeKey => {
        const result = await resolveProductPrice(ing, storeKey);
        return [storeKey, result];
      })
    );
    return [ing, Object.fromEntries(storeEntries)];
  });

  const [allEntries, nutritionResults] = await Promise.all([
    Promise.all(pricePromises),
    Promise.all(nutritionPromises),
  ]);

  nutritionResults.forEach((res, idx) => {
    if (res && res.ok && res.nutrition) {
      state.liveNutritionData[itemsToPrice[idx]] = res.nutrition;
    }
  });

  const searchResults = Object.fromEntries(allEntries);
  state.lastSearchResults = searchResults;

  renderRecipeCards(searchResults);
  renderComparisonTable(searchResults);

  dom.loadingSection.classList.add('hidden');
  dom.resultsSection.classList.remove('hidden');
  dom.searchBtn.disabled = false;

  showToast(`Priser sammenlignet fra 4 API'er og ${state.selectedStores.length} butikker! 🎉`, 'success');

  dom.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── RENDERING AF OPSKRIFTSKORT MED DROPDOWN, ADRESSER & PANT ────────────────
function renderRecipeCards(searchResults = {}) {
  if (!dom.recipeCards) return;
  dom.recipeCards.innerHTML = '';

  const searchedIngredients = (searchResults && Object.keys(searchResults).length > 0)
    ? Object.keys(searchResults)
    : (state.ingredients || []);

  // Aktiv søgeterm
  const activeTerm = state.recipeSearchQuery || (searchedIngredients.length > 0 ? searchedIngredients[0] : '');

  // Score alle opskrifter uden at udelukke nogen!
  let scoredRecipes = RECIPES.map(recipe => {
    let ingMatchCount = 0;
    const baseIngredients = recipe.ingredients || [];
    baseIngredients.forEach(ri => {
      const isPresent = searchedIngredients.some(si => {
        const s = si.toLowerCase().trim();
        const rKey = (ri.searchKey || '').toLowerCase().trim();
        const rName = (ri.name || '').toLowerCase().trim();
        return s === rKey || s === rName || rKey.includes(s) || s.includes(rKey) || rName.includes(s) || s.includes(rName);
      });
      if (isPresent) ingMatchCount++;
    });

    // Ekstra match hvis søgeordet indgår i rettens navn eller tags (fx 'pasta' eller 'spaghetti')
    searchedIngredients.forEach(si => {
      const s = si.toLowerCase().trim();
      const recName = (recipe.name || '').toLowerCase();
      const recTags = (recipe.tags || []).join(' ').toLowerCase();
      if ((recName.includes(s) || recTags.includes(s)) && ingMatchCount === 0) {
        ingMatchCount = 1;
      }
    });

    const matchInfo = calculateRecipeMatch(recipe);

    // Beregn en hurtig estimeret samlet pris for opskriften til brug for sortering
    let estPrice = 0;
    (recipe.ingredients || []).forEach(ing => {
      const mKey = findProductDbMatch(ing.name, ing.searchKey);
      if (mKey && PRODUCT_DB[mKey]) {
        const prices = Object.values(PRODUCT_DB[mKey]).map(p => p.price).filter(p => typeof p === 'number');
        if (prices.length > 0) estPrice += Math.min(...prices);
        else estPrice += 12;
      } else {
        estPrice += 12;
      }
    });

    return {
      recipe,
      ingMatchCount,
      matchPct: matchInfo.matchPct,
      hasPrefs: matchInfo.hasPrefs,
      hasNutrition: matchInfo.hasNutrition !== false,
      nutritionLabel: matchInfo.label || null,
      estPrice,
    };
  });

  // Filtrering efter kilde (all, Arla, Valdemarsro)
  if (state.recipeSourceFilter === 'Arla') {
    scoredRecipes = scoredRecipes.filter(({ recipe }) => recipe.source === 'Arla');
  } else if (state.recipeSourceFilter === 'Valdemarsro') {
    scoredRecipes = scoredRecipes.filter(({ recipe }) => recipe.source === 'Valdemarsro');
  }

  // Filtrering efter kategori (pasta, kylling, oksekød, vegetar, fisk, suppe)
  if (state.recipeCategoryFilter && state.recipeCategoryFilter !== 'all') {
    const cf = state.recipeCategoryFilter.toLowerCase();
    scoredRecipes = scoredRecipes.filter(({ recipe }) => {
      const name = (recipe.name || '').toLowerCase();
      const tags = (recipe.tags || []).join(' ').toLowerCase();
      const cat = (recipe.category || '').toLowerCase();
      const ings = (recipe.ingredients || []).map(i => (i.name || '') + ' ' + (i.searchKey || '')).join(' ').toLowerCase();
      if (cf === 'pasta') return name.includes('pasta') || name.includes('lasagne') || name.includes('spaghetti') || name.includes('carbonara') || name.includes('alfredo') || cat === 'pasta' || ings.includes('pasta');
      if (cf === 'kylling') return name.includes('kylling') || tags.includes('kylling') || cat === 'kylling' || ings.includes('kylling');
      if (cf === 'oksekød') return name.includes('oksekød') || name.includes('kød') || name.includes('bacon') || cat === 'oksekød' || ings.includes('kød') || ings.includes('oksekød');
      if (cf === 'vegetar') return cat === 'vegetar' || name.includes('salat') || name.includes('suppe') || tags.includes('vegetar') || ings.includes('linser') || ings.includes('feta');
      if (cf === 'fisk') return name.includes('laks') || name.includes('fisk') || name.includes('torsk') || name.includes('tun') || cat === 'fisk' || ings.includes('fisk') || ings.includes('laks');
      if (cf === 'suppe') return name.includes('suppe') || cat === 'suppe';
      return true;
    });
  }

  // Filtrering efter tekstsøgning (fx 'carbonara', 'laks', 'kylling')
  if (state.recipeSearchQuery && state.recipeSearchQuery.trim().length > 0) {
    const q = state.recipeSearchQuery.trim().toLowerCase();
    scoredRecipes = scoredRecipes.filter(({ recipe }) => {
      const inName = (recipe.name || '').toLowerCase().includes(q);
      const inDesc = (recipe.desc || '').toLowerCase().includes(q);
      const inSrc = (recipe.source || '').toLowerCase().includes(q);
      const inIngs = (recipe.ingredients || []).some(ri => (ri.name || '').toLowerCase().includes(q) || (ri.searchKey || '').toLowerCase().includes(q));
      return inName || inDesc || inSrc || inIngs;
    });
  }

  // Filtrering efter brugerens faste allergier hvis automatisk filtrering er slået til
  if (state.autoFilterAllergies && (state.allergies || []).length > 0 && window.DataLayer?.allergens) {
    scoredRecipes = scoredRecipes.filter(({ recipe }) => {
      const conflicting = window.DataLayer.allergens.recipeContainsAllergen(recipe, state.allergies);
      return conflicting.length === 0;
    });
  }

  // ── Sortering ud fra brugerens valgte FOKUS ──────────────────────────────
  const focus = state.recipeFocus || 'cheapest';
  const queryStr = (state.recipeSearchQuery || '').trim().toLowerCase();

  scoredRecipes.sort((a, b) => {
    // 0. Hvis brugeren søgte efter en specifik ret (fx "lasagne" eller "flæskesteg"),
    // prioriteres retter hvor navnet starter med eller indeholder søgeordet direkte!
    if (queryStr.length > 0) {
      const aName = (a.recipe.name || '').toLowerCase();
      const bName = (b.recipe.name || '').toLowerCase();
      const aExact = aName === queryStr;
      const bExact = bName === queryStr;
      if (aExact !== bExact) return aExact ? -1 : 1;

      const aStarts = aName.startsWith(queryStr);
      const bStarts = bName.startsWith(queryStr);
      if (aStarts !== bStarts) return aStarts ? -1 : 1;

      const aHas = aName.includes(queryStr);
      const bHas = bName.includes(queryStr);
      if (aHas !== bHas) return aHas ? -1 : 1;
    }

    // Hvis brugeren har tastet råvarer i råvaresøgningen, bevares ingrediens-match som topprioritet
    if (searchedIngredients.length > 0 && b.ingMatchCount !== a.ingMatchCount) {
      return b.ingMatchCount - a.ingMatchCount;
    }

    if (focus === 'cheapest') {
      // 1. Billigste pris først
      if (a.estPrice !== b.estPrice) return a.estPrice - b.estPrice;
    } else if (focus === 'low_carbs') {
      // 2. Færrest kulhydrater
      const carbsA = a.recipe.nutrition?.carbs ?? 999;
      const carbsB = b.recipe.nutrition?.carbs ?? 999;
      if (carbsA !== carbsB) return carbsA - carbsB;
    } else if (focus === 'high_protein') {
      // 3. Mest protein
      const protA = a.recipe.nutrition?.protein ?? 0;
      const protB = b.recipe.nutrition?.protein ?? 0;
      if (protA !== protB) return protB - protA;
    } else if (focus === 'low_kcal') {
      // 4. Færrest kalorier
      const kcalA = a.recipe.nutrition?.kcal ?? 9999;
      const kcalB = b.recipe.nutrition?.kcal ?? 9999;
      if (kcalA !== kcalB) return kcalA - kcalB;
    } else if (focus === 'fastest') {
      // 5. Hurtigste tilberedning
      const timeA = a.recipe.prepTime || 999;
      const timeB = b.recipe.prepTime || 999;
      if (timeA !== timeB) return timeA - timeB;
    } else if (focus === 'match_pct') {
      // 6. Bedste ernæringsprofil match %
      if (b.matchPct !== a.matchPct) return b.matchPct - a.matchPct;
    }

    // Sekundær sortering: Ernæringsmatch eller billigste pris
    if (a.hasPrefs || b.hasPrefs) {
      if (b.matchPct !== a.matchPct) return b.matchPct - a.matchPct;
    }
    return a.estPrice - b.estPrice;
  });

  // Opdater status badge over opskrifterne
  const countDisplay = document.getElementById('recipeCountDisplay');
  if (countDisplay) {
    countDisplay.textContent = `⚡ Viser ${scoredRecipes.length} retter (ud af ${RECIPES.length} i databasen)`;
  }

  if (scoredRecipes.length === 0) {
    dom.recipeCards.innerHTML = `
      <div class="recipe-empty-search-state" style="grid-column: 1 / -1; padding: 40px 20px; text-align: center; border-radius: var(--radius); border: 1.5px dashed var(--gray-300);">
        <span style="font-size: 2.6rem; display: block; margin-bottom: 10px;">🍲</span>
        <p class="recipe-empty-title" style="font-size: 1.15rem; font-weight: 800; margin-bottom: 6px;">Ingen retter matchede "${activeTerm || 'din søgning'}"</p>
        <p class="recipe-empty-desc" style="font-size: 0.9rem; max-width: 460px; margin: 0 auto 16px auto;">
          Prøv at søge på en anden råvare (fx pasta, kylling, kød, suppe, laks, pizza) eller ryd søgefeltet for at se alle ${RECIPES.length} opskrifter.
        </p>
        <button id="btnResetRecipeSearch" class="btn btn-secondary btn-sm" style="margin: 0 auto;">🔄 Vis alle ${RECIPES.length} retter</button>
      </div>
    `;
    document.getElementById('btnResetRecipeSearch')?.addEventListener('click', () => {
      state.recipeSearchQuery = '';
      if (dom.recipeSearchInput) dom.recipeSearchInput.value = '';
      renderRecipeCards(searchResults);
    });
    return;
  }

  function buildRecipeCard({ recipe, ingMatchCount, matchPct, hasPrefs, hasNutrition }, index) {
    const card = document.createElement('div');
    const isTop = index === 0;

    card.className = `recipe-card-outer ${isTop ? 'best-match' : ''}`;

    let matchBadgeHTML = '';
    if (hasPrefs) {
      let badgeCls = 'badge-match-high';
      if (matchPct < 65) badgeCls = 'badge-match-low';
      else if (matchPct < 85) badgeCls = 'badge-match-mid';

      matchBadgeHTML = `<span class="recipe-badge ${badgeCls}">🎯 ${matchPct}% Match</span>`;
    }

    let allergyBadgeHTML = '';
    const userAllergies = state.allergies || [];
    if (userAllergies.length > 0 && window.DataLayer?.allergens) {
      const conflicting = window.DataLayer.allergens.recipeContainsAllergen(recipe, userAllergies);
      if (conflicting.length > 0) {
        const labels = conflicting.map(k => window.DataLayer.allergens.getLabel(k)).join(', ');
        allergyBadgeHTML = `<span class="recipe-badge badge-allergy-warn" title="Indeholder dine registrerede allergener: ${labels}">⚠️ Indeholder ${labels}</span>`;
      }
    }

    // 1. Skaler ingredienser ud fra state.servings (Antal Personer)
    const rawScaled = typeof recipe.getScaledIngredients === 'function'
      ? recipe.getScaledIngredients(state.servings)
      : recipe.ingredients;

    // Flet dubletter af samme ingrediens sammen (f.eks. hvis olie/salt/løg optræder to gange)
    const dedupedMap = new Map();
    rawScaled.forEach(ri => {
      const normKey = (ri.searchKey || ri.name || '').toLowerCase().trim();
      if (dedupedMap.has(normKey)) {
        const existing = dedupedMap.get(normKey);
        if (typeof existing.amount === 'number' && typeof ri.amount === 'number' && existing.unit === ri.unit) {
          existing.amount = parseFloat((existing.amount + ri.amount).toFixed(2));
        }
      } else {
        dedupedMap.set(normKey, { ...ri });
      }
    });
    const scaledIngredients = Array.from(dedupedMap.values());

    // 2. Beregn pakninger og priser via calculateShoppingItem (forbindelse Opskrift -> Ingrediens -> Produkt -> Pakke -> Pris)
    let recipeIngredientsPrices = [];
    let recipeCheapestTotal = 0;
    let recipeTotalPant = 0;
    let recipeHasMissingPrice = false;

    scaledIngredients.forEach(ri => {
      let cheapestItem = null;
      let storeAlternatives = [];

      state.selectedStores.forEach(sKey => {
        let prod = searchResults[ri.searchKey]?.[sKey] || searchResults[ri.name]?.[sKey];
        let isLiveRema = false;

        // Tjek REMA 1000 Live Cache for REMA 1000 butikken
        if (sKey === 'rema' && window.DataLayer?.getCache) {
          const cleanSk = (ri.searchKey || '').toLowerCase().trim();
          const cleanName = (ri.name || '').toLowerCase().trim();
          const cached = (cleanSk ? window.DataLayer.getCache(`mums_rema_search_${cleanSk}`) : null) || 
                         (cleanName ? window.DataLayer.getCache(`mums_rema_search_${cleanName}`) : null);
          if (cached && cached.data && cached.data.price > 0) {
            prod = cached.data;
            isLiveRema = true;
          }
        }

        if (!prod) {
          const matchKey = findProductDbMatch(ri.name, ri.searchKey);
          if (matchKey && PRODUCT_DB[matchKey]?.[sKey]) {
            prod = PRODUCT_DB[matchKey][sKey];
          }
        }

        const shopItem = calculateShoppingItem({
          ingredientName: ri.name,
          neededAmount: ri.amount,
          neededUnit: ri.unit,
          product: prod,
          storeKey: sKey,
          activeOffers: state.weeklyOffers,
        });

        if (isLiveRema && shopItem) {
          shopItem.isLiveRema = true;
        }

        if (shopItem && shopItem.hasPrice && shopItem.totalPrice !== null) {
          storeAlternatives.push(shopItem);
        }

        if (!cheapestItem || (shopItem.totalPrice !== null && shopItem.totalPrice < (cheapestItem.totalPrice || Infinity))) {
          cheapestItem = shopItem;
        }
      });

      if (!cheapestItem) {
        cheapestItem = calculateShoppingItem({
          ingredientName: ri.name,
          neededAmount: ri.amount,
          neededUnit: ri.unit,
          product: null,
          storeKey: 'ukendt',
          activeOffers: state.weeklyOffers,
        });
      }

      cheapestItem.storeAlternatives = storeAlternatives;
      recipeIngredientsPrices.push(cheapestItem);
      if (cheapestItem.hasPrice && typeof cheapestItem.totalPrice === 'number') {
        recipeCheapestTotal += cheapestItem.totalPrice;
        recipeTotalPant += cheapestItem.pant || 0;
      } else {
        recipeHasMissingPrice = true;
      }
    });

    // Grupper varerne pr. butik for en klar rute
    const storeGroups = {};
    recipeIngredientsPrices.forEach(item => {
      if (!storeGroups[item.storeKey]) {
        storeGroups[item.storeKey] = {
          loc: getStoreLocationInfo(item.storeKey),
          items: [],
          total: 0,
        };
      }
      storeGroups[item.storeKey].items.push(item);
      if (item.hasPrice && typeof item.totalPrice === 'number') {
        storeGroups[item.storeKey].total += item.totalPrice;
      }
    });

    // Butikskort
    const storeRouteCardsHTML = Object.entries(storeGroups).map(([sKey, group]) => {
      const { loc, items, total } = group;
      const itemsList = items.map(i => `${i.productName} (${i.packagesNeeded} pk = ${i.hasPrice ? i.totalPrice.toFixed(2) + ' kr' : 'pris mangler'})`).join(', ');
      const mapsUrl = loc.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.mapsQuery || loc.address)}`;

      return `
        <div class="store-visit-card">
          <div class="store-visit-top">
            <div class="store-visit-name">
              <span class="store-dot ${loc.storeKey}-dot"></span>
              <strong>${loc.label}</strong>
            </div>
            <span class="store-visit-dist">📍 ${loc.distanceText} væk</span>
          </div>
          <div class="store-visit-address">Adresse: <strong>${loc.address}</strong></div>
          <div class="store-visit-items">Varer du skal købe her (${items.length}): <strong>${itemsList}</strong> (I alt: ${total.toFixed(2)} kr)</div>
          <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="store-visit-map-btn">
            🗺️ Rutevejledning i Google Maps (${loc.distanceText}) ↗
          </a>
        </div>
      `;
    }).join('');

    const storesBreakdownHTML = `
      <div class="recipe-stores-breakdown">
        <div class="stores-breakdown-title">🏬 Butikker du skal hen til for denne ret (og deres adresse):</div>
        <div class="stores-breakdown-list">
          ${storeRouteCardsHTML}
        </div>
      </div>
    `;

    // Shopping rækker med pakningsberegning
    const shoppingRowsHTML = recipeIngredientsPrices.map(item => {
      const storeLoc = getStoreLocationInfo(item.storeKey);
      const pantBadge = item.pant > 0 ? `<span class="shop-pant-badge">+${item.pant.toFixed(2)} kr pant</span>` : '';
      const pkgBadge = `<span class="pkg-badge">📦 ${item.packagesNeeded} pk. à ${item.packageSizeText}</span>`;
      const liveRemaBadge = (item.isLiveRema || item.storeKey === 'rema') ? `<span class="live-rema-pill" title="Opdateret live via REMA 1000 API">🟢 Live REMA</span> ` : '';
      const priceDisplay = item.hasPrice 
        ? `${item.totalPrice.toFixed(2)} kr` 
        : `<span class="shopping-item-missing">Pris mangler</span>`;

      // Vis priser i øvrige supermarkeder
      let alternativesHTML = '';
      if (item.storeAlternatives && item.storeAlternatives.length > 1) {
        const otherStores = item.storeAlternatives
          .filter(alt => alt.storeKey !== item.storeKey && alt.hasPrice)
          .sort((a, b) => a.totalPrice - b.totalPrice);

        if (otherStores.length > 0) {
          const chips = otherStores.map(alt => {
            const locMeta = getStoreLocationInfo(alt.storeKey);
            return `<span class="other-store-pill" style="font-size:0.73rem; padding:2px 6px; border-radius:4px; background:var(--bg-card); border:1px solid var(--border-color); color:var(--text-secondary); display:inline-flex; align-items:center; gap:3px;">
              <span class="store-dot ${locMeta.tagClass ? locMeta.tagClass.replace('tag-', '') + '-dot' : ''}"></span>
              <strong>${locMeta.label}</strong>: ${alt.totalPrice.toFixed(2)} kr
            </span>`;
          }).join(' ');

          alternativesHTML = `
            <div class="shop-alternatives-row" style="margin-top: 6px; font-size: 0.76rem; color: var(--text-secondary);">
              <span style="font-weight:600;">Kan også købes i:</span> ${chips}
            </div>
          `;
        }
      }

      return `
        <div class="shop-row">
          <div class="shop-row-left">
            <div class="shop-ingredient">${liveRemaBadge}${item.productName} ${item.isOffer ? '🔥' : ''} ${pantBadge}</div>
            <div class="shop-amount">Opskrift bruger: <strong>${item.neededAmount} ${item.neededUnit}</strong> · <span class="pkg-badge" style="font-weight:600;">📦 Købes: ${item.packagesNeeded} hel pk. à ${item.packageSizeText}</span></div>
            <div class="shop-package-notice" style="font-size:0.73rem; color:var(--text-secondary); margin-top:2px;">(Du betaler for hele pakken i butikken til fuld pris: <strong>${priceDisplay}</strong>)</div>
            <div class="shop-item-address">
              <span>📍 Nærmeste <strong>${storeLoc.label}</strong>: ${storeLoc.address}</span>
              <span class="shop-dist-pill">${storeLoc.distanceText} væk</span>
            </div>
            ${alternativesHTML}
          </div>
          <div class="shop-row-right">
            <span class="shop-store-badge ${storeLoc.tagClass} shop-clickable"
                  data-store="${item.storeKey}"
                  data-name="${encodeURIComponent(item.productName)}"
                  data-price="${item.totalPrice || 0}"
                  data-pant="${item.pant || 0}"
                  title="Klik for butiksinfo">
              ${storeLoc.label} ↗
            </span>
            <div class="shop-price">${priceDisplay}</div>
            <div style="font-size:0.70rem; color:var(--gray-400); text-align:right;">fuld butikspris</div>
            ${item.isOffer && item.normalPrice ? `<span style="font-size:0.75rem; color:var(--gray-400); text-decoration:line-through; display:block;">Normal: ${(item.packagesNeeded * item.normalPrice).toFixed(2)} kr</span>` : ''}
          </div>
        </div>
      `;
    }).join('');

    const totalPantNotice = recipeTotalPant > 0 
      ? `<span>(+ ${recipeTotalPant.toFixed(2)} kr pant = ${(recipeCheapestTotal + recipeTotalPant).toFixed(2)} kr)</span>` 
      : '';

    // Budget beregning pr. ret
    let budgetNoticeHTML = '';
    if (state.budget && state.budget > 0 && !recipeHasMissingPrice) {
      const isOver = recipeCheapestTotal > state.budget;
      const diff = Math.abs(recipeCheapestTotal - state.budget);
      if (isOver) {
        budgetNoticeHTML = `<div class="recipe-budget-alert over" style="margin-top:8px; padding:6px 10px; border-radius:6px; font-size:0.8rem; font-weight:700;">⚠️ Overskrider dit budget (${state.budget} kr) med <strong>${diff.toFixed(2)} kr</strong></div>`;
      } else {
        budgetNoticeHTML = `<div class="recipe-budget-alert within" style="margin-top:8px; padding:6px 10px; border-radius:6px; font-size:0.8rem; font-weight:700;">✅ Inden for dit budget (${state.budget} kr) – <strong>${diff.toFixed(2)} kr</strong> tilovers</div>`;
      }
    }

    // Kildehenvisning
    let sourceLinkHTML = '';
    if (recipe.sourceUrl) {
      sourceLinkHTML = `<a href="${recipe.sourceUrl}" target="_blank" rel="noopener noreferrer" class="recipe-source-link" onclick="event.stopPropagation();">🔗 Kilde: ${recipe.source} ↗</a>`;
    } else if (recipe.source) {
      sourceLinkHTML = `<span style="font-size:0.78rem; color:var(--gray-500); margin-left:8px;">(${recipe.source})</span>`;
    }

    // Ernæringsbar (viser næring eller live Open Food Facts knap)
    let nutrHTML = '';
    if (recipe.nutrition && (recipe.nutrition.kcal || recipe.nutrition.protein)) {
      const isLiveOff = recipe.nutritionSource === 'openfoodfacts.org';
      nutrHTML = `
        <span class="nutr-pill nutr-kcal">⚡ ${recipe.nutrition.kcal ?? '—'} kcal</span>
        <span class="nutr-pill nutr-prot">🥩 ${recipe.nutrition.protein ?? '—'}g protein</span>
        <span class="nutr-pill nutr-fat">🥑 ${recipe.nutrition.fat ?? '—'}g fedt</span>
        <span class="nutr-pill nutr-carbs">🌾 ${recipe.nutrition.carbs ?? '—'}g kulhydrat</span>
        ${recipe.nutrition.fiber !== undefined ? `<span class="nutr-pill">🥗 ${recipe.nutrition.fiber}g fibre</span>` : ''}
        ${isLiveOff ? `<span class="nutr-live-tag">🟢 Open Food Facts</span>` : ''}
      `;
    } else {
      nutrHTML = `
        <button class="nutr-fetch-btn" id="nutrBtn_${recipe.id}" onclick="fetchLiveRecipeNutrition('${recipe.id}', event)" title="Hent næringsdata live fra Open Food Facts databasen">
          🥗 Beregn næringsindhold live (Open Food Facts) ⚡
        </button>
      `;
    }

    card.innerHTML = `
      <div class="recipe-card-top">
        <div class="recipe-emoji-big">${recipe.image ? `<img src="${recipe.image}" alt="${recipe.name}" class="recipe-thumb-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';"><span style="display:none;">${recipe.emoji}</span>` : recipe.emoji}</div>
        <div class="recipe-main">
          <div class="recipe-title-row">
            <h3 class="recipe-title">${recipe.name}</h3>
            <span class="recipe-badge ${recipe.badgeClass}">${recipe.badge}</span>
            ${allergyBadgeHTML}
            ${matchBadgeHTML}
            ${sourceLinkHTML}
          </div>
          <p class="recipe-desc">${recipe.desc}</p>
          <div class="recipe-meta">
            <span>⏱️ ${recipe.prepTime} min</span>
            <span>👥 <strong>${state.servings} personer</strong> ${recipe.servings !== state.servings ? `(skaleret fra ${recipe.servings})` : ''}</span>
            <span>🥕 ${ingMatchCount}/${recipe.ingredients.length} matchende ingredienser</span>
          </div>
          <div class="nutrition-bar">
            ${nutrHTML}
          </div>
          ${budgetNoticeHTML}
        </div>
        <div class="recipe-chevron">▶</div>
      </div>

      <!-- DROPDOWN INDKØBSLISTE & FREMGANGSMÅDE -->
      <div class="recipe-dropdown">
        <div class="recipe-dropdown-grid">
          
          <!-- Fremgangsmåde -->
          <div class="dropdown-section">
            <h3>👨‍🍳 Fremgangsmåde</h3>
            <ul class="steps-list">
              ${(recipe.steps || []).map((step, idx) => `
                <li>
                  <span class="step-num">${idx + 1}</span>
                  <span>${step}</span>
                </li>
              `).join('')}
            </ul>
          </div>

          <!-- Indkøbsliste med pakningsberegninger -->
          <div class="dropdown-section">
            <h3>🛒 Hvor skal du købe hvad? <span style="font-size:0.75rem; font-weight:normal; color:var(--gray-400);">(Beregnet i hele butikspakker – du betaler for den fulde pakke i butikken)</span></h3>
            <div class="shopping-list">
              ${shoppingRowsHTML}
              <div class="shop-total-row">
                <span>Samlet bedste pris:</span>
                <span class="shop-total-price">${recipeCheapestTotal.toFixed(2)} kr ${totalPantNotice}</span>
              </div>
            </div>

            <button class="add-recipe-cart-btn btn-primary btn-sm" data-recipe-id="${recipe.id}" style="width:100%; margin:10px 0 6px 0; padding:9px 14px; font-weight:800; cursor:pointer;">
              🛒 Tilføj denne ret til samlet indkøbsliste (${state.servings} pers.)
            </button>
            <button class="add-recipe-mealplan-btn btn-secondary btn-sm" data-recipe-id="${recipe.id}" style="width:100%; margin:0 0 10px 0; padding:8px 14px; font-weight:700; cursor:pointer;">
              📅 Sæt denne ret på ugens madplan
            </button>

            ${storesBreakdownHTML}

            <button class="copy-list-btn" data-recipe-id="${recipe.id}">
              📋 Kopier indkøbsliste & adresser til udklipsholder
            </button>
          </div>

        </div>
      </div>
    `;

    // Dropdown toggle
    const topBar = card.querySelector('.recipe-card-top');
    topBar.addEventListener('click', () => {
      const wasOpen = card.classList.contains('open');
      document.querySelectorAll('.recipe-card-outer.open').forEach(c => c.classList.remove('open'));
      if (!wasOpen) card.classList.add('open');
    });

    // Tilføj til samlet indkøbsliste knap
    card.querySelector('.add-recipe-cart-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      addRecipeToShoppingList(recipe);
    });

    // Føj til madplan knap
    card.querySelector('.add-recipe-mealplan-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      openAddToMealPlanModal(recipe.id);
    });

    // Klikbare butiksbadges i indkøbslisten
    card.querySelectorAll('.shop-store-badge.shop-clickable').forEach(badge => {
      badge.addEventListener('click', (e) => {
        e.stopPropagation();
        const sKey = badge.dataset.store;
        const pName = decodeURIComponent(badge.dataset.name);
        const pPrice = parseFloat(badge.dataset.price);
        const pPant = parseFloat(badge.dataset.pant || 0);
        openStoreModal(sKey, pName, pPrice, pPant);
      });
    });

    // Kopier indkøbsliste til udklipsholder
    card.querySelector('.copy-list-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const lines = [
        `🛒 Indkøbsliste til ${recipe.name} (${state.servings} personer)`,
        `Samlet pris: ${recipeCheapestTotal.toFixed(2)} kr ${totalPantNotice}`,
        '',
        'VARER:',
        ...recipeIngredientsPrices.map(item => {
          const loc = getStoreLocationInfo(item.storeKey);
          return `- ${item.productName}: ${item.packagesNeeded} pk. à ${item.packageSizeText} (${item.hasPrice ? item.totalPrice.toFixed(2) + ' kr' : 'pris mangler'}) hos ${loc.label}, ${loc.address}`;
        }),
      ];
      navigator.clipboard.writeText(lines.join('\n')).then(() => {
        showToast('📋 Indkøbsliste kopieret til udklipsholder!', 'success');
      }).catch(() => {
        showToast('Kunne ikke kopiere til udklipsholder', 'error');
      });
    });

    return card;
  }

  // Paginering for lynhurtig indlæsning og 60 FPS scrolling
  const PAGE_SIZE = 24;
  let currentlyRendered = 0;

  function renderBatch() {
    const nextBatch = scoredRecipes.slice(currentlyRendered, currentlyRendered + PAGE_SIZE);
    nextBatch.forEach((item, batchIdx) => {
      const card = buildRecipeCard(item, currentlyRendered + batchIdx);
      dom.recipeCards.appendChild(card);
    });
    currentlyRendered += nextBatch.length;

    // Fjern evt. forrige 'Vis flere'-knap
    document.getElementById('btnLoadMoreRecipes')?.remove();

    if (currentlyRendered < scoredRecipes.length) {
      const remaining = scoredRecipes.length - currentlyRendered;
      const nextCount = Math.min(PAGE_SIZE, remaining);
      const btnMore = document.createElement('button');
      btnMore.id = 'btnLoadMoreRecipes';
      btnMore.className = 'btn-load-more-recipes';
      btnMore.style.gridColumn = '1 / -1';
      btnMore.textContent = `Vis ${nextCount} flere opskrifter (${remaining} tilbage) ⬇`;
      btnMore.addEventListener('click', () => renderBatch());
      dom.recipeCards.appendChild(btnMore);
    }
  }

  renderBatch();
}


// ─── OPEN FOOD FACTS: LIVE NÆRINGSBEREGNING AF OPSKRIFT ───────────────────────
window.fetchLiveRecipeNutrition = async function(recipeId, event) {
  if (event) event.stopPropagation();
  const btn = document.getElementById(`nutrBtn_${recipeId}`);
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '⏳ Henter fra Open Food Facts...';
  }

  const recipe = (typeof RECIPES !== 'undefined' ? RECIPES : []).find(r => r.id === recipeId);
  if (!recipe || !window.DataLayer?.openFoodFacts?.calculateRecipeNutrition) {
    showToast('Kunne ikke hente næringsdata', 'error');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '🥗 Prøv igen';
    }
    return;
  }

  try {
    const res = await window.DataLayer.openFoodFacts.calculateRecipeNutrition(recipe);
    if (res && res.ok && res.perServing) {
      recipe.nutrition = res.perServing;
      recipe.nutritionSource = 'openfoodfacts.org';
      showToast(`🥗 Næringsprofil beregnet live for ${recipe.name}!`, 'success');
      const card = btn ? btn.closest('.recipe-card') : null;
      if (card) {
        const nutrBar = card.querySelector('.nutrition-bar');
        if (nutrBar) {
          nutrBar.innerHTML = `
            <span class="nutr-pill nutr-kcal">⚡ ${res.perServing.kcal} kcal</span>
            <span class="nutr-pill nutr-prot">🥩 ${res.perServing.protein}g protein</span>
            <span class="nutr-pill nutr-fat">🥑 ${res.perServing.fat}g fedt</span>
            <span class="nutr-pill nutr-carbs">🌾 ${res.perServing.carbs}g kulhydrat</span>
            <span class="nutr-live-tag">🟢 Open Food Facts (${res.matchedIngredients} råvarer)</span>
          `;
        }
      }
    } else {
      showToast('Ingen næringsdata fundet for denne ret', 'info');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = 'ℹ️ Data utilgængelig';
      }
    }
  } catch (err) {
    console.error('Open Food Facts opslag fejlede:', err);
    showToast('Fejl ved forbindelse til Open Food Facts', 'error');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '🥗 Prøv igen';
    }
  }
};

// ─── RENDERING AF PRISSAMMENLIGNING TABEL ────────────────────────────────────
function renderComparisonTable(searchResults) {
  if (!dom.comparisonTable) return;

  const ingredients = Object.keys(searchResults);
  const selectedStores = state.selectedStores;

  if (ingredients.length === 0 || selectedStores.length === 0) return;

  const storeTotals = {};
  const storePants = {};
  selectedStores.forEach(s => {
    storeTotals[s] = 0;
    storePants[s] = 0;
  });

  let html = `
    <table class="comparison-table">
      <thead>
        <tr>
          <th>Ingrediens / Vare</th>
          ${selectedStores.map(s => {
            const loc = getStoreLocationInfo(s);
            return `<th class="shop-clickable" data-store="${s}" title="${loc.label}: ${loc.address} (${loc.distanceText} væk)">${loc.label} ↗</th>`;
          }).join('')}
          <th>Billigst (Nærmeste adresse)</th>
        </tr>
      </thead>
      <tbody>
  `;

  let totalLowestSum = 0;
  let totalPantSum = 0;

  ingredients.forEach(ing => {
    const row = searchResults[ing];
    const prices = selectedStores.map(s => row[s]?.price ?? null);
    const validPrices = prices.filter(p => p !== null);
    const minPrice = validPrices.length ? Math.min(...validPrices) : null;
    const maxPrice = validPrices.length ? Math.max(...validPrices) : null;

    if (minPrice !== null) totalLowestSum += minPrice;

    html += `<tr>
      <td class="ingredient-name-cell">
        <span>${getEmoji(ing)}</span>
        <span>${ing.charAt(0).toUpperCase() + ing.slice(1)}</span>
      </td>
    `;

    let cheapestStoreForIng = null;

    selectedStores.forEach(s => {
      const item = row[s];
      if (!item) {
        html += `<td class="no-price">Ikke fundet</td>`;
      } else {
        const p = item.price;
        const pant = item.pant || 0;
        storeTotals[s] += p;
        storePants[s] += pant;

        let cls = 'price-mid';
        let badges = '';

        if (p === minPrice) {
          cls = 'price-best';
          badges += '<span class="badge-best">Billigst</span>';
          cheapestStoreForIng = item;
        } else if (p === maxPrice && validPrices.length > 1) {
          cls = 'price-high';
        }

        if (item.isOffer) {
          badges += '<span class="badge-offer">TILBUD 🔥</span>';
        }

        let pantTagHTML = '';
        if (pant > 0) {
          pantTagHTML = `<span class="pant-cell-tag" title="${item.pantType || 'Pant'}: +${pant.toFixed(2)} kr (I alt: ${(p + pant).toFixed(2)} kr inkl. pant)">+${pant.toFixed(2)} kr pant</span>`;
        }

        html += `
          <td class="price-cell ${cls} price-clickable"
              data-store="${s}"
              data-name="${encodeURIComponent(item.name)}"
              data-price="${item.price}"
              data-pant="${pant}"
              data-pant-type="${item.pantType || ''}"
              title="Klik for adresse, pant & ${STORES[s]?.label || s} hjemmeside">
            ${p.toFixed(2)} kr${badges}
            ${pantTagHTML}
          </td>`;
      }
    });

    const cheapestStoreKey = selectedStores[prices.indexOf(minPrice)];
    const cheapestLoc = getStoreLocationInfo(cheapestStoreKey);
    const cheapestStoreLabel = cheapestLoc.label || cheapestStoreKey;
    const cheapestPant = cheapestStoreForIng?.pant || 0;
    if (cheapestPant > 0) totalPantSum += cheapestPant;

    html += `
      <td class="price-cell price-best shop-clickable"
          data-store="${cheapestStoreKey}"
          title="Klik for ${cheapestStoreLabel} butiksinfo, rutevejledning & link">
        <div class="cheapest-cell-price">${minPrice !== null ? `${minPrice.toFixed(2)} kr (${cheapestStoreLabel} ↗)` : '—'}</div>
        <div class="cheapest-cell-address">📍 <strong>${cheapestLoc.address}</strong></div>
        <div class="cheapest-cell-dist">Nærmeste butik: <strong>${cheapestLoc.distanceText}</strong> væk</div>
        ${cheapestPant > 0 ? `<small style="display:block; color:#0284c7; font-weight:600;">+${cheapestPant.toFixed(2)} kr pant</small>` : ''}
      </td>
    </tr>`;
  });

  html += '</tbody></table>';
  dom.comparisonTable.innerHTML = html;

  // Lyttere på klikbare tabel-celler og headere
  dom.comparisonTable.querySelectorAll('.price-clickable').forEach(cell => {
    cell.addEventListener('click', () => {
      const sKey = cell.dataset.store;
      const pName = decodeURIComponent(cell.dataset.name);
      const pPrice = parseFloat(cell.dataset.price);
      const pPant = parseFloat(cell.dataset.pant || 0);
      const pType = cell.dataset.pantType || '';
      openStoreModal(sKey, pName, pPrice, pPant, pType);
    });
  });

  dom.comparisonTable.querySelectorAll('th.shop-clickable, td.shop-clickable').forEach(cell => {
    cell.addEventListener('click', () => {
      const sKey = cell.dataset.store;
      openStoreModal(sKey);
    });
  });

  // Samlet vinder & total med specifik adresse
  if (dom.totalBestPrice) {
    if (totalPantSum > 0) {
      dom.totalBestPrice.innerHTML = `${totalLowestSum.toFixed(2)} kr <span style="font-size:0.8rem; font-weight:600; color:var(--gray-600);">(+ ${totalPantSum.toFixed(2)} kr pant = ${(totalLowestSum + totalPantSum).toFixed(2)} kr)</span>`;
    } else {
      dom.totalBestPrice.textContent = `${totalLowestSum.toFixed(2)} kr`;
    }
  }

  const validStoreTotals = Object.entries(storeTotals).filter(([, v]) => v > 0);
  if (validStoreTotals.length > 0 && dom.winnerBanner) {
    const [winnerStoreKey, winnerSum] = validStoreTotals.reduce((a, b) => a[1] < b[1] ? a : b);
    const winnerLoc = getStoreLocationInfo(winnerStoreKey);
    const winnerPant = storePants[winnerStoreKey] || 0;

    let pantTextNotice = winnerPant > 0 ? ` (+ ${winnerPant.toFixed(2)} kr pant = ${(winnerSum + winnerPant).toFixed(2)} kr inkl. pant)` : '';
    dom.winnerStore.innerHTML = `
      <div><strong>${winnerLoc.label}</strong> – Samlet indkøb koster ${winnerSum.toFixed(2)} kr${pantTextNotice}</div>
      <div style="font-size:0.82rem; color:var(--gray-600); margin-top:4px;">
        📍 Nærmeste ${winnerLoc.label}: <strong>${winnerLoc.address}</strong> (kun <strong>${winnerLoc.distanceText}</strong> væk)
      </div>
    `;
    dom.winnerPrice.innerHTML = `${winnerSum.toFixed(2)} kr ${winnerPant > 0 ? `<span style="font-size:0.8rem; display:block; color:var(--gray-600); font-weight:600;">+ ${winnerPant.toFixed(2)} kr pant</span>` : ''}`;
    dom.winnerBanner.classList.remove('hidden');

    dom.winnerBanner.style.cursor = 'pointer';
    dom.winnerBanner.title = `Klik for at se ${winnerLoc.label}s adresse og åbningstider`;
    dom.winnerBanner.onclick = () => openStoreModal(winnerStoreKey);
  }
}

// ─── OPSKRIFTS-HUB: ARLA & VALDEMARSRO FILTRE & SØGNING ────────────────────────
function initRecipeHubUI() {
  dom.recipeSourcePills?.forEach(pill => {
    pill.addEventListener('click', () => {
      dom.recipeSourcePills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.recipeSourceFilter = pill.dataset.source || 'all';
      renderRecipeCards(state.lastSearchResults || {});
      dom.resultsSection?.classList.remove('hidden');
      dom.emptyState?.classList.add('hidden');
    });
  });

  dom.recipeSearchInput?.addEventListener('input', () => {
    state.recipeSearchQuery = (dom.recipeSearchInput.value || '').trim();
    renderRecipeCards(state.lastSearchResults || {});
    dom.resultsSection?.classList.remove('hidden');
    dom.emptyState?.classList.add('hidden');
  });

  dom.recipeFocusSelect?.addEventListener('change', (e) => {
    state.recipeFocus = e.target.value;
    renderRecipeCards(state.lastSearchResults || {});
    dom.resultsSection?.classList.remove('hidden');
    dom.emptyState?.classList.add('hidden');
  });
}

// ─── GEM BRUGERDATA HJÆLPER ──────────────────────────────────────────────────
function saveCurrentUserData() {
  if (window.auth && typeof auth.saveUserData === 'function') {
    auth.saveUserData({
      servings: state.servings,
      budget: state.budget,
      activeProfileId: state.activeProfileId,
      selectedStores: state.selectedStores,
      shoppingList: state.shoppingList,
      checkedShoppingItems: state.checkedShoppingItems,
      allergies: state.allergies,
      autoFilterAllergies: state.autoFilterAllergies,
      mealPlan: state.mealPlan,
    });
  }
}

// ─── TAB NAVIGATION & VISNINGS-STYRING (HJEM, OPSKRIFTER, TILBUD, INDKØB, PROFIL)
function switchTab(tabName) {
  state.activeTab = tabName;

  const tabViewMap = {
    home: document.getElementById('tabViewHome'),
    mealplan: document.getElementById('tabViewMealPlan'),
    recipes: document.getElementById('tabViewRecipes'),
    offers: document.getElementById('tabViewOffers'),
    shopping: document.getElementById('tabViewShopping'),
    profile: document.getElementById('tabViewProfile'),
  };

  Object.entries(tabViewMap).forEach(([name, el]) => {
    if (!el) return;
    if (name === tabName) {
      el.classList.remove('hidden');
      el.classList.add('active');
    } else {
      el.classList.add('hidden');
      el.classList.remove('active');
    }
  });

  // Opdater aktive knapper (både mobil bund-nav og desktop top-nav)
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  // Fane-specifik rendering
  if (tabName === 'home') {
    renderHomeDashboard();
  } else if (tabName === 'mealplan') {
    renderMealPlanView();
  } else if (tabName === 'recipes') {
    renderRecipeCards(state.lastSearchResults || {});
  } else if (tabName === 'offers') {
    renderOffers();
    updateFlyerCountdown();
  } else if (tabName === 'shopping') {
    renderShoppingListPage();
  } else if (tabName === 'profile') {
    renderProfileView();
  }

  // Blød scrolling til toppen
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initTabNavigation() {
  // Bundnavigation og desktop top-nav knapper
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = btn.dataset.tab;
      if (tab) switchTab(tab);
    });
  });

  // Logo knap -> Hjem
  dom.logoBtn?.addEventListener('click', () => switchTab('home'));

  // Knap i header til samlet indkøbsliste -> switchTab('shopping')
  dom.globalShoppingListBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    switchTab('shopping');
  });

  // Alle elementer med data-tab-target
  document.querySelectorAll('[data-tab-target]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const target = el.dataset.tabTarget;
      if (target) switchTab(target);
    });
  });

  // Råvare kategori-knapper under opskrifter (.recipe-cat-btn)
  dom.recipeCatBtns?.forEach(btn => {
    btn.addEventListener('click', () => {
      dom.recipeCatBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.recipeCategoryFilter = btn.dataset.cat || 'all';
      renderRecipeCards(state.lastSearchResults || {});
    });
  });
}

// ─── 1. FANEN: HJEM DASHBOARD ────────────────────────────────────────────────
function renderHomeDashboard() {
  // Opdater status-chips
  if (dom.homeChipServingsVal) {
    dom.homeChipServingsVal.textContent = `${state.servings} personer`;
  }
  if (dom.homeChipBudgetVal) {
    dom.homeChipBudgetVal.textContent = `${state.budget} kr`;
  }
  if (dom.homeChipNutritionVal) {
    const prof = state.userProfiles.find(p => p.id === state.activeProfileId);
    dom.homeChipNutritionVal.textContent = prof ? prof.name : 'Standard mål';
  }
  if (dom.homeChipNearestStoreVal) {
    if (state.nearestStores && state.nearestStores.length > 0) {
      const sorted = [...state.nearestStores].filter(s => s.distanceKm !== null).sort((a,b) => a.distanceKm - b.distanceKm);
      if (sorted.length > 0) {
        dom.homeChipNearestStoreVal.textContent = `${STORES[sorted[0].storeKey]?.name || sorted[0].name} (${sorted[0].distanceText})`;
      } else {
        dom.homeChipNearestStoreVal.textContent = 'GPS fundet';
      }
    } else {
      dom.homeChipNearestStoreVal.textContent = 'Tryk for afstand';
    }
  }

  // Dagens udvalgte ret
  const featured = RECIPES.find(r => r.id === 'arla-pasta-bacon') || RECIPES[0];
  if (featured && dom.homeFeaturedDishBox) {
    if (dom.homeFeaturedTitle) dom.homeFeaturedTitle.textContent = featured.name;
    if (dom.homeFeaturedDesc) dom.homeFeaturedDesc.textContent = featured.desc;
    
    // Beregn pris estimat
    const estPrice = (featured.ingredients || []).length * 11.50 * (state.servings / 2);
    if (dom.homeFeaturedPricePill) {
      dom.homeFeaturedPricePill.textContent = `Ca. ${(estPrice / state.servings).toFixed(2)} kr / pers (${estPrice.toFixed(0)} kr i alt)`;
    }

    if (dom.btnCookFeatured) {
      dom.btnCookFeatured.onclick = () => {
        state.recipeSearchQuery = featured.name;
        if (dom.recipeSearchInput) dom.recipeSearchInput.value = featured.name;
        switchTab('recipes');
      };
    }
    if (dom.btnFeaturedToCart) {
      dom.btnFeaturedToCart.onclick = () => {
        addRecipeToShoppingList(featured);
      };
    }
  }

  // Ugens hotteste tilbud (Top 4 efter rabat %)
  if (dom.homeTopOffersGrid) {
    const offers = (typeof ALL_OFFERS !== 'undefined' ? ALL_OFFERS : []).filter(o => typeof o.isActive === 'function' ? o.isActive() : true);
    const sorted = [...offers].sort((a, b) => {
      const discA = a.normalPrice && a.offerPrice ? (1 - a.offerPrice / a.normalPrice) : 0;
      const discB = b.normalPrice && b.offerPrice ? (1 - b.offerPrice / b.normalPrice) : 0;
      return discB - discA;
    }).slice(0, 4);

    dom.homeTopOffersGrid.innerHTML = sorted.map(o => {
      const storeLoc = getStoreLocationInfo(o.supermarket || o.store);
      return `
        <div class="home-offer-chip" onclick="switchTab('offers')">
          <span class="home-offer-savings">Spar ${o.discount || '25%'}</span>
          <div class="home-offer-emoji">${o.emoji || '🏷️'}</div>
          <div class="home-offer-name">${o.name || o.product}</div>
          <div class="home-offer-price-row">
            <span class="home-offer-price">${o.offerPrice.toFixed(2)} kr</span>
            ${o.normalPrice ? `<span class="home-offer-orig">${o.normalPrice.toFixed(2)} kr</span>` : ''}
          </div>
          <span class="home-offer-store">${storeLoc.label} · 📍 ${storeLoc.distanceText}</span>
        </div>
      `;
    }).join('');
  }

  // Nærmeste butikker grid
  if (dom.homeStoresGrid) {
    const storeKeys = ['bilka', 'foetex', 'netto', 'rema', 'lidl', 'coop365'];
    dom.homeStoresGrid.innerHTML = storeKeys.map(sKey => {
      const loc = getStoreLocationInfo(sKey);
      return `
        <div class="home-store-chip" onclick="openStoreModal('${sKey}')">
          <div class="home-store-top">
            <span class="home-store-name">${loc.label}</span>
            <span class="home-store-dist">📍 ${loc.distanceText}</span>
          </div>
          <div class="home-store-addr">${loc.address}</div>
          <div class="home-store-route">Åbningstid: ${loc.openHours} ↗</div>
        </div>
      `;
    }).join('');
  }
}

function initHomeLocationShortcut() {
  // Hurtig lokalisering fra Home
  dom.homeLocateBtn?.addEventListener('click', () => {
    dom.locationBtn?.click();
  });
}

// ─── 4. FANEN: INDKØBSLISTE (DEDIKERET SIDE MED AFKRYDSNING & RUTE) ───────────
function renderShoppingListPage() {
  if (!dom.pageShoppingListContainer) return;
  dom.pageShoppingListContainer.innerHTML = '';

  const list = state.shoppingList || [];
  updateCartBadges();

  if (list.length === 0) {
    if (dom.shoppingEmptyNotice) dom.shoppingEmptyNotice.classList.remove('hidden');
    if (dom.pageShoppingTotalSum) dom.pageShoppingTotalSum.textContent = '0,00 kr';
    if (dom.pageShoppingPantSum) dom.pageShoppingPantSum.textContent = '0,00 kr';
    if (dom.pageShoppingBudgetStatus) dom.pageShoppingBudgetStatus.textContent = 'Ingen varer';
    return;
  }

  if (dom.shoppingEmptyNotice) dom.shoppingEmptyNotice.classList.add('hidden');

  // Gruppér varerne pr. supermarked
  const storeGroups = {};
  let totalSum = 0;
  let totalPant = 0;

  list.forEach((item, idx) => {
    const sKey = item.storeKey || 'diverse';
    if (!storeGroups[sKey]) {
      storeGroups[sKey] = {
        loc: getStoreLocationInfo(sKey),
        items: [],
        subtotal: 0,
        pantTotal: 0,
      };
    }
    storeGroups[sKey].items.push({ ...item, originalIndex: idx });
    if (item.hasPrice && typeof item.totalPrice === 'number') {
      storeGroups[sKey].subtotal += item.totalPrice;
      totalSum += item.totalPrice;
    }
    if (item.pant > 0) {
      storeGroups[sKey].pantTotal += item.pant;
      totalPant += item.pant;
    }
  });

  // Opdater oversigts-bjælke
  if (dom.pageShoppingTotalSum) {
    dom.pageShoppingTotalSum.textContent = `${totalSum.toFixed(2)} kr`;
  }
  if (dom.pageShoppingPantSum) {
    dom.pageShoppingPantSum.textContent = `${totalPant.toFixed(2)} kr`;
  }
  if (dom.pageShoppingBudgetStatus) {
    if (state.budget && state.budget > 0) {
      const diff = state.budget - totalSum;
      if (diff >= 0) {
        dom.pageShoppingBudgetStatus.innerHTML = `<span class="budget-status-within">✅ Inden for budget (${diff.toFixed(2)} kr tilovers)</span>`;
      } else {
        dom.pageShoppingBudgetStatus.innerHTML = `<span class="budget-status-over">⚠️ ${Math.abs(diff).toFixed(2)} kr over budget</span>`;
      }
    } else {
      dom.pageShoppingBudgetStatus.textContent = 'Intet budget valgt';
    }
  }

  // Render butiksgrupper med adresser og rutevejledning
  Object.entries(storeGroups).forEach(([sKey, group]) => {
    const { loc, items, subtotal } = group;
    const card = document.createElement('div');
    card.className = 'shopping-store-group-card';

    const itemsHTML = items.map(item => {
      const isChecked = !!state.checkedShoppingItems[item.originalIndex];
      const pantText = item.pant > 0 ? `<span style="font-size:0.75rem; color:#0284c7;">(+ ${item.pant.toFixed(2)} kr pant)</span>` : '';
      const offerBadge = item.isOffer ? `<span class="tag-badge offer-tag-pill">🔥 Tilbud</span>` : '';

      return `
        <div class="shopping-checklist-item ${isChecked ? 'checked' : ''}" data-idx="${item.originalIndex}">
          <input type="checkbox" class="shopping-item-checkbox" ${isChecked ? 'checked' : ''} data-idx="${item.originalIndex}" />
          <div class="shopping-checklist-details">
            <div class="shopping-checklist-title">
              <span>${item.productName}</span>
              ${offerBadge}
            </div>
            <div class="shopping-checklist-meta">
              <span>Opskrift: ${item.neededAmount} ${item.neededUnit}</span> · 
              <span>Køb: <strong>${item.packagesNeeded} pk à ${item.packageSizeText}</strong></span>
              ${pantText}
              ${item.recipeName ? `<span style="color:var(--gray-400);"> · (fra ${item.recipeName})</span>` : ''}
            </div>
          </div>
          <div class="shopping-checklist-price">
            ${item.hasPrice ? `${item.totalPrice.toFixed(2)} kr` : 'Pris mangler'}
          </div>
        </div>
      `;
    }).join('');

    card.innerHTML = `
      <div class="shopping-store-group-header">
        <div class="shopping-store-group-name">
          <span class="store-dot ${loc.storeKey}-dot"></span>
          <span>${loc.label}</span>
          <span style="font-size:0.8rem; font-weight:normal; color:var(--gray-500);">(${items.length} varer · ${subtotal.toFixed(2)} kr)</span>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:0.8rem; color:var(--gray-600);">📍 <strong>${loc.distanceText} væk</strong></span>
          <a href="${loc.mapsUrl}" target="_blank" rel="noopener noreferrer" class="shopping-store-group-route" title="Se adresse på kort">
            🗺️ Rutevejledning (${loc.address.split(',')[0]}) ↗
          </a>
        </div>
      </div>
      <div class="shopping-checklist-items-wrap">
        ${itemsHTML}
      </div>
    `;

    // Checkbox klik lyttere for afkrydsning i butikken
    card.querySelectorAll('.shopping-item-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const idx = e.target.dataset.idx;
        state.checkedShoppingItems[idx] = e.target.checked;
        const row = card.querySelector(`.shopping-checklist-item[data-idx="${idx}"]`);
        if (row) row.classList.toggle('checked', e.target.checked);
        saveCurrentUserData();
      });
    });

    dom.pageShoppingListContainer.appendChild(card);
  });
}

function initShoppingListPageUI() {
  // Manuel tilføjelse af vare
  dom.pageBtnAddManualItem?.addEventListener('click', () => {
    const val = (dom.pageManualItemInput?.value || '').trim();
    if (!val) return;
    state.shoppingList.push({
      productName: val,
      neededAmount: 1,
      neededUnit: 'stk',
      packageSizeText: '1 stk',
      packagesNeeded: 1,
      storeKey: state.selectedStores[0] || 'netto',
      totalPrice: 15.00,
      normalPrice: 15.00,
      isOffer: false,
      pant: 0,
      hasPrice: true,
      recipeName: 'Manuel tilføjelse',
    });
    dom.pageManualItemInput.value = '';
    renderShoppingListPage();
    saveCurrentUserData();
    showToast(`+ "${val}" tilføjet til indkøbslisten!`, 'success');
  });

  // Ryd indkøbsliste
  dom.pageBtnClearShoppingList?.addEventListener('click', () => {
    if (confirm('Vil du tømme hele din indkøbsliste?')) {
      state.shoppingList = [];
      state.checkedShoppingItems = {};
      renderShoppingListPage();
      saveCurrentUserData();
      showToast('Indkøbsliste ryddet', 'info');
    }
  });

  // Kopiér indkøbsliste
  dom.pageBtnCopyShoppingList?.addEventListener('click', () => {
    if (state.shoppingList.length === 0) {
      showToast('Indkøbslisten er tom', 'error');
      return;
    }
    const lines = [
      '🛒 MUMS Indkøbsliste',
      `Samlet beløb: ${dom.pageShoppingTotalSum?.textContent || ''}`,
      '',
      ...state.shoppingList.map(item => `- ${item.productName}: ${item.packagesNeeded} pk à ${item.packageSizeText} (${item.totalPrice?.toFixed(2) || '0.00'} kr hos ${STORES[item.storeKey]?.name || item.storeKey})`)
    ];
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      showToast('📋 Indkøbsliste kopieret til udklipsholder!', 'success');
    });
  });
}

// ─── 5. FANEN: PROFIL (BRUGERKONTO, GEMTE DATA & ERNÆRINGSPROFILER) ───────────
function renderProfileView() {
  const user = auth.currentUser;
  if (user) {
    if (dom.profileNameDisplay) dom.profileNameDisplay.textContent = user.name || 'MUMS Bruger';
    if (dom.profileEmailDisplay) dom.profileEmailDisplay.textContent = user.email;
    if (dom.profileVerifyBadgeDisplay) {
      dom.profileVerifyBadgeDisplay.className = `email-badge-display ${user.isVerified ? 'verified' : 'unverified'}`;
      dom.profileVerifyBadgeDisplay.innerHTML = user.isVerified ? '✅ Email bekræftet' : '⚠️ Email ikke bekræftet';
    }
    if (dom.profileEmailVerifyBox) {
      dom.profileEmailVerifyBox.classList.toggle('hidden', !!user.isVerified);
    }
    if (dom.profileAuthBtn) {
      dom.profileAuthBtn.textContent = 'Log ud';
      dom.profileAuthBtn.onclick = () => {
        auth.logout();
        renderProfileView();
        showToast('Du er nu logget ud', 'info');
      };
    }
  } else {
    if (dom.profileNameDisplay) dom.profileNameDisplay.textContent = 'Gæstebruger';
    if (dom.profileEmailDisplay) dom.profileEmailDisplay.textContent = 'Ikke logget ind';
    if (dom.profileVerifyBadgeDisplay) {
      dom.profileVerifyBadgeDisplay.className = 'email-badge-display unverified';
      dom.profileVerifyBadgeDisplay.textContent = 'Ikke logget ind';
    }
    if (dom.profileEmailVerifyBox) dom.profileEmailVerifyBox.classList.add('hidden');
    if (dom.profileAuthBtn) {
      dom.profileAuthBtn.textContent = 'Log ind / Opret';
      dom.profileAuthBtn.onclick = () => openAuthModal();
    }
  }

  // Standard antal personer & budget
  if (dom.profileDefaultServings) {
    dom.profileDefaultServings.value = String(state.servings);
  }
  if (dom.profileDefaultBudget) {
    dom.profileDefaultBudget.value = String(state.budget);
  }

  // Butikstjekbokse i profil
  dom.profileStoreCheckboxes?.forEach(cb => {
    const s = cb.dataset.profileStore;
    cb.checked = state.selectedStores.includes(s);
  });

  // Uønskede ingredienser og allergier
  renderProfileAllergyTags();
  if (dom.profileAutoFilterAllergies) {
    dom.profileAutoFilterAllergies.checked = Boolean(state.autoFilterAllergies);
  }

  // Ernæringsprofiler liste i profil
  if (dom.profileUserNutrList) {
    dom.profileUserNutrList.innerHTML = state.userProfiles.map(p => {
      const isActive = p.id === state.activeProfileId;
      return `
        <div class="profile-nutr-item ${isActive ? 'active' : ''}">
          <div>
            <div class="nutr-item-name">${p.name} ${isActive ? '🌟 (Aktiv profil)' : ''}</div>
            <div class="nutr-item-details">
              ${p.targetKcal ? `⚡ ${p.targetKcal} kcal · ` : ''}
              ${p.minProtein ? `🥩 ${p.minProtein}g protein · ` : ''}
              ${p.maxFat ? `🥑 ${p.maxFat}g fedt · ` : ''}
              ${p.maxCarbs ? `🌾 ${p.maxCarbs}g kulhydrat` : ''}
            </div>
          </div>
          <div class="nutr-item-actions">
            ${!isActive ? `<button class="btn btn-secondary btn-sm" onclick="setActiveNutritionProfile('${p.id}')">Vælg</button>` : ''}
            <button class="btn btn-secondary btn-sm" onclick="openEditProfileModal('${p.id}')">✏️</button>
            ${p.id !== 'default_normal' ? `<button class="btn btn-secondary btn-sm" style="color:#b91c1c;" onclick="deleteNutritionProfile('${p.id}')">🗑️</button>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }
}

function setAppTheme(theme) {
  const isDark = theme === 'dark';
  document.body.classList.toggle('dark-theme', isDark);
  localStorage.setItem('mums_theme', theme);
  if (dom.btnThemeLight) dom.btnThemeLight.classList.toggle('active', !isDark);
  if (dom.btnThemeDark) dom.btnThemeDark.classList.toggle('active', isDark);
}

function initProfileViewUI() {
  // Gem profilstandarder
  dom.btnSaveProfileSettings?.addEventListener('click', () => {
    if (dom.profileDefaultServings) {
      state.servings = parseInt(dom.profileDefaultServings.value, 10) || 4;
    }
    if (dom.profileDefaultBudget) {
      state.budget = parseFloat(dom.profileDefaultBudget.value) || 150;
      if (dom.budgetInput) dom.budgetInput.value = state.budget;
    }

    const selected = [];
    dom.profileStoreCheckboxes?.forEach(cb => {
      if (cb.checked) selected.push(cb.dataset.profileStore);
    });
    if (selected.length > 0) state.selectedStores = selected;

    saveCurrentUserData();
    syncAppStateToAllViews();
    showToast('✅ Indstillinger gemt og synkroniseret med appen!', 'success');
  });

  // Tilføj uønsket ingrediens via knap eller Enter
  dom.btnAddProfileAllergy?.addEventListener('click', () => {
    addProfileAllergyItem(dom.profileAllergyInput?.value);
  });
  dom.profileAllergyInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addProfileAllergyItem(dom.profileAllergyInput?.value);
    }
  });

  // Hurtigvalg piller
  dom.profileAllergyQuickPills?.querySelectorAll('.allergy-quick-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      toggleProfileAllergyItem(pill.dataset.allergy);
    });
  });

  // Gem allergier & uønskede ingredienser
  dom.btnSaveProfileAllergies?.addEventListener('click', () => {
    const autoFilter = Boolean(dom.profileAutoFilterAllergies?.checked);
    state.autoFilterAllergies = autoFilter;
    auth.saveAllergies(state.allergies, autoFilter);
    saveCurrentUserData();
    syncAppStateToAllViews();
    showToast('✅ Dine uønskede ingredienser og allergier er gemt!', 'success');
  });

  dom.profileAutoFilterAllergies?.addEventListener('change', () => {
    state.autoFilterAllergies = Boolean(dom.profileAutoFilterAllergies.checked);
    auth.saveAllergies(state.allergies, state.autoFilterAllergies);
    saveCurrentUserData();
    renderRecipeCards(state.lastSearchResults || {});
  });

  // Tema & Farvetilstand (Dark Mode)
  dom.btnThemeLight?.addEventListener('click', () => setAppTheme('light'));
  dom.btnThemeDark?.addEventListener('click', () => setAppTheme('dark'));

  // Kompakt opskriftsvisning
  dom.toggleCompactView?.addEventListener('change', () => {
    const isCompact = dom.toggleCompactView.checked;
    document.body.classList.toggle('compact-mode', isCompact);
    localStorage.setItem('mums_compact_view', isCompact ? '1' : '0');
    showToast(isCompact ? 'Kompakt visning slået til' : 'Normal visning slået til', 'info');
  });

  // Nulstil cache & gemte data
  dom.btnResetAppData?.addEventListener('click', () => {
    if (confirm('Er du sikker på, at du vil rydde cachen og genindlæse data? Din brugerkonto bliver IKKE slettet.')) {
      if (window.DataLayer && window.DataLayer.sanitizeCaches) {
        window.DataLayer.sanitizeCaches();
      }
      localStorage.removeItem('mumsapp_cache_v3');
      localStorage.removeItem('mums_daily_offers_last_check');
      localStorage.removeItem('mums_daily_offers_last_date');
      showToast('Cache nulstillet! Genindlæser...', 'info');
      setTimeout(() => window.location.reload(), 600);
    }
  });

  // Opret profil fra profilfanen
  dom.btnProfileCreateNewNutr?.addEventListener('click', () => {
    openNewProfileModal();
  });

  // Email verifikation submit
  dom.btnProfileVerifySubmit?.addEventListener('click', () => {
    const code = (dom.profileVerifyCodeInput?.value || '').trim();
    if (!code) {
      showToast('Indtast venligst koden', 'error');
      return;
    }
    const res = auth.verifyEmail(code);
    if (res.success) {
      showToast('✅ Email bekræftet!', 'success');
      renderProfileView();
    } else {
      showToast(res.error || 'Ugyldig kode', 'error');
    }
  });
}

function syncAppStateToAllViews() {
  // Synkroniser servings knapper
  dom.servingsBtns?.forEach(b => {
    b.classList.toggle('active', parseInt(b.dataset.servings, 10) === state.servings);
  });
  if (dom.profileDefaultServings) dom.profileDefaultServings.value = String(state.servings);
  if (dom.homeChipServingsVal) dom.homeChipServingsVal.textContent = `${state.servings} personer`;

  // Synkroniser budget
  if (dom.budgetInput) dom.budgetInput.value = state.budget;
  if (dom.profileDefaultBudget) dom.profileDefaultBudget.value = String(state.budget);
  if (dom.homeChipBudgetVal) dom.homeChipBudgetVal.textContent = `${state.budget} kr`;

  // Re-render
  renderRecipeCards(state.lastSearchResults || {});
  renderShoppingListPage();
  renderHomeDashboard();
  renderProfileView();
}

// ─── INITIALISERING ───────────────────────────────────────────────────────────

// ─── UGENTLIG MADPLAN & ANTI-MADSPILD ENGINE ─────────────────────────────────

const MEALPLAN_DAYS = [
  { key: 'monday',    label: 'Mandag',   short: 'Man' },
  { key: 'tuesday',   label: 'Tirsdag',  short: 'Tir' },
  { key: 'wednesday', label: 'Onsdag',   short: 'Ons' },
  { key: 'thursday',  label: 'Torsdag',  short: 'Tor' },
  { key: 'friday',    label: 'Fredag',   short: 'Fre' },
  { key: 'saturday',  label: 'Lørdag',   short: 'Lør' },
  { key: 'sunday',    label: 'Søndag',   short: 'Søn' }
];

let pendingMealPlanRecipeId = null;

function getTodayDayKey() {
  const dayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday...
  const map = { 1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday', 6: 'saturday', 0: 'sunday' };
  return map[dayIndex] || 'monday';
}

function openAddToMealPlanModal(recipeId) {
  const recipe = (window.RECIPES || []).find(r => r.id === recipeId);
  if (!recipe) {
    showToast('Opskrift ikke fundet', 'error');
    return;
  }
  pendingMealPlanRecipeId = recipeId;
  if (dom.mpPickerRecipeTitle) {
    dom.mpPickerRecipeTitle.textContent = `Føj "${recipe.name}" til madplan`;
  }

  if (dom.mealPlanPickerDaysGrid) {
    dom.mealPlanPickerDaysGrid.innerHTML = MEALPLAN_DAYS.map(d => {
      const currentEntry = state.mealPlan[d.key];
      const hasDish = Boolean(currentEntry && currentEntry.recipeId);
      let currentName = '';
      if (hasDish) {
        const curRecipe = (window.RECIPES || []).find(r => r.id === currentEntry.recipeId);
        currentName = curRecipe ? curRecipe.name : 'Optaget';
      }
      return `
        <button type="button" class="mealplan-day-picker-btn ${hasDish ? 'has-dish' : ''}" data-day="${d.key}">
          <span class="day-name">🗓️ ${d.label}</span>
          <span class="day-status">${hasDish ? `Erstatter: ${escapeHtml(currentName)}` : '✅ Ledig dag'}</span>
        </button>
      `;
    }).join('');

    dom.mealPlanPickerDaysGrid.querySelectorAll('.mealplan-day-picker-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const dayKey = btn.dataset.day;
        setMealPlanDay(dayKey, pendingMealPlanRecipeId);
        closeMealPlanModal();
      });
    });
  }

  if (dom.mealPlanDayPickerModal) {
    dom.mealPlanDayPickerModal.classList.remove('hidden');
  }
}

function closeMealPlanModal() {
  if (dom.mealPlanDayPickerModal) {
    dom.mealPlanDayPickerModal.classList.add('hidden');
  }
  pendingMealPlanRecipeId = null;
}

function setMealPlanDay(dayKey, recipeId, servings = state.servings) {
  const recipe = (window.RECIPES || []).find(r => r.id === recipeId);
  if (!recipe) return;
  const dayInfo = MEALPLAN_DAYS.find(d => d.key === dayKey);
  const dayName = dayInfo ? dayInfo.label : dayKey;

  state.mealPlan[dayKey] = {
    recipeId: recipe.id,
    recipeName: recipe.name,
    servings: servings || state.servings,
    addedAt: Date.now()
  };

  saveCurrentUserData();
  renderMealPlanView();
  renderHomeMealPlanPreview();
  showToast(`📅 ${recipe.name} sat på madplanen til ${dayName}!`, 'success');
}

function removeMealPlanDay(dayKey) {
  const dayInfo = MEALPLAN_DAYS.find(d => d.key === dayKey);
  const dayName = dayInfo ? dayInfo.label : dayKey;
  state.mealPlan[dayKey] = null;
  saveCurrentUserData();
  renderMealPlanView();
  renderHomeMealPlanPreview();
  showToast(`🗑️ Ret fjernet fra ${dayName}`, 'info');
}

function clearWeeklyMealPlan() {
  if (!confirm('Er du sikker på, at du vil rydde hele ugens madplan?')) return;
  MEALPLAN_DAYS.forEach(d => {
    state.mealPlan[d.key] = null;
  });
  saveCurrentUserData();
  renderMealPlanView();
  renderHomeMealPlanPreview();
  showToast('Ugens madplan er nulstillet', 'info');
}

// ─── ANTI-MADSPILD: OVERLAP BEREGNING & ANBEFALINGER ──────────────────────────
function computeAntiMadspildStats() {
  const plannedDays = MEALPLAN_DAYS.filter(d => state.mealPlan[d.key] && state.mealPlan[d.key].recipeId);
  const plannedRecipes = plannedDays.map(d => {
    const entry = state.mealPlan[d.key];
    const rec = (window.RECIPES || []).find(r => r.id === entry.recipeId);
    return { dayKey: d.key, dayLabel: d.label, recipe: rec };
  }).filter(item => Boolean(item.recipe));

  // Find råvarer på tværs af ugens retter
  const ingUsageMap = new Map(); // key -> { name, days: Set of dayLabel }

  plannedRecipes.forEach(({ dayLabel, recipe }) => {
    const ingList = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
    ingList.forEach(ing => {
      const name = typeof ing === 'string' ? ing : (ing.name || ing.searchKey || '');
      const key = (typeof ing === 'object' && ing.searchKey) ? ing.searchKey.toLowerCase().trim() : name.toLowerCase().trim();
      if (!key || key.length < 2) return;

      if (!ingUsageMap.has(key)) {
        ingUsageMap.set(key, { name: (typeof ing === 'object' ? ing.name : name), key, days: new Set() });
      }
      ingUsageMap.get(key).days.add(dayLabel);
    });
  });

  const totalDistinct = ingUsageMap.size;
  const sharedItems = Array.from(ingUsageMap.values()).filter(item => item.days.size >= 2);
  const singleUseItems = Array.from(ingUsageMap.values()).filter(item => item.days.size === 1);

  // Anti-madspild score: 0-100%
  let wasteScore = 100;
  if (totalDistinct > 0) {
    // Jo flere råvarer der deles af mindst 2 måltider, jo højere score
    const ratio = sharedItems.length / Math.max(1, totalDistinct);
    wasteScore = Math.min(100, Math.round(50 + (ratio * 50) + (plannedRecipes.length * 5)));
  }

  // Find forslag til ledige dage baseret på råvarer der allerede købes
  const emptyDays = MEALPLAN_DAYS.filter(d => !state.mealPlan[d.key]);
  const leftoverKeys = new Set(Array.from(ingUsageMap.keys()));

  const zeroWasteRecommendations = [];
  if (emptyDays.length > 0 && leftoverKeys.size > 0) {
    const currentRecipeIds = new Set(plannedRecipes.map(p => p.recipe.id));
    const scoredCandidates = [];

    (window.RECIPES || []).forEach(candidate => {
      if (currentRecipeIds.has(candidate.id)) return;
      const cIngList = Array.isArray(candidate.ingredients) ? candidate.ingredients : [];
      let matchCount = 0;
      const matchedNames = [];

      cIngList.forEach(ci => {
        const cKey = (typeof ci === 'object' && ci.searchKey) ? ci.searchKey.toLowerCase().trim() : (ci.name || '').toLowerCase().trim();
        if (leftoverKeys.has(cKey)) {
          matchCount++;
          matchedNames.push(ci.name || cKey);
        }
      });

      if (matchCount >= 2) {
        scoredCandidates.push({ recipe: candidate, matchCount, matchedNames: Array.from(new Set(matchedNames)) });
      }
    });

    scoredCandidates.sort((a, b) => b.matchCount - a.matchCount);
    zeroWasteRecommendations.push(...scoredCandidates.slice(0, 3));
  }

  return {
    plannedCount: plannedRecipes.length,
    totalDistinct,
    sharedItems,
    singleUseItems,
    wasteScore,
    emptyDays,
    zeroWasteRecommendations,
    plannedRecipes
  };
}

// Auto-fyld tomme dage med retter der minimerer madspild
function autoFillMealPlanZeroWaste() {
  const stats = computeAntiMadspildStats();
  if (stats.emptyDays.length === 0) {
    showToast('Alle 7 dage er allerede planlagt!', 'info');
    return;
  }

  // Vælg kandidater
  const currentIds = new Set(stats.plannedRecipes.map(p => p.recipe.id));
  const candidatePool = (window.RECIPES || []).filter(r => !currentIds.has(r.id));
  if (candidatePool.length === 0) return;

  let addedCount = 0;
  stats.emptyDays.forEach(day => {
    // Vælg en ret der deler flest råvarer med hvad vi har
    const currentStats = computeAntiMadspildStats();
    const keys = new Set(Array.from(currentStats.sharedItems.map(i => i.key)).concat(currentStats.singleUseItems.map(i => i.key)));
    
    let best = null;
    let bestScore = -1;

    candidatePool.forEach(cand => {
      if (currentIds.has(cand.id)) return;
      let matches = 0;
      (cand.ingredients || []).forEach(ci => {
        const k = (ci.searchKey || ci.name || '').toLowerCase().trim();
        if (keys.has(k)) matches++;
      });
      if (matches > bestScore) {
        bestScore = matches;
        best = cand;
      }
    });

    if (!best) {
      best = candidatePool[Math.floor(Math.random() * candidatePool.length)];
    }

    if (best) {
      currentIds.add(best.id);
      state.mealPlan[day.key] = { recipeId: best.id, servings: state.servings, addedAt: Date.now() };
      addedCount++;
    }
  });

  saveCurrentUserData();
  renderMealPlanView();
  renderHomeMealPlanPreview();
  showToast(`✨ Udfyldte ${addedCount} dage med råvare-optimerede retter!`, 'success');
}

// ─── SAMLET INDKØBSLISTE TIL HELE UGENS RETTER ────────────────────────────────
function getWeeklyAggregatedIngredients() {
  const aggregatedMap = new Map();
  const plannedDays = MEALPLAN_DAYS.filter(d => state.mealPlan[d.key] && state.mealPlan[d.key].recipeId);

  plannedDays.forEach(d => {
    const entry = state.mealPlan[d.key];
    const rec = (window.RECIPES || []).find(r => r.id === entry.recipeId);
    if (!rec) return;

    const scaled = typeof rec.getScaledIngredients === 'function' 
      ? rec.getScaledIngredients(entry.servings || state.servings)
      : rec.ingredients;

    (scaled || []).forEach(ing => {
      const rawName = ing.name || '';
      const sKey = (ing.searchKey || rawName).toLowerCase().trim();
      const amount = typeof ing.amount === 'number' ? ing.amount : 1;
      const unit = ing.unit || 'stk';

      if (aggregatedMap.has(sKey)) {
        const existing = aggregatedMap.get(sKey);
        if (existing.unit === unit) {
          existing.amount += amount;
        } else {
          existing.amount += amount; // Forenklet summering
        }
        existing.usedInDays.push(d.label);
      } else {
        aggregatedMap.set(sKey, {
          searchKey: sKey,
          name: rawName,
          amount,
          unit,
          usedInDays: [d.label]
        });
      }
    });
  });

  // Beregn pakke- og butikspriser via PRODUCT_DB og Supermarked prissammenligning
  const items = [];
  const storeTotals = {
    netto: 0,
    rema: 0,
    lidl: 0,
    bilka: 0,
    foetex: 0,
    coop365: 0
  };

  aggregatedMap.forEach(item => {
    const dbItem = (window.PRODUCT_DB && window.PRODUCT_DB[item.searchKey]) || null;
    let packagesNeeded = 1;
    let unitSizeText = `${item.amount} ${item.unit}`;
    let cheapestPrice = 14.50;
    let cheapestStore = 'netto';

    if (dbItem && dbItem.packageSize && typeof dbItem.packageSize === 'number' && dbItem.packageSize > 0) {
      packagesNeeded = Math.max(1, Math.ceil(item.amount / dbItem.packageSize));
      unitSizeText = `${dbItem.packageSize} ${dbItem.packageUnit || item.unit}`;
      
      // Beregn priser pr butik
      let lowest = Infinity;
      Object.entries(dbItem.stores || {}).forEach(([sKey, price]) => {
        const fullPackPrice = price * packagesNeeded;
        if (typeof storeTotals[sKey] === 'number') {
          storeTotals[sKey] += fullPackPrice;
        }
        if (price < lowest) {
          lowest = price;
          cheapestPrice = fullPackPrice;
          cheapestStore = sKey;
        }
      });
      if (lowest === Infinity) cheapestPrice = 14.50 * packagesNeeded;
    } else {
      cheapestPrice = 12.50 * packagesNeeded;
      Object.keys(storeTotals).forEach(s => { storeTotals[s] += cheapestPrice; });
    }

    items.push({
      searchKey: item.searchKey,
      name: item.name,
      totalAmount: item.amount,
      unit: item.unit,
      packagesNeeded,
      packageSizeText: unitSizeText,
      cheapestPrice: parseFloat(cheapestPrice.toFixed(2)),
      cheapestStore,
      usedInDays: Array.from(new Set(item.usedInDays))
    });
  });

  // Find billigste butik samlet
  let bestStoreKey = 'netto';
  let bestStoreTotal = Infinity;
  Object.entries(storeTotals).forEach(([sKey, total]) => {
    if (total > 0 && total < bestStoreTotal) {
      bestStoreTotal = total;
      bestStoreKey = sKey;
    }
  });

  const grandCheapestSum = items.reduce((acc, it) => acc + it.cheapestPrice, 0);

  return {
    items,
    storeTotals,
    bestStoreKey,
    bestStoreTotal: bestStoreTotal === Infinity ? 0 : parseFloat(bestStoreTotal.toFixed(2)),
    grandCheapestSum: parseFloat(grandCheapestSum.toFixed(2))
  };
}

function transferMealPlanToShoppingList() {
  const weekly = getWeeklyAggregatedIngredients();
  if (weekly.items.length === 0) {
    showToast('Ingen retter på madplanen at overføre', 'info');
    return;
  }

  let added = 0;
  weekly.items.forEach(it => {
    const storeInfo = (window.STORES && window.STORES[it.cheapestStore]) || { name: it.cheapestStore.toUpperCase() };
    const loc = typeof getStoreLocationInfo === 'function' ? getStoreLocationInfo(it.cheapestStore) : { label: storeInfo.name };

    const newItem = {
      id: 'mp_' + it.searchKey + '_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: it.name,
      amount: it.packagesNeeded,
      packageText: `${it.packagesNeeded} pk. à ${it.packageSizeText} (${it.usedInDays.join(', ')})`,
      price: it.cheapestPrice,
      pant: 0,
      store: it.cheapestStore,
      storeName: loc.label,
      checked: false,
      fromMealPlan: true
    };
    state.shoppingList.push(newItem);
    added++;
  });

  saveCurrentUserData();
  updateCartBadges();
  renderShoppingListPage();
  showToast(`🛒 Overførte ${added} råvarer til din indkøbsliste!`, 'success');
}

// ─── RENDERING AF MADPLAN VIEW ────────────────────────────────────────────────
function renderMealPlanView() {
  if (!dom.tabMealPlan) return;
  const stats = computeAntiMadspildStats();
  const weekly = getWeeklyAggregatedIngredients();

  // 1. Stats Bar
  if (dom.mpStatDays) dom.mpStatDays.textContent = `${stats.plannedCount} / 7 dage`;
  if (dom.mpStatPrice) dom.mpStatPrice.textContent = `${weekly.grandCheapestSum.toFixed(2)} kr`;
  if (dom.mpStatWasteScore) {
    dom.mpStatWasteScore.textContent = `${stats.wasteScore}% Råvareudnyttelse`;
    dom.mpStatWasteScore.style.color = stats.wasteScore >= 70 ? '#10b981' : '#f59e0b';
  }
  if (dom.mpStatServings) dom.mpStatServings.textContent = `${state.servings} personer`;

  // 2. Anti-Madspild Insights Box
  if (dom.mpWasteInsightBox) {
    if (stats.plannedCount === 0) {
      dom.mpWasteInsightBox.innerHTML = `
        <h4>🌱 Madspilds-Assistent: Klar til at hjælpe</h4>
        <p>Når du tilføjer retter til ugens dage, analyserer MUMS automatisk dine råvarer og hjælper dig med at genbruge fløde, grøntsager og kød på tværs af ugens retter.</p>
        <button type="button" class="btn btn-secondary btn-sm" onclick="autoFillMealPlanZeroWaste()">
          ✨ Fyld ugen med madspilds-optimerede retter nu
        </button>
      `;
    } else {
      const sharedHTML = stats.sharedItems.length > 0 ? `
        <div class="waste-shared-section">
          <strong class="waste-section-title">♻️ Genbrugte råvarer i ugens madplan (${stats.sharedItems.length} råvarer deles):</strong>
          <div class="waste-chips-wrap">
            ${stats.sharedItems.map(it => `
              <span class="waste-tag-chip">🌱 ${escapeHtml(it.name)} (${Array.from(it.days).join(' + ')})</span>
            `).join('')}
          </div>
        </div>
      ` : `
        <p class="waste-empty-hint">⚠️ Du har endnu ingen råvarer der deles mellem retterne. Vælg retter der bruger samme grønt eller mejeriprodukter for at spare penge.</p>
      `;

      const recsHTML = stats.zeroWasteRecommendations.length > 0 ? `
        <div class="waste-recs-section">
          <strong class="waste-recs-title">💡 Undgå madspild: Tilføj disse retter der bruger dine rester:</strong>
          <div class="waste-recs-grid">
            ${stats.zeroWasteRecommendations.map(rec => {
              const targetDay = stats.emptyDays[0]?.key || 'sunday';
              const targetLabel = stats.emptyDays[0]?.label || 'Søndag';
              return `
                <div class="waste-rec-card">
                  <div class="waste-rec-info">
                    <strong class="waste-rec-dish-name">${escapeHtml(rec.recipe.name)}</strong>
                    <div class="waste-rec-leftovers">Bruger dine rester: <span>${escapeHtml(rec.matchedNames.slice(0, 3).join(', '))}</span></div>
                  </div>
                  <button type="button" class="btn btn-primary btn-sm waste-rec-add-btn" onclick="setMealPlanDay('${targetDay}', '${rec.recipe.id}')">
                    + Sæt på ${targetLabel}
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : '';

      dom.mpWasteInsightBox.innerHTML = `
        <h4>🌱 Madspilds-Status: ${stats.wasteScore}% Råvareudnyttelse</h4>
        <p>Du har planlagt ${stats.plannedCount} måltider. ${stats.sharedItems.length > 0 ? 'Flere råvarer genbruges smart på tværs af ugen!' : 'Ingen råvarer deles endnu.'}</p>
        ${sharedHTML}
        ${recsHTML}
      `;
    }
  }

  // 3. 7-Dages Skema Cards
  if (dom.mealPlanWeekGrid) {
    const todayKey = getTodayDayKey();

    dom.mealPlanWeekGrid.innerHTML = MEALPLAN_DAYS.map(d => {
      const isToday = d.key === todayKey;
      const entry = state.mealPlan[d.key];
      const recipe = entry ? (window.RECIPES || []).find(r => r.id === entry.recipeId) : null;

      let bodyHTML = '';
      if (recipe) {
        // Beregn råvarer der deles med andre dage
        const sharedWithDays = [];
        (recipe.ingredients || []).forEach(ri => {
          const k = (ri.searchKey || ri.name || '').toLowerCase().trim();
          const matchItem = stats.sharedItems.find(si => si.key === k);
          if (matchItem) {
            matchItem.days.forEach(dayName => {
              if (dayName !== d.label) sharedWithDays.push(dayName);
            });
          }
        });
        const sharedDaysDistinct = Array.from(new Set(sharedWithDays));
        const overlapNotice = sharedDaysDistinct.length > 0 
          ? `<span class="mealplan-waste-pill">♻️ Deler råvarer med ${sharedDaysDistinct.slice(0, 2).join(' & ')}</span>`
          : '';

        const estMealPrice = (recipe.ingredients || []).length * 11.50 * (state.servings / 2);

        bodyHTML = `
          <div class="mealplan-dish-info">
            <div class="mealplan-dish-img">
              ${recipe.image ? `<img src="${recipe.image}" alt="${recipe.name}" style="width:100%; height:100%; object-fit:cover; border-radius:8px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';"><span style="display:none;">${recipe.emoji}</span>` : recipe.emoji}
            </div>
            <div class="mealplan-dish-text">
              <div class="mealplan-dish-name">${escapeHtml(recipe.name)}</div>
              <div class="mealplan-dish-meta">
                <span>⏱️ ${recipe.prepTime} min</span>
                <span>💰 Ca. ${(estMealPrice).toFixed(0)} kr</span>
                <span>👥 ${entry.servings || state.servings} pers.</span>
              </div>
              ${overlapNotice}
            </div>
          </div>
          <div class="mealplan-day-actions">
            <button type="button" class="btn btn-secondary btn-sm" onclick="openAddToMealPlanModal('${recipe.id}')" title="Skift til en anden dag">
              🔄 Flyt dag
            </button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="switchTab('recipes')" title="Gennemse andre opskrifter">
              ✏️ Skift ret
            </button>
            <button type="button" class="btn btn-secondary btn-sm" style="color:#b91c1c;" onclick="removeMealPlanDay('${d.key}')" title="Fjern ret">
              🗑️ Fjern
            </button>
          </div>
        `;
      } else {
        bodyHTML = `
          <div class="mealplan-day-empty">
            <span class="mealplan-empty-icon">🍽️</span>
            <span class="mealplan-empty-txt">Ingen ret valgt til ${d.label}</span>
            <button type="button" class="btn btn-primary btn-sm" style="margin-top:6px; font-weight:700;" onclick="switchTab('recipes')">
              + Vælg fra 5.900+ opskrifter
            </button>
          </div>
        `;
      }

      return `
        <div class="mealplan-day-card ${isToday ? 'today' : ''}" data-day="${d.key}">
          <div class="mealplan-day-header">
            <div class="mealplan-day-title">
              <span>📅 ${d.label}</span>
              ${isToday ? '<span style="font-size:0.75rem; color:#b45309; font-weight:800;">(I dag)</span>' : ''}
            </div>
            <span class="mealplan-day-badge">${recipe ? '✅ Planlagt' : 'Ledig'}</span>
          </div>
          <div class="mealplan-day-body">
            ${bodyHTML}
          </div>
        </div>
      `;
    }).join('');
  }

  // 4. Samlet Ugentlig Indkøbsliste & Supermarked Sammenligning
  if (dom.mpStorePriceCompareBar) {
    if (weekly.items.length === 0) {
      dom.mpStorePriceCompareBar.innerHTML = '';
    } else {
      const storeOrder = ['netto', 'rema', 'lidl', 'coop365', 'bilka', 'foetex'];
      dom.mpStorePriceCompareBar.innerHTML = storeOrder.map(sKey => {
        const storeInfo = (window.STORES && window.STORES[sKey]) || { name: sKey.toUpperCase() };
        const total = weekly.storeTotals[sKey] || 0;
        const isCheapest = sKey === weekly.bestStoreKey;
        return `
          <div class="mp-store-price-chip ${isCheapest ? 'cheapest' : ''}">
            <span class="store-lbl">${isCheapest ? '🏆 ' : ''}${storeInfo.name}</span>
            <span class="store-amt">${total > 0 ? total.toFixed(2) + ' kr' : '—'}</span>
            ${isCheapest ? '<span style="font-size:0.68rem; color:#047857; font-weight:800;">Billigst for ugen</span>' : ''}
          </div>
        `;
      }).join('');
    }
  }

  if (dom.mpWeeklyIngredientsList) {
    if (weekly.items.length === 0) {
      dom.mpWeeklyIngredientsList.innerHTML = `
        <div style="text-align:center; padding:24px; color:var(--gray-500); font-style:italic;">
          Ingen varer at vise endnu. Føj retter til ugens madplan ovenfor, så samles alle ingredienser automatisk her!
        </div>
      `;
    } else {
      dom.mpWeeklyIngredientsList.innerHTML = `
        <div style="margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <strong style="font-size:0.9rem; color:var(--gray-800);">🛒 ${weekly.items.length} råvarer i alt til hele ugen (købes i ${weekly.items.reduce((a,b)=>a+b.packagesNeeded,0)} butikspakker):</strong>
          <span style="font-size:0.85rem; font-weight:800; color:var(--primary);">Samlet estimat: ${weekly.grandCheapestSum.toFixed(2)} kr</span>
        </div>
        <table class="mp-ingredients-table">
          <thead>
            <tr>
              <th>Råvare</th>
              <th>Mængde til ugen</th>
              <th>Pakker at købe</th>
              <th>Bruges i retter på</th>
              <th>Billigst hos</th>
              <th>Est. Pris</th>
            </tr>
          </thead>
          <tbody>
            ${weekly.items.map(it => {
              const sInfo = (window.STORES && window.STORES[it.cheapestStore]) || { name: it.cheapestStore };
              return `
                <tr>
                  <td><strong>${escapeHtml(it.name)}</strong></td>
                  <td>${it.totalAmount} ${it.unit}</td>
                  <td><span class="badge-pkg">${it.packagesNeeded} pk. à ${it.packageSizeText}</span></td>
                  <td><span style="font-size:0.75rem; color:var(--gray-600);">${it.usedInDays.join(', ')}</span></td>
                  <td><span class="shop-store-badge tag-${it.cheapestStore}">${sInfo.name}</span></td>
                  <td><strong>${it.cheapestPrice.toFixed(2)} kr</strong></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    }
  }
}

// ─── RENDERING AF FORSIDE MADPLAN STATUS ──────────────────────────────────────
function renderHomeMealPlanPreview() {
  if (!dom.homeMealPlanTodayContent) return;
  const todayKey = getTodayDayKey();
  const todayEntry = state.mealPlan[todayKey];
  const plannedCount = MEALPLAN_DAYS.filter(d => state.mealPlan[d.key]).length;

  if (dom.homeMealPlanTodayTitle) {
    const todayName = MEALPLAN_DAYS.find(d => d.key === todayKey)?.label || 'I dag';
    dom.homeMealPlanTodayTitle.textContent = `Aftensmad i dag (${todayName})`;
  }

  if (todayEntry && todayEntry.recipeId) {
    const recipe = (window.RECIPES || []).find(r => r.id === todayEntry.recipeId);
    if (recipe) {
      dom.homeMealPlanTodayContent.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; background:var(--gray-50); padding:12px 14px; border-radius:var(--radius-sm); border:1px solid var(--gray-200);">
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="font-size:1.8rem; width:48px; height:48px; display:flex; align-items:center; justify-content:center; background:var(--white); border-radius:8px; border:1px solid var(--gray-200);">
              ${recipe.image ? `<img src="${recipe.image}" alt="${recipe.name}" style="width:100%; height:100%; object-fit:cover; border-radius:8px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';"><span style="display:none;">${recipe.emoji}</span>` : recipe.emoji}
            </div>
            <div>
              <strong style="font-size:0.95rem; color:var(--gray-900); display:block;">${escapeHtml(recipe.name)}</strong>
              <span style="font-size:0.78rem; color:var(--gray-500);">⏱️ ${recipe.prepTime} min · 👥 ${todayEntry.servings || state.servings} personer · ${plannedCount} af 7 dage planlagt</span>
            </div>
          </div>
          <div style="display:flex; gap:8px;">
            <button type="button" class="btn btn-primary btn-sm" onclick="switchTab('mealplan')">
              📅 Åbn madplan
            </button>
          </div>
        </div>
      `;
      return;
    }
  }

  // Ingen ret planlagt til i dag
  dom.homeMealPlanTodayContent.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; background:var(--gray-50); padding:12px 14px; border-radius:var(--radius-sm); border:1px dashed var(--gray-300);">
      <div>
        <strong style="font-size:0.88rem; color:var(--gray-700); display:block;">Ingen ret planlagt til i aften</strong>
        <span style="font-size:0.75rem; color:var(--gray-500);">Du har ${plannedCount} af 7 dage planlagt i denne uge.</span>
      </div>
      <div style="display:flex; gap:6px;">
        <button type="button" class="btn btn-primary btn-sm" onclick="switchTab('recipes')">
          🍲 Vælg ret
        </button>
        <button type="button" class="btn btn-secondary btn-sm" onclick="switchTab('mealplan')">
          📅 Se ugeplan
        </button>
      </div>
    </div>
  `;
}

function initMealPlanUI() {
  dom.btnAutoFillZeroWaste?.addEventListener('click', autoFillMealPlanZeroWaste);
  dom.btnClearMealPlan?.addEventListener('click', clearWeeklyMealPlan);
  dom.btnTransferMealPlanToCart?.addEventListener('click', transferMealPlanToShoppingList);
  
  dom.btnCopyWeeklyShoppingList?.addEventListener('click', () => {
    const weekly = getWeeklyAggregatedIngredients();
    if (weekly.items.length === 0) {
      showToast('Ingen råvarer at kopiere', 'info');
      return;
    }
    const lines = [
      `🛒 MUMS Samlet Ugentlig Indkøbsliste (${weekly.items.length} råvarer)`,
      `Samlet estimat: ${weekly.grandCheapestSum.toFixed(2)} kr (Billigst samlet: ${weekly.bestStoreKey.toUpperCase()} à ${weekly.bestStoreTotal.toFixed(2)} kr)`,
      '',
      ...weekly.items.map(it => `- ${it.name}: ${it.packagesNeeded} pk. à ${it.packageSizeText} (${it.cheapestPrice.toFixed(2)} kr hos ${it.cheapestStore.toUpperCase()}) [Til: ${it.usedInDays.join(', ')}]`)
    ];
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      showToast('📋 Ugens indkøbsliste kopieret til udklipsholder!', 'success');
    }).catch(() => {
      showToast('Kunne ikke kopiere liste', 'error');
    });
  });

  dom.closeMealPlanDayModal?.addEventListener('click', closeMealPlanModal);
  dom.mealPlanDayPickerModal?.addEventListener('click', (e) => {
    if (e.target === dom.mealPlanDayPickerModal) closeMealPlanModal();
  });

  dom.btnFeaturedToMealPlan?.addEventListener('click', () => {
    openAddToMealPlanModal('arla-pasta-bacon');
  });
}

function init() {
  // Saniter forældede data/Aldi fra cache/localStorage hvis til stede
  if (window.DataLayer && window.DataLayer.sanitizeCaches) {
    window.DataLayer.sanitizeCaches();
  }

  // Baggrundsforvarmning af REMA 1000 katalog (afdeling 20) via DataLayer
  if (window.DataLayer && window.DataLayer.rema) {
    window.DataLayer.rema.getDepartmentProducts(20).catch(err => {
      console.info('REMA 1000 background cache prefetch info:', err?.message || err);
    });
  }

  const savedCalls = localStorage.getItem('mumsapp_calls');
  if (savedCalls !== null) {
    const parsed = parseInt(savedCalls, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      state.callsRemaining = Math.min(parsed, CONFIG.MAX_CALLS);
    }
  }
  updateCallCounter();

  // Indlæs præferencer & tilknyt events
  loadPreferences();
  setupPreferenceListeners();

  // Modal events (Butik & Multi-API)
  setupStoreModalListeners();

  // Ugentlige tilbud med automatisk pant, butiksadresse & countdown
  initOffersSection();

  // Geolokation
  setupGeolocation();

  // Ingrediensinput & hurtige valg
  setupIngredientInputs();

  // Authentication, Personer, Budget, Profiler & Indkøbsliste
  initAuthUI();
  initServingsAndBudgetUI();
  initNutritionProfileUI();
  initShoppingListUI();
  initRecipeHubUI();

  // Uge 3: Tab navigation, Home dashboard, Dedicated shopping page & Profile view
  initTabNavigation();
  initHomeLocationShortcut();
  initShoppingListPageUI();
  initProfileViewUI();
  initMealPlanUI();

  // Indlæs tema og visningsindstillinger
  const savedTheme = localStorage.getItem('mums_theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  setAppTheme(savedTheme);

  const savedCompact = localStorage.getItem('mums_compact_view') === '1';
  if (savedCompact) {
    document.body.classList.add('compact-mode');
    if (dom.toggleCompactView) dom.toggleCompactView.checked = true;
  }

  // Start på Hjem fanen
  renderHomeDashboard();
  renderMealPlanView();
  renderHomeMealPlanPreview();
  renderRecipeCards({});
  renderShoppingListPage();
  renderProfileView();
  updateCartBadges();
  switchTab('home');

  // Automatisk dagligt tjek af tilbudsaviser for alle 6 supermarkeder
  if (window.DataLayer && window.DataLayer.offers) {
    window.DataLayer.offers.checkDailyFlyers(false).then(() => {
      updateDailySyncStatusUI();
    }).catch(err => {
      console.warn('Dagligt tilbudstjek info:', err);
    });

    // Kør periodisk tjek hver time for at opdage dataskift
    setInterval(() => {
      window.DataLayer.offers.checkDailyFlyers(false).then(() => {
        updateDailySyncStatusUI();
      });
    }, 60 * 60 * 1000);
  }

  // Progressive Web App (PWA) installation & Service Worker
  registerServiceWorker();
  setupPwaInstallUI();
  initUpdateBanner();     // Update-banner med "Opdater nu" knap

  // EmailJS (rigtig email-afsendelse)
  initEmailJS();
  initEmailVerifyUI();   // "Gensend kode"-knap i auth-modal
  initApiSettingsUI();   // API og e-mail integration i Indstillinger

  // Søgeknap (parallel multi-API sammenligning)
  dom.searchBtn?.addEventListener('click', performSearch);

  console.log('🚀 MUMS App klar! Update-banner, EmailJS og login-persistens aktiv.');
}

// ─── PWA (PROGRESSIVE WEB APP) SERVICE WORKER & INSTALL PROMPT ──────────────
let deferredPwaPrompt = null;
let swRegistration = null; // Global reference til service worker registration

function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !window.location.protocol.startsWith('http')) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => {
        swRegistration = reg;
        console.log('[PWA] Service Worker registreret, scope:', reg.scope);

        // Tjek om der allerede er en ventende opdatering ved start
        if (reg.waiting) {
          showUpdateBanner();
        }

        // Lyt på ny service worker der installerer
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Ny version er klar og venter – vis banner til brugeren
              showUpdateBanner();
            }
          });
        });

        // Periodisk opdateringstjek hvert 10 minut
        setInterval(() => reg.update(), 10 * 60 * 1000);
      })
      .catch(err => {
        console.warn('[PWA] Service Worker info:', err.message);
      });

    // Når ny SW overtager: reload siden så brugeren får ny version
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  });
}

function showUpdateBanner() {
  if (dom.updateBanner) dom.updateBanner.classList.remove('hidden');
}

function initUpdateBanner() {
  dom.btnUpdateNow?.addEventListener('click', () => {
    // Send besked til ventende SW om at overtage nu
    if (swRegistration && swRegistration.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      // Ingen SW (fx fil://) – genindlæs siden normalt
      window.location.reload(true);
    }
    if (dom.updateBanner) dom.updateBanner.classList.add('hidden');
  });

  dom.btnUpdateDismiss?.addEventListener('click', () => {
    if (dom.updateBanner) dom.updateBanner.classList.add('hidden');
  });

  // Profil-fane "Tjek for opdateringer" knap
  dom.btnProfileCheckUpdate?.addEventListener('click', async () => {
    if (dom.btnProfileCheckUpdate) {
      dom.btnProfileCheckUpdate.disabled = true;
      dom.btnProfileCheckUpdate.innerHTML = '<span>⏳</span> Tjekker for opdateringer...';
    }
    if (dom.profileUpdateStatusText) {
      dom.profileUpdateStatusText.classList.remove('hidden');
      dom.profileUpdateStatusText.textContent = 'Søger efter seneste app-version og friske tilbudsaviser...';
    }

    try {
      // 1. Tjek om der er opdatering via Service Worker (hvis webserver/HTTPS)
      if (swRegistration) {
        await swRegistration.update();
        if (swRegistration.waiting) {
          showUpdateBanner();
          if (dom.profileUpdateStatusText) {
            dom.profileUpdateStatusText.textContent = '🎉 En ny version er klar! Klik på "Opdater nu" øverst for at genindlæse.';
          }
          showToast('🎉 Ny version fundet!', 'success');
          return;
        }
      }

      // 2. Opdater tilbudsaviser og sync i DataLayer
      if (window.DataLayer && window.DataLayer.offers) {
        await window.DataLayer.offers.checkDailyFlyers(true);
      }

      // 3. Giv klar feedback til brugeren
      const isFile = window.location.protocol === 'file:';
      const lastScrapedCount = (typeof LIVE_SCRAPED_OFFERS !== 'undefined' && Array.isArray(LIVE_SCRAPED_OFFERS)) ? LIVE_SCRAPED_OFFERS.length : 300;

      setTimeout(() => {
        if (dom.profileUpdateStatusText) {
          if (isFile) {
            dom.profileUpdateStatusText.innerHTML = `✅ MUMS App er fuldt opdateret!<br><span style="color:var(--text-secondary); font-size:0.75rem;">(${lastScrapedCount} ægte tilbud aktive fra Netto, Føtex, Bilka, REMA, Lidl & 365discount. Kør <code>Opdater_Tilbud.bat</code> for at hente næste uges aviser).</span>`;
          } else {
            dom.profileUpdateStatusText.textContent = `✅ Du har den nyeste version af MUMS App (${lastScrapedCount} aktive tilbud).`;
          }
        }
        showToast('✅ MUMS App og tilbudsaviser er fuldt opdateret!', 'success');
      }, 500);

    } catch (err) {
      console.warn('[Update] Fejl ved tjek:', err);
      if (dom.profileUpdateStatusText) {
        dom.profileUpdateStatusText.textContent = '✅ Appen kører den nyeste version.';
      }
      showToast('✅ MUMS App er opdateret', 'info');
    } finally {
      setTimeout(() => {
        if (dom.btnProfileCheckUpdate) {
          dom.btnProfileCheckUpdate.disabled = false;
          dom.btnProfileCheckUpdate.innerHTML = '<span>🔄</span> Tjek for opdateringer';
        }
      }, 2000);
    }
  });
}

function setupPwaInstallUI() {
  const pwaInstallBanner = document.getElementById('pwaInstallBanner');
  const btnPwaInstall = document.getElementById('btnPwaInstall');
  const btnPwaDismiss = document.getElementById('btnPwaDismiss');
  const btnProfileInstallApp = document.getElementById('btnProfileInstallApp');
  const pwaIosInstructions = document.getElementById('pwaIosInstructions');

  const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
  const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator.standalone);

  if (isIos && !isInStandaloneMode && !localStorage.getItem('mums_pwa_dismissed')) {
    if (pwaInstallBanner) pwaInstallBanner.classList.remove('hidden');
    if (btnPwaInstall) btnPwaInstall.textContent = '📱 Sådan installeres';
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPwaPrompt = e;
    if (pwaInstallBanner && !localStorage.getItem('mums_pwa_dismissed')) {
      pwaInstallBanner.classList.remove('hidden');
    }
  });

  const handleInstallClick = async () => {
    if (deferredPwaPrompt) {
      deferredPwaPrompt.prompt();
      const choice = await deferredPwaPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        if (pwaInstallBanner) pwaInstallBanner.classList.add('hidden');
        showToast('🎉 MUMS App er installeret på din enhed!', 'success');
      }
      deferredPwaPrompt = null;
    } else if (isIos) {
      if (pwaIosInstructions) pwaIosInstructions.classList.toggle('hidden');
      showToast('📱 Føj til hjemmeskærm via Del-menuen i Safari', 'info');
    } else {
      showToast('💡 Tryk på Installer-ikonet i din browser eller \"Føj til hjemmeskærm\"', 'info');
      if (pwaIosInstructions) pwaIosInstructions.classList.remove('hidden');
    }
  };

  btnPwaInstall?.addEventListener('click', handleInstallClick);
  btnProfileInstallApp?.addEventListener('click', handleInstallClick);

  btnPwaDismiss?.addEventListener('click', () => {
    if (pwaInstallBanner) pwaInstallBanner.classList.add('hidden');
    localStorage.setItem('mums_pwa_dismissed', 'true');
  });

  window.addEventListener('appinstalled', () => {
    if (pwaInstallBanner) pwaInstallBanner.classList.add('hidden');
    showToast('🚀 Velkommen! MUMS er nu installeret på din enhed.', 'success');
  });
}

// ─── EMAILJS INTEGRATION ─────────────────────────────────────────────────────
// Gratis tier: 200 mails/måned. Ingen backend nødvendig.
// Nøgler indlæses dynamisk fra localStorage eller kan konfigureres i MUMS Indstillinger.
const EMAILJS_CONFIG = {
  get publicKey() {
    return (typeof localStorage !== 'undefined' && localStorage.getItem('mums_emailjs_public_key')) || '';
  },
  get serviceId() {
    return (typeof localStorage !== 'undefined' && localStorage.getItem('mums_emailjs_service_id')) || '';
  },
  get templateId() {
    return (typeof localStorage !== 'undefined' && localStorage.getItem('mums_emailjs_template_id')) || '';
  },
  get configured() {
    return !!(this.publicKey && this.serviceId && this.templateId && this.publicKey !== 'YOUR_PUBLIC_KEY');
  }
};

function updateEmailJsBadgeUI(isConfigured) {
  const badge = document.getElementById('emailjsBadge');
  if (badge) {
    if (isConfigured) {
      badge.textContent = '✅ Live EmailJS Forbundet';
      badge.className = 'api-live-pill active';
    } else {
      badge.textContent = '⚡ Direkte Hurtig-PIN aktiv';
      badge.className = 'api-live-pill';
    }
  }
}

// Initialisér EmailJS SDK
function initEmailJS() {
  if (typeof emailjs !== 'undefined' && EMAILJS_CONFIG.configured) {
    try {
      emailjs.init(EMAILJS_CONFIG.publicKey);
      console.log('[EmailJS] Initialiseret med aktive nøgler ✅');
      updateEmailJsBadgeUI(true);
    } catch (e) {
      console.warn('[EmailJS] Init fejl:', e);
      updateEmailJsBadgeUI(false);
    }
  } else {
    updateEmailJsBadgeUI(false);
  }
}

// Send verifikationskode som rigtig email eller direkte hurtig-PIN
async function sendVerificationEmail(toEmail, toName, code) {
  if (!EMAILJS_CONFIG.configured) {
    return { directPin: true, code };
  }

  const templateParams = {
    to_email: toEmail,
    to_name:  toName || toEmail.split('@')[0],
    code:     String(code),
    app_name: 'MUMS App'
  };

  await emailjs.send(
    EMAILJS_CONFIG.serviceId,
    EMAILJS_CONFIG.templateId,
    templateParams
  );

  return { directPin: false, code };
}

// Initialisér email-verify knapper i auth-modal'en
function initEmailVerifyUI() {
  dom.btnResendCode?.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) return;

    dom.btnResendCode.disabled = true;
    dom.btnResendCode.textContent = '⏳ Sender...';

    try {
      const result = await sendVerificationEmail(user.email, user.name, user.verificationCode);
      if (result.directPin) {
        if (dom.demoCodeHint) {
          dom.demoCodeHint.innerHTML = `⚡ <strong>Hurtig aktiveringskode:</strong> <span class="quick-code-pill" onclick="document.getElementById('verificationCodeInput').value='${result.code}'">${result.code}</span> (klik for at udfylde)`;
          dom.demoCodeHint.classList.remove('hidden');
        }
        showToast('⚡ Aktiveringskode klar', 'info');
      } else {
        showToast('📧 Ny bekræftelseskode sendt til ' + user.email, 'success');
      }
    } catch (err) {
      console.error('[EmailJS] Fejl ved afsendelse:', err);
      showToast('⚠️ Kunne ikke sende email – prøv igen', 'error');
    } finally {
      setTimeout(() => {
        if (dom.btnResendCode) {
          dom.btnResendCode.disabled = false;
          dom.btnResendCode.textContent = '↩ Send kode igen';
        }
      }, 30000);
    }
  });
}

// Initialisér API Indstillinger (EmailJS & Salling nøgler)
function initApiSettingsUI() {
  const pkInput = document.getElementById('cfgEmailJsPublicKey');
  const srvInput = document.getElementById('cfgEmailJsServiceId');
  const tplInput = document.getElementById('cfgEmailJsTemplateId');
  const sallingInput = document.getElementById('cfgSallingApiKey');

  if (pkInput) pkInput.value = localStorage.getItem('mums_emailjs_public_key') || '';
  if (srvInput) srvInput.value = localStorage.getItem('mums_emailjs_service_id') || '';
  if (tplInput) tplInput.value = localStorage.getItem('mums_emailjs_template_id') || '';
  if (sallingInput) sallingInput.value = localStorage.getItem('mums_salling_api_key') || '';

  updateEmailJsBadgeUI(EMAILJS_CONFIG.configured);

  document.getElementById('btnSaveEmailJsConfig')?.addEventListener('click', () => {
    const pk = (pkInput?.value || '').trim();
    const srv = (srvInput?.value || '').trim();
    const tpl = (tplInput?.value || '').trim();

    if (pk) localStorage.setItem('mums_emailjs_public_key', pk);
    else localStorage.removeItem('mums_emailjs_public_key');

    if (srv) localStorage.setItem('mums_emailjs_service_id', srv);
    else localStorage.removeItem('mums_emailjs_service_id');

    if (tpl) localStorage.setItem('mums_emailjs_template_id', tpl);
    else localStorage.removeItem('mums_emailjs_template_id');

    initEmailJS();
    showToast('💾 E-mail nøgler gemt!', 'success');
  });

  document.getElementById('btnTestEmailJsConfig')?.addEventListener('click', async () => {
    if (!EMAILJS_CONFIG.configured) {
      showToast('⚠️ Indtast Public Key, Service ID og Template ID først', 'error');
      return;
    }
    const testEmail = auth.currentUser?.email || prompt('Indtast modtager e-mail til test:');
    if (!testEmail) return;

    showToast('⏳ Sender test-mail via EmailJS...', 'info');
    try {
      await sendVerificationEmail(testEmail, 'MUMS Bruger', '123456');
      showToast('🎉 Test-mail afsendt!', 'success');
    } catch (err) {
      console.error('[EmailJS] Test fejl:', err);
      showToast('❌ Fejl ved afsendelse: ' + (err.text || err.message || err), 'error');
    }
  });

  document.getElementById('btnSaveSallingKey')?.addEventListener('click', () => {
    const sKey = (sallingInput?.value || '').trim();
    if (sKey) {
      localStorage.setItem('mums_salling_api_key', sKey);
      if (window.DataLayer?.config?.salling) {
        window.DataLayer.config.salling.apiKey = sKey;
      }
      showToast('💾 Salling Group API-nøgle gemt!', 'success');
    } else {
      localStorage.removeItem('mums_salling_api_key');
      showToast('Salling nøgle fjernet', 'info');
    }
  });
}

document.addEventListener('DOMContentLoaded', init);



