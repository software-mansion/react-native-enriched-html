import './Actions.css';

interface TextActionsProps {
  onFocus: () => void;
  onBlur: () => void;
}

export function TextActions({ onFocus, onBlur }: TextActionsProps) {
  return (
    <div className="btn-row" data-testid="text-actions-row">
      <button className="btn" data-testid="text-focus-button" onClick={onFocus}>
        Focus
      </button>
      <button className="btn" data-testid="text-blur-button" onClick={onBlur}>
        Blur
      </button>
    </div>
  );
}
