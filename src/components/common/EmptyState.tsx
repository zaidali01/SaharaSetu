import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  body?: string;
  icon?: React.ReactNode;
}

/**
 * Task 3.5t — uniform empty state.
 *
 * Every list in the dashboard previously rendered nothing at all when its data was
 * empty, which on stage looks like a broken screen rather than "nothing to do".
 * This is the single component all of them now share.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({ title, body, icon }) => (
  <div className="empty-state" role="status">
    <span className="empty-state-icon">{icon ?? <Inbox size={16} />}</span>
    <span className="empty-state-title">{title}</span>
    {body && <span className="empty-state-body">{body}</span>}
  </div>
);

interface SkeletonBoardProps {
  /** How many placeholder cards to show per column. */
  perColumn?: number;
  columns?: number;
}

/**
 * Task 3.5t — placeholder shown while the status board hydrates from the backend.
 */
export const SkeletonBoard: React.FC<SkeletonBoardProps> = ({ perColumn = 2, columns = 3 }) => (
  <div className="kanban-grid" aria-busy="true" aria-label="Syncing status board">
    {Array.from({ length: columns }).map((_, c) => (
      <div className="kanban-column" key={c}>
        <div className="kanban-column-header">
          <span className="skeleton-card" style={{ height: 12, width: 96, border: 'none' }} />
        </div>
        {Array.from({ length: perColumn }).map((_, i) => (
          <div className="skeleton-card" key={i} />
        ))}
      </div>
    ))}
  </div>
);
