"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, X } from "lucide-react";
import { DayPicker } from "react-day-picker";

type BookingDatePickerProps = {
  value: string;
  availableWeekdays: number[];
  onChange: (date: string) => void;
};

function fromDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfToday() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

export function BookingDatePicker({ value, availableWeekdays, onChange }: BookingDatePickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const today = startOfToday();
  const selected = value ? fromDateKey(value) : undefined;
  const disabledWeekdays = [0, 1, 2, 3, 4, 5, 6].filter((day) => !availableWeekdays.includes(day));

  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePress);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePress);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className="booking-date-picker" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        className="more-dates"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <CalendarDays size={15} />
        More dates
      </button>
      {open && (
        <>
          <button aria-label="Close date picker" className="booking-calendar-backdrop" onClick={() => setOpen(false)} tabIndex={-1} type="button" />
          <section className="booking-calendar-popover" aria-label="Choose another date" role="dialog">
            <div className="booking-calendar-header">
              <div><b>Choose a date</b><span>Only days you work are available.</span></div>
              <button aria-label="Close date picker" onClick={() => setOpen(false)} type="button"><X size={16} /></button>
            </div>
            <DayPicker
              defaultMonth={selected ?? today}
              disabled={[{ before: today }, { dayOfWeek: disabledWeekdays }]}
              endMonth={new Date(today.getFullYear(), today.getMonth() + 6, 1)}
              mode="single"
              onSelect={(date) => {
                if (!date) return;
                onChange(toDateKey(date));
                setOpen(false);
              }}
              selected={selected}
              startMonth={new Date(today.getFullYear(), today.getMonth(), 1)}
            />
          </section>
        </>
      )}
    </div>
  );
}
