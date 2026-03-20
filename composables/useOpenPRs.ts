import { ref } from 'vue';
import type { PullRequest } from '~/types';

export interface LeaderboardEntry {
  author: string;
  avatarUrl?: string;
  pullRequests: PullRequest[];
}

export const useOpenPRs = () => {
  const leaderboard = ref<LeaderboardEntry[]>([]);
  const totalOpenPRs = ref(0);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  const fetchOpenPRs = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = (await $fetch('/api/github/open-prs')) as any;

      leaderboard.value = response.leaderboard.map((entry: any) => ({
        ...entry,
        pullRequests: entry.pullRequests.map((pr: any) => ({
          ...pr,
          createdAt: new Date(pr.createdAt),
          mergedAt: pr.mergedAt ? new Date(pr.mergedAt) : undefined,
          closedAt: pr.closedAt ? new Date(pr.closedAt) : undefined,
        })),
      }));

      totalOpenPRs.value = response.totalOpenPRs;
    } catch (err: any) {
      error.value = err;
      console.error('Error fetching open PRs:', err);
    } finally {
      loading.value = false;
    }
  };

  return {
    leaderboard,
    totalOpenPRs,
    loading,
    error,
    fetchOpenPRs,
  };
};
