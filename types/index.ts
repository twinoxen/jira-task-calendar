// TypeScript type definitions for the application

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface StatusChange {
  status: string;
  timestamp: Date;
  author?: User;
}

export interface PullRequest {
  number: number;
  title: string;
  url: string;
  repo?: string;
  author: string;
  authorAvatarUrl?: string;
  createdAt: Date;
  mergedAt?: Date;
  closedAt?: Date;
  status: 'open' | 'merged' | 'closed';
  linkedTicketKeys: string[];
  additions?: number;
  deletions?: number;
  changedFiles?: number;
}

export interface StateSegment {
  status: string;
  startDate: Date;
  endDate: Date | null;
  color: string;
}

export interface PointsChange {
  from: number | null;
  to: number | null;
  timestamp: Date;
}

export interface Ticket {
  key: string;
  title: string;
  points: number | null;
  pointsHistory: PointsChange[];
  assignee: User;
  startDate: Date;
  endDate: Date | null;
  statusHistory: StatusChange[];
  currentStatus: string;
  stateSegments: StateSegment[];
  prs: PullRequest[];
  description?: string;
  jiraUrl: string;
}

export interface UserWithTickets {
  user: User;
  tickets: Ticket[];
}

export interface StatusConfig {
  name: string;
  color: string;
  tracked: boolean;
}

export interface AppConfig {
  statusConfigs: StatusConfig[];
  weekStartsOn: 0 | 1; // 0 = Sunday, 1 = Monday
}
