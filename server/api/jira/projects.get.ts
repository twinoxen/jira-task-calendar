import { createJiraClient } from '~/server/utils/jira';

export default defineEventHandler(async () => {
  const config = useRuntimeConfig();

  if (!config.jiraBaseUrl || !config.jiraEmail || !config.jiraApiToken) {
    throw createError({
      statusCode: 500,
      message: 'JIRA configuration is missing',
    });
  }

  try {
    const jiraClient = createJiraClient(config);
    const projects = await jiraClient.getProjects();

    return {
      projects,
      total: projects.length,
    };
  } catch (error: any) {
    console.error('JIRA Projects API Error:', error);
    throw createError({
      statusCode: 500,
      message: `Failed to fetch JIRA projects: ${error.message}`,
    });
  }
});
