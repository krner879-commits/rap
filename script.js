const schedule = {
  'Понедельник': ['Алгебра', 'Русский язык', 'История', 'Физика', 'Английский язык', 'Химия'],
  'Вторник': ['Геометрия', 'Английский язык', 'Химия', 'Литература', 'Биология', 'Информатика'],
  'Среда': ['Алгебра', 'Русский язык', 'География', 'Физика', 'Английский язык', 'ОБЗР'],
  'Четверг': ['История', 'Геометрия', 'Алгебра', 'Обществознание', 'Труд (технология)', 'Биология'],
  'Пятница': ['Русский язык', 'Литература', 'География', 'Информатика', 'Музыка / ИЗО', 'Химия']
};

const shortDays = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ'];
const days = Object.keys(schedule);
const dayTabs = document.querySelector('#dayTabs');
const lessonList = document.querySelector('#lessonList');
const selectedDayTitle = document.querySelector('#selectedDayTitle');
const selectedDayLabel = document.querySelector('#selectedDayLabel');
const progressBar = document.querySelector('#progressBar');
const progressLabel = document.querySelector('#progressLabel');
const focusTitle = document.querySelector('#focusTitle');
const focusText = document.querySelector('#focusText');
const focusLessonCount = document.querySelector('#focusLessonCount');
const swipeHint = document.querySelector('#swipeHint');
const homeworkCount = document.querySelector('#homeworkCount');
const tipText = document.querySelector('#tipText');
const quoteText = document.querySelector('#quoteText');
const soundToggle = document.querySelector('#soundToggle');
const musicToggle = document.querySelector('#musicToggle');
const emojiPicker = document.querySelector('#emojiPicker');
const confettiCanvas = document.querySelector('#confettiCanvas');
const ctx = confettiCanvas ? confettiCanvas.getContext('2d') : null;

let selectedDay = 'Среда';
let touchStartX = 0;
let touchEndX = 0;
let soundEnabled = true;
let musicEnabled = false;
let audioContext = null;
let musicNodes = null;
let currentLessonForEmoji = null;
let longPressTimer = null;
let confettiParticles = [];
let confettiAnimationId = null;

const focusNotes = {
  'Понедельник': ['Понедельник — разгон', 'Начни неделю спокойно: сначала алгебра, потом всё остальное.'],
  'Вторник': ['Вторник — ритм', 'Хороший день, чтобы поймать темп и закрыть пару сложных задач.'],
  'Среда': ['Среда — день точных наук', 'Собери силы на физику и не забудь про английский.'],
  'Четверг': ['Четверг — держим курс', 'Финиш недели уже близко. Ещё немного внимательности.'],
  'Пятница': ['Пятница — финишная прямая', 'Музыка, химия — и можно выдыхать. Ты справился!']
};

const quotes = [
  'Знания — это не то, что ты запомнил. Это то, что умеешь применить.',
  'Успех — это не конец, неудача — не приговор. Продолжай идти.',
  'Сегодня — лучший день, чтобы начать что-то новое.',
  'Математика — это не страшно. Она просто логика в действии.',
  'Каждый день — новая возможность стать лучше.'
];

const tips = [
  'Собери рюкзак с вечера — спасибо скажешь утром.',
  'Не забудь выпить воды перед уроком!',
  'Сделай 5 минут растяжки между парами.',
  'Проверь, всё ли положил в рюкзак.',
  'Включи уведомления на следующий урок.',
  'Слушай внимательно — зададут интересный вопрос.',
  'Перед контрольной хорошо выспись.',
  'Не откладывай сложное на последний момент.'
];

function getToday() {
  const now = new Date();
  const dayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
  const today = dayNames[now.getDay()];
  return { today, now };
}

function getStorage(key, def) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : def;
  } catch {
    return def;
  }
}

function setStorage(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    // ignore
  }
}

function initProgress() {
  let saved = null;
  try {
    saved = getStorage('progress', null);
  } catch {
    saved = null;
  }
  
  const defaults = { lessonsDone: {}, reactions: {} };
  if (!saved || typeof saved !== 'object' || saved === null) return defaults;
  if (typeof saved.lessonsDone !== 'object' || saved.lessonsDone === null) saved.lessonsDone = {};
  if (typeof saved.reactions !== 'object' || saved.reactions === null) saved.reactions = {};
  return saved;
}

function saveProgress() {
  try {
    const data = window.progress || { lessonsDone: {}, reactions: {} };
    if (!data.lessonsDone) data.lessonsDone = {};
    if (!data.reactions) data.reactions = {};
    setStorage('progress', data);
  } catch {
    // ignore
  }
}

function initAudio() {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      audioContext = null;
    }
  }
}

function playClickSound() {
  if (!soundEnabled || !audioContext) return;
  try {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch {
    // ignore
  }
}

function playCompleteSound() {
  if (!soundEnabled || !audioContext) return;
  try {
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = freq;
      oscillator.type = 'sine';
      const startTime = audioContext.currentTime + i * 0.1;
      gainNode.gain.setValueAtTime(0.1, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.2);
    });
  } catch {
    // ignore
  }
}

function startMusic() {
  if (musicEnabled || !audioContext) return;
  musicEnabled = true;
  if (musicToggle) musicToggle.classList.add('playing');
  try {
    localStorage.setItem('music', 'on');
  } catch {
    // ignore
  }

  try {
    const masterGain = audioContext.createGain();
    masterGain.gain.value = 0.03;
    masterGain.connect(audioContext.destination);

    const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88];
    let noteIndex = 0;

    function playNote() {
      if (!musicEnabled) return;
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.connect(gain);
      gain.connect(masterGain);
      osc.frequency.value = notes[noteIndex % notes.length];
      osc.type = 'sine';
      const now = audioContext.currentTime;
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
      osc.start(now);
      osc.stop(now + 0.8);
      noteIndex++;
      musicNodes = setTimeout(playNote, 600);
    }
    playNote();
  } catch {
    stopMusic();
  }
}

function stopMusic() {
  musicEnabled = false;
  if (musicToggle) musicToggle.classList.remove('playing');
  try {
    localStorage.setItem('music', 'off');
  } catch {
    // ignore
  }
  if (musicNodes) {
    clearTimeout(musicNodes);
    musicNodes = null;
  }
}

function initDate() {
  const { today, now } = getToday();
  const isWeekday = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница'].includes(today);
  const dateEl = document.querySelector('#todayDate');
  const updateEl = document.querySelector('#updateTime');
  if (dateEl) {
    dateEl.textContent = isWeekday
      ? today + ', ' + now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
      : 'Уикенд!';
  }
  if (updateEl) {
    updateEl.textContent = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }
}

function initTheme() {
  try {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.body.classList.add('dark');
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', '#20231f');
    }
  } catch {
    // ignore
  }
}

function renderTabs() {
  if (!dayTabs) return;
  const { today } = getToday();
  
  dayTabs.innerHTML = days.map((day, index) => {
    const isToday = day === today;
    return `
      <button class="day-tab ${day === selectedDay ? 'active' : ''} ${isToday ? 'today' : ''}" type="button" data-day="${day}">
        <span class="day-name">${shortDays[index]}</span>
        <span class="day-number">${day}</span>
      </button>
    `;
  }).join('');
  
  dayTabs.querySelectorAll('.day-tab').forEach((button) => {
    button.addEventListener('click', () => {
      selectedDay = button.dataset.day;
      renderTabs();
      renderLessons();
      playClickSound();
    });
  });
}

function renderLessons() {
  if (!lessonList) return;
  
  const lessons = schedule[selectedDay];
  if (!lessons || !Array.isArray(lessons)) {
    lessonList.innerHTML = '<p style="color:red; padding: 20px;">Ошибка: расписание не найдено</p>';
    return;
  }
  
  if (selectedDayTitle) selectedDayTitle.textContent = selectedDay;
  const { today } = getToday();
  if (selectedDayLabel) selectedDayLabel.textContent = selectedDay === today ? 'Сегодня' : selectedDay;

  const progress = window.progress || { lessonsDone: {}, reactions: {} };
  const lessonsDone = progress.lessonsDone || {};
  const reactions = progress.reactions || {};

  lessonList.innerHTML = lessons.map((subject, index) => {
    const isLast = index === lessons.length - 1;
    const status = index === 0 ? 'старт' : isLast ? 'финиш' : 'урок';
    const key = `${selectedDay}-${index}`;
    const isDone = !!lessonsDone[key];
    const reaction = reactions[key];
    return `
      <div class="lesson ${isDone ? 'done' : ''}" data-day="${selectedDay}" data-index="${index}">
        <span class="lesson-number">${isDone ? '✓' : String(index + 1).padStart(2, '0')}</span>
        <span class="lesson-subject">${subject}</span>
        <span class="lesson-status">${isDone ? 'готово' : status}</span>
        ${reaction ? `<span class="lesson-reaction">${reaction}</span>` : ''}
      </div>
    `;
  }).join('');

  if (progressLabel) progressLabel.textContent = `0 / ${lessons.length}`;
  if (progressBar) progressBar.style.width = '0%';

  if (focusTitle && focusText && focusLessonCount) {
    const [title, text] = focusNotes[selectedDay] || ['Фокус дня', 'Просто делай, что должен.'];
    focusTitle.innerHTML = title.replace(' — ', ' —<br>');
    focusText.textContent = text;
    focusLessonCount.textContent = lessons.length;
  }

  requestAnimationFrame(() => {
    const doneCount = lessons.filter((_, i) => lessonsDone[`${selectedDay}-${i}`]).length;
    const pct = (doneCount / lessons.length) * 100;
    if (progressBar) progressBar.style.width = pct + '%';
    if (progressLabel) progressLabel.textContent = `${doneCount} / ${lessons.length}`;
  });
}

function setRandomQuote() {
  if (!quoteText) return;
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
  quoteText.textContent = randomQuote;
}

function setRandomTip() {
  if (!tipText) return;
  const randomTip = tips[Math.floor(Math.random() * tips.length)];
  tipText.innerHTML = randomTip.replace(' — ', '<br>');
}

function initSwipe() {
  const container = document.querySelector('.schedule-section');
  if (!container) return;

  container.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  container.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  }, { passive: true });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') changeDay(-1);
    if (e.key === 'ArrowRight') changeDay(1);
  });
}

function handleSwipe() {
  const diff = touchStartX - touchEndX;
  if (Math.abs(diff) > 50) {
    if (diff > 0) changeDay(1);
    else changeDay(-1);
  }
}

function changeDay(direction) {
  const currentIndex = days.indexOf(selectedDay);
  let newIndex = currentIndex + direction;
  if (newIndex < 0) newIndex = days.length - 1;
  if (newIndex >= days.length) newIndex = 0;
  selectedDay = days[newIndex];
  renderTabs();
  renderLessons();
  hideEmojiPicker();
}

function showSwipeHint() {
  if (swipeHint && window.innerWidth <= 480) {
    swipeHint.classList.add('visible');
    setTimeout(() => {
      if (swipeHint) swipeHint.classList.remove('visible');
    }, 4000);
  }
}

function toggleLesson(e) {
  const lessonEl = e.target.closest('.lesson');
  if (!lessonEl) return;
  if (emojiPicker && emojiPicker.classList.contains('visible')) return;

  const day = lessonEl.dataset.day;
  const index = parseInt(lessonEl.dataset.index);
  const key = `${day}-${index}`;

  if (!window.progress) window.progress = { lessonsDone: {}, reactions: {} };
  if (!window.progress.lessonsDone) window.progress.lessonsDone = {};

  if (window.progress.lessonsDone[key]) {
    delete window.progress.lessonsDone[key];
  } else {
    window.progress.lessonsDone[key] = true;
    playCompleteSound();
  }
  saveProgress();
  renderLessons();
}

function handleLongPress(e) {
  const lessonEl = e.target.closest('.lesson');
  if (!lessonEl) return;

  const day = lessonEl.dataset.day;
  const index = parseInt(lessonEl.dataset.index);
  currentLessonForEmoji = `${day}-${index}`;

  if (!emojiPicker) return;
  const rect = lessonEl.getBoundingClientRect();
  emojiPicker.style.left = rect.left + rect.width / 2 - 160 + 'px';
  emojiPicker.style.top = rect.top - 60 + 'px';
  emojiPicker.classList.add('visible');
}

function hideEmojiPicker() {
  if (emojiPicker) {
    emojiPicker.classList.remove('visible');
  }
  currentLessonForEmoji = null;
}

function selectEmoji(emoji) {
  if (!currentLessonForEmoji) return;

  if (!window.progress) window.progress = { lessonsDone: {}, reactions: {} };
  if (!window.progress.reactions) window.progress.reactions = {};

  if (window.progress.reactions[currentLessonForEmoji] === emoji) {
    delete window.progress.reactions[currentLessonForEmoji];
  } else {
    window.progress.reactions[currentLessonForEmoji] = emoji;
  }
  saveProgress();
  hideEmojiPicker();
  renderLessons();
  playClickSound();
}

function initConfetti() {
  if (!confettiCanvas) return;
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}

function launchConfetti() {
  if (!ctx || !confettiCanvas) return;
  confettiParticles = [];
  const colors = ['#f06f55', '#f5ca54', '#b7d9c4', '#cec9e8', '#ff9600', '#58cc02', '#2AABEE'];

  for (let i = 0; i < 150; i++) {
    confettiParticles.push({
      x: Math.random() * confettiCanvas.width,
      y: -20 - Math.random() * 200,
      w: 8 + Math.random() * 8,
      h: 6 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      speedY: 2 + Math.random() * 3,
      speedX: (Math.random() - 0.5) * 3,
      opacity: 1
    });
  }

  if (!confettiAnimationId) {
    animateConfetti();
  }
}

function animateConfetti() {
  if (!ctx || !confettiCanvas) return;
  ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

  let activeParticles = 0;
  confettiParticles.forEach((p) => {
    if (p.opacity <= 0) return;
    activeParticles++;

    p.y += p.speedY;
    p.x += p.speedX;
    p.rotation += p.rotationSpeed;

    if (p.y > confettiCanvas.height) {
      p.opacity = 0;
      return;
    }

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate((p.rotation * Math.PI) / 180);
    ctx.globalAlpha = p.opacity;
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    ctx.restore();
  });

  if (activeParticles > 0) {
    confettiAnimationId = requestAnimationFrame(animateConfetti);
  } else {
    confettiAnimationId = null;
    if (ctx && confettiCanvas) {
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
  }
}

function checkFridayConfetti() {
  const { today } = getToday();
  if (today === 'Пятница' && selectedDay === 'Пятница') {
    const lessons = schedule['Пятница'];
    if (lessons && lessons.length > 0 && lessons.every((_, i) => (window.progress && window.progress.lessonsDone && window.progress.lessonsDone[`Пятница-${i}`]))) {
      setTimeout(launchConfetti, 500);
    }
  }
}

function setupThemeToggle() {
  const btn = document.querySelector('#themeToggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    try {
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    } catch {
      // ignore
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', isDark ? '#20231f' : '#f5f0e8');
    playClickSound();
  });
}

function setupSoundToggle() {
  if (!soundToggle) return;
  soundToggle.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundToggle.classList.toggle('muted', !soundEnabled);
    try {
      localStorage.setItem('sound', soundEnabled ? 'on' : 'off');
    } catch {
      // ignore
    }
    if (soundEnabled) playClickSound();
  });
}

function setupMusicToggle() {
  if (!musicToggle) return;
  musicToggle.addEventListener('click', () => {
    initAudio();
    if (musicEnabled) {
      stopMusic();
    } else {
      startMusic();
    }
    playClickSound();
  });
}

function setupLessonInteractions() {
  if (!lessonList) return;
  
  lessonList.addEventListener('click', (e) => {
    if (e.target.closest('.emoji-picker')) return;
    toggleLesson(e);
  });

  lessonList.addEventListener('dblclick', (e) => {
    const lessonEl = e.target.closest('.lesson');
    if (!lessonEl) return;
    handleLongPress(e);
  });

  lessonList.addEventListener('touchstart', (e) => {
    const lessonEl = e.target.closest('.lesson');
    if (!lessonEl) return;
    longPressTimer = setTimeout(() => {
      handleLongPress(e);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 600);
  }, { passive: true });

  lessonList.addEventListener('touchend', () => {
    clearTimeout(longPressTimer);
  });

  lessonList.addEventListener('touchmove', () => {
    clearTimeout(longPressTimer);
  });
}

function setupEmojiPicker() {
  if (!emojiPicker) return;
  
  emojiPicker.addEventListener('click', (e) => {
    const option = e.target.closest('.emoji-option');
    if (!option) return;
    selectEmoji(option.dataset.emoji);
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.lesson') && !e.target.closest('.emoji-picker')) {
      hideEmojiPicker();
    }
  });
}

function setupPrintButton() {
  const btn = document.querySelector('#printButton');
  if (btn) {
    btn.addEventListener('click', () => window.print());
  }
}

function init() {
  try {
    window.progress = initProgress();
    
    const savedSound = getStorage('sound', 'on');
    if (savedSound === 'off') {
      soundEnabled = false;
      if (soundToggle) soundToggle.classList.add('muted');
    }

    const savedMusic = getStorage('music', 'off');
    if (savedMusic === 'on') {
      musicEnabled = true;
      if (musicToggle) musicToggle.classList.add('playing');
    }

    initDate();
    initTheme();
    initConfetti();
    renderTabs();
    renderLessons();
    setRandomQuote();
    setRandomTip();
    initSwipe();

    setTimeout(() => {
      showSwipeHint();
      checkFridayConfetti();
    }, 1500);

    window.addEventListener('resize', () => {
      if (confettiCanvas) {
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
      }
    });

    setInterval(() => {
      const updateEl = document.querySelector('#updateTime');
      if (updateEl) {
        updateEl.textContent = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      }
    }, 60000);
  } catch {
    const lessonListEl = document.querySelector('#lessonList');
    if (lessonListEl) {
      lessonListEl.innerHTML = '<p style="color:red; padding: 20px;">Ошибка загрузки. Обновите страницу (F5).</p>';
    }
  }
}

setupThemeToggle();
setupSoundToggle();
setupMusicToggle();
setupLessonInteractions();
setupEmojiPicker();
setupPrintButton();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}