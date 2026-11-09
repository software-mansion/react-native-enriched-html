/**
 * @jest-environment node
 */
// Because of the docblock above, jsdom test environment does not exist here
import { assertBrowserEnvironment } from '../utils/assertBrowserEnvironment';

describe('assertBrowserEnvironment', () => {
  test('throws when DOM is missing', () => {
    expect(() => assertBrowserEnvironment('EnrichedText')).toThrow(
      /client-only/
    );
  });
});
