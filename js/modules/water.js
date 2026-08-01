/**
 * Module 5: 喝水时间 (Water Time)
 * Water intake visualization + quick logging
 */
const WaterModule = {
  init() {
    this.refresh();
  },

  refresh() {
    this.renderRing();
    this.renderHistory();
  },

  renderRing() {
    const current = Storage.getTodayWater();
    const goal = Storage.getSettings().dailyWaterGoal;
    const pct = Math.min(100, Math.round((current / goal) * 100));
    const circumference = 2 * Math.PI * 54;

    document.getElementById('waterRing').innerHTML = `
      <svg viewBox="0 0 130 130">
        <defs>
          <linearGradient id="waterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#6BB5C4"/>
            <stop offset="100%" stop-color="#5B9BD5"/>
          </linearGradient>
        </defs>
        <circle cx="65" cy="65" r="54" fill="none" stroke="rgba(0,0,0,0.05)" stroke-width="8"/>
        <circle cx="65" cy="65" r="54" fill="none" stroke="url(#waterGrad)" stroke-width="8"
          stroke-dasharray="${circumference}" stroke-dashoffset="${circumference - (pct/100) * circumference}"
          stroke-linecap="round">
          <animate attributeName="stroke-dashoffset" from="${circumference}" to="${circumference - (pct/100) * circumference}"
            dur="0.8s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1"/>
        </circle>
      </svg>
    `;
    document.getElementById('waterCurrent').textContent = current;
    document.getElementById('waterGoal').textContent = goal;
    document.getElementById('waterPct').textContent = `${pct}%`;

    const remaining = Math.max(0, goal - current);
    document.getElementById('waterRemaining').textContent = remaining > 0 ? `还需 ${remaining}ml` : '🎉 已达标！';
    document.getElementById('waterRemaining').style.color = remaining > 0 ? 'var(--text-secondary)' : 'var(--accent-green)';

    // Update quick add buttons
    this.renderQuickButtons();
  },

  renderQuickButtons() {
    const container = document.getElementById('waterQuickBtns');
    const presets = [200, 300, 500];
    container.innerHTML = presets.map(ml => `
      <button class="btn btn-secondary" onclick="WaterModule.addWater(${ml})">
        💧 ${ml}ml
      </button>
    `).join('');
  },

  addWater(ml) {
    const newTotal = Storage.addWater(ml);
    this.renderRing();
    this.renderHistory();
    App.toast(`💧 +${ml}ml (总计: ${newTotal}ml)`);
  },

  addCustomWater() {
    const input = document.getElementById('waterCustomInput');
    const ml = parseInt(input.value);
    if (!ml || ml <= 0) { App.toast('请输入有效水量'); return; }
    this.addWater(ml);
    input.value = '';
  },

  updateGoal() {
    const input = document.getElementById('waterGoalInput');
    const goal = parseInt(input.value);
    if (!goal || goal < 500) { App.toast('目标至少500ml'); return; }
    const settings = Storage.getSettings();
    settings.dailyWaterGoal = goal;
    Storage.saveSettings(settings);
    this.refresh();
    App.toast(`🎯 每日目标已更新为 ${goal}ml`);
  },

  renderHistory() {
    const history = Storage.getWaterHistory(7);
    const container = document.getElementById('waterHistory');
    const maxVal = Math.max(...history.map(h => h.value), 2000);

    container.innerHTML = `
      <div class="bar-chart">
        ${history.map(h => {
          const pct = maxVal > 0 ? (h.value / maxVal) * 100 : 0;
          const dateLabel = h.date.slice(5);
          const isToday = h.date === App.today();
          return `
            <div class="bar-item">
              <div style="font-size:10px;color:var(--text-tertiary);margin-bottom:2px">${h.value}ml</div>
              <div class="bar-fill" style="height:${Math.max(4, pct)}%;background:${isToday ? 'linear-gradient(180deg, #6BB5C4, #5B9BD5)' : 'rgba(0,0,0,0.08)'}"></div>
              <div class="bar-label" style="font-weight:${isToday ? '600' : '400'};color:${isToday ? 'var(--accent-blue)' : 'var(--text-tertiary)'}">${dateLabel}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },
};
