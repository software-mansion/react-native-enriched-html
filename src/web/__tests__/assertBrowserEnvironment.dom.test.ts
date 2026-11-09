import { assertBrowserEnvironment } from '../utils/assertBrowserEnvironment';

describe('assertBrowserEnvironment', () => {
  // jsdom provides a full DOM, so the browser APIs are present by default.
  test('does not throw when the DOM globals are available', () => {
    expect(() => assertBrowserEnvironment('EnrichedText')).not.toThrow();
  });
});
