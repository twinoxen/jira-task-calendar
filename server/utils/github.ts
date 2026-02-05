// GitHub API client utility
import { Octokit } from '@octokit/rest';
import type { PullRequest } from '~/types';

export class GitHubClient {
  private octokit: Octokit;
  private org: string;
  private repos: string[];

  constructor(token: string, org: string, repos: string = '') {
    this.octokit = new Octokit({ auth: token });
    this.org = org;
    this.repos = repos ? repos.split(',').map((r) => r.trim()) : [];
  }

  async searchPullRequests(since: string, repos?: string[]): Promise<any[]> {
    const targetRepos = repos || this.repos;
    const allPRs: any[] = [];

    if (targetRepos.length === 0) {
      // Search across the entire org
      const sinceDate = new Date(since).toISOString();
      const query = `org:${this.org} is:pr created:>=${sinceDate}`;

      try {
        const response = await this.octokit.search.issuesAndPullRequests({
          q: query,
          per_page: 100,
          sort: 'created',
          order: 'desc',
        });

        return response.data.items;
      } catch (error) {
        console.error('GitHub search error:', error);
        return [];
      }
    }

    // Search specific repos
    for (const repo of targetRepos) {
      try {
        const response = await this.octokit.pulls.list({
          owner: this.org,
          repo,
          state: 'all',
          sort: 'created',
          direction: 'desc',
          per_page: 100,
        });

        allPRs.push(...response.data);
      } catch (error) {
        console.error(`GitHub error for repo ${repo}:`, error);
      }
    }

    return allPRs;
  }

  async searchPullRequestsByAuthor(
    since: string,
    author?: string,
    until?: string
  ): Promise<any[]> {
    const targetRepos = this.repos;
    const sinceDate = new Date(since).toISOString().split('T')[0];

    if (targetRepos.length === 0) {
      // Search across the entire org
      let query = `org:${this.org} is:pr created:>=${sinceDate}`;
      if (author) {
        query += ` author:${author}`;
      }
      if (until) {
        const untilDate = new Date(until).toISOString().split('T')[0];
        query = query.replace(
          `created:>=${sinceDate}`,
          `created:${sinceDate}..${untilDate}`
        );
      }

      try {
        const response = await this.octokit.search.issuesAndPullRequests({
          q: query,
          per_page: 100,
          sort: 'created',
          order: 'desc',
        });
        return response.data.items;
      } catch (error) {
        console.error('GitHub search error:', error);
        return [];
      }
    }

    // Search specific repos — filter by author and date client-side
    const allPRs: any[] = [];
    for (const repo of targetRepos) {
      try {
        const response = await this.octokit.pulls.list({
          owner: this.org,
          repo,
          state: 'all',
          sort: 'created',
          direction: 'desc',
          per_page: 100,
        });

        const filtered = response.data.filter((pr) => {
          const createdAt = new Date(pr.created_at);
          const sinceCheck = createdAt >= new Date(since);
          const untilCheck = until ? createdAt <= new Date(until) : true;
          const authorCheck = author
            ? pr.user?.login?.toLowerCase() === author.toLowerCase()
            : true;
          return sinceCheck && untilCheck && authorCheck;
        });

        allPRs.push(...filtered);
      } catch (error) {
        console.error(`GitHub error for repo ${repo}:`, error);
      }
    }

    return allPRs;
  }

  async getPullRequest(
    owner: string,
    repo: string,
    prNumber: number
  ): Promise<any> {
    const response = await this.octokit.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
    });

    return response.data;
  }

  extractTicketKeys(text: string): string[] {
    // Match JIRA ticket pattern: PROJECT-123
    const regex = /\b[A-Z]+-\d+\b/gi;
    const matches = text.match(regex) || [];

    // Return unique ticket keys
    return [...new Set(matches.map((m) => m.toUpperCase()))];
  }

  transformToPullRequest(pr: any): PullRequest {
    const ticketKeys = this.extractTicketKeys(`${pr.title} ${pr.body || ''}`);

    // Extract repo name from various sources
    const repo =
      pr.base?.repo?.name ||
      pr.repository_url?.split('/').pop() ||
      pr.html_url?.match(/github\.com\/[^/]+\/([^/]+)/)?.[1] ||
      undefined;

    return {
      number: pr.number,
      title: pr.title,
      url: pr.html_url,
      repo,
      author: pr.user?.login || 'unknown',
      authorAvatarUrl: pr.user?.avatar_url,
      createdAt: new Date(pr.created_at),
      mergedAt: pr.merged_at ? new Date(pr.merged_at) : undefined,
      closedAt: pr.closed_at ? new Date(pr.closed_at) : undefined,
      status: pr.merged_at
        ? 'merged'
        : pr.state === 'closed'
        ? 'closed'
        : 'open',
      linkedTicketKeys: ticketKeys,
      // These fields are only present when fetching individual PR details
      additions: pr.additions,
      deletions: pr.deletions,
      changedFiles: pr.changed_files,
    };
  }

  /**
   * Enrich a PullRequest with stats (additions, deletions, changed files)
   * by fetching the full PR details from the GitHub API.
   */
  async enrichPRWithStats(pr: PullRequest): Promise<PullRequest> {
    if (pr.additions !== undefined && pr.deletions !== undefined) {
      return pr; // Already has stats
    }

    try {
      const repo = pr.repo || pr.url?.match(/github\.com\/[^/]+\/([^/]+)/)?.[1];
      if (!repo) return pr;

      const fullPr = await this.getPullRequest(this.org, repo, pr.number);
      return {
        ...pr,
        additions: fullPr.additions,
        deletions: fullPr.deletions,
        changedFiles: fullPr.changed_files,
      };
    } catch (error) {
      console.error(`Failed to enrich PR #${pr.number} with stats:`, error);
      return pr;
    }
  }
}

export const createGitHubClient = (config: RuntimeConfig) => {
  return new GitHubClient(
    config.githubToken,
    config.githubOrg,
    config.githubRepos
  );
};
