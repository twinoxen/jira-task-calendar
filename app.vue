<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navigation -->
    <nav class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center h-12 gap-6">
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
            Sprint Breakdown
          </NuxtLink>
        </div>
      </div>
    </nav>
    <NuxtPage />
  </div>
</template>
