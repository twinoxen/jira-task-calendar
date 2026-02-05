import { ref, computed } from 'vue';
import type { StatusConfig, AppConfig } from '~/types';

export const useConfig = () => {
  // Default status configurations - simplified to 3 tracked states
  const defaultStatusConfigs: StatusConfig[] = [
    { name: 'To Do', color: '#94a3b8', tracked: true },
    { name: 'In Progress', color: '#3b82f6', tracked: true },
    { name: 'Done', color: '#10b981', tracked: true },
  ];

  const statusConfigs = ref<StatusConfig[]>(defaultStatusConfigs);
  const weekStartsOn = ref<0 | 1>(1); // Default to Monday

  const appConfig = computed<AppConfig>(() => ({
    statusConfigs: statusConfigs.value,
    weekStartsOn: weekStartsOn.value,
  }));

  const getStatusColor = (statusName: string): string => {
    const config = statusConfigs.value.find(
      (s) => s.name.toLowerCase() === statusName.toLowerCase()
    );
    return config?.color || '#8b5cf6'; // Default purple for unknown statuses
  };

  const isStatusTracked = (statusName: string): boolean => {
    const config = statusConfigs.value.find(
      (s) => s.name.toLowerCase() === statusName.toLowerCase()
    );
    return config?.tracked ?? true; // Default to tracked if not configured
  };

  const updateStatusConfig = (index: number, config: Partial<StatusConfig>) => {
    if (statusConfigs.value[index]) {
      statusConfigs.value[index] = { ...statusConfigs.value[index], ...config };
    }
  };

  const addStatusConfig = (config: StatusConfig) => {
    statusConfigs.value.push(config);
  };

  const removeStatusConfig = (index: number) => {
    statusConfigs.value.splice(index, 1);
  };

  return {
    statusConfigs,
    weekStartsOn,
    appConfig,
    getStatusColor,
    isStatusTracked,
    updateStatusConfig,
    addStatusConfig,
    removeStatusConfig,
  };
};
