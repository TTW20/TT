/**
 * Module 1: 工作台概览 (Dashboard Overview)
 * Aggregated cards + quick entry
 */
const DashboardModule = {
  init() {
    this.refresh();
  },

  refresh() {
    this.renderTodoRing();
    this.renderWaterProgress();
    this.renderReadingCard();
    this.updateQuickNote();
  },

  renderTodoRing() {
    const todos = Storage.getTodos();
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const circumference = 2 * Math.PI * 38;
    const offset = circumference - (pct / 100) * circumference;

    document.getElementById('dashTodoRing').innerHTML = `
      <svg viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(0,0,0,0.06)" stroke-width="6"/>
        <circle cx="50" cy="50" r="38" fill="none" stroke="url(#todoGrad)" stroke-width="6"
          stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
          stroke-linecap="round"/>
        <defs>
          <linearGradient id="todoGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#5B9BD5"/>
            <stop offset="100%" stop-color="#9B8EC4"/>
          </linearGradient>
        </defs>
      </svg>
    `;
    document.getElementById('dashTodoValue').textContent = `${pct}%`;
    document.getElementById('dashTodoSub').textContent = `${completed}/${total} 完成`;

    // Check overdue
    const overdue = todos.filter(t => !t.completed && t.deadline && new Date(t.deadline) < new Date()).length;
    if (overdue > 0) {
      document.getElementById('dashTodoSub').textContent += ` · ${overdue}个逾期`;
      document.getElementById('dashTodoSub').style.color = 'var(--accent-red)';
    } else {
      document.getElementById('dashTodoSub').style.color = '';
    }
  },

  renderWaterProgress() {
    const current = Storage.getTodayWater();
    const goal = Storage.getSettings().dailyWaterGoal;
    const pct = Math.min(100, Math.round((current / goal) * 100));
    document.getElementById('dashWaterFill').style.width = `${pct}%`;
    document.getElementById('dashWaterValue').textContent = `${current}ml / ${goal}ml`;
    document.getElementById('dashWaterPct').textContent = `${pct}%`;
  },

  renderReadingCard() {
    const books = Storage.getBooks();
    const reading = books.reading;
    const container = document.getElementById('dashReadingCard');
    if (reading.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:20px;color:var(--text-tertiary)">
          <div style="font-size:32px;margin-bottom:8px">📚</div>
          <div style="font-size:13px">暂无在读书籍</div>
          <button class="btn btn-sm btn-primary mt-sm" onclick="App.showPage('bookshelf')">去添加</button>
        </div>`;
      return;
    }
    const book = reading[0];
    const progress = book.totalPages > 0 ? Math.round((book.currentPage / book.totalPages) * 100) : 0;
    container.innerHTML = `
      <div style="display:flex;gap:16px;align-items:center">
        <div class="reading-book-cover">${book.title.charAt(0)}</div>
        <div style="flex:1">
          <div style="font-weight:600;font-size:14px;margin-bottom:4px">${book.title}</div>
          <div style="font-size:12px;color:var(--text-tertiary);margin-bottom:6px">${book.author || ''}</div>
          <div style="display:flex;align-items:center;gap:10px">
            <div style="flex:1;height:8px;border-radius:4px;background:rgba(0,0,0,0.06);overflow:hidden">
              <div style="height:100%;width:${progress}%;background:linear-gradient(90deg,var(--accent-purple),var(--accent-pink));border-radius:4px;transition:width 0.6s"></div>
            </div>
            <span style="font-size:12px;color:var(--text-tertiary)">${progress}%</span>
          </div>
          <div style="font-size:11px;color:var(--text-tertiary);margin-top:4px">${book.currentPage || 0}/${book.totalPages || '?'} 页</div>
        </div>
      </div>`;
  },

  updateQuickNote() {
    const input = document.getElementById('quickNoteInput');
    if (input) {
      input.value = '';
      input.placeholder = '💡 记录此刻灵感...';
    }
  },

  saveQuickNote() {
    const input = document.getElementById('quickNoteInput');
    const text = input.value.trim();
    if (!text) return;
    Storage.saveInspiration({ type: 'text', content: text, category: '生活', tags: ['快速记录'] });
    input.value = '';
    App.toast('✅ 灵感已保存');
  },
};
