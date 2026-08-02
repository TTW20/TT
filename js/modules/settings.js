/**
 * Module: 个性化设置 (Settings)
 * Goals, reminders, theme, profile customization
 */
const SettingsModule = {
  _pushTimer: null,
  _pushDebounce: 3000, // 3 seconds after last change
  autoSyncEnabled: false,
  syncInProgress: false,

  init() {
    const s = this.getSettings();
    this.autoSyncEnabled = s.autoSync === true;
    this.refresh();
    // Auto-pull on start if enabled
    if (this.autoSyncEnabled && s.gistToken) {
      setTimeout(() => this.autoPull(), 2000);
    }
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
      <!-- Appearance -->
      <div class="glass-card mb-md">
        <div class="section-title">🎨 外观</div>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-size:14px;font-weight:500">深色模式</div>
            <div style="font-size:11px;color:var(--text-tertiary)">切换深色/浅色主题，自动保存偏好</div>
          </div>
          <button class="btn btn-sm" id="settingsThemeBtn"
                  style="min-width:70px"
                  onclick="App.toggleTheme();setTimeout(()=>SettingsModule.refresh(),100)">
            ${(document.documentElement.getAttribute('data-theme') === 'dark') ? '☀️ 浅色' : '🌙 深色'}
          </button>
        </div>
      </div>

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
        <div class="section-title">💾 本地数据</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn-secondary btn-sm" onclick="SettingsModule.exportData()">📤 导出JSON</button>
          <button class="btn btn-secondary btn-sm" onclick="SettingsModule.importData()">📥 导入JSON</button>
          <button class="btn btn-danger btn-sm" onclick="SettingsModule.resetAll()">🗑 重置数据</button>
        </div>

      <!-- Auto Sync Toggle -->
      <div class="glass-card mb-md" style="border:2px solid ${this.autoSyncEnabled ? 'var(--accent-green)' : 'var(--glass-border)'};border-radius:var(--radius-lg)">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-size:15px;font-weight:620">🔄 自动同步</div>
            <div style="font-size:11px;color:var(--text-tertiary);margin-top:2px">
              ${this.autoSyncEnabled ? '✅ 已开启 · 数据自动云端同步' : '开启后改数据自动上传，打开自动下载'}
            </div>
          </div>
          <button class="btn btn-sm ${this.autoSyncEnabled ? 'btn-primary' : 'btn-secondary'}"
                  onclick="SettingsModule.toggleAutoSync()" style="min-width:70px;flex-shrink:0">
            ${this.autoSyncEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
        ${this.autoSyncEnabled ? `
          <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--glass-border);font-size:11px;color:var(--text-tertiary)">
            <span id="autoSyncStatus">🔄 准备同步...</span>
            ${s.lastSync ? '<span style="margin-left:8px">上次: ' + new Date(s.lastSync).toLocaleString('zh-CN').slice(5) + '</span>' : ''}
          </div>
        ` : ''}
      </div>

      <!-- Device Sync (primary) -->
      <div class="glass-card mb-md" style="border:2px solid var(--accent-blue);border-radius:var(--radius-lg)">
        <div class="section-title">📲 手动同步</div>

        <!-- One-tap share -->
        <div style="text-align:center;margin-bottom:14px">
          <button class="btn btn-primary" onclick="SettingsModule.shareData()" style="font-size:15px;padding:12px 28px;width:100%">
            📤 发送数据到另一台设备
          </button>
          <div style="font-size:11px;color:var(--text-tertiary);margin-top:6px">
            手机弹出分享菜单 → 选微信/AirDrop/蓝牙发给电脑
          </div>
        </div>

        <!-- Import -->
        <div style="text-align:center;padding-top:14px;border-top:1px solid var(--glass-border)">
          <button class="btn btn-secondary" onclick="SettingsModule.receiveFile()" style="font-size:15px;padding:12px 28px;width:100%">
            📥 接收并导入数据
          </button>
          <div style="font-size:11px;color:var(--text-tertiary);margin-top:6px">
            在接收设备上点这里 → 选择收到的文件 → 自动导入
          </div>
        </div>

        <!-- Fallback -->
        <div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--glass-border);text-align:center">
          <span style="font-size:10px;color:var(--text-placeholder)">备用：</span>
          <button class="btn btn-xs btn-ghost" onclick="SettingsModule.copyToClipboard()">📋 复制</button>
          <button class="btn btn-xs btn-ghost" onclick="SettingsModule.pasteFromClipboard()">📌 粘贴</button>
        </div>
      </div>

      <!-- GitHub Gist Cloud Sync (secondary) -->
      <div class="glass-card flat mb-md">
        <details style="cursor:pointer">
          <summary style="font-size:13px;font-weight:560;color:var(--text-secondary);padding:4px 0">
            ☁ 高级：GitHub 云同步 (部分手机可能无法连接)
          </summary>
          <div style="margin-top:12px">
            <div style="font-size:12px;color:var(--text-secondary);margin-bottom:10px;line-height:1.6">
              <a href="https://github.com/settings/tokens" target="_blank" style="color:var(--accent-blue)">→ 点此创建 Token</a>，勾选 <b>gist</b> 权限，粘贴到下方。
            </div>
            <div style="display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap;margin-bottom:10px">
              <input type="password" class="input" id="settingGistToken" placeholder="ghp_xxxxxxxxxxxx" style="flex:2;min-width:180px;font-family:monospace;font-size:12px"
                     value="${s.gistToken || ''}">
              <button class="btn btn-sm btn-secondary" onclick="SettingsModule.saveToken()" style="flex-shrink:0">💾 保存</button>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              <button class="btn btn-sm btn-primary" onclick="SettingsModule.cloudUpload(this)">☁ 上传</button>
              <button class="btn btn-sm btn-secondary" onclick="SettingsModule.cloudDownload(this)">⬇ 加载</button>
            </div>
            <div style="font-size:10px;color:var(--text-tertiary);margin-top:6px">
              <span id="syncStatus">${s.lastSync ? '上次同步: ' + new Date(s.lastSync).toLocaleString('zh-CN') : '未同步'}</span>
            </div>
          </div>
        </details>
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

  // ===== File Share (one-tap) =====
  async shareData() {
    const dataJson = Storage.exportAll();
    const blob = new Blob([dataJson], { type: 'application/json' });
    const file = new File([blob], `mengtian-${App.today()}.json`, { type: 'application/json' });

    // Try Web Share API first (works on mobile Safari/Chrome)
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: '梦天工作台数据',
          text: '工作台同步数据',
          files: [file],
        });
        App.toast('📤 已发送！在另一台设备上点「接收并导入」');
        return;
      } catch (e) {
        if (e.name === 'AbortError') return; // user cancelled
        // Fall through to fallback
      }
    }

    // Fallback for desktop: download file + copy to clipboard
    App.toast('📤 文件已下载，发送给另一台设备即可');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `mengtian-${App.today()}.json`;
    a.click();

    // Also try clipboard
    try { await navigator.clipboard.writeText(dataJson); } catch {}
  },

  receiveFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (!confirm('⚠️ 导入将覆盖当前所有数据，确定继续？')) return;
        if (Storage.importAll(ev.target.result)) {
          App.toast('✅ 数据已导入！页面刷新中');
          setTimeout(() => location.reload(), 800);
        } else {
          App.toast('❌ 文件格式无效');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  },

  // ===== Clipboard (fallback) =====
  async copyToClipboard() {
    try {
      const dataJson = Storage.exportAll();
      await navigator.clipboard.writeText(dataJson);
      App.toast('📋 数据已复制！在另一台设备粘贴导入');
    } catch {
      // Fallback: show in a textarea for manual copy
      const dataJson = Storage.exportAll();
      const ta = document.createElement('textarea');
      ta.value = dataJson;
      ta.style.cssText = 'position:fixed;top:10%;left:5%;width:90%;height:70%;z-index:999;font-size:11px;padding:12px;border-radius:12px;border:2px solid var(--accent-blue)';
      document.body.appendChild(ta);
      ta.select();
      App.toast('📋 请全选复制文本框内容');
      ta.addEventListener('blur', () => setTimeout(() => ta.remove(), 300));
    }
  },

  async pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (!text || !text.includes('"mt_')) {
        App.toast('❌ 剪贴板内容不是有效的工作台数据');
        return;
      }
      if (!confirm('⚠️ 从剪贴板导入将覆盖当前数据，确定继续？')) return;
      if (Storage.importAll(text)) {
        App.toast('📥 数据已导入！刷新页面生效');
        setTimeout(() => location.reload(), 1000);
      }
    } catch {
      // Fallback: prompt user to paste
      const text = prompt('请粘贴工作台数据 JSON（从另一台设备复制）：');
      if (!text) return;
      if (Storage.importAll(text)) {
        App.toast('📥 数据已导入！刷新页面生效');
        setTimeout(() => location.reload(), 1000);
      } else {
        App.toast('❌ 数据格式无效');
      }
    }
  },

  // ===== Auto Sync =====
  async toggleAutoSync() {
    const s = this.getSettings();
    if (!s.gistToken) {
      App.toast('⚠️ 请先在下方手动同步区域填写 GitHub Token');
      return;
    }
    // If already ON, just turn off
    if (this.autoSyncEnabled) {
      this.autoSyncEnabled = false;
      this.saveSettings({ autoSync: false });
      App.toast('⏸ 自动同步已关闭');
      this.refresh();
      return;
    }
    // Turning ON
    if (!s.gistId) {
      App.toast('⏳ 正在创建云端存档...');
      this.updateSyncStatus('⏳ 创建存档中...');
      await this.autoPush();
      const updated = this.getSettings();
      if (!updated.gistId) {
        App.toast('❌ 创建失败，请检查网络或Token');
        this.updateSyncStatus('⚠ 创建存档失败');
        return;
      }
    }
    this.autoSyncEnabled = true;
    this.saveSettings({ autoSync: true });
    this.updateSyncStatus('✅ 自动同步已开启');
    App.toast('🔄 自动同步已开启');
    this.refresh();
    this.autoPull();
  },

  updateSyncStatus(msg) {
    const el = document.getElementById('autoSyncStatus');
    if (el) el.textContent = msg;
  },

  async autoPull() {
    if (this.syncInProgress) return;
    const s = this.getSettings();
    if (!s.gistToken) { this.updateSyncStatus('⚠ 未配置Token'); return; }
    if (!s.gistId) { this.updateSyncStatus('⚠ 未创建云端存档，修改数据后自动创建'); return; }

    this.syncInProgress = true;
    this.updateSyncStatus('⬇ 下载中...');
    try {
      const resp = await fetch(`https://api.github.com/gists/${s.gistId}`, {
        headers: {
          'Authorization': `Bearer ${s.gistToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });
      if (resp.status === 401 || resp.status === 403) {
        this.updateSyncStatus('⚠ Token无效，请重新设置');
        this.syncInProgress = false;
        return;
      }
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const gist = await resp.json();
      const file = gist.files && gist.files['mengtian-data.json'];
      if (file && file.content) {
        const remoteUpdated = new Date(gist.updated_at);
        const localSync = s.lastSync ? new Date(s.lastSync) : new Date(0);
        if (remoteUpdated > localSync) {
          Storage.importAll(file.content);
          this.saveSettings({ lastSync: new Date().toISOString() });
          this.updateSyncStatus('✅ 已同步 ' + new Date().toLocaleTimeString('zh-CN', {hour:'2-digit',minute:'2-digit'}));
          if (App.currentPage) App.refreshPage(App.currentPage);
        } else {
          this.updateSyncStatus('✅ 已是最新');
        }
      }
    } catch (e) {
      this.updateSyncStatus('⚠ 网络不通，稍后重试');
    }
    this.syncInProgress = false;
  },

  async autoPush() {
    if (this.syncInProgress) { this.schedulePush(); return; }
    const s = this.getSettings();
    if (!s.gistToken) { this.updateSyncStatus('⚠ 未配置Token'); throw new Error('No token'); }

    this.syncInProgress = true;
    this.updateSyncStatus('⏳ 同步中...');
    try {
      const dataJson = Storage.exportAll();
      const body = {
        description: '梦天工作台 · 自动同步',
        public: false,
        files: { 'mengtian-data.json': { content: dataJson } },
      };

      let url = 'https://api.github.com/gists';
      let method = 'POST';
      if (s.gistId) { url += '/' + s.gistId; method = 'PATCH'; }

      const resp = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${s.gistToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (resp.status === 401 || resp.status === 403) {
        this.updateSyncStatus('⚠ Token无效，请重新设置');
        this.syncInProgress = false;
        throw new Error('Token invalid');
      }
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const result = await resp.json();

      this.saveSettings({
        gistId: result.id,
        lastSync: new Date().toISOString(),
      });
      this.updateSyncStatus('✅ 已同步 ' + new Date().toLocaleTimeString('zh-CN', {hour:'2-digit',minute:'2-digit'}));
      this.syncInProgress = false;
      return true;
    } catch (e) {
      this.updateSyncStatus('⚠ 网络不通，稍后重试');
      this.syncInProgress = false;
      // Only schedule retry if auto-sync is enabled (background mode)
      if (this.autoSyncEnabled) {
        setTimeout(() => { if (this.autoSyncEnabled) this.autoPush(); }, 30000);
      }
      throw e; // Re-throw so callers can detect failure
    }
  },

  schedulePush() {
    if (this._pushTimer) clearTimeout(this._pushTimer);
    this._pushTimer = setTimeout(() => {
      if (this.autoSyncEnabled) this.autoPush().catch(() => {});
    }, this._pushDebounce);
  },

  // Called by storage.js after any data change
  onDataChanged() {
    if (this.autoSyncEnabled) {
      this.updateSyncStatus('💾 已更改，即将同步...');
      this.schedulePush();
    }
  },

  // ===== Cloud Sync (GitHub Gist) =====
  saveToken() {
    const token = document.getElementById('settingGistToken').value.trim();
    if (!token) { App.toast('请输入 GitHub Token'); return; }
    this.saveSettings({ gistToken: token });
    App.toast('🔑 Token已保存');
  },

  getToken() {
    const s = this.getSettings();
    return s.gistToken || '';
  },

  async cloudUpload(btn) {
    const token = this.getToken();
    if (!token) { App.toast('⚠️ 请先填写 GitHub Token'); return; }

    if (btn) { btn.disabled = true; btn.textContent = '⏳ 上传中...'; }

    try {
      const dataJson = Storage.exportAll();
      const s = this.getSettings();
      const gistId = s.gistId;

      const body = {
        description: '梦天工作台 · 数据备份',
        public: false,
        files: {
          'mengtian-data.json': { content: dataJson },
        },
      };

      let url = 'https://api.github.com/gists';
      let method = 'POST';
      if (gistId) {
        url = `https://api.github.com/gists/${gistId}`;
        method = 'PATCH';
      }

      const resp = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${resp.status}`);
      }

      const result = await resp.json();
      this.saveSettings({
        gistId: result.id,
        lastSync: new Date().toISOString(),
      });

      document.getElementById('syncStatus').textContent =
        '✅ 上次同步: ' + new Date().toLocaleString('zh-CN');
      App.toast('☁ 数据已上传到云端！');
    } catch (e) {
      const msg = e.message || '网络错误';
      if (msg.includes('401')) App.toast('❌ Token无效，请重新创建并粘贴');
      else if (msg.includes('403')) App.toast('❌ Token缺少gist权限，创建时请勾选gist');
      else if (msg.includes('Failed to fetch') || msg.includes('NetworkError'))
        App.toast('❌ 网络不通，请检查手机是否联网');
      else App.toast('❌ ' + msg);
    }
    if (btn) { btn.disabled = false; btn.textContent = '☁ 上传到云端'; }
  },

  async cloudDownload(btn) {
    const token = this.getToken();
    if (!token) { App.toast('⚠️ 请先填写 GitHub Token'); return; }

    const s = this.getSettings();
    const gistId = s.gistId;
    if (!gistId) { App.toast('⚠️ 请先上传一次数据到云端'); return; }

    if (btn) { btn.disabled = true; btn.textContent = '⏳ 下载中...'; }

    try {
      const resp = await fetch(`https://api.github.com/gists/${gistId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const gist = await resp.json();
      const file = gist.files && gist.files['mengtian-data.json'];
      if (!file || !file.content) throw new Error('Gist内容为空');

      if (!confirm('⚠️ 从云端加载将覆盖当前本地数据，确定继续？')) {
        btn.disabled = false;
        btn.textContent = '⬇ 从云端加载';
        return;
      }

      if (Storage.importAll(file.content)) {
        this.saveSettings({ lastSync: new Date().toISOString() });
        document.getElementById('syncStatus').textContent =
          '✅ 上次同步: ' + new Date().toLocaleString('zh-CN');
        App.toast('☁ 数据已从云端加载，刷新页面生效');
        setTimeout(() => location.reload(), 1200);
      } else {
        throw new Error('数据格式无效');
      }
    } catch (e) {
      App.toast('❌ 加载失败: ' + e.message);
    }
    if (btn) { btn.disabled = false; btn.textContent = '⬇ 从云端加载'; }
  },
};
