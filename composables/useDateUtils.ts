import {
  startOfWeek,
  endOfWeek,
  addDays,
  format,
  differenceInDays,
  isWithinInterval,
  isSameDay,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import type { StateSegment } from '~/types';

/**
 * Calculate the number of unique calendar days a ticket was in "In Progress" status.
 * Only counts days where the ticket was actively being worked on — "Done" days are excluded.
 */
export function calculateActiveDays(stateSegments: StateSegment[]): number {
  const activeDaySet = new Set<string>();
  const now = new Date();

  for (const seg of stateSegments) {
    if (seg.status === 'In Progress') {
      const segStart = new Date(seg.startDate);
      const segEnd = seg.endDate ? new Date(seg.endDate) : now;

      // Normalize to start of day
      const startDay = new Date(segStart.getFullYear(), segStart.getMonth(), segStart.getDate());
      const endDay = new Date(segEnd.getFullYear(), segEnd.getMonth(), segEnd.getDate());

      // Add each calendar day in this segment to the set
      // Note: We DON'T include the end day because endDate represents when this segment ended
      let currentDay = new Date(startDay);
      while (currentDay < endDay) {
        activeDaySet.add(currentDay.toISOString().split('T')[0]);
        currentDay.setDate(currentDay.getDate() + 1);
      }

      // Special case: if segment has no end date (still active), OR if start and end are same day,
      // count at least the start day
      if (!seg.endDate || startDay.getTime() === endDay.getTime()) {
        activeDaySet.add(startDay.toISOString().split('T')[0]);
      }
    }
  }

  return activeDaySet.size;
}

export const useDateUtils = () => {
  const getWeekDays = (date: Date, weekStartsOn: 0 | 1 = 1): Date[] => {
    const start = startOfWeek(date, { weekStartsOn });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  };

  const getWeekRange = (date: Date, weekStartsOn: 0 | 1 = 1) => {
    return {
      start: startOfWeek(date, { weekStartsOn }),
      end: endOfWeek(date, { weekStartsOn }),
    };
  };

  const formatDate = (
    date: Date,
    formatStr: string = 'MMM d, yyyy'
  ): string => {
    return format(date, formatStr);
  };

  const formatDayOfWeek = (date: Date): string => {
    return format(date, 'EEE');
  };

  const formatDayOfMonth = (date: Date): string => {
    return format(date, 'd');
  };

  const calculateTicketSpan = (
    ticketStart: Date,
    ticketEnd: Date | null,
    weekStart: Date,
    weekEnd: Date
  ): { start: number; width: number; visible: boolean } => {
    const currentTicketEnd = ticketEnd || new Date();

    // Check if ticket overlaps with the week
    const overlaps =
      isWithinInterval(ticketStart, { start: weekStart, end: weekEnd }) ||
      isWithinInterval(currentTicketEnd, { start: weekStart, end: weekEnd }) ||
      (ticketStart < weekStart && currentTicketEnd > weekEnd);

    if (!overlaps) {
      return { start: 0, width: 0, visible: false };
    }

    // Calculate which day of the week to start (0-6)
    const displayStart = ticketStart < weekStart ? weekStart : ticketStart;
    const displayEnd = currentTicketEnd > weekEnd ? weekEnd : currentTicketEnd;

    const start = differenceInDays(displayStart, weekStart);
    const width = differenceInDays(displayEnd, displayStart) + 1;

    return { start, width, visible: true };
  };

  const nextWeek = (date: Date): Date => {
    return addWeeks(date, 1);
  };

  const previousWeek = (date: Date): Date => {
    return subWeeks(date, 1);
  };

  const getDateRange = (start: Date, end: Date): Date[] => {
    const days: Date[] = [];
    let current = new Date(start);
    while (current <= end) {
      days.push(new Date(current));
      current = addDays(current, 1);
    }
    return days;
  };

  type ViewMode = '1week' | '2weeks' | '1month' | 'custom';

  const nextPeriod = (date: Date, mode: ViewMode): Date => {
    switch (mode) {
      case '1week':
        return addWeeks(date, 1);
      case '2weeks':
        return addWeeks(date, 2);
      case '1month':
        return addMonths(date, 1);
      default:
        return date;
    }
  };

  const previousPeriod = (date: Date, mode: ViewMode): Date => {
    switch (mode) {
      case '1week':
        return subWeeks(date, 1);
      case '2weeks':
        return subWeeks(date, 2);
      case '1month':
        return subMonths(date, 1);
      default:
        return date;
    }
  };

  return {
    getWeekDays,
    getWeekRange,
    getDateRange,
    formatDate,
    formatDayOfWeek,
    formatDayOfMonth,
    calculateTicketSpan,
    nextWeek,
    previousWeek,
    nextPeriod,
    previousPeriod,
    startOfMonth,
    endOfMonth,
  };
};
