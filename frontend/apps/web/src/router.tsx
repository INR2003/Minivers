import { createBrowserRouter } from "react-router";

import AppShell from "./app-shell";
import Dashboard from "./routes/dashboard";
import Home from "./routes/home";
import Login from "./routes/login";
import Profile from "./routes/profile";

function NotFound() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">404</h1>
      <p className="text-muted-foreground">The requested page could not be found.</p>
    </main>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <Login /> },
      { path: "home", element: <Home /> },
      { path: "login", element: <Login /> },
      { path: "dashboard", element: <Dashboard /> },
      { path: "profile", element: <Profile /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);
