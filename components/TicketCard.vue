<template>
  <!-- Container for all segments of this ticket -->
  <div v-if="hasVisibleSegments" class="ticket-segments-container">
    <!-- Render each state segment as a separate colored bar -->
    <div
      v-for="(segment, index) in visibleSegments"
      :key="`${ticket.key}-${index}`"
      class="ticket-segment rounded-md cursor-pointer transition-all hover:scale-105 hover:shadow-lg relative group"
      :style="segment.style"
      @click="$emit('click')"
    >
      <!-- Show ticket info only on the first or longest segment -->
      <div
        v-if="segment.showInfo"
        class="px-3 py-2 flex items-start justify-between gap-2"
      >
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs font-bold text-white">{{ ticket.key }}</span>
            <span
              v-if="ticket.points"
              class="text-xs px-1.5 py-0.5 bg-white/20 rounded font-semibold text-white"
            >
              {{ ticket.points }} pts
            </span>
          </div>
          <div class="text-sm font-medium text-white truncate">
            {{ ticket.title }}
          </div>
        </div>

        <!-- PR indicator -->
        <div v-if="ticket.prs.length > 0" class="flex-shrink-0">
          <svg
            class="w-4 h-4 text-white/80"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            <path
              fill-rule="evenodd"
              d="M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1 1 0 011 1v5.628a2.251 2.251 0 101.5 0V5A2.5 2.5 0 0011 2.5zm1 10.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5z"
            />
          </svg>
        </div>
      </div>

      <!-- Status label for segments without full info -->
      <div v-else class="px-2 py-1 text-xs font-semibold text-white opacity-80">
        {{ segment.statusLabel }}
      </div>

      <!-- Tooltip on hover (same for all segments) -->
      <div
        class="absolute z-50 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity bottom-full left-0 mb-2 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl min-w-[250px] max-w-[350px]"
      >
        <div class="font-bold mb-1">{{ ticket.key }}: {{ ticket.title }}</div>
        <div class="space-y-1 text-gray-300">
          <div>Current Status: {{ ticket.currentStatus }}</div>
          <div v-if="ticket.points">Story Points: {{ ticket.points }}</div>
          <div>Assignee: {{ ticket.assignee.name }}</div>
          <div class="font-semibold text-yellow-400">
            Total Days Open: {{ totalDaysOpen }}
            {{ totalDaysOpen === 1 ? 'day' : 'days' }}
          </div>

          <!-- Show state timeline -->
          <div class="pt-2 border-t border-gray-700">
            <div class="font-semibold mb-1">Timeline:</div>
            <div
              v-for="(seg, idx) in ticket.stateSegments"
              :key="idx"
              class="flex items-center gap-2 text-xs"
            >
              <span
                class="w-2 h-2 rounded-full flex-shrink-0"
                :style="{ backgroundColor: seg.color }"
              ></span>
              <span>{{ seg.status }}: {{ formatDate(seg.startDate) }}</span>
              <span v-if="seg.endDate"> → {{ formatDate(seg.endDate) }}</span>
              <span v-else class="text-blue-400">(ongoing)</span>
            </div>
          </div>

          <div
            v-if="ticket.prs.length > 0"
            class="pt-1 border-t border-gray-700"
          >
            {{ ticket.prs.length }} PR{{ ticket.prs.length > 1 ? 's' : '' }}
            linked
          </div>
        </div>
        <!-- Arrow pointing down -->
        <div
          class="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Ticket, StateSegment } from '~/types';

const props = defineProps<{
  ticket: Ticket;
  weekStart: Date;
  weekEnd: Date;
  lane?: number;
  totalLanes?: number;
}>();

defineEmits<{
  click: [];
}>();

const { calculateTicketSpan, formatDate } = useDateUtils();

// Calculate total days the ticket was/has been open  
// This counts the number of days elapsed, not inclusive calendar days
const totalDaysOpen = computed(() => {
  const start = props.ticket.startDate;
  const end = props.ticket.endDate || new Date(); // Use now if still open
  
  // Normalize to start of day to get calendar days
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  
  // Calculate the difference in milliseconds and convert to days
  const diffMs = endDay.getTime() - startDay.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  
  // If opened and closed on the same day, count as 1 day
  // Otherwise, use the difference (days elapsed, not inclusive)
  // Example: Jan 13 to Jan 13 = 0 days difference → 1 day
  // Example: Jan 13 to Jan 14 = 1 day difference → 1 day  
  // Example: Jan 13 to Jan 16 = 3 days difference → 3 days
  return Math.max(diffDays, 1);
});

interface VisibleSegment {
  status: string;
  statusLabel: string;
  color: string;
  style: Record<string, string>;
  showInfo: boolean;
  width: number;
}

// Calculate visible segments within the week range
const visibleSegments = computed<VisibleSegment[]>(() => {
  const segments: VisibleSegment[] = [];
  const dayWidth = 100 / 7;
  const laneHeight = 65; // Height of each lane in pixels
  const topPosition = (props.lane || 0) * laneHeight + 4; // Add 4px top margin

  for (const segment of props.ticket.stateSegments) {
    const spanInfo = calculateTicketSpan(
      segment.startDate,
      segment.endDate,
      props.weekStart,
      props.weekEnd
    );

    if (spanInfo.visible) {
      const left = `${spanInfo.start * dayWidth}%`;
      const width = `calc(${spanInfo.width * dayWidth}% - 4px)`;

      segments.push({
        status: segment.status,
        statusLabel: segment.status,
        color: segment.color,
        style: {
          position: 'absolute',
          left,
          width,
          top: `${topPosition}px`,
          backgroundColor: segment.color,
          opacity: segment.endDate ? '0.9' : '1',
        },
        showInfo: false,
        width: spanInfo.width,
      });
    }
  }

  // Determine which segment should show the ticket info (longest one)
  if (segments.length > 0) {
    let longestIndex = 0;
    let maxWidth = segments[0].width;

    for (let i = 1; i < segments.length; i++) {
      if (segments[i].width > maxWidth) {
        maxWidth = segments[i].width;
        longestIndex = i;
      }
    }

    segments[longestIndex].showInfo = true;
  }

  return segments;
});

const hasVisibleSegments = computed(() => {
  return visibleSegments.value.length > 0;
});
</script>

<style scoped>
.ticket-segments-container {
  position: relative;
  width: 100%;
  height: 58px; /* Fixed height instead of min-height */
}

.ticket-segment {
  z-index: 10;
  height: 58px; /* Fixed height to prevent overflow */
}

.ticket-segment:hover {
  z-index: 20;
}
</style>
