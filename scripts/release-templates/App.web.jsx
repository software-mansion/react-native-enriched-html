import { EnrichedTextInput } from 'react-native-enriched-html';
import { useRef, useState } from 'react';

export default function App() {
  const ref = useRef(null);
  const [state, setState] = useState(null);

  return (
    <div className="container">
      <EnrichedTextInput
        ref={ref}
        className="input"
        placeholder="Type something here..."
        onChangeState={(e) => setState(e.nativeEvent)}
      />
      <button
        className={state?.bold.isActive ? 'button button-active' : 'button'}
        onClick={() => ref.current?.toggleBold()}
      >
        <span className={state?.bold.isActive ? 'text text-active' : 'text'}>
          Bold
        </span>
      </button>
    </div>
  );
}
