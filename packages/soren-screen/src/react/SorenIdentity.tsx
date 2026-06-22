export interface SorenIdentityProps {
  titleOptions: string[];
  selectedTitle?: string;
  name: string;
  onTitleSelect: (title: string) => void;
  onNameChange: (name: string) => void;
}

export function SorenIdentity({
  titleOptions,
  selectedTitle,
  name,
  onTitleSelect,
  onNameChange,
}: SorenIdentityProps) {
  return (
    <div data-testid="soren-identity">
      <div className="soren-sec-label">How should I address you?</div>
      <div className="soren-id-cards">
        {titleOptions.map((title) => (
          <button
            key={title}
            type="button"
            className={`soren-id-card${selectedTitle === title ? ' active' : ''}`}
            onClick={() => onTitleSelect(title)}
          >
            {title}
          </button>
        ))}
      </div>
      <input
        className="soren-name-input"
        placeholder="Your name..."
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        autoComplete="name"
      />
    </div>
  );
}
