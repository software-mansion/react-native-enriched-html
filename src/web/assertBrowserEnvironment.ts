/**
 * `EnrichedText` and `EnrichedTextInput` rely on browser-only APIs (DOMParser,
 * DOMPurify, TipTap) and therefore cannot render without a DOM — e.g. during
 * server-side rendering (SSR). They are client-only components.
 *
 * This asserts a DOM is available and throws a clear error otherwise.
 */
export function assertBrowserEnvironment(componentName: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error(
      `[react-native-enriched] ${componentName} is a client-only component and cannot be rendered without a DOM. ` +
        `If you are running an SSR application, make sure the component is only rendered on the client.`
    );
  }
}
