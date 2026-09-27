/**
 * Tests for Badge, SectionHeader, Separator, and state-view components.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

import { Badge } from '@/components/ui/badge';
import { SectionHeader } from '@/components/ui/section-header';
import { Separator } from '@/components/ui/separator';
import { LoadingView, EmptyView, ErrorView, OfflineView } from '@/components/ui/state-views';

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------

describe('Badge', () => {
  it('renders label text', () => {
    render(<Badge label="Sports" />);
    expect(screen.getByText('Sports')).toBeTruthy(); // test renderer doesn't apply textTransform
  });

  it.each(['default', 'secondary', 'outline', 'success', 'warning', 'error'] as const)(
    'renders variant "%s" without error',
    (variant) => {
      expect(() => render(<Badge label="tag" variant={variant} />)).not.toThrow();
    }
  );
});

// ---------------------------------------------------------------------------
// SectionHeader
// ---------------------------------------------------------------------------

describe('SectionHeader', () => {
  it('renders the title', () => {
    render(<SectionHeader title="Featured" />);
    expect(screen.getByText('Featured')).toBeTruthy();
  });

  it('renders "See all" when onSeeAll is provided', () => {
    render(<SectionHeader title="Sports" onSeeAll={() => {}} />);
    expect(screen.getByText('See all')).toBeTruthy();
  });

  it('does not render "See all" when onSeeAll is absent', () => {
    render(<SectionHeader title="Sports" />);
    expect(screen.queryByText('See all')).toBeNull();
  });

  it('calls onSeeAll when pressed', () => {
    const onSeeAll = jest.fn();
    render(<SectionHeader title="Sports" onSeeAll={onSeeAll} />);
    fireEvent.press(screen.getByRole('button', { name: 'See all Sports' }));
    expect(onSeeAll).toHaveBeenCalledTimes(1);
  });

  it('renders custom seeAllLabel', () => {
    render(<SectionHeader title="Top" seeAllLabel="View more" onSeeAll={() => {}} />);
    expect(screen.getByText('View more')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Separator
// ---------------------------------------------------------------------------

describe('Separator', () => {
  it('renders without error (horizontal)', () => {
    expect(() => render(<Separator />)).not.toThrow();
  });

  it('renders without error (vertical)', () => {
    expect(() => render(<Separator orientation="vertical" />)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// State views
// ---------------------------------------------------------------------------

describe('LoadingView', () => {
  it('renders without error', () => {
    expect(() => render(<LoadingView />)).not.toThrow();
  });

  it('renders optional message', () => {
    render(<LoadingView message="Loading channels..." />);
    expect(screen.getByText('Loading channels...')).toBeTruthy();
  });
});

describe('EmptyView', () => {
  it('renders default message', () => {
    render(<EmptyView />);
    expect(screen.getByText('Nothing here yet.')).toBeTruthy();
  });

  it('renders custom message', () => {
    render(<EmptyView message="No channels found." />);
    expect(screen.getByText('No channels found.')).toBeTruthy();
  });
});

describe('ErrorView', () => {
  it('renders error message', () => {
    render(<ErrorView message="Could not load data." />);
    expect(screen.getByText('Could not load data.')).toBeTruthy();
  });

  it('renders retry button when onRetry supplied', () => {
    render(<ErrorView onRetry={() => {}} />);
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
  });

  it('calls onRetry when pressed', () => {
    const onRetry = jest.fn();
    render(<ErrorView onRetry={onRetry} />);
    fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('does not render retry button when onRetry is absent', () => {
    render(<ErrorView />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('OfflineView', () => {
  it('renders an offline message', () => {
    render(<OfflineView />);
    expect(screen.getByText(/offline/i)).toBeTruthy();
  });
});
