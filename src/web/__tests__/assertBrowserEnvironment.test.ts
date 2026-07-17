import { assertBrowserEnvironment } from '../assertBrowserEnvironment';

describe('assertBrowserEnvironment', () => {
  // jsdom provides a full DOM, so the browser APIs are present by default.
  test('does not throw when the DOM globals are available', () => {
    expect(() => assertBrowserEnvironment('EnrichedText')).not.toThrow();
  });

  // Each of these globals is required - removing any one should trip the assertion.
  test.each(['window', 'document', 'DOMParser', 'Node'] as const)(
    'throws when %s is missing',
    (globalName) => {
      // Simulate an SSR environment where each global is undefined.
      const original = Object.getOwnPropertyDescriptor(globalThis, globalName);
      Object.defineProperty(globalThis, globalName, {
        value: undefined,
        configurable: true,
      });

      try {
        expect(() => assertBrowserEnvironment('EnrichedText')).toThrow(
          /\[react-native-enriched\] EnrichedText is a client-only component/
        );
      } finally {
        Object.defineProperty(globalThis, globalName, original!);
      }
    }
  );
});
