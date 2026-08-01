/**
 * Module 7: 今日运动 (Exercise)
 * Weight tracking + workout log + motivational quotes
 */
const ExerciseModule = {
  workoutTimerRunning: false,
  workoutTimerSeconds: 0,
  workoutTimerInterval: null,

  init() {
    this.refresh();
  },

  refresh() {
    this.renderMotivation();
    this.renderWeightChart();
    this.renderRecords();
    this.updateTimerDisplay();
  },

  // ===== Workout Timer =====
  toggleTimer() {
    if (this.workoutTimerRunning) {
      this.stopTimer();
    } else {
      this.startTimer();
    }
  },

  startTimer() {
    this.workoutTimerRunning = true;
    this.workoutTimerInterval = setInterval(() => {
      this.workoutTimerSeconds++;
      this.updateTimerDisplay();
    }, 1000);

    const btn = document.getElementById('workoutTimerBtn');
    const saveBtn = document.getElementById('workoutSaveBtn');
    const status = document.getElementById('workoutTimerStatus');
    if (btn) { btn.textContent = '⏹ 结束运动'; btn.className = 'btn btn-danger'; }
    if (saveBtn) saveBtn.style.display = '';
    if (status) status.textContent = '🔥 运动中...加油！';
    this.updateTimerDisplay();
  },

  stopTimer() {
    this.workoutTimerRunning = false;
    clearInterval(this.workoutTimerInterval);

    const btn = document.getElementById('workoutTimerBtn');
    const status = document.getElementById('workoutTimerStatus');
    if (btn) { btn.textContent = '▶ 开始运动'; btn.className = 'btn btn-primary'; }
    if (status) {
      const mins = Math.round(this.workoutTimerSeconds / 60);
      status.textContent = `运动结束 · 共 ${mins} 分钟 🎉`;
    }
    this.updateTimerDisplay();
  },

  saveTimerRecord() {
    const mins = Math.round(this.workoutTimerSeconds / 60);
    if (mins < 1) { App.toast('运动不足1分钟，再坚持一下吧~'); return; }

    const typeEl = document.getElementById('workoutType');
    const workoutType = typeEl ? typeEl.value.replace(/^[^\s]+\s/, '') : '其他';

    const data = Storage.getExercise();
    data.records.push({
      date: App.today(),
      type: 'workout',
      workoutType,
      duration: mins,
      source: 'timer',
    });
    Storage.saveExercise(data);

    // Reset timer
    this.workoutTimerSeconds = 0;
    this.workoutTimerRunning = false;
    clearInterval(this.workoutTimerInterval);

    const btn = document.getElementById('workoutTimerBtn');
    const saveBtn = document.getElementById('workoutSaveBtn');
    const status = document.getElementById('workoutTimerStatus');
    if (btn) { btn.textContent = '▶ 开始运动'; btn.className = 'btn btn-primary'; }
    if (saveBtn) saveBtn.style.display = 'none';
    if (status) status.textContent = '准备开始运动';

    this.updateTimerDisplay();
    this.renderRecords();
    App.toast(`🏃 ${workoutType} ${mins}分钟已记录！`);
  },

  updateTimerDisplay() {
    const display = document.getElementById('workoutTimerDisplay');
    if (display) {
      const mins = Math.floor(this.workoutTimerSeconds / 60);
      const secs = this.workoutTimerSeconds % 60;
      display.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
  },

  renderMotivation() {
    const quotes = [
      '💪 每一次流汗，都是在和更好的自己相遇',
      '🔥 今天多流一滴汗，明天少叹一口气',
      '✨ 你的身体比你想象的更强大',
      '🌟 坚持下去，你会感谢现在努力的自己',
      '🏃 马拉松也是从第一步开始的',
      '🌈 别想太多，动起来就对了！',
      '🎯 你的目标体重在向你招手',
      '💎 自律即自由，每一滴汗都算数',
      '🌻 健康的身体是灵魂的客厅',
      '⚡ 今天也要元气满满地运动呀！',
    ];
    const idx = new Date().getDate() % quotes.length;
    document.getElementById('exerciseMotivation').textContent = quotes[idx];
  },

  addWeight() {
    const input = document.getElementById('weightInput');
    const val = parseFloat(input.value);
    if (!val || val < 30 || val > 200) { App.toast('请输入有效体重 (30-200kg)'); return; }

    const data = Storage.getExercise();
    data.records.push({
      date: App.today(),
      type: 'weight',
      value: val,
    });
    // Remove duplicate weight entries for same day
    const todayWeights = data.records.filter(r => r.type === 'weight' && r.date === App.today());
    if (todayWeights.length > 1) {
      // Keep only latest
      const idx = data.records.findLastIndex(r => r.type === 'weight' && r.date === App.today());
      data.records = data.records.filter((r, i) => {
        if (r.type === 'weight' && r.date === App.today() && i !== idx) return false;
        return true;
      });
    }
    Storage.saveExercise(data);
    input.value = '';
    this.refresh();
    App.toast(`⚖️ 体重已记录: ${val}kg`);
  },

  setTargetWeight() {
    const input = document.getElementById('targetWeightInput');
    const val = parseFloat(input.value);
    if (!val || val < 30 || val > 200) { App.toast('请输入有效目标体重'); return; }

    const data = Storage.getExercise();
    data.targetWeight = val;
    Storage.saveExercise(data);
    this.refresh();
    App.toast(`🎯 目标体重: ${val}kg`);
  },

  addWorkout() {
    const typeEl = document.getElementById('workoutType');
    const durationEl = document.getElementById('workoutDuration');
    // Strip emoji prefix if present (e.g. "🏃 跑步" → "跑步")
    const rawType = typeEl ? typeEl.value : '其他';
    const type = rawType.replace(/^[^\s]+\s/, '') || rawType;
    const duration = parseInt(durationEl.value);

    if (!duration || duration <= 0) { App.toast('请输入运动时长'); return; }

    const data = Storage.getExercise();
    data.records.push({
      date: App.today(),
      type: 'workout',
      workoutType: type,
      duration,
    });
    Storage.saveExercise(data);
    if (durationEl) durationEl.value = '';
    this.refresh();
    App.toast(`🏃 ${type} ${duration}分钟 已记录`);
  },

  renderWeightChart() {
    const data = Storage.getExercise();
    const weightRecords = data.records.filter(r => r.type === 'weight').sort((a, b) => a.date.localeCompare(b.date));
    const container = document.getElementById('weightChart');

    if (weightRecords.length < 2) {
      container.innerHTML = `
        <div style="text-align:center;padding:24px;color:var(--text-tertiary)">
          <div style="font-size:32px;margin-bottom:8px">📉</div>
          <div style="font-size:13px">记录两天以上体重即可生成趋势图</div>
          ${weightRecords.length === 1 ? `<div style="font-size:12px;margin-top:4px">当前体重: ${weightRecords[0].value}kg</div>` : ''}
        </div>`;
      return;
    }

    // Show last 30 days
    const recent = weightRecords.slice(-30);
    const values = recent.map(r => r.value);
    const minVal = Math.min(...values) - 1;
    const maxVal = Math.max(...values) + 1;
    const range = maxVal - minVal;
    const targetWeight = data.targetWeight;

    // SVG line chart
    const width = 600;
    const height = 160;
    const padding = { top: 10, right: 20, bottom: 25, left: 40 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const points = recent.map((r, i) => {
      const x = padding.left + (i / Math.max(recent.length - 1, 1)) * chartW;
      const y = padding.top + chartH - ((r.value - minVal) / range) * chartH;
      return `${x},${y}`;
    });

    const targetY = targetWeight ? padding.top + chartH - ((targetWeight - minVal) / range) * chartH : null;

    container.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
        <span style="font-size:13px;font-weight:560">📈 体重趋势 (近${recent.length}天)</span>
        <span style="font-size:12px;color:var(--text-tertiary)">
          当前: <b style="color:var(--accent-blue)">${values[values.length-1]}kg</b>
          ${targetWeight ? ` · 目标: <b style="color:var(--accent-green)">${targetWeight}kg</b>` : ''}
        </span>
      </div>
      <svg viewBox="0 0 ${width} ${height}" style="width:100%;height:auto">
        <!-- Grid lines -->
        ${[0, 0.25, 0.5, 0.75, 1].map(p => {
          const y = padding.top + chartH * (1 - p);
          return `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="rgba(0,0,0,0.05)" stroke-width="0.5"/>`;
        }).join('')}
        <!-- Target line -->
        ${targetY ? `<line x1="${padding.left}" y1="${targetY}" x2="${width - padding.right}" y2="${targetY}" stroke="var(--accent-green)" stroke-width="1" stroke-dasharray="4,4"/>` : ''}
        <!-- Line -->
        <polyline points="${points.join(' ')}" fill="none" stroke="var(--accent-blue)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <!-- Area fill -->
        <polygon points="${points[0]} ${points.join(' ')} ${points[points.length-1]} ${padding.left + chartW},${padding.top + chartH} ${padding.left},${padding.top + chartH}"
          fill="rgba(91,155,213,0.08)"/>
        <!-- Dots -->
        ${recent.map((r, i) => {
          const x = padding.left + (i / Math.max(recent.length - 1, 1)) * chartW;
          const y = padding.top + chartH - ((r.value - minVal) / range) * chartH;
          const isLast = i === recent.length - 1;
          return `<circle cx="${x}" cy="${y}" r="${isLast ? 4 : 2.5}" fill="${isLast ? 'var(--accent-blue)' : 'var(--accent-blue)'}" stroke="#fff" stroke-width="1.5"/>`;
        }).join('')}
        <!-- Y axis labels -->
        <text x="${padding.left - 6}" y="${padding.top + 4}" text-anchor="end" font-size="9" fill="var(--text-tertiary)">${maxVal.toFixed(1)}</text>
        <text x="${padding.left - 6}" y="${padding.top + chartH + 4}" text-anchor="end" font-size="9" fill="var(--text-tertiary)">${minVal.toFixed(1)}</text>
      </svg>`;
  },

  renderRecords() {
    const data = Storage.getExercise();
    const todayRecords = data.records
      .filter(r => r.date === App.today() && r.type === 'workout')
      .sort((a, b) => b.duration - a.duration);

    const container = document.getElementById('exerciseTodayRecords');
    const totalMin = todayRecords.reduce((sum, r) => sum + r.duration, 0);

    let html = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <span style="font-size:14px;font-weight:560">今日运动记录</span>
        <span style="font-size:13px;color:var(--text-tertiary)">总计: <b style="color:var(--accent-green)">${totalMin}分钟</b></span>
      </div>`;

    if (todayRecords.length === 0) {
      html += `<div style="text-align:center;padding:16px;color:var(--text-tertiary);font-size:13px">今天还没有运动记录哦~</div>`;
    } else {
      html += todayRecords.map(r => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-radius:10px;background:var(--glass-bg-light);margin-bottom:6px">
          <span>${this.getWorkoutEmoji(r.workoutType)} ${r.workoutType}</span>
          <span style="font-weight:560;color:var(--accent-teal)">${r.duration} 分钟</span>
        </div>
      `).join('');
    }

    // Recent history
    const recentWorkouts = data.records
      .filter(r => r.type === 'workout')
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 10);

    if (recentWorkouts.length > 0) {
      html += `<div style="font-size:13px;font-weight:560;margin:16px 0 8px;color:var(--text-secondary)">📋 近期记录</div>`;
      html += recentWorkouts.map(r => `
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--glass-border);font-size:12px">
          <span>${r.date} ${this.getWorkoutEmoji(r.workoutType)} ${r.workoutType}</span>
          <span style="color:var(--text-tertiary)">${r.duration}min</span>
        </div>
      `).join('');
    }

    container.innerHTML = html;
  },

  getWorkoutEmoji(type) {
    const map = { '跑步': '🏃', '跳绳': '🪢', '瑜伽': '🧘', '游泳': '🏊', '骑行': '🚴',
                  '力量训练': '🏋️', '散步': '🚶', '篮球': '🏀', '羽毛球': '🏸', '其他': '💪' };
    return map[type] || '💪';
  },
};
