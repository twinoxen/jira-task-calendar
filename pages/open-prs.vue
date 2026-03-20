<template>
  <div>
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Open PRs</h1>
            <p class="text-sm text-gray-500 mt-1">
              Leaderboard of open pull requests across the organization
            </p>
          </div>
          <div class="flex items-center gap-3">
            <div
              v-if="!loading && leaderboard.length > 0"
              class="text-sm text-gray-500"
            >
              {{ totalOpenPRs }} open across {{ leaderboard.length }}
              {{ leaderboard.length === 1 ? 'author' : 'authors' }}
            </div>
            <button
              @click="refresh"
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
              {{ loading ? 'Loading...' : 'Refresh' }}
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <!-- Loading state -->
      <div
        v-if="loading && leaderboard.length === 0"
        class="flex flex-col items-center justify-center py-24"
      >
        <svg
          class="animate-spin h-8 w-8 text-blue-500 mb-4"
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
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <p class="text-gray-500 text-sm">Fetching open pull requests...</p>
      </div>

      <!-- Error state -->
      <div
        v-else-if="error"
        class="bg-red-50 border border-red-200 rounded-lg p-6 text-center"
      >
        <svg
          class="w-8 h-8 text-red-400 mx-auto mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        <p class="text-red-800 font-medium">Failed to load open PRs</p>
        <p class="text-red-600 text-sm mt-1">{{ error.message }}</p>
        <button @click="refresh" class="btn-primary mt-4">Try again</button>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="!loading && leaderboard.length === 0"
        class="flex flex-col items-center justify-center py-24"
      >
        <svg
          class="w-12 h-12 text-gray-300 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p class="text-gray-500 font-medium">No open pull requests</p>
        <p class="text-gray-400 text-sm mt-1">
          Everyone's PRs are merged — nice work!
        </p>
      </div>

      <!-- Leaderboard -->
      <div v-else class="space-y-2">
        <div
          v-for="(entry, index) in leaderboard"
          :key="entry.author"
          class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
        >
          <!-- Author row -->
          <button
            @click="toggle(entry.author)"
            class="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
          >
            <!-- Rank -->
            <span
              class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              :class="rankClass(index)"
            >
              {{ index + 1 }}
            </span>

            <!-- Avatar -->
            <img
              v-if="entry.avatarUrl"
              :src="entry.avatarUrl"
              :alt="entry.author"
              class="w-10 h-10 rounded-full flex-shrink-0"
            />
            <span
              v-else
              class="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0"
            >
              {{ entry.author.charAt(0).toUpperCase() }}
            </span>

            <!-- Name -->
            <span class="font-medium text-gray-900 min-w-0 truncate">
              {{ entry.author }}
            </span>

            <!-- Bar -->
            <div class="flex-1 mx-4">
              <div class="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-500"
                  :class="barColor(index)"
                  :style="{ width: barWidth(entry.pullRequests.length) }"
                />
              </div>
            </div>

            <!-- Count -->
            <span
              class="flex-shrink-0 text-sm font-semibold tabular-nums"
              :class="countColor(index)"
            >
              {{ entry.pullRequests.length }}
              {{ entry.pullRequests.length === 1 ? 'PR' : 'PRs' }}
            </span>

            <!-- Chevron -->
            <svg
              class="w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200"
              :class="{ 'rotate-180': expanded.has(entry.author) }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          <!-- Expanded PR list -->
          <Transition name="expand">
            <div
              v-if="expanded.has(entry.author)"
              class="border-t border-gray-100"
            >
              <table class="w-full text-sm">
                <thead>
                  <tr class="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th class="px-5 py-2">Repository</th>
                    <th class="px-5 py-2">Pull Request</th>
                    <th class="px-5 py-2 text-right">Age</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr
                    v-for="pr in entry.pullRequests"
                    :key="pr.number"
                    class="hover:bg-gray-50 transition-colors"
                  >
                    <td class="px-5 py-3 text-gray-500 font-mono text-xs whitespace-nowrap">
                      {{ pr.repo || '—' }}
                    </td>
                    <td class="px-5 py-3 min-w-0">
                      <a
                        :href="pr.url"
                        target="_blank"
                        rel="noopener"
                        class="text-blue-600 hover:text-blue-800 hover:underline font-medium truncate block"
                      >
                        #{{ pr.number }} {{ pr.title }}
                      </a>
                    </td>
                    <td class="px-5 py-3 text-right whitespace-nowrap">
                      <span
                        class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                        :class="ageClass(pr.createdAt)"
                      >
                        {{ formatAge(pr.createdAt) }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Transition>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const { leaderboard, totalOpenPRs, loading, error, fetchOpenPRs } =
  useOpenPRs();

const expanded = ref<Set<string>>(new Set());

const toggle = (author: string) => {
  const next = new Set(expanded.value);
  if (next.has(author)) {
    next.delete(author);
  } else {
    next.add(author);
  }
  expanded.value = next;
};

const refresh = () => fetchOpenPRs();

onMounted(() => fetchOpenPRs());

const maxPRs = computed(() =>
  Math.max(1, ...leaderboard.value.map((e) => e.pullRequests.length))
);

const barWidth = (count: number) =>
  `${Math.round((count / maxPRs.value) * 100)}%`;

const rankClass = (index: number) => {
  if (index === 0) return 'bg-amber-100 text-amber-700';
  if (index === 1) return 'bg-gray-200 text-gray-600';
  if (index === 2) return 'bg-orange-100 text-orange-600';
  return 'bg-gray-100 text-gray-500';
};

const barColor = (index: number) => {
  if (index === 0) return 'bg-amber-400';
  if (index === 1) return 'bg-gray-400';
  if (index === 2) return 'bg-orange-400';
  return 'bg-blue-400';
};

const countColor = (index: number) => {
  if (index === 0) return 'text-amber-700';
  if (index === 1) return 'text-gray-600';
  if (index === 2) return 'text-orange-600';
  return 'text-gray-700';
};

const formatAge = (createdAt: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - new Date(createdAt).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return '1 day';
  if (diffDays < 7) return `${diffDays} days`;
  const weeks = Math.floor(diffDays / 7);
  if (weeks === 1) return '1 week';
  if (diffDays < 30) return `${weeks} weeks`;
  const months = Math.floor(diffDays / 30);
  if (months === 1) return '1 month';
  return `${months} months`;
};

const ageClass = (createdAt: Date) => {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 2) return 'bg-green-100 text-green-700';
  if (diffDays <= 7) return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
};
</script>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}
.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 1000px;
}
</style>
