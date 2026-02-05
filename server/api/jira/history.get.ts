import { createJiraClient } from '~/server/utils/jira';
import type { StatusChange } from '~/types';

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

  if (!config.jiraBaseUrl || !config.jiraEmail || !config.jiraApiToken) {
    throw createError({
      statusCode: 500,
      message: 'JIRA configuration is missing',
    });
  }

  try {
    const jiraClient = createJiraClient(config);
    const issue = await jiraClient.getIssue(ticketKey);

    const statusHistory = jiraClient.parseStatusHistory(issue);

    return {
      ticketKey,
      statusHistory,
    };
  } catch (error: any) {
    console.error('JIRA History API Error:', error);
    throw createError({
      statusCode: 500,
      message: `Failed to fetch ticket history: ${error.message}`,
    });
  }
});
