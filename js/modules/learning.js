/**
 * Module: 学习中心 (Learning Center)
 * 教资学习 / Java学习 / 英语学习 + 自定义学科
 * Study tracking, timer, notes, goals
 */
const LearningModule = {
  activeSubject: '教资学习',
  studyTimerRunning: false,
  studyTimerSeconds: 0,
  studyTimerInterval: null,
  elapsedSeconds: 0,

  // Default subjects
  defaultSubjects: [
    { id: 'jiaozhi', name: '教资学习', icon: '📝', color: 'var(--accent-blue)', goalMin: 60 },
    { id: 'java', name: 'Java学习', icon: '☕', color: 'var(--accent-orange)', goalMin: 90 },
    { id: 'english', name: '英语学习', icon: '🌍', color: 'var(--accent-teal)', goalMin: 45 },
  ],

  init() {
    this.ensureSubjects();
    this.refresh();
  },

  refresh() {
    this.renderSubjects();
    this.renderContent();
    this.updateStudyTimerDisplay();
  },

  // --- Data helpers ---
  getData() {
    const raw = localStorage.getItem('mt_learning');
    if (!raw) {
      const d = this.defaultSubjects.map(s => ({
        ...s,
        totalMinutes: 0,
        todayMinutes: 0,
        todayDate: App.today(),
        notes: [],
        completedTopics: [],
      }));
      localStorage.setItem('mt_learning', JSON.stringify(d));
      return d;
    }
    try {
      const data = JSON.parse(raw);
      // Reset todayMinutes if it's a new day
      const today = App.today();
      data.forEach(s => {
        if (s.todayDate !== today) {
          s.todayMinutes = 0;
          s.todayDate = today;
        }
      });
      return data;
    } catch { return []; }
  },

  saveData(data) {
    localStorage.setItem('mt_learning', JSON.stringify(data));
  },

  ensureSubjects() {
    const data = this.getData();
    this.defaultSubjects.forEach(ds => {
      if (!data.find(s => s.id === ds.id)) {
        data.push({
          ...ds,
          totalMinutes: 0,
          todayMinutes: 0,
          todayDate: App.today(),
          notes: [],
          completedTopics: [],
        });
      }
    });
    this.saveData(data);
  },

  getSubject(id) {
    return this.getData().find(s => s.id === id);
  },

  // --- Subject tabs ---
  renderSubjects() {
    const data = this.getData();
    const container = document.getElementById('learningSubjectTabs');
    if (!container) return;

    container.innerHTML = data.map(s => {
      const active = s.id === this.activeSubject;
      const pct = s.goalMin > 0 ? Math.min(100, Math.round(((s.todayMinutes||0) / s.goalMin) * 100)) : 0;
      return `
        <div class="learning-subject-tab ${active ? 'active' : ''}"
             onclick="LearningModule.selectSubject('${s.id}')"
             style="border-left: 3px solid ${active ? s.color : 'transparent'};cursor:pointer">
          <span style="font-size:24px;flex-shrink:0">${s.icon}</span>
          <div style="flex:1;min-width:0">
            <div style="font-size:14px;font-weight:${active ? '620' : '500'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:${active ? s.color : 'var(--text-primary)'}">${s.name}</div>
            <div style="margin-top:6px;height:5px;border-radius:3px;background:rgba(0,0,0,0.06);overflow:hidden">
              <div style="height:100%;width:${pct}%;background:${s.color};border-radius:3px;transition:width 0.5s ease"></div>
            </div>
            <div style="font-size:11px;color:var(--text-tertiary);margin-top:4px;display:flex;justify-content:space-between">
              <span>今日 ${s.todayMinutes||0}min</span>
              <span>目标 ${s.goalMin}min</span>
            </div>
          </div>
          ${active ? `<span style="font-size:11px;color:${s.color};flex-shrink:0">▶</span>` : ''}
        </div>
      `;
    }).join('');

    // Add subject button
    container.innerHTML += `
      <div class="learning-subject-tab" onclick="LearningModule.showAddSubject()"
           style="justify-content:center;align-items:center;color:var(--text-secondary);font-size:13px;cursor:pointer;border:1px dashed var(--glass-border);background:transparent;padding:14px">
        <span style="font-size:16px;margin-right:4px">＋</span> 添加新学科
      </div>
    `;
  },

  selectSubject(id) {
    this.activeSubject = id;
    // 安全停止计时器（元素可能尚未渲染）
    if (this.studyTimerRunning) {
      this.studyTimerRunning = false;
      clearInterval(this.studyTimerInterval);
    }
    this.elapsedSeconds = 0;
    this.studyTimerSeconds = 0;
    this.refresh();
    const contentArea = document.getElementById('learningContentArea');
    if (contentArea) contentArea.scrollTop = 0;
  },

  showAddSubject() {
    const name = prompt('请输入新学科名称：', '');
    if (!name || !name.trim()) return;
    const id = 'custom_' + Date.now().toString(36);
    const data = this.getData();
    const colors = ['var(--accent-purple)', 'var(--accent-pink)', 'var(--accent-green)', 'var(--accent-indigo)', 'var(--accent-cyan)'];
    data.push({
      id, name: name.trim(), icon: '📖',
      color: colors[Math.floor(Math.random() * colors.length)],
      goalMin: 60, totalMinutes: 0,
      todayMinutes: 0, todayDate: App.today(),
      notes: [], completedTopics: [],
    });
    this.saveData(data);
    this.activeSubject = id;
    this.refresh();
    App.toast(`✅ 已添加学科：${name.trim()}`);
  },

  deleteSubject(id) {
    if (this.defaultSubjects.find(s => s.id === id)) {
      App.toast('默认学科不可删除');
      return;
    }
    if (!confirm('确定删除该学科吗？学习记录将被清除。')) return;
    const data = this.getData().filter(s => s.id !== id);
    this.saveData(data);
    this.activeSubject = data[0]?.id || 'jiaozhi';
    this.refresh();
    App.toast('已删除');
  },

  // --- Main content area ---
  renderContent() {
    const s = this.getSubject(this.activeSubject);
    if (!s) return;

    const container = document.getElementById('learningContentArea');
    const pct = s.goalMin > 0 ? Math.min(100, Math.round(((s.todayMinutes||0) / s.goalMin) * 100)) : 0;
    const circumference = 2 * Math.PI * 50;

    // Count topics today
    const todayTopics = s.completedTopics ? s.completedTopics.filter(t => t.date === App.today()).length : 0;

    container.innerHTML = `
      <!-- Stats Row -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px">
        <!-- Ring Chart Card -->
        <div class="glass-card" style="text-align:center;padding:20px">
          <div style="font-size:14px;font-weight:600;margin-bottom:12px;color:${s.color}">📊 今日进度</div>
          <div class="ring-chart" style="width:120px;height:120px;margin:0 auto">
            <svg viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(0,0,0,0.06)" stroke-width="8"/>
              <circle cx="60" cy="60" r="50" fill="none" stroke="${s.color}" stroke-width="8"
                stroke-dasharray="${circumference}" stroke-dashoffset="${circumference - (pct/100) * circumference}"
                stroke-linecap="round" transform="rotate(-90 60 60)"/>
            </svg>
            <div class="ring-chart-center">
              <div class="ring-chart-value" style="font-size:26px">${pct}%</div>
              <div class="ring-chart-label">完成度</div>
            </div>
          </div>
          <div style="font-size:13px;color:var(--text-secondary);margin-top:10px">
            <b style="color:${s.color}">${s.todayMinutes||0}</b> / ${s.goalMin} 分钟
          </div>
        </div>

        <!-- Stats + Actions Card -->
        <div class="glass-card" style="padding:20px;display:flex;flex-direction:column;justify-content:space-between">
          <div>
            <div style="display:flex;gap:20px;margin-bottom:16px">
              <div style="flex:1;text-align:center">
                <div style="font-size:32px;font-weight:200;color:${s.color}">${s.totalMinutes||0}</div>
                <div style="font-size:12px;color:var(--text-tertiary)">累计分钟</div>
              </div>
              <div style="flex:1;text-align:center">
                <div style="font-size:32px;font-weight:200;color:var(--accent-green)">${todayTopics}</div>
                <div style="font-size:12px;color:var(--text-tertiary)">今日主题</div>
              </div>
              <div style="flex:1;text-align:center">
                <div style="font-size:32px;font-weight:200;color:var(--accent-purple)">${(s.completedTopics||[]).length}</div>
                <div style="font-size:12px;color:var(--text-tertiary)">总主题</div>
              </div>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:7px">
            <button class="btn btn-primary btn-sm w-full" onclick="LearningModule.startTimer()" id="learningTimerBtn">
              ▶ 开始计时学习
            </button>
            <button class="btn btn-secondary btn-sm w-full" onclick="LearningModule.showAddTopic()">
              ✚ 记录完成主题
            </button>
            <button class="btn btn-ghost btn-sm w-full" onclick="LearningModule.showSetGoal()">
              🎯 设定每日目标
            </button>
          </div>
        </div>
      </div>

      <!-- Timer Display -->
      <div class="glass-card mb-md" id="learningTimerCard" style="text-align:center;padding:14px;display:none">
        <div style="display:flex;align-items:center;justify-content:center;gap:14px">
          <span style="font-size:11px;color:var(--text-tertiary)">⏱ 计时中</span>
          <span style="font-size:32px;font-weight:200;font-family:'SF Mono','Menlo',monospace;letter-spacing:2px" id="learningTimerDisplay">00:00</span>
          <span style="font-size:11px;color:var(--accent-green)" id="learningElapsed"></span>
          <button class="btn btn-xs btn-danger" onclick="LearningModule.stopTimer()">⏹ 停止</button>
          <button class="btn btn-xs btn-secondary" onclick="LearningModule.pauseTimer()" id="learningPauseBtn">⏸ 暂停</button>
        </div>
      </div>

      <!-- Topic Input Area -->
      <div class="glass-card mb-md" id="learningTopicInput" style="display:none">
        <div style="font-size:14px;font-weight:560;margin-bottom:10px">✚ 完成学习主题</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <input type="text" class="input" id="learningTopicText" placeholder="学习内容，如：第三章 教育心理学" style="flex:2;min-width:150px">
          <input type="number" class="input" id="learningTopicMin" placeholder="学习时长(分)" style="flex:1;min-width:80px" value="25" min="1">
          <button class="btn btn-primary btn-sm" onclick="LearningModule.addTopic()" style="flex-shrink:0">💾 保存</button>
          <button class="btn btn-ghost btn-sm" onclick="document.getElementById('learningTopicInput').style.display='none'" style="flex-shrink:0">取消</button>
        </div>
      </div>

      <!-- Goal Setting -->
      <div class="glass-card mb-md" id="learningGoalInput" style="display:none">
        <div style="font-size:14px;font-weight:560;margin-bottom:10px">🎯 每日学习目标</div>
        <div style="display:flex;gap:8px;align-items:flex-end">
          <div style="flex:1">
            <label style="font-size:11px;color:var(--text-tertiary)">每日目标 (分钟)</label>
            <input type="number" class="input" id="learningGoalMin" value="${s.goalMin}" min="10" step="5">
          </div>
          <button class="btn btn-primary btn-sm" onclick="LearningModule.saveGoal()">💾 保存</button>
          <button class="btn btn-ghost btn-sm" onclick="document.getElementById('learningGoalInput').style.display='none'">取消</button>
        </div>
      </div>

      <!-- Today's Completed Topics -->
      <div class="mb-md">
        <div style="font-size:14px;font-weight:560;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center">
          <span>✅ 今日完成</span>
          <span style="font-size:12px;color:var(--text-tertiary)">${(s.completedTopics||[]).filter(t => t.date === App.today()).length} 项</span>
        </div>
        <div id="learningTodayTopics">
          ${this.renderTopicList((s.completedTopics||[]).filter(t => t.date === App.today()), s.color)}
        </div>
      </div>

      <!-- Recent Topics -->
      <div class="mb-md">
        <div style="font-size:14px;font-weight:560;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center">
          <span>📋 近期记录</span>
        </div>
        <div id="learningRecentTopics">
          ${this.renderTopicList((s.completedTopics||[]).filter(t => t.date !== App.today()).slice(-10).reverse(), s.color)}
        </div>
      </div>

      <!-- Study Notes -->
      <div>
        <div style="font-size:14px;font-weight:560;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center">
          <span>📝 学习笔记</span>
          <button class="btn btn-xs btn-primary" onclick="LearningModule.showAddNote()">✚ 写笔记</button>
        </div>
        <div id="learningNoteInput" style="display:none;margin-bottom:12px">
          <div class="glass-card flat" style="padding:14px">
            <textarea class="input" id="learningNoteText" placeholder="记录学习笔记..." style="min-height:70px;resize:vertical;font-family:inherit"></textarea>
            <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px">
              <button class="btn btn-sm btn-ghost" onclick="document.getElementById('learningNoteInput').style.display='none'">取消</button>
              <button class="btn btn-sm btn-primary" onclick="LearningModule.saveNote()">💾 保存笔记</button>
            </div>
          </div>
        </div>
        <div id="learningNotesList">
          ${this.renderNotesList(s.notes)}
        </div>
      </div>

      <!-- Delete custom subject -->
      ${!this.defaultSubjects.find(ds => ds.id === s.id) ? `
        <div style="text-align:center;margin-top:24px;padding-top:16px;border-top:1px solid var(--glass-border)">
          <button class="btn btn-sm btn-danger" onclick="LearningModule.deleteSubject('${s.id}')">🗑 删除此学科</button>
        </div>
      ` : ''}
    `;
  },

  renderTopicList(topics, color) {
    if (!topics || topics.length === 0) {
      return `<div style="text-align:center;padding:16px;color:var(--text-tertiary);font-size:12px">暂无记录</div>`;
    }
    return topics.map(t => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:9px 12px;border-radius:8px;background:var(--glass-bg-light);margin-bottom:4px">
        <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:0">
          <span style="width:6px;height:6px;border-radius:50%;background:${color};flex-shrink:0"></span>
          <span style="font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.text}</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;flex-shrink:0">
          <span style="font-size:12px;color:var(--accent-teal)">${t.minutes}min</span>
          <span style="font-size:10px;color:var(--text-tertiary)">${t.date}</span>
          <button class="btn-icon" style="width:22px;height:22px;font-size:10px" onclick="LearningModule.deleteTopic('${t.id}')" title="删除">✕</button>
        </div>
      </div>
    `).join('');
  },

  renderNotesList(notes) {
    if (!notes || notes.length === 0) {
      return `<div style="text-align:center;padding:16px;color:var(--text-tertiary);font-size:12px">暂无笔记</div>`;
    }
    return notes.slice().reverse().slice(0, 20).map(n => `
      <div class="glass-card flat" style="padding:12px 14px;margin-bottom:6px">
        <div style="font-size:13px;line-height:1.6;white-space:pre-wrap">${n.text}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
          <span style="font-size:10px;color:var(--text-tertiary)">${n.date}</span>
          <button class="btn btn-xs btn-ghost" onclick="LearningModule.deleteNote('${n.id}')" style="font-size:10px">删除</button>
        </div>
      </div>
    `).join('');
  },

  // --- Actions ---
  showAddTopic() {
    document.getElementById('learningTopicInput').style.display = '';
    document.getElementById('learningGoalInput').style.display = 'none';
    document.getElementById('learningTopicText').focus();
  },

  addTopic() {
    const text = document.getElementById('learningTopicText').value.trim();
    const minutes = parseInt(document.getElementById('learningTopicMin').value) || 0;
    if (!text) { App.toast('请输入学习内容'); return; }
    if (minutes <= 0) { App.toast('请输入有效时长'); return; }

    const data = this.getData();
    const s = data.find(s => s.id === this.activeSubject);
    if (!s) return;

    s.completedTopics.push({
      id: Date.now().toString(36),
      text, minutes,
      date: App.today(),
      timestamp: new Date().toISOString(),
    });
    s.totalMinutes += minutes;
    s.todayMinutes += minutes;
    this.saveData(data);

    document.getElementById('learningTopicText').value = '';
    document.getElementById('learningTopicMin').value = '25';
    document.getElementById('learningTopicInput').style.display = 'none';
    this.refresh();
    App.toast(`✅ 已完成：${text} (${minutes}分钟)`);
  },

  deleteTopic(id) {
    const data = this.getData();
    const s = data.find(s => s.id === this.activeSubject);
    if (!s) return;
    const topic = s.completedTopics.find(t => t.id === id);
    if (topic) {
      s.totalMinutes = Math.max(0, s.totalMinutes - topic.minutes);
      if (topic.date === App.today()) {
        s.todayMinutes = Math.max(0, s.todayMinutes - topic.minutes);
      }
    }
    s.completedTopics = s.completedTopics.filter(t => t.id !== id);
    this.saveData(data);
    this.refresh();
    App.toast('已删除');
  },

  showAddNote() {
    document.getElementById('learningNoteInput').style.display = '';
    document.getElementById('learningNoteText').focus();
  },

  saveNote() {
    const text = document.getElementById('learningNoteText').value.trim();
    if (!text) { App.toast('请输入笔记内容'); return; }

    const data = this.getData();
    const s = data.find(s => s.id === this.activeSubject);
    if (!s) return;

    s.notes.push({
      id: Date.now().toString(36),
      text,
      date: App.today(),
      timestamp: new Date().toISOString(),
    });
    this.saveData(data);

    document.getElementById('learningNoteText').value = '';
    document.getElementById('learningNoteInput').style.display = 'none';
    this.refresh();
    App.toast('📝 笔记已保存');
  },

  deleteNote(id) {
    const data = this.getData();
    const s = data.find(s => s.id === this.activeSubject);
    if (!s) return;
    s.notes = s.notes.filter(n => n.id !== id);
    this.saveData(data);
    this.refresh();
    App.toast('笔记已删除');
  },

  showSetGoal() {
    const s = this.getSubject(this.activeSubject);
    document.getElementById('learningGoalInput').style.display = '';
    document.getElementById('learningTopicInput').style.display = 'none';
    document.getElementById('learningGoalMin').value = s ? s.goalMin : 60;
  },

  saveGoal() {
    const goal = parseInt(document.getElementById('learningGoalMin').value);
    if (!goal || goal < 10) { App.toast('目标至少10分钟'); return; }

    const data = this.getData();
    const s = data.find(s => s.id === this.activeSubject);
    if (!s) return;
    s.goalMin = goal;
    this.saveData(data);
    document.getElementById('learningGoalInput').style.display = 'none';
    this.refresh();
    App.toast(`🎯 每日目标已更新为 ${goal} 分钟`);
  },

  // --- Study Timer ---
  startTimer() {
    if (this.studyTimerRunning) return;
    this.studyTimerRunning = true;
    this.elapsedSeconds = 0;
    this.studyTimerSeconds = 0;

    const timerCard = document.getElementById('learningTimerCard');
    const timerBtn = document.getElementById('learningTimerBtn');
    if (timerCard) timerCard.style.display = '';
    if (timerBtn) {
      timerBtn.textContent = '● 计时中...';
      timerBtn.className = 'btn btn-sm btn-danger';
      timerBtn.onclick = () => LearningModule.stopTimer();
    }

    this.studyTimerInterval = setInterval(() => {
      this.studyTimerSeconds++;
      this.elapsedSeconds++;
      this.updateStudyTimerDisplay();
    }, 1000);
  },

  pauseTimer() {
    const pauseBtn = document.getElementById('learningPauseBtn');
    if (!this.studyTimerRunning) {
      // Resume
      this.studyTimerRunning = true;
      if (pauseBtn) pauseBtn.textContent = '⏸ 暂停';
      this.studyTimerInterval = setInterval(() => {
        this.studyTimerSeconds++;
        this.elapsedSeconds++;
        this.updateStudyTimerDisplay();
      }, 1000);
    } else {
      // Pause
      this.studyTimerRunning = false;
      clearInterval(this.studyTimerInterval);
      if (pauseBtn) pauseBtn.textContent = '▶ 继续';
    }
  },

  stopTimer() {
    this.studyTimerRunning = false;
    clearInterval(this.studyTimerInterval);

    const minutes = Math.round((this.elapsedSeconds || 0) / 60);
    if (minutes > 0) {
      const data = this.getData();
      const s = data.find(s => s.id === this.activeSubject);
      if (s) {
        s.totalMinutes = (s.totalMinutes || 0) + minutes;
        s.todayMinutes = (s.todayMinutes || 0) + minutes;
        if (!s.completedTopics) s.completedTopics = [];
        s.completedTopics.push({
          id: Date.now().toString(36),
          text: `⏱ 自由学习`,
          minutes,
          date: App.today(),
          timestamp: new Date().toISOString(),
        });
        this.saveData(data);
      }
      App.toast(`⏱ 学习结束，本次 ${minutes} 分钟`);
    }

    this.elapsedSeconds = 0;
    this.studyTimerSeconds = 0;

    // 安全更新 DOM 元素（可能尚未渲染）
    const timerCard = document.getElementById('learningTimerCard');
    const timerBtn = document.getElementById('learningTimerBtn');
    if (timerCard) timerCard.style.display = 'none';
    if (timerBtn) {
      timerBtn.textContent = '▶ 开始计时';
      timerBtn.className = 'btn btn-sm btn-primary';
      timerBtn.onclick = () => LearningModule.startTimer();
    }
    this.updateStudyTimerDisplay();
    this.refresh();
  },

  updateStudyTimerDisplay() {
    const mins = Math.floor(this.studyTimerSeconds / 60);
    const secs = this.studyTimerSeconds % 60;
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    const display = document.getElementById('learningTimerDisplay');
    const elapsed = document.getElementById('learningElapsed');
    if (display) display.textContent = timeStr;
    if (elapsed && this.elapsedSeconds > 0) {
      const eMin = Math.round(this.elapsedSeconds / 60);
      elapsed.textContent = `累计 ${eMin}min`;
    }
  },
};
