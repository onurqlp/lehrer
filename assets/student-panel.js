'use strict';

(() => {
  const byId = id => document.getElementById(id);
  const query = new URLSearchParams(window.location.search);
  const scenario = query.get('scenario') || 'homework';
  const credentials = { username: 'demo.a1', password: 'AydaDemo26!' };
  const sessionKey = 'aydaStudentDemoSession';
  const tz = 'Europe/Istanbul';

  // These fixtures are synthetic and remain in this browser. They never call the staff API.
  const student = {
    name: 'Deniz Yılmaz', level: 'A1', group: 'A1 Demo Grubu', active: scenario !== 'inactive',
    schedule: [{ day: 1, start: '20:00', end: '21:30' }, { day: 3, start: '20:00', end: '21:30' }, { day: 5, start: '20:00', end: '21:30' }],
    lastCompletedUnit: 2, totalUnits: 24, whatsappUrl: ''
  };
  const homework = {
    current: scenario === 'no-homework' || scenario === 'not-shared' ? [] : [{
      title: 'Menschen A1 · Ünite 3, sayfa 42–43', lessonDate: '2026-10-23', dueDate: '2026-10-29', state: 'open'
    }],
    history: [{ title: 'Menschen A1 · Ünite 2 tekrar çalışması', lessonDate: '2026-10-16', dueDate: '2026-10-22', state: 'completed' }]
  };

  function dateParts(date = new Date()) {
    const values = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
    return Object.fromEntries(values.filter(part => part.type !== 'literal').map(part => [part.type, Number(part.value)]));
  }

  function timeParts(date = new Date()) {
    const values = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date);
    return Object.fromEntries(values.filter(part => part.type !== 'literal').map(part => [part.type, Number(part.value)]));
  }

  function makeIstanbulDate(year, month, day, hour = 0, minute = 0) {
    // Europe/Istanbul is UTC+03:00; use UTC arithmetic so the browser's own timezone is irrelevant.
    return new Date(Date.UTC(year, month - 1, day, hour - 3, minute));
  }

  function nextLesson(now = new Date()) {
    const today = dateParts(now);
    const currentTime = timeParts(now);
    const todayUtc = new Date(Date.UTC(today.year, today.month - 1, today.day));
    for (let offset = 0; offset < 8; offset += 1) {
      const candidate = new Date(todayUtc);
      candidate.setUTCDate(candidate.getUTCDate() + offset);
      const session = student.schedule.find(item => item.day === candidate.getUTCDay());
      if (!session) continue;
      const [hour, minute] = session.start.split(':').map(Number);
      if (offset === 0 && (currentTime.hour > hour || (currentTime.hour === hour && currentTime.minute >= minute))) continue;
      return { date: makeIstanbulDate(candidate.getUTCFullYear(), candidate.getUTCMonth() + 1, candidate.getUTCDate()), ...session };
    }
    return null;
  }

  function formatDate(date, options) {
    return new Intl.DateTimeFormat('tr-TR', { timeZone: tz, ...options }).format(date);
  }

  function formatHomeworkDate(iso) {
    const [year, month, day] = iso.split('-').map(Number);
    return formatDate(makeIstanbulDate(year, month, day), { day: 'numeric', month: 'long' });
  }

  function setText(id, value) {
    const element = byId(id);
    if (element) element.textContent = value;
  }

  function showLogin(message = '') {
    byId('loginPanel').hidden = false;
    byId('studentDashboard').hidden = true;
    byId('logoutButton').hidden = true;
    setText('loginMessage', message);
  }

  function renderHomework(view = 'current') {
    const container = byId('homeworkList');
    const items = homework[view];
    container.replaceChildren();
    if (!items.length) {
      const empty = document.createElement('p');
      empty.className = 'student-homework-status';
      empty.textContent = scenario === 'no-homework' && view === 'current'
        ? 'Bu derste ödev verilmedi.'
        : 'Henüz ödev paylaşılmadı.';
      container.append(empty);
      return;
    }
    items.forEach(item => {
      const card = document.createElement('article');
      card.className = 'student-homework-item';
      const title = document.createElement('strong');
      title.textContent = item.title;
      const meta = document.createElement('div');
      meta.className = 'student-homework-meta';
      const lesson = document.createElement('span');
      lesson.textContent = `Ders tarihi: ${formatHomeworkDate(item.lessonDate)}`;
      const status = document.createElement('span');
      status.textContent = item.state === 'completed' ? 'Tamamlandı' : 'Açık';
      meta.append(lesson, status);
      card.append(title, meta);
      if (item.dueDate) {
        const due = document.createElement('span');
        due.className = 'student-homework-deadline';
        due.textContent = `Teslim: ${formatHomeworkDate(item.dueDate)}`;
        card.append(due);
      }
      container.append(card);
    });
  }

  function renderDashboard() {
    setText('studentName', student.name);
    setText('studentLevel', student.level);
    setText('studentGroup', student.group);
    const session = nextLesson();
    if (session) {
      setText('lessonDate', formatDate(session.date, { weekday: 'long', day: 'numeric', month: 'long' }));
      setText('lessonTime', `${session.start}–${session.end}`);
    } else {
      setText('lessonDate', 'Sonraki ders programı bulunamadı');
      setText('lessonTime', '');
    }
    setText('lessonTopic', 'Konu öğretmen tarafından henüz belirtilmedi.');
    setText('lessonUnit', `Tahmini sıradaki ünite: ${Math.min(student.lastCompletedUnit + 1, student.totalUnits)} · Programdan tahmin edilmiştir`);
    renderHomework('current');
    document.querySelectorAll('[data-homework-view]').forEach(button => {
      button.addEventListener('click', () => {
        document.querySelectorAll('[data-homework-view]').forEach(tab => {
          const selected = tab === button;
          tab.classList.toggle('is-active', selected);
          tab.setAttribute('aria-selected', String(selected));
        });
        renderHomework(button.dataset.homeworkView);
      });
    });
    const whatsapp = byId('classWhatsapp');
    if (student.whatsappUrl) {
      whatsapp.href = student.whatsappUrl;
      whatsapp.hidden = false;
    } else {
      whatsapp.hidden = true;
      whatsapp.removeAttribute('href');
    }
    const updated = document.querySelector('.student-updated');
    updated.textContent = `Örnek veriler · Son görüntüleme ${formatDate(new Date(), { hour: '2-digit', minute: '2-digit' })} (Türkiye saati)`;
  }

  function saveSession() {
    try { localStorage.setItem(sessionKey, JSON.stringify({ demo: true, expires: Date.now() + 8 * 60 * 60 * 1000 })); } catch (_) {}
  }

  function hasSession() {
    try {
      const saved = JSON.parse(localStorage.getItem(sessionKey) || 'null');
      if (saved && saved.demo === true && saved.expires > Date.now() && student.active) return true;
      localStorage.removeItem(sessionKey);
    } catch (_) { try { localStorage.removeItem(sessionKey); } catch (_) {} }
    return false;
  }

  function enterDashboard() {
    renderDashboard();
    byId('loginPanel').hidden = true;
    byId('studentDashboard').hidden = false;
    byId('logoutButton').hidden = false;
  }

  byId('studentLoginForm').addEventListener('submit', event => {
    event.preventDefault();
    const username = byId('studentUsername').value.trim();
    const password = byId('studentPassword').value;
    if (username !== credentials.username || password !== credentials.password) {
      showLogin('Kullanıcı adı veya şifre hatalı. Demo giriş bilgilerini kontrol edin.');
      return;
    }
    if (!student.active) {
      showLogin('Bu demo öğrenci hesabı pasif. Giriş yapılamaz.');
      return;
    }
    saveSession();
    enterDashboard();
  });

  byId('logoutButton').addEventListener('click', () => {
    try { localStorage.removeItem(sessionKey); } catch (_) {}
    byId('studentUsername').value = '';
    byId('studentPassword').value = '';
    showLogin('Çıkış yapıldı.');
  });

  if (hasSession()) enterDashboard();
})();
