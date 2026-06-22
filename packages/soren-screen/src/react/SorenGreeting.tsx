import type { SorenConfig } from '../types.js';

export interface SorenGreetingProps {
  config: SorenConfig;
  greetingText: string;
  showIntro?: boolean;
}

export function SorenGreeting({ config, greetingText, showIntro = true }: SorenGreetingProps) {
  return (
    <div className="soren-hero" data-testid="soren-greeting">
      <div className="soren-orb-wrap">
        <div className="soren-orb-ring" aria-hidden />
        <div className="soren-orb-ring2" aria-hidden />
        <div className="soren-orb">{config.avatarEmoji}</div>
      </div>
      {showIntro && <div className="soren-name">Hi, I&apos;m Soren</div>}
      <div className="soren-waves" aria-hidden>
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="soren-w" />
        ))}
      </div>
      <div className="soren-bubble">
        <p>
          {greetingText.includes(config.productName) ? (
            greetingText
          ) : (
            <>
              {greetingText}
              {' '}
              <strong>{config.productName}</strong>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
