import { ref, computed } from 'vue';
import type { Ticket, PullRequest, UserWithTickets, User } from '~/types';

export const useTicketData = () => {
  const tickets = ref<Ticket[]>([]);
  const pullRequests = ref<PullRequest[]>([]);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  const fetchData = async (
    startDate: Date,
    endDate: Date,
    users?: string[]
  ) => {
    loading.value = true;
    error.value = null;

    try {
      // Format dates for API
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Build query params
      const params = new URLSearchParams({
        startDate: startDateStr,
        endDate: endDateStr,
      });

      if (users && users.length > 0) {
        params.append('users', users.join(','));
      }

      // Fetch tickets and PRs in parallel
      const [ticketsResponse, prsResponse] = await Promise.all([
        $fetch(`/api/jira/tickets?${params.toString()}`),
        $fetch(`/api/github/prs?since=${startDateStr}`),
      ]);

      // Convert date strings to Date objects
      tickets.value = (ticketsResponse as any).tickets.map((ticket: any) => ({
        ...ticket,
        startDate: new Date(ticket.startDate),
        endDate: ticket.endDate ? new Date(ticket.endDate) : null,
        statusHistory: ticket.statusHistory.map((status: any) => ({
          ...status,
          timestamp: new Date(status.timestamp),
        })),
        pointsHistory: (ticket.pointsHistory || []).map((change: any) => ({
          ...change,
          timestamp: new Date(change.timestamp),
        })),
        stateSegments: ticket.stateSegments.map((segment: any) => ({
          ...segment,
          startDate: new Date(segment.startDate),
          endDate: segment.endDate ? new Date(segment.endDate) : null,
        })),
      }));

      pullRequests.value = (prsResponse as any).pullRequests.map((pr: any) => ({
        ...pr,
        createdAt: new Date(pr.createdAt),
        updatedAt: new Date(pr.updatedAt),
        mergedAt: pr.mergedAt ? new Date(pr.mergedAt) : null,
        closedAt: pr.closedAt ? new Date(pr.closedAt) : null,
      }));

      // Match PRs to tickets
      matchPullRequests();
    } catch (err: any) {
      error.value = err;
      console.error('Error fetching data:', err);
    } finally {
      loading.value = false;
    }
  };

  const matchPullRequests = () => {
    // Create a map of ticket key to PRs
    const prsByTicket = new Map<string, PullRequest[]>();

    for (const pr of pullRequests.value) {
      for (const ticketKey of pr.linkedTicketKeys) {
        if (!prsByTicket.has(ticketKey)) {
          prsByTicket.set(ticketKey, []);
        }
        prsByTicket.get(ticketKey)!.push(pr);
      }
    }

    // Attach PRs to tickets
    for (const ticket of tickets.value) {
      ticket.prs = prsByTicket.get(ticket.key) || [];
    }
  };

  const userTickets = computed<UserWithTickets[]>(() => {
    // Group tickets by user
    const userMap = new Map<string, UserWithTickets>();

    for (const ticket of tickets.value) {
      const userId = ticket.assignee.id;

      if (!userMap.has(userId)) {
        userMap.set(userId, {
          user: ticket.assignee,
          tickets: [],
        });
      }

      userMap.get(userId)!.tickets.push(ticket);
    }

    // Sort tickets within each user by start date
    for (const userTicket of userMap.values()) {
      userTicket.tickets.sort(
        (a, b) => a.startDate.getTime() - b.startDate.getTime()
      );
    }

    return Array.from(userMap.values());
  });

  const totalPoints = computed(() => {
    return tickets.value.reduce((sum, ticket) => sum + (ticket.points || 0), 0);
  });

  const ticketsByStatus = computed(() => {
    const statusMap = new Map<string, Ticket[]>();

    for (const ticket of tickets.value) {
      const status = ticket.currentStatus;

      if (!statusMap.has(status)) {
        statusMap.set(status, []);
      }

      statusMap.get(status)!.push(ticket);
    }

    return statusMap;
  });

  const getTicketsByUser = (userId: string): Ticket[] => {
    return tickets.value.filter((t) => t.assignee.id === userId);
  };

  const getTicketByKey = (key: string): Ticket | undefined => {
    return tickets.value.find((t) => t.key === key);
  };

  return {
    tickets,
    pullRequests,
    loading,
    error,
    fetchData,
    userTickets,
    totalPoints,
    ticketsByStatus,
    getTicketsByUser,
    getTicketByKey,
  };
};
