/**
 * @varshylinc/soren/react — the card-first result surface.
 *
 * Presentational React components + hooks for rendering Soren's cards. The
 * voice loop itself (connect, mic, agent audio) is owned by the engine via
 * `@livekit/components-react` in the host app; this package renders cards.
 */
export { SorenCardView, type SorenCardViewProps } from './SorenCardView';
export {
  useSorenCards,
  type SorenCardsApi,
  type SorenVerbRunner,
  type SorenVerbRunResult,
  type UseSorenCardsOptions,
} from './useSorenCards';
export { ensureCardStyles, SOREN_VARS } from './styles';
