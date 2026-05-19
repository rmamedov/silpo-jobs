// ============ Silpo Jobs Admin Panel ============
const API = '/admin/api';

const AdminApp = {
  user: null,
  currentPage: 'dashboard',
  data: {},

  // ─── Init ───
  async init() {
    try {
      const res = await fetch(`${API}/me`);
      if (res.ok) {
        this.user = await res.json();
        this.renderApp();
      } else {
        this.renderLogin();
      }
    } catch {
      this.renderLogin();
    }
  },

  // ─── Login ───
  renderLogin() {
    document.getElementById('app').innerHTML = `
      <div class="login-page">
        <div class="login-card">
          <div class="login-logo">
            <img src="/logo-silpo.png" alt="Сільпо" height="40">
            <span class="login-logo-suffix">/ Адмін</span>
          </div>
          <h2>Вхід в панель управління</h2>
          <form onsubmit="AdminApp.login(event)">
            <div class="form-group">
              <label>Логін</label>
              <input type="text" id="loginUser" placeholder="admin" autocomplete="username" required>
            </div>
            <div class="form-group">
              <label>Пароль</label>
              <input type="password" id="loginPass" placeholder="••••••" autocomplete="current-password" required>
            </div>
            <button type="submit" class="btn btn-primary btn-full">Увійти</button>
            <p id="loginError" class="login-error"></p>
          </form>
        </div>
      </div>`;
  },

  async login(e) {
    e.preventDefault();
    const username = document.getElementById('loginUser').value;
    const password = document.getElementById('loginPass').value;
    try {
      const res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        this.user = { username: data.username };
        this.renderApp();
      } else {
        document.getElementById('loginError').textContent = data.error || 'Невірні дані';
      }
    } catch {
      document.getElementById('loginError').textContent = 'Помилка з\'єднання';
    }
  },

  async logout() {
    await fetch(`${API}/logout`, { method: 'POST' });
    this.user = null;
    this.renderLogin();
  },

  // ─── App Shell ───
  renderApp() {
    document.getElementById('app').innerHTML = `
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
          <img src="/logo-silpo.png" alt="Сільпо" height="32">
          <span class="sidebar-title">/ Адмін</span>
        </div>
        <nav class="sidebar-nav">
          <a class="nav-item active" data-page="dashboard" onclick="AdminApp.navigateTo('dashboard')">
            <span class="nav-icon">📊</span> Дашборд
          </a>
          <a class="nav-item" data-page="vacancies" onclick="AdminApp.navigateTo('vacancies')">
            <span class="nav-icon">💼</span> Вакансії
          </a>
          <a class="nav-item" data-page="applications" onclick="AdminApp.navigateTo('applications')">
            <span class="nav-icon">📋</span> Заявки
          </a>
          <a class="nav-item" data-page="stories" onclick="AdminApp.navigateTo('stories')">
            <span class="nav-icon">🎬</span> Історії
          </a>
          <a class="nav-item" data-page="settings" onclick="AdminApp.navigateTo('settings')">
            <span class="nav-icon">⚙️</span> Налаштування
          </a>
        </nav>
        <div class="sidebar-footer">
          <div class="sidebar-user">
            <span class="user-avatar">${(this.user.username || 'A')[0].toUpperCase()}</span>
            <span class="user-name">${this.user.username}</span>
          </div>
          <button class="btn btn-sm btn-ghost" onclick="AdminApp.logout()">Вийти</button>
        </div>
      </aside>
      <main class="main-content" id="mainContent">
        <div class="topbar">
          <button class="hamburger" onclick="document.getElementById('sidebar').classList.toggle('open')">☰</button>
          <h1 id="pageTitle">Дашборд</h1>
        </div>
        <div id="pageContent"></div>
      </main>
      <div class="modal-overlay" id="modalOverlay" onclick="AdminApp.closeModal()"></div>
      <div class="modal" id="modal"></div>`;
    this.navigateTo('dashboard');
  },

  navigateTo(page) {
    this.currentPage = page;
    document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === page));
    document.getElementById('sidebar').classList.remove('open');
    const titles = { dashboard: 'Дашборд', vacancies: 'Вакансії', applications: 'Заявки', stories: 'Історії', settings: 'Налаштування' };
    document.getElementById('pageTitle').textContent = titles[page] || '';
    this['render_' + page]();
  },

  // ─── Toast ───
  toast(msg, type = '') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast show' + (type ? ' ' + type : '');
    clearTimeout(this._toastT);
    this._toastT = setTimeout(() => t.className = 'toast', 3000);
  },

  // ─── Modal ───
  openModal(html) {
    document.getElementById('modal').innerHTML = html;
    document.getElementById('modal').classList.add('open');
    document.getElementById('modalOverlay').classList.add('open');
  },
  closeModal() {
    document.getElementById('modal').classList.remove('open');
    document.getElementById('modalOverlay').classList.remove('open');
  },

  // ─── Helpers ───
  async api(path, opts = {}) {
    const res = await fetch(`${API}${path}`, {
      headers: { 'Content-Type': 'application/json', ...opts.headers },
      ...opts
    });
    if (res.status === 401) { this.renderLogin(); return null; }
    return res.json();
  },

  statusLabel(s) {
    const map = { new: 'Нова', reviewed: 'Переглянуто', contacted: "Зв'язалися", rejected: 'Відхилено', hired: 'Найнято' };
    return `<span class="badge badge-${s}">${map[s] || s}</span>`;
  },

  formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' });
  },

  formatMoney(n) {
    return n ? n.toLocaleString('uk-UA') + ' ₴' : '—';
  },

  // ══════════════════════════════════════════════
  // DASHBOARD
  // ══════════════════════════════════════════════
  async render_dashboard() {
    const el = document.getElementById('pageContent');
    el.innerHTML = '<div class="loading">Завантаження...</div>';
    const data = await this.api('/dashboard');
    if (!data) return;

    el.innerHTML = `
      <div class="stat-cards">
        <div class="stat-card">
          <div class="stat-number">${data.vacancies.active}</div>
          <div class="stat-label">Активних вакансій</div>
          <div class="stat-sub">🔥 ${data.vacancies.hot} гарячих</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${data.applications.total}</div>
          <div class="stat-label">Всього заявок</div>
          <div class="stat-sub">📬 ${data.applications.new} нових</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${data.applications.thisWeek}</div>
          <div class="stat-label">Заявок за тиждень</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${data.vacancies.total}</div>
          <div class="stat-label">Всього вакансій</div>
        </div>
      </div>

      <div class="section-header"><h3>Останні заявки</h3></div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            <th>Ім'я</th><th>Телефон</th><th>Вакансія</th><th>Місто</th><th>Статус</th><th>Дата</th>
          </tr></thead>
          <tbody>
            ${data.recentApplications.map(a => `<tr>
              <td>${a.name}</td>
              <td>${a.phone}</td>
              <td>${a.vacancyTitle || '—'}</td>
              <td>${a.city || '—'}</td>
              <td>${this.statusLabel(a.status)}</td>
              <td>${this.formatDate(a.createdAt)}</td>
            </tr>`).join('')}
            ${data.recentApplications.length === 0 ? '<tr><td colspan="6" class="empty">Заявок поки немає</td></tr>' : ''}
          </tbody>
        </table>
      </div>`;
  },

  // ══════════════════════════════════════════════
  // VACANCIES
  // ══════════════════════════════════════════════
  _vacPage: 1,
  _vacFilters: {},

  async render_vacancies() {
    const el = document.getElementById('pageContent');
    el.innerHTML = '<div class="loading">Завантаження...</div>';

    const params = new URLSearchParams({ page: this._vacPage, limit: 20, ...this._vacFilters });
    const data = await this.api(`/vacancies?${params}`);
    if (!data) return;

    el.innerHTML = `
      <div class="toolbar">
        <div class="toolbar-filters">
          <input type="text" class="input-sm" placeholder="Пошук..." id="vacSearch" value="${this._vacFilters.search || ''}" onkeyup="if(event.key==='Enter'){AdminApp._vacFilters.search=this.value;AdminApp._vacPage=1;AdminApp.render_vacancies()}">
          <select class="input-sm" onchange="AdminApp._vacFilters.city=this.value;AdminApp._vacPage=1;AdminApp.render_vacancies()">
            <option value="">Усі міста</option>
            ${['Київ','Харків','Одеса','Дніпро','Львів'].map(c => `<option ${this._vacFilters.city === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
          <select class="input-sm" onchange="AdminApp._vacFilters.category=this.value;AdminApp._vacPage=1;AdminApp.render_vacancies()">
            <option value="">Усі категорії</option>
            ${['Магазин','Склад','Офіс',"Кур'єр"].map(c => `<option ${this._vacFilters.category === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
          <select class="input-sm" onchange="AdminApp._vacFilters.active=this.value;AdminApp._vacPage=1;AdminApp.render_vacancies()">
            <option value="">Усі</option>
            <option value="true" ${this._vacFilters.active === 'true' ? 'selected' : ''}>Активні</option>
            <option value="false" ${this._vacFilters.active === 'false' ? 'selected' : ''}>Неактивні</option>
          </select>
        </div>
        <button class="btn btn-primary" onclick="AdminApp.openVacancyForm()">+ Нова вакансія</button>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            <th>Назва</th><th>Місто</th><th>Категорія</th><th>Зарплата</th><th>🔥</th><th>Статус</th><th>Дії</th>
          </tr></thead>
          <tbody>
            ${data.vacancies.map(v => `<tr class="${v.active ? '' : 'row-inactive'}">
              <td><strong>${v.title}</strong><br><small>${v.location}</small></td>
              <td>${v.city}</td>
              <td>${v.category}</td>
              <td>${this.formatMoney(v.salary)}</td>
              <td>${v.hot ? '🔥' : ''}</td>
              <td>${v.active ? '<span class="badge badge-active">Активна</span>' : '<span class="badge badge-inactive">Неактивна</span>'}</td>
              <td class="actions">
                <button class="btn btn-xs btn-ghost" onclick="AdminApp.editVacancy('${v._id}')">✏️</button>
                <button class="btn btn-xs btn-ghost" onclick="AdminApp.toggleHot('${v._id}', ${!v.hot})">🔥</button>
                <button class="btn btn-xs btn-ghost" onclick="AdminApp.toggleActive('${v._id}', ${!v.active})">${v.active ? '⏸' : '▶'}</button>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>

      ${data.pages > 1 ? `<div class="pagination">
        <button class="btn btn-sm" ${this._vacPage <= 1 ? 'disabled' : ''} onclick="AdminApp._vacPage--;AdminApp.render_vacancies()">← Назад</button>
        <span>${this._vacPage} / ${data.pages}</span>
        <button class="btn btn-sm" ${this._vacPage >= data.pages ? 'disabled' : ''} onclick="AdminApp._vacPage++;AdminApp.render_vacancies()">Далі →</button>
      </div>` : ''}`;
  },

  async toggleHot(id, hot) {
    await this.api(`/vacancies/${id}`, { method: 'PUT', body: JSON.stringify({ hot }) });
    this.render_vacancies();
  },

  async toggleActive(id, active) {
    await this.api(`/vacancies/${id}`, { method: 'PUT', body: JSON.stringify({ active }) });
    this.render_vacancies();
  },

  openVacancyForm(vacancy = null) {
    const v = vacancy || { title:'', location:'', address:'', category:'Магазин', hot:false, employment:'Повна', experience:'none', salary:'', schedule:'', city:'Київ', tags:[], duties:[''], requirements:[''], offers:[''], active:true };
    const isEdit = !!vacancy;

    this.openModal(`
      <div class="modal-header">
        <h3>${isEdit ? 'Редагувати вакансію' : 'Нова вакансія'}</h3>
        <button class="modal-close" onclick="AdminApp.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <form id="vacancyForm" onsubmit="AdminApp.saveVacancy(event, '${isEdit ? v._id : ''}')">
          <div class="form-row">
            <div class="form-group"><label>Назва *</label><input type="text" id="vTitle" value="${v.title}" required></div>
            <div class="form-group"><label>Місто *</label>
              <select id="vCity">${['Київ','Харків','Одеса','Дніпро','Львів','Запоріжжя','Вінниця','Полтава'].map(c => `<option ${v.city===c?'selected':''}>${c}</option>`).join('')}</select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Локація</label><input type="text" id="vLocation" value="${v.location}"></div>
            <div class="form-group"><label>Адреса</label><input type="text" id="vAddress" value="${v.address}"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Категорія</label>
              <select id="vCategory">${['Магазин','Склад','Офіс',"Кур'єр"].map(c => `<option ${v.category===c?'selected':''}>${c}</option>`).join('')}</select>
            </div>
            <div class="form-group"><label>Зарплата (грн)</label><input type="number" id="vSalary" value="${v.salary || ''}"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Зайнятість</label>
              <select id="vEmployment">${['Повна','Часткова','Гнучка'].map(c => `<option ${v.employment===c?'selected':''}>${c}</option>`).join('')}</select>
            </div>
            <div class="form-group"><label>Досвід</label>
              <select id="vExperience">${[['none','Без досвіду'],['1year','Від 1 року'],['3years','Від 3 років']].map(([val,lab]) => `<option value="${val}" ${v.experience===val?'selected':''}>${lab}</option>`).join('')}</select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Графік</label><input type="text" id="vSchedule" value="${v.schedule}"></div>
            <div class="form-group"><label>Теги (через кому)</label><input type="text" id="vTags" value="${(v.tags||[]).join(', ')}"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="toggle-label"><input type="checkbox" id="vHot" ${v.hot?'checked':''}> 🔥 Гаряча вакансія</label></div>
            <div class="form-group"><label class="toggle-label"><input type="checkbox" id="vActive" ${v.active!==false?'checked':''}> Активна</label></div>
          </div>

          <div class="form-group"><label>Обов'язки</label>
            <textarea id="vDuties" rows="3" placeholder="Кожен пункт з нового рядка">${(v.duties||[]).join('\n')}</textarea>
          </div>
          <div class="form-group"><label>Вимоги</label>
            <textarea id="vRequirements" rows="3" placeholder="Кожен пункт з нового рядка">${(v.requirements||[]).join('\n')}</textarea>
          </div>
          <div class="form-group"><label>Пропонуємо</label>
            <textarea id="vOffers" rows="3" placeholder="Кожен пункт з нового рядка">${(v.offers||[]).join('\n')}</textarea>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-ghost" onclick="AdminApp.closeModal()">Скасувати</button>
            <button type="submit" class="btn btn-primary">${isEdit ? 'Зберегти' : 'Створити'}</button>
          </div>
        </form>
      </div>`);
  },

  async editVacancy(id) {
    const data = await fetch(`/api/vacancies/${id}`).then(r => r.json()).catch(() => null);
    if (data) this.openVacancyForm(data);
  },

  async saveVacancy(e, id) {
    e.preventDefault();
    const body = {
      title: document.getElementById('vTitle').value,
      city: document.getElementById('vCity').value,
      location: document.getElementById('vLocation').value,
      address: document.getElementById('vAddress').value,
      category: document.getElementById('vCategory').value,
      salary: Number(document.getElementById('vSalary').value) || 0,
      employment: document.getElementById('vEmployment').value,
      experience: document.getElementById('vExperience').value,
      schedule: document.getElementById('vSchedule').value,
      tags: document.getElementById('vTags').value.split(',').map(t => t.trim()).filter(Boolean),
      hot: document.getElementById('vHot').checked,
      active: document.getElementById('vActive').checked,
      duties: document.getElementById('vDuties').value.split('\n').filter(Boolean),
      requirements: document.getElementById('vRequirements').value.split('\n').filter(Boolean),
      offers: document.getElementById('vOffers').value.split('\n').filter(Boolean)
    };

    if (id) {
      await this.api(`/vacancies/${id}`, { method: 'PUT', body: JSON.stringify(body) });
      this.toast('Вакансію оновлено', 'success');
    } else {
      await this.api('/vacancies', { method: 'POST', body: JSON.stringify(body) });
      this.toast('Вакансію створено', 'success');
    }
    this.closeModal();
    this.render_vacancies();
  },

  // ══════════════════════════════════════════════
  // APPLICATIONS
  // ══════════════════════════════════════════════
  _appPage: 1,
  _appFilters: {},

  async render_applications() {
    const el = document.getElementById('pageContent');
    el.innerHTML = '<div class="loading">Завантаження...</div>';

    const params = new URLSearchParams({ page: this._appPage, limit: 20, ...this._appFilters });
    const data = await this.api(`/applications?${params}`);
    if (!data) return;

    el.innerHTML = `
      <div class="toolbar">
        <div class="toolbar-filters">
          <input type="text" class="input-sm" placeholder="Пошук..." id="appSearch" value="${this._appFilters.search || ''}" onkeyup="if(event.key==='Enter'){AdminApp._appFilters.search=this.value;AdminApp._appPage=1;AdminApp.render_applications()}">
          <select class="input-sm" onchange="AdminApp._appFilters.status=this.value;AdminApp._appPage=1;AdminApp.render_applications()">
            <option value="">Усі статуси</option>
            ${['new','reviewed','contacted','rejected','hired'].map(s => {
              const labels = {new:'Нова',reviewed:'Переглянуто',contacted:"Зв'язалися",rejected:'Відхилено',hired:'Найнято'};
              return `<option value="${s}" ${this._appFilters.status===s?'selected':''}>${labels[s]}</option>`;
            }).join('')}
          </select>
          <select class="input-sm" onchange="AdminApp._appFilters.city=this.value;AdminApp._appPage=1;AdminApp.render_applications()">
            <option value="">Усі міста</option>
            ${['Київ','Харків','Одеса','Дніпро','Львів'].map(c => `<option ${this._appFilters.city===c?'selected':''}>${c}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            <th>Ім'я</th><th>Телефон</th><th>Вакансія</th><th>Місто</th><th>Статус</th><th>Резюме</th><th>Дата</th><th>Дії</th>
          </tr></thead>
          <tbody>
            ${data.applications.map(a => `<tr>
              <td><strong>${a.name}</strong></td>
              <td>${a.phone}</td>
              <td>${a.vacancyTitle || '—'}</td>
              <td>${a.city || '—'}</td>
              <td>${this.statusLabel(a.status)}</td>
              <td>${a.resumePath ? `<a href="${API}/applications/${a._id}/resume" class="btn btn-xs">📎</a>` : '—'}</td>
              <td>${this.formatDate(a.createdAt)}</td>
              <td class="actions">
                <button class="btn btn-xs btn-ghost" onclick="AdminApp.openAppDetail('${a._id}')">👁</button>
              </td>
            </tr>`).join('')}
            ${data.applications.length === 0 ? '<tr><td colspan="8" class="empty">Заявок немає</td></tr>' : ''}
          </tbody>
        </table>
      </div>

      ${data.pages > 1 ? `<div class="pagination">
        <button class="btn btn-sm" ${this._appPage <= 1 ? 'disabled' : ''} onclick="AdminApp._appPage--;AdminApp.render_applications()">← Назад</button>
        <span>${this._appPage} / ${data.pages}</span>
        <button class="btn btn-sm" ${this._appPage >= data.pages ? 'disabled' : ''} onclick="AdminApp._appPage++;AdminApp.render_applications()">Далі →</button>
      </div>` : ''}`;
  },

  async openAppDetail(id) {
    const apps = await this.api('/applications?limit=200');
    const a = apps ? apps.applications.find(x => x._id === id) : null;
    if (!a) return;

    this.openModal(`
      <div class="modal-header">
        <h3>Заявка — ${a.name}</h3>
        <button class="modal-close" onclick="AdminApp.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="detail-grid">
          <div><strong>Ім'я:</strong> ${a.name}</div>
          <div><strong>Телефон:</strong> ${a.phone}</div>
          <div><strong>Місто:</strong> ${a.city || '—'}</div>
          <div><strong>Вакансія:</strong> ${a.vacancyTitle || '—'}</div>
          <div><strong>Бажана посада:</strong> ${a.position || '—'}</div>
          <div><strong>Поточне місце роботи:</strong> ${a.workplace || '—'}</div>
          <div><strong>Коментар:</strong> ${a.comment || '—'}</div>
          <div><strong>Дата:</strong> ${this.formatDate(a.createdAt)}</div>
          ${a.resumePath ? `<div><a href="${API}/applications/${a._id}/resume" class="btn btn-sm btn-primary">📎 Завантажити резюме</a></div>` : ''}
        </div>

        <hr>
        <div class="form-group"><label>Статус</label>
          <select id="appStatus">
            ${['new','reviewed','contacted','rejected','hired'].map(s => {
              const labels = {new:'Нова',reviewed:'Переглянуто',contacted:"Зв'язалися",rejected:'Відхилено',hired:'Найнято'};
              return `<option value="${s}" ${a.status===s?'selected':''}>${labels[s]}</option>`;
            }).join('')}
          </select>
        </div>
        <div class="form-group"><label>Нотатки HR</label>
          <textarea id="appNotes" rows="3">${a.notes || ''}</textarea>
        </div>
        <div class="form-actions">
          <button class="btn btn-ghost" onclick="AdminApp.closeModal()">Закрити</button>
          <button class="btn btn-primary" onclick="AdminApp.updateApp('${a._id}')">Зберегти</button>
        </div>
      </div>`);
  },

  async updateApp(id) {
    const status = document.getElementById('appStatus').value;
    const notes = document.getElementById('appNotes').value;
    await this.api(`/applications/${id}`, { method: 'PUT', body: JSON.stringify({ status, notes }) });
    this.toast('Заявку оновлено', 'success');
    this.closeModal();
    this.render_applications();
  },

  // ══════════════════════════════════════════════
  // STORIES
  // ══════════════════════════════════════════════
  async render_stories() {
    const el = document.getElementById('pageContent');
    el.innerHTML = '<div class="loading">Завантаження...</div>';

    const stories = await this.api('/stories');
    if (!stories) return;

    el.innerHTML = `
      <div class="toolbar">
        <div></div>
        <button class="btn btn-primary" onclick="AdminApp.openStoryForm()">+ Нова історія</button>
      </div>
      <div class="stories-grid">
        ${stories.map((s, i) => `
          <div class="story-card ${s.active ? '' : 'card-inactive'}">
            <div class="story-preview">
              <video src="/${s.src}" muted></video>
              <div class="story-overlay">
                <span class="story-order">#${s.order + 1}</span>
                ${s.active ? '' : '<span class="badge badge-inactive">Неактивна</span>'}
              </div>
            </div>
            <div class="story-info">
              <strong>${s.name}</strong>
              <small>${s.role}</small>
              <p>${s.title}</p>
            </div>
            <div class="story-actions">
              <button class="btn btn-xs btn-ghost" onclick="AdminApp.editStory('${s._id}')">✏️</button>
              <button class="btn btn-xs btn-ghost" onclick="AdminApp.moveStory('${s._id}', ${s.order - 1})">⬆</button>
              <button class="btn btn-xs btn-ghost" onclick="AdminApp.moveStory('${s._id}', ${s.order + 1})">⬇</button>
              <button class="btn btn-xs btn-danger" onclick="AdminApp.deleteStory('${s._id}')">🗑</button>
            </div>
          </div>
        `).join('')}
      </div>`;

    // Hover to play videos
    document.querySelectorAll('.story-preview video').forEach(v => {
      const parent = v.closest('.story-preview');
      parent.addEventListener('mouseenter', () => { v.currentTime = 0; v.play().catch(() => {}); });
      parent.addEventListener('mouseleave', () => v.pause());
    });
  },

  openStoryForm(story = null) {
    const s = story || { src: '', name: '', role: '', ava: '', title: '', order: 0, active: true };
    const isEdit = !!story;

    this.openModal(`
      <div class="modal-header">
        <h3>${isEdit ? 'Редагувати історію' : 'Нова історія'}</h3>
        <button class="modal-close" onclick="AdminApp.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <form onsubmit="AdminApp.saveStory(event, '${isEdit ? s._id : ''}')">
          <div class="form-group"><label>Відео (шлях) *</label><input type="text" id="sSource" value="${s.src}" required placeholder="videos/story-1.mp4"></div>
          <div class="form-row">
            <div class="form-group"><label>Ім'я *</label><input type="text" id="sName" value="${s.name}" required></div>
            <div class="form-group"><label>Роль *</label><input type="text" id="sRole" value="${s.role}" required></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Аватар (літера)</label><input type="text" id="sAva" value="${s.ava}" maxlength="2"></div>
            <div class="form-group"><label>Порядок</label><input type="number" id="sOrder" value="${s.order}"></div>
          </div>
          <div class="form-group"><label>Заголовок *</label><input type="text" id="sTitle" value="${s.title}" required></div>
          <div class="form-group"><label class="toggle-label"><input type="checkbox" id="sActive" ${s.active!==false?'checked':''}> Активна</label></div>
          <div class="form-actions">
            <button type="button" class="btn btn-ghost" onclick="AdminApp.closeModal()">Скасувати</button>
            <button type="submit" class="btn btn-primary">${isEdit ? 'Зберегти' : 'Створити'}</button>
          </div>
        </form>
      </div>`);
  },

  async editStory(id) {
    const stories = await this.api('/stories');
    const s = stories ? stories.find(x => x._id === id) : null;
    if (s) this.openStoryForm(s);
  },

  async saveStory(e, id) {
    e.preventDefault();
    const body = {
      src: document.getElementById('sSource').value,
      name: document.getElementById('sName').value,
      role: document.getElementById('sRole').value,
      ava: document.getElementById('sAva').value,
      title: document.getElementById('sTitle').value,
      order: Number(document.getElementById('sOrder').value) || 0,
      active: document.getElementById('sActive').checked
    };

    if (id) {
      await this.api(`/stories/${id}`, { method: 'PUT', body: JSON.stringify(body) });
      this.toast('Історію оновлено', 'success');
    } else {
      await this.api('/stories', { method: 'POST', body: JSON.stringify(body) });
      this.toast('Історію створено', 'success');
    }
    this.closeModal();
    this.render_stories();
  },

  async moveStory(id, newOrder) {
    await this.api(`/stories/${id}`, { method: 'PUT', body: JSON.stringify({ order: newOrder }) });
    this.render_stories();
  },

  async deleteStory(id) {
    if (!confirm('Видалити цю історію?')) return;
    await this.api(`/stories/${id}`, { method: 'DELETE' });
    this.toast('Історію видалено');
    this.render_stories();
  },

  // ══════════════════════════════════════════════
  // SETTINGS
  // ══════════════════════════════════════════════
  async render_settings() {
    const el = document.getElementById('pageContent');
    el.innerHTML = '<div class="loading">Завантаження...</div>';

    const s = await this.api('/settings');
    if (!s) return;

    el.innerHTML = `
      <form onsubmit="AdminApp.saveSettings(event)">
        <div class="settings-section">
          <h3>Hero секція</h3>
          <div class="form-group"><label>Заголовок</label><input type="text" id="setHeroTitle" value="${s.heroTitle || ''}"></div>
          <div class="form-group"><label>Підзаголовок</label><input type="text" id="setHeroSubtitle" value="${s.heroSubtitle || ''}"></div>
        </div>

        <div class="settings-section">
          <h3>Міста</h3>
          <div class="form-group"><label>Основні міста (через кому)</label>
            <input type="text" id="setPrimaryCities" value="${(s.primaryCities||[]).join(', ')}">
          </div>
          <div class="form-group"><label>Усі міста (через кому)</label>
            <textarea id="setAllCities" rows="3">${(s.allCities||[]).join(', ')}</textarea>
          </div>
        </div>

        <div class="settings-section">
          <h3>Категорії</h3>
          <div class="form-group"><label>Категорії вакансій (через кому)</label>
            <input type="text" id="setCategories" value="${(s.categories||[]).join(', ')}">
          </div>
        </div>

        <div class="settings-section">
          <h3>Контакти</h3>
          <div class="form-row">
            <div class="form-group"><label>Email</label><input type="email" id="setEmail" value="${s.contactEmail || ''}"></div>
            <div class="form-group"><label>Телефон</label><input type="text" id="setPhone" value="${s.contactPhone || ''}"></div>
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary">Зберегти налаштування</button>
        </div>
      </form>`;
  },

  async saveSettings(e) {
    e.preventDefault();
    const body = {
      heroTitle: document.getElementById('setHeroTitle').value,
      heroSubtitle: document.getElementById('setHeroSubtitle').value,
      primaryCities: document.getElementById('setPrimaryCities').value.split(',').map(s => s.trim()).filter(Boolean),
      allCities: document.getElementById('setAllCities').value.split(',').map(s => s.trim()).filter(Boolean),
      categories: document.getElementById('setCategories').value.split(',').map(s => s.trim()).filter(Boolean),
      contactEmail: document.getElementById('setEmail').value,
      contactPhone: document.getElementById('setPhone').value
    };
    await this.api('/settings', { method: 'PUT', body: JSON.stringify(body) });
    this.toast('Налаштування збережено', 'success');
  }
};

// INIT
AdminApp.init();
