import { createGitHubClient } from '~/server/utils/github';
import type { PullRequest } from '~/types';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const query = getQuery(event);

  const since =
    (query.since as string) ||
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
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
    const prs = await githubClient.searchPullRequests(since, repos);

    // Transform to PullRequest format
    const pullRequests: PullRequest[] = prs.map((pr) =>
      githubClient.transformToPullRequest(pr)
    );

    return {
      pullRequests,
      total: pullRequests.length,
    };
  } catch (error: any) {
    console.error('GitHub API Error:', error);
    throw createError({
      statusCode: 500,
      message: `Failed to fetch GitHub PRs: ${error.message}`,
    });
  }
});
