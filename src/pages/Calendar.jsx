import { useEffect, useState } from 'react';
import { useCalendarStore } from '../store';
import Button from '../components/common/Button';
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon, CloseIcon } from '../components/common/Icons';

const COLOR_OPTIONS = [
  { name: 'Red', hex: '#EF4444' },
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Orange', hex: '#F59E0B' },
  { name: 'Blue', hex: '#2563EB' }
];

const EVENT_TYPES = ['Custom', 'Workout', 'Task', 'Exam', 'Movie', 'Meeting'];

const getLocalYMD = (dateObj = new Date()) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const Calendar = () => {
  const { events, fetchEvents, addEvent, deleteEvent } = useCalendarStore();

  const [currentDate, setCurrentDate] = useState(new Date(2026, 6, 25)); // Default July 2026
  const [selectedDateStr, setSelectedDateStr] = useState('2026-07-25');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('2026-07-25');
  const [type, setType] = useState('Custom');
  const [color, setColor] = useState('#EF4444');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateStr(getLocalYMD(now));
  };

  const openNewEventModal = (dateStr = selectedDateStr) => {
    setEventDate(dateStr);
    setTitle('');
    setType('Custom');
    setColor('#EF4444');
    setDescription('');
    setIsModalOpen(true);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    await addEvent({
      title: title.trim(),
      date: eventDate,
      type,
      color,
      description
    });

    setIsModalOpen(false);
  };

  // Generate days grid
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarDays = [];

  // Previous month padding days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const prevDate = new Date(year, month - 1, dayNum);
    calendarDays.push({
      dateObj: prevDate,
      dateStr: getLocalYMD(prevDate),
      dayNum,
      isCurrentMonth: false
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const curDate = new Date(year, month, d);
    calendarDays.push({
      dateObj: curDate,
      dateStr: getLocalYMD(curDate),
      dayNum: d,
      isCurrentMonth: true
    });
  }

  // Next month padding days to complete 35 or 42 grid cells
  const remainingCells = 42 - calendarDays.length;
  for (let n = 1; n <= remainingCells; n++) {
    const nextDate = new Date(year, month + 1, n);
    calendarDays.push({
      dateObj: nextDate,
      dateStr: getLocalYMD(nextDate),
      dayNum: n,
      isCurrentMonth: false
    });
  }

  return (
    <div style={{ position: 'relative', minHeight: 'calc(100vh - 120px)' }}>
      {/* Top Header */}
      <div className="page-header">
        <h1 className="flex flex-center gap-12">
          <span>🗓️</span> CALENDAR
        </h1>
        <Button variant="primary" icon={<PlusIcon />} onClick={() => openNewEventModal()}>
          + NEW EVENT
        </Button>
      </div>

      {/* Main Calendar Card */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {/* Month Navigation Control Bar */}
        <div className="flex flex-between flex-center" style={{ padding: '20px 24px', borderBottom: 'var(--bw) solid var(--border)', background: 'var(--bg2)' }}>
          <div className="flex flex-center gap-12">
            <button className="btn-icon" onClick={handlePrevMonth} title="Previous Month">
              <ChevronLeftIcon size={16} />
            </button>
            <span style={{ fontWeight: 900, fontSize: '1.3rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {monthNames[month]} {year}
            </span>
            <button className="btn-icon" onClick={handleNextMonth} title="Next Month">
              <ChevronRightIcon size={16} />
            </button>
          </div>

          <Button variant="ghost" onClick={handleToday}>
            TODAY
          </Button>
        </div>

        {/* Days of Week Header */}
        <div className="calendar-grid-header">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
            <div key={day} className="calendar-header-cell">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Month Grid */}
        <div className="calendar-grid-body">
          {calendarDays.map((cell, idx) => {
            const isSelected = cell.dateStr === selectedDateStr;
            const dayEvents = events.filter((e) => e.date === cell.dateStr);

            return (
              <div
                key={idx}
                onClick={() => setSelectedDateStr(cell.dateStr)}
                className={`calendar-day-cell ${cell.isCurrentMonth ? '' : 'outside-month'} ${isSelected ? 'selected-day' : ''}`}
              >
                <div className="day-number">{cell.dayNum}</div>
                <div className="day-events-list">
                  {dayEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="event-pill flex flex-between"
                      style={{ background: evt.color || '#EF4444' }}
                      title={`${evt.title} - ${evt.description || ''}`}
                    >
                      <span className="truncate">{evt.title}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteEvent(evt.id);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#fff',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          marginLeft: '4px'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Action Button (+) */}
      <button className="fab-btn" onClick={() => openNewEventModal(selectedDateStr)} title="Add New Event">
        <PlusIcon size={24} />
      </button>

      {/* Modal - NEW EVENT */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>NEW EVENT</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <CloseIcon size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="modal-body">
              <div className="form-group">
                <label>TITLE</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Event name"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>DATE</label>
                  <input
                    type="date"
                    className="form-input"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>TYPE</label>
                  <select
                    className="form-select"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    {EVENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>COLOR</label>
                <div className="flex gap-12" style={{ marginTop: '4px' }}>
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setColor(c.hex)}
                      className={`color-dot-btn ${color === c.hex ? 'selected' : ''}`}
                      style={{ background: c.hex }}
                    />
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>DESCRIPTION</label>
                <textarea
                  className="form-textarea"
                  placeholder="Details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-12" style={{ justifyContent: 'flex-end', marginTop: '24px' }}>
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                  CANCEL
                </Button>
                <Button type="submit" variant="primary">
                  SAVE
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
