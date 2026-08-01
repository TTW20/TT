/**
 * Module: 提醒事项 (Reminders)
 * Single + Daily/Weekly repeat reminders with multi-time support
 */
const RemindersModule = {
  repeatType: 'once', // 'once' | 'daily' | 'weekdays' | 'weekly'

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

  today() {
    return new Date().toISOString().split('T')[0];
  },

  nowTime() {
    const n = new Date();
    return `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;
  },

  // ===== Render =====
  renderList() {
    const container = document.getElementById('remindersList');
    if (!container) return;

    const data = this.getData();
    const today = this.today();
    const nowTime = this.nowTime();

    // Sort: active first (by next occurrence), expired/inactive last
    const active = [];
    const inactive = [];

    data.forEach(r => {
      const next = this.getNextOccurrence(r);
      if (next && next >= today) {
        active.push({ ...r, _nextDate: next, _nextTime: this.getNextTime(r, today) });
      } else {
        inactive.push(r);
      }
    });

    active.sort((a, b) => (a._nextDate + a._nextTime).localeCompare(b._nextDate + b._nextTime));
    inactive.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    const sorted = [...active, ...inactive];

    if (sorted.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:50px 20px;color:var(--text-tertiary)">
          <div style="font-size:48px;margin-bottom:14px">🔔</div>
          <div style="font-size:16px;font-weight:500;margin-bottom:4px">还没有提醒事项</div>
          <div style="font-size:13px;color:var(--text-placeholder)">支持单次提醒、每日重复、多时段</div>
          <div style="margin-top:14px;display:flex;gap:6px;justify-content:center;flex-wrap:wrap">
            <button class="btn btn-xs btn-primary" onclick="RemindersModule.quickPreset('pill')">💊 吃药提醒</button>
            <button class="btn btn-xs btn-secondary" onclick="RemindersModule.quickPreset('water')">💧 喝水提醒</button>
            <button class="btn btn-xs btn-secondary" onclick="RemindersModule.quickPreset('sleep')">😴 睡觉提醒</button>
          </div>
        </div>`;
      return;
    }

    container.innerHTML = sorted.map(r => {
      const isRepeat = r.repeatType && r.repeatType !== 'once';
      const isExpired = r.repeatType === 'once' ? r.triggered :
        (r.endDate && today > r.endDate);

      // Display info
      let timeDisplay = '';
      let statusLabel = '';
      let statusColor = 'var(--text-tertiary)';

      if (isExpired) {
        statusLabel = r.repeatType === 'once' ? '✅ 已完成' : '⏹ 已截止';
        statusColor = 'var(--text-tertiary)';
      } else if (isRepeat) {
        const nextDate = this.getNextOccurrence(r);
        const nextTime = this.getNextTime(r, today);
        if (nextDate === today) {
          const times = r.times || [r.time];
          const upcoming = times.filter(t => t > nowTime);
          if (upcoming.length > 0) {
            statusLabel = `今天 ${upcoming[0]} · 还有${upcoming.length}次`;
          } else {
            statusLabel = '今天已完成 ✓';
          }
          statusColor = 'var(--accent-blue)';
        } else if (nextDate) {
          const d = new Date(nextDate);
          const diffDay = Math.ceil((d - new Date()) / 86400000);
          statusLabel = `${diffDay}天后`;
          statusColor = 'var(--accent-teal)';
        }
      } else {
        const reminderTime = new Date(r.date + 'T' + r.time);
        const diff = reminderTime - new Date();
        if (diff < 0) {
          statusLabel = '⚠ 已过期';
          statusColor = 'var(--accent-red)';
        } else {
          const diffMin = Math.ceil(diff / 60000);
          if (diffMin < 60) statusLabel = `${diffMin}分钟后`;
          else if (diffMin < 1440) statusLabel = `${Math.floor(diffMin/60)}小时${diffMin%60}分钟后`;
          else statusLabel = `${Math.floor(diffMin/1440)}天后`;
          statusColor = 'var(--accent-blue)';
        }
      }

      const repeatLabel = {
        'daily': '🔁 每天',
        'weekdays': '🔁 工作日',
        'weekly': '🔁 每周',
        'once': '📌 单次',
      };
      const times = (r.repeatType && r.repeatType !== 'once') ? (r.times || []) : [r.time];

      return `
        <div class="reminder-card glass-card mb-sm ${isExpired ? 'reminder-done' : (statusLabel.includes('过期') ? 'reminder-overdue' : '')}">
          <div style="display:flex;align-items:flex-start;gap:14px">
            <!-- Time column -->
            <div style="text-align:center;flex-shrink:0;min-width:56px">
              <div style="font-size:20px;font-weight:200;color:${statusColor};line-height:1">
                ${isRepeat ? (times[0] || '').slice(0,5) : r.time.slice(0,5)}
              </div>
              <div style="font-size:10px;color:var(--text-tertiary);margin-top:2px">
                ${isRepeat ? '起' : r.date.slice(5)}
              </div>
            </div>

            <!-- Content -->
            <div style="flex:1;min-width:0">
              <div style="font-size:15px;font-weight:560;color:${isExpired ? 'var(--text-tertiary)' : 'var(--text-primary)'};
                  text-decoration:${isExpired ? 'line-through' : 'none'}">
                ${r.title}
              </div>
              ${r.note ? `<div style="font-size:12px;color:var(--text-secondary);margin-top:2px">${r.note}</div>` : ''}
              <div style="display:flex;gap:8px;align-items:center;margin-top:4px;flex-wrap:wrap">
                <span class="tag tag-purple" style="font-size:10px">${repeatLabel[r.repeatType] || '📌 单次'}</span>
                ${isRepeat && r.times && r.times.length > 1 ?
                  r.times.map(t => `<span style="font-size:10px;color:var(--text-tertiary)">${t.slice(0,5)}</span>`).join(' · ')
                  : ''}
                ${r.endDate ? `<span style="font-size:10px;color:var(--text-tertiary)">截止 ${r.endDate}</span>` : ''}
                <span style="font-size:10px;color:${statusColor};margin-left:auto">${statusLabel}</span>
              </div>
            </div>

            <!-- Actions -->
            <div style="display:flex;gap:3px;flex-shrink:0">
              ${!isExpired ? `
                <button class="btn-icon" style="width:30px;height:30px" onclick="RemindersModule.skipToday('${r.id}')" title="今天不再提醒">⏭</button>
              ` : ''}
              <button class="btn-icon" style="width:30px;height:30px" onclick="RemindersModule.deleteReminder('${r.id}')" title="删除">🗑</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  // ===== Occurrence helpers =====
  getNextOccurrence(r) {
    const today = this.today();
    if (r.repeatType === 'once') {
      if (r.triggered) return null;
      return r.date >= today ? r.date : null;
    }
    // For repeats
    if (r.endDate && today > r.endDate) return null;
    return today; // repeat reminders are always "active" today
  },

  getNextTime(r, date) {
    const nowTime = this.nowTime();
    if (r.repeatType === 'once') return r.time;

    const times = (r.times && r.times.length > 0) ? r.times : [r.time];
    if (date === this.today()) {
      // Find next time today that hasn't passed
      const upcoming = times.filter(t => t > nowTime);
      return upcoming.length > 0 ? upcoming[0] : times[0]; // if all passed, show first for tomorrow
    }
    return times[0];
  },

  // ===== Add =====
  switchRepeatType(type) {
    this.repeatType = type;
    document.querySelectorAll('#reminderRepeatToggle .btn').forEach(b => b.classList.remove('btn-primary'));
    document.querySelector(`#reminderRepeatToggle [data-type="${type}"]`).classList.add('btn-primary');

    // Show/hide relevant fields
    const onceFields = document.getElementById('reminderOnceFields');
    const repeatFields = document.getElementById('reminderRepeatFields');
    if (type === 'once') {
      onceFields.style.display = '';
      repeatFields.style.display = 'none';
    } else {
      onceFields.style.display = 'none';
      repeatFields.style.display = '';
    }
  },

  addReminder() {
    const title = document.getElementById('reminderTitle').value.trim();
    if (!title) { App.toast('请输入提醒内容'); return; }

    const data = this.getData();
    const repeatType = this.repeatType;

    if (repeatType === 'once') {
      const date = document.getElementById('reminderDate').value;
      const time = document.getElementById('reminderTime').value;
      if (!date) { App.toast('请选择日期'); return; }
      if (!time) { App.toast('请选择时间'); return; }
      const note = document.getElementById('reminderNote').value.trim();

      data.push({
        id: 'rem_' + Date.now().toString(36),
        title, date, time, note,
        repeatType: 'once',
        triggered: false,
        createdAt: new Date().toISOString(),
      });
    } else {
      // Repeat reminder
      const timesRaw = document.getElementById('reminderTimes').value.trim();
      const endDate = document.getElementById('reminderEndDate').value || '';
      const note = document.getElementById('reminderNote').value.trim();

      if (!timesRaw) { App.toast('请设置提醒时间'); return; }
      const times = timesRaw.split(',').map(t => t.trim()).filter(t => /^\d{1,2}:\d{2}$/.test(t));
      if (times.length === 0) { App.toast('时间格式错误，请用 HH:MM 格式，多个用逗号分隔'); return; }
      // Normalize times to HH:MM format
      const normalized = times.map(t => {
        const [h, m] = t.split(':');
        return `${String(parseInt(h)).padStart(2,'0')}:${m}`;
      }).sort();

      data.push({
        id: 'rem_' + Date.now().toString(36),
        title, times: normalized, endDate,
        repeatType,
        note,
        triggeredDates: {},
        createdAt: new Date().toISOString(),
      });
    }

    this.saveData(data);
    document.getElementById('reminderTitle').value = '';
    document.getElementById('reminderNote').value = '';
    if (repeatType === 'once') {
      document.getElementById('reminderDate').value = '';
      document.getElementById('reminderTime').value = '09:00';
    } else {
      document.getElementById('reminderTimes').value = '';
      document.getElementById('reminderEndDate').value = '';
    }
    this.refresh();
    App.toast('🔔 提醒已设置');
  },

  quickAdd(minutes) {
    this.switchRepeatType('once');
    const now = new Date();
    now.setMinutes(now.getMinutes() + minutes);
    document.getElementById('reminderDate').value = now.toISOString().split('T')[0];
    document.getElementById('reminderTime').value =
      `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    document.getElementById('reminderTitle').focus();
    const labels = { 5: '5分钟后', 15: '15分钟后', 30: '30分钟后', 60: '1小时后' };
    App.toast(`⏰ 已设为${labels[minutes]}`);
  },

  quickPreset(type) {
    if (type === 'pill') {
      this.switchRepeatType('daily');
      document.getElementById('reminderTitle').value = '💊 吃药';
      document.getElementById('reminderTimes').value = '08:00, 12:30, 18:30';
      document.getElementById('reminderNote').value = '饭后半小时服用';
      App.toast('💊 已填入吃药提醒 (早中晚)');
    } else if (type === 'water') {
      this.switchRepeatType('daily');
      document.getElementById('reminderTitle').value = '💧 喝水';
      document.getElementById('reminderTimes').value = '09:00, 11:00, 14:00, 16:00, 19:00';
      document.getElementById('reminderNote').value = '每次200ml';
      App.toast('💧 已填入喝水提醒 (5次/天)');
    } else if (type === 'sleep') {
      this.switchRepeatType('daily');
      document.getElementById('reminderTitle').value = '😴 睡觉';
      document.getElementById('reminderTimes').value = '22:30';
      document.getElementById('reminderNote').value = '放下手机，准备休息';
      App.toast('😴 已填入睡觉提醒');
    }
    document.getElementById('reminderTitle').focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  // ===== Actions =====
  skipToday(id) {
    const data = this.getData();
    const r = data.find(r => r.id === id);
    if (!r) return;
    if (!r.triggeredDates) r.triggeredDates = {};
    r.triggeredDates[this.today()] = true;
    this.saveData(data);
    this.refresh();
    this.updateBadge();
    App.toast('⏭ 今天不再提醒');
  },

  deleteReminder(id) {
    const data = this.getData().filter(r => r.id !== id);
    this.saveData(data);
    this.refresh();
    this.updateBadge();
    App.toast('🗑 提醒已删除');
  },

  clearExpired() {
    const today = this.today();
    const data = this.getData().filter(r => {
      if (r.repeatType === 'once') return !r.triggered;
      return !r.endDate || r.endDate >= today;
    });
    this.saveData(data);
    this.refresh();
    this.updateBadge();
    App.toast('🧹 已清除过期提醒');
  },

  // ===== Notification Checker (called every 15s by app.js) =====
  checkReminders() {
    const data = this.getData();
    const today = this.today();
    const now = new Date();
    const nowTime = this.nowTime();
    let fired = false;

    data.forEach(r => {
      // Check if today is skipped
      if (r.triggeredDates && r.triggeredDates[today]) return;

      if (r.repeatType === 'once') {
        // Single reminder
        if (r.triggered) return;
        const rt = new Date(r.date + 'T' + r.time);
        const diff = now - rt;
        if (diff >= 0 && diff < 30000) {
          r.triggered = true;
          fired = true;
          this.showNotification(r);
        }
      } else if (r.repeatType === 'daily' || r.repeatType === 'weekdays') {
        // Daily or weekday repeat
        if (r.endDate && today > r.endDate) return;
        if (r.repeatType === 'weekdays') {
          const dow = now.getDay();
          if (dow === 0 || dow === 6) return; // skip weekends
        }
        const times = r.times || [];
        times.forEach(t => {
          const [th, tm] = t.split(':').map(Number);
          const rt = new Date(today + `T${String(th).padStart(2,'0')}:${String(tm).padStart(2,'0')}`);
          const diff = now - rt;
          if (diff >= 0 && diff < 30000) {
            if (!r.triggeredTimes) r.triggeredTimes = {};
            const key = today + '_' + t;
            if (r.triggeredTimes[key]) return;
            r.triggeredTimes[key] = true;
            fired = true;
            this.showNotification(r);
          }
        });
      } else if (r.repeatType === 'weekly') {
        // Weekly repeat (r.dayOfWeek + r.time)
        if (r.endDate && today > r.endDate) return;
        const dow = now.getDay();
        if (dow === (r.dayOfWeek || 1)) {
          const [th, tm] = (r.time || '09:00').split(':').map(Number);
          const rt = new Date(today + `T${String(th).padStart(2,'0')}:${String(tm).padStart(2,'0')}`);
          const diff = now - rt;
          if (diff >= 0 && diff < 30000) {
            if (!r.triggeredTimes) r.triggeredTimes = {};
            const key = today;
            if (r.triggeredTimes[key]) return;
            r.triggeredTimes[key] = true;
            fired = true;
            this.showNotification(r);
          }
        }
      }
    });

    if (fired) {
      this.saveData(data);
      this.updateBadge();
      if (App.currentPage === 'reminders') this.refresh();
    }
  },

  showNotification(reminder) {
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
        <div style="font-size:13px;color:var(--text-tertiary);margin-bottom:8px">
          ${this.nowTime()} · ${this.today()}
        </div>
        <div style="margin-bottom:18px">
          <span class="tag tag-purple">${reminder.repeatType === 'once' ? '单次提醒' : '重复提醒'}</span>
        </div>
        <div style="display:flex;gap:10px;justify-content:center">
          <button class="btn btn-primary" onclick="RemindersModule.dismissNotification()">✓ 知道了</button>
          <button class="btn btn-secondary" onclick="RemindersModule.snoozeNotification('${reminder.id}')">⏰ 10分钟后再提醒</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch {}
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
    if (r && r.repeatType === 'once') {
      r.triggered = false;
      const now = new Date();
      now.setMinutes(now.getMinutes() + 10);
      r.date = now.toISOString().split('T')[0];
      r.time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      this.saveData(data);
      if (App.currentPage === 'reminders') this.refresh();
    }
    App.toast('⏰ 已推迟10分钟');
  },

  // ===== Badge =====
  updateBadge() {
    const data = this.getData();
    const today = this.today();
    const nowTime = this.nowTime();
    let active = 0;
    let overdue = 0;

    data.forEach(r => {
      if (r.triggeredDates && r.triggeredDates[today]) return;
      if (r.repeatType === 'once') {
        if (r.triggered) return;
        const dt = r.date + 'T' + r.time;
        if (dt < today + 'T' + nowTime) overdue++;
        else active++;
      } else {
        if (r.endDate && today > r.endDate) return;
        active++;
      }
    });

    const badge = document.getElementById('remindersBadge');
    if (badge) {
      const total = overdue > 0 ? overdue : active;
      if (total > 0) {
        badge.textContent = overdue > 0 ? `!${overdue}` : `${active}`;
        badge.style.display = '';
        badge.style.background = overdue > 0 ? 'var(--accent-red)' : 'var(--accent-blue)';
      } else {
        badge.style.display = 'none';
      }
    }
  },
};
