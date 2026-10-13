import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Outlet } from "react-router";

import Header from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { queryClient } from "@/utils/trpc";

function RoutedLayout() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      disableTransitionOnChange
      storageKey="vite-ui-theme"
    >
      <div className="grid min-h-svh min-w-0 grid-rows-[auto_1fr]">
        <Header />
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
      <Toaster richColors />
    </ThemeProvider>
  );
}

export default function AppShell() {
  return (
    <QueryClientProvider client={queryClient}>
      <RoutedLayout />
      <ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
    </QueryClientProvider>
  );
}
