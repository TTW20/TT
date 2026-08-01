/**
 * Module 8: 今日灵感 (Inspiration)
 * Text/voice recording + URL bookmark + categorized collection
 */
const InspirationModule = {
  currentFilter: 'all',
  recognition: null,

  init() {
    this.refresh();
    this.initVoiceRecognition();
  },

  refresh() {
    this.renderList();
  },

  saveText() {
    const input = document.getElementById('inspirationInput');
    const category = document.getElementById('inspirationCategory').value;
    const text = input.value.trim();
    if (!text) { App.toast('请输入灵感内容'); return; }

    Storage.saveInspiration({ type: 'text', content: text, category, tags: [] });
    input.value = '';
    this.refresh();
    App.toast('💡 灵感已保存');
  },

  saveLink() {
    const urlInput = document.getElementById('inspirationUrl');
    const noteInput = document.getElementById('inspirationUrlNote');
    const category = document.getElementById('inspirationUrlCategory').value;
    const url = urlInput.value.trim();
    if (!url) { App.toast('请输入网页链接'); return; }

    Storage.saveInspiration({
      type: 'link',
      content: noteInput.value.trim() || url,
      url,
      category,
      tags: ['收藏链接'],
    });
    urlInput.value = '';
    noteInput.value = '';
    this.refresh();
    App.toast('🔗 链接已收藏');
  },

  // Voice recognition
  initVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'zh-CN';
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        document.getElementById('inspirationInput').value = transcript;
        App.toast('🎤 语音识别完成');
      };
      this.recognition.onerror = () => {
        App.toast('语音识别失败，请重试');
        document.getElementById('voiceBtn').style.background = '';
      };
      this.recognition.onend = () => {
        document.getElementById('voiceBtn').style.background = '';
      };
    }
  },

  startVoice() {
    if (!this.recognition) {
      App.toast('您的浏览器不支持语音识别');
      return;
    }
    try {
      this.recognition.start();
      document.getElementById('voiceBtn').style.background = 'var(--accent-red)';
      document.getElementById('voiceBtn').style.color = '#fff';
    } catch (e) {
      App.toast('语音识别启动失败');
    }
  },

  toggleFavorite(id) {
    Storage.toggleFavoriteInspiration(id);
    this.refresh();
  },

  deleteInspiration(id) {
    const items = Storage.getInspirations().filter(i => i.id !== id);
    Storage.set(Storage.KEYS.inspirations, items);
    this.refresh();
    App.toast('已删除');
  },

  setFilter(filter) {
    this.currentFilter = filter;
    document.querySelectorAll('#inspirationFilters .btn').forEach(b => b.classList.remove('btn-primary'));
    const activeBtn = document.querySelector(`#inspirationFilters [data-filter="${filter}"]`);
    if (activeBtn) activeBtn.classList.add('btn-primary');
    this.renderList();
  },

  renderList() {
    const items = Storage.getInspirations();
    let filtered = items;
    const today = App.today();

    if (this.currentFilter === 'today') {
      filtered = items.filter(i => i.date === today);
    } else if (this.currentFilter === 'favorite') {
      filtered = items.filter(i => i.favorite);
    } else if (this.currentFilter === 'text') {
      filtered = items.filter(i => i.type === 'text');
    } else if (this.currentFilter === 'link') {
      filtered = items.filter(i => i.type === 'link');
    } else if (['创意', '学习', '写作', '生活'].includes(this.currentFilter)) {
      filtered = items.filter(i => i.category === this.currentFilter);
    }

    const container = document.getElementById('inspirationList');

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:30px;color:var(--text-tertiary)">
          <div style="font-size:40px;margin-bottom:10px">💡</div>
          <div>暂无灵感记录</div>
          <div style="font-size:12px;margin-top:4px">记录一闪而过的想法吧</div>
        </div>`;
      return;
    }

    container.innerHTML = filtered.map(item => {
      const catColors = { '创意': 'tag-purple', '学习': 'tag-blue', '写作': 'tag-green', '生活': 'tag-orange' };
      return `
        <div class="inspiration-card mb-sm">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">
            <div style="flex:1">
              ${item.type === 'link' ? `
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
                  <span style="font-size:16px">🔗</span>
                  <a href="${item.url || '#'}" target="_blank" style="font-size:13px;color:var(--accent-blue);text-decoration:none;word-break:break-all">${item.content}</a>
                </div>
              ` : `
                <div class="insp-text">${item.content}</div>
              `}
              <div style="display:flex;gap:6px;align-items:center;margin-top:8px">
                <span class="tag ${catColors[item.category] || 'tag-gray'}">${item.category || '未分类'}</span>
                ${item.tags ? item.tags.map(t => `<span style="font-size:10px;color:var(--text-tertiary)">#${t}</span>`).join('') : ''}
                <span style="font-size:10px;color:var(--text-tertiary);margin-left:auto">${item.date}</span>
              </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:4px;flex-shrink:0">
              <button class="btn-icon" style="width:28px;height:28px" onclick="InspirationModule.toggleFavorite('${item.id}')"
                      title="${item.favorite ? '取消收藏' : '收藏'}">
                ${item.favorite ? '⭐' : '☆'}
              </button>
              <button class="btn-icon" style="width:28px;height:28px" onclick="InspirationModule.deleteInspiration('${item.id}')"
                      title="删除">🗑</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },
};
