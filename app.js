/* Focal : une chose à la fois.
   Vanilla JS, aucun build. L'état vit dans localStorage, le rendu passe par
   un petit « morph » du DOM pour garder les animations et le scroll entre deux rendus. */
(() => {
'use strict';

const KEY = 'focal.v1';
const MAX_GOALS = 3;
const DURATIONS = [15, 25, 45, 60];

/* ---------- thèmes (valeurs de la maquette) ---------- */
const THEMES = {
  Ivoire:     { dark: false, hue: 55,  bg: '#F7F3EC', card: '#FFFFFF', cardA: '#FFFFFF', cardB: '#FBF8F2', sheet: '#FFFFFF', btn: '#EFEAE1', ink: [28, 24, 20],    w: [70, 52, 30],    wMul: 1.3, tabBg: 'rgba(255,255,255,.72)', pill: '#1C1814', pillInk: '#F7F3EC', L: .58, C: .15, hiL: .68, hiC: .14, onAccent: '#FFFFFF', shMul: .22, softA: .28 },
  Porcelaine: { dark: false, hue: 275, bg: '#FFFFFF', card: '#F4F5F8', cardA: '#F8F9FB', cardB: '#EFF1F5', sheet: '#FFFFFF', btn: '#EEF0F4', ink: [17, 19, 26],    w: [25, 35, 70],    wMul: 1.2, tabBg: 'rgba(244,245,248,.8)',  pill: '#111318', pillInk: '#FFFFFF', L: .5,  C: .17, hiL: .62, hiC: .16, onAccent: '#FFFFFF', shMul: .18, softA: .25 },
  Sauge:      { dark: false, hue: 150, bg: '#EEF2ED', card: '#FFFFFF', cardA: '#FFFFFF', cardB: '#F6F9F5', sheet: '#FFFFFF', btn: '#E2E8E1', ink: [22, 32, 26],    w: [25, 60, 35],    wMul: 1.3, tabBg: 'rgba(255,255,255,.72)', pill: '#16201A', pillInk: '#EEF2ED', L: .52, C: .12, hiL: .64, hiC: .11, onAccent: '#FFFFFF', shMul: .22, softA: .28 },
  Nuit:       { dark: true,  hue: 75,  bg: '#0C0B0A', card: '#15130F', cardA: '#1A1712', cardB: '#13110E', sheet: '#17150F', btn: '#1C1915', ink: [243, 239, 232], w: [255, 255, 255], wMul: 1,   tabBg: 'rgba(32,29,25,.8)',     pill: '#F3EFE8', pillInk: '#0C0B0A', L: .84, C: .13, hiL: .91, hiC: .09, onAccent: '#1A1407', shMul: 1,   softA: .35 }
};

function themeVars(name) {
  const t = THEMES[name] || THEMES.Ivoire;
  const rgb = a => a.join(',');
  const ink = a => `rgba(${rgb(t.ink)},${a})`;
  const w = a => `rgba(${rgb(t.w)},${Math.min(1, a * t.wMul).toFixed(3)})`;
  const k = a => String(a).replace(/^0?\./, '');
  const v = {
    '--pill': t.pill, '--pillInk': t.pillInk, '--bg': t.bg, '--bg0': t.bg + '00', '--card': t.card, '--cardA': t.cardA,
    '--cardB': t.cardB, '--sheet': t.sheet, '--btn': t.btn, '--ink': `rgb(${rgb(t.ink)})`, '--onAccent': t.onAccent, '--tabBg': t.tabBg,
    '--accent': `oklch(${t.L} ${t.C} ${t.hue})`, '--accentHi': `oklch(${t.hiL} ${t.hiC} ${t.hue})`, '--accentSoft': `oklch(${t.L} ${t.C} ${t.hue} / ${t.softA})`
  };
  for (const a of [.25, .3, .35, .4, .45, .5, .55, .6, .85]) v['--ink' + k(a)] = ink(a);
  for (const a of [.03, .05, .06, .07, .08, .09, .1, .14, .18]) v['--w' + k(a)] = w(a);
  for (const a of [.3, .4, .5, .55, .6, .7]) v['--sh' + k(a)] = `rgba(0,0,0,${(a * t.shMul).toFixed(2)})`;
  return { vars: v, dark: t.dark, bg: t.bg };
}

function applyTheme() {
  const { vars, dark, bg } = themeVars(S.settings.theme);
  const st = document.documentElement.style;
  for (const [key, val] of Object.entries(vars)) st.setProperty(key, val);
  st.colorScheme = dark ? 'dark' : 'light';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', bg);
}

/* ---------- utilitaires ---------- */
const pad = n => String(n).padStart(2, '0');
const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 10);
const plural = (n, one, many) => `${n} ${n > 1 ? many : one}`;
const fmtDate = opts => cap(new Intl.DateTimeFormat('fr-FR', opts).format(new Date()));
const ms = (...rows) => rows.map(([t, d]) => ({ id: uid(), t, d: !!d }));

const SAMPLE = () => [
  { id: uid(), title: 'Publier mon premier livre', why: 'Pour laisser une trace qui dépasse mon quotidien.', deadline: 'Juin 2027',
    milestones: ms(['Plan détaillé des chapitres', true], ['Écrire 30 000 mots', true], ['Première version complète'], ['Relecture par deux lecteurs'], ['Envoyer à trois éditeurs']) },
  { id: uid(), title: 'Courir un semi-marathon', why: 'Prouver que la constance bat le talent.', deadline: 'Avril 2027',
    milestones: ms(['Courir 5 km sans pause', true], ['10 km en moins d’une heure', true], ['Plan 12 semaines commencé', true], ['15 km en sortie longue']) },
  { id: uid(), title: 'Parler espagnol en voyage', why: 'Comprendre les gens, pas seulement les menus.', deadline: 'Été 2027',
    milestones: ms(['Niveau A1 validé', true], ['30 jours de pratique d’affilée'], ['Une conversation de 10 min']) }
];

/* ---------- état persistant ---------- */
function normalize(s) {
  const d = { goals: [], primaryId: null, checkins: {}, focus: {}, settings: { theme: 'Ivoire', focusMinutes: 25, showStreak: true }, timer: { total: 1500, remaining: null, endAt: null } };
  const out = { ...d, ...s, settings: { ...d.settings, ...(s.settings || {}) }, timer: { ...d.timer, ...(s.timer || {}) }, checkins: s.checkins || {}, focus: s.focus || {} };
  out.goals = Array.isArray(out.goals) ? out.goals.filter(g => g && g.title).map(g => ({
    id: g.id || uid(), title: String(g.title), why: String(g.why || ''), deadline: String(g.deadline || ''),
    milestones: (g.milestones || []).map(m => ({ id: m.id || uid(), t: String(m.t || ''), d: !!m.d }))
  })).slice(0, MAX_GOALS) : [];
  if (!THEMES[out.settings.theme]) out.settings.theme = 'Ivoire';
  if (!DURATIONS.includes(out.settings.focusMinutes)) out.settings.focusMinutes = 25;
  if (!out.goals.find(g => g.id === out.primaryId)) out.primaryId = out.goals[0] ? out.goals[0].id : null;
  return out;
}
function load() {
  try { const raw = localStorage.getItem(KEY); if (raw) return normalize(JSON.parse(raw)); } catch (e) { /* stockage indisponible */ }
  return normalize({});
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* quota ou mode privé */ } }

let S = load();
const U = { tab: 'today', overlay: null, activeId: null, mood: null, toast: null, draft: null };
let toastSeq = 0, toastTimer = null;

/* ---------- dérivés ---------- */
const pctOf = g => g.milestones.length ? Math.round(g.milestones.filter(m => m.d).length / g.milestones.length * 100) : 0;
const doneOf = g => g.milestones.filter(m => m.d).length;
const primaryGoal = () => S.goals.find(g => g.id === S.primaryId) || S.goals[0] || null;
const activeGoal = () => S.goals.find(g => g.id === U.activeId) || null;

function streak() {
  let n = 0, d = new Date();
  if (!S.checkins[dayKey(d)]) d = addDays(d, -1);
  for (let i = 0; i < 4000; i++) {
    const c = S.checkins[dayKey(d)];
    if (c === 'yes' || c === 'hold') n++;
    else if (c !== 'pause') break;
    d = addDays(d, -1);
  }
  return n;
}

function timerState() {
  const t = S.timer, total = t.total || S.settings.focusMinutes * 60;
  if (t.endAt) { const left = Math.max(0, Math.ceil((t.endAt - Date.now()) / 1000)); return { total, left, running: left > 0 }; }
  return { total, left: t.remaining == null ? total : t.remaining, running: false };
}
function creditFocus(minutes, when = new Date()) {
  if (minutes <= 0) return;
  const k = dayKey(when);
  S.focus[k] = (S.focus[k] || 0) + minutes;
}
function completeTimer() {
  const t = S.timer;
  creditFocus(Math.round(t.total / 60), new Date(t.endAt));
  S.timer = { total: t.total, remaining: 0, endAt: null };
  save();
  showToast('Session terminée. Bien joué.');
}
function focusMinutesOn(k) {
  let m = S.focus[k] || 0;
  if (k === dayKey()) { const t = timerState(); if (t.running) m += Math.floor((t.total - t.left) / 60); }
  return m;
}

/* ---------- compte-à-rebours animé des chiffres ---------- */
const anim = {};
function tween(key, target) {
  const a = anim[key] || (anim[key] = { v: 0, t: null, raf: null });
  if (a.t !== target) {
    a.t = target;
    const start = a.v, t0 = performance.now(), dur = 1100;
    cancelAnimationFrame(a.raf);
    const step = now => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      a.v = Math.round(start + (target - start) * e);
      const el = document.getElementById('tw-' + key);
      if (el) el.textContent = a.v;
      a.raf = k < 1 ? requestAnimationFrame(step) : null;
    };
    a.raf = requestAnimationFrame(step);
  }
  return a.v;
}
function resetTweens() { for (const k of Object.keys(anim)) { cancelAnimationFrame(anim[k].raf); delete anim[k]; } }

function showToast(msg) {
  clearTimeout(toastTimer);
  U.toast = { id: ++toastSeq, msg };
  toastTimer = setTimeout(() => { U.toast = null; render(); }, 2400);
}

/* ---------- vues ---------- */
function view() {
  const o = U.overlay;
  return `<div class="phone">
    <div class="blob1"></div><div class="blob2"></div><div class="grain"></div>
    ${U.tab === 'today' ? todayView() : U.tab === 'goals' ? goalsView() : statsView()}
    <div class="tab-fade"></div>
    ${tabbar()}
    ${U.toast ? `<div class="toast" data-key="toast-${U.toast.id}">${esc(U.toast.msg)}</div>` : ''}
    ${o === 'detail' ? detailView() : ''}
    ${o === 'editor' ? editorView() : ''}
    ${o === 'checkin' ? checkinView() : ''}
    ${o === 'focus' ? focusView() : ''}
  </div>`;
}

function todayView() {
  const primary = primaryGoal();
  const n = streak();
  const checked = !!S.checkins[dayKey()];
  let body;
  if (!primary) {
    body = `<div class="empty rise" style="--d:.14s">
      <div class="eyebrow accent">Pour commencer</div>
      <div class="display empty-title">Choisis un objectif qui compte vraiment.</div>
      <div class="lead">Trois places, pas plus. Un seul focus à la fois.</div>
      <div class="btn-primary on" data-act="newGoal">Créer mon premier objectif</div>
      <div class="link muted" data-act="loadSample">Voir avec un exemple</div>
    </div>`;
  } else {
    const pct = pctOf(primary), next = primary.milestones.find(m => !m.d);
    const secondary = S.goals.filter(g => g.id !== primary.id);
    body = `<div class="primary-card press rise" style="--d:.14s" data-act="openGoal" data-arg="${primary.id}">
      <div class="glow"></div>
      <div class="primary-row">
        <div class="ring104">
          <svg width="104" height="104" viewBox="0 0 104 104"><circle class="ring-track" cx="52" cy="52" r="46" stroke-width="7"></circle><circle class="ring-arc" cx="52" cy="52" r="46" stroke-width="7" stroke-dasharray="289" stroke-dashoffset="${(289 - 289 * pct / 100).toFixed(1)}"></circle></svg>
          <div class="ring-center"><div class="ring-num display"><span id="tw-pct" style="font-size:inherit;color:inherit">${tween('pct', pct)}</span><span>%</span></div></div>
        </div>
        <div class="min0">
          <div class="eyebrow accent">Focus du jour</div>
          <div class="primary-title display">${esc(primary.title)}</div>
        </div>
      </div>
      <div class="primary-foot">
        <div class="min0"><div class="foot-label">Prochain jalon</div><div class="foot-next">${esc(next ? next.t : 'Objectif atteint')}</div></div>
        <div class="foot-count">${doneOf(primary)}/${primary.milestones.length}</div>
      </div>
    </div>
    <div class="tiles rise" style="--d:.24s">
      <div class="tile tile-focus press press-sm" data-act="openFocus">
        <div class="clock"><i></i><i></i></div>
        <div><div class="tile-title">Session focus</div><div class="tile-sub">${S.settings.focusMinutes} min · sans distraction</div></div>
      </div>
      <div class="tile tile-checkin press press-sm" data-act="openCheckin">
        ${checked ? '<div class="check-done"><span class="tick"></span></div>' : '<div class="check-empty"></div>'}
        <div><div class="tile-title">${checked ? 'Journée validée' : 'Check-in du soir'}</div><div class="tile-sub">${checked ? 'Série : ' + plural(n, 'jour', 'jours') : '30 secondes, promis'}</div></div>
      </div>
    </div>
    ${secondary.length ? `<div class="eyebrow ink45 section-label rise" style="--d:.34s">En arrière-plan</div>` : ''}
    ${secondary.map((g, i) => `<div class="bg-row press press-fade rise" style="--d:${(0.4 + i * 0.08).toFixed(2)}s" data-key="bg-${g.id}" data-act="openGoal" data-arg="${g.id}">
      <div class="min0" style="flex:1"><div class="bg-title">${esc(g.title)}</div><div class="bar"><i style="width:${pctOf(g)}%"></i></div></div>
      <div class="bg-pct">${pctOf(g)}%</div>
    </div>`).join('')}`;
  }
  return `<div class="screen" data-key="screen-today">
    <div class="top-row rise"><div class="date">${esc(fmtDate({ weekday: 'long', day: 'numeric', month: 'long' }))}</div>${S.settings.showStreak ? `<div class="streak"><span class="sdot"></span>${plural(n, 'jour', 'jours')}</div>` : ''}</div>
    <div class="hero display rise" style="--d:.06s">Une chose<br><em>à la fois.</em></div>
    ${body}
  </div>`;
}

function goalsView() {
  const cards = S.goals.map((g, i) => {
    const isP = g.id === S.primaryId;
    return `<div class="goal-card press rise" style="--d:${(0.2 + i * 0.08).toFixed(2)}s" data-key="goal-${g.id}" data-act="openGoal" data-arg="${g.id}">
      <div class="goal-head">
        <div class="min0"><div class="eyebrow12 ${isP ? 'accent' : 'ink45'}">${isP ? 'Focus actuel' : 'Arrière-plan'}</div><div class="goal-title display">${esc(g.title)}</div></div>
        <div class="goal-pct display">${pctOf(g)}%</div>
      </div>
      <div class="mbars">${g.milestones.map(m => `<i class="${m.d ? 'done' : ''}${m.d && isP ? ' prim' : ''}"></i>`).join('')}</div>
      <div class="goal-foot"><span>${doneOf(g)} jalons sur ${g.milestones.length}</span><span>${esc(g.deadline)}</span></div>
    </div>`;
  }).join('');
  return `<div class="screen" data-key="screen-goals">
    <div class="date rise">${S.goals.length} sur ${MAX_GOALS} places</div>
    <div class="hero display rise" style="--d:.06s">Mes objectifs</div>
    <div class="lead rise" style="--d:.1s">Trois places, pas une de plus. Choisir, c’est renoncer.</div>
    <div class="goal-list">${cards}${S.goals.length < MAX_GOALS ? `<div class="free-slot press rise" style="--d:.5s" data-act="newGoal">+ Une place libre</div>` : ''}</div>
  </div>`;
}

function statsView() {
  const now = new Date(), todayK = dayKey(now);
  const monday = addDays(now, -((now.getDay() + 6) % 7));
  const start = addDays(monday, -28);
  const dots = [];
  for (let i = 0; i < 35; i++) {
    const d = addDays(start, i), k = dayKey(d), c = S.checkins[k];
    const future = k > todayK;
    const cls = future ? 'future' : (c === 'yes' || c === 'hold') ? 'on' : c === 'pause' ? 'pause' : '';
    const op = future ? 0 : (cls === 'on' ? (0.35 + (i / 35) * 0.65).toFixed(2) : 1);
    dots.push(`<div class="dot" style="--d:${(0.3 + i * 0.012).toFixed(3)}s"><i class="${cls}" style="opacity:${op}"></i></div>`);
  }
  const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const mins = days.map((_, i) => focusMinutesOn(dayKey(addDays(monday, i))));
  const scale = Math.max(80, ...mins);
  const bars = mins.map((m, i) => `<div class="barcol"><div class="barfill${dayKey(addDays(monday, i)) === todayK ? ' today' : ''}" style="height:${Math.max(6, m / scale * 100).toFixed(1)}%;--d:${(0.4 + i * 0.06).toFixed(2)}s"></div><div class="bar-d">${days[i]}</div></div>`).join('');
  const hours = (mins.reduce((a, b) => a + b, 0) / 60).toFixed(1).replace('.', ',');
  const n = streak();
  return `<div class="screen" data-key="screen-stats">
    <div class="date rise">${esc(fmtDate({ month: 'long' }))}</div>
    <div class="hero display rise" style="--d:.06s">Progression</div>
    <div class="stat-grid rise" style="--d:.14s">
      <div class="stat-card"><div class="eyebrow12 ink45">Série</div><div class="stat-num display accent"><span id="tw-streak" style="font-size:inherit;color:inherit;margin:0">${tween('streak', n)}</span><span>${n > 1 ? 'jours' : 'jour'}</span></div></div>
      <div class="stat-card"><div class="eyebrow12 ink45">Focus semaine</div><div class="stat-num display">${hours}<span>h</span></div></div>
    </div>
    <div class="panel rise" style="--d:.22s">
      <div class="eyebrow12 ink45">Check-ins · 5 dernières semaines</div>
      <div class="dots">${dots.join('')}</div>
      <div class="dow">${days.map(d => `<span>${d}</span>`).join('')}</div>
    </div>
    <div class="panel rise" style="--d:.3s">
      <div class="eyebrow12 ink45">Minutes de focus</div>
      <div class="bars">${bars}</div>
    </div>
    <div class="panel rise" style="--d:.38s">
      <div class="eyebrow12 ink45">Réglages</div>
      <div class="set-label">Apparence</div>
      <div class="chips">${Object.keys(THEMES).map(t => `<div class="chip press${t === S.settings.theme ? ' on' : ''}" data-act="setTheme" data-arg="${t}">${t}</div>`).join('')}</div>
      <div class="set-label">Session focus</div>
      <div class="chips">${DURATIONS.map(m => `<div class="chip press${m === S.settings.focusMinutes ? ' on' : ''}" data-act="setFocus" data-arg="${m}">${m} min</div>`).join('')}</div>
      <div class="set-row" data-act="toggleStreak"><span>Afficher la série sur l’accueil</span><span class="switch${S.settings.showStreak ? ' on' : ''}"><i></i></span></div>
      <div class="set-label">Données</div>
      <div class="chips"><div class="chip press" data-act="exportData">Copier mes données</div><div class="chip press" data-act="importData">Restaurer</div></div>
      <div class="set-hint">Tout reste sur ce téléphone. « Copier » met une sauvegarde dans le presse-papiers, à coller dans « Restaurer » sur un autre appareil.</div>
    </div>
  </div>`;
}

function tabbar() {
  const x = { today: 0, goals: 104, stats: 208 }[U.tab];
  const tab = (k, label) => `<div class="tab${U.tab === k ? ' on' : ''}" data-act="tab" data-arg="${k}">${label}</div>`;
  return `<div class="tabbar"><div class="tab-pill" style="--x:${x}px"></div>${tab('today', 'Aujourd’hui')}${tab('goals', 'Objectifs')}${tab('stats', 'Progrès')}</div>`;
}

function detailView() {
  const g = activeGoal(); if (!g) return '';
  const isP = g.id === S.primaryId;
  return `<div class="ov" data-key="ov-detail">
    <div class="ov-head"><div class="round-btn press" data-act="close"><span class="chev"></span></div><div class="pin press${isP ? ' on' : ''}" data-act="pin">${isP ? 'Focus actuel' : 'Mettre en focus'}</div></div>
    <div class="eyebrow accent rise" style="margin-top:34px;--d:.05s">${esc(g.deadline || 'Sans échéance')}</div>
    <div class="ov-title display rise" style="--d:.1s">${esc(g.title)}</div>
    ${g.why ? `<div class="why rise" style="--d:.18s"><div class="eyebrow12 ink45">Pourquoi</div><div class="quote display">« ${esc(g.why)} »</div></div>` : ''}
    <div class="jalons-head"><div class="eyebrow ink45">Jalons</div><div class="count">${doneOf(g)}/${g.milestones.length}</div></div>
    <div class="ms-list">${g.milestones.map((m, i) => `<div class="ms-row press rise" style="--d:${(0.22 + i * 0.06).toFixed(2)}s" data-key="ms-${m.id}" data-act="toggleMs" data-arg="${m.id}"><div class="ms-circle${m.d ? ' done' : ''}">${m.d ? '<span class="tick sm"></span>' : ''}</div><div class="ms-text${m.d ? ' done' : ''}">${esc(m.t)}</div></div>`).join('')}</div>
    <div class="ov-actions"><div class="link" data-act="editGoal">Modifier</div><div class="link muted" data-act="deleteGoal">Supprimer</div></div>
  </div>`;
}

function draftValid(d) { return !!d && d.title.trim().length > 0 && d.milestones.some(m => m.t.trim().length > 0); }

function editorView() {
  const d = U.draft; if (!d) return '';
  const isNew = !d.id;
  return `<div class="ov editor" data-key="ov-editor">
    <div class="ov-head"><div class="round-btn press" data-act="close"><span class="chev"></span></div><div class="date">${isNew ? 'Nouvel objectif' : 'Modifier'}</div><div style="width:40px"></div></div>
    <div class="ov-title display" style="margin-top:28px;font-size:32px">${isNew ? 'Qu’est-ce qui compte vraiment ?' : esc(d.title || 'Modifier')}</div>
    <div class="field"><label class="eyebrow12">Objectif</label><input type="text" data-field="title" value="${esc(d.title)}" placeholder="Publier mon premier livre" autocomplete="off" autocapitalize="sentences" enterkeyhint="next"></div>
    <div class="field"><label class="eyebrow12">Pourquoi</label><textarea data-field="why" rows="2" placeholder="Pour laisser une trace qui dépasse mon quotidien." autocapitalize="sentences">${esc(d.why)}</textarea></div>
    <div class="field"><label class="eyebrow12">Échéance</label><input type="text" data-field="deadline" value="${esc(d.deadline)}" placeholder="Juin 2027" autocomplete="off" autocapitalize="sentences" enterkeyhint="next"></div>
    <div class="field"><label class="eyebrow12">Jalons</label>
      ${d.milestones.map((m, i) => `<div class="ms-edit" data-key="me-${m.id}"><input type="text" data-ms="${i}" value="${esc(m.t)}" placeholder="Jalon ${i + 1}" autocomplete="off" autocapitalize="sentences" enterkeyhint="done"><div class="round-btn small press" data-act="removeMs" data-arg="${i}"><span class="x small"></span></div></div>`).join('')}
      <div class="link" data-act="addMs">+ Ajouter un jalon</div>
    </div>
    <div class="btn-primary${draftValid(d) ? ' on' : ''}" data-act="saveGoal">Enregistrer</div>
    ${isNew ? '' : '<div class="link muted danger" data-act="deleteGoal">Supprimer cet objectif</div>'}
  </div>`;
}

function checkinView() {
  const primary = primaryGoal();
  const moods = [
    { k: 'yes', title: 'Oui, j’ai avancé', sub: 'Même un petit pas compte', dot: 'var(--accent)' },
    { k: 'hold', title: 'J’ai tenu le cap', sub: 'Rien de nouveau, rien de perdu', dot: 'var(--ink6)' },
    { k: 'pause', title: 'Journée off', sub: 'Assumée, sans culpabilité', dot: 'var(--ink25)' }
  ];
  return `<div class="dim" data-key="dim" data-act="close"></div>
  <div class="sheet" data-key="ov-checkin">
    <div class="grab"></div>
    <div class="eyebrow accent" style="margin-top:24px">Check-in du soir</div>
    <div class="sheet-title display">As-tu avancé sur<br><em>${esc(primary ? primary.title : 'ton objectif')}</em> ?</div>
    <div class="moods">${moods.map((o, i) => `<div class="mood rise${U.mood === o.k ? ' on' : ''}" style="--d:${(0.1 + i * 0.07).toFixed(2)}s" data-act="pickMood" data-arg="${o.k}"><span class="mdot" style="background:${o.dot};box-shadow:${U.mood === o.k ? '0 0 12px ' + o.dot : 'none'}"></span><div><div class="mood-title">${o.title}</div><div class="mood-sub">${o.sub}</div></div></div>`).join('')}</div>
    <div class="btn-primary${U.mood ? ' on' : ''}" data-act="submitCheckin">Valider la journée</div>
  </div>`;
}

function focusView() {
  const t = timerState(), primary = primaryGoal();
  const mm = pad(Math.floor(t.left / 60)), ss = pad(t.left % 60);
  const btn = t.running ? 'Pause' : (t.left === 0 ? 'Recommencer' : (t.left === t.total ? 'Commencer' : 'Reprendre'));
  const hint = t.running ? 'Le téléphone peut attendre.' : (t.left === 0 ? 'Session terminée. Bien joué.' : 'Prêt quand tu l’es.');
  return `<div class="focus-ov" data-key="ov-focus">
    <div class="ov-head"><div class="round-btn press" data-act="close"><span class="x"></span></div><div class="date">Session focus</div><div style="width:40px"></div></div>
    <div class="focus-body">
      <div class="timer-wrap rise" style="--d:.1s">
        <div class="breathe" style="animation-play-state:${t.running ? 'running' : 'paused'}"></div>
        <svg width="280" height="280" viewBox="0 0 280 280"><circle class="ring-track" cx="140" cy="140" r="130" stroke-width="6" style="stroke:var(--w07)"></circle><circle class="ring-arc big" cx="140" cy="140" r="130" stroke-width="6" stroke-dasharray="817" stroke-dashoffset="${(817 * (1 - t.left / t.total)).toFixed(1)}"></circle></svg>
        <div class="timer-center"><div class="timer-label display">${mm}:${ss}</div><div class="timer-goal">${esc(primary ? primary.title : 'Session libre')}</div></div>
      </div>
      <div class="hint display rise" style="--d:.3s">${hint}</div>
    </div>
    <div class="timer-btns rise" style="--d:.4s"><div class="btn-accent press press-sm" data-act="toggleTimer">${btn}</div><div class="btn-ghost press" data-act="finishTimer">Terminer</div></div>
  </div>`;
}

/* ---------- morph DOM ---------- */
function morph(live, next) {
  if (live.nodeType !== next.nodeType || live.nodeName !== next.nodeName) { live.replaceWith(next); return; }
  if (live.nodeType === 3) { if (live.nodeValue !== next.nodeValue) live.nodeValue = next.nodeValue; return; }
  if (live.nodeType !== 1) return;
  for (const a of Array.from(live.attributes)) if (!next.hasAttribute(a.name)) live.removeAttribute(a.name);
  for (const a of Array.from(next.attributes)) if (live.getAttribute(a.name) !== a.value) live.setAttribute(a.name, a.value);
  if ((live.nodeName === 'INPUT' || live.nodeName === 'TEXTAREA') && document.activeElement !== live) {
    const v = next.value; if (live.value !== v) live.value = v;
  }
  morphChildren(live, next);
}
function morphChildren(live, next) {
  const keyOf = n => (n.nodeType === 1 && n.dataset && n.dataset.key) || null;
  const nextKeys = new Set();
  for (const c of next.childNodes) { const k = keyOf(c); if (k) nextKeys.add(k); }
  for (const c of Array.from(live.childNodes)) { const k = keyOf(c); if (k && !nextKeys.has(k)) c.remove(); }
  const keyed = new Map();
  for (const c of live.childNodes) { const k = keyOf(c); if (k) keyed.set(k, c); }
  const nc = Array.from(next.childNodes);
  for (let i = 0; i < nc.length; i++) {
    const n = nc[i], l = live.childNodes[i], k = keyOf(n);
    if (k) {
      const m = keyed.get(k);
      if (m) { if (m !== l) live.insertBefore(m, l || null); morph(m, n); }
      else live.insertBefore(n, l || null);
      continue;
    }
    if (!l) { live.appendChild(n); continue; }
    if (keyOf(l)) { live.insertBefore(n, l); continue; }
    morph(l, n);
  }
  while (live.childNodes.length > nc.length) live.lastChild.remove();
}

const app = document.getElementById('app');
function render() {
  const tpl = document.createElement('template');
  tpl.innerHTML = view().replace(/>\s+</g, '><').trim();
  morphChildren(app, tpl.content);
}

/* ---------- actions ---------- */
function openEditor(goal) {
  U.draft = goal
    ? { id: goal.id, title: goal.title, why: goal.why, deadline: goal.deadline, milestones: goal.milestones.map(m => ({ ...m })) }
    : { id: null, title: '', why: '', deadline: '', milestones: [{ id: uid(), t: '', d: false }] };
  U.overlay = 'editor';
}

const ACTIONS = {
  tab(k) { if (U.tab !== k) { U.tab = k; resetTweens(); } },
  openGoal(id) { U.activeId = id; U.overlay = 'detail'; },
  close() { U.overlay = null; U.draft = null; },
  pin() {
    const g = activeGoal(); if (!g) return;
    if (g.id !== S.primaryId) { S.primaryId = g.id; save(); showToast('Nouveau focus du jour'); }
  },
  toggleMs(id) {
    const g = activeGoal(); if (!g) return;
    const m = g.milestones.find(x => x.id === id); if (!m) return;
    m.d = !m.d; save();
    if (m.d && g.milestones.every(x => x.d)) showToast('Objectif atteint !');
  },
  newGoal() { if (S.goals.length >= MAX_GOALS) { showToast('Trois places, pas une de plus'); return; } openEditor(null); },
  editGoal() { const g = activeGoal(); if (g) openEditor(g); },
  deleteGoal() {
    const g = activeGoal(); if (!g) return;
    if (!confirm(`Supprimer « ${g.title} » ?`)) return;
    S.goals = S.goals.filter(x => x.id !== g.id);
    if (S.primaryId === g.id) S.primaryId = S.goals[0] ? S.goals[0].id : null;
    U.overlay = null; U.draft = null; U.activeId = null; save(); showToast('Objectif supprimé');
  },
  addMs() { if (U.draft) U.draft.milestones.push({ id: uid(), t: '', d: false }); },
  removeMs(i) { if (U.draft) U.draft.milestones.splice(Number(i), 1); },
  saveGoal() {
    const d = U.draft; if (!draftValid(d)) return;
    const clean = { title: d.title.trim(), why: d.why.trim(), deadline: d.deadline.trim(), milestones: d.milestones.filter(m => m.t.trim()).map(m => ({ id: m.id, t: m.t.trim(), d: m.d })) };
    if (d.id) {
      const g = S.goals.find(x => x.id === d.id); if (g) Object.assign(g, clean);
      U.overlay = 'detail'; U.activeId = d.id; showToast('Objectif mis à jour');
    } else {
      if (S.goals.length >= MAX_GOALS) return;
      const g = { id: uid(), ...clean }; S.goals.push(g);
      if (!S.primaryId) S.primaryId = g.id;
      U.overlay = null; U.tab = 'goals'; resetTweens(); showToast(S.goals.length === 1 ? 'Premier objectif posé' : 'Objectif ajouté');
    }
    U.draft = null; save();
  },
  loadSample() { S.goals = SAMPLE(); S.primaryId = S.goals[0].id; save(); showToast('Trois objectifs d’exemple'); },
  openFocus() {
    if (!S.timer.endAt && S.timer.remaining == null) S.timer.total = S.settings.focusMinutes * 60;
    U.overlay = 'focus';
  },
  toggleTimer() {
    const t = timerState();
    if (t.running) { S.timer = { total: t.total, remaining: t.left, endAt: null }; }
    else if (t.left === 0) { const total = S.settings.focusMinutes * 60; S.timer = { total, remaining: null, endAt: Date.now() + total * 1000 }; }
    else { S.timer = { total: t.total, remaining: null, endAt: Date.now() + t.left * 1000 }; }
    save();
  },
  finishTimer() {
    const t = timerState();
    const spent = Math.round((t.total - t.left) / 60);
    const started = t.left !== t.total || t.running;
    if (started) creditFocus(spent);
    S.timer = { total: S.settings.focusMinutes * 60, remaining: null, endAt: null };
    U.overlay = null; save();
    if (spent > 0) showToast(`+${spent} min de focus`);
  },
  openCheckin() { U.mood = S.checkins[dayKey()] || null; U.overlay = 'checkin'; },
  pickMood(k) { U.mood = k; },
  submitCheckin() {
    if (!U.mood) return;
    S.checkins[dayKey()] = U.mood; save();
    U.overlay = null;
    showToast(U.mood === 'pause' ? 'Journée off assumée' : `Série : ${plural(streak(), 'jour', 'jours')}`);
  },
  setTheme(t) { if (THEMES[t]) { S.settings.theme = t; save(); applyTheme(); } },
  setFocus(m) {
    m = Number(m); if (!DURATIONS.includes(m)) return;
    S.settings.focusMinutes = m;
    if (!S.timer.endAt && S.timer.remaining == null) S.timer.total = m * 60;
    save();
  },
  toggleStreak() { S.settings.showStreak = !S.settings.showStreak; save(); },
  exportData() {
    const data = JSON.stringify(S);
    const ok = () => showToast('Données copiées');
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(data).then(ok, () => showToast('Copie impossible'));
    else { try { prompt('Copie ces données :', data); } catch (e) { /* ignore */ } }
  },
  importData() {
    const raw = prompt('Colle ici une sauvegarde Focal :'); if (!raw) return;
    try { const parsed = JSON.parse(raw); if (!parsed || typeof parsed !== 'object') throw new Error('format'); S = normalize(parsed); save(); applyTheme(); resetTweens(); showToast('Données restaurées'); }
    catch (e) { showToast('Format invalide'); }
  }
};

app.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el || !app.contains(el)) return;
  const fn = ACTIONS[el.dataset.act];
  if (!fn) return;
  fn(el.dataset.arg, el);
  render();
});
app.addEventListener('input', e => {
  const el = e.target; if (!U.draft) return;
  if (el.dataset.field) U.draft[el.dataset.field] = el.value;
  else if (el.dataset.ms != null) { const m = U.draft.milestones[Number(el.dataset.ms)]; if (m) m.t = el.value; }
  else return;
  render();
});
app.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.matches('input[data-field], input[data-ms]')) { e.preventDefault(); e.target.blur(); }
});
document.addEventListener('touchstart', () => {}, { passive: true });

/* ---------- horloge ---------- */
function tick() {
  const t = timerState();
  if (S.timer.endAt && t.left === 0) { completeTimer(); render(); }
  else if (U.overlay === 'focus' || (t.running && U.tab === 'stats')) render();
}
setInterval(tick, 500);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { tick(); render(); } });

/* ---------- démarrage ---------- */
applyTheme();
render();
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').catch(() => {}); });
}
})();
