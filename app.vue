<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Global Error Banner -->
    <Transition name="error-banner">
      <div
        v-if="globalError"
        class="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/40 backdrop-blur-sm"
        @click.self="clearError"
      >
        <div
          class="w-full max-w-xl bg-white rounded-xl shadow-2xl border-2 border-red-400 overflow-hidden"
        >
          <!-- Red header bar -->
          <div class="bg-red-600 px-5 py-3 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
              </svg>
              <span class="text-white font-bold text-sm tracking-wide uppercase">
                {{ globalError.isAuthError ? 'Authentication Error' : 'Connection Error' }}
              </span>
            </div>
            <button @click="clearError" class="text-red-100 hover:text-white transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="px-5 py-4">
            <template v-if="globalError.isAuthError">
              <p class="text-gray-900 font-semibold text-base mb-1">
                Your Jira API token has expired or is invalid.
              </p>
              <p class="text-gray-600 text-sm mb-4">
                Generate a new token and paste it into your <code class="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">.env</code> file as <code class="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">JIRA_API_TOKEN</code>, then restart the dev server.
              </p>
              <a
                href="https://id.atlassian.com/manage-profile/security/api-tokens"
                target="_blank"
                rel="noopener"
                class="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Generate New Token
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </template>
            <template v-else>
              <p class="text-gray-900 font-semibold text-base mb-2">
                Failed to load data from Jira.
              </p>
              <p class="text-gray-600 text-sm font-mono bg-gray-50 rounded-lg p-3 border border-gray-200 break-words">
                {{ globalError.message }}
              </p>
            </template>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Navigation -->
    <nav class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center h-12 gap-6">
          <!-- Page links -->
          <NuxtLink
            to="/"
            class="text-sm font-medium transition-colors"
            :class="
              $route.path === '/'
                ? 'text-blue-600 border-b-2 border-blue-600 pb-[13px] pt-[15px]'
                : 'text-gray-600 hover:text-gray-900'
            "
          >
            Timeline
          </NuxtLink>
          <NuxtLink
            to="/sprint-breakdown"
            class="text-sm font-medium transition-colors"
            :class="
              $route.path === '/sprint-breakdown'
                ? 'text-blue-600 border-b-2 border-blue-600 pb-[13px] pt-[15px]'
                : 'text-gray-600 hover:text-gray-900'
            "
          >
            Breakdown
          </NuxtLink>
          <NuxtLink
            to="/open-prs"
            class="text-sm font-medium transition-colors"
            :class="
              $route.path === '/open-prs'
                ? 'text-blue-600 border-b-2 border-blue-600 pb-[13px] pt-[15px]'
                : 'text-gray-600 hover:text-gray-900'
            "
          >
            Open PRs
          </NuxtLink>

          <!-- Spacer -->
          <div class="flex-1"></div>

          <!-- Project selector (not relevant on Open PRs page) -->
          <div v-if="$route.path !== '/open-prs'" class="flex items-center gap-2">
            <label class="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Project
            </label>
            <select
              v-model="selectedProject"
              :disabled="loadingProjects || availableProjects.length === 0"
              class="rounded-md border border-gray-300 bg-white py-1 pl-2 pr-7 text-sm font-medium text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            >
              <option value="" disabled>
                {{ loadingProjects ? 'Loading...' : 'Select project' }}
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
        </div>
      </div>
    </nav>
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

const { availableProjects, selectedProject, loadingProjects, fetchProjects } =
  useProjectSelection();

const { globalError, clearError } = useGlobalError();

onMounted(async () => {
  await fetchProjects();
});
</script>

<style scoped>
.error-banner-enter-active,
.error-banner-leave-active {
  transition: opacity 0.2s ease;
}
.error-banner-enter-from,
.error-banner-leave-to {
  opacity: 0;
}
</style>
