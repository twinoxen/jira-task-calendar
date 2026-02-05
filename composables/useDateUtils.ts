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
} from 'date-fns';

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

  return {
    getWeekDays,
    getWeekRange,
    formatDate,
    formatDayOfWeek,
    formatDayOfMonth,
    calculateTicketSpan,
    nextWeek,
    previousWeek,
  };
};
