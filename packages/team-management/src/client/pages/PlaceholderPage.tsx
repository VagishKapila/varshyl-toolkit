import React from 'react';
import { PlaceholderCard } from '../components/PlaceholderCard.js';

/**
 * PlaceholderPage — full-page wrapper for the PlaceholderCard.
 * Host products mount this at their /team route.
 */
export function PlaceholderPage(): React.ReactElement {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8fafc',
    }}>
      <PlaceholderCard />
    </div>
  );
}
