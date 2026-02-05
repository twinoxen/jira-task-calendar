# JIRA Team Calendar

A Nuxt 3 application that visualizes your team's JIRA workflow in an Outlook-style calendar week view. Track how tickets flow through To Do, In Progress, and Done states with color-coded timeline segments.

## Features

- **Multi-Segment Timeline View**: See tickets as colored bars that change color as they progress through states
- **3 Tracked States**: Simplified workflow tracking (To Do → In Progress → Done)
- **Board-Specific Filtering**: Focus on a specific JIRA board or project
- **Team View**: See all team members and their ticket assignments at a glance
- **State Duration Visualization**: Each state is shown as a separate colored segment spanning its duration
- **Intelligent Status Normalization**: Automatically maps various JIRA status names to the 3 tracked states
- **Ticket Details**: Click any segment to see full details, status timeline, and linked PRs
- **Week Navigation**: Browse through weeks with Previous/Next/Today controls
- **Real-time Statistics**: View total tickets, story points, and team member counts

## Setup

### Prerequisites

- Node.js 18+ and npm
- JIRA account with API access
- (Optional) GitHub account with API access for PR linking

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd grind-analyzer
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:

```env
# JIRA Configuration (Required)
JIRA_BASE_URL=https://yourcompany.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_API_TOKEN=your_jira_api_token
JIRA_BOARD=PROJ  # Your project key or board ID

# GitHub Configuration (Optional - for PR linking)
GITHUB_TOKEN=ghp_your_github_personal_access_token
GITHUB_ORG=your-github-org
GITHUB_REPOS=repo1,repo2,repo3
```

**Finding Your JIRA Board/Project:**
- Use your project key (e.g., "PROJ" from ticket keys like PROJ-123)
- Or use the board ID from your JIRA board URL

### Getting API Credentials

**JIRA API Token:**
1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Copy the token and add it to your `.env` file

**GitHub Personal Access Token:**
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo` (for private repos) or `public_repo` (for public only)
4. Copy the token and add it to your `.env` file

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at http://localhost:3000

### Production

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Usage

### Navigation

- Use the **Previous Week** and **Next Week** buttons to navigate through time
- Click **Today** to jump back to the current week
- Click **Refresh** to reload data from JIRA

### Understanding the Multi-Segment Timeline

Tickets are displayed as colored horizontal bars that change color based on their state:

- **Gray (To Do)**: Ticket is queued and not yet started
- **Blue (In Progress)**: Ticket is actively being worked on
- **Green (Done)**: Ticket is complete

**Example Timeline:**
```
Mon  Tue  Wed  Thu  Fri
[──BLUE──][──GREEN──]
```
This ticket was "In Progress" Mon-Tue, then moved to "Done" Wed-Fri.

### Status Normalization

The app automatically normalizes various JIRA status names to the 3 tracked states:

**To Do**: "To Do", "TODO", "Backlog", "Open", "New"
**In Progress**: "In Progress", "In Development", "In Dev", "WIP", "Active"  
**Done**: "Done", "Completed", "Closed", "Resolved", "Finished"

Statuses not in these categories (e.g., "Blocked", "In Review") are not tracked.

### Settings

- **Status Colors**: View the color legend for each state (not configurable in UI)
- **Week Starts On**: Choose Monday or Sunday as the first day of the week
- **Statistics**: View total tickets, story points, and team member counts

### Viewing Tickets

- Hover over any ticket segment to see a quick preview with full timeline
- Click a ticket segment to open the detail modal with:
  - Full ticket information
  - Assignee details
  - Complete status change timeline with dates
  - Description
  - Linked pull requests with status indicators (if GitHub configured)
  - Direct link to JIRA

### Timeline Display

- Each row represents a team member
- Tickets appear as multi-colored segments based on state duration
- Each segment spans from when the state started to when it changed
- Story points are shown as badges on the longest segment
- PR icon indicates linked pull requests (if GitHub configured)
- Ongoing tickets (still "In Progress") show the current state extending to today

## Technical Stack

- **Nuxt 3**: Vue.js framework with server-side rendering
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Pinia**: State management
- **date-fns**: Date manipulation
- **@octokit/rest**: GitHub API client
- **JIRA REST API**: JIRA integration

## Architecture

```
grind-analyzer/
├── assets/          # CSS and static assets
├── components/      # Vue components
│   ├── CalendarWeek.vue
│   ├── TicketCard.vue
│   └── TicketDetailModal.vue
├── composables/     # Vue composables
│   ├── useConfig.ts
│   ├── useDateUtils.ts
│   └── useTicketData.ts
├── pages/          # Nuxt pages
│   └── index.vue
├── server/         # Server-side code
│   ├── api/       # API endpoints
│   │   ├── jira/
│   │   └── github/
│   └── utils/     # Server utilities
├── types/         # TypeScript types
└── nuxt.config.ts
```

## Configuration

### Customizing Status Colors

Edit `composables/useConfig.ts` to change the default colors:

```typescript
const defaultStatusConfigs: StatusConfig[] = [
  { name: 'To Do', color: '#94a3b8', tracked: true },      // Gray
  { name: 'In Progress', color: '#3b82f6', tracked: true }, // Blue
  { name: 'Done', color: '#10b981', tracked: true },        // Green
];
```

### Adding Status Normalization Rules

Edit `server/utils/jira.ts` in the `normalizeStatus` method to add more status variations:

```typescript
normalizeStatus(status: string): string | null {
  const normalized = status.toLowerCase().trim();
  
  // To Do variations
  if (normalized === 'to do' || normalized === 'backlog' /* add more */) {
    return 'To Do';
  }
  
  // In Progress variations
  if (normalized === 'in progress' || normalized === 'working' /* add more */) {
    return 'In Progress';
  }
  
  // Done variations
  if (normalized === 'done' || normalized === 'completed' /* add more */) {
    return 'Done';
  }
  
  return null; // Untracked status
}
```

### Changing the Board/Project

Update the `JIRA_BOARD` environment variable in your `.env` file to focus on a different board:

```env
JIRA_BOARD=NEW-PROJECT-KEY
```

Then restart the application.

### Story Points Field

JIRA story points are stored in custom fields. The app checks common field names:
- `customfield_10016` (most common)
- `customfield_10026`
- `customfield_10036`

To find your story points field:
1. Go to JIRA
2. Open any ticket with story points
3. View the raw JSON (browser dev tools)
4. Find which `customfield_*` contains your points
5. Update `server/utils/jira.ts` if needed

### Ticket-PR Matching

The app matches JIRA tickets to GitHub PRs by searching for ticket keys (e.g., `PROJ-123`) in:
- PR title (primary)
- PR description (fallback)

The regex pattern is case-insensitive: `/[A-Z]+-\d+/gi`

## Troubleshooting

**"JIRA configuration is missing" error:**
- Check that your `.env` file exists and contains all required variables
- Verify the JIRA_BASE_URL doesn't have a trailing slash
- Test your JIRA API token at https://id.atlassian.com/manage-profile/security/api-tokens

**"GitHub configuration is missing" error:**
- Verify your GITHUB_TOKEN is valid
- Check that the token has the correct scopes (`repo` or `public_repo`)

**No tickets showing:**
- Verify your `JIRA_BOARD` environment variable is set correctly
- Check that the board/project has tickets in the selected date range
- Ensure tickets have status change history (newly created tickets may not appear)
- Look for errors in the browser console
- Verify your JIRA API token has permission to read the board

**Tickets showing but no colored segments:**
- Tickets must have transitioned through tracked states to show segments
- Check that your Jira status names match the normalization rules
- Newly created tickets that haven't changed state won't have segments yet
- Add custom status normalizations if your Jira uses different names

**PRs not linking to tickets (optional feature):**
- Ensure PR titles or descriptions contain the JIRA ticket key (e.g., `PROJ-123`)
- Check that the GitHub repositories are correctly configured
- Verify the GITHUB_ORG matches your organization name
- GitHub integration is optional and not required for core functionality

## Testing

See `TESTING.md` for a comprehensive testing guide including:
- Test cases for multi-segment visualization
- Status normalization verification
- Board filtering tests
- Manual test workflows
- Troubleshooting common issues

## What's New in v2.0

- **Multi-Segment Timeline**: Tickets now show as multiple colored bars representing different states
- **Simplified Status Tracking**: Only 3 states (To Do, In Progress, Done) instead of 5
- **Board Filtering**: Focus on specific JIRA boards/projects
- **Intelligent Status Normalization**: Automatically handles various status names
- **Improved Timeline Accuracy**: Start dates reflect when work actually begins (In Progress)
- **Enhanced Tooltips**: Full state timeline with dates for each transition

## License

MIT
