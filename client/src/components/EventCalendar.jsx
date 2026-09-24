import { useState, useMemo } from 'react';

/**
 * EventCalendar
 *
 * Props:
 *   events         — array of event objects with .date field
 *   selectedDate   — currently selected date string (YYYY-MM-DD)
 *   onDateSelect   — callback(dateString | null) — null clears the filter
 */
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const EventCalendar = ({ events = [], selectedDate, onDateSelect }) => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // Build a Set of date strings that have events
  const eventDates = useMemo(() => {
    const dates = new Set();
    events.forEach((e) => {
      if (e.date) dates.add(e.date);
    });
    return dates;
  }, [events]);

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const days = [];

    // Leading empty slots
    for (let i = 0; i < firstDay; i++) {
      days.push({ key: `empty-${i}`, empty: true });
    }

    // Actual days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday =
        d === today.getDate() &&
        viewMonth === today.getMonth() &&
        viewYear === today.getFullYear();
      days.push({
        key: dateStr,
        day: d,
        dateStr,
        isToday,
        hasEvents: eventDates.has(dateStr),
        isSelected: selectedDate === dateStr,
      });
    }

    return days;
  }, [viewYear, viewMonth, eventDates, selectedDate]);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleDayClick = (day) => {
    if (day.empty) return;
    // Toggle: click selected date again to clear filter
    onDateSelect(day.isSelected ? null : day.dateStr);
  };

  return (
    <div className="calendar-section">
      {/* Calendar header */}
      <div className="calendar-header">
        <h2 className="calendar-title">
          {MONTHS[viewMonth]} {viewYear}
        </h2>
        <div className="calendar-nav">
          <button
            id="calendar-prev"
            className="calendar-nav-btn"
            onClick={prevMonth}
            aria-label="Previous month"
          >
            ‹
          </button>
          <button
            id="calendar-next"
            className="calendar-nav-btn"
            onClick={nextMonth}
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className="calendar-grid-header">
        {DAYS.map((d) => (
          <div key={d} className="calendar-day-name">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="calendar-grid" role="grid" aria-label="Event calendar">
        {calendarDays.map((day) => {
          if (day.empty) {
            return <div key={day.key} className="calendar-day empty" role="gridcell" />;
          }

          const classes = [
            'calendar-day',
            day.isToday ? 'today' : '',
            day.hasEvents ? 'has-events' : '',
            day.isSelected ? 'selected' : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              key={day.key}
              id={`cal-day-${day.dateStr}`}
              className={classes}
              onClick={() => handleDayClick(day)}
              role="gridcell"
              aria-label={`${day.dateStr}${day.hasEvents ? ', has events' : ''}${day.isSelected ? ', selected' : ''}`}
              aria-pressed={day.isSelected}
            >
              {day.day}
            </button>
          );
        })}
      </div>

      {/* Active filter indicator */}
      {selectedDate && (
        <div className="calendar-filter-info">
          <span>
            📅 Showing events for{' '}
            <strong>
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric',
              })}
            </strong>
          </span>
          <button
            id="clear-date-filter"
            className="btn btn-ghost btn-sm"
            onClick={() => onDateSelect(null)}
          >
            Clear ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default EventCalendar;
