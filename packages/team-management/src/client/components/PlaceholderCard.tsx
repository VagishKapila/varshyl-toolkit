import React from 'react';

/**
 * PlaceholderCard — rendered by host products while the full
 * Team Management feature is in development.
 */
export function PlaceholderCard(): React.ReactElement {
  return (
    <div style={{
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      padding: '24px',
      maxWidth: '400px',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ fontSize: '24px', marginBottom: '8px' }}>👥</div>
      <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 600, color: '#1a2230' }}>
        Team Management
      </h3>
      <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
        Coming soon. Invite teammates, manage roles, and control access
        to your Varshyl products.
      </p>
    </div>
  );
}
