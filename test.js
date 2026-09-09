const schedule = {
  'Понедельник': ['Алгебра', 'Русский язык', 'История', 'Физика', 'Английский язык', 'Химия'],
  'Вторник': ['Геометрия', 'Английский язык', 'Химия', 'Литература', 'Биология', 'Информатика'],
  'Среда': ['Алгебра', 'Русский язык', 'География', 'Физика', 'Английский язык', 'ОБЗР'],
  'Четверг': ['История', 'Геометрия', 'Алгебра', 'Обществознание', 'Труд (технология)', 'Биология'],
  'Пятница': ['Русский язык', 'Литература', 'География', 'Информатика', 'Музыка / ИЗО', 'Химия']
};

const shortDays = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ'];
const days = Object.keys(schedule);
let selectedDay = 'Среда';

const dayTabs = document.querySelector('#dayTabs');
const lessonList = document.querySelector('#lessonList');
const selectedDayTitle = document.querySelector('#selectedDayTitle');
const selectedDayLabel = document.querySelector('#selectedDayLabel');

function getToday() {
  const now = new Date();
  const dayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
  return { today: dayNames[now.getDay()], now };
}

function renderTabs() {
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
    });
  });
}

function renderLessons() {
  const lessons = schedule[selectedDay];
  selectedDayTitle.textContent = selectedDay;
  const { today } = getToday();
  selectedDayLabel.textContent = selectedDay === today ? 'Сегодня' : selectedDay;

  lessonList.innerHTML = lessons.map((subject, index) => {
    const isLast = index === lessons.length - 1;
    const status = index === 0 ? 'старт' : isLast ? 'финиш' : 'урок';
    return `
      <div class="lesson" data-day="${selectedDay}" data-index="${index}">
        <span class="lesson-number">${String(index + 1).padStart(2, '0')}</span>
        <span class="lesson-subject">${subject}</span>
        <span class="lesson-status">${status}</span>
      </div>
    `;
  }).join('');
}

renderTabs();
renderLessons();