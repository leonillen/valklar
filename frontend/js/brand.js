const DEFAULT_CUSTOMER_CONFIG = {
  brand: {
    productName: 'Valkompass',
    electionLabel: 'Valkompass 2026',
    partnerLabel: 'Oberoende · Opartisk',
    marketLabel: 'Sverige · Riksdagsvalet',
    logoInitials: 'VK',
    logoUrl: ''
  },
  theme: {
    accent: '#2F3440',
    accentHover: '#1F2430',
    background: '#F6F8FB',
    surface: '#FFFFFF',
    elevated: '#EDF0F6',
    text: '#16150F',
    muted: '#6B6860',
    redBloc: '#D83B36',
    blueBloc: '#3C4E82'
  },
  landing: {
    titleLine1: 'Hitta ditt parti.',
    titleLine2Prefix: 'På',
    titleLine2Strong: 'riktigt.',
    subtitle: 'Inte ytliga frågor. Inte vaga matchningar. En kompass som förstår hur du tänker och förklarar varför du matchar med just det partiet.',
    primaryCta: 'Starta testet',
    ctaNote: '~10 minuter · 30 frågor · Gratis',
    leftBlocLabel: 'Rödgröna blocket',
    rightBlocLabel: 'Högerblocket',
    fallbackCompletions: '1 200+'
  },
  quiz: {
    homeLabel: 'Valkompass',
    loadingText: 'Laddar frågor...',
    loadingError: 'Kunde inte ladda frågor. Kontrollera att servern körs.',
    calculatingText: 'Beräknar din matchning...'
  },
  results: {
    shareTitle: 'Dela resultatet',
    imageButton: 'Bild',
    copiedText: 'Länk kopierad',
    restartCopy: 'Vill du testa igen med andra frågor?',
    restartCta: 'Gör testet igen',
    socialCardKicker: 'Mitt resultat i Valkompass 2026',
    leadKicker: 'Valguiden 2026',
    leadTitle: 'Vill du få bättre koll inför valet?',
    leadCopy: 'Få valguiden, uppdateringar i frågor du bryr dig om och smarta genomgångar direkt i din inkorg.',
    leadButton: 'Följ valet',
    leadConsent: 'Jag samtycker till att få e-post om valet och kan avregistrera mig när som helst.'
  }
};

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function deepMerge(base, override) {
  const output = { ...base };
  Object.entries(override || {}).forEach(([key, value]) => {
    output[key] = isPlainObject(value) && isPlainObject(base[key])
      ? deepMerge(base[key], value)
      : value;
  });
  return output;
}

function getConfigValue(config, path) {
  return path.split('.').reduce((value, key) => (
    value && value[key] !== undefined ? value[key] : undefined
  ), config);
}

function setText(selector, value) {
  if (typeof value !== 'string') return;
  document.querySelectorAll(selector).forEach(el => { el.textContent = value; });
}

function setAttr(selector, attr, value) {
  if (typeof value !== 'string') return;
  document.querySelectorAll(selector).forEach(el => el.setAttribute(attr, value));
}

function applyTheme(theme) {
  const root = document.documentElement;
  const map = {
    accent: '--accent',
    accentHover: '--accent-hover',
    background: '--bg',
    surface: '--bg-card',
    elevated: '--bg-elevated',
    text: '--text',
    muted: '--text-muted',
    redBloc: '--red-bloc',
    blueBloc: '--blue-bloc',
    partyS: '--party-s',
    partyM: '--party-m'
  };

  Object.entries(map).forEach(([key, cssVar]) => {
    if (typeof theme[key] === 'string' && theme[key].trim()) {
      root.style.setProperty(cssVar, theme[key]);
    }
  });
}

function applyConfig(config) {
  applyTheme(config.theme || {});

  setText('[data-brand-text="brand.productName"]', config.brand.productName);
  setText('[data-brand-text="brand.electionLabel"]', config.brand.electionLabel);
  setText('[data-brand-text="brand.partnerLabel"]', config.brand.partnerLabel);
  setText('[data-brand-text="brand.marketLabel"]', config.brand.marketLabel);
  setText('[data-brand-text="landing.titleLine1"]', config.landing.titleLine1);
  setText('[data-brand-text="landing.titleLine2Prefix"]', config.landing.titleLine2Prefix);
  setText('[data-brand-text="landing.titleLine2Strong"]', config.landing.titleLine2Strong);
  setText('[data-brand-text="landing.subtitle"]', config.landing.subtitle);
  setText('[data-brand-text="landing.primaryCta"]', config.landing.primaryCta);
  setText('[data-brand-text="landing.ctaNote"]', config.landing.ctaNote);
  setText('[data-brand-text="landing.leftBlocLabel"]', config.landing.leftBlocLabel);
  setText('[data-brand-text="landing.rightBlocLabel"]', config.landing.rightBlocLabel);
  setText('[data-brand-text="quiz.homeLabel"]', config.quiz.homeLabel);
  setText('[data-brand-text="quiz.loadingText"]', config.quiz.loadingText);
  setText('[data-brand-text="results.shareTitle"]', config.results.shareTitle);
  setText('[data-brand-text="results.imageButton"]', config.results.imageButton);
  setText('[data-brand-text="results.restartCopy"]', config.results.restartCopy);
  setText('[data-brand-text="results.restartCta"]', config.results.restartCta);
  setText('[data-brand-text="results.leadKicker"]', config.results.leadKicker);
  setText('[data-brand-text="results.leadTitle"]', config.results.leadTitle);
  setText('[data-brand-text="results.leadCopy"]', config.results.leadCopy);
  setText('[data-brand-text="results.leadButton"]', config.results.leadButton);
  setText('[data-brand-text="results.leadConsent"]', config.results.leadConsent);

  if (typeof config.brand.logoUrl === 'string' && config.brand.logoUrl.trim()) {
    document.querySelectorAll('.nav-logo-dot').forEach(el => {
      el.classList.add('nav-logo-image');
      el.replaceChildren();
      const img = document.createElement('img');
      img.src = config.brand.logoUrl;
      img.alt = '';
      el.appendChild(img);
    });
  }

  setAttr('meta[name="description"], [data-brand-title="landing"]', 'content', `${config.brand.electionLabel} - ${config.landing.subtitle}`);
  document.title = document.title.replace(/Valkompass 2026|Valkompass/g, config.brand.electionLabel);
}

async function loadCustomerConfig() {
  try {
    const res = await fetch('customer.config.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Config saknas');
    return deepMerge(DEFAULT_CUSTOMER_CONFIG, await res.json());
  } catch (e) {
    return DEFAULT_CUSTOMER_CONFIG;
  }
}

window.Brand = {
  config: DEFAULT_CUSTOMER_CONFIG,
  ready: loadCustomerConfig().then(config => {
    window.Brand.config = config;
    applyConfig(config);
    window.dispatchEvent(new CustomEvent('brand:ready', { detail: config }));
    return config;
  }),
  get(path, fallback) {
    const value = getConfigValue(window.Brand.config, path);
    return value === undefined ? fallback : value;
  }
};
