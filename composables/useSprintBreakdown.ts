import { ref, computed, type Ref } from 'vue';
import type { Ticket } from '~/types';

export interface PointsSizeEntry {
  size: number | null;
  label: string;
  count: number;
  percentOfTotal: number;
}

export interface BreakdownEntry {
  name: string;
  count: number;
  points: number;
  percentOfPoints: number;
  completedCount: number;
  avgCycleTimeDays: number | null;
}

// Keep for backwards compat in CSV export type annotations
export type TypeBreakdownEntry = BreakdownEntry;

/**
 * Compute cycle time in calendar days for a ticket.
 * Cycle time = first "In Progress" status change -> "Done" status change.
 * Returns null if the ticket has not reached Done.
 */
export function getCycleTimeDays(ticket: Ticket): number | null {
  const segments = ticket.stateSegments;
  if (!segments || segments.length === 0) return null;

  // Find first In Progress segment
  const firstInProgress = segments.find((s) => s.status === 'In Progress');
  if (!firstInProgress) return null;

  // Find Done segment
  const doneSegment = segments.find((s) => s.status === 'Done');
  if (!doneSegment) return null;

  const start = new Date(firstInProgress.startDate).getTime();
  const end = new Date(doneSegment.startDate).getTime();

  if (end <= start) return 0;

  return Math.round((end - start) / (1000 * 60 * 60 * 24) * 10) / 10;
}

export const useSprintBreakdown = (tickets: Ref<Ticket[]>) => {
  // Filter state
  const searchTerm = ref('');
  const selectedLabels = ref<string[]>([]);
  const selectedComponents = ref<string[]>([]);
  const selectedIssueTypes = ref<string[]>([]);

  // All unique labels from the current ticket set
  const availableLabels = computed(() => {
    const labelSet = new Set<string>();
    for (const ticket of tickets.value) {
      for (const label of ticket.labels || []) {
        labelSet.add(label);
      }
    }
    return Array.from(labelSet).sort();
  });

  // All unique issue types from the current ticket set
  const availableIssueTypes = computed(() => {
    const typeSet = new Set<string>();
    for (const ticket of tickets.value) {
      if (ticket.issueType) {
        typeSet.add(ticket.issueType);
      }
    }
    return Array.from(typeSet).sort();
  });

  // All unique components from the current ticket set
  const availableComponents = computed(() => {
    const componentSet = new Set<string>();
    for (const ticket of tickets.value) {
      for (const component of ticket.components || []) {
        componentSet.add(component);
      }
    }
    return Array.from(componentSet).sort();
  });

  // Tickets after applying search + label + component filters
  const filteredTickets = computed(() => {
    let result = tickets.value;

    // Apply text search (supports regex with /pattern/ syntax)
    const rawTerm = searchTerm.value.trim();
    if (rawTerm) {
      // Check if the search term is a regex pattern: /pattern/ or /pattern/flags
      const regexMatch = rawTerm.match(/^\/(.+)\/([gimsuy]*)$/);

      if (regexMatch) {
        // Regex mode
        try {
          const flags = regexMatch[2].includes('i') ? regexMatch[2] : regexMatch[2] + 'i';
          const regex = new RegExp(regexMatch[1], flags);
          result = result.filter(
            (t) =>
              regex.test(t.key) ||
              regex.test(t.title) ||
              (t.description && typeof t.description === 'string' && regex.test(t.description))
          );
        } catch {
          // If the regex is invalid, fall back to plain text search
          const term = rawTerm.toLowerCase();
          result = result.filter(
            (t) =>
              t.key.toLowerCase().includes(term) ||
              t.title.toLowerCase().includes(term) ||
              (t.description && typeof t.description === 'string' && t.description.toLowerCase().includes(term))
          );
        }
      } else {
        // Plain text search (case-insensitive)
        const term = rawTerm.toLowerCase();
        result = result.filter(
          (t) =>
            t.key.toLowerCase().includes(term) ||
            t.title.toLowerCase().includes(term) ||
            (t.description && typeof t.description === 'string' && t.description.toLowerCase().includes(term))
        );
      }
    }

    // Apply label filter
    if (selectedLabels.value.length > 0) {
      result = result.filter((t) =>
        (t.labels || []).some((label) => selectedLabels.value.includes(label))
      );
    }

    // Apply component filter
    if (selectedComponents.value.length > 0) {
      result = result.filter((t) =>
        (t.components || []).some((comp) => selectedComponents.value.includes(comp))
      );
    }

    // Apply issue type filter
    if (selectedIssueTypes.value.length > 0) {
      result = result.filter((t) =>
        selectedIssueTypes.value.includes(t.issueType)
      );
    }

    return result;
  });

  // Aggregate stats
  const totalPoints = computed(() =>
    filteredTickets.value.reduce((sum, t) => sum + (t.points || 0), 0)
  );

  const completedTickets = computed(() =>
    filteredTickets.value.filter((t) => t.currentStatus === 'Done')
  );

  const completedPoints = computed(() =>
    completedTickets.value.reduce((sum, t) => sum + (t.points || 0), 0)
  );

  const avgCycleTime = computed(() => {
    const cycleTimes = completedTickets.value
      .map((t) => getCycleTimeDays(t))
      .filter((ct): ct is number => ct !== null);

    if (cycleTimes.length === 0) return null;
    const sum = cycleTimes.reduce((a, b) => a + b, 0);
    return Math.round((sum / cycleTimes.length) * 10) / 10;
  });

  // Generic breakdown builder: groups tickets by a key extractor and computes stats
  const buildBreakdown = (
    keyExtractor: (ticket: Ticket) => string[]
  ): BreakdownEntry[] => {
    const map = new Map<
      string,
      { count: number; points: number; completedCount: number; cycleTimes: number[] }
    >();

    for (const ticket of filteredTickets.value) {
      const keys = keyExtractor(ticket);
      for (const key of keys) {
        if (!map.has(key)) {
          map.set(key, { count: 0, points: 0, completedCount: 0, cycleTimes: [] });
        }
        const entry = map.get(key)!;
        entry.count++;
        entry.points += ticket.points || 0;

        if (ticket.currentStatus === 'Done') {
          entry.completedCount++;
          const ct = getCycleTimeDays(ticket);
          if (ct !== null) {
            entry.cycleTimes.push(ct);
          }
        }
      }
    }

    const total = totalPoints.value || 1;

    return Array.from(map.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        points: data.points,
        percentOfPoints: Math.round((data.points / total) * 100),
        completedCount: data.completedCount,
        avgCycleTimeDays:
          data.cycleTimes.length > 0
            ? Math.round(
                (data.cycleTimes.reduce((a, b) => a + b, 0) / data.cycleTimes.length) * 10
              ) / 10
            : null,
      }))
      .sort((a, b) => b.points - a.points);
  };

  // Breakdown by ticket type
  const typeBreakdown = computed<BreakdownEntry[]>(() =>
    buildBreakdown((t) => [t.issueType || 'Unknown'])
  );

  // Breakdown by team member
  const memberBreakdown = computed<BreakdownEntry[]>(() =>
    buildBreakdown((t) => [t.assignee?.name || 'Unassigned'])
  );

  // Breakdown by label (a ticket with multiple labels appears in each)
  const labelBreakdown = computed<BreakdownEntry[]>(() =>
    buildBreakdown((t) => (t.labels && t.labels.length > 0) ? t.labels : ['No Label'])
  );

  // Breakdown by component (a ticket with multiple components appears in each)
  const componentBreakdown = computed<BreakdownEntry[]>(() =>
    buildBreakdown((t) => (t.components && t.components.length > 0) ? t.components : ['No Component'])
  );

  // Points size distribution (how many tickets are 1s, 2s, 3s, 5s, etc.)
  const pointsBreakdown = computed<PointsSizeEntry[]>(() => {
    const sizeMap = new Map<number | null, number>();

    for (const ticket of filteredTickets.value) {
      const size = ticket.points;
      sizeMap.set(size, (sizeMap.get(size) || 0) + 1);
    }

    const total = filteredTickets.value.length || 1;

    return Array.from(sizeMap.entries())
      .map(([size, count]) => ({
        size,
        label: size !== null ? String(size) : 'Unestimated',
        count,
        percentOfTotal: Math.round((count / total) * 100),
      }))
      .sort((a, b) => {
        // Unestimated (null) goes last
        if (a.size === null) return 1;
        if (b.size === null) return -1;
        return a.size - b.size;
      });
  });

  return {
    searchTerm,
    selectedLabels,
    availableLabels,
    selectedComponents,
    availableComponents,
    selectedIssueTypes,
    availableIssueTypes,
    filteredTickets,
    totalPoints,
    completedTickets,
    completedPoints,
    avgCycleTime,
    typeBreakdown,
    memberBreakdown,
    labelBreakdown,
    componentBreakdown,
    pointsBreakdown,
    getCycleTimeDays,
  };
};
