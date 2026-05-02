// Supabase functions tersedia via window._SB (diload oleh module script di head)
// Semua fungsi diakses sebagai: window._SB.getCurrentUser(), dll
 
// User yang sedang login (diisi saat init)
let CURRENT_USER = null
let CURRENT_PROFILE = null
 
// ============================
// GLOBAL CONSTANTS
// ============================
const fileIcons = {image:'fas fa-image',video:'fas fa-file-video',pdf:'fas fa-file-pdf',doc:'fas fa-file-word',docx:'fas fa-file-word'};
 
// ============================
// DEFAULT CATEGORIES (fallback jika Supabase kosong)
// ============================
const DEFAULT_CATEGORIES = [
  { id:'cat-tech',   name:'Tech',    slug:'tech',    icon:'fas fa-microchip',     iconUrl:'' },
  { id:'cat-politik',name:'Politik', slug:'politik', icon:'fas fa-landmark',      iconUrl:'' },
  { id:'cat-uiux',   name:'UI/UX',   slug:'uiux',    icon:'fas fa-pen-nib',       iconUrl:'' },
  { id:'cat-cyber',  name:'Cyber',   slug:'cyber',   icon:'fas fa-shield-halved', iconUrl:'' },
  { id:'cat-game',   name:'Game',    slug:'game',    icon:'fas fa-gamepad',       iconUrl:'' },
];
 
// ============================
// DATABASE (localStorage cache + Supabase)
// ============================
const DB = {
  get(key) { try { return JSON.parse(localStorage.getItem('nissanex_'+key)) || null; } catch(e){ return null; } },
  set(key, val) { localStorage.setItem('nissanex_'+key, JSON.stringify(val)); },
  getArr(key) { return this.get(key) || []; },
  pushArr(key, item) { const arr = this.getArr(key); arr.unshift(item); this.set(key, arr); return arr; },
  uuid() { return crypto.randomUUID(); },
 
  async fetchCategories() {
    try {
      const data = await window._SB.getCategories(CURRENT_USER.id)
      const mapped = data.map(c => ({
        id: c.id, name: c.title, slug: c.title?.toLowerCase(),
        icon: c.icon || 'fas fa-folder', iconUrl: c.file_url || ''
      }))
      // Pakai data Supabase kalau ada, fallback ke DEFAULT_CATEGORIES kalau kosong
      const final = mapped.length > 0 ? mapped : DEFAULT_CATEGORIES
      this.set('categories', final)
      return final
    } catch(e) {
      this.set('categories', DEFAULT_CATEGORIES)
      return DEFAULT_CATEGORIES
    }
  },
 
  async fetchContents() {
    if (!CURRENT_USER) return []
    try {
      const data = await window._SB.getContents(CURRENT_USER.id)
      const mapped = data.map(c => ({
        id: c.id, userId: c.user_id, categoryId: c.category_id,
        title: c.name, description: c.description,
        fileType: c.icon_type || 'doc', thumbUrl: c.preview_image || '',
        views: 0, likes: 0, bookmarked: false,
        createdAt: c.created_at
      }))
      this.set('contents', mapped)
      return mapped
    } catch(e) { return this.getArr('contents') }
  },
 
  async fetchPosts() {
    try {
      const data = await window._SB.getPosts()
      const mapped = data.map(p => ({
        id: p.id, userId: p.user_id,
        userName: p.users?.username || 'Pengguna',
        content: p.content, likes: 0, comments: 0, shares: 0,
        createdAt: p.created_at
      }))
      this.set('discussions', mapped)
      return mapped
    } catch(e) { return this.getArr('discussions') }
  },
 
  async fetchSaves() {
    if (!CURRENT_USER) return []
    try {
      const data = await window._SB.getSaves(CURRENT_USER.id)
      this.set('saves', data)
      return data
    } catch(e) { return this.getArr('saves') }
  }
};
 
// ============================
// INIT & SEED (Supabase)
// ============================
async function init() {
  // Tunggu module Supabase siap
  if (!window._SB_READY) {
    window._pendingInit = init
    return
  }
  try {
    CURRENT_USER = await window._SB.getCurrentUser()
  } catch(e) {
    CURRENT_USER = null
  }
  if (!CURRENT_USER) {
    // Jika belum login, tetap render dengan data lokal (dev mode)
    await seedDataSupabase()
    renderBeranda()
    return
  }
  try {
    CURRENT_PROFILE = await window._SB.getProfile(CURRENT_USER.id)
  } catch(e) {
    CURRENT_PROFILE = null
  }
  await seedDataSupabase()
  renderBeranda()
}
 
async function seedDataSupabase() {
  await DB.fetchCategories()
  await DB.fetchContents()
  await DB.fetchPosts()
  await DB.fetchSaves()
 
  if (CURRENT_PROFILE) {
    DB.set('user_profile', {
      name: CURRENT_PROFILE.username,
      username: CURRENT_PROFILE.username,
      bio: CURRENT_PROFILE.bio || '',
      location: CURRENT_PROFILE.location || '',
      occupation: CURRENT_PROFILE.occupation || '',
      techStack: CURRENT_PROFILE.tech_stack || '',
      interests: CURRENT_PROFILE.interests || '',
      avatarUrl: CURRENT_PROFILE.avatar_url || '',
      coverUrl: CURRENT_PROFILE.cover_url || '',
      followers: 0, following: 0,
    })
  }
 
  // Keep projects & linkwebs in localStorage if not yet seeded
  if (!DB.get('projects')) {
    DB.set('projects', [
      {id:'p1',userId:'u1',name:'OYBook Platform',description:'Web Novel Platform',deployUrl:'https://oybook.vercel.app',techStack:'Next.js, Supabase',status:'live',visitCount:1245,performanceScore:95,uptimePercent:99,lastDeployed: new Date(Date.now()-86400000*2).toISOString()},
      {id:'p2',userId:'u1',name:'Portfolio Website',description:'Dark Luxury Design',deployUrl:'https://sanpelong.dev',techStack:'HTML/CSS/JS',status:'live',visitCount:532,performanceScore:88,uptimePercent:98,lastDeployed: new Date(Date.now()-86400000*7).toISOString()},
      {id:'p3',userId:'u1',name:'Rangership Game',description:'Space Flight Simulator',deployUrl:'',techStack:'Godot 4, GDScript',status:'development',visitCount:0,performanceScore:72,uptimePercent:0,lastDeployed:null},
    ])
  }
  if (!DB.get('linkwebs')) {
    DB.set('linkwebs', [
      {id:'lk1',userId:'u1',categoryId:'cat-tech',title:'OYBook Platform',url:'https://oybook.vercel.app',description:'Platform web novel dengan monetisasi',iconUrl:'',status:'active',bookmarked:false,createdAt:new Date(Date.now()-86400000).toISOString()},
      {id:'lk2',userId:'u1',categoryId:'cat-uiux',title:'Portfolio Website',url:'https://sanpelong.dev',description:'Dark luxury personal site',iconUrl:'',status:'active',bookmarked:false,createdAt:new Date(Date.now()-86400000*3).toISOString()},
    ])
  }
}
 
// Legacy seedData (tidak lagi digunakan, digantikan init())
function seedData() { /* no-op — data dimuat dari Supabase via init() */ }
 
// ============================
// TEMP FILE STORAGE
// ============================
let tempFiles = { main:null, thumb:null, linkIcon:null };
 
// ============================
// NAVIGATION
// ============================
function navigateTo(pageId) {
  document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-'+pageId);
  if (target) target.classList.add('active');
  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.remove('active');
    if (l.dataset.page === pageId) l.classList.add('active');
  });
  if (window.innerWidth < 1024) {
    document.getElementById('sidebar').classList.add('-translate-x-full');
    document.getElementById('overlay').classList.add('hidden');
  }
  window.scrollTo({top:0,behavior:'smooth'});
  renderPage(pageId);
}
 
function renderPage(pageId) {
  const map = {
    beranda: renderBeranda,
    kategori: renderKategori,
    tren: renderTren,
    disimpan: renderDisimpan,
    diskusi: renderDiskusi,
    analyst: renderAnalyst,
    profil: renderProfil,
    pengaturan: renderPengaturan,
  };
  if (map[pageId]) map[pageId]();
}
 
function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('overlay');
  sb.classList.toggle('-translate-x-full');
  ov.classList.toggle('hidden');
}
 
// ============================
// RENDER FUNCTIONS
// ============================
 
// SVG inline per kategori — tidak bergantung Font Awesome
const CAT_SVG = {
  'cat-tech': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-10 h-10"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><path d="M6 8h.01M10 8h4"/></svg>`,
  'cat-politik': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-10 h-10"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 10v5M12 10v5M16 10v5"/></svg>`,
  'cat-uiux': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-10 h-10"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M9 21V9"/></svg>`,
  'cat-cyber': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-10 h-10"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>`,
  'cat-game': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-10 h-10"><rect x="2" y="6" width="20" height="12" rx="4"/><path d="M6 12h4M8 10v4M15 11h.01M17 13h.01"/></svg>`,
};
 
function getCatSvg(cat) {
  if (CAT_SVG[cat.id]) return CAT_SVG[cat.id];
  // fallback generic svg
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-10 h-10"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18"/></svg>`;
}
 
const CAT_GRADIENT = {
  'cat-tech':    'from-blue-600 to-blue-900',
  'cat-politik': 'from-red-600 to-red-900',
  'cat-uiux':    'from-purple-600 to-purple-900',
  'cat-cyber':   'from-emerald-600 to-emerald-900',
  'cat-game':    'from-orange-500 to-orange-900',
};
 
function renderBeranda() {
  // Category icons
  const cats = DB.getArr('categories').length > 0 ? DB.getArr('categories') : DEFAULT_CATEGORIES;
  const iconGrid = document.getElementById('category-icons');
  iconGrid.innerHTML = cats.map(c => {
    const grad = CAT_GRADIENT[c.id] || 'from-zinc-700 to-zinc-900';
    return `
    <div onclick="navigateTo('kategori')"
      class="cursor-pointer rounded-2xl bg-gradient-to-br ${grad} shadow-lg hover:scale-105 hover:shadow-xl active:scale-95 transition-all select-none overflow-hidden"
      style="min-height:120px;">
      <div class="flex flex-col items-center justify-center gap-3 w-full h-full p-4 text-white" style="min-height:120px;">
        ${c.iconUrl
          ? `<img src="${c.iconUrl}" class="w-10 h-10 object-cover rounded-xl">`
          : getCatSvg(c)}
        <span class="text-sm font-bold tracking-wide drop-shadow">${c.name}</span>
      </div>
    </div>`;
  }).join('');
 
  // Content grid
  const contents = DB.getArr('contents');
  const grid = document.getElementById('beranda-content-grid');
  if (!contents.length) {
    grid.innerHTML = `<div class="col-span-6 text-center py-12 text-gray-400"><i class="fas fa-folder-open text-4xl mb-3 block text-gray-200"></i><p>Belum ada konten. Upload pertama Anda!</p></div>`;
    return;
  }
  grid.innerHTML = contents.slice(0,6).map(c => contentCard(c)).join('');
}
 
function contentCard(c) {
  const fileIcons = {image:'fas fa-image',video:'fas fa-video',pdf:'fas fa-file-pdf',doc:'fas fa-file-word',docx:'fas fa-file-word'};
  const fileIcon = fileIcons[c.fileType] || 'fas fa-file';
  return `
    <div>
      <!-- Card - hanya thumbnail -->
      <div class="content-card group cursor-pointer" onclick="showContentDetail('${c.id}')" onmouseenter="showCardDesc(this)" onmouseleave="hideCardDesc(this)">
        <div class="content-thumb bg-zinc-900 relative">
          ${c.thumbUrl ? `<img src="${c.thumbUrl}" class="w-full h-full object-cover absolute inset-0">` : ''}
          <div class="absolute inset-0 flex items-center justify-center">
            <i class="${fileIcon} text-3xl ${c.thumbUrl?'opacity-0 group-hover:opacity-60':'opacity-40'} transition text-white"></i>
          </div>
          <div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center">
            <i class="fas fa-eye text-white opacity-0 group-hover:opacity-100 transition text-3xl"></i>
          </div>
          <button onclick="event.stopPropagation();toggleBookmark('${c.id}')" class="absolute top-2 right-2 w-8 h-8 rounded-lg bg-black/50 flex items-center justify-center text-white text-sm hover:bg-black transition">
            <i class="${c.bookmarked?'fas':'far'} fa-bookmark"></i>
          </button>
        </div>
        
        <!-- Description Overlay - INSIDE card, muncul saat hover -->
        <div class="content-desc-overlay">
          <p>${c.description || 'Tidak ada deskripsi'}</p>
        </div>
      </div>
      
      <!-- Title & Stats - OUTSIDE card -->
      <div class="content-info">
        <h3 title="${c.title}">${c.title}</h3>
        <p>${c.views} views · ${c.likes} suka</p>
      </div>
    </div>
  `;
}
 
function renderKategori() {
  const cats = DB.getArr('categories');
  const pills = document.getElementById('cat-filter-pills');
  let activeCat = null;
 
  function renderPills(selected) {
    activeCat = selected;
    pills.innerHTML = `
      <button onclick="filterKategori(null)" class="px-4 py-2 rounded-full text-sm font-bold border-2 transition ${!selected?'bg-black text-white border-black':'border-gray-300 text-gray-600 hover:border-black'}">
        Semua
      </button>
      ${cats.map(c=>`
        <button onclick="filterKategori('${c.id}')" class="px-4 py-2 rounded-full text-sm font-bold border-2 transition flex items-center gap-2 ${selected===c.id?'bg-black text-white border-black':'border-gray-300 text-gray-600 hover:border-black'}">
          ${c.iconUrl ? `<img src="${c.iconUrl}" class="w-4 h-4 rounded">` : `<i class="${c.icon}"></i>`}
          ${c.name}
        </button>
      `).join('')}
    `;
  }
 
  window.filterKategori = function(catId) {
    renderPills(catId);
    const contents = DB.getArr('contents').filter(c => !catId || c.categoryId===catId);
    const links = DB.getArr('linkwebs').filter(l => !catId || l.categoryId===catId);
    const label = catId ? cats.find(c=>c.id===catId)?.name : 'Semua';
    document.getElementById('cat-result-label').textContent = label+' — Konten';
    document.getElementById('kategori-content-grid').innerHTML = contents.length
      ? contents.map(c=>contentCard(c)).join('')
      : `<div class="col-span-4 text-gray-400 py-8 text-sm">Belum ada konten di kategori ini.</div>`;
    document.getElementById('kategori-links-grid').innerHTML = links.length
      ? `<p class="col-span-2 text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Link Web</p>`+links.map(l=>linkCard(l)).join('')
      : '';
  };
 
  renderPills(null);
  window.filterKategori(null);
}
 
function linkCard(l) {
  const statusBadge = {active:'badge-green',development:'badge-yellow',archived:'badge-blue'}[l.status]||'badge-blue';
  const statusLabel = {active:'Live',development:'Dev',archived:'Arsip'}[l.status]||l.status;
  return `
    <div class="link-card" onclick="window.open('${l.url}','_blank')">
      <div class="link-icon">
        ${l.iconUrl ? `<img src="${l.iconUrl}" class="w-full h-full object-cover rounded-xl">` : `<i class="fas fa-globe text-gray-400"></i>`}
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-0.5">
          <p class="font-bold text-black text-sm truncate">${l.title}</p>
          <span class="badge ${statusBadge} flex-shrink-0">${statusLabel}</span>
        </div>
        <p class="text-xs text-gray-400 truncate">${l.url}</p>
        ${l.description ? `<p class="text-xs text-gray-600 mt-1 line-clamp-1">${l.description}</p>` : ''}
      </div>
      <i class="fas fa-external-link-alt text-gray-300 text-sm flex-shrink-0"></i>
    </div>
  `;
}
 
function renderTren() {
  const contents = DB.getArr('contents').sort((a,b)=>b.views-a.views);
  const el = document.getElementById('tren-list');
  if (!contents.length) {
    el.innerHTML = `<div class="text-center py-16 text-gray-400"><i class="fas fa-chart-line text-5xl mb-3 block text-gray-200"></i><p>Belum ada konten trending.</p></div>`;
    return;
  }
  el.innerHTML = contents.map((c,i) => `
    <div class="bg-white rounded-2xl border border-gray-100 p-5 flex gap-5 items-center hover:shadow-md transition cursor-pointer" onclick="showContentDetail('${c.id}')">
      <span class="rank-num w-8 text-center">${i+1}</span>
      <div class="w-14 h-14 rounded-xl bg-zinc-900 flex items-center justify-center flex-shrink-0 overflow-hidden">
        ${c.thumbUrl ? `<img src="${c.thumbUrl}" class="w-full h-full object-cover">` : `<i class="fas fa-file text-gray-600"></i>`}
      </div>
      <div class="flex-1 min-w-0">
        <p class="font-bold text-black truncate">${c.title}</p>
        <p class="text-sm text-gray-500 mt-0.5">${c.description||''}</p>
        <div class="flex gap-4 mt-2 text-xs text-gray-400">
          <span><i class="fas fa-eye mr-1"></i>${c.views}</span>
          <span><i class="fas fa-heart mr-1"></i>${c.likes}</span>
        </div>
      </div>
      <button onclick="event.stopPropagation();toggleBookmark('${c.id}')" class="text-gray-300 hover:text-black transition">
        <i class="${c.bookmarked?'fas text-black':'far'} fa-bookmark text-lg"></i>
      </button>
    </div>
  `).join('');
}
 
function renderDisimpan() {
  const contents = DB.getArr('contents').filter(c=>c.bookmarked);
  const links = DB.getArr('linkwebs').filter(l=>l.bookmarked);
  const grid = document.getElementById('disimpan-grid');
  const empty = document.getElementById('disimpan-empty');
  const all = [...contents, ...links];
  if (!all.length) { grid.innerHTML=''; empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');
  grid.innerHTML = [
    ...contents.map(c=>contentCard(c)),
    ...links.map(l=>`<div class="col-span-1">${linkCard(l)}</div>`)
  ].join('');
}
 
function renderDiskusi() {
  const posts = DB.getArr('discussions');
  const list = document.getElementById('diskusi-list');
  const empty = document.getElementById('diskusi-empty');
  if (!posts.length) { list.innerHTML=''; empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');
  list.innerHTML = posts.map(p => `
    <div class="post-item">
      <div class="flex gap-4 mb-3">
        <div class="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white font-bold flex-shrink-0 text-sm">${p.userName[0]}</div>
        <div class="flex-1">
          <p class="font-bold text-black">${p.userName}</p>
          <p class="text-xs text-gray-400">${timeAgo(p.createdAt)}</p>
        </div>
      </div>
      <p class="text-gray-700 mb-4 leading-relaxed text-sm pl-14">${p.content}</p>
      <div class="flex gap-4 text-sm text-gray-500 pl-14">
        <button onclick="likePost('${p.id}')" class="flex items-center gap-1.5 hover:text-red-500 transition">
          <i class="fas fa-heart"></i><span>${p.likes}</span>
        </button>
        <button class="flex items-center gap-1.5 hover:text-black transition">
          <i class="fas fa-comment"></i><span>${p.comments}</span>
        </button>
        <button class="flex items-center gap-1.5 hover:text-black transition">
          <i class="fas fa-share"></i><span>${p.shares}</span>
        </button>
      </div>
    </div>
  `).join('');
}
 
function renderAnalyst() {
  const projects = DB.getArr('projects');
  const list = document.getElementById('projects-list');
  const perfList = document.getElementById('perf-list');
 
  if (!projects.length) {
    list.innerHTML = `<p class="text-gray-400 text-sm py-4 text-center">Belum ada project. Tambah yang pertama!</p>`;
    perfList.innerHTML = '';
  } else {
    list.innerHTML = projects.map(p => {
      const s = {live:'badge-green',development:'badge-yellow',archived:'badge-blue'}[p.status]||'badge-blue';
      const sl = {live:'✓ Live',development:'⏳ Dev',archived:'Arsip'}[p.status]||p.status;
      return `
        <div class="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition">
          <div class="flex items-start justify-between mb-1">
            <div>
              <p class="font-bold text-black">${p.name}</p>
              <p class="text-sm text-gray-500">${p.description}</p>
            </div>
            <span class="badge ${s}">${sl}</span>
          </div>
          <p class="text-xs text-gray-400 mb-3">${p.techStack||''}</p>
          <div class="flex gap-2">
            ${p.deployUrl ? `<a href="${p.deployUrl}" target="_blank" class="text-xs bg-black text-white px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition font-bold">Lihat</a>` : ''}
            <button onclick="deleteProject('${p.id}')" class="text-xs border border-red-200 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition font-bold">Hapus</button>
          </div>
        </div>
      `;
    }).join('');
 
    perfList.innerHTML = projects.map(p => `
      <div>
        <div class="flex justify-between mb-1.5">
          <p class="text-sm font-bold text-black">${p.name}</p>
          <p class="text-sm font-bold text-black">${p.performanceScore}%</p>
        </div>
        <div class="progress"><div class="progress-bar" style="width:${p.performanceScore}%"></div></div>
      </div>
    `).join('');
  }
 
  // Stats
  const live = projects.filter(p=>p.status==='live');
  const dev = projects.filter(p=>p.status==='development');
  document.getElementById('stat-total').textContent = projects.length;
  document.getElementById('stat-live').textContent = live.length;
  document.getElementById('stat-dev').textContent = dev.length;
  document.getElementById('stat-visits').textContent = projects.reduce((a,p)=>a+p.visitCount,0).toLocaleString();
  const avgPerf = projects.length ? Math.round(projects.reduce((a,p)=>a+p.performanceScore,0)/projects.length) : 0;
  const avgUptime = live.length ? (live.reduce((a,p)=>a+p.uptimePercent,0)/live.length).toFixed(0)+'%' : '—';
  document.getElementById('stat-avgperf').textContent = projects.length ? avgPerf+'%' : '—';
  document.getElementById('stat-uptime').textContent = avgUptime;
}
 
function renderProfil() {
  const profile = DB.get('user_profile') || {};
  const contents = DB.getArr('contents');
  const discussions = DB.getArr('discussions');
 
  // Profile info
  document.getElementById('profil-name').textContent = profile.name || 'San Pelong';
  document.getElementById('profil-username').textContent = '@'+(profile.username||'sanpelong');
  document.getElementById('profil-bio').textContent = profile.bio || '';
  document.getElementById('info-location').textContent = profile.location || '';
  document.getElementById('info-occupation').textContent = profile.occupation || '';
  document.getElementById('info-techstack').textContent = profile.techStack || '';
  document.getElementById('info-interests').textContent = profile.interests || '';
 
  // Avatar
  if (profile.avatarUrl) {
    document.getElementById('avatar-img').src = profile.avatarUrl;
    document.getElementById('avatar-img').classList.remove('hidden');
    document.getElementById('avatar-initial').classList.add('hidden');
  } else {
    document.getElementById('avatar-initial').textContent = (profile.name||'S')[0].toUpperCase();
    document.getElementById('avatar-img').classList.add('hidden');
    document.getElementById('avatar-initial').classList.remove('hidden');
  }
  if (profile.coverUrl) {
    const coverImg = document.getElementById('cover-img');
    coverImg.src = profile.coverUrl;
    coverImg.classList.remove('hidden');
  }
 
  // Stats
  document.getElementById('stat-followers').textContent = profile.followers || 0;
  document.getElementById('stat-following').textContent = profile.following || 0;
  document.getElementById('stat-posts').textContent = contents.length;
  document.getElementById('stat-likes-total').textContent = contents.reduce((a,c)=>a+c.likes,0);
  document.getElementById('stat-comments').textContent = discussions.reduce((a,d)=>a+d.comments,0);
  document.getElementById('stat-shares').textContent = discussions.reduce((a,d)=>a+d.shares,0);
 
  // Recent uploads
  renderRecentUploads();
 
  // Activity
  const actEl = document.getElementById('profil-activity');
  const allDisc = DB.getArr('discussions').filter(d=>d.userId==='u1');
  if (!allDisc.length) {
    actEl.innerHTML = `<p class="text-gray-400 text-sm py-6 text-center">Belum ada aktivitas.</p>`;
  } else {
    actEl.innerHTML = allDisc.map(d => `
      <div class="post-item">
        <div class="flex gap-4 mb-3">
          <div class="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white font-bold flex-shrink-0 text-sm">${(profile.name||'S')[0]}</div>
          <div>
            <p class="font-bold text-black">${profile.name||'San Pelong'}</p>
            <p class="text-xs text-gray-400">${timeAgo(d.createdAt)}</p>
          </div>
        </div>
        <p class="text-gray-700 mb-3 leading-relaxed text-sm pl-14">${d.content}</p>
        <div class="flex gap-4 text-sm text-gray-500 pl-14">
          <span><i class="fas fa-heart mr-1"></i>${d.likes}</span>
          <span><i class="fas fa-comment mr-1"></i>${d.comments}</span>
          <span><i class="fas fa-share mr-1"></i>${d.shares}</span>
        </div>
      </div>
    `).join('');
  }
}
 
function renderRecentUploads() {
  const contents = DB.getArr('contents').slice(0,3);
  const links = DB.getArr('linkwebs').slice(0,2);
  const el = document.getElementById('recent-uploads');
  const fileIcons = {image:'fas fa-file-image text-orange-400',video:'fas fa-file-video text-purple-400',pdf:'fas fa-file-pdf text-red-400',doc:'fas fa-file-word text-blue-400'};
  const all = [
    ...contents.map(c=>({icon:fileIcons[c.fileType]||'fas fa-file text-gray-400',name:c.title,size:c.fileType?.toUpperCase()||'FILE',type:'content'})),
    ...links.map(l=>({icon:'fas fa-link text-green-500',name:l.title,size:'LINK',type:'link'})),
  ].slice(0,4);
  if (!all.length) { el.innerHTML = `<p class="text-xs text-gray-400">Belum ada upload</p>`; return; }
  el.innerHTML = all.map(f=>`
    <div class="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg">
      <i class="${f.icon} w-5 text-center"></i>
      <p class="text-xs text-gray-700 flex-1 truncate">${f.name}</p>
      <span class="text-xs text-gray-400 flex-shrink-0">${f.size}</span>
    </div>
  `).join('');
}
 
function renderPengaturan() {
  const dbStats = document.getElementById('db-stats');
  const contents = DB.getArr('contents');
  const links = DB.getArr('linkwebs');
  const projects = DB.getArr('projects');
  const discussions = DB.getArr('discussions');
  const cats = DB.getArr('categories');
  dbStats.innerHTML = [
    ['Konten Upload', contents.length, 'fas fa-file-alt text-blue-500'],
    ['Link Web', links.length, 'fas fa-link text-green-500'],
    ['Projects', projects.length, 'fas fa-rocket text-purple-500'],
    ['Diskusi', discussions.length, 'fas fa-comments text-yellow-500'],
    ['Kategori', cats.length, 'fas fa-th-large text-gray-500'],
  ].map(([label,count,icon])=>`
    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
      <div class="flex items-center gap-3">
        <i class="${icon}"></i>
        <span class="text-sm font-bold">${label}</span>
      </div>
      <span class="font-bold text-black">${count}</span>
    </div>
  `).join('');
}
 
// ============================
// ACTIONS
// ============================
async function toggleBookmark(contentId) {
  const saved = await window._SB.toggleSave(CURRENT_USER.id, contentId, 'content')
  const contents = DB.getArr('contents')
  const idx = contents.findIndex(c => c.id === contentId)
  if (idx >= 0) {
    contents[idx].bookmarked = saved
    DB.set('contents', contents)
  }
  toast(saved ? '🔖 Disimpan ke koleksi' : 'Dihapus dari koleksi')
  renderPage(getCurrentPage())
}
 
function likePost(postId) {
  const posts = DB.getArr('discussions');
  const idx = posts.findIndex(p=>p.id===postId);
  if (idx>=0) { posts[idx].likes++; DB.set('discussions', posts); renderDiskusi(); }
}
 
function showContentDetail(id) {
  const contents = DB.getArr('contents');
  const c = contents.find(c=>c.id===id);
  if (!c) return;
 
  // increment views
  const idx = contents.findIndex(cc=>cc.id===id);
  if(idx>=0){contents[idx].views++;DB.set('contents',contents);}
 
  // init comments & ratings jika belum ada
  if (!c.comments) { contents[idx].comments = []; DB.set('contents',contents); }
  if (!c.ratings)  { contents[idx].ratings  = []; DB.set('contents',contents); }
 
  const comments = DB.getArr('contents').find(cc=>cc.id===id).comments || [];
  const ratings  = DB.getArr('contents').find(cc=>cc.id===id).ratings  || [];
  const avgRating = ratings.length ? (ratings.reduce((a,b)=>a+b.score,0)/ratings.length).toFixed(1) : null;
  const fileMetaExtra = c.fileName
    ? `<div class="bg-gray-50 rounded-xl p-3"><p class="text-xs text-gray-400 mb-0.5">Nama File</p><p class="text-sm font-semibold text-black truncate">${c.fileName}</p></div>
       <div class="bg-gray-50 rounded-xl p-3"><p class="text-xs text-gray-400 mb-0.5">Ukuran</p><p class="text-sm font-semibold text-black">${c.fileSize ? formatSize(c.fileSize) : '-'}</p></div>`
    : '';
 
  const webUrlBlock = c.webUrl
    ? `<a href="${c.webUrl}" target="_blank" rel="noopener" class="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4 text-sm text-blue-700 hover:bg-blue-100 transition"><i class="fas fa-external-link-alt"></i><span class="truncate flex-1">${c.webUrl}</span><span class="text-xs font-semibold flex-shrink-0">Buka →</span></a>`
    : '';
 
  const pdfOpenBtn = c.fileType === 'pdf'
    ? `<button onclick="togglePdfViewer('${c.id}')" class="flex-1 flex items-center justify-center gap-2 bg-black text-white text-sm py-3 rounded-xl font-semibold hover:bg-gray-800 transition"><i class="fas fa-file-pdf"></i> Buka PDF</button>`
    : '';
 
  const pdfViewerBlock = c.fileType === 'pdf'
    ? `<div id="pdf-viewer-${c.id}" class="hidden mb-6"><div class="flex items-center justify-between mb-2"><span class="text-sm font-semibold text-black">Preview PDF</span><button onclick="togglePdfViewer('${c.id}')" class="text-xs text-gray-400 hover:text-black"><i class="fas fa-times"></i> Tutup</button></div><iframe src="${c.fileData}" class="w-full rounded-2xl border border-gray-200" style="height:70vh;" title="${c.title}"></iframe></div>`
    : '';
 
  const fileActionsBlock = c.fileData
    ? `<div class="flex gap-3 mb-4">${pdfOpenBtn}<button onclick="downloadContent('${c.id}')" class="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-black text-sm py-3 rounded-xl font-semibold hover:bg-gray-200 transition"><i class="fas fa-download"></i> Download</button></div>${pdfViewerBlock}`
    : `<div class="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-4 text-sm text-yellow-700"><i class="fas fa-info-circle"></i><span>Konten ini tidak memiliki file yang diunggah.</span></div>`;
 
 
 
  const stars = (score, interactive=false, name='') => [1,2,3,4,5].map(i=>
    interactive
      ? `<i class="${i<=score?'fas':'far'} fa-star text-yellow-400 cursor-pointer text-lg" onmouseover="hoverStar(this,${i})" onmouseout="resetStars('${name}')" onclick="setStar('${name}',${i})"></i>`
      : `<i class="${i<=Math.round(score)?'fas':'far'} fa-star text-yellow-400 text-sm"></i>`
  ).join('');
 
  const commentsHtml = comments.length
    ? comments.map(cm=>`
        <div class="flex gap-3 py-4 border-b border-gray-100 last:border-0">
          <div class="w-9 h-9 rounded-full bg-black flex items-center justify-center text-white text-xs font-bold flex-shrink-0">${cm.author.charAt(0).toUpperCase()}</div>
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-sm font-semibold text-black">${cm.author}</span>
              <div class="flex">${stars(cm.rating)}</div>
              <span class="text-xs text-gray-400 ml-auto">${new Date(cm.date).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})}</span>
            </div>
            <p class="text-sm text-gray-600 leading-relaxed">${cm.text}</p>
          </div>
        </div>`).join('')
    : `<div class="text-center py-10 text-gray-400"><i class="far fa-comment-dots text-3xl mb-2 block"></i><p class="text-sm">Belum ada komentar. Jadilah yang pertama!</p></div>`;
 
  const html = `
    <div id="content-detail-modal" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onclick="if(event.target===this)closeContentDetail()">
      <div class="bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl max-h-[95vh] flex flex-col overflow-hidden shadow-2xl">
 
        <!-- Header bar -->
        <div class="flex items-center justify-between px-5 pt-4 pb-2 flex-shrink-0">
          <button onclick="closeContentDetail()" class="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
            <i class="fas fa-arrow-left text-sm text-gray-700"></i>
          </button>
          <span class="text-xs font-medium text-gray-400 uppercase tracking-widest">${c.fileType || 'Konten'}</span>
          <button onclick="toggleBookmark('${c.id}');closeContentDetail();showContentDetail('${c.id}')" class="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
            <i class="${c.bookmarked?'fas text-black':'far text-gray-400'} fa-bookmark text-sm"></i>
          </button>
        </div>
 
        <!-- Scrollable body -->
        <div class="overflow-y-auto flex-1 px-5 pb-8">
 
          <!-- Cover / Sampul -->
          <div class="w-full aspect-[3/2] rounded-2xl overflow-hidden bg-zinc-900 flex items-center justify-center mb-5 relative">
            ${c.thumbUrl
              ? `<img src="${c.thumbUrl}" class="w-full h-full object-cover">`
              : `<i class="${fileIcon} text-6xl text-white opacity-30"></i>`}
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div class="absolute bottom-4 left-4 right-4">
              <h2 class="text-white text-xl font-bold leading-tight drop-shadow">${c.title}</h2>
            </div>
          </div>
 
          <!-- Rating ringkas -->
          <div class="flex items-center gap-3 mb-4">
            ${avgRating
              ? `<div class="flex items-center gap-1.5">
                  <span class="text-2xl font-bold text-black">${avgRating}</span>
                  <div class="flex flex-col gap-0.5">
                    <div class="flex">${stars(avgRating)}</div>
                    <span class="text-xs text-gray-400">${ratings.length} ulasan</span>
                  </div>
                </div>`
              : `<span class="text-sm text-gray-400 italic">Belum ada penilaian</span>`}
            <div class="ml-auto flex items-center gap-3 text-sm text-gray-500">
              <span><i class="fas fa-eye mr-1 text-gray-400"></i>${c.views}</span>
              <span><i class="fas fa-heart mr-1 text-red-400"></i>${c.likes}</span>
            </div>
          </div>
 
          <!-- Deskripsi -->
          <div class="mb-6">
            <h3 class="text-sm font-semibold text-black mb-2">Tentang Konten</h3>
            <p class="text-sm text-gray-600 leading-relaxed">${c.description || 'Tidak ada deskripsi tersedia.'}</p>
          </div>
 
          <!-- Info meta -->
          <div class="grid grid-cols-2 gap-3 mb-4">
            <div class="bg-gray-50 rounded-xl p-3">
              <p class="text-xs text-gray-400 mb-0.5">Tipe File</p>
              <p class="text-sm font-semibold text-black uppercase">${c.fileType || '-'}</p>
            </div>
            <div class="bg-gray-50 rounded-xl p-3">
              <p class="text-xs text-gray-400 mb-0.5">Diunggah</p>
              <p class="text-sm font-semibold text-black">${new Date(c.createdAt).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})}</p>
            </div>
            ${fileMetaExtra}
          </div>
 
          <!-- Tombol Aksi File -->
          ${webUrlBlock}
          ${fileActionsBlock}
 
          <!-- Beri Rating -->
          <div class="bg-gray-50 rounded-2xl p-4 mb-6">
            <h3 class="text-sm font-semibold text-black mb-3">Beri Penilaian</h3>
            <div id="star-input-${c.id}" data-score="0" class="flex gap-1 mb-3">
              ${stars(0, true, c.id)}
            </div>
            <input id="comment-author-${c.id}" type="text" placeholder="Nama kamu" class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none mb-2 bg-white">
            <textarea id="comment-text-${c.id}" placeholder="Tulis komentar..." rows="3" class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none resize-none bg-white mb-3"></textarea>
            <button onclick="submitComment('${c.id}')" class="w-full bg-black text-white text-sm py-2.5 rounded-xl font-semibold hover:bg-gray-800 transition">
              Kirim Komentar
            </button>
          </div>
 
          <!-- Komentar -->
          <div>
            <h3 class="text-sm font-semibold text-black mb-1">Komentar <span class="text-gray-400 font-normal">(${comments.length})</span></h3>
            <div id="comments-list-${c.id}">
              ${commentsHtml}
            </div>
          </div>
 
        </div>
      </div>
    </div>`;
 
  document.body.insertAdjacentHTML('beforeend', html);
}
 
function togglePdfViewer(contentId) {
  const viewer = document.getElementById(`pdf-viewer-${contentId}`);
  if (!viewer) return;
  viewer.classList.toggle('hidden');
  if (!viewer.classList.contains('hidden')) {
    viewer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
 
function downloadContent(contentId) {
  const c = DB.getArr('contents').find(c => c.id === contentId);
  if (!c || !c.fileData) { toast('⚠️ Tidak ada file untuk diunduh'); return; }
  const a = document.createElement('a');
  a.href = c.fileData;
  a.download = c.fileName || c.title;
  a.click();
  toast('⬇️ Mengunduh file...');
}
 
function closeContentDetail() {
  const modal = document.getElementById('content-detail-modal');
  if (modal) modal.remove();
}
 
function hoverStar(el, score) {
  const container = el.parentElement;
  [...container.querySelectorAll('i')].forEach((s,i)=>{
    s.className = `${i<score?'fas':'far'} fa-star text-yellow-400 cursor-pointer text-lg`;
  });
}
 
function resetStars(contentId) {
  const container = document.getElementById(`star-input-${contentId}`);
  if (!container) return;
  const score = parseInt(container.dataset.score)||0;
  [...container.querySelectorAll('i')].forEach((s,i)=>{
    s.className = `${i<score?'fas':'far'} fa-star text-yellow-400 cursor-pointer text-lg`;
  });
}
 
function setStar(contentId, score) {
  const container = document.getElementById(`star-input-${contentId}`);
  if (!container) return;
  container.dataset.score = score;
  [...container.querySelectorAll('i')].forEach((s,i)=>{
    s.className = `${i<score?'fas':'far'} fa-star text-yellow-400 cursor-pointer text-lg`;
  });
}
 
function submitComment(contentId) {
  const author = document.getElementById(`comment-author-${contentId}`).value.trim();
  const text   = document.getElementById(`comment-text-${contentId}`).value.trim();
  const score  = parseInt(document.getElementById(`star-input-${contentId}`)?.dataset.score)||0;
 
  if (!author) { toast('⚠️ Masukkan nama kamu'); return; }
  if (!text)   { toast('⚠️ Tulis komentar dulu'); return; }
  if (!score)  { toast('⚠️ Beri bintang dulu'); return; }
 
  const contents = DB.getArr('contents');
  const idx = contents.findIndex(c=>c.id===contentId);
  if (idx<0) return;
 
  if (!contents[idx].comments) contents[idx].comments = [];
  if (!contents[idx].ratings)  contents[idx].ratings  = [];
 
  contents[idx].comments.unshift({ author, text, rating: score, date: new Date().toISOString() });
  contents[idx].ratings.push({ score });
  DB.set('contents', contents);
 
  closeContentDetail();
  showContentDetail(contentId);
  toast('✅ Komentar berhasil dikirim!');
}
 
// ============================
// SEARCH
// ============================
function handleSearch(q) {
  if (!q.trim()) return;
  const contents = DB.getArr('contents').filter(c=>c.title.toLowerCase().includes(q.toLowerCase()));
  const links = DB.getArr('linkwebs').filter(l=>l.title.toLowerCase().includes(q.toLowerCase()));
  // Just navigate to kategori and show results
  toast(`${contents.length+links.length} hasil ditemukan`);
}
 
// ============================
// UPLOAD KONTEN
// ============================
function setUploadTab(tab) {
  document.getElementById('tab-konten').classList.toggle('active', tab==='konten');
  document.getElementById('tab-linkweb').classList.toggle('active', tab==='linkweb');
  document.getElementById('upload-konten-panel').classList.toggle('hidden', tab!=='konten');
  document.getElementById('upload-linkweb-panel').classList.toggle('hidden', tab!=='linkweb');
}
 
function handleMiniFile(input) {
  if (!input.files[0]) return;
  tempFiles.main = input.files[0];
  const el = document.getElementById('mini-file-preview');
  el.classList.remove('hidden');
  document.getElementById('mini-file-name').textContent = input.files[0].name;
  document.getElementById('mini-file-size').textContent = formatSize(input.files[0].size);
}
 
function handleMiniDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('hover');
  const f = e.dataTransfer.files[0];
  if (f) { tempFiles.main = f; document.getElementById('mini-file').files = e.dataTransfer.files; handleMiniFile({files:[f]}); }
}
 
function clearMiniFile() {
  tempFiles.main = null;
  document.getElementById('mini-file-preview').classList.add('hidden');
  document.getElementById('mini-file').value = '';
}
 
function handleMainFile(input) {
  if (!input.files[0]) return;
  tempFiles.main = input.files[0];
  document.getElementById('main-file-info').classList.remove('hidden');
  document.getElementById('main-file-name').textContent = input.files[0].name;
  document.getElementById('main-file-size').textContent = formatSize(input.files[0].size);
  const ext = input.files[0].name.split('.').pop().toLowerCase();
  const icons = {png:'fas fa-file-image text-orange-400',jpg:'fas fa-file-image text-orange-400',jpeg:'fas fa-file-image text-orange-400',gif:'fas fa-file-image text-orange-400',webp:'fas fa-file-image text-orange-400',mp4:'fas fa-file-video text-purple-400',pdf:'fas fa-file-pdf text-red-400',doc:'fas fa-file-word text-blue-400',docx:'fas fa-file-word text-blue-400'};
  document.getElementById('main-file-icon').className = icons[ext] || 'fas fa-file text-gray-400';
  document.getElementById('main-file-icon').className += ' text-xl';
}
 
function handleMainDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('hover');
  const f = e.dataTransfer.files[0];
  if (f) { tempFiles.main = f; handleMainFile({files:[f]}); }
}
 
function clearMainFile() {
  tempFiles.main = null;
  document.getElementById('main-file-info').classList.add('hidden');
}
 
function handleThumbFile(input) {
  if (!input.files[0]) return;
  const reader = new FileReader();
  reader.onload = e => {
    tempFiles.thumb = e.target.result;
    document.getElementById('thumb-preview').src = e.target.result;
    document.getElementById('thumb-preview').classList.remove('hidden');
    document.getElementById('thumb-icon-placeholder').classList.add('hidden');
  };
  reader.readAsDataURL(input.files[0]);
}
 
function handleLinkIcon(input) {
  if (!input.files[0]) return;
  const reader = new FileReader();
  reader.onload = e => {
    tempFiles.linkIcon = e.target.result;
    document.getElementById('lk-icon-preview').src = e.target.result;
    document.getElementById('lk-icon-preview').classList.remove('hidden');
    document.getElementById('lk-icon-placeholder').classList.add('hidden');
  };
  reader.readAsDataURL(input.files[0]);
}
 
async function submitUpload() {
  const title = document.getElementById('up-title').value.trim();
  const catId = document.getElementById('up-category').value;
  const desc  = document.getElementById('up-desc').value.trim();
  if (!title) { toast('⚠️ Judul wajib diisi!'); return; }
 
  let fileUrl = null, thumbUrl = null, fileType = 'doc';
 
  if (tempFiles.main) {
    const ext = tempFiles.main.name.split('.').pop().toLowerCase();
    const typeMap = {png:'image',jpg:'image',jpeg:'image',gif:'image',webp:'image',mp4:'video',pdf:'pdf',doc:'doc',docx:'docx'};
    fileType = typeMap[ext] || 'doc';
    toast('⏳ Mengupload file...');
    fileUrl = await window._SB.uploadContentFile(CURRENT_USER.id, tempFiles.main);
  }
 
  if (tempFiles.thumbFile) {
    thumbUrl = await window._SB.uploadThumbnail(CURRENT_USER.id, tempFiles.thumbFile);
  }
 
  const content = await window._SB.addContent(CURRENT_USER.id, {
    name: title,
    description: desc,
    category_id: catId || null,
    icon_type: fileType,
    display_url: fileUrl || document.getElementById('up-url').value.trim() || null,
    preview_image: thumbUrl || null,
    status: 'published'
  });
 
  DB.pushArr('contents', {
    id: content.id, userId: CURRENT_USER.id, categoryId: catId,
    title, description: desc, fileType,
    thumbUrl: thumbUrl || '', views: 0, likes: 0, bookmarked: false,
    createdAt: content.created_at
  });
 
  toast('✅ Konten berhasil diupload!');
  closeModal('modal-upload');
  resetUploadForm();
  renderPage(getCurrentPage());
}
 
async function submitLink() {
  const title = document.getElementById('lk-title').value.trim();
  const url   = document.getElementById('lk-url').value.trim();
  if (!title || !url) { toast('⚠️ Judul dan URL wajib diisi!'); return; }
 
  const ref = await window._SB.addRef(CURRENT_USER.id, { theme: title, language: url });
 
  DB.pushArr('linkwebs', {
    id: ref.id, userId: CURRENT_USER.id,
    categoryId: document.getElementById('lk-category').value || null,
    title, url,
    description: document.getElementById('lk-desc').value.trim(),
    iconUrl: tempFiles.linkIcon || '',
    status: document.getElementById('lk-status').value,
    bookmarked: false,
    createdAt: ref.created_at
  });
 
  toast('✅ Link web berhasil disimpan!');
  closeModal('modal-link');
  resetLinkForm();
  renderPage(getCurrentPage());
}
 
async function submitPost() {
  const content = document.getElementById('post-content').value.trim();
  if (!content) { toast('⚠️ Tulis sesuatu dulu!'); return; }
 
  const post = await window._SB.addPost(CURRENT_USER.id, content);
 
  DB.pushArr('discussions', {
    id: post.id, userId: CURRENT_USER.id,
    userName: CURRENT_PROFILE?.username || 'Pengguna',
    content, likes: 0, comments: 0, shares: 0,
    createdAt: post.created_at
  });
 
  document.getElementById('post-content').value = '';
  toast('✅ Post berhasil dipublikasikan!');
  closeModal('modal-post');
  renderDiskusi();
}
 
function submitProject() {
  const name = document.getElementById('proj-name').value.trim();
  if (!name) { toast('⚠️ Nama project wajib diisi!'); return; }
  const newProj = {
    id: DB.uuid(), userId:'u1', name,
    description: document.getElementById('proj-desc').value.trim(),
    deployUrl: document.getElementById('proj-url').value.trim(),
    techStack: document.getElementById('proj-tech').value.trim(),
    status: document.getElementById('proj-status').value,
    visitCount:0,
    performanceScore: parseInt(document.getElementById('proj-perf').value)||80,
    uptimePercent: parseInt(document.getElementById('proj-uptime').value)||99,
    lastDeployed: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  DB.pushArr('projects', newProj);
  ['proj-name','proj-desc','proj-url','proj-tech','proj-perf','proj-uptime'].forEach(id=>document.getElementById(id).value='');
  toast('✅ Project berhasil ditambahkan!');
  closeModal('modal-project');
  renderAnalyst();
}
 
function deleteProject(id) {
  const projects = DB.getArr('projects').filter(p=>p.id!==id);
  DB.set('projects', projects);
  toast('🗑️ Project dihapus');
  renderAnalyst();
}
 
async function saveEditProfil() {
  const updates = {
    username:   document.getElementById('ep-username').value.trim() || CURRENT_PROFILE.username,
    bio:        document.getElementById('ep-bio').value.trim(),
    location:   document.getElementById('ep-location').value.trim(),
    occupation: document.getElementById('ep-occupation').value.trim(),
    tech_stack: document.getElementById('ep-techstack').value.trim(),
    interests:  document.getElementById('ep-interests').value.trim(),
  };
  CURRENT_PROFILE = await window._SB.updateProfile(CURRENT_USER.id, updates);
  DB.set('user_profile', {
    name: CURRENT_PROFILE.username,
    username: CURRENT_PROFILE.username,
    bio: CURRENT_PROFILE.bio || '',
    location: CURRENT_PROFILE.location || '',
    occupation: CURRENT_PROFILE.occupation || '',
    techStack: CURRENT_PROFILE.tech_stack || '',
    interests: CURRENT_PROFILE.interests || '',
    avatarUrl: CURRENT_PROFILE.avatar_url || '',
    coverUrl: CURRENT_PROFILE.cover_url || '',
    followers: 0, following: 0,
  });
  toast('✅ Profil berhasil diperbarui!');
  closeModal('modal-editprofil');
  renderProfil();
}
 
async function uploadAvatar(input) {
  if (!input.files[0]) return;
  toast('⏳ Mengupload foto...');
  const url = await window._SB.uploadAvatarFile(CURRENT_USER.id, input.files[0]);
  await window._SB.updateProfile(CURRENT_USER.id, { avatar_url: url });
  CURRENT_PROFILE.avatar_url = url;
  const profile = DB.get('user_profile') || {};
  profile.avatarUrl = url;
  DB.set('user_profile', profile);
  toast('✅ Foto profil diperbarui!');
  renderProfil();
}
 
async function uploadCover(input) {
  if (!input.files[0]) return;
  toast('⏳ Mengupload cover...');
  const url = await window._SB.uploadCoverFile(CURRENT_USER.id, input.files[0]);
  await window._SB.updateProfile(CURRENT_USER.id, { cover_url: url });
  CURRENT_PROFILE.cover_url = url;
  const profile = DB.get('user_profile') || {};
  profile.coverUrl = url;
  DB.set('user_profile', profile);
  toast('✅ Cover diperbarui!');
  renderProfil();
}
 
function clearAllData() {
  if (!confirm('Yakin hapus semua data? Ini tidak bisa dibatalkan.')) return;
  Object.keys(localStorage).filter(k=>k.startsWith('nissanex_')).forEach(k=>localStorage.removeItem(k));
  toast('🗑️ Semua data dihapus. Refresh halaman...');
  setTimeout(()=>location.reload(), 1500);
}
 
// ============================
// MODAL HELPERS
// ============================
function openUploadModal() {
  populateCategorySelects();
  tempFiles = {main:null, thumb:null, linkIcon:null};
  openModal('modal-upload');
}
 
function openLinkModal() {
  populateCategorySelects();
  tempFiles = {main:null, thumb:null, linkIcon:null};
  // Reset icon preview
  document.getElementById('lk-icon-preview').classList.add('hidden');
  document.getElementById('lk-icon-placeholder').classList.remove('hidden');
  openModal('modal-link');
}
 
function openPostModal() { openModal('modal-post'); }
function openProjectModal() { openModal('modal-project'); }
 
function openEditProfil() {
  const profile = DB.get('user_profile') || {};
  document.getElementById('ep-name').value = profile.name || '';
  document.getElementById('ep-username').value = profile.username || '';
  document.getElementById('ep-bio').value = profile.bio || '';
  document.getElementById('ep-location').value = profile.location || '';
  document.getElementById('ep-occupation').value = profile.occupation || '';
  document.getElementById('ep-techstack').value = profile.techStack || '';
  document.getElementById('ep-interests').value = profile.interests || '';
  openModal('modal-editprofil');
}
 
function openModal(id) { document.getElementById(id).classList.add('open'); document.body.style.overflow='hidden'; }
function closeModal(id) { document.getElementById(id).classList.remove('open'); document.body.style.overflow=''; }
function closeModalBackdrop(e, id) { if (e.target.id===id) closeModal(id); }
 
function populateCategorySelects() {
  const cats = DB.getArr('categories');
  const opts = cats.map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
  ['up-category','lk-category'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '<option value="">Pilih kategori...</option>'+opts;
  });
}
 
function resetUploadForm() {
  ['up-title','up-desc','up-url'].forEach(id=>document.getElementById(id).value='');
  clearMainFile();
  tempFiles = {main:null, thumb:null, linkIcon:null};
  document.getElementById('thumb-preview').classList.add('hidden');
  document.getElementById('thumb-icon-placeholder').classList.remove('hidden');
}
 
function resetLinkForm() {
  ['lk-title','lk-url','lk-desc'].forEach(id=>document.getElementById(id).value='');
  tempFiles.linkIcon = null;
}
 
// ============================
// UTILITIES
// ============================
function toast(msg, duration=2800) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'), duration);
}
 
function formatSize(bytes) {
  if (bytes<1024) return bytes+'B';
  if (bytes<1048576) return (bytes/1024).toFixed(1)+'KB';
  return (bytes/1048576).toFixed(1)+'MB';
}
 
function timeAgo(dateStr) {
  const diff = (Date.now()-new Date(dateStr).getTime())/1000;
  if (diff<60) return 'Baru saja';
  if (diff<3600) return Math.floor(diff/60)+'m yang lalu';
  if (diff<86400) return Math.floor(diff/3600)+'j yang lalu';
  if (diff<604800) return Math.floor(diff/86400)+' hari yang lalu';
  return Math.floor(diff/604800)+' minggu yang lalu';
}
 
function getCurrentPage() {
  const active = document.querySelector('.page-content.active');
  if (!active) return 'beranda';
  return active.id.replace('page-','');
}
 
// ============================
// CARD DESCRIPTION HANDLERS
// ============================
let activeCardDesc = null;
 
function showCardDesc(cardEl) {
  const overlay = cardEl.querySelector('.content-desc-overlay');
  if (!overlay) return;
  
  if (activeCardDesc && activeCardDesc !== cardEl) {
    const prevOverlay = activeCardDesc.querySelector('.content-desc-overlay');
    if (prevOverlay) {
      activeCardDesc.classList.remove('active-desc');
    }
  }
  
  cardEl.classList.add('active-desc');
  activeCardDesc = cardEl;
}
 
function hideCardDesc(cardEl) {
  cardEl.classList.remove('active-desc');
  if (activeCardDesc === cardEl) activeCardDesc = null;
}
 
function toggleCardDesc(cardEl) {
  if (cardEl.classList.contains('active-desc')) {
    hideCardDesc(cardEl);
  } else {
    showCardDesc(cardEl);
  }
  return false;
}
 
// ============================
// EXPOSE KE WINDOW (wajib untuk type="module")
// Harus SEBELUM init() agar onclick di HTML langsung bisa akses
// ============================
// Tidak diperlukan lagi — script sudah <script> biasa, semua fungsi otomatis global
 
// Bersihkan cache kategori lama agar DEFAULT_CATEGORIES yang baru dipakai
;(function resetStaleCategories() {
  const cats = DB.getArr('categories');
  const isOldSeed = cats.length > 0 && cats.some(c =>
    ['Tekno','Musik','Film','Olahraga','Kuliner'].includes(c.name)
  );
  if (isOldSeed) {
    localStorage.removeItem('nissanex_categories');
    localStorage.removeItem('nissanex_seeded');
  }
})();
 
// ============================
// INIT
// ============================
init();