/**
 * 梦天工作台 - 本地数据存储引擎
 * LocalStorage-based persistence with daily auto-archive
 */
const Storage = {
  KEYS: {
    todos: 'mt_todos',
    books: 'mt_books',
    water: 'mt_water',
    reviews: 'mt_reviews',
    exercise: 'mt_exercise',
    inspirations: 'mt_inspirations',
    hotTopics: 'mt_hot_topics',
    readingNotes: 'mt_reading_notes',
    pomodoroLog: 'mt_pomodoro_log',
    archive: 'mt_archive',
    settings: 'mt_settings',
  },

  init() {
    // Initialize all keys if not exist
    Object.values(this.KEYS).forEach(key => {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify(this._getDefault(key)));
      }
    });
    this._autoArchive();
  },

  _getDefault(key) {
    if (key === this.KEYS.todos) return [];
    if (key === this.KEYS.books) return { reading: [], wantToRead: [] };
    if (key === this.KEYS.water) return this._dailyTemplate(0);
    if (key === this.KEYS.reviews) return {};
    if (key === this.KEYS.exercise) return { records: [], targetWeight: null };
    if (key === this.KEYS.inspirations) return [];
    if (key === this.KEYS.hotTopics) return { date: '', items: [] };
    if (key === this.KEYS.readingNotes) return [];
    if (key === this.KEYS.pomodoroLog) return this._dailyTemplate(0);
    if (key === this.KEYS.archive) return {};
    if (key === this.KEYS.settings) return {
      dailyWaterGoal: 2000,
      dailyReadingPages: 30,
      dailyReadingMinutes: 30,
      pomodoroFocus: 25,
      pomodoroBreak: 5,
      exerciseReminder: true,
      waterReminder: true,
      readingReminder: true,
      waterReminderInterval: 60,
    };
    return null;
  },

  _dailyTemplate(val) {
    const today = this._today();
    const t = {};
    t[today] = val;
    return t;
  },

  _today() {
    return new Date().toISOString().split('T')[0];
  },

  _getMonthKey(date) {
    const d = date ? new Date(date) : new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  },

  _getWeekKey(date) {
    const d = date ? new Date(date) : new Date();
    const start = new Date(d);
    start.setDate(d.getDate() - d.getDay());
    return start.toISOString().split('T')[0];
  },

  get(key) {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch { return this._getDefault(key); }
  },

  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
    // Trigger auto-sync
    this._notifyChange();
  },

  _notifyChange() {
    if (this._notifyTimer) clearTimeout(this._notifyTimer);
    this._notifyTimer = setTimeout(() => {
      if (typeof SettingsModule !== 'undefined' && SettingsModule.onDataChanged) {
        SettingsModule.onDataChanged();
      }
    }, 500);
  },

  // --- Todos ---
  getTodos() { return this.get(this.KEYS.todos); },
  saveTodos(todos) { this.set(this.KEYS.todos, todos); },

  // --- Books ---
  getBooks() { return this.get(this.KEYS.books); },
  saveBooks(books) { this.set(this.KEYS.books, books); },

  // --- Water ---
  getTodayWater() {
    const data = this.get(this.KEYS.water);
    return data[this._today()] || 0;
  },
  addWater(ml) {
    const data = this.get(this.KEYS.water);
    const today = this._today();
    data[today] = (data[today] || 0) + ml;
    this.set(this.KEYS.water, data);
    return data[today];
  },
  getWaterHistory(days = 7) {
    const data = this.get(this.KEYS.water);
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      result.push({ date: key, value: data[key] || 0 });
    }
    return result;
  },

  // --- Reviews ---
  getReviews() { return this.get(this.KEYS.reviews); },
  saveReview(date, review) {
    const reviews = this.get(this.KEYS.reviews);
    reviews[date] = review;
    this.set(this.KEYS.reviews, reviews);
  },
  getTodayReview() {
    const reviews = this.get(this.KEYS.reviews);
    return reviews[this._today()] || null;
  },
  getReviewsByMonth(monthKey) {
    const reviews = this.get(this.KEYS.reviews);
    return Object.entries(reviews)
      .filter(([k]) => k.startsWith(monthKey))
      .sort(([a], [b]) => b.localeCompare(a));
  },
  getReviewsByWeek(weekStart) {
    const reviews = this.get(this.KEYS.reviews);
    const end = new Date(weekStart); end.setDate(end.getDate() + 6);
    return Object.entries(reviews)
      .filter(([k]) => k >= weekStart && k <= end.toISOString().split('T')[0])
      .sort(([a], [b]) => b.localeCompare(a));
  },

  // --- Exercise ---
  getExercise() { return this.get(this.KEYS.exercise); },
  saveExercise(data) { this.set(this.KEYS.exercise, data); },
  addExerciseRecord(record) {
    const data = this.get(this.KEYS.exercise);
    record.date = record.date || this._today();
    data.records.push(record);
    this.set(this.KEYS.exercise, data);
  },

  // --- Inspirations ---
  getInspirations() { return this.get(this.KEYS.inspirations); },
  saveInspiration(item) {
    const items = this.get(this.KEYS.inspirations);
    item.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    item.date = this._today();
    item.favorite = false;
    items.unshift(item);
    this.set(this.KEYS.inspirations, items);
    return item;
  },
  toggleFavoriteInspiration(id) {
    const items = this.get(this.KEYS.inspirations);
    const item = items.find(i => i.id === id);
    if (item) { item.favorite = !item.favorite; this.set(this.KEYS.inspirations, items); }
    return item;
  },

  // --- Reading Notes ---
  getReadingNotes() { return this.get(this.KEYS.readingNotes); },
  saveReadingNote(note) {
    const notes = this.get(this.KEYS.readingNotes);
    note.id = Date.now().toString(36);
    note.date = this._today();
    notes.unshift(note);
    this.set(this.KEYS.readingNotes, notes);
  },

  // --- Pomodoro ---
  getTodayPomodoro() {
    const data = this.get(this.KEYS.pomodoroLog);
    return data[this._today()] || 0;
  },
  addPomodoroSession(minutes) {
    const data = this.get(this.KEYS.pomodoroLog);
    const today = this._today();
    data[today] = (data[today] || 0) + minutes;
    this.set(this.KEYS.pomodoroLog, data);
    return data[today];
  },
  getPomodoroHistory(days = 7) {
    const data = this.get(this.KEYS.pomodoroLog);
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      result.push({ date: key, value: data[key] || 0 });
    }
    return result;
  },

  // --- Hot Topics ---
  getHotTopics() { return this.get(this.KEYS.hotTopics); },
  saveHotTopics(items) {
    this.set(this.KEYS.hotTopics, { date: this._today(), items });
  },

  // --- Settings ---
  getSettings() { return this.get(this.KEYS.settings); },
  saveSettings(s) { this.set(this.KEYS.settings, s); },

  // --- Archive ---
  _autoArchive() {
    const archive = this.get(this.KEYS.archive);
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yKey = yesterday.toISOString().split('T')[0];

    if (!archive[yKey]) {
      const review = this.get(this.KEYS.reviews)[yKey];
      const water = this.get(this.KEYS.water)[yKey] || 0;
      const pomodoro = this.get(this.KEYS.pomodoroLog)[yKey] || 0;
      const todos = this.get(this.KEYS.todos);

      if (review || water > 0 || pomodoro > 0) {
        archive[yKey] = {
          review: review || null,
          water,
          pomodoro,
          todoCompleted: todos.filter(t => t.completed).length,
          todoTotal: todos.length,
          archivedAt: new Date().toISOString(),
        };
        this.set(this.KEYS.archive, archive);
      }
    }
  },

  getArchive() { return this.get(this.KEYS.archive); },

  // --- Data export/import ---
  exportAll() {
    const data = {};
    Object.values(this.KEYS).forEach(k => { data[k] = this.get(k); });
    return JSON.stringify(data, null, 2);
  },

  importAll(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      Object.entries(data).forEach(([k, v]) => {
        if (Object.values(this.KEYS).includes(k)) {
          this.set(k, v);
        }
      });
      return true;
    } catch { return false; }
  },

  // --- Clear today ---
  clearToday() {
    const today = this._today();
    ['mt_water', 'mt_pomodoro_log'].forEach(k => {
      const d = this.get(k); d[today] = 0; this.set(k, d);
    });
  },
};
