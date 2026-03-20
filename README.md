# Team Tempo

Analytical tools for your Jira and GitHub workflows. See how your team works, track ticket progress, and stay on top of open pull requests — all in one place.

## What It Does

**Timeline** — A calendar view showing how tickets move through To Do, In Progress, and Done as color-coded segments. Click any ticket to see its full history, details, and linked PRs.

**Breakdown** — Sprint-level stats including story point allocation, ticket type distribution, and cycle times. Exportable to CSV.

**Open PRs** — A leaderboard of open pull requests across your GitHub org, ranked by author. Expand any user to see their PRs with repo, title, and age.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in your credentials:

```env
# Jira (required)
JIRA_BASE_URL=https://yourcompany.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_API_TOKEN=your_jira_api_token
JIRA_BOARD=PROJ

# GitHub (optional — enables PR linking and Open PRs page)
GITHUB_TOKEN=ghp_your_token
GITHUB_ORG=your-org
GITHUB_REPOS=repo1,repo2,repo3
```

3. Start the dev server:

```bash
npm run dev
```

The app runs at http://localhost:3000.

## Tech Stack

Nuxt 3, Vue 3, TypeScript, Tailwind CSS, Pinia, date-fns, Octokit.
