import React from 'react';
import { SorenScreen } from '@varshylinc/soren-screen/react';
import { jobsiteConfig } from '@varshylinc/soren-screen/adapters/jobsite';
import '@varshylinc/soren-screen/react/soren-screen.css';

export function SorenDemoPage(): React.ReactElement {
  return (
    <div
      style={{
        maxWidth: 390,
        margin: '0 auto',
        height: '100vh',
        position: 'relative',
      }}
    >
      <SorenScreen
        config={{
          ...jobsiteConfig,
          serverUrl: '',
        }}
        onNavigate={(path) => console.log('navigate:', path)}
      />
    </div>
  );
}
