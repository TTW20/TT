/**
 * Module 3: 今日待办 (Todo List)
 * 4-color priority classification + Pomodoro timer
 */
const TodoModule = {
  filter: 'all',
  pomodoroRunning: false,
  pomodoroSeconds: 0,
  pomodoroIsBreak: false,
  pomodoroInterval: null,
  pomodoroFocusMin: 25,
  pomodoroBreakMin: 5,

  init() {
    const settings = Storage.getSettings();
    this.pomodoroFocusMin = settings.pomodoroFocus;
    this.pomodoroBreakMin = settings.pomodoroBreak;
    this.refresh();
  },

  refresh() {
    this.renderList();
    this.updatePomodoroDisplay();
    this.updateStats();
  },

  renderList() {
    const todos = Storage.getTodos();
    let filtered = todos;
    if (this.filter === 'active') filtered = todos.filter(t => !t.completed);
    else if (this.filter === 'completed') filtered = todos.filter(t => t.completed);
    else if (this.filter === 'overdue') {
      filtered = todos.filter(t => !t.completed && t.deadline && new Date(t.deadline) < new Date());
    }

    const container = document.getElementById('todoList');

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:30px;color:var(--text-tertiary)">
          <div style="font-size:40px;margin-bottom:10px">📋</div>
          <div>暂无待办事项</div>
          <div style="font-size:12px;margin-top:4px">点击下方按钮添加新任务</div>
        </div>`;
      return;
    }

    container.innerHTML = filtered.map(t => {
      const isOverdue = !t.completed && t.deadline && new Date(t.deadline) < new Date();
      const priorityColors = { urgent: 'var(--accent-red)', important: 'var(--accent-orange)',
                               normal: 'var(--accent-blue)', low: 'var(--text-tertiary)' };
      const priorityLabels = { urgent: '紧急重要', important: '重要不紧急',
                               normal: '紧急不重要', low: '普通琐事' };
      const tagClass = { urgent: 'tag-red', important: 'tag-orange',
                         normal: 'tag-blue', low: 'tag-gray' };

      return `
        <div class="todo-item ${t.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}"
             id="todo-${t.id}" data-id="${t.id}">
          <div class="priority-dot" style="background:${priorityColors[t.priority] || 'var(--text-tertiary)'}"
               title="${priorityLabels[t.priority] || t.priority}"></div>
          <div class="todo-checkbox ${t.completed ? 'checked' : ''}"
               onclick="TodoModule.toggleTodo('${t.id}')">
            ${t.completed ? '✓' : ''}
          </div>
          <div class="todo-text">
            <div style="font-weight:500">${t.text}</div>
            ${t.note ? `<div style="font-size:11px;color:var(--text-tertiary);margin-top:2px">📝 ${t.note}</div>` : ''}
          </div>
          <div class="todo-meta">
            ${t.deadline ? `<span style="font-size:11px;color:${isOverdue ? 'var(--accent-red)' : 'var(--text-tertiary)'}">
              ${isOverdue ? '⚠️ ' : ''}${t.deadline.split('T')[0]}</span>` : ''}
            ${t.tags ? t.tags.map(tag => `<span class="tag tag-blue">${tag}</span>`).join('') : ''}
            <span class="tag ${tagClass[t.priority] || 'tag-gray'}">${priorityLabels[t.priority] || '普通'}</span>
            <button class="btn-icon" style="width:26px;height:26px" onclick="TodoModule.deleteTodo('${t.id}')"
                    title="删除">🗑</button>
          </div>
        </div>
      `;
    }).join('');
  },

  addTodo() {
    const textInput = document.getElementById('todoInput');
    const deadlineInput = document.getElementById('todoDeadline');
    const noteInput = document.getElementById('todoNote');
    const priorityInput = document.getElementById('todoPriority');
    const tagInput = document.getElementById('todoTag');

    const text = textInput.value.trim();
    if (!text) { App.toast('请输入待办内容'); return; }

    const todo = {
      id: Date.now().toString(36),
      text,
      deadline: deadlineInput.value || null,
      note: noteInput.value.trim() || '',
      priority: priorityInput.value || 'normal',
      tags: tagInput.value.trim() ? tagInput.value.trim().split(',').map(s => s.trim()) : [],
      completed: false,
      createdAt: new Date().toISOString(),
    };

    const todos = Storage.getTodos();
    todos.unshift(todo);
    Storage.saveTodos(todos);

    textInput.value = '';
    deadlineInput.value = '';
    noteInput.value = '';
    tagInput.value = '';

    this.refresh();
    App.toast('✅ 待办已添加');
  },

  toggleTodo(id) {
    const todos = Storage.getTodos();
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    // If completing
    if (!todo.completed) {
      const el = document.getElementById(`todo-${id}`);
      if (el) {
        el.classList.add('removing');
        setTimeout(() => {
          todo.completed = true;
          Storage.saveTodos(todos);
          this.refresh();
          App.toast('✓ 任务完成！');
        }, 400);
        return;
      }
    }

    todo.completed = !todo.completed;
    Storage.saveTodos(todos);
    this.refresh();
  },

  deleteTodo(id) {
    const el = document.getElementById(`todo-${id}`);
    if (el) {
      el.classList.add('removing');
      setTimeout(() => {
        const todos = Storage.getTodos().filter(t => t.id !== id);
        Storage.saveTodos(todos);
        this.refresh();
      }, 400);
    } else {
      const todos = Storage.getTodos().filter(t => t.id !== id);
      Storage.saveTodos(todos);
      this.refresh();
    }
  },

  clearCompleted() {
    const todos = Storage.getTodos().filter(t => !t.completed);
    Storage.saveTodos(todos);
    this.refresh();
    App.toast('🧹 已完成任务已清除');
  },

  clearAll() {
    if (confirm('确定要清除所有待办吗？此操作不可恢复。')) {
      Storage.saveTodos([]);
      this.refresh();
      App.toast('🧹 全部待办已清除');
    }
  },

  setFilter(filter) {
    this.filter = filter;
    document.querySelectorAll('#todoFilters .btn').forEach(b => b.classList.remove('btn-primary'));
    const activeBtn = document.querySelector(`#todoFilters [data-filter="${filter}"]`);
    if (activeBtn) activeBtn.classList.add('btn-primary');
    this.renderList();
  },

  updateStats() {
    const todos = Storage.getTodos();
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const overdue = todos.filter(t => !t.completed && t.deadline && new Date(t.deadline) < new Date()).length;
    const todayFocus = Storage.getTodayPomodoro();

    document.getElementById('todoStats').innerHTML = `
      <span style="color:var(--text-tertiary)">总计 ${total}</span>
      <span style="color:var(--accent-green);margin:0 12px">✓ ${completed} 完成</span>
      ${overdue > 0 ? `<span style="color:var(--accent-red);margin-right:12px">⚠ ${overdue} 逾期</span>` : ''}
      <span style="color:var(--accent-orange)">🍅 ${todayFocus}min 专注</span>
    `;
  },

  // --- Pomodoro Timer ---
  startPomodoro() {
    if (this.pomodoroRunning) return;
    this.pomodoroRunning = true;
    this.pomodoroIsBreak = false;
    this.pomodoroSeconds = this.pomodoroFocusMin * 60;
    this.updatePomodoroDisplay();
    this.showPomodoroOverlay();

    this.pomodoroInterval = setInterval(() => {
      this.pomodoroSeconds--;
      this.updatePomodoroDisplay();
      if (this.pomodoroSeconds <= 0) {
        this.pomodoroComplete();
      }
    }, 1000);
  },

  pausePomodoro() {
    this.pomodoroRunning = false;
    clearInterval(this.pomodoroInterval);
    this.updatePomodoroDisplay();
  },

  resumePomodoro() {
    if (this.pomodoroRunning) return;
    this.pomodoroRunning = true;
    this.pomodoroInterval = setInterval(() => {
      this.pomodoroSeconds--;
      this.updatePomodoroDisplay();
      if (this.pomodoroSeconds <= 0) {
        this.pomodoroComplete();
      }
    }, 1000);
  },

  stopPomodoro() {
    this.pomodoroRunning = false;
    clearInterval(this.pomodoroInterval);
    this.pomodoroSeconds = this.pomodoroFocusMin * 60;
    this.hidePomodoroOverlay();
    this.updatePomodoroDisplay();
  },

  pomodoroComplete() {
    clearInterval(this.pomodoroInterval);
    this.pomodoroRunning = false;

    if (!this.pomodoroIsBreak) {
      // Focus session completed
      Storage.addPomodoroSession(this.pomodoroFocusMin);
      App.toast(`🍅 ${this.pomodoroFocusMin}分钟专注完成！休息一下~`);

      // Start break
      this.pomodoroIsBreak = true;
      this.pomodoroSeconds = this.pomodoroBreakMin * 60;
      this.pomodoroRunning = true;
      this.updatePomodoroDisplay();

      this.pomodoroInterval = setInterval(() => {
        this.pomodoroSeconds--;
        this.updatePomodoroDisplay();
        if (this.pomodoroSeconds <= 0) {
          clearInterval(this.pomodoroInterval);
          this.pomodoroRunning = false;
          this.pomodoroIsBreak = false;
          this.pomodoroSeconds = this.pomodoroFocusMin * 60;
          this.hidePomodoroOverlay();
          this.updatePomodoroDisplay();
          this.updateStats();
          App.toast('☕ 休息结束，可以开始新的番茄钟了');
        }
      }, 1000);
    }

    this.updateStats();
  },

  showPomodoroOverlay() {
    let overlay = document.getElementById('pomodoroOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'pomodoroOverlay';
      overlay.className = 'pomodoro-overlay';
      overlay.innerHTML = `
        <div class="pomodoro-overlay-content">
          <div style="font-size:16px;font-weight:500;margin-bottom:12px" id="pomodoroOverlayStatus">
            🍅 专注中...
          </div>
          <div class="timer-big" id="pomodoroOverlayTimer">25:00</div>
          <div style="margin-top:28px;display:flex;gap:14px;justify-content:center">
            <button class="btn btn-secondary" onclick="TodoModule.stopPomodoro()" style="color:#fff;border-color:rgba(255,255,255,0.3)">✕ 结束专注</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
    }
    overlay.style.display = 'flex';
    document.getElementById('pomodoroOverlayStatus').textContent = '🍅 专注中...';
  },

  hidePomodoroOverlay() {
    const overlay = document.getElementById('pomodoroOverlay');
    if (overlay) overlay.style.display = 'none';
  },

  updatePomodoroDisplay() {
    const mins = Math.floor(Math.abs(this.pomodoroSeconds) / 60);
    const secs = Math.abs(this.pomodoroSeconds) % 60;
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    // Inline display
    const timerEl = document.getElementById('pomodoroTimer');
    const statusEl = document.getElementById('pomodoroStatus');
    const btnEl = document.getElementById('pomodoroBtn');

    if (timerEl) timerEl.textContent = timeStr;
    if (statusEl) {
      if (this.pomodoroRunning && !this.pomodoroIsBreak) statusEl.textContent = '🍅 专注中...';
      else if (this.pomodoroRunning && this.pomodoroIsBreak) statusEl.textContent = '☕ 休息中...';
      else statusEl.textContent = '准备开始专注';
    }
    if (btnEl) {
      if (this.pomodoroRunning) {
        btnEl.textContent = '⏸ 暂停';
        btnEl.className = 'btn btn-secondary btn-sm';
        btnEl.onclick = () => TodoModule.pausePomodoro();
      } else if (this.pomodoroSeconds < this.pomodoroFocusMin * 60) {
        btnEl.textContent = '▶ 继续';
        btnEl.className = 'btn btn-primary btn-sm';
        btnEl.onclick = () => TodoModule.resumePomodoro();
      } else {
        btnEl.textContent = '🍅 开始专注';
        btnEl.className = 'btn btn-primary btn-sm';
        btnEl.onclick = () => TodoModule.startPomodoro();
      }
    }

    // Overlay display
    const overlayTimer = document.getElementById('pomodoroOverlayTimer');
    const overlayStatus = document.getElementById('pomodoroOverlayStatus');
    if (overlayTimer) overlayTimer.textContent = timeStr;
    if (overlayStatus && this.pomodoroIsBreak) overlayStatus.textContent = '☕ 休息时间';
    if (overlayStatus && !this.pomodoroIsBreak && this.pomodoroRunning) overlayStatus.textContent = '🍅 专注中...';
  },
};
