/* ============================================================
   EcoTrace — app.js
   Full Application Logic
   ============================================================ */

'use strict';

// ─── State ───────────────────────────────────────────────────
const S = {
  onboarded: false,
  profile: {},
  baseline: 0,
  streak: 0,
  totalSaved: 0,
  totalActions: 0,
  ecoPoints: 0,
  loggedToday: new Set(),
  weeklyData: [0, 0, 0, 0, 0, 0, 0],
  joinedChallenges: new Set(),
  categories: { diet: 30, transport: 35, energy: 20, shopping: 10, other: 5 },
};

// ─── Data ────────────────────────────────────────────────────
const ACTIONS = [
  { id: 'meatless',   emoji: '🥗', name: 'Meatless Meal',   desc: 'Skip meat for one meal today',               co2: 2.5, pts: 25 },
  { id: 'shower',     emoji: '🚿', name: 'Short Shower',    desc: '2-min shorter shower saves energy',           co2: 0.5, pts: 10 },
  { id: 'nopurchase', emoji: '🛒', name: 'No Impulse Buy',  desc: 'Skipped one unnecessary purchase',            co2: 8.0, pts: 40 },
  { id: 'walk',       emoji: '🚶', name: 'Active Commute',  desc: 'Walk or bike instead of driving',             co2: 2.4, pts: 30 },
  { id: 'thermo',     emoji: '🌡️', name: 'Thermostat Down', desc: 'Lowered heating or cooling by 1°',            co2: 1.0, pts: 15 },
  { id: 'zerowaste',  emoji: '♻️', name: 'Zero Waste Lunch',desc: 'Packed from home, zero packaging',            co2: 0.8, pts: 20 },
  { id: 'coldwash',   emoji: '🧺', name: 'Cold Wash Cycle', desc: 'Laundry on cold cycle saves energy',          co2: 0.6, pts: 12 },
  { id: 'plantsnack', emoji: '🌱', name: 'Plant-Based Snack',desc: 'Chose a plant-based snack option',           co2: 0.4, pts:  8 },
];

const CHALLENGES = [
  { id: 'veggie',  emoji: '🥗', name: 'Veggie February',      desc: 'Reduce meat intake by 50% for 28 days',  parts: 12847, dur: '28 days', prog: 60,  cat: 'Diet'      },
  { id: 'cycle',   emoji: '🚲', name: 'Cycle September',       desc: 'Bike or walk every commute for a month',  parts: 8432,  dur: '30 days', prog: 35,  cat: 'Transport' },
  { id: 'energy',  emoji: '💡', name: 'Dark Sky Week',          desc: 'Reduce home energy use by 20% in 7 days', parts: 5291,  dur: '7 days',  prog: 80,  cat: 'Energy'    },
  { id: 'flights', emoji: '✈️', name: 'Flight-Free Quarter',   desc: 'No flights for 90 days — massive impact', parts: 3102,  dur: '90 days', prog: 20,  cat: 'Transport' },
];

const BADGES = [
  { id: 'first',    emoji: '🌱', name: 'Seedling',       req: 1,   desc: 'First log!' },
  { id: 'sprout',   emoji: '🌿', name: 'Sprout',         req: 7,   desc: '7 actions'  },
  { id: 'sapling',  emoji: '🌳', name: 'Sapling',        req: 30,  desc: '30 actions' },
  { id: 'forest',   emoji: '🌲', name: 'Forest Keeper',  req: 100, desc: '100 actions' },
  { id: 'champion', emoji: '🌍', name: 'Climate Champ',  req: 200, desc: 'Top performer' },
  { id: 'neutral',  emoji: '🏔️', name: 'Carbon Neutral', req: 365, desc: 'Net zero week' },
  { id: 'onfire',   emoji: '🔥', name: 'On Fire',        req: 15,  desc: '15-day streak' },
  { id: 'ambassador',emoji:'🌐', name: 'Ambassador',     req: 50,  desc: '50 eco actions' },
];

const REWARDS = [
  { emoji: '🎁', name: '10% off Patagonia',    desc: 'Sustainable outdoor gear',       cost: 500   },
  { emoji: '🌳', name: 'Plant a Real Tree',    desc: 'GPS-tracked in your name',       cost: 5000  },
  { emoji: '📜', name: 'Carbon Certificate',   desc: '1 tonne CO₂ offset verified',    cost: 1000  },
  { emoji: '⭐', name: 'Premium Month Free',   desc: 'Unlock all premium features',    cost: 2500  },
  { emoji: '💚', name: 'Climate NGO Donation', desc: 'Donate to a verified org',       cost: 10000 },
];

const OB_STEPS = [
  {
    emoji: '🌍', title: "Where are you based?", sub: "Helps estimate your local energy grid's carbon intensity",
    key: 'location',
    opts: [{ e:'🇺🇸',l:'North America' },{ e:'🇪🇺',l:'Europe' },{ e:'🌏',l:'Asia Pacific' },{ e:'🌍',l:'Rest of World' }]
  },
  {
    emoji: '🍽️', title: "What's your diet like?", sub: "Diet is one of the biggest personal carbon drivers",
    key: 'diet',
    opts: [{ e:'🥩',l:'Meat-Heavy' },{ e:'🍗',l:'Flexitarian' },{ e:'🥗',l:'Vegetarian' },{ e:'🌱',l:'Vegan' }]
  },
  {
    emoji: '🚗', title: "How do you get around?", sub: "Your primary commute method matters a lot",
    key: 'transport',
    opts: [{ e:'🚗',l:'Car' },{ e:'🚌',l:'Public Transit' },{ e:'🚲',l:'Bike / Walk' },{ e:'🏠',l:'Work From Home' }]
  },
  {
    emoji: '✈️', title: "How often do you fly?", sub: "Flights are among the highest single-emission activities",
    key: 'flights',
    opts: [{ e:'🚫',l:'Never / Rarely' },{ e:'✈️',l:'1–2 per year' },{ e:'🌍',l:'3–5 per year' },{ e:'🗺️',l:'5+ per year' }]
  },
  {
    emoji: '⚡', title: "Home energy source?", sub: "Your electricity grid's carbon intensity",
    key: 'energy',
    opts: [{ e:'🏭',l:'Standard Grid' },{ e:'☀️',l:'Renewable / Solar' },{ e:'🌿',l:'Green Tariff' },{ e:'❓',l:'Not Sure' }]
  },
  {
    emoji: '🛍️', title: "Your shopping habits?", sub: "Fast fashion has a surprisingly large carbon footprint",
    key: 'shopping',
    opts: [{ e:'🏷️',l:'Fast Fashion' },{ e:'♻️',l:'Conscious Shopper' },{ e:'🔄',l:'Secondhand / Thrift' },{ e:'🧘',l:'Minimalist' }]
  },
];

const INSIGHTS = [
  'Your <strong>diet</strong> accounts for ~30% of your footprint. One plant-based meal saves <strong>2.5 kg CO₂</strong> — your biggest single daily action.',
  'Switching to a <strong>cold wash</strong> uses 90% less energy — that\'s <strong>0.6 kg CO₂</strong> saved every laundry day.',
  'Walking instead of driving just <strong>2 km</strong> saves the same CO₂ as not charging your phone for <strong>80 days</strong>.',
  'The global average footprint is <strong>4 tonnes/year</strong>. Your baseline already puts you ahead of most people globally.',
  'Avoiding one fast-fashion purchase saves the equivalent of <strong>2 trees</strong> absorbing CO₂ for a year.',
  'Lowering your thermostat by just <strong>1°C</strong> can save up to 1 kg CO₂ per day — small habit, big result.',
  'You saved <strong>' + (() => 'energy')() + '</strong> — every logged action compounds over time into real climate impact.',
];

const TRANS = {
  nature: kg => ({ e:'🌳', t:`Your <strong>${kg.toFixed(1)} kg CO₂</strong> saved equals ${Math.max(1,Math.round(kg/2))} tree${kg>2?'s':''} absorbing carbon for a month` }),
  travel: kg => ({ e:'🚗', t:`You avoided the equivalent of driving <strong>${Math.round(kg*6)} km</strong> in a typical gasoline car` }),
  energy: kg => ({ e:'💡', t:`That\'s enough energy to charge <strong>${Math.round(kg*80)} smartphones</strong> — or power a fridge for ${Math.max(1,Math.round(kg*0.5))} days` }),
};

const LB_USERS = [
  { e:'🌍', name:'Aria Chen',   score: 89.4 },
  { e:'🌲', name:'Marcus V.',   score: 76.2 },
  { e:'🌳', name:'Priya S.',    score: 71.8 },
  { e:'🌿', name:'Tom B.',      score: 65.0 },
  { e:'🌱', name:'Lena K.',     score: 58.3 },
];

// ─── Onboarding State ────────────────────────────────────────
let obStep = 0;
const obSel = {};

function renderOBStep() {
  const card = document.getElementById('ob-card');
  if (obStep >= OB_STEPS.length) { renderScoreResult(); return; }
  const step = OB_STEPS[obStep];

  const dots = OB_STEPS.map((_, i) =>
    `<div class="sdot${i < obStep ? ' done' : i === obStep ? ' active' : ''}"></div>`
  ).join('');

  const opts = step.opts.map((o, i) =>
    `<button class="opt-btn${obSel[step.key] === i ? ' sel' : ''}"
       onclick="obSelect('${step.key}',${i},this)">
       <span class="oe">${o.e}</span>${o.l}
     </button>`
  ).join('');

  const isLast = obStep === OB_STEPS.length - 1;
  card.innerHTML = `
    <div class="step-dots">${dots}</div>
    <span class="ob-emoji">${step.emoji}</span>
    <h2 class="ob-title">${step.title}</h2>
    <p class="ob-sub">${step.sub}</p>
    <div class="opt-grid">${opts}</div>
    <button class="btn-primary" id="ob-next"
      onclick="obNext()" ${obSel[step.key] === undefined ? 'disabled' : ''}>
      ${isLast ? 'Calculate My Footprint ✨' : 'Continue →'}
    </button>`;
}

function obSelect(key, idx, el) {
  obSel[key] = idx;
  S.profile[key] = OB_STEPS.find(s => s.key === key).opts[idx].l;
  document.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('sel'));
  el.classList.add('sel');
  document.getElementById('ob-next').disabled = false;
}

function obNext() { obStep++; renderOBStep(); }

function renderScoreResult() {
  const bl = calcBaseline();
  S.baseline = bl;
  const circ = 2 * Math.PI * 82;
  const frac = Math.min(bl / 20, 1);
  const offset = circ * (1 - frac);
  const col = bl < 7 ? '#52B788' : bl < 12 ? '#F4A261' : '#E76F51';
  const label = bl < 6 ? 'Eco Leader 🌟' : bl < 10 ? 'Conscious Citizen 🌿' : 'Room to Grow 🌱';
  const globalAvg = 11, natAvg = 9.5;
  const vGlobal = Math.round(((globalAvg - bl) / globalAvg) * 100);
  const vNat    = Math.round(((natAvg    - bl) / natAvg)    * 100);
  const fmt = v => `${v > 0 ? '−' : '+'}${Math.abs(v)}%`;

  document.getElementById('ob-card').innerHTML = `
    <div class="score-result">
      <div class="step-dots"><div class="sdot active" style="width:50px;"></div></div>
      <div class="sr-ring">
        <svg class="sr-ring-svg" width="190" height="190" viewBox="0 0 190 190">
          <circle class="sr-ring-track" cx="95" cy="95" r="82"/>
          <circle class="sr-ring-fill" id="sr-fill" cx="95" cy="95" r="82"
            stroke="${col}" stroke-dasharray="${circ.toFixed(1)}" stroke-dashoffset="${circ.toFixed(1)}"/>
        </svg>
        <div class="sr-center">
          <span class="sr-val" id="sr-val" style="color:${col}">0</span>
          <span class="sr-unit">kg CO₂/day</span>
        </div>
      </div>
      <div class="sr-label">${label}</div>
      <p class="sr-desc">Your estimated daily carbon footprint is <strong>${bl.toFixed(1)} kg CO₂e</strong> based on your lifestyle.</p>
      <div class="sr-compare">
        <div class="src-chip"><p class="clbl">vs. Global Avg</p><p class="cval">${fmt(vGlobal)}</p></div>
        <div class="src-chip"><p class="clbl">vs. National Avg</p><p class="cval">${fmt(vNat)}</p></div>
      </div>
      <button class="btn-primary" onclick="finishOnboarding()">Start My Journey 🚀</button>
    </div>`;

  setTimeout(() => {
    document.getElementById('sr-fill').style.strokeDashoffset = offset;
    countUp('sr-val', 0, bl, 1.6, 1);
  }, 150);
}

function calcBaseline() {
  let s = 5;
  const { diet, transport, flights, energy, shopping } = S.profile;
  if (diet === 'Meat-Heavy')    s += 4;
  else if (diet === 'Flexitarian') s += 2;
  else if (diet === 'Vegetarian')  s += 0.5;
  if (transport === 'Car')           s += 3;
  else if (transport === 'Public Transit') s += 1;
  if (flights === '5+ per year')    s += 2;
  else if (flights === '3–5 per year')  s += 1.5;
  else if (flights === '1–2 per year')  s += 0.8;
  if (energy === 'Standard Grid')   s += 1;
  else if (energy === 'Renewable / Solar' || energy === 'Green Tariff') s -= 0.5;
  if (shopping === 'Fast Fashion')  s += 1;
  else if (shopping === 'Minimalist' || shopping === 'Secondhand / Thrift') s -= 0.3;
  return Math.max(2, Math.round(s * 10) / 10);
}

function finishOnboarding() {
  S.onboarded = true;
  S.weeklyData = Array.from({ length: 7 }, () => +(Math.random() * 2.5 + 0.3).toFixed(1));
  save();
  launchApp();
}

// ─── App Launch ──────────────────────────────────────────────
function launchApp() {
  document.getElementById('screen-onboarding').classList.remove('active');
  const main = document.getElementById('screen-main');
  main.classList.add('active');
  bootMainApp();
}

function bootMainApp() {
  setGreeting();
  renderQuickGrid();
  renderLogList();
  renderChallenges();
  renderLeaderboard();
  renderBadges();
  renderRewards();
  refreshHeroCard();
  refreshStats();
  refreshInsight();
  refreshHomeTrans();
  initCharts();
}

// ─── Greeting ────────────────────────────────────────────────
function setGreeting() {
  const h = new Date().getHours();
  const greets = h < 12
    ? ['Good morning','Rise & shine','Morning, champion']
    : h < 17
    ? ['Good afternoon','Welcome back','Hey there']
    : ['Good evening','Evening, explorer','Great evening'];
  document.getElementById('greet-sub').textContent = greets[Math.floor(Math.random() * greets.length)];
}

// ─── Hero Card ───────────────────────────────────────────────
function refreshHeroCard() {
  const bl = S.baseline;
  const globalAvg = 11;
  const pct = Math.round(((globalAvg - bl) / globalAvg) * 100);
  document.getElementById('hero-score').textContent = bl.toFixed(1);
  document.getElementById('hero-label').textContent = bl < 6 ? 'Eco Leader 🌟' : bl < 10 ? 'Conscious Citizen' : 'Room to Grow';
  document.getElementById('hero-chip').textContent = `📉 ${Math.abs(pct)}% ${pct >= 0 ? 'below' : 'above'} global avg`;

  // Ring
  const ring = document.getElementById('hero-ring');
  const circ = 264;
  const offset = circ * (1 - Math.min(bl / 20, 1));
  setTimeout(() => { ring.style.strokeDashoffset = offset; }, 120);
}

// ─── Stats ───────────────────────────────────────────────────
function refreshStats() {
  countUp('st-streak',  0, S.streak,       0.5, 0);
  countUp('st-saved',   0, S.totalSaved,   0.6, 1);
  countUp('st-actions', 0, S.totalActions, 0.5, 0);
  el('hdr-streak-val').textContent = S.streak;
  el('pts-val').textContent = S.ecoPoints;

  const tier = getTier(S.totalActions);
  const next = getNextTier(S.totalActions);
  el('prof-tier').textContent = tier.e + ' ' + tier.n;
  el('topbar-avatar').textContent = tier.e;
  el('prof-avatar').textContent = tier.e;

  if (next) {
    const pct = Math.min(100, Math.round((S.totalActions / next.req) * 100));
    el('tier-bar').style.width = pct + '%';
    el('tier-lbl').textContent = `${S.totalActions} / ${next.req} logged actions`;
    el('next-tier').textContent = next.e + ' ' + next.n;
  }

  // Log progress
  const todaySaved = [...S.loggedToday].reduce((sum, id) => {
    const a = ACTIONS.find(a => a.id === id);
    return sum + (a ? a.co2 : 0);
  }, 0);
  el('lp-count').textContent = S.loggedToday.size;
  el('lp-saved').textContent = todaySaved.toFixed(1) + ' kg CO₂';
  el('lp-bar').style.width = Math.min(100, S.loggedToday.size / ACTIONS.length * 100) + '%';
}

function getTier(n) {
  if (n >= 200) return { e:'🌍', n:'Climate Champion' };
  if (n >= 100) return { e:'🌲', n:'Forest Keeper'   };
  if (n >= 30)  return { e:'🌳', n:'Sapling'         };
  if (n >= 7)   return { e:'🌿', n:'Sprout'          };
  return               { e:'🌱', n:'Seedling'        };
}
function getNextTier(n) {
  const tiers = [
    { req:7,  e:'🌿', n:'Sprout'          },
    { req:30, e:'🌳', n:'Sapling'         },
    { req:100,e:'🌲', n:'Forest Keeper'   },
    { req:200,e:'🌍', n:'Climate Champion'},
  ];
  return tiers.find(t => t.req > n) || null;
}

// ─── Insight ─────────────────────────────────────────────────
function refreshInsight() {
  el('insight-text').innerHTML = INSIGHTS[Math.floor(Math.random() * INSIGHTS.length)];
}

// ─── Translation ─────────────────────────────────────────────
let curTrans = 'nature';

function refreshHomeTrans() {
  const kg = Math.max(0.1, S.totalSaved);
  const t = TRANS.nature(kg);
  el('home-trans-emoji').textContent = t.e;
  el('home-trans-text').innerHTML = t.t;
}

function refreshInsightsTrans(mode = curTrans) {
  const kg = Math.max(0.1, S.totalSaved);
  const t = TRANS[mode](kg);
  el('tr-emoji').textContent = t.e;
  el('tr-text').innerHTML = t.t;
}

function switchTrans(mode, btn) {
  curTrans = mode;
  document.querySelectorAll('.ttab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  refreshInsightsTrans(mode);
}

// ─── Quick Grid (Home) ───────────────────────────────────────
function renderQuickGrid() {
  el('quick-grid').innerHTML = ACTIONS.slice(0, 4).map(a => qaCardHTML(a, 'qa')).join('');
}

function qaCardHTML(a, prefix) {
  const logged = S.loggedToday.has(a.id);
  return `
  <div class="qa-card${logged ? ' logged' : ''}" id="${prefix}-${a.id}" onclick="logAction('${a.id}',event)">
    <div class="qa-ripple"></div>
    <span class="qa-emoji">${a.emoji}</span>
    <div class="qa-name">${a.name}</div>
    <div class="qa-co2">−${a.co2} kg CO₂</div>
    <div class="qa-check">✓</div>
  </div>`;
}

// ─── Log List ────────────────────────────────────────────────
function renderLogList() {
  el('log-list').innerHTML = ACTIONS.map(a => {
    const logged = S.loggedToday.has(a.id);
    return `
    <div class="la-card${logged?' logged':''}" id="la-${a.id}" onclick="logAction('${a.id}',event)">
      <span class="la-emoji">${a.emoji}</span>
      <div class="la-info">
        <div class="la-name">${a.name}</div>
        <div class="la-desc">${a.desc}</div>
      </div>
      <div class="la-right">
        <div class="la-co2">−${a.co2} kg</div>
        <div class="la-status">${logged?'✓':''}</div>
      </div>
    </div>`;
  }).join('');
}

// ─── Log Action ──────────────────────────────────────────────
function logAction(id, event) {
  if (S.loggedToday.has(id)) { showToast('⚠️', 'Already logged today!'); return; }
  const a = ACTIONS.find(x => x.id === id);
  if (!a) return;

  S.loggedToday.add(id);
  S.totalSaved   = +(S.totalSaved + a.co2).toFixed(2);
  S.totalActions += 1;
  S.ecoPoints    += a.pts;
  if (S.totalActions % 7 === 0) S.streak += 1;
  if (S.totalActions === 1)      S.streak  = 1;

  // Update weekly data for today
  const dow = new Date().getDay(); // 0=Sun … 6=Sat
  S.weeklyData[dow] = +(S.weeklyData[dow] + a.co2).toFixed(1);

  // CO₂ pop animation
  if (event) {
    const pop = document.createElement('div');
    pop.className = 'co2-pop';
    pop.textContent = `−${a.co2} kg CO₂ 🌿`;
    pop.style.left = (event.clientX - 60) + 'px';
    pop.style.top  = (event.clientY - 20) + 'px';
    document.body.appendChild(pop);
    setTimeout(() => pop.remove(), 1400);
  }

  // Mark cards
  ['qa', 'la'].forEach(pfx => {
    const card = el(`${pfx}-${id}`);
    if (card) {
      card.classList.add('logged');
      const status = card.querySelector('.la-status, .qa-check');
      if (status) status.textContent = '✓';
    }
  });

  save();
  refreshStats();
  renderBadges();
  refreshHomeTrans();
  refreshInsightsTrans();
  updateCharts();
  showToast('🌿', `+${a.pts} EcoPoints! Saved ${a.co2} kg CO₂`);
}

// ─── Challenges ──────────────────────────────────────────────
function renderChallenges() {
  el('chal-list').innerHTML = CHALLENGES.map(c => {
    const joined = S.joinedChallenges.has(c.id);
    return `
    <div class="chal-card">
      <div class="chal-hdr">
        <span class="chal-ico">${c.emoji}</span>
        <div class="chal-info">
          <div class="chal-name">${c.name}</div>
          <div class="chal-meta">⏱ ${c.dur} · ${c.cat}</div>
        </div>
        <div class="chal-badge">${joined ? '✓ Joined' : 'Active'}</div>
      </div>
      <div class="prog-hdr"><span class="pl">Community progress</span><span class="pv">${c.prog}%</span></div>
      <div class="prog-bar-wrap"><div class="prog-bar" style="width:${c.prog}%"></div></div>
      <div class="chal-foot">
        <span class="chal-parts">👥 ${c.parts.toLocaleString()} participants</span>
        <button class="btn-join${joined?' joined':''}" onclick="joinChallenge('${c.id}',this)">
          ${joined ? '✓ Joined' : 'Join'}
        </button>
      </div>
    </div>`;
  }).join('');
}

function joinChallenge(id, btn) {
  if (S.joinedChallenges.has(id)) return;
  S.joinedChallenges.add(id);
  btn.textContent = '✓ Joined';
  btn.classList.add('joined');
  btn.closest('.chal-card').querySelector('.chal-badge').textContent = '✓ Joined';
  S.ecoPoints += 100;
  save(); refreshStats();
  showToast('🏆', '+100 EcoPoints for joining!');
}

// ─── Leaderboard ─────────────────────────────────────────────
function renderLeaderboard() {
  const myScore = S.totalSaved;
  const list = [
    ...LB_USERS.map(u => ({ ...u, isMe: false })),
    { e: '🌱', name: 'You 🌟', score: myScore, isMe: true },
  ].sort((a, b) => b.score - a.score).slice(0, 7);

  const medals = ['🥇','🥈','🥉'];
  el('lb-list').innerHTML = list.map((u, i) => `
    <div class="lb-item${u.isMe?' me':''}">
      <div class="lb-rank${i<3?' gold':''}">${i < 3 ? medals[i] : '#'+(i+1)}</div>
      <div class="lb-av">${u.e}</div>
      <div class="lb-name">${u.name}</div>
      <div class="lb-score">${u.score.toFixed(1)} kg saved</div>
    </div>`).join('');
}

// ─── Badges ──────────────────────────────────────────────────
function renderBadges() {
  el('badges-grid').innerHTML = BADGES.map(b => {
    const earned = S.totalActions >= b.req;
    return `
    <div class="bdg-item" title="${b.desc}">
      <div class="bdg-ico${earned?' earned':''}">${b.emoji}</div>
      <div class="bdg-lbl${earned?' earned':''}">${b.name}</div>
    </div>`;
  }).join('');
}

// ─── Rewards ─────────────────────────────────────────────────
function renderRewards() {
  el('rewards-list').innerHTML = REWARDS.map(r => {
    const canRedeem = S.ecoPoints >= r.cost;
    return `
    <div class="rwd-card">
      <span class="rwd-ico">${r.emoji}</span>
      <div class="rwd-info">
        <div class="rwd-name">${r.name}</div>
        <div class="rwd-desc">${r.desc}</div>
      </div>
      <div class="rwd-right">
        <div class="rwd-pts">${r.cost.toLocaleString()} pts</div>
        <button class="btn-redeem" onclick="redeemReward('${r.name}',${r.cost},this)">
          ${canRedeem ? 'Redeem' : '🔒 Locked'}
        </button>
      </div>
    </div>`;
  }).join('');
}

function redeemReward(name, cost, btn) {
  if (S.ecoPoints < cost) { showToast('🔒', `Need ${(cost - S.ecoPoints).toLocaleString()} more points`); return; }
  S.ecoPoints -= cost;
  save(); refreshStats(); renderRewards();
  showToast('🎁', `${name} redeemed! Check your email.`);
}

// ─── Charts ──────────────────────────────────────────────────
let weeklyChart, pieChart;

function initCharts() {
  // Weekly bar
  const wCtx = document.getElementById('weekly-chart').getContext('2d');
  weeklyChart = new Chart(wCtx, {
    type: 'bar',
    data: {
      labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      datasets: [{
        label: 'CO₂ Saved (kg)',
        data: [...S.weeklyData],
        backgroundColor: 'rgba(82,183,136,0.28)',
        borderColor: '#52B788',
        borderWidth: 2,
        borderRadius: 7,
        borderSkipped: false,
        hoverBackgroundColor: 'rgba(82,183,136,0.5)',
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(11,24,18,.96)',
          titleColor: '#52B788', bodyColor: '#8FB39B',
          borderColor: 'rgba(82,183,136,.28)', borderWidth: 1, padding: 10,
          callbacks: { label: c => ` ${c.parsed.y} kg CO₂ saved` }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#4F7A5E', font: { size: 10 } } },
        y: { grid: { color: 'rgba(79,122,94,.15)' }, ticks: { color: '#4F7A5E', font: { size: 10 } } }
      },
      animation: { duration: 900, easing: 'easeInOutQuart' }
    }
  });

  // Doughnut
  const pCtx = document.getElementById('pie-chart').getContext('2d');
  const cats   = Object.keys(S.categories);
  const vals   = Object.values(S.categories);
  const colors = ['#52B788','#F4A261','#48CAE4','#E76F51','#B7E4C7'];

  pieChart = new Chart(pCtx, {
    type: 'doughnut',
    data: {
      labels: cats.map(c => c[0].toUpperCase() + c.slice(1)),
      datasets: [{
        data: vals,
        backgroundColor: colors.map(c => c + 'CC'),
        borderColor:     colors,
        borderWidth: 2,
        hoverOffset: 8,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(11,24,18,.96)',
          titleColor: '#52B788', bodyColor: '#8FB39B',
          borderColor: 'rgba(82,183,136,.28)', borderWidth: 1,
        }
      }
    }
  });

  // Category list
  el('cat-list').innerHTML = cats.map((c, i) => `
    <div class="cat-item">
      <div class="cat-dot" style="background:${colors[i]}"></div>
      <div class="cat-name">${c[0].toUpperCase()+c.slice(1)}</div>
      <div class="cat-bar-wrap"><div class="cat-bar" style="width:${vals[i]}%;background:${colors[i]}"></div></div>
      <div class="cat-val">${vals[i]}%</div>
    </div>`).join('');
}

function updateCharts() {
  if (weeklyChart) {
    weeklyChart.data.datasets[0].data = [...S.weeklyData];
    weeklyChart.update();
  }
  renderLeaderboard();
}

// ─── Navigation ──────────────────────────────────────────────
function navTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  el('page-' + page).classList.add('active');
  el('nav-' + page).classList.add('active');

  // Refresh on switch
  if (page === 'home')       { refreshStats(); refreshInsight(); refreshHomeTrans(); }
  if (page === 'log')        { refreshStats(); }
  if (page === 'insights')   { setTimeout(() => { updateCharts(); refreshInsightsTrans(); }, 50); }
  if (page === 'challenges') { renderChallenges(); renderLeaderboard(); }
  if (page === 'profile')    { refreshStats(); renderBadges(); renderRewards(); }
}

// ─── Particles ───────────────────────────────────────────────
function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const PARTICLE_COUNT = 28;
  const particles = Array.from({ length: PARTICLE_COUNT }, () => makeParticle());

  function makeParticle() {
    return {
      x:     Math.random() * window.innerWidth,
      y:     Math.random() * window.innerHeight + window.innerHeight,
      size:  Math.random() * 3 + 1,
      speed: Math.random() * 0.5 + 0.2,
      drift: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.4 + 0.05,
    };
  }

  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = '#52B788';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      p.y     -= p.speed;
      p.x     += p.drift;
      p.alpha  = 0.05 + 0.35 * Math.sin((window.innerHeight - p.y) / window.innerHeight * Math.PI);

      if (p.y < -20) Object.assign(p, makeParticle(), { y: window.innerHeight + 20 });
    }
    requestAnimationFrame(tick);
  }
  tick();
}

// ─── Toast ───────────────────────────────────────────────────
let toastTimer;
function showToast(icon, msg) {
  el('toast-ico').textContent = icon;
  el('toast-msg').textContent = msg;
  el('toast').classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el('toast').classList.remove('show'), 3000);
}

// ─── Persistence ─────────────────────────────────────────────
function save() {
  try {
    const copy = { ...S, loggedToday: [...S.loggedToday], joinedChallenges: [...S.joinedChallenges] };
    localStorage.setItem('ecotrace_v2', JSON.stringify(copy));
  } catch(e) {}
}

function load() {
  try {
    const raw = localStorage.getItem('ecotrace_v2');
    if (!raw) return false;
    const data = JSON.parse(raw);
    data.loggedToday      = new Set(data.loggedToday      || []);
    data.joinedChallenges = new Set(data.joinedChallenges || []);
    Object.assign(S, data);
    return S.onboarded;
  } catch(e) { return false; }
}

function resetApp() {
  localStorage.removeItem('ecotrace_v2');
  location.reload();
}

// ─── Utility ─────────────────────────────────────────────────
function el(id) { return document.getElementById(id); }

function countUp(id, from, to, dur, dec) {
  const node = el(id);
  if (!node) return;
  const start = performance.now();
  const diff  = to - from;
  (function tick(now) {
    const t = Math.min((now - start) / (dur * 1000), 1);
    const ease = 1 - Math.pow(1 - t, 3);
    node.textContent = (from + diff * ease).toFixed(dec);
    if (t < 1) requestAnimationFrame(tick);
  })(start);
}

// ─── Boot ────────────────────────────────────────────────────
window.addEventListener('load', () => {
  initParticles();

  setTimeout(() => {
    const splash = document.getElementById('splash');
    splash.classList.add('fade');
    setTimeout(() => {
      splash.style.display = 'none';
      const hasData = load();
      if (hasData) {
        launchApp();
      } else {
        el('screen-onboarding').classList.add('active');
        renderOBStep();
      }
    }, 520);
  }, 2300);
});
