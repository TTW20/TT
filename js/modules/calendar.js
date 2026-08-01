/**
 * Module 2: 日历模块 (Calendar)
 * Monthly calendar + Taoist almanac + Horoscope
 */
const CalendarModule = {
  currentYear: 2026,
  currentMonth: 8, // August

  init() {
    const now = new Date();
    this.currentYear = now.getFullYear();
    this.currentMonth = now.getMonth() + 1;
    this.refresh();
  },

  refresh() {
    this.renderCalendar();
    this.renderAlmanac();
    this.renderHoroscope();
  },

  prevMonth() {
    if (this.currentMonth === 1) { this.currentMonth = 12; this.currentYear--; }
    else this.currentMonth--;
    this.refresh();
  },

  nextMonth() {
    if (this.currentMonth === 12) { this.currentMonth = 1; this.currentYear++; }
    else this.currentMonth++;
    this.refresh();
  },

  renderCalendar() {
    const container = document.getElementById('calendarGrid');
    const today = new Date();
    const todayStr = App.today();
    const firstDay = new Date(this.currentYear, this.currentMonth - 1, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth, 0);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    // Get events from todos
    const todos = Storage.getTodos();
    const eventDates = new Set();
    todos.forEach(t => {
      if (t.deadline) eventDates.add(t.deadline.split('T')[0]);
    });

    // Update header
    document.getElementById('calendarMonthLabel').textContent =
      `${this.currentYear}年 ${this.currentMonth}月`;

    // Day headers
    const dayHeaders = ['日', '一', '二', '三', '四', '五', '六'];
    let html = dayHeaders.map(d => `<div class="calendar-day-header">${d}</div>`).join('');

    // Previous month padding
    const prevMonthDays = new Date(this.currentYear, this.currentMonth - 1, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      html += `<div class="calendar-day other-month">${prevMonthDays - i}</div>`;
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${this.currentYear}-${String(this.currentMonth).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const isToday = dateStr === todayStr;
      const hasEvent = eventDates.has(dateStr);
      const classes = ['calendar-day'];
      if (isToday) classes.push('today');
      if (hasEvent) classes.push('has-event');
      html += `<div class="${classes.join(' ')}" title="${dateStr}" onclick="CalendarModule.addTodoFromCalendar('${dateStr}')">${d}</div>`;
    }

    // Next month padding
    const remaining = 42 - (startDayOfWeek + daysInMonth); // 6 rows * 7 cols
    for (let i = 1; i <= remaining; i++) {
      html += `<div class="calendar-day other-month">${i}</div>`;
    }

    container.innerHTML = html;
  },

  renderAlmanac() {
    // Generate Taoist almanac based on date
    const today = new Date();
    const dayCycle = (today.getDate() + today.getMonth() * 3 + today.getFullYear() * 5) % 12;
    const stems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    const branches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    const zodiacs = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];

    const stemIndex = (today.getFullYear() + today.getMonth() + today.getDate()) % 10;
    const branchIndex = (today.getFullYear() + today.getMonth() + today.getDate() + 2) % 12;

    const isGoodDay = (stemIndex + branchIndex) % 3 !== 0;
    const dayType = isGoodDay ? '黄道吉日 ✨' : '黑道日';
    const dayColor = isGoodDay ? 'var(--accent-green)' : 'var(--accent-red)';

    const goodActivities = [
      ['祭祀', '祈福', '出行', '嫁娶', '开市', '纳财'],
      ['开业', '签约', '搬家', '装修', '入学', '求医'],
      ['出行', '会友', '订婚', '交易', '种植', '修造'],
    ];
    const badActivities = [
      ['动土', '安葬', '伐木', '争吵'],
      ['诉讼', '远行', '破土', '开仓'],
      ['动土', '迁徙', '行丧', '争吵'],
    ];

    const gi = goodActivities[dayCycle % 3];
    const bi = badActivities[dayCycle % 3];

    // Generate fortune
    const fortunes = ['大吉', '中吉', '小吉', '平', '小凶'];
    const fortuneIdx = isGoodDay ? (dayCycle % 3) : 3 + (dayCycle % 2);
    const fortune = fortunes[fortuneIdx] || '平';

    const directions = ['正东', '东南', '正南', '西南', '正西', '西北', '正北', '东北'];
    const clashAnimal = zodiacs[(branchIndex + 6) % 12];
    const wealthDir = directions[dayCycle % 8];

    document.getElementById('almanacContent').innerHTML = `
      <div style="text-align:center;margin-bottom:14px">
        <div style="font-size:28px;font-weight:200;color:${dayColor};letter-spacing:2px">${dayType}</div>
        <div style="font-size:13px;color:var(--text-tertiary);margin-top:4px">
          ${stems[stemIndex]}${branches[branchIndex]}年 · ${zodiacs[branchIndex]}年
        </div>
        <div style="font-size:14px;font-weight:540;margin-top:6px;color:var(--text-primary)">
          今日运势：${fortune}
        </div>
      </div>
      <div class="almanac-grid">
        <div class="almanac-item"><span class="almanac-label">✅ 宜</span><span style="color:var(--accent-green)">${gi.join('、')}</span></div>
        <div class="almanac-item"><span class="almanac-label">🚫 忌</span><span style="color:var(--accent-red)">${bi.join('、')}</span></div>
        <div class="almanac-item"><span class="almanac-label">⚡ 冲煞</span><span>冲${clashAnimal}煞</span></div>
        <div class="almanac-item"><span class="almanac-label">💰 财神</span><span>${wealthDir}方位</span></div>
      </div>
    `;
  },

  renderHoroscope() {
    // Simple zodiac-based horoscope
    const today = new Date();
    const signs = ['摩羯座', '水瓶座', '双鱼座', '白羊座', '金牛座', '双子座',
                   '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座'];
    const signDates = [20, 19, 21, 20, 21, 21, 23, 23, 23, 23, 22, 22];
    const month = today.getMonth() + 1;
    const day = today.getDate();
    let signIdx = month - 1;
    if (day < signDates[month - 1]) signIdx = (month - 2 + 12) % 12;

    const seed = today.getFullYear() * 10000 + month * 100 + day;
    const rng = (n) => (seed * 1103515245 + 12345) % 2147483648 >>> 0 % n;

    const luckLevels = ['🌟🌟🌟🌟🌟', '🌟🌟🌟🌟', '🌟🌟🌟', '🌟🌟', '🌟'];
    const overallIdx = (seed % 5);
    const overallLuck = luckLevels[overallIdx > 2 ? overallIdx - 2 : overallIdx];

    const colors = ['天蓝色', '淡粉色', '薄荷绿', '暖橙色', '薰衣草紫', '米白色', '浅灰色'];
    const numbers = [3, 5, 7, 8, 2, 9, 6, 4, 1];

    const aspects = ['事业', '学习', '健康', '爱情', '财富'];
    const aspectTexts = aspects.map(a => {
      const lvl = (seed + a.length * 7) % 5;
      const texts = ['极佳，把握机会！', '运势良好，稳步前进', '平稳发展，保持节奏', '需要谨慎，避免冲动', '稍有起伏，调整心态'];
      return { name: a, text: texts[lvl] };
    });

    document.getElementById('horoscopeContent').innerHTML = `
      <div style="text-align:center;margin-bottom:16px">
        <div style="font-size:15px;font-weight:600;color:var(--accent-purple)">${signs[signIdx]}</div>
        <div style="font-size:24px;margin-top:4px">${overallLuck}</div>
        <div style="font-size:13px;color:var(--text-secondary);margin-top:4px">整体运势</div>
      </div>
      ${aspectTexts.map(a => `
        <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--glass-border);font-size:13px">
          <span style="color:var(--text-tertiary)">${a.name}</span>
          <span>${a.text}</span>
        </div>
      `).join('')}
      <div class="lucky-grid mt-md">
        <div class="lucky-item">
          <div class="lucky-item-value" style="color:var(--accent-pink)">${colors[seed % colors.length]}</div>
          <div class="lucky-item-label">幸运色</div>
        </div>
        <div class="lucky-item">
          <div class="lucky-item-value" style="color:var(--accent-blue)">${numbers[seed % numbers.length]}</div>
          <div class="lucky-item-label">幸运数字</div>
        </div>
        <div class="lucky-item">
          <div class="lucky-item-value" style="color:var(--accent-teal)">${signs[(signIdx + 5) % 12]}</div>
          <div class="lucky-item-label">契合星座</div>
        </div>
      </div>
    `;
  },

  addTodoFromCalendar(dateStr) {
    App.showPage('todos');
    setTimeout(() => {
      document.getElementById('todoDeadline').value = dateStr;
    }, 300);
  },
};
