import { createJiraClient } from '~/server/utils/jira';
import type { Ticket, User, StatusChange, StateSegment } from '~/types';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const query = getQuery(event);

  // Get query parameters
  const startDate = (query.startDate as string) || new Date().toISOString();
  const endDate = (query.endDate as string) || new Date().toISOString();
  const users = query.users ? (query.users as string).split(',') : [];
  const projectKey = (query.project as string) || config.jiraBoard || '';

  if (!config.jiraBaseUrl || !config.jiraEmail || !config.jiraApiToken) {
    throw createError({
      statusCode: 500,
      message:
        'JIRA configuration is missing. Please set JIRA_BASE_URL, JIRA_EMAIL, and JIRA_API_TOKEN environment variables.',
    });
  }

  try {
    const jiraClient = createJiraClient(config);

    // Build JQL query - filter by project
    let jql = '';

    if (projectKey) {
      // Support both project key and board ID
      const boardFilter = projectKey.includes('-')
        ? `project = "${projectKey.split('-')[0]}"` // Extract project key
        : `project = "${projectKey}"`;
      jql = boardFilter;
    }

    // Date filter: capture any ticket that was relevant during the date range
    // - created during the range
    // - updated during the range
    // - had a status change during the range
    // - was still open (not Done/Closed/Resolved) at the start of the range
    //   (catches tickets sitting in progress with no recent activity)
    const dateFilter = `(created >= "${startDate}" OR updated >= "${startDate}" OR status changed DURING ("${startDate}", "${endDate}") OR (created <= "${endDate}" AND status NOT IN (Done, Closed, Resolved)))`;

    if (jql) {
      jql += ` AND ${dateFilter}`;
    } else {
      jql = dateFilter;
    }

    // Add user filter if provided
    if (users.length > 0) {
      const userFilter = users.map((u) => `"${u}"`).join(', ');
      jql += ` AND assignee in (${userFilter})`;
    }

    jql += ' ORDER BY updated DESC';

    console.log(`[JIRA] Fetching tickets with JQL: ${jql}`);

    // Fetch issues
    const response = await jiraClient.searchIssues(jql, [
      'summary',
      'assignee',
      'status',
      'created',
      'updated',
      'description',
      'customfield_10028', // Story points
      'issuetype',
      'labels',
      'components',
    ]);

    // Helper function to get status color
    const getStatusColor = (status: string): string => {
      const statusColors: Record<string, string> = {
        'To Do': '#94a3b8',
        'In Progress': '#3b82f6',
        Done: '#10b981',
      };
      return statusColors[status] || '#8b5cf6';
    };

    // Helper function to calculate state segments from status history
    const calculateStateSegments = (
      trackedHistory: StatusChange[]
    ): StateSegment[] => {
      const segments: StateSegment[] = [];

      for (let i = 0; i < trackedHistory.length; i++) {
        const change = trackedHistory[i];
        const nextChange = trackedHistory[i + 1];

        // If there's a next change, use that as the end date
        let segmentEndDate = nextChange ? nextChange.timestamp : null;

        // If this is the last segment and it's "Done", set end date to the completion date
        // A "Done" status means the ticket is complete and should not extend indefinitely
        if (!nextChange && change.status === 'Done') {
          segmentEndDate = change.timestamp;
        }

        segments.push({
          status: change.status,
          startDate: change.timestamp,
          endDate: segmentEndDate,
          color: getStatusColor(change.status),
        });
      }

      return segments;
    };

    // Transform issues to Ticket format
    const tickets: Ticket[] = response.issues.map((issue: any) => {
      const assignee: User = issue.fields.assignee
        ? {
            id: issue.fields.assignee.accountId,
            name: issue.fields.assignee.displayName,
            email: issue.fields.assignee.emailAddress || '',
            avatarUrl: issue.fields.assignee.avatarUrls?.['48x48'],
          }
        : {
            id: 'unassigned',
            name: 'Unassigned',
            email: '',
          };

      // Get all status history (for full display)
      const statusHistory = jiraClient.parseStatusHistory(issue);

      // Get filtered and normalized status history (tracked states only)
      const trackedHistory = jiraClient.parseTrackedStatusHistory(issue);
      const storyPoints = jiraClient.getStoryPoints(issue);
      const pointsHistory = jiraClient.parsePointsHistory(issue);

      // Calculate state segments for timeline visualization
      const stateSegments = calculateStateSegments(trackedHistory);

      // Determine overall start/end dates
      let ticketStartDate = new Date(issue.fields.created);
      let ticketEndDate: Date | null = null;

      if (trackedHistory.length > 0) {
        // Start date is when ticket first entered a tracked state
        ticketStartDate = trackedHistory[0].timestamp;

        // End date is when ticket reached "Done" state
        const doneSegment = stateSegments.find((seg) => seg.status === 'Done');
        if (doneSegment) {
          ticketEndDate = doneSegment.startDate;
        }
      }

      // Normalize current status
      const normalizedCurrentStatus =
        jiraClient.normalizeStatus(issue.fields.status.name) ||
        issue.fields.status.name;

      return {
        key: issue.key,
        title: issue.fields.summary,
        points: storyPoints,
        pointsHistory,
        assignee,
        startDate: ticketStartDate,
        endDate: ticketEndDate,
        statusHistory,
        currentStatus: normalizedCurrentStatus,
        stateSegments,
        prs: [], // Will be populated by the aggregation layer
        description: issue.fields.description,
        jiraUrl: `${config.jiraBaseUrl}/browse/${issue.key}`,
        issueType: issue.fields.issuetype?.name || 'Unknown',
        labels: issue.fields.labels || [],
        components: (issue.fields.components || []).map((c: any) => c.name),
      };
    });

    console.log(`[JIRA] Fetched ${tickets.length} tickets from API`);

    return {
      tickets,
      total: tickets.length,
    };
  } catch (error: any) {
    console.error('JIRA API Error:', error);
    throw createError({
      statusCode: 500,
      message: `Failed to fetch JIRA tickets: ${error.message}`,
    });
  }
});
