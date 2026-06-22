import type { SorenAction, SorenBuiltinFlow } from '../types.js';

export interface SorenActionsProps {
  actions: SorenAction[];
  onAction: (action: SorenAction) => void;
}

function isBuiltinFlow(onTap: SorenAction['onTap']): onTap is SorenBuiltinFlow {
  return onTap === 'portfolio-builder' || onTap === 'client-notification' || onTap === 'qa';
}

export function SorenActions({ actions, onAction }: SorenActionsProps) {
  return (
    <div data-testid="soren-actions">
      <div className="soren-sec-label">What can I help you with today?</div>
      <div className="soren-grid">
        {actions.map((action, index) => (
          <button
            key={action.id}
            type="button"
            className={`soren-action${index === 0 ? ' highlight' : ''}`}
            onClick={() => onAction(action)}
          >
            <div className="soren-action-icon">{action.icon}</div>
            <div className="soren-action-title">{action.title}</div>
            <div className="soren-action-sub">{action.subtitle}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

export { isBuiltinFlow };
