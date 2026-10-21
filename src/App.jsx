import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'framer-motion';
import { router } from './routes/router.jsx';
import { Toaster } from './components/ui/index.js';
import { useAuthStore } from './stores/authStore.js';
import { BRAND } from './config/env.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: true,
      // Don't retry client errors (validation, 404, auth) — only transient failures.
      retry: (count, error) => !(error?.status >= 400 && error?.status < 500) && count < 2,
    },
    mutations: { retry: false },
  },
});

export default function App() {
  const bootstrap = useAuthStore((s) => s.bootstrap);
  useEffect(() => {
    bootstrap();
    document.documentElement.lang = BRAND.locale;
    document.documentElement.dir = BRAND.dir;
  }, [bootstrap]);

  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <RouterProvider router={router} future={{ v7_startTransition: true }} />
        <Toaster />
      </MotionConfig>
    </QueryClientProvider>
  );
}

export { queryClient };
