<template>
  <div class="min-h-screen bg-gray-50">
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

          <!-- Spacer -->
          <div class="flex-1"></div>

          <!-- Project selector -->
          <div class="flex items-center gap-2">
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

onMounted(async () => {
  await fetchProjects();
});
</script>
