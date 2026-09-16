import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/users")({
  ssr: false,
  component: UsersLayout,
});

function UsersLayout() {
  return <Outlet />;
}
