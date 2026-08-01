/**
 * 梦天工作台 - Main Application
 * Apple-inspired Liquid Glass Design System
 */
const App = {
  currentPage: 'dashboard',
  pages: ['dashboard', 'hotspots', 'calendar', 'todos', 'bookshelf', 'learning', 'water', 'review', 'exercise', 'inspiration'],

  init() {
    Storage.init();
    this.bindNavigation();
    this.bindQuickEntry();
    this.registerSW();
    this.showPage('dashboard');
    this.updateTopBarDate();
    this.startClock();
    this.initReminders();
    // Init all modules
    DashboardModule.init();
    HotspotsModule.init();
    CalendarModule.init();
    TodoModule.init();
    BookshelfModule.init();
    LearningModule.init();
    WaterModule.init();
    ReviewModule.init();
    ExerciseModule.init();
    InspirationModule.init();
  },

  bindNavigation() {
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      item.addEventListener('click', () => {
        const page = item.dataset.page;
        if (page) this.showPage(page);
      });
    });
  },

  bindQuickEntry() {
    document.querySelectorAll('.quick-entry-item[data-page]').forEach(item => {
      item.addEventListener('click', () => {
        const page = item.dataset.page;
        if (page) this.showPage(page);
      });
    });
  },

  showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    // Show target
    const target = document.getElementById(`page-${pageId}`);
    if (target) target.classList.add('active');
    // Update sidebar nav
    document.querySelectorAll('.nav-item[data-page]').forEach(n => {
      n.classList.toggle('active', n.dataset.page === pageId);
    });
    // Update mobile bottom nav
    document.querySelectorAll('.mobile-nav-item[data-page]').forEach(n => {
      n.classList.toggle('active', n.dataset.page === pageId);
    });
    // Update title
    const titles = {
      dashboard: '工作台概览', hotspots: '今日热点', calendar: '日历',
      todos: '今日待办', bookshelf: '我的书架', learning: '学习中心', water: '喝水时间',
      review: '今日复盘', exercise: '今日运动', inspiration: '今日灵感'
    };
    document.querySelector('.top-bar-title').textContent = titles[pageId] || pageId;
    this.currentPage = pageId;
    // Refresh module
    this.refreshPage(pageId);
    // Scroll to top
    const scroll = document.querySelector('.content-scroll');
    if (scroll) scroll.scrollTop = 0;
    // Close mobile sidebar
    this.closeSidebar();
  },

  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (!sidebar || !overlay) return;
    const isOpen = sidebar.classList.contains('open');
    if (isOpen) {
      this.closeSidebar();
    } else {
      sidebar.classList.add('open');
      overlay.classList.add('show');
    }
  },

  closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
  },

  refreshPage(pageId) {
    const refreshers = {
      dashboard: () => DashboardModule.refresh(),
      hotspots: () => HotspotsModule.refresh(),
      calendar: () => CalendarModule.refresh(),
      todos: () => TodoModule.refresh(),
      bookshelf: () => BookshelfModule.refresh(),
      learning: () => LearningModule.refresh(),
      water: () => WaterModule.refresh(),
      review: () => ReviewModule.refresh(),
      exercise: () => ExerciseModule.refresh(),
      inspiration: () => InspirationModule.refresh(),
    };
    if (refreshers[pageId]) refreshers[pageId]();
  },

  updateTopBarDate() {
    const now = new Date();
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    const str = `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日 星期${days[now.getDay()]}`;
    const el = document.getElementById('topBarDate');
    if (el) el.textContent = str;
  },

  startClock() {
    const updateClock = () => {
      this.updateTopBarDate();
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      const clockEl = document.getElementById('sidebarClock');
      if (clockEl) clockEl.textContent = timeStr;
      const dateEl = document.getElementById('sidebarDate');
      if (dateEl) dateEl.title = `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日`;
    };
    updateClock();
    setInterval(updateClock, 30000);
  },

  // Utility: show toast
  toast(msg) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 0.3s'; }, 2000);
    setTimeout(() => el.remove(), 2500);
  },

  // Reminder system
  initReminders() {
    // Check every 5 minutes if it's time for a reminder
    setInterval(() => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const settings = Storage.getSettings();

      // Water reminder: every hour during 8-22
      if (settings.waterReminder && hour >= 8 && hour <= 22 && minute === 0) {
        const waterToday = Storage.getTodayWater();
        if (waterToday < settings.dailyWaterGoal * 0.8) {
          this.toast('💧 该喝水啦！保持水分充足~');
        }
      }

      // Reading reminder: 20:00
      if (settings.readingReminder && hour === 20 && minute === 0) {
        this.toast('📖 阅读时间到！今天的书读了吗？');
      }

      // Exercise reminder: 17:00
      if (settings.exerciseReminder && hour === 17 && minute === 0) {
        this.toast('🏃 运动时间！动起来吧~');
      }
    }, 60000);
  },

  registerSW() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').then(() => {
        console.log('SW registered');
      }).catch(() => {
        // Swallow - non-critical
      });
    }
  },

  // Utility: today string
  today() { return new Date().toISOString().split('T')[0]; },

  // SVG icons (simple line icons in Apple style)
  icons: {
    calendar: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="3"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    todo: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><polyline points="8 12 11 15 16 9"/></svg>',
    book: '<svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>',
    water: '<svg viewBox="0 0 24 24"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>',
    review: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
    exercise: '<svg viewBox="0 0 24 24"><circle cx="7" cy="8" r="3"/><path d="M7 11v10"/><circle cx="17" cy="8" r="3"/><path d="M17 11v10"/><path d="M10 5h4"/></svg>',
    inspiration: '<svg viewBox="0 0 24 24"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386z"/></svg>',
    dashboard: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
    hotspots: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 16 14"/></svg>',
    settings: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    check: '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>',
    clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 16 14"/></svg>',
    heart: '<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>',
    star: '<svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    link: '<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>',
    mic: '<svg viewBox="0 0 24 24"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
    fire: '<svg viewBox="0 0 24 24"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.07-2.14-.224-4.054 2-5.5 1.845 3.396 3 5.5 3 8.5a5 5 0 01-10 0c0-1 .269-1.865.676-2.695"/></svg>',
  },
};

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
