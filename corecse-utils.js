/* ═══════════════════════════════════════════════════════════════
   CoreCSE Shared Utilities
   - Theme toggle (dark/light)
   - Global search (Cmd/Ctrl+K)
   - Bookmarks
   - Pomodoro timer
   - PYQ scoring
   - GATE year auto-increment
   ═══════════════════════════════════════════════════════════════ */

/* ─── GATE Year Auto-Increment ──────────────────────────────── */
function getGateYear() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12
  // GATE happens in Feb. After Feb each year, target is next year.
  return month > 2 ? year + 1 : year;
}

function updateGateYears() {
  const year = getGateYear();
  document.querySelectorAll('[data-gate-year]').forEach(el => {
    el.textContent = el.dataset.gateYear.replace('{year}', year);
  });
  // Also replace text nodes containing the hardcoded year
  document.querySelectorAll('.gate-year-label').forEach(el => {
    el.textContent = year;
  });
}

/* ─── Theme Toggle ──────────────────────────────────────────── */
function initTheme() {
  const saved = localStorage.getItem('cc-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  applyTheme(theme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('cc-theme', theme);
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.title = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
}

function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme') || 'light';
  applyTheme(cur === 'dark' ? 'light' : 'dark');
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
  if (idx >= 0) {
    list.splice(idx, 1);
  } else {
    list.push({ id, label, subjectSlug, subjectName, savedAt: Date.now() });
  }
  saveBookmarks(list);
  return idx < 0; // true = added
}

function renderBookmarkDrawer() {
  const list = getBookmarks();
  const drawer = document.getElementById('bookmark-drawer');
  if (!drawer) return;
  if (!list.length) {
    drawer.querySelector('.bm-list').innerHTML = '<p style="font-size:13px;color:var(--muted,#999);padding:1rem 0;text-align:center;">No bookmarks yet.<br>Click the ★ on any topic to save it.</p>';
    return;
  }
  const bySubject = {};
  list.forEach(b => {
    if (!bySubject[b.subjectName]) bySubject[b.subjectName] = [];
    bySubject[b.subjectName].push(b);
  });
  let html = '';
  for (const [subj, items] of Object.entries(bySubject)) {
    html += `<div style="margin-bottom:.75rem"><div style="font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted,#999);margin-bottom:.4rem">${subj}</div>`;
    items.forEach(b => {
      html += `<a href="../subjects/${b.subjectSlug}.html#topic-${encodeURIComponent(b.id)}" style="display:flex;align-items:center;justify-content:space-between;padding:.4rem .5rem;border-radius:5px;font-size:13px;color:var(--text,#1a1a1a);text-decoration:none;border:1px solid var(--border,#e5e5e5);margin-bottom:.3rem;background:var(--bg,#fff)">
        <span>${b.label}</span>
        <button onclick="event.preventDefault();removeBM('${b.id}')" style="background:none;border:none;cursor:pointer;font-size:16px;color:var(--muted,#999);line-height:1" title="Remove">×</button>
      </a>`;
    });
    html += '</div>';
  }
  drawer.querySelector('.bm-list').innerHTML = html;
}

function removeBM(id) {
  let list = getBookmarks();
  list = list.filter(b => b.id !== id);
  saveBookmarks(list);
  renderBookmarkDrawer();
  const btn = document.querySelector(`[data-bm-id="${id}"]`);
  if (btn) { btn.textContent = '☆'; btn.classList.remove('bm-active'); }
}

function openBookmarkDrawer() {
  renderBookmarkDrawer();
  const overlay = document.getElementById('bm-overlay');
  const drawer = document.getElementById('bookmark-drawer');
  if (overlay) overlay.style.display = 'block';
  if (drawer) drawer.classList.add('open');
}

function closeBookmarkDrawer() {
  const overlay = document.getElementById('bm-overlay');
  const drawer = document.getElementById('bookmark-drawer');
  if (overlay) overlay.style.display = 'none';
  if (drawer) drawer.classList.remove('open');
}

/* ─── Global Search ─────────────────────────────────────────── */
const SEARCH_INDEX = [
  // OS
  {slug:'os',subject:'Operating Systems',topic:'Process Management',keywords:'pcb fork exec threads zombie orphan states'},
  {slug:'os',subject:'Operating Systems',topic:'CPU Scheduling',keywords:'fcfs sjf srtf round robin priority turnaround waiting'},
  {slug:'os',subject:'Operating Systems',topic:'Process Synchronization',keywords:'mutex semaphore peterson critical section deadlock monitors'},
  {slug:'os',subject:'Operating Systems',topic:'Deadlocks',keywords:"coffman banker's algorithm circular wait hold rag"},
  {slug:'os',subject:'Operating Systems',topic:'Memory Management',keywords:'paging tlb eat fragmentation page table frames'},
  {slug:'os',subject:'Operating Systems',topic:'Virtual Memory',keywords:'demand paging fifo lru opt belady thrashing page fault replacement'},
  {slug:'os',subject:'Operating Systems',topic:'File Systems',keywords:'inode allocation contiguous linked indexed disk scheduling'},
  {slug:'os',subject:'Operating Systems',topic:'I/O Systems',keywords:'dma interrupt polling spooling buffering'},
  {slug:'os',subject:'Operating Systems',topic:'Secondary Storage',keywords:'raid seek rotational latency ssd hdd'},
  {slug:'os',subject:'Operating Systems',topic:'Protection & Security',keywords:'acl capability access matrix ring'},
  // DS
  {slug:'ds',subject:'Data Structures',topic:'Arrays & Strings',keywords:'row major column major address sliding window prefix sum'},
  {slug:'ds',subject:'Data Structures',topic:'Linked Lists',keywords:"floyd's cycle detection reversal merge sorted middle"},
  {slug:'ds',subject:'Data Structures',topic:'Stacks & Queues',keywords:'infix postfix parentheses circular deque priority'},
  {slug:'ds',subject:'Data Structures',topic:'Trees & Binary Trees',keywords:'inorder preorder postorder catalan full complete perfect height'},
  {slug:'ds',subject:'Data Structures',topic:'Binary Search Trees',keywords:'search insert delete inorder successor catalan height'},
  {slug:'ds',subject:'Data Structures',topic:'AVL & Balanced Trees',keywords:'rotation ll rr lr rl balance factor minimum nodes'},
  {slug:'ds',subject:'Data Structures',topic:'Heaps',keywords:'min max heapify build heap sort d-ary priority queue'},
  {slug:'ds',subject:'Data Structures',topic:'Hashing',keywords:'chaining linear probing quadratic double hashing collision load factor'},
  {slug:'ds',subject:'Data Structures',topic:'Graphs',keywords:'bfs dfs topological scc bipartite kosaraju'},
  {slug:'ds',subject:'Data Structures',topic:'Segment & Fenwick Trees',keywords:'range query update lazy propagation bit binary indexed'},
  {slug:'ds',subject:'Data Structures',topic:'Tries',keywords:'prefix search autocomplete ip routing'},
  {slug:'ds',subject:'Data Structures',topic:'Disjoint Sets (Union-Find)',keywords:"kruskal's mst union rank path compression inverse ackermann"},
  // ALGO
  {slug:'algo',subject:'Algorithms',topic:'Asymptotic Analysis',keywords:'big o omega theta master theorem recurrence complexity'},
  {slug:'algo',subject:'Algorithms',topic:'Sorting Algorithms',keywords:'merge quick heap insertion counting radix bucket stability'},
  {slug:'algo',subject:'Algorithms',topic:'Searching',keywords:'binary search interpolation exponential ternary'},
  {slug:'algo',subject:'Algorithms',topic:'Divide & Conquer',keywords:'merge sort quick sort binary search recurrence'},
  {slug:'algo',subject:'Algorithms',topic:'Dynamic Programming',keywords:'lcs lis knapsack edit distance matrix chain optimal substructure'},
  {slug:'algo',subject:'Algorithms',topic:'Greedy Algorithms',keywords:'activity selection huffman fractional knapsack prim kruskal'},
  {slug:'algo',subject:'Algorithms',topic:'Graph Algorithms',keywords:'dijkstra bellman ford floyd warshall mst shortest path'},
  {slug:'algo',subject:'Algorithms',topic:'P, NP & Complexity',keywords:'np hard np complete reduction sat hamiltonian vertex cover'},
  {slug:'algo',subject:'Algorithms',topic:'Backtracking',keywords:'n queens graph coloring subset sum branch bound'},
  {slug:'algo',subject:'Algorithms',topic:'String Algorithms',keywords:'kmp rabin karp z-algorithm pattern matching failure function'},
  // DBMS
  {slug:'dbms',subject:'DBMS',topic:'Relational Model',keywords:'relational algebra sigma pi join division super candidate primary key'},
  {slug:'dbms',subject:'DBMS',topic:'SQL',keywords:'select where group by having join inner outer natural null'},
  {slug:'dbms',subject:'DBMS',topic:'Normalization',keywords:'1nf 2nf 3nf bcnf partial transitive dependency armstrong closure'},
  {slug:'dbms',subject:'DBMS',topic:'ER Modeling',keywords:'entity relationship weak cardinality participation mapping'},
  {slug:'dbms',subject:'DBMS',topic:'Transactions & ACID',keywords:'atomicity consistency isolation durability serializability conflict precedence'},
  {slug:'dbms',subject:'DBMS',topic:'Concurrency Control',keywords:'2pl two phase locking strict isolation levels dirty read phantom'},
  {slug:'dbms',subject:'DBMS',topic:'Indexing & Hashing',keywords:'dense sparse b+ tree multilevel order height'},
  {slug:'dbms',subject:'DBMS',topic:'Query Processing',keywords:'nested loop sort merge hash join cost disk io'},
  {slug:'dbms',subject:'DBMS',topic:'Recovery',keywords:'wal write ahead log undo redo aries checkpoint'},
  // CN
  {slug:'cn',subject:'Computer Networks',topic:'Network Models',keywords:'osi layers tcp ip application transport network data link physical'},
  {slug:'cn',subject:'Computer Networks',topic:'Data Link Layer',keywords:'arq efficiency stop wait go back n selective repeat crc sliding window'},
  {slug:'cn',subject:'Computer Networks',topic:'MAC & LAN',keywords:'csma cd ethernet collision hub switch router bridge domain'},
  {slug:'cn',subject:'Computer Networks',topic:'IP Addressing & Subnetting',keywords:'cidr vlsm private rfc1918 subnet mask hosts subnets'},
  {slug:'cn',subject:'Computer Networks',topic:'Routing',keywords:'rip ospf bgp distance vector link state convergence'},
  {slug:'cn',subject:'Computer Networks',topic:'Transport Layer',keywords:'tcp udp sliding window congestion slow start handshake'},
  {slug:'cn',subject:'Computer Networks',topic:'Application Layer',keywords:'dns http ftp smtp pop3 imap port'},
  {slug:'cn',subject:'Computer Networks',topic:'Network Security',keywords:'symmetric asymmetric rsa aes ssl tls encryption mac'},
  // TOC
  {slug:'toc',subject:'Theory of Computation',topic:'Regular Languages & DFA',keywords:'dfa nfa subset construction myhill nerode minimal'},
  {slug:'toc',subject:'Theory of Computation',topic:'Pumping Lemma',keywords:'pumping length non regular contradiction xyz'},
  {slug:'toc',subject:'Theory of Computation',topic:'Context-Free Grammars',keywords:'cfg cnf cyk ambiguity parse tree leftmost derivation'},
  {slug:'toc',subject:'Theory of Computation',topic:'Pushdown Automata',keywords:'pda dpda npda stack context free acceptance'},
  {slug:'toc',subject:'Theory of Computation',topic:'Turing Machines',keywords:'tm multi tape nondeterministic universal church turing'},
  {slug:'toc',subject:'Theory of Computation',topic:'Decidability',keywords:"halting problem undecidable rice's theorem re recursive semi"},
  {slug:'toc',subject:'Theory of Computation',topic:'Chomsky Hierarchy',keywords:'type 0 1 2 3 regular cfl csl unrestricted closure'},
  // DL
  {slug:'dl',subject:'Digital Logic',topic:'Number Systems',keywords:'binary hex bcd gray code 2s complement conversion'},
  {slug:'dl',subject:'Digital Logic',topic:'Boolean Algebra',keywords:"de morgan absorption consensus sop pos minterm maxterm"},
  {slug:'dl',subject:'Digital Logic',topic:'K-Map Minimization',keywords:'karnaugh prime implicant essential grouping don\'t care pos'},
  {slug:'dl',subject:'Digital Logic',topic:'Combinational Circuits',keywords:'half full adder ripple cla mux demux'},
  {slug:'dl',subject:'Digital Logic',topic:'Sequential Circuits',keywords:'dff jkff tff srff state machine excitation'},
  {slug:'dl',subject:'Digital Logic',topic:'Registers & Counters',keywords:'siso sipo piso pipo shift register mod ring counter'},
  {slug:'dl',subject:'Digital Logic',topic:'Logic Families',keywords:'ttl cmos noise margin fan out propagation delay'},
  // DM
  {slug:'dm',subject:'Discrete Mathematics',topic:'Mathematical Logic',keywords:'tautology contradiction modus ponens tollens implication contrapositive'},
  {slug:'dm',subject:'Discrete Mathematics',topic:'Set Theory',keywords:"de morgan inclusion exclusion power set venn"},
  {slug:'dm',subject:'Discrete Mathematics',topic:'Relations',keywords:'reflexive symmetric antisymmetric transitive equivalence poset'},
  {slug:'dm',subject:'Discrete Mathematics',topic:'Functions',keywords:'injective surjective bijective inverse pigeonhole'},
  {slug:'dm',subject:'Discrete Mathematics',topic:'Combinatorics',keywords:'permutation combination multinomial derangement binomial catalan'},
  {slug:'dm',subject:'Discrete Mathematics',topic:'Graph Theory',keywords:"euler hamilton planar coloring chromatic bipartite handshaking"},
  {slug:'dm',subject:'Discrete Mathematics',topic:'Number Theory',keywords:"gcd fermat euler's chinese remainder modular arithmetic"},
  {slug:'dm',subject:'Discrete Mathematics',topic:'Algebraic Structures',keywords:'group ring field monoid homomorphism isomorphism'},
  // COA
  {slug:'coa',subject:'CO & Architecture',topic:'Basic Computer Organization',keywords:'alu control unit register bus memory hierarchy'},
  {slug:'coa',subject:'CO & Architecture',topic:'Instruction Set Architecture',keywords:'isa risc cisc addressing modes instruction format'},
  {slug:'coa',subject:'CO & Architecture',topic:'Pipelining',keywords:'raw war waw hazard forwarding stall flush branch prediction stages'},
  {slug:'coa',subject:'CO & Architecture',topic:'Cache Memory',keywords:'amat hit miss direct mapped set associative fully associative block'},
  {slug:'coa',subject:'CO & Architecture',topic:'Memory Organization',keywords:'dram sram interleaving banks row column'},
  {slug:'coa',subject:'CO & Architecture',topic:'I/O Organization',keywords:'dma interrupt polling memory mapped io'},
  {slug:'coa',subject:'CO & Architecture',topic:'Performance Metrics',keywords:'speedup throughput cpi mips amdahl'},
  // CD
  {slug:'cd',subject:'Compiler Design',topic:'Lexical Analysis',keywords:'lex flex token regex scanner symbol table'},
  {slug:'cd',subject:'Compiler Design',topic:'Syntax Analysis (Parsing)',keywords:'ll1 lr0 slr clr lalr first follow parse table shift reduce'},
  {slug:'cd',subject:'Compiler Design',topic:'Syntax-Directed Translation',keywords:'sdt inherited synthesized attribute grammar'},
  {slug:'cd',subject:'Compiler Design',topic:'Intermediate Code Generation',keywords:'three address code dag quadruple triple tac'},
  {slug:'cd',subject:'Compiler Design',topic:'Code Optimization',keywords:'constant folding propagation dead code elimination loop cse'},
  {slug:'cd',subject:'Compiler Design',topic:'Code Generation & Runtime',keywords:'register allocation activation record stack frame calling convention'},
];

function searchTopics(query) {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  return SEARCH_INDEX.filter(item => {
    return item.topic.toLowerCase().includes(q) ||
           item.subject.toLowerCase().includes(q) ||
           item.keywords.toLowerCase().includes(q);
  }).slice(0, 8);
}

function openSearch() {
  const overlay = document.getElementById('search-overlay');
  if (!overlay) return;
  overlay.style.display = 'flex';
  setTimeout(() => document.getElementById('search-input')?.focus(), 50);
}

function closeSearch() {
  const overlay = document.getElementById('search-overlay');
  if (overlay) overlay.style.display = 'none';
  const inp = document.getElementById('search-input');
  if (inp) inp.value = '';
  const res = document.getElementById('search-results');
  if (res) res.innerHTML = '';
}

function handleSearchInput(val) {
  const res = document.getElementById('search-results');
  if (!res) return;
  const results = searchTopics(val);
  if (!val || !results.length) {
    res.innerHTML = val ? '<div class="sr-empty">No results found</div>' : '';
    return;
  }
  res.innerHTML = results.map(r => {
    const url = `subjects/${r.slug}.html#topic-${encodeURIComponent(r.topic)}`;
    return `<a class="sr-item" href="${url}" onclick="closeSearch()">
      <span class="sr-subject">${r.subject}</span>
      <span class="sr-topic">${highlight(r.topic, val)}</span>
    </a>`;
  }).join('');
}

function highlight(text, query) {
  const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'gi');
  return text.replace(re, '<mark>$1</mark>');
}

/* ─── Pomodoro Timer ────────────────────────────────────────── */
const POMO_DURATION = 25 * 60;
let pomoState = { running: false, remaining: POMO_DURATION, interval: null, topicId: null };

function getPomoCounts() {
  try { return JSON.parse(localStorage.getItem('cc-pomo') || '{}'); } catch { return {}; }
}

function savePomoCounts(counts) {
  localStorage.setItem('cc-pomo', JSON.stringify(counts));
}

function getPomoCount(topicId) {
  return getPomoCounts()[topicId] || 0;
}

function incrementPomo(topicId) {
  const counts = getPomoCounts();
  counts[topicId] = (counts[topicId] || 0) + 1;
  savePomoCounts(counts);
  return counts[topicId];
}

function pomoTick() {
  if (pomoState.remaining <= 0) {
    clearInterval(pomoState.interval);
    pomoState.running = false;
    const count = incrementPomo(pomoState.topicId);
    updatePomoDisplay(true, count);
    return;
  }
  pomoState.remaining--;
  updatePomoDisplay(false, getPomoCount(pomoState.topicId));
}

function updatePomoDisplay(done, count) {
  const displayEl = document.getElementById(`pomo-time-${pomoState.topicId}`);
  const btnEl = document.getElementById(`pomo-btn-${pomoState.topicId}`);
  const countEl = document.getElementById(`pomo-count-${pomoState.topicId}`);
  if (displayEl) {
    if (done) {
      displayEl.textContent = '🍅 Done!';
    } else {
      const m = Math.floor(pomoState.remaining / 60).toString().padStart(2,'0');
      const s = (pomoState.remaining % 60).toString().padStart(2,'0');
      displayEl.textContent = `${m}:${s}`;
    }
  }
  if (btnEl) btnEl.textContent = done ? 'Reset' : (pomoState.running ? 'Pause' : 'Resume');
  if (countEl) countEl.textContent = `🍅 × ${count}`;
}

function togglePomo(topicId) {
  if (pomoState.topicId && pomoState.topicId !== topicId) {
    clearInterval(pomoState.interval);
    pomoState = { running: false, remaining: POMO_DURATION, interval: null, topicId: null };
  }
  const displayEl = document.getElementById(`pomo-time-${topicId}`);
  // If done state, reset
  if (displayEl && displayEl.textContent === '🍅 Done!') {
    pomoState = { running: false, remaining: POMO_DURATION, interval: null, topicId };
    updatePomoDisplay(false, getPomoCount(topicId));
    return;
  }
  pomoState.topicId = topicId;
  if (pomoState.running) {
    clearInterval(pomoState.interval);
    pomoState.running = false;
  } else {
    if (pomoState.remaining === 0) pomoState.remaining = POMO_DURATION;
    pomoState.running = true;
    pomoState.interval = setInterval(pomoTick, 1000);
  }
  updatePomoDisplay(false, getPomoCount(topicId));
}

function resetPomo(topicId) {
  clearInterval(pomoState.interval);
  pomoState = { running: false, remaining: POMO_DURATION, interval: null, topicId };
  updatePomoDisplay(false, getPomoCount(topicId));
}

/* ─── PYQ Scoring ───────────────────────────────────────────── */
function getScores() {
  try { return JSON.parse(localStorage.getItem('cc-scores') || '{}'); } catch { return {}; }
}

function saveScore(topicKey, correct, total) {
  const s = getScores();
  s[topicKey] = { correct, total, pct: Math.round((correct/total)*100) };
  localStorage.setItem('cc-scores', JSON.stringify(s));
}

/* ─── Shared HTML Snippets ──────────────────────────────────── */
function buildThemeToggleBtn() {
  return `<button id="theme-toggle" onclick="toggleTheme()" style="background:none;border:1px solid var(--border,#e5e5e5);border-radius:7px;width:34px;height:34px;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;color:var(--text,#1a1a1a);transition:all .2s" title="Toggle theme" aria-label="Toggle dark/light mode">
    <span class="theme-icon">🌙</span>
  </button>`;
}

function buildSearchBtn() {
  return `<button onclick="openSearch()" style="background:none;border:1px solid var(--border,#e5e5e5);border-radius:7px;padding:0 10px;height:34px;cursor:pointer;font-size:12px;display:flex;align-items:center;gap:6px;color:var(--text2,#555);transition:all .2s" title="Search (Ctrl+K)" aria-label="Open search">
    <span>🔍</span><span>Search</span><kbd style="font-size:10px;background:var(--bg2,#f7f7f5);border:1px solid var(--border,#e5e5e5);border-radius:3px;padding:1px 4px">⌘K</kbd>
  </button>`;
}

function buildBookmarkBtn() {
  const count = getBookmarks().length;
  return `<button onclick="openBookmarkDrawer()" style="background:none;border:1px solid var(--border,#e5e5e5);border-radius:7px;padding:0 10px;height:34px;cursor:pointer;font-size:12px;display:flex;align-items:center;gap:5px;color:var(--text2,#555);transition:all .2s" title="Saved topics" aria-label="Open bookmarks">
    <span>★</span><span id="bm-count-badge">${count}</span>
  </button>`;
}

function buildSearchOverlay() {
  return `
  <div id="search-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;align-items:flex-start;justify-content:center;padding-top:80px" onclick="if(event.target===this)closeSearch()">
    <div style="background:var(--bg,#fff);border:1px solid var(--border,#e5e5e5);border-radius:12px;width:min(560px,90vw);overflow:hidden">
      <div style="display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid var(--border,#e5e5e5)">
        <span style="font-size:16px">🔍</span>
        <input id="search-input" type="text" placeholder="Search topics, algorithms, concepts…" autocomplete="off" oninput="handleSearchInput(this.value)" style="flex:1;border:none;outline:none;font-size:14px;background:transparent;color:var(--text,#1a1a1a)">
        <button onclick="closeSearch()" style="background:none;border:none;cursor:pointer;font-size:18px;color:var(--text3,#999)">×</button>
      </div>
      <div id="search-results" style="max-height:380px;overflow-y:auto;padding:6px 0"></div>
      <div style="padding:8px 16px;border-top:1px solid var(--border,#e5e5e5);font-size:11px;color:var(--text3,#999);display:flex;gap:12px">
        <span>↵ to open</span><span>Esc to close</span>
      </div>
    </div>
  </div>`;
}

function buildBookmarkDrawer() {
  return `
  <div id="bm-overlay" onclick="closeBookmarkDrawer()" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:9990"></div>
  <div id="bookmark-drawer" style="position:fixed;top:0;right:-320px;width:300px;height:100vh;background:var(--bg,#fff);border-left:1px solid var(--border,#e5e5e5);z-index:9991;transition:right .25s;overflow-y:auto;display:flex;flex-direction:column">
    <div style="padding:1rem;border-bottom:1px solid var(--border,#e5e5e5);display:flex;justify-content:space-between;align-items:center">
      <span style="font-size:14px;font-weight:600;color:var(--text,#1a1a1a)">★ Saved Topics</span>
      <button onclick="closeBookmarkDrawer()" style="background:none;border:none;cursor:pointer;font-size:20px;color:var(--text3,#999)">×</button>
    </div>
    <div class="bm-list" style="padding:1rem;flex:1;overflow-y:auto"></div>
  </div>`;
}

/* ─── Keyboard Shortcuts ────────────────────────────────────── */
function initKeyboard() {
  document.addEventListener('keydown', e => {
    const tag = document.activeElement?.tagName;
    const inInput = tag === 'INPUT' || tag === 'TEXTAREA';
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      openSearch();
    }
    if (e.key === 'Escape') {
      closeSearch();
      closeBookmarkDrawer();
    }
  });
}

/* ─── Theme Icon Sync ───────────────────────────────────────── */
function syncThemeIcon() {
  const theme = document.documentElement.getAttribute('data-theme') || 'light';
  document.querySelectorAll('.theme-icon').forEach(el => {
    el.textContent = theme === 'dark' ? '☀️' : '🌙';
  });
}

/* ─── Search Result Styles (injected once) ─────────────────── */
function injectSearchStyles() {
  if (document.getElementById('cc-search-styles')) return;
  const s = document.createElement('style');
  s.id = 'cc-search-styles';
  s.textContent = `
    .sr-item{display:flex;flex-direction:column;padding:10px 16px;text-decoration:none;color:var(--text,#1a1a1a);border-bottom:1px solid var(--border,#e5e5e5);transition:background .1s}
    .sr-item:hover,.sr-item:focus{background:var(--bg2,#f7f7f5)}
    .sr-subject{font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:var(--text3,#999);margin-bottom:2px}
    .sr-topic{font-size:14px}
    .sr-topic mark{background:rgba(24,95,165,.15);color:var(--blue,#185FA5);border-radius:2px;padding:0 1px}
    .sr-empty{padding:16px;font-size:13px;color:var(--text3,#999);text-align:center}
    #bookmark-drawer.open{right:0}
    [data-theme='dark'] .sr-topic mark{background:rgba(124,106,255,.25);color:#a29bfe}
  `;
  document.head.appendChild(s);
}

/* ─── Init All ──────────────────────────────────────────────── */
function initCoreCSE() {
  initTheme();
  injectSearchStyles();
  initKeyboard();
  syncThemeIcon();
  updateGateYears();
  // Sync theme icon whenever theme changes
  const observer = new MutationObserver(() => syncThemeIcon());
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

// Auto-init when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCoreCSE);
} else {
  initCoreCSE();
}
