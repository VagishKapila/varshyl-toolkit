import { useEffect } from 'react';
import type { SorenCard, SorenCardAction } from '../cards';
import { ensureCardStyles } from './styles';

export interface SorenCardViewProps {
  readonly card: SorenCard;
  /** Fired when an action button is tapped. The host decides how to dispatch
   * the effect (invoke → engine round-trip; client → local directive). */
  readonly onAction: (action: SorenCardAction, card: SorenCard) => void;
}

function btnClass(action: SorenCardAction): string {
  if (action.style === 'primary') return 'soren-btn soren-btn--primary';
  if (action.style === 'danger') return 'soren-btn soren-btn--danger';
  return 'soren-btn';
}

/**
 * Presentational renderer for any {@link SorenCard}. The card is the primary
 * result surface; this component is dumb — it renders and reports taps.
 */
export function SorenCardView({ card, onAction }: SorenCardViewProps): JSX.Element {
  useEffect(() => {
    ensureCardStyles();
  }, []);

  return (
    <section className="soren-card" role="group" aria-label={card.title} data-kind={card.kind}>
      <p className="soren-card__title">{card.title}</p>
      {card.subtitle ? <p className="soren-card__subtitle">{card.subtitle}</p> : null}

      {card.items && card.items.length > 0 ? (
        <ul className="soren-card__items">
          {card.items.map((item) => (
            <li key={item.id} className="soren-card__item">
              <span className="soren-card__thumb" aria-hidden style={item.thumbnailUrl ? { backgroundImage: `url(${item.thumbnailUrl})` } : undefined} />
              <span>
                <p className="soren-card__item-title">{item.title}</p>
                {item.subtitle ? <p className="soren-card__item-sub">{item.subtitle}</p> : null}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {card.actions && card.actions.length > 0 ? (
        <div className="soren-card__actions">
          {card.actions.map((action) => (
            <button key={action.id} type="button" className={btnClass(action)} onClick={() => onAction(action, card)}>
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
