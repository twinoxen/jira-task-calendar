import { ref } from 'vue';

// Module-level state — shared across all components that call useProjectSelection()
const availableProjects = ref<Array<{ key: string; name: string; id: string }>>([]);
const selectedProject = ref<string>('');
const loadingProjects = ref(false);
const projectsFetched = ref(false);

export const useProjectSelection = () => {
  const fetchProjects = async () => {
    // Only fetch once
    if (projectsFetched.value) return;

    loadingProjects.value = true;
    try {
      const response = (await $fetch('/api/jira/projects')) as any;
      availableProjects.value = response.projects || [];

      // Auto-select first project if none selected
      if (availableProjects.value.length > 0 && !selectedProject.value) {
        selectedProject.value = availableProjects.value[0].key;
      }

      projectsFetched.value = true;
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      loadingProjects.value = false;
    }
  };

  return {
    availableProjects,
    selectedProject,
    loadingProjects,
    fetchProjects,
  };
};
