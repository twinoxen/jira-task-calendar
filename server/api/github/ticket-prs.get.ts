import { createGitHubClient } from '~/server/utils/github';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const query = getQuery(event);

  const ticketKey = query.ticketKey as string;
  const since = query.since as string;
  const until = query.until as string;

  if (!ticketKey) {
    throw createError({
      statusCode: 400,
      message: 'ticketKey parameter is required',
    });
  }

  if (!config.githubToken || !config.githubOrg) {
    // GitHub not configured — return empty results silently
    return {
      ticketKey,
      pullRequests: [],
      total: 0,
    };
  }

  try {
    const githubClient = createGitHubClient(config);

    // Search all PRs within the ticket's active timespan
    const sinceDate =
      since || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const allPrs = await githubClient.searchPullRequests(sinceDate);

    // Filter PRs that contain the ticket key in title or body
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
