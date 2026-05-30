/* ═══════════════════════════════════════════════════════════════
   CoreCSE Shared Utilities v2
   - Theme toggle (dark/light) — works on both light homepage & dark subject pages
   - Global search (Cmd/Ctrl+K) — 80+ topics indexed
   - Bookmarks — localStorage, slide-in drawer
   - Pomodoro timer — per topic, session count
   - PYQ scoring helpers
   - GATE year auto-increment
   ═══════════════════════════════════════════════════════════════ */

/* ─── GATE Year Auto-Increment ──────────────────────────────── */
function getGateYear() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return month > 2 ? year + 1 : year;
}

function updateGateYears() {
  document.querySelectorAll('.gate-year-label').forEach(el => {
    el.textContent = getGateYear();
  });
}

/* ─── Theme Toggle ──────────────────────────────────────────── */
function getDefaultTheme() {
  // Subject pages have data-theme="dark" set on <html> at parse time — respect that
  // Index page has data-theme="light" set — respect that too
  // localStorage overrides both
  const saved = localStorage.getItem('cc-theme');
  if (saved) return saved;
  return document.documentElement.getAttribute('data-theme') || 
         (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('cc-theme', theme);
  syncThemeIcon();
}

function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme') || 'dark';
  applyTheme(cur === 'dark' ? 'light' : 'dark');
}

function syncThemeIcon() {
  const theme = document.documentElement.getAttribute('data-theme') || 'dark';
  document.querySelectorAll('.theme-icon').forEach(el => {
    el.textContent = theme === 'dark' ? '☀️' : '🌙';
  });
}

function initTheme() {
  applyTheme(getDefaultTheme());
}

/* ─── Bookmarks ─────────────────────────────────────────────── */
function getBookmarks() {
  try { return JSON.parse(localStorage.getItem('cc-bookmarks') || '[]'); } catch { return []; }
}

function saveBookmarks(list) {
  localStorage.setItem('cc-bookmarks', JSON.stringify(list));
}

function isBookmarked(id) {
  return getBookmarks().some(b => b.id === id);
}

function toggleBookmark(id, label, subjectSlug, subjectName) {
  let list = getBookmarks();
  const idx = list.findIndex(b => b.id === id);
  if (idx >= 0) list.splice(idx, 1);
  else list.push({ id, label, subjectSlug, subjectName, savedAt: Date.now() });
  saveBookmarks(list);
  return idx < 0;
}

function removeBM(id) {
  saveBookmarks(getBookmarks().filter(b => b.id !== id));
  renderBookmarkDrawer();
  const btn = document.querySelector(`[data-bm-id="${id}"]`);
  if (btn) { btn.textContent = '☆'; btn.classList.remove('bm-active'); }
  const badge = document.getElementById('bm-count-badge');
  if (badge) badge.textContent = getBookmarks().length;
}

function renderBookmarkDrawer() {
  const listEl = document.querySelector('#bookmark-drawer .bm-list');
  if (!listEl) return;
  const list = getBookmarks();
  if (!list.length) {
    listEl.innerHTML = '<p style="font-size:13px;color:var(--muted,#999);padding:1rem 0;text-align:center;">No bookmarks yet.<br>Click the ★ on any topic to save it.</p>';
    return;
  }
  const bySubject = {};
  list.forEach(b => {
    if (!bySubject[b.subjectName]) bySubject[b.subjectName] = [];
    bySubject[b.subjectName].push(b);
  });
  let html = '';
  for (const [subj, items] of Object.entries(bySubject)) {
    html += `<div style="margin-bottom:.85rem">
      <div style="font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted,#999);margin-bottom:.4rem">${subj}</div>`;
    items.forEach(b => {
      const href = window.location.pathname.includes('/subjects/') 
        ? `${b.subjectSlug}.html#tc${b.id.split('-')[1] || ''}`
        : `subjects/${b.subjectSlug}.html#tc${b.id.split('-')[1] || ''}`;
      html += `<div style="display:flex;align-items:center;justify-content:space-between;padding:.4rem .5rem;border-radius:5px;font-size:13px;color:var(--text,#1a1a1a);border:1px solid var(--border,#e5e5e5);margin-bottom:.3rem;background:var(--surface,#f7f7f7)">
        <a href="${href}" onclick="closeBookmarkDrawer()" style="color:inherit;text-decoration:none;flex:1">${b.label}</a>
        <button onclick="removeBM('${b.id}')" style="background:none;border:none;cursor:pointer;font-size:16px;color:var(--muted,#999);line-height:1;padding:0 0 0 8px" title="Remove">×</button>
      </div>`;
    });
    html += '</div>';
  }
  listEl.innerHTML = html;
}

function openBookmarkDrawer() {
  renderBookmarkDrawer();
  document.getElementById('bm-overlay').style.display = 'block';
  document.getElementById('bookmark-drawer').classList.add('open');
}

function closeBookmarkDrawer() {
  const o = document.getElementById('bm-overlay');
  const d = document.getElementById('bookmark-drawer');
  if (o) o.style.display = 'none';
  if (d) d.classList.remove('open');
}

/* ─── Global Search ─────────────────────────────────────────── */
const SEARCH_INDEX = [
  {slug:'os',subject:'Operating Systems',topic:'Process Management',kw:'pcb fork exec threads zombie orphan states'},
  {slug:'os',subject:'Operating Systems',topic:'CPU Scheduling',kw:'fcfs sjf srtf round robin priority turnaround waiting'},
  {slug:'os',subject:'Operating Systems',topic:'Process Synchronization',kw:'mutex semaphore peterson critical section deadlock monitors'},
  {slug:'os',subject:'Operating Systems',topic:'Deadlocks',kw:"coffman banker's algorithm circular wait hold rag"},
  {slug:'os',subject:'Operating Systems',topic:'Memory Management',kw:'paging tlb eat fragmentation page table frames'},
  {slug:'os',subject:'Operating Systems',topic:'Virtual Memory',kw:'demand paging fifo lru opt belady thrashing page fault replacement'},
  {slug:'os',subject:'Operating Systems',topic:'File Systems',kw:'inode allocation contiguous linked indexed disk scheduling'},
  {slug:'os',subject:'Operating Systems',topic:'I/O Systems',kw:'dma interrupt polling spooling buffering'},
  {slug:'ds',subject:'Data Structures',topic:'Arrays & Strings',kw:'row major column major address sliding window prefix sum'},
  {slug:'ds',subject:'Data Structures',topic:'Linked Lists',kw:"floyd's cycle detection reversal merge sorted middle"},
  {slug:'ds',subject:'Data Structures',topic:'Stacks & Queues',kw:'infix postfix parentheses circular deque priority'},
  {slug:'ds',subject:'Data Structures',topic:'Trees & Binary Trees',kw:'inorder preorder postorder catalan full complete perfect height'},
  {slug:'ds',subject:'Data Structures',topic:'Binary Search Trees',kw:'search insert delete inorder successor catalan height'},
  {slug:'ds',subject:'Data Structures',topic:'AVL & Balanced Trees',kw:'rotation ll rr lr rl balance factor minimum nodes'},
  {slug:'ds',subject:'Data Structures',topic:'Heaps',kw:'min max heapify build heap sort d-ary priority queue'},
  {slug:'ds',subject:'Data Structures',topic:'Hashing',kw:'chaining linear probing quadratic double hashing collision load factor'},
  {slug:'ds',subject:'Data Structures',topic:'Graphs',kw:'bfs dfs topological scc bipartite kosaraju'},
  {slug:'algo',subject:'Algorithms',topic:'Asymptotic Analysis',kw:'big o omega theta master theorem recurrence complexity'},
  {slug:'algo',subject:'Algorithms',topic:'Sorting Algorithms',kw:'merge quick heap insertion counting radix bucket stability'},
  {slug:'algo',subject:'Algorithms',topic:'Divide & Conquer',kw:'merge sort quick sort binary search recurrence'},
  {slug:'algo',subject:'Algorithms',topic:'Dynamic Programming',kw:'lcs lis knapsack edit distance matrix chain optimal substructure'},
  {slug:'algo',subject:'Algorithms',topic:'Greedy Algorithms',kw:'activity selection huffman fractional knapsack prim kruskal'},
  {slug:'algo',subject:'Algorithms',topic:'Graph Algorithms',kw:'dijkstra bellman ford floyd warshall mst shortest path'},
  {slug:'algo',subject:'Algorithms',topic:'P, NP & Complexity',kw:'np hard np complete reduction sat hamiltonian vertex cover'},
  {slug:'algo',subject:'Algorithms',topic:'String Algorithms',kw:'kmp rabin karp z-algorithm pattern matching failure function'},
  {slug:'dbms',subject:'DBMS',topic:'Relational Model',kw:'relational algebra sigma pi join division super candidate primary key'},
  {slug:'dbms',subject:'DBMS',topic:'SQL',kw:'select where group by having join inner outer natural null'},
  {slug:'dbms',subject:'DBMS',topic:'Normalization',kw:'1nf 2nf 3nf bcnf partial transitive dependency armstrong closure'},
  {slug:'dbms',subject:'DBMS',topic:'ER Modeling',kw:'entity relationship weak cardinality participation mapping'},
  {slug:'dbms',subject:'DBMS',topic:'Transactions & ACID',kw:'atomicity consistency isolation durability serializability conflict precedence'},
  {slug:'dbms',subject:'DBMS',topic:'Concurrency Control',kw:'2pl two phase locking strict isolation levels dirty read phantom'},
  {slug:'dbms',subject:'DBMS',topic:'Indexing & Hashing',kw:'dense sparse b+ tree multilevel order height'},
  {slug:'dbms',subject:'DBMS',topic:'Query Processing',kw:'nested loop sort merge hash join cost disk io'},
  {slug:'cn',subject:'Computer Networks',topic:'Network Models',kw:'osi layers tcp ip application transport network data link physical'},
  {slug:'cn',subject:'Computer Networks',topic:'Data Link Layer',kw:'arq efficiency stop wait go back n selective repeat crc sliding window'},
  {slug:'cn',subject:'Computer Networks',topic:'IP Addressing & Subnetting',kw:'cidr vlsm private rfc1918 subnet mask hosts subnets'},
  {slug:'cn',subject:'Computer Networks',topic:'Routing',kw:'rip ospf bgp distance vector link state convergence'},
  {slug:'cn',subject:'Computer Networks',topic:'Transport Layer',kw:'tcp udp sliding window congestion slow start handshake'},
  {slug:'cn',subject:'Computer Networks',topic:'Application Layer',kw:'dns http ftp smtp pop3 imap port'},
  {slug:'toc',subject:'Theory of Computation',topic:'Regular Languages & DFA',kw:'dfa nfa subset construction myhill nerode minimal'},
  {slug:'toc',subject:'Theory of Computation',topic:'Context-Free Grammars',kw:'cfg cnf cyk ambiguity parse tree leftmost derivation'},
  {slug:'toc',subject:'Theory of Computation',topic:'Pushdown Automata',kw:'pda dpda npda stack context free acceptance'},
  {slug:'toc',subject:'Theory of Computation',topic:'Turing Machines',kw:'tm multi tape nondeterministic universal church turing'},
  {slug:'toc',subject:'Theory of Computation',topic:'Decidability',kw:"halting problem undecidable rice's theorem re recursive semi"},
  {slug:'dl',subject:'Digital Logic',topic:'Number Systems',kw:'binary hex bcd gray code 2s complement conversion'},
  {slug:'dl',subject:'Digital Logic',topic:'Boolean Algebra',kw:"de morgan absorption consensus sop pos minterm maxterm"},
  {slug:'dl',subject:'Digital Logic',topic:'K-Map Minimization',kw:"karnaugh prime implicant essential grouping don't care pos"},
  {slug:'dl',subject:'Digital Logic',topic:'Combinational Circuits',kw:'half full adder ripple cla mux demux'},
  {slug:'dl',subject:'Digital Logic',topic:'Sequential Circuits',kw:'dff jkff tff srff state machine excitation'},
  {slug:'dm',subject:'Discrete Mathematics',topic:'Mathematical Logic',kw:'tautology contradiction modus ponens tollens implication contrapositive'},
  {slug:'dm',subject:'Discrete Mathematics',topic:'Set Theory',kw:"de morgan inclusion exclusion power set venn"},
  {slug:'dm',subject:'Discrete Mathematics',topic:'Relations',kw:'reflexive symmetric antisymmetric transitive equivalence poset'},
  {slug:'dm',subject:'Discrete Mathematics',topic:'Combinatorics',kw:'permutation combination multinomial derangement binomial catalan'},
  {slug:'dm',subject:'Discrete Mathematics',topic:'Graph Theory',kw:"euler hamilton planar coloring chromatic bipartite handshaking"},
  {slug:'dm',subject:'Discrete Mathematics',topic:'Number Theory',kw:"gcd fermat euler's chinese remainder modular arithmetic"},
  {slug:'coa',subject:'CO & Architecture',topic:'Pipelining',kw:'raw war waw hazard forwarding stall flush branch prediction stages'},
  {slug:'coa',subject:'CO & Architecture',topic:'Cache Memory',kw:'amat hit miss direct mapped set associative fully associative block'},
  {slug:'coa',subject:'CO & Architecture',topic:'Memory Organization',kw:'dram sram interleaving banks row column'},
  {slug:'coa',subject:'CO & Architecture',topic:'I/O Organization',kw:'dma interrupt polling memory mapped io'},
  {slug:'coa',subject:'CO & Architecture',topic:'Performance Metrics',kw:'speedup throughput cpi mips amdahl'},
  {slug:'cd',subject:'Compiler Design',topic:'Lexical Analysis',kw:'lex flex token regex scanner symbol table'},
  {slug:'cd',subject:'Compiler Design',topic:'Syntax Analysis (Parsing)',kw:'ll1 lr0 slr clr lalr first follow parse table shift reduce'},
  {slug:'cd',subject:'Compiler Design',topic:'Intermediate Code Generation',kw:'three address code dag quadruple triple tac'},
  {slug:'cd',subject:'Compiler Design',topic:'Code Optimization',kw:'constant folding propagation dead code elimination loop cse'},
];

function searchTopics(query) {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  return SEARCH_INDEX.filter(item =>
    item.topic.toLowerCase().includes(q) ||
    item.subject.toLowerCase().includes(q) ||
    item.kw.toLowerCase().includes(q)
  ).slice(0, 8);
}

function openSearch() {
  document.getElementById('search-overlay').style.display = 'flex';
  setTimeout(() => document.getElementById('search-input')?.focus(), 30);
}

function closeSearch() {
  document.getElementById('search-overlay').style.display = 'none';
  const inp = document.getElementById('search-input');
  if (inp) inp.value = '';
  const res = document.getElementById('search-results');
  if (res) res.innerHTML = '';
}

function handleSearchInput(val) {
  const res = document.getElementById('search-results');
  if (!res) return;
  const results = searchTopics(val);
  if (!val) { res.innerHTML = ''; return; }
  if (!results.length) { res.innerHTML = '<div style="padding:14px 16px;font-size:13px;color:var(--muted,#999);text-align:center">No results found</div>'; return; }

  const isSubjectPage = window.location.pathname.includes('/subjects/');
  res.innerHTML = results.map(r => {
    const url = isSubjectPage ? `${r.slug}.html` : `subjects/${r.slug}.html`;
    const q = val.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const highlighted = r.topic.replace(new RegExp(`(${q})`, 'gi'), '<mark style="background:rgba(124,106,255,.2);color:var(--accent,#7c6aff);border-radius:2px;padding:0 1px">$1</mark>');
    return `<a href="${url}" onclick="closeSearch()" style="display:flex;flex-direction:column;padding:9px 16px;text-decoration:none;color:var(--text,#e8e8f0);border-bottom:1px solid var(--border,#2a2a3d);transition:background .1s" onmouseover="this.style.background='var(--surface2,#1a1a26)'" onmouseout="this.style.background=''">
      <span style="font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:var(--muted,#6b6b8a);margin-bottom:2px">${r.subject}</span>
      <span style="font-size:13px">${highlighted}</span>
    </a>`;
  }).join('');
}

/* ─── Pomodoro Timer ────────────────────────────────────────── */
const POMO_DURATION = 25 * 60;
let pomoState = { running: false, remaining: POMO_DURATION, interval: null, topicId: null };

function getPomoCounts() {
  try { return JSON.parse(localStorage.getItem('cc-pomo') || '{}'); } catch { return {}; }
}

function getPomoCount(topicId) {
  return getPomoCounts()[topicId] || 0;
}

function incrementPomo(topicId) {
  const counts = getPomoCounts();
  counts[topicId] = (counts[topicId] || 0) + 1;
  localStorage.setItem('cc-pomo', JSON.stringify(counts));
  return counts[topicId];
}

function _pomoTick() {
  if (pomoState.remaining <= 0) {
    clearInterval(pomoState.interval);
    pomoState.running = false;
    const count = incrementPomo(pomoState.topicId);
    _updatePomoDisplay(true, count);
    return;
  }
  pomoState.remaining--;
  _updatePomoDisplay(false, getPomoCount(pomoState.topicId));
}

function _updatePomoDisplay(done, count) {
  const tid = pomoState.topicId;
  const timeEl  = document.getElementById(`pomo-time-${tid}`);
  const btnEl   = document.getElementById(`pomo-btn-${tid}`);
  const countEl = document.getElementById(`pomo-count-${tid}`);
  if (timeEl) {
    if (done) { timeEl.textContent = '🍅 Done!'; }
    else {
      const m = Math.floor(pomoState.remaining / 60).toString().padStart(2,'0');
      const s = (pomoState.remaining % 60).toString().padStart(2,'0');
      timeEl.textContent = `${m}:${s}`;
    }
  }
  if (btnEl) btnEl.textContent = done ? 'Reset' : (pomoState.running ? 'Pause' : 'Resume');
  if (countEl) countEl.textContent = `🍅 ×${count}`;
}

function togglePomo(topicId) {
  // If switching topics, reset old
  if (pomoState.topicId && pomoState.topicId !== topicId) {
    clearInterval(pomoState.interval);
    pomoState = { running: false, remaining: POMO_DURATION, interval: null, topicId: null };
  }
  const timeEl = document.getElementById(`pomo-time-${topicId}`);
  // Reset if done
  if (timeEl && timeEl.textContent === '🍅 Done!') {
    pomoState = { running: false, remaining: POMO_DURATION, interval: null, topicId };
    _updatePomoDisplay(false, getPomoCount(topicId));
    return;
  }
  pomoState.topicId = topicId;
  if (pomoState.running) {
    clearInterval(pomoState.interval);
    pomoState.running = false;
  } else {
    if (pomoState.remaining <= 0) pomoState.remaining = POMO_DURATION;
    pomoState.running = true;
    pomoState.interval = setInterval(_pomoTick, 1000);
  }
  _updatePomoDisplay(false, getPomoCount(topicId));
}

function resetPomo(topicId) {
  clearInterval(pomoState.interval);
  pomoState = { running: false, remaining: POMO_DURATION, interval: null, topicId };
  _updatePomoDisplay(false, getPomoCount(topicId));
}

/* ─── Keyboard Shortcuts ────────────────────────────────────── */
function initKeyboard() {
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault(); openSearch();
    }
    if (e.key === 'Escape') { closeSearch(); closeBookmarkDrawer(); }
  });
}

/* ─── Inject Search Styles ──────────────────────────────────── */
function injectStyles() {
  if (document.getElementById('cc-injected-styles')) return;
  const s = document.createElement('style');
  s.id = 'cc-injected-styles';
  s.textContent = `
    #bookmark-drawer { position:fixed;top:0;right:-320px;width:290px;height:100vh;background:var(--bg,#fff);border-left:1px solid var(--border,#e5e5e5);z-index:9991;transition:right .25s;overflow-y:auto;display:flex;flex-direction:column; }
    #bookmark-drawer.open { right:0; }
    .pomo-widget { display:flex;align-items:center;gap:8px;padding:.4rem .75rem;margin:.5rem 0 .75rem;background:var(--surface2,#1a1a26);border:1px solid var(--border,#2a2a3d);border-radius:6px;font-size:12px; }
    .pomo-time { font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:700;color:var(--accent,#7c6aff);min-width:50px; }
    .pomo-btn { font-size:11px;padding:3px 10px;border:1px solid var(--border,#2a2a3d);border-radius:4px;background:none;cursor:pointer;color:var(--muted,#6b6b8a);transition:all .15s; }
    .pomo-btn:hover { border-color:var(--accent,#7c6aff);color:var(--accent,#7c6aff); }
    .pomo-reset { font-size:11px;padding:3px 8px;border:1px solid var(--border,#2a2a3d);border-radius:4px;background:none;cursor:pointer;color:var(--muted,#6b6b8a); }
    .pomo-count { font-size:11px;color:var(--muted,#6b6b8a);margin-left:auto; }
    .bm-star { background:none;border:none;cursor:pointer;font-size:15px;color:var(--muted,#6b6b8a);padding:0 2px;transition:color .15s;line-height:1; }
    .bm-star:hover,.bm-star.bm-active { color:#f9ca24; }
    .pyq-score-bar { margin-top:.6rem;padding:.5rem .75rem;border-radius:5px;font-size:12px;font-weight:500;display:none; }
    .pyq-score-bar.show { display:flex;align-items:center;gap:6px; }
    .pyq-score-bar.good { background:rgba(79,255,176,.1);color:#4fffb0; }
    .pyq-score-bar.avg  { background:rgba(255,209,102,.1);color:#ffd166; }
    .pyq-score-bar.low  { background:rgba(124,106,255,.12);color:#a29bfe; }
    .opt.correct-reveal { color:#4fffb0 !important;font-weight:600; }
    .opt.wrong-reveal   { color:#ff6a6a !important; }
  `;
  document.head.appendChild(s);
}

/* ─── Init ──────────────────────────────────────────────────── */
function initCoreCSE() {
  initTheme();
  injectStyles();
  initKeyboard();
  updateGateYears();
  // Update bookmark badge
  const badge = document.getElementById('bm-count-badge');
  if (badge) badge.textContent = getBookmarks().length;
}

// Run as early as possible (theme must apply before paint to avoid flash)
if (document.readyState === 'loading') {
  // Apply theme immediately (before DOM ready) to prevent flash
  (function() {
    const saved = localStorage.getItem('cc-theme');
    const htmlTheme = document.currentScript?.closest('html')?.getAttribute('data-theme') || 'dark';
    if (saved && saved !== htmlTheme) {
      document.documentElement.setAttribute('data-theme', saved);
    }
  })();
  document.addEventListener('DOMContentLoaded', initCoreCSE);
} else {
  initCoreCSE();
}
