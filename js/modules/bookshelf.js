/**
 * Module 4: 我的书架 (Bookshelf)
 * Reading tracker + notes & quotes
 */
const BookshelfModule = {
  currentTab: 'reading',
  noteSearchTerm: '',

  init() {
    this.refresh();
  },

  refresh() {
    this.renderBooks();
    this.renderNotes();
  },

  renderBooks() {
    const books = Storage.getBooks();
    const readingList = books.reading || [];
    const wantList = books.wantToRead || [];

    const container = document.getElementById('bookshelfList');
    const list = this.currentTab === 'reading' ? readingList : wantList;

    if (list.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:30px;color:var(--text-tertiary)">
          <div style="font-size:40px;margin-bottom:10px">📚</div>
          <div>${this.currentTab === 'reading' ? '暂无在读书籍' : '想读清单为空'}</div>
          <div style="font-size:12px;margin-top:4px">点击"添加书籍"开始记录</div>
        </div>`;
      return;
    }

    container.innerHTML = list.map((book, idx) => {
      const progress = book.totalPages > 0 ? Math.round(((book.currentPage || 0) / book.totalPages) * 100) : 0;
      const circumference = 2 * Math.PI * 28;

      return `
        <div class="book-card mb-sm">
          <div style="display:flex;align-items:center;gap:12px;flex-shrink:0">
            <div class="ring-chart" style="width:68px;height:68px">
              <svg viewBox="0 0 68 68">
                <circle cx="34" cy="34" r="28" fill="none" stroke="rgba(0,0,0,0.06)" stroke-width="5"/>
                <circle cx="34" cy="34" r="28" fill="none" stroke="var(--accent-purple)" stroke-width="5"
                  stroke-dasharray="${circumference}" stroke-dashoffset="${circumference - (progress/100) * circumference}"
                  stroke-linecap="round"/>
              </svg>
              <div class="ring-chart-center">
                <div class="ring-chart-value" style="font-size:16px">${progress}%</div>
              </div>
            </div>
          </div>
          <div style="flex:1">
            <div style="font-weight:600;font-size:15px">${book.title}</div>
            <div style="font-size:12px;color:var(--text-tertiary);margin-top:2px">${book.author || '未知作者'}</div>
            <div style="margin-top:8px;display:flex;gap:8px;align-items:center">
              <span style="font-size:12px;color:var(--text-secondary)">
                进度：${book.currentPage || 0}/${book.totalPages || '?'} 页
              </span>
              ${this.currentTab === 'reading' ? `
                <input type="number" value="${book.currentPage || 0}" min="0" max="${book.totalPages || 9999}"
                  style="width:60px;padding:3px 6px;border-radius:6px;border:1px solid var(--glass-border);font-size:12px;text-align:center"
                  onchange="BookshelfModule.updateProgress(${idx}, this.value)" placeholder="页数"/>
              ` : ''}
            </div>
            <div style="margin-top:8px;display:flex;gap:6px">
              ${this.currentTab === 'wantToRead' ? `
                <button class="btn btn-xs btn-primary" onclick="BookshelfModule.moveToReading(${idx})">开始阅读</button>
              ` : ''}
              <button class="btn btn-xs btn-ghost" onclick="BookshelfModule.removeBook('${this.currentTab}', ${idx})">移除</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  addBook() {
    const title = document.getElementById('bookTitle').value.trim();
    const author = document.getElementById('bookAuthor').value.trim();
    const totalPages = parseInt(document.getElementById('bookPages').value) || 0;
    const list = document.getElementById('bookList').value;

    if (!title) { App.toast('请输入书名'); return; }

    const books = Storage.getBooks();
    const book = { title, author, totalPages, currentPage: 0, addedAt: new Date().toISOString() };

    if (list === 'reading') {
      books.reading.push(book);
    } else {
      books.wantToRead.push(book);
    }

    Storage.saveBooks(books);
    document.getElementById('bookTitle').value = '';
    document.getElementById('bookAuthor').value = '';
    document.getElementById('bookPages').value = '';
    this.refresh();
    App.toast(`📚 《${title}》已添加`);
  },

  updateProgress(idx, val) {
    const books = Storage.getBooks();
    const page = Math.max(0, parseInt(val) || 0);
    if (books.reading[idx]) {
      books.reading[idx].currentPage = Math.min(page, books.reading[idx].totalPages || Infinity);
      Storage.saveBooks(books);
      this.refresh();
    }
  },

  moveToReading(idx) {
    const books = Storage.getBooks();
    const book = books.wantToRead.splice(idx, 1)[0];
    book.currentPage = 0;
    books.reading.push(book);
    Storage.saveBooks(books);
    this.refresh();
    App.toast('📖 已移至在读书架');
  },

  removeBook(listType, idx) {
    const books = Storage.getBooks();
    const removed = books[listType].splice(idx, 1)[0];
    Storage.saveBooks(books);
    this.refresh();
    App.toast(`已移除《${removed.title}》`);
  },

  switchTab(tab) {
    this.currentTab = tab === 'want' ? 'wantToRead' : 'reading';
    document.querySelectorAll('#bookshelfTabs .btn').forEach(b => b.classList.remove('btn-primary'));
    const sel = document.querySelector(`#bookshelfTabs [data-tab="${tab}"]`);
    if (sel) sel.classList.add('btn-primary');
    this.renderBooks();
  },

  // --- Reading Notes ---
  saveNote() {
    const bookTitle = document.getElementById('noteBookTitle').value.trim();
    const quoteType = document.getElementById('noteType').value;
    const content = document.getElementById('noteContent').value.trim();

    if (!content) { App.toast('请输入摘抄或感悟内容'); return; }

    Storage.saveReadingNote({
      bookTitle: bookTitle || '未指定书籍',
      type: quoteType,
      content,
    });

    document.getElementById('noteBookTitle').value = '';
    document.getElementById('noteContent').value = '';
    this.renderNotes();
    App.toast('📝 摘抄/感悟已保存');
  },

  renderNotes() {
    const notes = Storage.getReadingNotes();
    const container = document.getElementById('readingNotesList');
    const searchInput = document.getElementById('noteSearch');
    let filtered = notes;

    if (this.noteSearchTerm) {
      const term = this.noteSearchTerm.toLowerCase();
      filtered = notes.filter(n =>
        n.content.toLowerCase().includes(term) ||
        n.bookTitle.toLowerCase().includes(term)
      );
    }

    if (filtered.length === 0) {
      container.innerHTML = `<div style="text-align:center;padding:20px;color:var(--text-tertiary);font-size:13px">暂无摘抄记录</div>`;
      return;
    }

    container.innerHTML = filtered.map(n => `
      <div style="padding:12px 16px;border-radius:10px;background:var(--glass-bg-light);margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <span class="tag ${n.type === 'quote' ? 'tag-purple' : 'tag-green'}">${n.type === 'quote' ? '📖 摘抄' : '💭 感悟'}</span>
          <span style="font-size:11px;color:var(--text-tertiary)">${n.date}</span>
        </div>
        <div style="font-size:13px;color:var(--text-primary);line-height:1.6">${n.content}</div>
        <div style="font-size:11px;color:var(--text-tertiary);margin-top:4px">— 《${n.bookTitle}》</div>
      </div>
    `).join('');
  },

  searchNotes() {
    this.noteSearchTerm = document.getElementById('noteSearch').value.trim();
    this.renderNotes();
  },
};
