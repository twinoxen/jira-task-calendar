<template>
  <div>
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">
              JIRA/GitHub Grind Analyzer
            </h1>
            <p class="text-sm text-gray-500 mt-1">
              Track team productivity and ticket progress
            </p>
          </div>
          <button
            @click="refreshData"
            :disabled="loading"
            class="btn-primary flex items-center gap-2"
            :class="{ 'opacity-50 cursor-not-allowed': loading }"
          >
            <svg
              class="w-4 h-4"
              :class="{ 'animate-spin': loading }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {{ loading ? 'Refreshing...' : 'Refresh' }}
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Week Navigation -->
      <div
        class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6"
      >
        <!-- View Mode Selector -->
        <div class="mb-4 flex items-center justify-center gap-2">
          <button
            v-for="mode in [
              { value: '1week', label: '1 Week' },
              { value: '2weeks', label: '2 Weeks' },
              { value: '1month', label: '1 Month' },
              { value: 'custom', label: 'Custom' },
            ]"
            :key="mode.value"
            @click="setViewMode(mode.value)"
            class="px-4 py-2 text-sm font-medium rounded-md transition-colors"
            :class="{
              'bg-blue-600 text-white': viewMode === mode.value,
              'bg-gray-100 text-gray-700 hover:bg-gray-200':
                viewMode !== mode.value,
            }"
          >
            {{ mode.label }}
          </button>
        </div>

        <!-- Custom Date Inputs -->
        <div
          v-if="viewMode === 'custom'"
          class="mb-4 flex items-center justify-center gap-4"
        >
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1"
              >Start Date</label
            >
            <input
              type="date"
              :value="formatLocalDate(customStartDate)"
              @change="handleStartDateChange"
              class="block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1"
              >End Date</label
            >
            <input
              type="date"
              :value="formatLocalDate(customEndDate)"
              @change="handleEndDateChange"
              class="block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        <!-- Date Range Navigation -->
        <div class="flex items-center justify-between">
          <button
            v-if="viewMode !== 'custom'"
            @click="goToPreviousPeriod"
            class="btn-secondary flex items-center gap-2"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Previous
          </button>
          <div v-else></div>

          <div class="text-center">
            <div class="text-lg font-semibold text-gray-900">
              {{ formatDate(dateRange.start, 'MMM d') }} -
              {{ formatDate(dateRange.end, 'MMM d, yyyy') }}
            </div>
            <button
              @click="goToToday"
              class="text-sm text-blue-600 hover:text-blue-800 mt-1"
            >
              Today
            </button>
          </div>

          <button
            v-if="viewMode !== 'custom'"
            @click="goToNextPeriod"
            class="btn-secondary flex items-center gap-2"
          >
            Next
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
          <div v-else></div>
        </div>
      </div>

      <!-- Filters -->
      <div
        class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6"
      >
        <h3 class="text-sm font-semibold text-gray-700 mb-3">
          Settings & Statistics
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- User Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Filter by Team Member
            </label>
            <div class="space-y-1 max-h-40 overflow-y-auto">
              <label
                class="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
              >
                <input
                  type="checkbox"
                  :checked="selectedUserIds.length === 0"
                  @change="selectAllUsers"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span class="font-medium text-gray-700">All Users</span>
              </label>
              <label
                v-for="user in availableUsers"
                :key="user.id"
                class="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
              >
                <input
                  type="checkbox"
                  :checked="selectedUserIds.includes(user.id)"
                  @change="toggleUser(user.id)"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <img
                  v-if="user.avatarUrl"
                  :src="user.avatarUrl"
                  class="w-5 h-5 rounded-full"
                />
                <span class="truncate">{{ user.name }}</span>
              </label>
            </div>
          </div>

          <!-- Status Legend -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Status Colors
            </label>
            <div class="space-y-2">
              <div
                v-for="(status, index) in statusConfigs"
                :key="index"
                class="flex items-center gap-2 text-sm"
              >
                <span
                  class="w-3 h-3 rounded-full"
                  :style="{ backgroundColor: status.color }"
                ></span>
                <span>{{ status.name }}</span>
              </div>
            </div>
          </div>

          <!-- Week Start -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Week Starts On
            </label>
            <select
              v-model="weekStartsOn"
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option :value="1">Monday</option>
              <option :value="0">Sunday</option>
            </select>
          </div>

          <!-- Stats -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Statistics
            </label>
            <div class="space-y-1 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Total Tickets:</span>
                <span class="font-semibold">{{
                  filteredUserTickets.reduce(
                    (sum, ut) => sum + ut.tickets.length,
                    0
                  )
                }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Total Points:</span>
                <span class="font-semibold">{{ filteredTotalPoints }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Team Members:</span>
                <span class="font-semibold">{{
                  filteredUserTickets.length
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div
        v-if="error"
        class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
      >
        <div class="flex items-start gap-3">
          <svg
            class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
            />
          </svg>
          <div class="flex-1">
            <h4 class="text-sm font-semibold text-red-900 mb-1">
              Error loading data
            </h4>
            <p class="text-sm text-red-700">{{ error.message }}</p>
            <p class="text-xs text-red-600 mt-2">
              Make sure you've configured your JIRA and GitHub credentials in
              the .env file.
            </p>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div
        v-if="loading"
        class="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center"
      >
        <svg
          class="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <p class="text-lg font-medium text-gray-900">Loading ticket data...</p>
        <p class="text-sm text-gray-500 mt-1">This may take a few moments</p>
      </div>

      <!-- Calendar View -->
      <CalendarWeek
        v-else
        :user-tickets="filteredUserTickets"
        :start-date="dateRange.start"
        :end-date="dateRange.end"
        @ticket-click="openTicketModal"
      />
    </main>

    <!-- Ticket Detail Modal -->
    <TicketDetailModal
      :is-open="isModalOpen"
      :ticket="selectedTicket"
      :loading-prs="loadingPRs"
      @close="closeTicketModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import type { Ticket } from '~/types';

const {
  fetchData,
  fetchTicketPRs,
  userTickets,
  tickets,
  totalPoints,
  loading,
  error,
} = useTicketData();
const { statusConfigs, weekStartsOn } = useConfig();
const { formatDate } = useDateUtils();

// Shared date range state
const {
  viewMode,
  customStartDate,
  customEndDate,
  dateRange,
  goToPreviousPeriod,
  goToNextPeriod,
  goToToday,
  setViewMode,
  formatLocalDate,
  handleStartDateChange,
  handleEndDateChange,
} = useDateRange();

// JIRA project selection (shared via composable)
const { selectedProject } = useProjectSelection();

// User filter state - empty means "all users"
const selectedUserIds = ref<string[]>([]);

// Available users from the current data
const availableUsers = computed(() => {
  return userTickets.value.map((ut) => ut.user);
});

// Filtered user tickets based on selection
const filteredUserTickets = computed(() => {
  if (selectedUserIds.value.length === 0) return userTickets.value;
  return userTickets.value.filter((ut) =>
    selectedUserIds.value.includes(ut.user.id)
  );
});

const filteredTotalPoints = computed(() => {
  return filteredUserTickets.value.reduce(
    (sum, ut) => sum + ut.tickets.reduce((s, t) => s + (t.points || 0), 0),
    0
  );
});

const toggleUser = (userId: string) => {
  const idx = selectedUserIds.value.indexOf(userId);
  if (idx === -1) {
    selectedUserIds.value.push(userId);
  } else {
    selectedUserIds.value.splice(idx, 1);
  }
};

const selectAllUsers = () => {
  selectedUserIds.value = [];
};

// Modal state
const isModalOpen = ref(false);
const selectedTicket = ref<Ticket | null>(null);

// Refresh data
const refreshData = async () => {
  await fetchData(
    dateRange.value.start,
    dateRange.value.end,
    undefined,
    selectedProject.value
  );
};

// Ticket modal
const loadingPRs = ref(false);

const openTicketModal = async (ticket: Ticket) => {
  selectedTicket.value = ticket;
  isModalOpen.value = true;

  // Fetch PRs on-demand when modal opens
  loadingPRs.value = true;
  try {
    await fetchTicketPRs(ticket);
  } finally {
    loadingPRs.value = false;
  }
};

const closeTicketModal = () => {
  isModalOpen.value = false;
  selectedTicket.value = null;
};

// Watch for date changes and refetch
watch(
  () => dateRange.value,
  async () => {
    await refreshData();
  },
  { deep: true }
);

// Watch for project changes and refetch
watch(selectedProject, async () => {
  if (selectedProject.value) {
    await refreshData();
  }
});

// Initial data load
onMounted(async () => {
  // Only fetch if project is already selected (set by app.vue)
  if (selectedProject.value) {
    await refreshData();
  }
});
</script>
