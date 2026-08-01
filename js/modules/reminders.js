/**
 * Module: 提醒事项 (Reminders)
 * Custom time-based reminders with popup notifications
 */
const RemindersModule = {

  init() {
    this.refresh();
  },

  refresh() {
    this.renderList();
    this.updateBadge();
  },

  getData() {
    const raw = localStorage.getItem('mt_reminders');
    if (!raw) { localStorage.setItem('mt_reminders', '[]'); return []; }
    try { return JSON.parse(raw); } catch { return []; }
  },

  saveData(data) {
    localStorage.setItem('mt_reminders', JSON.stringify(data));
  },

  // ===== Render =====
  renderList() {
    const container = document.getElementById('remindersList');
    if (!container) return;

    const data = this.getData();
    const now = new Date();

    // Sort: upcoming first, past at bottom
    const upcoming = data.filter(r => !r.triggered).sort((a, b) =>
      (a.date + 'T' + a.time).localeCompare(b.date + 'T' + b.time)
    );
    const triggered = data.filter(r => r.triggered).sort((a, b) =>
      (b.date + 'T' + b.time).localeCompare(a.date + 'T' + a.time)
    );
    const sorted = [...upcoming, ...triggered];

    if (sorted.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:50px 20px;color:var(--text-tertiary)">
          <div style="font-size:48px;margin-bottom:14px">🔔</div>
          <div style="font-size:16px;font-weight:500;margin-bottom:4px">还没有提醒事项</div>
          <div style="font-size:13px;color:var(--text-placeholder)">设置提醒，到时间会弹窗通知你</div>
        </div>`;
      return;
    }

    container.innerHTML = sorted.map(r => {
      const reminderTime = new Date(r.date + 'T' + r.time);
      const isPast = reminderTime < now && !r.triggered;
      const isTriggered = r.triggered;

      // Time display
      let timeDisplay = '';
      if (isTriggered) {
        timeDisplay = '✅ 已完成';
      } else if (isPast) {
        timeDisplay = '⚠ 已过期';
      } else {
        const diff = reminderTime - now;
        const diffMin = Math.floor(diff / 60000);
        const diffHr = Math.floor(diff / 3600000);
        const diffDay = Math.floor(diff / 86400000);
        if (diffDay > 0) timeDisplay = `${diffDay}天后`;
        else if (diffHr > 0) timeDisplay = `${diffHr}小时${diffMin % 60}分钟后`;
        else if (diffMin > 0) timeDisplay = `${diffMin}分钟后`;
        else timeDisplay = '即将提醒';
      }

      const cardClass = isTriggered ? 'reminder-done' : (isPast ? 'reminder-overdue' : 'reminder-upcoming');

      return `
        <div class="reminder-card glass-card mb-sm ${cardClass}">
          <div style="display:flex;align-items:center;gap:14px">
            <!-- Time badge -->
            <div style="text-align:center;flex-shrink:0;min-width:56px">
              <div style="font-size:22px;font-weight:200;color:${isTriggered ? 'var(--text-tertiary)' : (isPast ? 'var(--accent-red)' : 'var(--accent-blue)')};line-height:1">
                ${r.time.slice(0, 5)}
              </div>
              <div style="font-size:10px;color:var(--text-tertiary);margin-top:2px">
                ${r.date.slice(5)}
              </div>
            </div>

            <!-- Content -->
            <div style="flex:1;min-width:0">
              <div style="font-size:15px;font-weight:560;color:${isTriggered ? 'var(--text-tertiary)' : 'var(--text-primary)'};
                  text-decoration:${isTriggered ? 'line-through' : 'none'}">
                ${r.title}
              </div>
              ${r.note ? `<div style="font-size:12px;color:var(--text-secondary);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.note}</div>` : ''}
              <div style="font-size:11px;color:${isPast && !isTriggered ? 'var(--accent-red)' : 'var(--text-tertiary)'};margin-top:3px">
                ${timeDisplay} · ${r.date}
              </div>
            </div>

            <!-- Actions -->
            <div style="display:flex;gap:4px;flex-shrink:0">
              ${!isTriggered ? `
                <button class="btn-icon" style="width:32px;height:32px" onclick="RemindersModule.markDone('${r.id}')" title="标记完成">✓</button>
              ` : `
                <button class="btn-icon" style="width:32px;height:32px" onclick="RemindersModule.markUndone('${r.id}')" title="撤销">↩</button>
              `}
              <button class="btn-icon" style="width:32px;height:32px" onclick="RemindersModule.deleteReminder('${r.id}')" title="删除">🗑</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  // ===== Add =====
  addReminder() {
    const title = document.getElementById('reminderTitle').value.trim();
    const date = document.getElementById('reminderDate').value;
    const time = document.getElementById('reminderTime').value;
    const note = document.getElementById('reminderNote').value.trim();

    if (!title) { App.toast('请输入提醒内容'); return; }
    if (!date) { App.toast('请选择日期'); return; }
    if (!time) { App.toast('请选择时间'); return; }

    const data = this.getData();
    data.push({
      id: 'rem_' + Date.now().toString(36),
      title,
      date,
      time,
      note,
      triggered: false,
      createdAt: new Date().toISOString(),
    });

    this.saveData(data);
    document.getElementById('reminderTitle').value = '';
    document.getElementById('reminderNote').value = '';
    this.refresh();
    App.toast('🔔 提醒已设置');
  },

  quickAdd(minutes) {
    const now = new Date();
    now.setMinutes(now.getMinutes() + minutes);
    const date = now.toISOString().split('T')[0];
    const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    document.getElementById('reminderDate').value = date;
    document.getElementById('reminderTime').value = time;
    document.getElementById('reminderTitle').focus();

    const labels = { 5: '5分钟后', 15: '15分钟后', 30: '30分钟后', 60: '1小时后' };
    App.toast(`⏰ 已设为${labels[minutes]}`);
  },

  // ===== Actions =====
  markDone(id) {
    const data = this.getData();
    const r = data.find(r => r.id === id);
    if (!r) return;
    r.triggered = true;
    this.saveData(data);
    this.refresh();
    this.updateBadge();
    App.toast('✅ 提醒已完成');
  },

  markUndone(id) {
    const data = this.getData();
    const r = data.find(r => r.id === id);
    if (!r) return;
    r.triggered = false;
    this.saveData(data);
    this.refresh();
    this.updateBadge();
    App.toast('↩ 已恢复提醒');
  },

  deleteReminder(id) {
    const data = this.getData().filter(r => r.id !== id);
    this.saveData(data);
    this.refresh();
    this.updateBadge();
    App.toast('🗑 提醒已删除');
  },

  clearTriggered() {
    const data = this.getData().filter(r => !r.triggered);
    this.saveData(data);
    this.refresh();
    this.updateBadge();
    App.toast('🧹 已完成提醒已清除');
  },

  // ===== Notification Checker =====
  checkReminders() {
    const data = this.getData();
    const now = new Date();
    let fired = false;

    data.forEach(r => {
      if (r.triggered) return;
      const reminderTime = new Date(r.date + 'T' + r.time);
      // Fire if within the last 30 seconds and not yet triggered
      const diff = now - reminderTime;
      if (diff >= 0 && diff < 30000) {
        r.triggered = true;
        fired = true;
        this.showNotification(r);
      }
    });

    if (fired) {
      this.saveData(data);
      this.updateBadge();
      if (App.currentPage === 'reminders') this.refresh();
    }
  },

  showNotification(reminder) {
    // Remove existing notification overlay
    const existing = document.getElementById('reminderOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'reminderOverlay';
    overlay.className = 'pomodoro-overlay';
    overlay.style.zIndex = '250';
    overlay.innerHTML = `
      <div class="modal" style="text-align:center;min-width:340px;max-width:420px">
        <div style="font-size:48px;margin-bottom:12px">🔔</div>
        <div style="font-size:20px;font-weight:620;margin-bottom:6px">${reminder.title}</div>
        ${reminder.note ? `<div style="font-size:14px;color:var(--text-secondary);margin-bottom:6px">${reminder.note}</div>` : ''}
        <div style="font-size:13px;color:var(--text-tertiary);margin-bottom:18px">
          ${reminder.date} ${reminder.time.slice(0, 5)}
        </div>
        <div style="display:flex;gap:10px;justify-content:center">
          <button class="btn btn-primary" onclick="RemindersModule.dismissNotification()">✓ 知道了</button>
          <button class="btn btn-secondary" onclick="RemindersModule.snoozeNotification('${reminder.id}')">⏰ 10分钟后</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    // Play a subtle notification
    try {
      // Use a quick vibrate on mobile if available
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    } catch {}
  },

  dismissNotification() {
    const overlay = document.getElementById('reminderOverlay');
    if (overlay) overlay.remove();
  },

  snoozeNotification(id) {
    const overlay = document.getElementById('reminderOverlay');
    if (overlay) overlay.remove();

    const data = this.getData();
    const r = data.find(r => r.id === id);
    if (r) {
      r.triggered = false;
      const now = new Date();
      now.setMinutes(now.getMinutes() + 10);
      r.date = now.toISOString().split('T')[0];
      r.time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      this.saveData(data);
      if (App.currentPage === 'reminders') this.refresh();
      App.toast('⏰ 已推迟10分钟');
    }
  },

  // ===== Badge =====
  updateBadge() {
    const data = this.getData();
    const now = new Date();
    const upcoming = data.filter(r => !r.triggered &&
      new Date(r.date + 'T' + r.time) > now).length;
    const overdue = data.filter(r => !r.triggered &&
      new Date(r.date + 'T' + r.time) < now).length;

    // Update sidebar badge
    const badge = document.getElementById('remindersBadge');
    if (badge) {
      const total = overdue > 0 ? overdue : upcoming;
      if (total > 0) {
        badge.textContent = overdue > 0 ? `!${overdue}` : `${upcoming}`;
        badge.style.display = '';
        badge.style.background = overdue > 0 ? 'var(--accent-red)' : 'var(--accent-blue)';
      } else {
        badge.style.display = 'none';
      }
    }
  },
};
