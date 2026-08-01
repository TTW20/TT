/**
 * Module: 倒计时 (Countdown)
 * 自定义考试/事件倒计时：考研、教资、期末等
 * Add/edit/delete countdown cards with visual progress
 */
const CountdownModule = {
  editingId: null,

  init() {
    this.refresh();
  },

  refresh() {
    this.renderList();
    this.resetForm();
  },

  getData() {
    const raw = localStorage.getItem('mt_countdowns');
    if (!raw) {
      const defaults = [];
      localStorage.setItem('mt_countdowns', JSON.stringify(defaults));
      return defaults;
    }
    try { return JSON.parse(raw); } catch { return []; }
  },

  saveData(data) {
    localStorage.setItem('mt_countdowns', JSON.stringify(data));
  },

  // ===== Render =====
  renderList() {
    const container = document.getElementById('countdownList');
    if (!container) return;

    const data = this.getData();
    const today = this.todayDate();

    // Sort: upcoming first (nearest deadline), past at bottom
    const upcoming = data.filter(d => new Date(d.targetDate) >= today).sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate));
    const past = data.filter(d => new Date(d.targetDate) < today).sort((a, b) => new Date(b.targetDate) - new Date(a.targetDate));
    const sorted = [...upcoming, ...past];

    if (sorted.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:50px 20px;color:var(--text-tertiary)">
          <div style="font-size:52px;margin-bottom:16px">⏳</div>
          <div style="font-size:16px;font-weight:500;margin-bottom:6px">还没有倒计时</div>
          <div style="font-size:13px;color:var(--text-placeholder)">点击上方按钮添加考试或事件倒计时</div>
          <div style="margin-top:16px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
            <button class="btn btn-sm btn-secondary" onclick="CountdownModule.quickAdd('考研')">📝 考研倒计时</button>
            <button class="btn btn-sm btn-secondary" onclick="CountdownModule.quickAdd('教资考试')">📋 教资倒计时</button>
            <button class="btn btn-sm btn-secondary" onclick="CountdownModule.quickAdd('期末考试')">📚 期末倒计时</button>
          </div>
        </div>`;
      return;
    }

    container.innerHTML = sorted.map(d => {
      const target = new Date(d.targetDate);
      const isPast = target < today;
      const daysRemaining = Math.ceil((target - today) / (1000 * 60 * 60 * 24));

      // Calculate progress
      let progressPct = 100;
      let progressLabel = '';
      if (d.startDate) {
        const totalDays = Math.ceil((target - new Date(d.startDate)) / (1000 * 60 * 60 * 24));
        const elapsed = totalDays - daysRemaining;
        progressPct = totalDays > 0 ? Math.min(100, Math.max(0, Math.round((elapsed / totalDays) * 100))) : 0;
        progressLabel = `已过 ${progressPct}%`;
      } else {
        // No start date, show countdown progress since creation
        const created = new Date(d.createdAt);
        const totalDays = Math.ceil((target - created) / (1000 * 60 * 60 * 24));
        const elapsed = totalDays - daysRemaining;
        progressPct = totalDays > 0 ? Math.min(100, Math.max(0, Math.round((elapsed / totalDays) * 100))) : 50;
        progressLabel = '';
      }

      const color = d.color || 'var(--accent-blue)';
      const isUrgent = !isPast && daysRemaining <= 7;
      const ringSize = 90;
      const circumference = 2 * Math.PI * 38;

      return `
        <div class="countdown-card glass-card ${isPast ? 'countdown-past' : ''} ${isUrgent ? 'countdown-urgent' : ''}"
             style="border-left: 3px solid ${color}">
          <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
            <!-- Ring -->
            <div style="position:relative;width:${ringSize}px;height:${ringSize}px;flex-shrink:0">
              <svg viewBox="0 0 ${ringSize} ${ringSize}" style="width:100%;height:100%;transform:rotate(-90deg)">
                <circle cx="${ringSize/2}" cy="${ringSize/2}" r="38" fill="none" stroke="rgba(0,0,0,0.06)" stroke-width="5"/>
                <circle cx="${ringSize/2}" cy="${ringSize/2}" r="38" fill="none" stroke="${isPast ? 'var(--text-tertiary)' : color}" stroke-width="5"
                  stroke-dasharray="${circumference}" stroke-dashoffset="${circumference - (progressPct/100) * circumference}"
                  stroke-linecap="round"/>
              </svg>
              <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
                <div style="font-size:22px;font-weight:620;color:${isPast ? 'var(--text-tertiary)' : color};line-height:1">
                  ${isPast ? '✓' : daysRemaining}
                </div>
                <div style="font-size:9px;color:var(--text-tertiary);margin-top:1px">
                  ${isPast ? '已结束' : '天'}
                </div>
              </div>
            </div>

            <!-- Info -->
            <div style="flex:1;min-width:140px">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                <span style="font-size:16px;font-weight:620;color:${isPast ? 'var(--text-tertiary)' : 'var(--text-primary)'}">${d.name}</span>
                ${isUrgent && !isPast ? '<span class="tag tag-red" style="animation:pulse 2s infinite">⚠ 临近</span>' : ''}
                ${isPast ? '<span class="tag tag-gray">已结束</span>' : ''}
              </div>
              ${d.note ? `<div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px">${d.note}</div>` : ''}
              <div style="font-size:12px;color:var(--text-tertiary)">
                📅 ${d.targetDate}${daysRemaining > 0 && !isPast ? ` · 还剩 <b style="color:${color}">${daysRemaining}</b> 天` : ''}
              </div>
              <!-- Progress bar -->
              <div style="margin-top:8px;display:flex;align-items:center;gap:8px">
                <div style="flex:1;height:4px;border-radius:2px;background:rgba(0,0,0,0.06);overflow:hidden">
                  <div style="height:100%;width:${progressPct}%;background:${isPast ? 'var(--text-tertiary)' : color};border-radius:2px;transition:width 0.6s"></div>
                </div>
                <span style="font-size:10px;color:var(--text-tertiary);flex-shrink:0">${progressPct}%</span>
              </div>
            </div>

            <!-- Actions -->
            <div style="display:flex;flex-direction:column;gap:5px;flex-shrink:0">
              <button class="btn-icon" style="width:30px;height:30px" onclick="CountdownModule.editCountdown('${d.id}')" title="编辑">✎</button>
              <button class="btn-icon" style="width:30px;height:30px" onclick="CountdownModule.deleteCountdown('${d.id}')" title="删除">🗑</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  // ===== Add / Edit =====
  showAddForm() {
    this.editingId = null;
    this.resetForm();
    const form = document.getElementById('countdownForm');
    if (form) form.style.display = '';
    document.getElementById('countdownFormTitle').textContent = '✚ 添加倒计时';
    document.getElementById('countdownName').focus();
  },

  hideForm() {
    const form = document.getElementById('countdownForm');
    if (form) form.style.display = 'none';
    this.editingId = null;
    this.resetForm();
  },

  resetForm() {
    document.getElementById('countdownName').value = '';
    document.getElementById('countdownTargetDate').value = '';
    document.getElementById('countdownNote').value = '';
    document.getElementById('countdownStartDate').value = '';
    document.getElementById('countdownColor').value = '#7EB0DD';
    this.editingId = null;
  },

  quickAdd(name) {
    // Pre-fill form with suggested name
    this.showAddForm();
    document.getElementById('countdownName').value = name;
    // Suggest date: 考研 = Dec 20, 教资 = Mar 8, 期末 = next month end
    const now = new Date();
    let suggestDate = '';
    if (name.includes('考研')) {
      suggestDate = `${now.getFullYear()}-12-20`;
    } else if (name.includes('教资')) {
      const y = now.getMonth() < 2 ? now.getFullYear() : now.getFullYear() + 1;
      suggestDate = `${y}-03-08`;
    } else if (name.includes('期末')) {
      const m = now.getMonth() + 1;
      suggestDate = m >= 7 ? `${now.getFullYear()}-01-15` : `${now.getFullYear()}-07-05`;
    }
    if (suggestDate) document.getElementById('countdownTargetDate').value = suggestDate;
    document.getElementById('countdownNote').focus();
  },

  saveCountdown() {
    const name = document.getElementById('countdownName').value.trim();
    const targetDate = document.getElementById('countdownTargetDate').value;
    const note = document.getElementById('countdownNote').value.trim();
    const startDate = document.getElementById('countdownStartDate').value;
    const color = document.getElementById('countdownColor').value;

    if (!name) { App.toast('请输入倒计时名称'); return; }
    if (!targetDate) { App.toast('请选择目标日期'); return; }

    const data = this.getData();

    if (this.editingId) {
      // Update existing
      const idx = data.findIndex(d => d.id === this.editingId);
      if (idx >= 0) {
        data[idx].name = name;
        data[idx].targetDate = targetDate;
        data[idx].note = note;
        data[idx].startDate = startDate || null;
        data[idx].color = color;
        data[idx].updatedAt = new Date().toISOString();
      }
      App.toast('✅ 倒计时已更新');
    } else {
      // Add new
      data.push({
        id: 'cd_' + Date.now().toString(36),
        name,
        targetDate,
        note,
        startDate: startDate || null,
        color,
        createdAt: new Date().toISOString(),
      });
      App.toast('⏳ 倒计时已添加');
    }

    this.saveData(data);
    this.hideForm();
    this.refresh();
  },

  editCountdown(id) {
    const data = this.getData();
    const d = data.find(d => d.id === id);
    if (!d) return;

    this.editingId = id;
    document.getElementById('countdownName').value = d.name;
    document.getElementById('countdownTargetDate').value = d.targetDate;
    document.getElementById('countdownNote').value = d.note || '';
    document.getElementById('countdownStartDate').value = d.startDate || '';
    document.getElementById('countdownColor').value = d.color || '#7EB0DD';
    document.getElementById('countdownFormTitle').textContent = '✎ 编辑倒计时';

    const form = document.getElementById('countdownForm');
    if (form) form.style.display = '';
    form.scrollIntoView({ behavior: 'smooth' });
  },

  deleteCountdown(id) {
    const data = this.getData();
    const d = data.find(d => d.id === id);
    if (!d) return;
    if (!confirm(`确定删除倒计时「${d.name}」吗？`)) return;

    const filtered = data.filter(d => d.id !== id);
    this.saveData(filtered);
    this.refresh();
    App.toast('🗑 倒计时已删除');
  },

  todayDate() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  },
};
