/**
 * Module 6: 今日复盘 (Daily Review)
 * Full-dimension data visualization + 3-question self-reflection
 */
const ReviewModule = {
  viewMode: 'today',

  init() {
    this.refresh();
  },

  refresh() {
    if (this.viewMode === 'today') {
      this.renderToday();
    } else if (this.viewMode === 'week') {
      this.renderWeekSummary();
    } else if (this.viewMode === 'month') {
      this.renderMonthHistory();
    }
  },

  renderToday() {
    this.renderStatsBoard();
    this.renderReflectionForm();
  },

  renderStatsBoard() {
    const todos = Storage.getTodos();
    const todoTotal = todos.length;
    const todoCompleted = todos.filter(t => t.completed).length;
    const todoPct = todoTotal > 0 ? Math.round((todoCompleted / todoTotal) * 100) : 0;

    const waterCurrent = Storage.getTodayWater();
    const waterGoal = Storage.getSettings().dailyWaterGoal;
    const waterPct = Math.min(100, Math.round((waterCurrent / waterGoal) * 100));

    const pomodoroToday = Storage.getTodayPomodoro();

    // Calculate reading time
    const books = Storage.getBooks();
    const totalReadPages = books.reading.reduce((sum, b) => sum + (b.currentPage || 0), 0);

    // Exercise data
    const exerciseData = Storage.getExercise();
    const todayWorkouts = exerciseData.records.filter(r => r.date === App.today() && r.type === 'workout');
    const exerciseMinutes = todayWorkouts.reduce((sum, r) => sum + (r.duration || 0), 0);

    // Generate stats cards
    document.getElementById('reviewStatsBoard').innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px">
        <div class="glass-card flat" style="text-align:center;padding:18px">
          <div style="font-size:32px;font-weight:200;color:var(--accent-blue)">${todoPct}%</div>
          <div style="font-size:13px;color:var(--text-secondary);margin-top:4px">待办完成率</div>
          <div style="margin-top:8px;height:6px;border-radius:3px;background:rgba(0,0,0,0.06);overflow:hidden">
            <div style="height:100%;width:${todoPct}%;background:var(--accent-blue);border-radius:3px;transition:width 0.6s"></div>
          </div>
          <div style="font-size:11px;color:var(--text-tertiary);margin-top:6px">${todoCompleted}/${todoTotal} 项已完成</div>
        </div>
        <div class="glass-card flat" style="text-align:center;padding:18px">
          <div style="font-size:32px;font-weight:200;color:var(--accent-cyan)">${waterPct}%</div>
          <div style="font-size:13px;color:var(--text-secondary);margin-top:4px">饮水完成度</div>
          <div style="margin-top:8px;height:6px;border-radius:3px;background:rgba(0,0,0,0.06);overflow:hidden">
            <div style="height:100%;width:${waterPct}%;background:var(--accent-cyan);border-radius:3px;transition:width 0.6s"></div>
          </div>
          <div style="font-size:11px;color:var(--text-tertiary);margin-top:6px">${waterCurrent}/${waterGoal}ml</div>
        </div>
        <div class="glass-card flat" style="text-align:center;padding:18px">
          <div style="font-size:32px;font-weight:200;color:var(--accent-green)">${exerciseMinutes}</div>
          <div style="font-size:13px;color:var(--text-secondary);margin-top:4px">运动时长</div>
          <div style="font-size:11px;color:var(--text-tertiary);margin-top:12px">单位：分钟</div>
        </div>
        <div class="glass-card flat" style="text-align:center;padding:18px">
          <div style="font-size:32px;font-weight:200;color:var(--accent-purple)">${totalReadPages}</div>
          <div style="font-size:13px;color:var(--text-secondary);margin-top:4px">累计阅读页数</div>
          <div style="font-size:11px;color:var(--text-tertiary);margin-top:8px">${books.reading.length} 本书在读</div>
        </div>
        <div class="glass-card flat" style="text-align:center;padding:18px">
          <div style="font-size:32px;font-weight:200;color:var(--accent-orange)">${pomodoroToday}</div>
          <div style="font-size:13px;color:var(--text-secondary);margin-top:4px">番茄专注时长</div>
          <div style="font-size:11px;color:var(--text-tertiary);margin-top:8px">单位：分钟</div>
        </div>
        <div class="glass-card flat" style="text-align:center;padding:18px">
          <div style="font-size:32px;font-weight:200;color:var(--accent-pink)">${pomodoroToday + exerciseMinutes + (totalReadPages > 0 ? 30 : 0)}</div>
          <div style="font-size:13px;color:var(--text-secondary);margin-top:4px">今日自我投资</div>
          <div style="font-size:11px;color:var(--text-tertiary);margin-top:8px">学习+运动+阅读</div>
        </div>
      </div>
    `;

    // Weekly trend mini chart
    this.renderWeeklyTrend();
  },

  renderWeeklyTrend() {
    const waterHistory = Storage.getWaterHistory(7);
    const pomodoroHistory = Storage.getPomodoroHistory(7);
    const container = document.getElementById('reviewWeeklyTrend');

    const days = waterHistory.map(h => h.date.slice(5));
    const waterVals = waterHistory.map(h => h.value);
    const maxWater = Math.max(...waterVals, 2000);
    const pomoVals = pomodoroHistory.map(h => h.value);
    const maxPomo = Math.max(...pomoVals, 60);

    container.innerHTML = `
      <div style="font-size:13px;font-weight:560;margin-bottom:10px;color:var(--text-secondary)">📊 近7日趋势</div>
      <div style="display:flex;align-items:flex-end;gap:8px;height:80px;">
        ${waterVals.map((v, i) => {
          const hPct = maxWater > 0 ? (v / maxWater) * 100 : 0;
          const isToday = i === 6;
          return `
            <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px">
              <div style="width:100%;max-width:28px;height:${Math.max(3, hPct)}%;background:${isToday ? 'var(--accent-cyan)' : 'rgba(107,181,196,0.3)'};border-radius:4px 4px 2px 2px;transition:height 0.5s" title="饮水: ${v}ml"></div>
              <div style="width:100%;max-width:28px;height:${Math.max(3, maxPomo > 0 ? (pomoVals[i]/maxPomo)*100 : 0)}%;background:${isToday ? 'var(--accent-orange)' : 'rgba(232,168,96,0.3)'};border-radius:4px 4px 2px 2px;transition:height 0.5s" title="番茄: ${pomoVals[i]}min"></div>
              <div style="font-size:9px;color:${isToday ? 'var(--accent-blue)' : 'var(--text-tertiary)'};font-weight:${isToday ? '600' : '400'}">${days[i]}</div>
            </div>
          `;
        }).join('')}
      </div>
      <div style="display:flex;gap:16px;margin-top:6px;font-size:10px;color:var(--text-tertiary)">
        <span>🔵 饮水</span><span>🟠 番茄</span>
      </div>
    `;
  },

  renderReflectionForm() {
    const existing = Storage.getTodayReview();
    document.getElementById('reviewQ1').value = existing ? existing.q1 : '';
    document.getElementById('reviewQ2').value = existing ? existing.q2 : '';
    document.getElementById('reviewQ3').value = existing ? existing.q3 : '';
  },

  saveReview() {
    const q1 = document.getElementById('reviewQ1').value.trim();
    const q2 = document.getElementById('reviewQ2').value.trim();
    const q3 = document.getElementById('reviewQ3').value.trim();

    if (!q1 && !q2 && !q3) { App.toast('请至少填写一项复盘内容'); return; }

    const review = { q1, q2, q3, savedAt: new Date().toISOString() };
    Storage.saveReview(App.today(), review);
    App.toast('✅ 今日复盘已保存');
  },

  renderWeekSummary() {
    const weekStart = Storage._getWeekKey();
    const reviews = Storage.getReviewsByWeek(weekStart);
    const container = document.getElementById('reviewHistoryContent');

    if (reviews.length === 0) {
      container.innerHTML = `<div style="text-align:center;padding:30px;color:var(--text-tertiary)">本周暂无复盘记录</div>`;
      return;
    }

    // Aggregate learnings
    const allLearnings = reviews.map(([, r]) => r.q2).filter(Boolean);

    container.innerHTML = `
      <div class="section-title">📅 本周复盘 (${weekStart} 起)</div>
      <div class="glass-card flat mb-md" style="padding:16px">
        <div style="font-size:14px;font-weight:560;margin-bottom:8px">📊 本周统计</div>
        <div style="display:flex;gap:20px">
          <div><span style="font-size:24px;font-weight:300;color:var(--accent-blue)">${reviews.length}</span><span style="font-size:12px;color:var(--text-tertiary)"> 天复盘</span></div>
          <div><span style="font-size:24px;font-weight:300;color:var(--accent-purple)">${allLearnings.length}</span><span style="font-size:12px;color:var(--text-tertiary)"> 条感悟</span></div>
        </div>
      </div>
      ${reviews.map(([date, r]) => `
        <div class="glass-card flat mb-sm" style="padding:14px 18px">
          <div style="font-size:13px;font-weight:600;margin-bottom:8px;color:var(--accent-blue)">${date}</div>
          ${r.q1 ? `<div style="font-size:13px;margin-bottom:6px"><span style="color:var(--accent-teal)">①</span> ${r.q1}</div>` : ''}
          ${r.q2 ? `<div style="font-size:13px;margin-bottom:6px"><span style="color:var(--accent-purple)">②</span> ${r.q2}</div>` : ''}
          ${r.q3 ? `<div style="font-size:13px"><span style="color:var(--accent-orange)">③</span> ${r.q3}</div>` : ''}
        </div>
      `).join('')}
    `;
  },

  renderMonthHistory() {
    const monthKey = Storage._getMonthKey();
    const reviews = Storage.getReviewsByMonth(monthKey);
    const container = document.getElementById('reviewHistoryContent');

    if (reviews.length === 0) {
      container.innerHTML = `<div style="text-align:center;padding:30px;color:var(--text-tertiary)">本月暂无复盘记录</div>`;
      return;
    }

    container.innerHTML = `
      <div class="section-title">🗓 本月复盘 (${monthKey})</div>
      <div style="font-size:12px;color:var(--text-tertiary);margin-bottom:16px">共 ${reviews.length} 天记录</div>
      ${reviews.map(([date, r]) => `
        <div class="glass-card flat mb-sm" style="padding:14px 18px">
          <div style="font-size:13px;font-weight:600;margin-bottom:8px;color:var(--accent-blue)">${date}</div>
          ${r.q1 ? `<div style="font-size:13px;margin-bottom:4px;line-height:1.5">✅ <b>完成：</b>${r.q1}</div>` : ''}
          ${r.q2 ? `<div style="font-size:13px;margin-bottom:4px;line-height:1.5">💡 <b>学到：</b>${r.q2}</div>` : ''}
          ${r.q3 ? `<div style="font-size:13px;line-height:1.5">🔧 <b>改进：</b>${r.q3}</div>` : ''}
        </div>
      `).join('')}
    `;
  },

  switchView(mode) {
    this.viewMode = mode;
    document.querySelectorAll('#reviewViewTabs .btn').forEach(b => b.classList.remove('btn-primary'));
    document.querySelector(`#reviewViewTabs [data-view="${mode}"]`).classList.add('btn-primary');

    if (mode === 'today') {
      document.getElementById('reviewTodaySection').style.display = '';
      document.getElementById('reviewHistorySection').style.display = 'none';
    } else {
      document.getElementById('reviewTodaySection').style.display = 'none';
      document.getElementById('reviewHistorySection').style.display = '';
    }
    this.refresh();
  },
};
