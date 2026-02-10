<template>
  <div>
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Sprint Breakdown</h1>
            <p class="text-sm text-gray-500 mt-1">
              Story point allocation, ticket types &amp; cycle times
            </p>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="exportCSV"
              :disabled="loading || filteredTickets.length === 0"
              class="btn-secondary flex items-center gap-2"
              :class="{
                'opacity-50 cursor-not-allowed':
                  loading || filteredTickets.length === 0,
              }"
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
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export CSV
            </button>
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
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Date Range Selector -->
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
              :value="customStartDate.toISOString().split('T')[0]"
              @change="handleStartDateChange"
              class="block rounded-lg border-2 border-gray-300 bg-white shadow-sm py-2 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1"
              >End Date</label
            >
            <input
              type="date"
              :value="customEndDate.toISOString().split('T')[0]"
              @change="handleEndDateChange"
              class="block rounded-lg border-2 border-gray-300 bg-white shadow-sm py-2 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
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

      <!-- Filters Panel -->
      <div
        class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 space-y-4"
      >
        <!-- Row 1: Search bar spanning full width -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Search Tickets
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              v-model="searchTerm"
              type="text"
              placeholder="Search by key, title, or description... Use /pattern/ for regex"
              class="block w-full pl-9 pr-3 py-2.5 rounded-lg border-2 border-gray-300 bg-white shadow-sm text-sm placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
            />
          </div>
          <p class="text-xs text-gray-400 mt-1">
            Plain text for fuzzy match, or wrap in slashes for regex, e.g.
            <code class="bg-gray-100 px-1 rounded">/imports|exports/</code>
          </p>
        </div>

        <!-- Divider -->
        <div class="border-t border-gray-100"></div>

        <!-- Row 2: All filter columns -->
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
          <!-- Column 1: Project + Team Members stacked -->
          <div class="space-y-4">
            <!-- JIRA Project Selector -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Project
              </label>
              <select
                v-model="selectedProject"
                :disabled="loadingProjects || availableProjects.length === 0"
                class="block w-full rounded-lg border-2 border-gray-300 bg-white shadow-sm py-2.5 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
              >
                <option value="" disabled>
                  {{
                    loadingProjects
                      ? 'Loading...'
                      : availableProjects.length === 0
                      ? 'No projects found'
                      : 'Select project'
                  }}
                </option>
                <option
                  v-for="project in availableProjects"
                  :key="project.key"
                  :value="project.key"
                >
                  {{ project.name }} ({{ project.key }})
                </option>
              </select>
            </div>

            <!-- Team Member Filter -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Team Members
              </label>
              <div class="space-y-0.5 max-h-36 overflow-y-auto border border-gray-100 rounded-md p-1">
                <label
                  class="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
                >
                  <input
                    type="checkbox"
                    :checked="selectedUserIds.length === 0"
                    @change="selectAllUsers"
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span class="font-medium text-gray-700">All</span>
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
          </div>

          <!-- Column 2: Ticket Type -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Ticket Type
              <span
                v-if="selectedIssueTypes.length > 0"
                class="text-xs text-blue-600 ml-1"
                >({{ selectedIssueTypes.length }})</span
              >
            </label>
            <div
              v-if="availableIssueTypes.length > 0"
              class="space-y-0.5 max-h-52 overflow-y-auto border border-gray-100 rounded-md p-1"
            >
              <label
                class="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
              >
                <input
                  type="checkbox"
                  :checked="selectedIssueTypes.length === 0"
                  @change="selectedIssueTypes = []"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span class="font-medium text-gray-700">All Types</span>
              </label>
              <label
                v-for="issueType in availableIssueTypes"
                :key="issueType"
                class="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
              >
                <input
                  type="checkbox"
                  :checked="selectedIssueTypes.includes(issueType)"
                  @change="toggleIssueType(issueType)"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                  :class="typeColorClass(issueType)"
                  >{{ issueType }}</span
                >
              </label>
            </div>
            <p v-else class="text-xs text-gray-400 italic mt-1">
              No types found
            </p>
          </div>

          <!-- Column 3: Labels -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Labels
              <span
                v-if="selectedLabels.length > 0"
                class="text-xs text-blue-600 ml-1"
                >({{ selectedLabels.length }})</span
              >
            </label>
            <div
              v-if="availableLabels.length > 0"
              class="space-y-0.5 max-h-52 overflow-y-auto border border-gray-100 rounded-md p-1"
            >
              <label
                class="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
              >
                <input
                  type="checkbox"
                  :checked="selectedLabels.length === 0"
                  @change="selectedLabels = []"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span class="font-medium text-gray-700">All Labels</span>
              </label>
              <label
                v-for="label in availableLabels"
                :key="label"
                class="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
              >
                <input
                  type="checkbox"
                  :checked="selectedLabels.includes(label)"
                  @change="toggleLabel(label)"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                  >{{ label }}</span
                >
              </label>
            </div>
            <p v-else class="text-xs text-gray-400 italic mt-1">
              No labels found
            </p>
          </div>

          <!-- Column 4: Components -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Components
              <span
                v-if="selectedComponents.length > 0"
                class="text-xs text-blue-600 ml-1"
                >({{ selectedComponents.length }})</span
              >
            </label>
            <div
              v-if="availableComponents.length > 0"
              class="space-y-0.5 max-h-52 overflow-y-auto border border-gray-100 rounded-md p-1"
            >
              <label
                class="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
              >
                <input
                  type="checkbox"
                  :checked="selectedComponents.length === 0"
                  @change="selectedComponents = []"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span class="font-medium text-gray-700">All Components</span>
              </label>
              <label
                v-for="comp in availableComponents"
                :key="comp"
                class="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
              >
                <input
                  type="checkbox"
                  :checked="selectedComponents.includes(comp)"
                  @change="toggleComponent(comp)"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-50 text-teal-700"
                  >{{ comp }}</span
                >
              </label>
            </div>
            <p v-else class="text-xs text-gray-400 italic mt-1">
              No components found
            </p>
          </div>

          <!-- Column 5: Active filter summary -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Active Filters
            </label>
            <div class="space-y-1.5 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-500">Matching:</span>
                <span class="font-semibold text-gray-900">{{ filteredTickets.length }} tickets</span>
              </div>
              <div v-if="selectedUserIds.length > 0" class="flex justify-between">
                <span class="text-gray-500">Users:</span>
                <span class="font-medium text-blue-600">{{ selectedUserIds.length }}</span>
              </div>
              <div v-if="selectedIssueTypes.length > 0" class="flex justify-between">
                <span class="text-gray-500">Types:</span>
                <span class="font-medium text-blue-600">{{ selectedIssueTypes.length }}</span>
              </div>
              <div v-if="selectedLabels.length > 0" class="flex justify-between">
                <span class="text-gray-500">Labels:</span>
                <span class="font-medium text-blue-600">{{ selectedLabels.length }}</span>
              </div>
              <div v-if="selectedComponents.length > 0" class="flex justify-between">
                <span class="text-gray-500">Components:</span>
                <span class="font-medium text-blue-600">{{ selectedComponents.length }}</span>
              </div>
              <div v-if="searchTerm.trim()" class="flex justify-between">
                <span class="text-gray-500">Search:</span>
                <span class="font-medium text-blue-600 truncate max-w-[100px]">"{{ searchTerm.trim() }}"</span>
              </div>
              <button
                v-if="selectedUserIds.length > 0 || selectedIssueTypes.length > 0 || selectedLabels.length > 0 || selectedComponents.length > 0 || searchTerm.trim()"
                @click="clearAllFilters"
                class="mt-2 w-full text-xs text-red-600 hover:text-red-800 font-medium py-1.5 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
              >
                Clear All Filters
              </button>
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

      <!-- Content (when not loading) -->
      <template v-if="!loading">
        <!-- Summary Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div
            class="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Total Tickets
            </p>
            <p class="text-2xl font-bold text-gray-900 mt-1">
              {{ filteredTickets.length }}
            </p>
          </div>
          <div
            class="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Total Story Points
            </p>
            <p class="text-2xl font-bold text-gray-900 mt-1">
              {{ totalPoints }}
            </p>
          </div>
          <div
            class="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Completed Points
            </p>
            <p class="text-2xl font-bold text-green-600 mt-1">
              {{ completedPoints }}
            </p>
          </div>
          <div
            class="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Avg Cycle Time
            </p>
            <p class="text-2xl font-bold text-gray-900 mt-1">
              {{ avgCycleTime !== null ? avgCycleTime + 'd' : '--' }}
            </p>
          </div>
        </div>

        <!-- Points Distribution -->
        <div
          class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6"
        >
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            Points Distribution
          </h3>

          <div v-if="pointsBreakdown.length === 0" class="text-sm text-gray-500">
            No ticket data for this period.
          </div>

          <div v-else class="flex flex-wrap gap-3">
            <div
              v-for="entry in pointsBreakdown"
              :key="entry.label"
              class="flex-1 min-w-[100px] max-w-[160px] border border-gray-100 rounded-lg p-3 text-center"
            >
              <div
                class="text-2xl font-bold mb-1"
                :class="entry.size !== null ? 'text-blue-600' : 'text-gray-400'"
              >
                {{ entry.label }}
              </div>
              <div class="text-xs text-gray-500 uppercase tracking-wide mb-2">
                {{ entry.size !== null ? 'points' : '' }}
              </div>
              <div class="text-lg font-semibold text-gray-900">
                {{ entry.count }}
              </div>
              <div class="text-xs text-gray-500">
                {{ entry.count === 1 ? 'ticket' : 'tickets' }}
                ({{ entry.percentOfTotal }}%)
              </div>
              <!-- Mini bar -->
              <div class="mt-2 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-500"
                  :class="entry.size !== null ? 'bg-blue-500' : 'bg-gray-300'"
                  :style="{ width: entry.percentOfTotal + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Ticket Type Breakdown -->
        <div
          class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6"
        >
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            Breakdown by Ticket Type
          </h3>

          <div v-if="typeBreakdown.length === 0" class="text-sm text-gray-500">
            No ticket data for this period.
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="entry in typeBreakdown"
              :key="entry.type"
              class="border border-gray-100 rounded-lg p-4"
            >
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-3">
                  <span
                    class="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-semibold"
                    :class="typeColorClass(entry.type)"
                  >
                    {{ entry.type }}
                  </span>
                  <span class="text-sm text-gray-500">
                    {{ entry.count }}
                    {{ entry.count === 1 ? 'ticket' : 'tickets' }}
                  </span>
                </div>
                <div class="flex items-center gap-6 text-sm">
                  <div class="text-right">
                    <span class="text-gray-500">Points:</span>
                    <span class="font-semibold text-gray-900 ml-1">{{
                      entry.points
                    }}</span>
                  </div>
                  <div class="text-right">
                    <span class="text-gray-500">Completed:</span>
                    <span class="font-semibold text-gray-900 ml-1">{{
                      entry.completedCount
                    }}</span>
                  </div>
                  <div class="text-right min-w-[120px]">
                    <span class="text-gray-500">Avg Cycle:</span>
                    <span class="font-semibold text-gray-900 ml-1">{{
                      entry.avgCycleTimeDays !== null
                        ? entry.avgCycleTimeDays + 'd'
                        : '--'
                    }}</span>
                  </div>
                </div>
              </div>
              <!-- Proportion bar -->
              <div class="flex items-center gap-3">
                <div class="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-500"
                    :class="typeBarColorClass(entry.type)"
                    :style="{ width: entry.percentOfPoints + '%' }"
                  ></div>
                </div>
                <span class="text-sm font-medium text-gray-600 w-12 text-right">
                  {{ entry.percentOfPoints }}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Ticket List Table -->
        <div
          class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
        >
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">
              All Tickets
              <span class="text-sm font-normal text-gray-500 ml-2"
                >({{ filteredTickets.length }})</span
              >
            </h3>
          </div>

          <div v-if="filteredTickets.length === 0" class="p-8 text-center">
            <p class="text-sm text-gray-500">
              No tickets match your current filters.
            </p>
          </div>

          <div v-else class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                    @click="toggleSort('key')"
                  >
                    Key
                    <span v-if="sortField === 'key'" class="ml-1">{{
                      sortAsc ? '↑' : '↓'
                    }}</span>
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Title
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                    @click="toggleSort('type')"
                  >
                    Type
                    <span v-if="sortField === 'type'" class="ml-1">{{
                      sortAsc ? '↑' : '↓'
                    }}</span>
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                    @click="toggleSort('points')"
                  >
                    Points
                    <span v-if="sortField === 'points'" class="ml-1">{{
                      sortAsc ? '↑' : '↓'
                    }}</span>
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                    @click="toggleSort('status')"
                  >
                    Status
                    <span v-if="sortField === 'status'" class="ml-1">{{
                      sortAsc ? '↑' : '↓'
                    }}</span>
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                    @click="toggleSort('cycleTime')"
                  >
                    Cycle Time
                    <span v-if="sortField === 'cycleTime'" class="ml-1">{{
                      sortAsc ? '↑' : '↓'
                    }}</span>
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Labels
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Components
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Assignee
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr
                  v-for="ticket in sortedTickets"
                  :key="ticket.key"
                  class="hover:bg-gray-50 cursor-pointer transition-colors"
                  @click="openTicketModal(ticket)"
                >
                  <td class="px-4 py-3 whitespace-nowrap">
                    <a
                      :href="ticket.jiraUrl"
                      target="_blank"
                      class="text-sm font-medium text-blue-600 hover:text-blue-800"
                      @click.stop
                      >{{ ticket.key }}</a
                    >
                  </td>
                  <td class="px-4 py-3">
                    <span class="text-sm text-gray-900 line-clamp-1">{{
                      ticket.title
                    }}</span>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap">
                    <span
                      class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                      :class="typeColorClass(ticket.issueType)"
                    >
                      {{ ticket.issueType }}
                    </span>
                  </td>
                  <td
                    class="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium"
                  >
                    {{ ticket.points ?? '--' }}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap">
                    <span
                      class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                      :class="statusColorClass(ticket.currentStatus)"
                    >
                      {{ ticket.currentStatus }}
                    </span>
                  </td>
                  <td
                    class="px-4 py-3 whitespace-nowrap text-sm text-gray-700"
                  >
                    {{
                      getCycleTimeDays(ticket) !== null
                        ? getCycleTimeDays(ticket) + 'd'
                        : '--'
                    }}
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex flex-wrap gap-1">
                      <span
                        v-for="label in ticket.labels"
                        :key="label"
                        class="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600"
                        >{{ label }}</span
                      >
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex flex-wrap gap-1">
                      <span
                        v-for="comp in ticket.components"
                        :key="comp"
                        class="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-teal-50 text-teal-700"
                        >{{ comp }}</span
                      >
                    </div>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap">
                    <div class="flex items-center gap-2">
                      <img
                        v-if="ticket.assignee.avatarUrl"
                        :src="ticket.assignee.avatarUrl"
                        class="w-5 h-5 rounded-full"
                      />
                      <span class="text-sm text-gray-700 truncate max-w-[120px]">{{
                        ticket.assignee.name
                      }}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
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
import { getCycleTimeDays } from '~/composables/useSprintBreakdown';

const {
  fetchData,
  fetchTicketPRs,
  userTickets,
  tickets,
  loading,
  error,
} = useTicketData();
const { weekStartsOn } = useConfig();
const {
  formatDate,
  getWeekRange,
  nextPeriod,
  previousPeriod,
  startOfMonth,
  endOfMonth,
} = useDateUtils();
const { addWeeks, endOfWeek } = await import('date-fns');

// --- Date range state (reused pattern from index.vue) ---
type ViewMode = '1week' | '2weeks' | '1month' | 'custom';
const viewMode = ref<ViewMode>('1month');
const setViewMode = (mode: string) => {
  viewMode.value = mode as ViewMode;
};
const customStartDate = ref<Date>(new Date());
const customEndDate = ref<Date>(new Date());
const currentDate = ref(new Date());

const weekRange = computed(() =>
  getWeekRange(currentDate.value, weekStartsOn.value)
);

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

const goToPreviousPeriod = () => {
  currentDate.value = previousPeriod(currentDate.value, viewMode.value);
};
const goToNextPeriod = () => {
  currentDate.value = nextPeriod(currentDate.value, viewMode.value);
};
const goToToday = () => {
  currentDate.value = new Date();
};

const handleStartDateChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  customStartDate.value = new Date(target.value);
};
const handleEndDateChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  customEndDate.value = new Date(target.value);
};

// --- Project selection ---
const availableProjects = ref<Array<{ key: string; name: string; id: string }>>(
  []
);
const selectedProject = ref<string>('');
const loadingProjects = ref(false);

const fetchProjects = async () => {
  loadingProjects.value = true;
  try {
    const response = (await $fetch('/api/jira/projects')) as any;
    availableProjects.value = response.projects || [];
    if (availableProjects.value.length > 0 && !selectedProject.value) {
      selectedProject.value = availableProjects.value[0].key;
    }
  } catch (err) {
    console.error('Failed to fetch projects:', err);
  } finally {
    loadingProjects.value = false;
  }
};

// --- User filter ---
const selectedUserIds = ref<string[]>([]);
const availableUsers = computed(() => userTickets.value.map((ut) => ut.user));

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

// User-filtered tickets (before search/label filtering)
const userFilteredTickets = computed(() => {
  if (selectedUserIds.value.length === 0) return tickets.value;
  return tickets.value.filter((t) =>
    selectedUserIds.value.includes(t.assignee.id)
  );
});

// --- Sprint breakdown composable ---
const {
  searchTerm,
  selectedLabels,
  availableLabels,
  selectedComponents,
  availableComponents,
  selectedIssueTypes,
  availableIssueTypes,
  filteredTickets,
  totalPoints,
  completedPoints,
  avgCycleTime,
  typeBreakdown,
  pointsBreakdown,
} = useSprintBreakdown(userFilteredTickets);

const toggleLabel = (label: string) => {
  const idx = selectedLabels.value.indexOf(label);
  if (idx === -1) {
    selectedLabels.value.push(label);
  } else {
    selectedLabels.value.splice(idx, 1);
  }
};

const toggleComponent = (component: string) => {
  const idx = selectedComponents.value.indexOf(component);
  if (idx === -1) {
    selectedComponents.value.push(component);
  } else {
    selectedComponents.value.splice(idx, 1);
  }
};

const toggleIssueType = (type: string) => {
  const idx = selectedIssueTypes.value.indexOf(type);
  if (idx === -1) {
    selectedIssueTypes.value.push(type);
  } else {
    selectedIssueTypes.value.splice(idx, 1);
  }
};

const clearAllFilters = () => {
  selectedUserIds.value = [];
  selectedIssueTypes.value = [];
  selectedLabels.value = [];
  selectedComponents.value = [];
  searchTerm.value = '';
};

// --- Sorting ---
type SortField = 'key' | 'type' | 'points' | 'status' | 'cycleTime';
const sortField = ref<SortField>('key');
const sortAsc = ref(true);

const toggleSort = (field: SortField) => {
  if (sortField.value === field) {
    sortAsc.value = !sortAsc.value;
  } else {
    sortField.value = field;
    sortAsc.value = true;
  }
};

const sortedTickets = computed(() => {
  const list = [...filteredTickets.value];
  const dir = sortAsc.value ? 1 : -1;

  list.sort((a, b) => {
    switch (sortField.value) {
      case 'key':
        return dir * a.key.localeCompare(b.key);
      case 'type':
        return dir * a.issueType.localeCompare(b.issueType);
      case 'points':
        return dir * ((a.points || 0) - (b.points || 0));
      case 'status':
        return dir * a.currentStatus.localeCompare(b.currentStatus);
      case 'cycleTime': {
        const ctA = getCycleTimeDays(a) ?? 9999;
        const ctB = getCycleTimeDays(b) ?? 9999;
        return dir * (ctA - ctB);
      }
      default:
        return 0;
    }
  });

  return list;
});

// --- Color helpers ---
const typeColorClass = (type: string): string => {
  const t = type.toLowerCase();
  if (t === 'bug') return 'bg-red-100 text-red-800';
  if (t === 'story') return 'bg-blue-100 text-blue-800';
  if (t === 'task') return 'bg-gray-100 text-gray-800';
  if (t === 'spike') return 'bg-purple-100 text-purple-800';
  if (t === 'epic') return 'bg-indigo-100 text-indigo-800';
  if (t === 'sub-task' || t === 'subtask') return 'bg-orange-100 text-orange-800';
  return 'bg-gray-100 text-gray-800';
};

const typeBarColorClass = (type: string): string => {
  const t = type.toLowerCase();
  if (t === 'bug') return 'bg-red-500';
  if (t === 'story') return 'bg-blue-500';
  if (t === 'task') return 'bg-gray-500';
  if (t === 'spike') return 'bg-purple-500';
  if (t === 'epic') return 'bg-indigo-500';
  if (t === 'sub-task' || t === 'subtask') return 'bg-orange-500';
  return 'bg-gray-400';
};

const statusColorClass = (status: string): string => {
  if (status === 'Done') return 'bg-green-100 text-green-800';
  if (status === 'In Progress') return 'bg-blue-100 text-blue-800';
  if (status === 'To Do') return 'bg-gray-100 text-gray-800';
  return 'bg-purple-100 text-purple-800';
};

// --- Ticket modal ---
const isModalOpen = ref(false);
const selectedTicket = ref<Ticket | null>(null);
const loadingPRs = ref(false);

const openTicketModal = async (ticket: Ticket) => {
  selectedTicket.value = ticket;
  isModalOpen.value = true;
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

// --- CSV Export ---
const escapeCSV = (value: string): string => {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
};

const exportCSV = () => {
  const dateLabel = `${formatDate(dateRange.value.start, 'yyyy-MM-dd')}_to_${formatDate(dateRange.value.end, 'yyyy-MM-dd')}`;

  // --- Summary section ---
  const summaryRows = [
    ['Sprint Breakdown Report'],
    ['Date Range', `${formatDate(dateRange.value.start, 'MMM d, yyyy')} - ${formatDate(dateRange.value.end, 'MMM d, yyyy')}`],
    ['Project', selectedProject.value],
    [''],
    ['SUMMARY'],
    ['Total Tickets', String(filteredTickets.value.length)],
    ['Total Story Points', String(totalPoints.value)],
    ['Completed Points', String(completedPoints.value)],
    ['Avg Cycle Time (days)', avgCycleTime.value !== null ? String(avgCycleTime.value) : 'N/A'],
    [''],
  ];

  // --- Points distribution section ---
  const pointsHeaderRow = ['POINTS DISTRIBUTION'];
  const pointsColumns = ['Point Size', 'Tickets', '% of Total'];
  const pointsRows = pointsBreakdown.value.map((entry: { label: string; count: number; percentOfTotal: number }) => [
    entry.label,
    String(entry.count),
    String(entry.percentOfTotal) + '%',
  ]);

  // --- Type breakdown section ---
  const typeHeaderRow = ['TYPE BREAKDOWN'];
  const typeColumns = ['Type', 'Tickets', 'Story Points', '% of Points', 'Completed', 'Avg Cycle Time (days)'];
  const typeRows = typeBreakdown.value.map((entry: { type: string; count: number; points: number; percentOfPoints: number; completedCount: number; avgCycleTimeDays: number | null }) => [
    entry.type,
    String(entry.count),
    String(entry.points),
    String(entry.percentOfPoints) + '%',
    String(entry.completedCount),
    entry.avgCycleTimeDays !== null ? String(entry.avgCycleTimeDays) : 'N/A',
  ]);

  // --- Ticket list section ---
  const ticketColumns = ['Key', 'Title', 'Type', 'Points', 'Status', 'Cycle Time (days)', 'Labels', 'Components', 'Assignee'];
  const ticketRows = sortedTickets.value.map((t: Ticket) => [
    t.key,
    t.title,
    t.issueType,
    t.points !== null ? String(t.points) : '',
    t.currentStatus,
    getCycleTimeDays(t) !== null ? String(getCycleTimeDays(t)) : '',
    (t.labels || []).join('; '),
    (t.components || []).join('; '),
    t.assignee.name,
  ]);

  // Build full CSV
  const allRows = [
    ...summaryRows,
    pointsHeaderRow,
    pointsColumns,
    ...pointsRows,
    [''],
    typeHeaderRow,
    typeColumns,
    ...typeRows,
    [''],
    ['ALL TICKETS'],
    ticketColumns,
    ...ticketRows,
  ];

  const csvContent = allRows
    .map((row: string[]) => row.map((cell: string) => escapeCSV(cell)).join(','))
    .join('\n');

  // Trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `sprint-breakdown_${dateLabel}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

// --- Data fetching ---
const refreshData = async () => {
  await fetchData(
    dateRange.value.start,
    dateRange.value.end,
    undefined,
    selectedProject.value
  );
};

watch(
  () => dateRange.value,
  async () => {
    await refreshData();
  },
  { deep: true }
);

watch(selectedProject, async () => {
  if (selectedProject.value) {
    await refreshData();
  }
});

onMounted(async () => {
  await fetchProjects();
  await refreshData();
});
</script>
