import { createGitHubClient } from '~/server/utils/github';
import type { PullRequest } from '~/types';

export interface AuthorWithPRs {
  author: string;
  avatarUrl?: string;
  pullRequests: PullRequest[];
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const query = getQuery(event);

  const repos = query.repos ? (query.repos as string).split(',') : undefined;

  if (!config.githubToken || !config.githubOrg) {
    throw createError({
      statusCode: 500,
      message:
        'GitHub configuration is missing. Please set GITHUB_TOKEN and GITHUB_ORG environment variables.',
    });
  }

  try {
    const githubClient = createGitHubClient(config);

    const since = new Date(
      Date.now() - 365 * 24 * 60 * 60 * 1000
    ).toISOString();

    const prs = await githubClient.searchPullRequests(since, repos, 'open');

    const pullRequests: PullRequest[] = prs.map((pr) =>
      githubClient.transformToPullRequest(pr)
    );

    const byAuthor = new Map<string, AuthorWithPRs>();
    for (const pr of pullRequests) {
      const existing = byAuthor.get(pr.author);
      if (existing) {
        existing.pullRequests.push(pr);
        if (!existing.avatarUrl && pr.authorAvatarUrl) {
          existing.avatarUrl = pr.authorAvatarUrl;
        }
      } else {
        byAuthor.set(pr.author, {
          author: pr.author,
          avatarUrl: pr.authorAvatarUrl,
          pullRequests: [pr],
        });
      }
    }

    const leaderboard = Array.from(byAuthor.values()).sort(
      (a, b) => b.pullRequests.length - a.pullRequests.length
    );

    return {
      leaderboard,
      totalOpenPRs: pullRequests.length,
      totalAuthors: leaderboard.length,
    };
  } catch (error: any) {
    console.error('GitHub API Error:', error);
    throw createError({
      statusCode: 500,
      message: `Failed to fetch open PRs: ${error.message}`,
    });
  }
});
