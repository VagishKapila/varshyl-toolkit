import { useCallback, useMemo, useState } from 'react';
import type { SorenAction, SorenChatMessage, SorenConfig } from '../types.js';
import { isBuiltinFlow } from './SorenActions.js';
import { SorenActions } from './SorenActions.js';
import { SorenChat } from './SorenChat.js';
import { SorenGreeting } from './SorenGreeting.js';
import { SorenIdentity } from './SorenIdentity.js';
import { SorenInput } from './SorenInput.js';
import { SorenPortfolio } from './SorenPortfolio.js';
import { useSorenPortfolio } from './hooks/useSorenPortfolio.js';
import { useSorenQA } from './hooks/useSorenQA.js';
import { useSorenSession } from './hooks/useSorenSession.js';
import './soren-screen.css';

export type SorenView = 'home' | 'portfolio' | 'qa';

export interface SorenScreenProps {
  config: SorenConfig;
  userId?: string;
  onNavigate?: (path: string) => void;
  className?: string;
}

export function SorenScreen({
  config,
  userId = 'demo-user',
  onNavigate,
  className,
}: SorenScreenProps) {
  const {
    session,
    user,
    identityComplete,
    greetingText,
    setTitle,
    setName,
  } = useSorenSession(config, userId);

  const { ask, loading: qaLoading } = useSorenQA(config);
  const portfolio = useSorenPortfolio(config);

  const [view, setView] = useState<SorenView>('home');
  const [messages, setMessages] = useState<SorenChatMessage[]>([]);

  const userInitial = useMemo(
    () => (user.firstName?.[0] ?? user.name?.[0] ?? 'U').toUpperCase(),
    [user],
  );

  const appendMessage = useCallback((role: 'soren' | 'user', content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${prev.length}`,
        role,
        content,
        timestamp: new Date().toISOString(),
      },
    ]);
  }, []);

  const handleAction = useCallback(async (action: SorenAction) => {
    if (typeof action.onTap === 'function') {
      action.onTap();
      return;
    }
    if (isBuiltinFlow(action.onTap)) {
      if (action.onTap === 'portfolio-builder') {
        setView('portfolio');
        await portfolio.load(user.userId);
        return;
      }
      if (action.onTap === 'qa') {
        setView('qa');
        appendMessage('soren', 'Ask me anything about your product — I\'m here to help.');
        return;
      }
      if (action.onTap === 'client-notification') {
        appendMessage('soren', 'Client notifications are configured by your host app. Check Settings → Notifications.');
        setView('qa');
        return;
      }
    }
    if (typeof action.onTap === 'string' && action.onTap.startsWith('/')) {
      onNavigate?.(action.onTap);
    }
  }, [appendMessage, onNavigate, portfolio, user.userId]);

  const handleAsk = useCallback(async (text: string) => {
    appendMessage('user', text);
    setView('qa');
    const result = await ask(text);
    appendMessage('soren', result.answer);
  }, [appendMessage, ask]);

  const headerSubtitle = view === 'portfolio'
    ? 'Built by Soren from your logs'
    : 'Your AI Field Assistant';

  const headerTitle = view === 'portfolio' ? 'My Portfolio' : 'Soren';

  return (
    <div className={`soren-screen${className ? ` ${className}` : ''}`} data-testid="soren-screen">
      <header className="soren-hdr">
        {view !== 'home' && (
          <button type="button" className="soren-hdr-back" onClick={() => setView('home')} aria-label="Back">
            ←
          </button>
        )}
        <div className="soren-hdr-text">
          <h2>{headerTitle}</h2>
          <p>{headerSubtitle}</p>
        </div>
        <div className="soren-hdr-avatar">{config.avatarEmoji}</div>
      </header>

      {view === 'home' && (
        <SorenGreeting config={config} greetingText={greetingText} showIntro={!identityComplete} />
      )}

      <div className="soren-content">
        {view === 'home' && !identityComplete && (
          <SorenIdentity
            titleOptions={config.titleOptions}
            selectedTitle={session?.title}
            name={session?.name ?? ''}
            onTitleSelect={setTitle}
            onNameChange={setName}
          />
        )}

        {view === 'home' && (
          <SorenActions actions={config.actions} onAction={handleAction} />
        )}

        {view === 'portfolio' && config.portfolio?.enabled !== false && (
          <SorenPortfolio
            config={config}
            session={session}
            data={portfolio.data}
            pdfLoading={portfolio.pdfLoading}
            onDownloadPdf={() => void portfolio.downloadPdf(user.userId)}
          />
        )}

        {(view === 'qa' || messages.length > 0) && (
          <SorenChat messages={messages} userInitial={userInitial} />
        )}
      </div>

      <SorenInput
        placeholder={view === 'portfolio' ? 'Ask Soren to update your profile...' : 'Or just ask me anything...'}
        onSubmit={handleAsk}
        disabled={qaLoading}
      />
    </div>
  );
}
