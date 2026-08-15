// Shared Jest setup + render helper for React Native Testing Library.
//
// This file is registered as a `setupFilesAfterEnv` entry in jest.config.js, so its
// top-level side effects (Reanimated test setup, i18n initialization) run once before
// every test file. It also exports `renderWithProviders`, which individual test files
// import directly.
import type { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';
import { render, type RenderOptions } from '@testing-library/react-native';

import { initializeI18n } from '@/src/i18n';

// i18next is a side-effecting singleton — initialize it once for the whole run instead
// of wrapping every render in an <I18nextProvider>.
initializeI18n();

const testInitialMetrics: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider initialMetrics={testInitialMetrics}>
      <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
    </SafeAreaProvider>
  );
}

export function renderWithProviders(ui: ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: AllProviders, ...options });
}
