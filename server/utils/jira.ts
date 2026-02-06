// JIRA API client utility
import type { StatusChange } from '~/types';
import type { RuntimeConfig } from 'nuxt/schema';

interface JiraConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
}

export class JiraClient {
  private config: JiraConfig;
  private authHeader: string;

  constructor(config: JiraConfig) {
    this.config = config;
    // JIRA uses Basic Auth with email:apiToken base64 encoded
    this.authHeader =
      'Basic ' +
      Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}/rest/api/3${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: this.authHeader,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`JIRA API Error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async searchIssues(jql: string, fields: string[] = ['*all']) {
    const params = new URLSearchParams({
      jql,
      fields: fields.join(','),
      maxResults: '100',
      expand: 'changelog',
    });

    return this.request<any>(`/search/jql?${params.toString()}`);
  }

  async getIssue(issueIdOrKey: string) {
    return this.request<any>(`/issue/${issueIdOrKey}?expand=changelog`);
  }

  async getUsers(query: string = '') {
    const params = new URLSearchParams({
      query,
      maxResults: '100',
    });
    return this.request<any>(`/users/search?${params.toString()}`);
  }

  async getProjects() {
    const response = await this.request<any[]>('/project');
    return response.map((project: any) => ({
      key: project.key,
      name: project.name,
      id: project.id,
    }));
  }

  parseStatusHistory(issue: any): StatusChange[] {
    const changelog = issue.changelog?.histories || [];
    const statusChanges: StatusChange[] = [];

    for (const history of changelog) {
      for (const item of history.items) {
        if (item.field === 'status') {
          statusChanges.push({
            status: item.toString,
            timestamp: new Date(history.created),
            author: history.author
              ? {
                  id: history.author.accountId,
                  name: history.author.displayName,
                  email: history.author.emailAddress,
                  avatarUrl: history.author.avatarUrls?.['48x48'],
                }
              : undefined,
          });
        }
      }
    }

    return statusChanges.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );
  }

  // Normalize status names to the 3 tracked states
  normalizeStatus(status: string): string | null {
    const normalized = status.toLowerCase().trim();

    // To Do variations
    if (
      normalized === 'to do' ||
      normalized === 'todo' ||
      normalized === 'backlog' ||
      normalized === 'open' ||
      normalized === 'new'
    ) {
      return 'To Do';
    }

    // In Progress variations (including UAT, QA, testing, etc.)
    if (
      normalized === 'in progress' ||
      normalized === 'in development' ||
      normalized === 'in dev' ||
      normalized === 'development' ||
      normalized === 'working' ||
      normalized === 'wip' ||
      normalized === 'active' ||
      normalized === 'uat' ||
      normalized === 'qa' ||
      normalized === 'testing' ||
      normalized === 'in review' ||
      normalized === 'review' ||
      normalized === 'code review'
    ) {
      return 'In Progress';
    }

    // Done variations
    if (
      normalized === 'done' ||
      normalized === 'completed' ||
      normalized === 'complete' ||
      normalized === 'closed' ||
      normalized === 'resolved' ||
      normalized === 'finished' ||
      normalized === 'abandoned'
    ) {
      return 'Done';
    }

    // Return null for untracked statuses
    return null;
  }

  // Parse and filter status history to only tracked states
  parseTrackedStatusHistory(issue: any): StatusChange[] {
    const allChanges = this.parseStatusHistory(issue);
    const trackedChanges: StatusChange[] = [];

    for (const change of allChanges) {
      const normalizedStatus = this.normalizeStatus(change.status);
      if (normalizedStatus) {
        trackedChanges.push({
          ...change,
          status: normalizedStatus,
        });
      }
    }

    // Deduplicate consecutive same statuses
    const deduplicated: StatusChange[] = [];
    for (const change of trackedChanges) {
      const lastChange = deduplicated[deduplicated.length - 1];
      if (!lastChange || lastChange.status !== change.status) {
        deduplicated.push(change);
      }
    }

    return deduplicated;
  }

  parsePointsHistory(
    issue: any
  ): { from: number | null; to: number | null; timestamp: Date }[] {
    const changelog = issue.changelog?.histories || [];
    const pointsChanges: {
      from: number | null;
      to: number | null;
      timestamp: Date;
    }[] = [];

    // The field name in the changelog is "Story Points" or "Story point estimate"
    const pointFieldNames = [
      'Story Points',
      'Story point estimate',
      'story_points',
    ];

    for (const history of changelog) {
      for (const item of history.items) {
        if (pointFieldNames.includes(item.field)) {
          pointsChanges.push({
            from: item.fromString ? Number(item.fromString) : null,
            to: item.toString ? Number(item.toString) : null,
            timestamp: new Date(history.created),
          });
        }
      }
    }

    return pointsChanges.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );
  }

  getStoryPoints(issue: any): number | null {
    // Common story point field names
    const pointFields = [
      'customfield_10028', // Torticity instance
      'customfield_10016', // Most common
      'customfield_10026',
      'customfield_10036',
      'story_points',
    ];

    for (const field of pointFields) {
      if (issue.fields[field] !== undefined && issue.fields[field] !== null) {
        return Number(issue.fields[field]);
      }
    }

    return null;
  }
}

export const createJiraClient = (config: RuntimeConfig) => {
  return new JiraClient({
    baseUrl: config.jiraBaseUrl,
    email: config.jiraEmail,
    apiToken: config.jiraApiToken,
  });
};
