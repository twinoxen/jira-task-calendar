# Testing Guide - Jira Calendar Refactor

## Overview

This document outlines how to test the refactored Jira Team Calendar application that now tracks only 3 states (To Do, In Progress, Done) and displays tickets as multi-colored timeline segments.

## Prerequisites

1. **Install Dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. **Set Required Environment Variables**:
   ```
   JIRA_BASE_URL=https://yourcompany.atlassian.net
   JIRA_EMAIL=your-email@company.com
   JIRA_API_TOKEN=your_api_token_here
   JIRA_BOARD=YOUR-PROJECT-KEY  # e.g., "PROJ" or "TEAM-123"
   ```

   **How to get Jira API Token**:
   - Go to https://id.atlassian.com/manage-profile/security/api-tokens
   - Click "Create API token"
   - Copy the token to your .env file

   **How to find your Jira Board/Project**:
   - Option 1: Use the project key (e.g., "PROJ" from ticket keys like PROJ-123)
   - Option 2: Use the board ID from the Jira board URL

## Running the Application

### Development Mode

```bash
npm run dev
```

Access the application at: http://localhost:3000

### Build for Production

```bash
npm run build
npm run preview
```

## What Changed - Testing Checklist

### ✅ 1. Status Simplification

**What to Test**:
- [ ] Only 3 statuses are shown in the "Status Colors" legend: To Do, In Progress, Done
- [ ] Each status has the correct color:
  - To Do: Gray (#94a3b8)
  - In Progress: Blue (#3b82f6)
  - Done: Green (#10b981)

**How to Test**:
- Look at the "Settings & Statistics" panel
- Verify only 3 status colors are displayed (no more "In Review" or "Blocked")

---

### ✅ 2. Board Filtering

**What to Test**:
- [ ] Tickets are fetched from the configured Jira board/project
- [ ] Only tickets from your specified board appear

**How to Test**:
1. Set `JIRA_BOARD` in your .env file to a specific project key
2. Load the application
3. Verify only tickets from that project are displayed
4. Check ticket keys match the project (e.g., if JIRA_BOARD=PROJ, all tickets should be PROJ-XXX)

---

### ✅ 3. Multi-Segment Timeline Visualization

**What to Test**:
- [ ] Tickets that transition through multiple states show multiple colored bars
- [ ] Each state segment has the correct color for its status
- [ ] Ticket information (key, title, points) appears on the longest segment
- [ ] Segments are positioned correctly on the timeline
- [ ] Segments don't overlap incorrectly

**Test Scenarios**:

**Scenario A: Single State Ticket**
- A ticket that was "In Progress" all week
- Should show: Single blue bar spanning the time it was in progress

**Scenario B: Two State Transition**
- A ticket that moved from "In Progress" (Mon-Wed) to "Done" (Thu-Sun)
- Should show: 
  - Blue bar (Monday-Wednesday)
  - Green bar (Thursday-end of week)

**Scenario C: Three State Journey**
- A ticket that went through "To Do" → "In Progress" → "Done"
- Should show: Three separate colored bars for each state period

**How to Test**:
1. Create or find a ticket in Jira that has transitioned through states
2. Move it through states (or use historical data)
3. View it in the calendar
4. Hover over each segment to see the tooltip with full timeline
5. Verify the colors match the states and dates

---

### ✅ 4. Status Normalization

**What to Test**:
- [ ] Various Jira status names are correctly normalized to our 3 states
- [ ] Tickets display even if your Jira uses different status names

**Status Mappings**:
- **To Do**: "To Do", "TODO", "Backlog", "Open", "New"
- **In Progress**: "In Progress", "In Development", "In Dev", "Development", "Working", "WIP", "Active"
- **Done**: "Done", "Completed", "Complete", "Closed", "Resolved", "Finished"

**How to Test**:
1. Check tickets with different status names in your Jira
2. Verify they're correctly categorized and colored in the calendar
3. Hover over a ticket to see the normalized status in the tooltip

---

### ✅ 5. Ticket Start/End Date Calculation

**What to Test**:
- [ ] Ticket start date is when it moved to "In Progress" (not creation date)
- [ ] Ticket end date is when it moved to "Done"
- [ ] Tickets still "In Progress" show as ongoing (no end date)

**How to Test**:
1. Create a test ticket in Jira
2. Move it from "To Do" → "In Progress" on Monday
3. Move it to "Done" on Wednesday
4. In the calendar:
   - Blue segment should start on Monday
   - Green segment should start on Wednesday
   - Hover tooltip should show the correct dates

---

### ✅ 6. Hover Tooltip Information

**What to Test**:
- [ ] Tooltip shows ticket key and title
- [ ] Current status is displayed
- [ ] Story points shown (if available)
- [ ] Assignee name is visible
- [ ] Full timeline with all state transitions is shown
- [ ] Timeline shows dates for each state change
- [ ] Ongoing states show "(ongoing)" label
- [ ] PR count displayed (if any PRs linked)

**How to Test**:
1. Hover over any ticket segment
2. Verify all the above information appears
3. Check that the timeline section shows multiple state transitions with dates

---

### ✅ 7. Week Navigation

**What to Test**:
- [ ] Previous/Next week buttons work
- [ ] "Today" button jumps to current week
- [ ] Date range display updates correctly
- [ ] Tickets reload when week changes
- [ ] Week starts on Monday by default (configurable)

**How to Test**:
1. Click "Previous Week" - verify dates and tickets update
2. Click "Next Week" - verify forward navigation
3. Click "Today" - verify it returns to current week
4. Change "Week Starts On" to Sunday - verify calendar adjusts

---

### ✅ 8. Statistics

**What to Test**:
- [ ] Total Tickets count is accurate
- [ ] Total Points sum is correct
- [ ] Team Members count reflects unique assignees

**How to Test**:
1. Count visible tickets manually
2. Compare with "Total Tickets" stat
3. Add up story points
4. Compare with "Total Points" stat
5. Count unique team members
6. Compare with "Team Members" stat

---

## Common Issues & Troubleshooting

### Issue: No tickets appearing

**Solutions**:
1. Check your `.env` file has all required values
2. Verify `JIRA_BOARD` is set correctly
3. Check the date range includes tickets with state changes
4. Look at browser console for API errors
5. Verify your Jira API token is valid

### Issue: Tickets show but no colored segments

**Solutions**:
1. Check if tickets have status change history in Jira
2. Verify tickets have transitioned through tracked states
3. Look for console errors in browser DevTools
4. Check that `stateSegments` array is populated (inspect network tab)

### Issue: Wrong colors for statuses

**Solutions**:
1. Verify status names in Jira match our normalization rules
2. Check `composables/useConfig.ts` for correct color mappings
3. Add custom status normalization in `server/utils/jira.ts` if needed

### Issue: Segments positioned incorrectly

**Solutions**:
1. Verify ticket dates are within the displayed week range
2. Check browser timezone matches Jira timezone
3. Inspect the `calculateTicketSpan` function output in console

---

## Manual Test Cases

### Test Case 1: New Ticket Workflow

**Steps**:
1. Create new ticket in Jira
2. Leave it in "To Do" status
3. Refresh calendar
4. **Expected**: Ticket should appear but might not have segments yet (depending on query)

5. Move ticket to "In Progress"
6. Refresh calendar
7. **Expected**: Blue bar should appear from the time of state change

8. Move ticket to "Done"
9. Refresh calendar
10. **Expected**: 
    - Blue bar for "In Progress" period
    - Green bar for "Done" period

---

### Test Case 2: Multiple Team Members

**Steps**:
1. Assign tickets to different team members
2. View calendar
3. **Expected**: 
   - Each team member has their own row
   - Tickets grouped by assignee
   - Team member avatars/initials display
   - Team member email shows

---

### Test Case 3: Overlapping Tickets

**Steps**:
1. Create multiple tickets for same person
2. Set them to overlap in time (both in progress same week)
3. View calendar
4. **Expected**:
   - Tickets stack vertically in the user's row
   - No overlap, each ticket visible
   - Hover works on each ticket

---

### Test Case 4: Week Boundary Tickets

**Steps**:
1. Create ticket that starts Monday and ends Sunday (spans full week)
2. Create ticket that starts on Thursday previous week, ends Tuesday this week
3. **Expected**:
   - First ticket spans full width of week
   - Second ticket starts at Monday (clipped to week boundary)

---

## Performance Testing

### Load Test
- Test with 50+ tickets in a single week
- Verify render time is acceptable (<2 seconds)
- Check no memory leaks when navigating weeks

### Network Test
- Monitor API calls when changing weeks
- Verify only necessary data is fetched
- Check no duplicate requests

---

## Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

---

## Regression Testing

Ensure existing features still work:
- [ ] Ticket modal opens when clicking segments
- [ ] Modal shows full ticket details
- [ ] PR linking still works (if GitHub configured)
- [ ] Refresh button works
- [ ] Loading states display correctly
- [ ] Error messages show when API fails

---

## Success Criteria

The refactor is successful if:

1. ✅ All tickets display with correct multi-segment visualization
2. ✅ Only 3 tracked states are used throughout the application
3. ✅ Board filtering works correctly
4. ✅ Status normalization handles various Jira status names
5. ✅ Timeline segments are positioned and colored correctly
6. ✅ All hover tooltips show complete information
7. ✅ No TypeScript or linting errors
8. ✅ Build completes successfully
9. ✅ Application loads and renders without console errors
10. ✅ Week navigation and date filtering work as expected

---

## Next Steps After Testing

Once testing is complete:

1. **Document any issues found** - Create a list of bugs or improvements
2. **Verify with real Jira data** - Test with your actual team's board
3. **Gather feedback** - Show to teammates and get their input
4. **Adjust status normalization** - Add more status variations if needed
5. **Fine-tune colors** - Adjust if needed for accessibility or branding
6. **Performance optimization** - If large datasets cause slowness

---

## Additional Configuration

### Custom Status Colors

Edit `composables/useConfig.ts`:

```typescript
const defaultStatusConfigs: StatusConfig[] = [
  { name: 'To Do', color: '#YOUR_COLOR', tracked: true },
  { name: 'In Progress', color: '#YOUR_COLOR', tracked: true },
  { name: 'Done', color: '#YOUR_COLOR', tracked: true },
];
```

### Custom Status Normalization

Edit `server/utils/jira.ts` in the `normalizeStatus` method to add more status variations.

---

## Support

If you encounter issues:

1. Check the browser console for errors
2. Check the terminal/server logs for API errors
3. Verify your Jira permissions allow reading tickets and changelog
4. Ensure your API token hasn't expired
5. Test with a simple JQL query in Jira's issue navigator first

---

**Last Updated**: February 5, 2026
**Version**: 2.0 (Multi-segment refactor)
