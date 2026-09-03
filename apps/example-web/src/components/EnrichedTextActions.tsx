import type { TextProps } from 'react-native';
import './EnrichedTextActions.css';

type EllipsizeMode = NonNullable<TextProps['ellipsizeMode']>;

const ELLIPSIZE_MODES: EllipsizeMode[] = ['tail', 'head', 'middle', 'clip'];
const LINE_OPTIONS = [0, 2, 3];

interface EnrichedTextActionsProps {
  ellipsizeMode: EllipsizeMode;
  numberOfLines: number;
  onChangeEllipsizeMode: (mode: EllipsizeMode) => void;
  onChangeNumberOfLines: (lines: number) => void;
}

export function EnrichedTextActions({
  ellipsizeMode,
  numberOfLines,
  onChangeEllipsizeMode,
  onChangeNumberOfLines,
}: EnrichedTextActionsProps) {
  return (
    <div className="actions-container" data-testid="enriched-text-actions">
      <div className="btn-row" data-testid="ellipsize-mode-row">
        {ELLIPSIZE_MODES.map((mode) => (
          <button
            key={mode}
            className={ellipsizeMode === mode ? 'btn btn-active' : 'btn'}
            data-testid={`ellipsize-mode-${mode}-button`}
            onClick={() => {
              onChangeEllipsizeMode(mode);
            }}
          >
            {mode}
          </button>
        ))}
      </div>
      <div className="btn-row" data-testid="number-of-lines-row">
        {LINE_OPTIONS.map((lines) => (
          <button
            key={lines}
            className={numberOfLines === lines ? 'btn btn-active' : 'btn'}
            data-testid={`number-of-lines-${String(lines)}-button`}
            onClick={() => {
              onChangeNumberOfLines(lines);
            }}
          >
            {lines} lines
          </button>
        ))}
      </div>
    </div>
  );
}
