<template>
  <div class="calendar-week bg-white rounded-lg shadow-lg">
    <!-- Week Header -->
    <div class="calendar-header grid grid-cols-8 border-b border-gray-200">
      <!-- User column header -->
      <div
        class="col-span-1 p-4 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200"
      >
        Team Member
      </div>

      <!-- Day headers -->
      <div
        v-for="day in weekDays"
        :key="day.toISOString()"
        class="p-4 text-center border-r border-gray-200 last:border-r-0"
        :class="{
          'bg-blue-50': isToday(day),
          'bg-gray-50': !isToday(day),
        }"
      >
        <div class="text-sm font-semibold text-gray-700">
          {{ formatDayOfWeek(day) }}
        </div>
        <div
          class="text-lg font-bold"
          :class="isToday(day) ? 'text-blue-600' : 'text-gray-900'"
        >
          {{ formatDayOfMonth(day) }}
        </div>
      </div>
    </div>

    <!-- User Rows -->
    <div class="calendar-body">
      <div
        v-for="userData in processedUsers"
        :key="userData.user.id"
        class="grid grid-cols-8 border-b border-gray-200 last:border-b-0"
      >
        <!-- User Info Column -->
        <div
          class="col-span-1 p-4 border-r border-gray-200 flex items-center gap-3"
        >
          <div
            v-if="userData.user.avatarUrl"
            class="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden"
          >
            <img
              :src="userData.user.avatarUrl"
              :alt="userData.user.name"
              class="w-full h-full object-cover"
            />
          </div>
          <div
            v-else
            class="w-10 h-10 rounded-full bg-blue-500 flex-shrink-0 flex items-center justify-center text-white font-semibold"
          >
            {{ getUserInitials(userData.user.name) }}
          </div>
          <div class="min-w-0 flex-1">
            <div class="font-medium text-gray-900 truncate">
              {{ userData.user.name }}
            </div>
            <div class="text-sm text-gray-500 truncate">
              {{ userData.user.email }}
            </div>
          </div>
        </div>

        <!-- Week Timeline Column (7 days) - CSS Grid layout -->
        <div class="col-span-7 relative">
          <!-- Day divider background -->
          <div class="absolute inset-0 grid grid-cols-7 pointer-events-none">
            <div
              v-for="day in weekDays"
              :key="'bg-' + day.toISOString()"
              class="border-r border-gray-200 last:border-r-0"
              :class="{ 'bg-blue-50/30': isToday(day) }"
            />
          </div>

          <!-- Ticket grid: one bar per ticket -->
          <div
            class="ticket-grid"
            :style="{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gridTemplateRows: `repeat(${userData.totalLanes}, 96px)`,
              gap: '4px 0px',
              padding: '4px 0px',
              minHeight: '64px',
            }"
          >
            <div
              v-for="item in userData.ticketItems"
              :key="item.ticket.key"
              class="rounded-md cursor-pointer transition-all hover:brightness-110 hover:shadow-lg relative group hover:z-50"
              :style="{
                gridColumn: `${item.colStart} / ${item.colEnd}`,
                gridRow: `${item.row}`,
                backgroundColor: item.barColor,
                minWidth: '0',
              }"
              @click="onTicketClick(item.ticket)"
            >
              <!-- Status chips - positioned at the top, on the day the status changed -->
              <span
                v-for="chip in item.statusChips"
                :key="chip.status"
                class="absolute top-1 text-[10px] px-2 py-0.5 rounded-full font-semibold text-white z-[1] whitespace-nowrap"
                :style="{
                  left: `calc(${chip.leftPercent}% + ${
                    10 + chip.extraOffsetPx
                  }px)`,
                  backgroundColor: chip.color,
                }"
              >
                {{ chip.status }}
              </span>

              <!-- Days open chip - upper right -->
              <span
                class="absolute top-1 right-2 text-[10px] px-2 py-0.5 rounded-full font-semibold z-[1] whitespace-nowrap bg-yellow-400 text-yellow-900"
              >
                {{ item.daysOpen }}d
              </span>

              <!-- Ticket info -->
              <div
                class="px-3 pt-7 pb-1 h-full flex flex-col overflow-hidden min-w-0"
              >
                <!-- Line 1: Ticket key -->
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold text-white">{{
                    item.ticket.key
                  }}</span>
                  <!-- PR indicator -->
                  <svg
                    v-if="item.ticket.prs.length > 0"
                    class="w-3.5 h-3.5 text-white/80 ml-auto flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1 1 0 011 1v5.628a2.251 2.251 0 101.5 0V5A2.5 2.5 0 0011 2.5zm1 10.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5z"
                    />
                  </svg>
                </div>
                <!-- Line 2: Story points -->
                <div
                  v-if="
                    item.ticket.pointsHistory &&
                    item.ticket.pointsHistory.length > 0
                  "
                  class="flex items-center gap-1"
                >
                  <span
                    v-for="(ph, phIdx) in item.ticket.pointsHistory"
                    :key="'ph-' + phIdx"
                    class="text-[10px] px-1 py-0.5 bg-white/20 rounded font-semibold text-white"
                  >
                    {{ ph.from ?? '–' }}
                  </span>
                  <span class="text-[10px] text-white/60">›</span>
                  <span
                    class="text-[10px] px-1 py-0.5 bg-white/30 rounded font-semibold text-white"
                  >
                    {{ item.ticket.points ?? '–' }} pts
                  </span>
                </div>
                <div v-else-if="item.ticket.points">
                  <span
                    class="text-[10px] px-1 py-0.5 bg-white/20 rounded font-semibold text-white"
                  >
                    {{ item.ticket.points }} pts
                  </span>
                </div>
                <!-- Line 2: Ticket title -->
                <div class="text-sm font-medium text-white truncate mt-0.5">
                  {{ item.ticket.title }}
                </div>
              </div>

              <!-- Tooltip -->
              <div
                class="absolute z-50 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity top-full left-0 mt-2 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl min-w-[250px] max-w-[350px] pointer-events-none"
              >
                <div class="font-bold mb-1">
                  {{ item.ticket.key }}: {{ item.ticket.title }}
                </div>
                <div class="space-y-1 text-gray-300">
                  <div>Current Status: {{ item.ticket.currentStatus }}</div>
                  <div v-if="item.ticket.points">
                    Story Points: {{ item.ticket.points }}
                    <template
                      v-if="
                        item.ticket.pointsHistory &&
                        item.ticket.pointsHistory.length > 0
                      "
                    >
                      <span class="text-gray-400">
                        ({{
                          item.ticket.pointsHistory
                            .map((ph: any) => ph.from ?? '–')
                            .join(' → ')
                        }}
                        → {{ item.ticket.points }})
                      </span>
                    </template>
                  </div>
                  <div>Assignee: {{ item.ticket.assignee.name }}</div>
                  <div class="font-semibold text-yellow-400">
                    Active Days: {{ item.daysOpen }}
                    {{ item.daysOpen === 1 ? 'day' : 'days' }}
                  </div>
                  <div class="pt-2 border-t border-gray-700">
                    <div class="font-semibold mb-1">Timeline:</div>
                    <div
                      v-for="(seg, idx) in item.ticket.stateSegments"
                      :key="idx"
                      class="flex items-center gap-2 text-xs"
                    >
                      <span
                        class="w-2 h-2 rounded-full flex-shrink-0"
                        :style="{ backgroundColor: seg.color }"
                      ></span>
                      <span
                        >{{ seg.status }}: {{ formatDate(seg.startDate) }}</span
                      >
                      <span v-if="seg.endDate">
                        &rarr; {{ formatDate(seg.endDate) }}</span
                      >
                      <span v-else class="text-blue-400">(ongoing)</span>
                    </div>
                  </div>
                  <div
                    v-if="item.ticket.prs.length > 0"
                    class="pt-1 border-t border-gray-700"
                  >
                    {{ item.ticket.prs.length }} PR{{
                      item.ticket.prs.length > 1 ? 's' : ''
                    }}
                    linked
                  </div>
                </div>
                <div
                  class="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-if="userTickets.length === 0"
        class="p-12 text-center text-gray-500"
      >
        <svg
          class="mx-auto h-12 w-12 text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <p class="text-lg font-medium">No tickets found for this week</p>
        <p class="mt-1">Try adjusting your date range or filters</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { isSameDay, differenceInCalendarDays, startOfDay } from 'date-fns';
import type { UserWithTickets, Ticket } from '~/types';

const props = defineProps<{
  userTickets: UserWithTickets[];
  currentDate: Date;
  weekStartsOn?: 0 | 1;
}>();

const emit = defineEmits<{
  ticketClick: [ticket: Ticket];
}>();

const {
  getWeekDays,
  getWeekRange,
  formatDayOfWeek,
  formatDayOfMonth,
  formatDate,
  calculateTicketSpan,
} = useDateUtils();

const weekDays = computed(() =>
  getWeekDays(props.currentDate, props.weekStartsOn || 1)
);
const weekRange = computed(() =>
  getWeekRange(props.currentDate, props.weekStartsOn || 1)
);

// Bar colors (lighter)
const statusColors: Record<string, string> = {
  'To Do': '#94a3b8',
  'In Progress': '#3b82f6',
  Done: '#10b981',
};

// Chip colors (darker, same hue)
const statusChipColors: Record<string, string> = {
  'To Do': '#64748b',
  'In Progress': '#1d4ed8',
  Done: '#047857',
};

interface StatusChip {
  status: string;
  color: string;
  // Position as percentage from left edge of ticket bar
  leftPercent: number;
  // Extra pixel offset for same-day chips
  extraOffsetPx: number;
}

interface TicketGridItem {
  ticket: Ticket;
  colStart: number;
  colEnd: number;
  row: number;
  barColor: string;
  statusChips: StatusChip[];
  daysOpen: number;
}

interface ProcessedUser {
  user: UserWithTickets['user'];
  ticketItems: TicketGridItem[];
  totalLanes: number;
}

const processedUsers = computed<ProcessedUser[]>(() => {
  return props.userTickets
    .map((userTicket) => {
      const occupancy: boolean[][] = [];

      const isLaneFree = (
        lane: number,
        startCol: number,
        endCol: number
      ): boolean => {
        if (!occupancy[lane]) return true;
        for (let d = startCol; d < endCol; d++) {
          if (d >= 0 && d < 7 && occupancy[lane][d]) return false;
        }
        return true;
      };

      const occupyLane = (
        lane: number,
        startCol: number,
        endCol: number
      ): void => {
        if (!occupancy[lane]) occupancy[lane] = new Array(7).fill(false);
        for (let d = startCol; d < endCol; d++) {
          if (d >= 0 && d < 7) occupancy[lane][d] = true;
        }
      };

      const sortedTickets = [...userTicket.tickets].sort(
        (a, b) => a.startDate.getTime() - b.startDate.getTime()
      );

      const ticketItems: TicketGridItem[] = [];

      const wsStart = startOfDay(weekRange.value.start);
      const todayDayIndex = differenceInCalendarDays(
        startOfDay(new Date()),
        wsStart
      );
      const dayMs = 1000 * 60 * 60 * 24;

      for (const ticket of sortedTickets) {
        // Calculate the full visible span using calendar day differences
        const ticketStartDay = differenceInCalendarDays(
          startOfDay(ticket.startDate),
          wsStart
        );
        const ticketEndDay = ticket.endDate
          ? differenceInCalendarDays(startOfDay(ticket.endDate), wsStart)
          : Math.min(todayDayIndex, 6); // extend to today, not end of week

        // Clamp to visible week
        let minCol = Math.max(0, ticketStartDay);
        let maxCol = Math.min(7, ticketEndDay + 1); // +1 because grid end is exclusive

        if (minCol >= 7 || maxCol <= 0) continue;

        // Find a free lane
        let assignedLane = -1;
        for (let lane = 0; lane <= occupancy.length; lane++) {
          if (isLaneFree(lane, minCol, maxCol)) {
            assignedLane = lane;
            occupyLane(lane, minCol, maxCol);
            break;
          }
        }

        // Days in active development — only count time in "In Progress" or "Done" segments
        let daysOpen = 0;
        const now = new Date();
        for (const seg of ticket.stateSegments) {
          if (seg.status === 'In Progress' || seg.status === 'Done') {
            const segStart = new Date(seg.startDate);
            const segEnd = seg.endDate ? new Date(seg.endDate) : now;
            const diff = Math.ceil(
              (segEnd.getTime() - segStart.getTime()) / (1000 * 60 * 60 * 24)
            );
            daysOpen += Math.max(diff, 0);
          }
        }

        // Bar color = current status color
        const barColor = statusColors[ticket.currentStatus] || '#8b5cf6';

        // Build status chips positioned at the day each status change happened
        const statusChips: StatusChip[] = [];
        const ticketSpanDays = maxCol - minCol; // total columns the bar spans

        for (const seg of ticket.stateSegments) {
          // Get the actual day index (0-6) the status change happened on
          const statusDayIndex = differenceInCalendarDays(
            startOfDay(seg.startDate),
            wsStart
          );

          // Only show chips for status changes that fall within the visible week
          if (statusDayIndex < 0 || statusDayIndex > 6) continue;

          // Calculate the chip's left position as a percentage of the ticket bar width
          const segDayInBar = statusDayIndex - minCol;
          const leftPercent =
            ticketSpanDays > 0 ? (segDayInBar / ticketSpanDays) * 100 : 0;

          statusChips.push({
            status: seg.status,
            color: statusChipColors[seg.status] || '#6d28d9',
            leftPercent,
            extraOffsetPx: 0,
          });
        }

        // Calculate horizontal offsets for chips on the same day
        // so they line up next to each other instead of stacking
        const chipWidthEstimate = 75; // approximate width of a chip in px
        for (let i = 1; i < statusChips.length; i++) {
          if (statusChips[i].leftPercent === statusChips[i - 1].leftPercent) {
            statusChips[i].extraOffsetPx =
              statusChips[i - 1].extraOffsetPx + chipWidthEstimate;
          }
        }

        ticketItems.push({
          ticket,
          colStart: minCol + 1,
          colEnd: maxCol + 1,
          row: assignedLane + 1,
          barColor,
          statusChips,
          daysOpen,
        });
      }

      return {
        user: userTicket.user,
        ticketItems,
        totalLanes: Math.max(1, occupancy.length),
      };
    })
    .filter((userData: ProcessedUser) => userData.ticketItems.length > 0);
});

const isToday = (date: Date) => isSameDay(date, new Date());

const getUserInitials = (name: string): string =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

const onTicketClick = (ticket: Ticket) => emit('ticketClick', ticket);
</script>

<style scoped>
.calendar-week {
  max-width: 100%;
  overflow-x: auto;
}
</style>
