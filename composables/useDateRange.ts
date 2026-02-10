import { ref, computed } from 'vue';
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  startOfMonth,
  endOfMonth,
} from 'date-fns';

// --- Types ---
export type ViewMode = '1week' | '2weeks' | '1month' | 'custom';

// --- Module-level state — shared across all components ---
const viewMode = ref<ViewMode>('1month');
const currentDate = ref(new Date());
const customStartDate = ref<Date>(new Date());
const customEndDate = ref<Date>(new Date());

export const useDateRange = () => {
  const { weekStartsOn } = useConfig();
  const { getWeekRange, nextPeriod, previousPeriod } = useDateUtils();

  // Computed week range (used internally by dateRange for 2-week calc)
  const weekRange = computed(() =>
    getWeekRange(currentDate.value, weekStartsOn.value)
  );

  // Generalized date range based on view mode
  const dateRange = computed(() => {
    switch (viewMode.value) {
      case '1week':
        return getWeekRange(currentDate.value, weekStartsOn.value);
      case '2weeks': {
        const start = weekRange.value.start;
        const end = endOfWeek(addWeeks(start, 1), {
          weekStartsOn: weekStartsOn.value,
        });
        return { start, end };
      }
      case '1month':
        return {
          start: startOfMonth(currentDate.value),
          end: endOfMonth(currentDate.value),
        };
      case 'custom':
        return {
          start: customStartDate.value,
          end: customEndDate.value,
        };
    }
  });

  // Navigation
  const goToPreviousPeriod = () => {
    currentDate.value = previousPeriod(currentDate.value, viewMode.value);
  };

  const goToNextPeriod = () => {
    currentDate.value = nextPeriod(currentDate.value, viewMode.value);
  };

  const goToToday = () => {
    currentDate.value = new Date();
  };

  const setViewMode = (mode: string) => {
    viewMode.value = mode as ViewMode;
  };

  // Format a Date as "YYYY-MM-DD" using local time (not UTC)
  const formatLocalDate = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Parse a "YYYY-MM-DD" string as local time (not UTC)
  const parseLocalDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Custom date handlers
  const handleStartDateChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    customStartDate.value = parseLocalDate(target.value);
  };

  const handleEndDateChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    customEndDate.value = parseLocalDate(target.value);
  };

  return {
    viewMode,
    currentDate,
    customStartDate,
    customEndDate,
    dateRange,
    weekRange,
    goToPreviousPeriod,
    goToNextPeriod,
    goToToday,
    setViewMode,
    formatLocalDate,
    handleStartDateChange,
    handleEndDateChange,
  };
};
