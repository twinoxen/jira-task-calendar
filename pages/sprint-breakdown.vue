<template>
  <div>
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Breakdown</h1>
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
              :value="formatLocalDate(customStartDate)"
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
              :value="formatLocalDate(customEndDate)"
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
          <!-- Column 1: Team Members -->
          <div>
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

        <!-- Breakdown Sections: 2-column grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div
            v-for="section in breakdownSections"
            :key="section.key"
            class="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <h3 class="text-lg font-semibold text-gray-900 mb-4">
              {{ section.title }}
            </h3>

            <div v-if="section.data.length === 0" class="text-sm text-gray-500 py-8 text-center">
              No data for this period.
            </div>

            <template v-else>
              <!-- Row 1: Donut chart centered -->
              <div class="flex justify-center mb-5">
                <div class="relative">
                  <svg width="180" height="180" viewBox="0 0 180 180">
                    <circle cx="90" cy="90" r="70" fill="none" stroke="#f3f4f6" stroke-width="24" />
                    <circle
                      v-for="(seg, i) in donutSegments(section.data, section.colors)"
                      :key="i"
                      cx="90" cy="90" r="70"
                      fill="none"
                      :stroke="seg.color"
                      :stroke-width="hoveredSection === section.key && hoveredIndex === i ? 28 : 24"
                      :stroke-dasharray="seg.dashArray"
                      :stroke-dashoffset="seg.dashOffset"
                      stroke-linecap="butt"
                      class="transition-all duration-200"
                      :style="{
                        transform: 'rotate(-90deg)',
                        transformOrigin: '90px 90px',
                        opacity: hoveredSection === section.key && hoveredIndex !== null && hoveredIndex !== i ? 0.35 : 1,
                      }"
                    />
                  </svg>
                  <!-- Center label -->
                  <div class="absolute inset-0 flex flex-col items-center justify-center">
                    <span class="text-xl font-bold text-gray-900">{{ section.totalPoints }}</span>
                    <span class="text-xs text-gray-500">pts</span>
                  </div>
                </div>
              </div>

              <!-- Row 2: Full-width breakdown table -->
              <div class="space-y-0">
                <div
                  v-for="(entry, i) in section.data"
                  :key="entry.name"
                  class="flex items-center gap-3 py-2 px-2 -mx-2 rounded-md border-b border-gray-50 last:border-0 cursor-default transition-colors duration-150"
                  :class="hoveredSection === section.key && hoveredIndex === i ? 'bg-gray-50' : ''"
                  @mouseenter="hoveredSection = section.key; hoveredIndex = i"
                  @mouseleave="hoveredSection = null; hoveredIndex = null"
                >
                  <!-- Color dot -->
                  <span
                    class="w-3 h-3 rounded-sm flex-shrink-0"
                    :style="{ backgroundColor: section.colors[i % section.colors.length] }"
                  ></span>
                  <!-- Name + ticket count -->
                  <div class="min-w-0 flex-1">
                    <span class="text-sm font-medium text-gray-900">{{ entry.name }}</span>
                    <span class="text-xs text-gray-400 ml-2">
                      {{ entry.count }} {{ entry.count === 1 ? 'ticket' : 'tickets' }}
                    </span>
                  </div>
                  <!-- Stats -->
                  <div class="flex items-center gap-4 text-xs flex-shrink-0">
                    <span class="font-semibold text-gray-900 min-w-[32px] text-right">{{ entry.percentOfPoints }}%</span>
                    <span>
                      <span class="text-gray-400">Pts:</span>
                      <span class="font-semibold text-gray-900 ml-0.5">{{ entry.points }}</span>
                    </span>
                    <span>
                      <span class="text-gray-400">Done:</span>
                      <span class="font-semibold text-gray-900 ml-0.5">{{ entry.completedCount }}</span>
                    </span>
                    <span class="min-w-[65px] text-right">
                      <span class="text-gray-400">Cycle:</span>
                      <span class="font-semibold text-gray-900 ml-0.5">{{
                        entry.avgCycleTimeDays !== null ? entry.avgCycleTimeDays + 'd' : '--'
                      }}</span>
                    </span>
                  </div>
                </div>
              </div>
            </template>
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

// --- Project selection (shared via composable) ---
const { selectedProject } = useProjectSelection();

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
  memberBreakdown,
  labelBreakdown,
  componentBreakdown,
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

const memberBadgeClass = (_name: string): string => 'bg-blue-50 text-blue-800';
const labelBadgeClass = (_label: string): string => 'bg-gray-100 text-gray-800';
const componentBadgeClass = (_comp: string): string => 'bg-teal-50 text-teal-800';

// --- Donut chart colors ---
const TYPE_COLORS = ['#3b82f6', '#ef4444', '#8b5cf6', '#6b7280', '#6366f1', '#f97316', '#14b8a6', '#ec4899'];
const MEMBER_COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#06b6d4', '#0ea5e9', '#2563eb', '#7c3aed', '#4f46e5'];
const LABEL_COLORS = ['#f59e0b', '#d97706', '#b45309', '#92400e', '#fbbf24', '#f97316', '#ea580c', '#c2410c'];
const COMPONENT_COLORS = ['#14b8a6', '#0d9488', '#0f766e', '#115e59', '#2dd4bf', '#5eead4', '#99f6e4', '#06b6d4'];

// --- Hover state for breakdown sections ---
const hoveredSection = ref<string | null>(null);
const hoveredIndex = ref<number | null>(null);

// --- Donut segment calculator ---
const donutSegments = (
  data: Array<{ percentOfPoints: number }>,
  colors: string[]
) => {
  const circumference = 2 * Math.PI * 70; // r=70
  let cumulativeOffset = 0;
  return data.map((entry, i) => {
    const segLen = (entry.percentOfPoints / 100) * circumference;
    const gap = data.length > 1 ? 2 : 0;
    const seg = {
      color: colors[i % colors.length],
      dashArray: `${Math.max(segLen - gap, 0)} ${circumference - Math.max(segLen - gap, 0)}`,
      dashOffset: `${-cumulativeOffset}`,
    };
    cumulativeOffset += segLen;
    return seg;
  });
};

// --- Breakdown sections ---
const breakdownSections = computed(() => [
  {
    key: 'type',
    title: 'Breakdown by Ticket Type',
    data: typeBreakdown.value,
    badgeClass: typeColorClass,
    colors: TYPE_COLORS,
    totalPoints: typeBreakdown.value.reduce((s: number, e: { points: number }) => s + e.points, 0),
  },
  {
    key: 'member',
    title: 'Breakdown by Team Member',
    data: memberBreakdown.value,
    badgeClass: memberBadgeClass,
    colors: MEMBER_COLORS,
    totalPoints: memberBreakdown.value.reduce((s: number, e: { points: number }) => s + e.points, 0),
  },
  {
    key: 'label',
    title: 'Breakdown by Label',
    data: labelBreakdown.value,
    badgeClass: labelBadgeClass,
    colors: LABEL_COLORS,
    totalPoints: labelBreakdown.value.reduce((s: number, e: { points: number }) => s + e.points, 0),
  },
  {
    key: 'component',
    title: 'Breakdown by Component',
    data: componentBreakdown.value,
    badgeClass: componentBadgeClass,
    colors: COMPONENT_COLORS,
    totalPoints: componentBreakdown.value.reduce((s: number, e: { points: number }) => s + e.points, 0),
  },
]);

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
    ['Breakdown Report'],
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

  // --- Breakdown sections helper ---
  const breakdownColumns = ['Name', 'Tickets', 'Story Points', '% of Points', 'Completed', 'Avg Cycle Time (days)'];
  const formatBreakdownRows = (data: Array<{ name: string; count: number; points: number; percentOfPoints: number; completedCount: number; avgCycleTimeDays: number | null }>): string[][] =>
    data.map((entry) => [
      entry.name,
      String(entry.count),
      String(entry.points),
      String(entry.percentOfPoints) + '%',
      String(entry.completedCount),
      entry.avgCycleTimeDays !== null ? String(entry.avgCycleTimeDays) : 'N/A',
    ]);

  const typeRows = formatBreakdownRows(typeBreakdown.value);
  const memberRows = formatBreakdownRows(memberBreakdown.value);
  const labelRows = formatBreakdownRows(labelBreakdown.value);
  const componentRows = formatBreakdownRows(componentBreakdown.value);

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
    ['BREAKDOWN BY TICKET TYPE'],
    breakdownColumns,
    ...typeRows,
    [''],
    ['BREAKDOWN BY TEAM MEMBER'],
    breakdownColumns,
    ...memberRows,
    [''],
    ['BREAKDOWN BY LABEL'],
    breakdownColumns,
    ...labelRows,
    [''],
    ['BREAKDOWN BY COMPONENT'],
    breakdownColumns,
    ...componentRows,
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
  if (selectedProject.value) {
    await refreshData();
  }
});
</script>
