import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/inter/400.css';
import '@fontsource/inter/400-italic.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/700-italic.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/700.css';
import './index.css';
import RouteSelector from './RouteSelector';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element "#root" not found');

createRoot(rootElement).render(
  <StrictMode>
    <RouteSelector />
  </StrictMode>
);
