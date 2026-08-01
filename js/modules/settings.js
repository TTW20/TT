/**
 * Module: 个性化设置 (Settings)
 * Goals, reminders, theme, profile customization
 */
const SettingsModule = {
  init() {
    this.refresh();
  },

  refresh() {
    this.renderAll();
  },

  getSettings() {
    return Storage.getSettings();
  },

  saveSettings(s) {
    const current = this.getSettings();
    const merged = { ...current, ...s };
    Storage.saveSettings(merged);
    return merged;
  },

  renderAll() {
    const container = document.getElementById('settingsContent');
    if (!container) return;
    const s = this.getSettings();

    container.innerHTML = `
      <!-- Profile -->
      <div class="glass-card mb-md">
        <div class="section-title">👤 个人资料</div>
        <div style="display:flex;gap:14px;align-items:flex-end;flex-wrap:wrap">
          <div style="flex:1;min-width:140px">
            <label style="font-size:12px;color:var(--text-tertiary)">工作台昵称</label>
            <input type="text" class="input" id="settingNickname" value="${s.nickname || '梦天'}" placeholder="你的昵称">
          </div>
          <button class="btn btn-sm btn-primary" onclick="SettingsModule.saveProfile()">保存</button>
        </div>
        ${s.nickname ? `<div style="font-size:13px;color:var(--accent-blue);margin-top:6px">☀️ 你好，${s.nickname}！今天也是元气满满的一天~</div>` : ''}
      </div>

      <!-- Daily Goals -->
      <div class="glass-card mb-md">
        <div class="section-title">🎯 每日目标设置</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
          <div>
            <label style="font-size:12px;color:var(--text-tertiary)">💧 每日饮水目标 (ml)</label>
            <div style="display:flex;gap:8px">
              <input type="number" class="input" id="settingWaterGoal" value="${s.dailyWaterGoal || 2000}" min="500" step="100">
            </div>
          </div>
          <div>
            <label style="font-size:12px;color:var(--text-tertiary)">🍅 番茄专注时长 (分钟)</label>
            <div style="display:flex;gap:8px">
              <input type="number" class="input" id="settingPomodoroFocus" value="${s.pomodoroFocus || 25}" min="5" max="60">
            </div>
          </div>
          <div>
            <label style="font-size:12px;color:var(--text-tertiary)">📖 每日阅读页数</label>
            <div style="display:flex;gap:8px">
              <input type="number" class="input" id="settingReadingPages" value="${s.dailyReadingPages || 30}" min="5">
            </div>
          </div>
          <div>
            <label style="font-size:12px;color:var(--text-tertiary)">☕ 番茄休息时长 (分钟)</label>
            <div style="display:flex;gap:8px">
              <input type="number" class="input" id="settingPomodoroBreak" value="${s.pomodoroBreak || 5}" min="1" max="30">
            </div>
          </div>
        </div>
        <div style="margin-top:14px;text-align:right">
          <button class="btn btn-primary btn-sm" onclick="SettingsModule.saveGoals()">💾 保存目标</button>
        </div>
      </div>

      <!-- Reminders -->
      <div class="glass-card mb-md">
        <div class="section-title">🔔 提醒设置</div>
        <div style="display:flex;flex-direction:column;gap:12px">
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-radius:10px;background:var(--glass-bg-light)">
            <div>
              <div style="font-size:14px;font-weight:500">💧 喝水提醒</div>
              <div style="font-size:11px;color:var(--text-tertiary)">每整点提醒喝水 (8:00-22:00)</div>
            </div>
            <button class="btn btn-sm ${s.waterReminder !== false ? 'btn-primary' : 'btn-secondary'}"
                    id="toggleWaterReminder" onclick="SettingsModule.toggleReminder('water')">
              ${s.waterReminder !== false ? '✓ 已开启' : '○ 已关闭'}
            </button>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-radius:10px;background:var(--glass-bg-light)">
            <div>
              <div style="font-size:14px;font-weight:500">📖 阅读提醒</div>
              <div style="font-size:11px;color:var(--text-tertiary)">每天 20:00 提醒阅读</div>
            </div>
            <button class="btn btn-sm ${s.readingReminder !== false ? 'btn-primary' : 'btn-secondary'}"
                    id="toggleReadingReminder" onclick="SettingsModule.toggleReminder('reading')">
              ${s.readingReminder !== false ? '✓ 已开启' : '○ 已关闭'}
            </button>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-radius:10px;background:var(--glass-bg-light)">
            <div>
              <div style="font-size:14px;font-weight:500">🏃 运动提醒</div>
              <div style="font-size:11px;color:var(--text-tertiary)">每天 17:00 提醒运动</div>
            </div>
            <button class="btn btn-sm ${s.exerciseReminder !== false ? 'btn-primary' : 'btn-secondary'}"
                    id="toggleExerciseReminder" onclick="SettingsModule.toggleReminder('exercise')">
              ${s.exerciseReminder !== false ? '✓ 已开启' : '○ 已关闭'}
            </button>
          </div>
        </div>
      </div>

      <!-- Theme Accent Color -->
      <div class="glass-card mb-md">
        <div class="section-title">🎨 主题配色</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap" id="themeColorPicker">
          ${this.renderColorOptions(s.accentColor)}
        </div>
        <div style="font-size:11px;color:var(--text-tertiary);margin-top:8px">选择你喜欢的主题强调色，全局生效</div>
      </div>

      <!-- Data Management -->
      <div class="glass-card mb-md">
        <div class="section-title">💾 数据管理</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn-secondary btn-sm" onclick="SettingsModule.exportData()">📤 导出全部数据</button>
          <button class="btn btn-secondary btn-sm" onclick="SettingsModule.importData()">📥 导入数据</button>
          <button class="btn btn-danger btn-sm" onclick="SettingsModule.resetAll()">🗑 重置所有数据</button>
        </div>
        <div style="font-size:11px;color:var(--text-tertiary);margin-top:8px">
          数据存储在浏览器本地。导出为 JSON 文件可跨设备迁移。重置将清除所有数据，不可恢复。
        </div>
      </div>

      <!-- About -->
      <div class="glass-card flat" style="text-align:center">
        <div style="font-size:24px;margin-bottom:6px">🌤</div>
        <div style="font-size:14px;font-weight:560">梦天工作台 · Dream Sky</div>
        <div style="font-size:11px;color:var(--text-tertiary);margin-top:4px">v1.0 · Apple 液态玻璃设计 · 治愈系个人工作台</div>
        <div style="font-size:10px;color:var(--text-placeholder);margin-top:2px">数据完全存储在你的浏览器中 · 隐私安全</div>
      </div>
    `;
  },

  renderColorOptions(currentColor) {
    const colors = [
      { name: '天蓝', value: '#7EB0DD', cssVar: '--accent-blue' },
      { name: '暖杏', value: '#EEBB7A', cssVar: '--accent-orange' },
      { name: '柔粉', value: '#E0A8AF', cssVar: '--accent-pink' },
      { name: '淡紫', value: '#B0A4D4', cssVar: '--accent-purple' },
      { name: '薄荷', value: '#8CC08C', cssVar: '--accent-green' },
      { name: '青蓝', value: '#82C0CE', cssVar: '--accent-cyan' },
    ];

    return colors.map(c => {
      const active = (currentColor === c.value) || (!currentColor && c.value === '#7EB0DD');
      return `
        <div onclick="SettingsModule.pickColor('${c.value}')"
             style="width:44px;height:44px;border-radius:50%;background:${c.value};
                    border:3px solid ${active ? 'var(--text-primary)' : 'transparent'};
                    cursor:pointer;transition:all 0.2s;box-shadow:0 2px 8px rgba(0,0,0,0.1);
                    position:relative"
             title="${c.name}">
          ${active ? '<span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px">✓</span>' : ''}
        </div>
      `;
    }).join('');
  },

  // --- Actions ---
  saveProfile() {
    const nickname = document.getElementById('settingNickname').value.trim() || '梦天';
    this.saveSettings({ nickname });
    App.toast(`👤 昵称已更新：${nickname}`);
    this.renderAll();
  },

  saveGoals() {
    const dailyWaterGoal = parseInt(document.getElementById('settingWaterGoal').value) || 2000;
    const pomodoroFocus = parseInt(document.getElementById('settingPomodoroFocus').value) || 25;
    const dailyReadingPages = parseInt(document.getElementById('settingReadingPages').value) || 30;
    const pomodoroBreak = parseInt(document.getElementById('settingPomodoroBreak').value) || 5;

    const s = this.saveSettings({ dailyWaterGoal, pomodoroFocus, dailyReadingPages, pomodoroBreak });

    // Sync to active modules
    if (typeof TodoModule !== 'undefined') {
      TodoModule.pomodoroFocusMin = s.pomodoroFocus;
      TodoModule.pomodoroBreakMin = s.pomodoroBreak;
      TodoModule.pomodoroSeconds = s.pomodoroFocus * 60;
      TodoModule.updatePomodoroDisplay();
    }

    App.toast('🎯 每日目标已更新');
    this.renderAll();
  },

  toggleReminder(type) {
    const key = type === 'water' ? 'waterReminder' :
                type === 'reading' ? 'readingReminder' : 'exerciseReminder';
    const current = this.getSettings();
    const newVal = !(current[key] !== false);
    this.saveSettings({ [key]: newVal });
    this.renderAll();
    App.toast(`${newVal ? '✅' : '❌'} ${type === 'water' ? '喝水' : type === 'reading' ? '阅读' : '运动'}提醒已${newVal ? '开启' : '关闭'}`);
  },

  pickColor(colorVal) {
    this.saveSettings({ accentColor: colorVal });
    // Apply to :root variables
    const colorMap = {
      '#7EB0DD': { blue: '#7EB0DD', teal: '#7BC0B6', green: '#8CC08C', orange: '#EEBB7A', red: '#ED8E86', purple: '#B0A4D4', pink: '#E0A8AF', indigo: '#92A0D0', cyan: '#82C0CE' },
      '#EEBB7A': { blue: '#EEBB7A', teal: '#E0A8AF', green: '#8CC08C', orange: '#EEBB7A', red: '#ED8E86', purple: '#E0A8AF', pink: '#E0A8AF', indigo: '#D4B896', cyan: '#C4A882' },
      '#E0A8AF': { blue: '#E0A8AF', teal: '#C4A8B0', green: '#B8C4A8', orange: '#EEBB7A', red: '#ED8E86', purple: '#C4A8B8', pink: '#E0A8AF', indigo: '#B0A8C0', cyan: '#A8C0C0' },
      '#B0A4D4': { blue: '#B0A4D4', teal: '#A4C4C0', green: '#B0C4A4', orange: '#D4B8A4', red: '#D4A4A4', purple: '#B0A4D4', pink: '#D4A4C0', indigo: '#A4A8D4', cyan: '#A4C4D4' },
      '#8CC08C': { blue: '#8CC08C', teal: '#8CC0B0', green: '#8CC08C', orange: '#C0B08C', red: '#C08C8C', purple: '#B08CC0', pink: '#C08CA8', indigo: '#8CA8C0', cyan: '#8CC0C0' },
      '#82C0CE': { blue: '#82C0CE', teal: '#82CEB0', green: '#A8CE82', orange: '#CEB882', red: '#CE8282', purple: '#A882CE', pink: '#CE82B0', indigo: '#82A8CE', cyan: '#82C0CE' },
    };

    const colors = colorMap[colorVal] || colorMap['#7EB0DD'];
    const root = document.documentElement;
    root.style.setProperty('--accent-blue', colors.blue);
    root.style.setProperty('--accent-teal', colors.teal);
    root.style.setProperty('--accent-green', colors.green);
    root.style.setProperty('--accent-orange', colors.orange);
    root.style.setProperty('--accent-red', colors.red);
    root.style.setProperty('--accent-purple', colors.purple);
    root.style.setProperty('--accent-pink', colors.pink);
    root.style.setProperty('--accent-indigo', colors.indigo);
    root.style.setProperty('--accent-cyan', colors.cyan);

    this.renderAll();
    App.toast('🎨 主题色已更新');
  },

  exportData() {
    const blob = new Blob([Storage.exportAll()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `mengtian-backup-${App.today()}.json`;
    a.click();
    App.toast('📦 数据已导出');
  },

  importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (Storage.importAll(ev.target.result)) {
          App.toast('📥 数据已导入，刷新页面生效');
          setTimeout(() => location.reload(), 1000);
        } else {
          App.toast('❌ 导入失败，文件格式无效');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  },

  resetAll() {
    if (!confirm('⚠️ 确定要清除所有数据吗？此操作不可恢复！\n\n建议先导出备份。')) return;
    if (!confirm('再次确认：所有待办、阅读记录、饮水数据、运动记录、灵感笔记、复盘内容都将永久删除。')) return;

    Object.values(Storage.KEYS).forEach(k => {
      localStorage.removeItem(k);
    });
    App.toast('🗑 所有数据已清除，页面即将刷新');
    setTimeout(() => location.reload(), 1500);
  },
};
