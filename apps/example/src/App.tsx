import { useState } from 'react';
import { DevScreen } from './screens/DevScreen';
import { TestScreen } from './screens/TestScreen';
import { EnrichedTextScreen } from './screens/EnrichedTextScreen';

type Screen = 'dev' | 'test' | 'enrichedText';

interface AppProps {
  // Passed by Maestro as a launch argument, see MainActivity and SceneDelegate
  showScrollOffset?: boolean;
}

export default function App({ showScrollOffset = false }: AppProps) {
  const [screen, setScreen] = useState<Screen>('dev');

  if (screen === 'test') {
    return (
      <TestScreen
        showScrollOffset={showScrollOffset}
        onSwitch={() => setScreen('dev')}
        onSwitchEnrichedText={() => setScreen('enrichedText')}
      />
    );
  }

  if (screen === 'enrichedText') {
    return <EnrichedTextScreen onSwitch={() => setScreen('test')} />;
  }

  return <DevScreen onSwitch={() => setScreen('test')} />;
}
