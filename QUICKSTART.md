# Quick Start Guide - Jira Team Calendar

## 🚀 Getting Started in 5 Minutes

### 1. Configure Environment

```bash
# Copy the example file
cp .env.example .env

# Edit .env and set these required values:
JIRA_BASE_URL=https://yourcompany.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_API_TOKEN=your_jira_api_token_here
JIRA_BOARD=YOUR-PROJECT-KEY
```

**Get your Jira API token**: https://id.atlassian.com/manage-profile/security/api-tokens

### 2. Install & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### 3. View Your Calendar

Open http://localhost:3000

---

## 📊 What You'll See

### Calendar Layout

```
┌─────────────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐
│ Team Member │ Mon  │ Tue  │ Wed  │ Thu  │ Fri  │ Sat  │ Sun  │
├─────────────┼──────┴──────┴──────┴──────┴──────┴──────┴──────┤
│ John Doe    │ [PROJ-123: Feature] [BLUE][GREEN              ]│
│             │ [PROJ-456: Bug Fix    ][BLUE                   ]│
├─────────────┼──────────────────────────────────────────────────┤
│ Jane Smith  │ [PROJ-789: Design     ][BLUE    ][GREEN       ]│
└─────────────┴──────────────────────────────────────────────────┘
```

### Color Meanings

- **Gray** = To Do (queued, not started)
- **Blue** = In Progress (actively being worked)
- **Green** = Done (completed)

### Multi-Segment Example

```
Ticket PROJ-123 lifecycle:
├─ Monday: Started work (To Do → In Progress)
│  [BLUE ─────────────]
├─ Wednesday: Completed (In Progress → Done)
│              [GREEN ──────────]
└─ Result: Two colored segments showing the transition
```

---

## 🎯 Key Features

### 1. Multi-Segment Timeline
Tickets show **different colors** as they progress through states:
- A ticket that was "In Progress" Mon-Tue then "Done" Wed-Fri shows:
  - Blue bar (Mon-Tue)
  - Green bar (Wed-Fri)

### 2. Intelligent Status Mapping
Your Jira statuses are automatically normalized:
- "Backlog" → To Do
- "In Development" → In Progress
- "Completed" → Done

### 3. Board Filtering
Only shows tickets from your configured `JIRA_BOARD`

### 4. Team View
- One row per team member
- See everyone's work at a glance
- Click any ticket for details

---

## 🔧 Common Customizations

### Change Colors

Edit `composables/useConfig.ts`:
```typescript
{ name: 'To Do', color: '#YOUR_COLOR', tracked: true },
```

### Add Status Variations

Edit `server/utils/jira.ts` → `normalizeStatus()`:
```typescript
if (normalized === 'in progress' || normalized === 'your-custom-status') {
  return 'In Progress';
}
```

### Switch Board/Project

Update `.env`:
```env
JIRA_BOARD=DIFFERENT-PROJECT
```
Then restart: `npm run dev`

---

## 💡 Usage Tips

### Week Navigation
- **← Previous Week**: Go back one week
- **→ Next Week**: Go forward one week
- **Today**: Jump to current week
- **🔄 Refresh**: Reload data from Jira

### Viewing Ticket Details
1. **Hover** over any segment → See quick preview
2. **Click** any segment → Open full details modal with:
   - Complete status timeline
   - All state transitions with dates
   - Assignee info
   - Description
   - Linked PRs (if configured)

### Understanding the Timeline
- Ticket info (key, title, points) appears on the **longest segment**
- Other segments show abbreviated status labels
- Segments are clipped to the visible week

---

## 🐛 Troubleshooting

### No tickets showing?

**Check**:
1. Is `JIRA_BOARD` set correctly in `.env`?
2. Does the board have tickets in this week?
3. Have the tickets changed status this week?
4. Check browser console for errors

**Fix**:
```bash
# Verify your board setting
echo $JIRA_BOARD  # Should show your project key

# Try a different week (tickets with recent status changes)
# Use Previous/Next week buttons
```

### Tickets show but no colored segments?

**Reason**: Tickets must have **status change history** to show segments.

**Fix**:
1. Newly created tickets may not have segments yet
2. Move a ticket through states in Jira: To Do → In Progress → Done
3. Refresh the calendar
4. The ticket should now show colored segments

### API Connection Errors?

**Check**:
1. Jira API token is valid
2. Email address matches your Jira account
3. Base URL has no trailing slash: `https://company.atlassian.net` ✓
4. You have permission to read the board

**Test your credentials**:
```bash
# Test Jira API manually
curl -u YOUR_EMAIL:YOUR_API_TOKEN \
  https://yourcompany.atlassian.net/rest/api/3/myself
```

---

## 📚 More Information

- **Full Documentation**: See `README.md`
- **Testing Guide**: See `TESTING.md`
- **Implementation Details**: See `IMPLEMENTATION_COMPLETE.md`

---

## 🎉 That's It!

You should now see your team's work visualized in a calendar week view with color-coded timeline segments.

**Next Steps**:
1. Browse through different weeks
2. Click tickets to see details
3. Customize colors if needed
4. Share with your team!

---

**Questions or Issues?**
- Check the troubleshooting sections in `README.md` and `TESTING.md`
- Look at browser console for error messages
- Verify Jira API permissions
