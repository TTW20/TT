/**
 * Module: 今日热点 (Today's Hot Topics)
 * Daily news aggregation with bookmark support
 */
const HotspotsModule = {
  sampleTopics: [
    { title: 'AI 技术前沿：大模型应用落地加速', summary: '多家科技公司发布基于大语言模型的企业级应用解决方案，推动AI技术从实验走向生产环境。', source: '科技日报', time: '2小时前', category: '科技' },
    { title: '全球气候变化新协议达成', summary: '多国在气候峰会上达成新的减排目标，承诺到2035年将碳排放量减少45%。', source: '环球时报', time: '3小时前', category: '国际' },
    { title: '教育改革新政策解读：减负与提质并行', summary: '教育部发布最新指导意见，强调在减轻学生课业负担的同时，提升课堂教学质量和效率。', source: '教育周刊', time: '4小时前', category: '教育' },
    { title: '健康生活新趋势：科学饮水与间歇性运动', summary: '研究表明，规律饮水和短时高强度运动结合的健康方式正在成为都市白领的新选择。', source: '健康时报', time: '5小时前', category: '健康' },
    { title: '2026年最具潜力图书榜单发布', summary: '各大平台联合发布年度推荐书单，涵盖心理成长、科技趋势、文学小说等多个领域。', source: '文化频道', time: '6小时前', category: '文化' },
    { title: '编程学习资源大整合：免费课程推荐', summary: '社区整理了一份高质量的免费编程学习资源清单，涵盖前端、后端、AI等多个方向。', source: '开发者社区', time: '7小时前', category: '技术' },
    { title: '时间管理新方法：番茄工作法升级版', summary: '心理学家提出改进版番茄工作法，结合个人生物钟节律，提升专注效率达40%。', source: '效率日报', time: '8小时前', category: '生活' },
    { title: '秋季健身指南：室内运动推荐', summary: '随着天气转凉，健身专家推荐了5种适合秋季的室内运动方式，帮助保持运动习惯。', source: '运动养生', time: '9小时前', category: '健康' },
  ],

  init() {
    this.refresh();
  },

  refresh() {
    const stored = Storage.getHotTopics();
    let items = [];
    const today = App.today();

    if (stored.date === today && stored.items.length > 0) {
      items = stored.items;
    } else {
      // Shuffle and pick samples
      items = [...this.sampleTopics].sort(() => Math.random() - 0.5).slice(0, 6);
      Storage.saveHotTopics(items);
    }

    this.render(items);
  },

  render(items) {
    const container = document.getElementById('hotspotsList');
    const favorites = Storage.getInspirations().filter(i => i.type === 'link' && i.favorite);

    container.innerHTML = items.map((item, i) => `
      <div class="hot-topic-item">
        <div class="hot-topic-index">${String(i + 1).padStart(2, '0')}</div>
        <div class="hot-topic-content">
          <div class="hot-topic-title">${item.title}</div>
          <div class="hot-topic-summary">${item.summary}</div>
          <div class="hot-topic-source">
            <span>${item.source}</span>
            <span style="margin:0 8px">·</span>
            <span>${item.time}</span>
            <span style="margin:0 8px">·</span>
            <span class="tag tag-purple">${item.category}</span>
          </div>
        </div>
        <button class="btn-icon" title="收藏到灵感库" onclick="HotspotsModule.bookmark(${i})" style="flex-shrink:0">
          ${App.icons.heart}
        </button>
      </div>
    `).join('');

    // Favorited section
    const favSection = document.getElementById('hotspotsFavorites');
    if (favSection) {
      const favLinks = favorites.filter(i => i.source === 'hotspot');
      if (favLinks.length > 0) {
        favSection.innerHTML = `
          <div class="section-title mt-lg">⭐ 已收藏热点</div>
          ${favLinks.slice(0, 10).map(f => `
            <div style="padding:8px 14px;border-radius:8px;background:var(--glass-bg-light);margin-bottom:6px;display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:13px">🔗 ${f.content}</span>
              <span style="font-size:11px;color:var(--text-tertiary)">${f.date}</span>
            </div>
          `).join('')}
        `;
      }
    }
  },

  bookmark(index) {
    const stored = Storage.getHotTopics();
    const item = stored.items[index];
    if (!item) return;
    Storage.saveInspiration({
      type: 'link',
      content: item.title,
      url: '#',
      source: 'hotspot',
      category: '学习',
      tags: ['热点', item.category],
    });
    App.toast('⭐ 已收藏到灵感库');
  },

  refreshTopics() {
    const shuffled = [...this.sampleTopics].sort(() => Math.random() - 0.5).slice(0, 6);
    Storage.saveHotTopics(shuffled);
    this.render(shuffled);
    App.toast('🔄 热点已刷新');
  },
};
