import { createGitHubClient } from '~/server/utils/github';
import type { PullRequest } from '~/types';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const query = getQuery(event);

  const ticketKey = query.ticketKey as string;

  if (!ticketKey) {
    throw createError({
      statusCode: 400,
      message: 'ticketKey parameter is required',
    });
  }

  if (!config.githubToken || !config.githubOrg) {
    throw createError({
      statusCode: 500,
      message: 'GitHub configuration is missing',
    });
  }

  try {
    const githubClient = createGitHubClient(config);

    // Search for PRs that mention this ticket key
    // We'll search for the last 30 days to get a reasonable scope
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const allPrs = await githubClient.searchPullRequests(since);

    // Filter PRs that contain the ticket key
    const matchingPrs = allPrs
      .map((pr) => githubClient.transformToPullRequest(pr))
      .filter((pr) => pr.linkedTicketKeys.includes(ticketKey.toUpperCase()));

    return {
      ticketKey,
      pullRequests: matchingPrs,
      total: matchingPrs.length,
    };
  } catch (error: any) {
    console.error('GitHub Ticket PRs API Error:', error);
    throw createError({
      statusCode: 500,
      message: `Failed to fetch PRs for ticket: ${error.message}`,
    });
  }
});
