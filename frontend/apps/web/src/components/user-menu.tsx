import { Link, useNavigate } from "react-router";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";

import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

export default function UserMenu() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();

  const storedUserRaw = typeof window !== "undefined" ? localStorage.getItem("minivers_user") : null;
  const storedUser = storedUserRaw ? JSON.parse(storedUserRaw) : null;
  const currentUser = session?.user || storedUser;

  if (isPending && !storedUser) {
    return <Skeleton className="h-9 w-24" />;
  }

  if (!currentUser) {
    return (
      <Link to="/login">
        <Button variant="outline" size="sm" className="border-[#A6E3E9] text-[#007ACC] hover:bg-[#CBF1F5]/40 font-medium">
          Sign In
        </Button>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="border-[#A6E3E9] font-medium" />}>
        {currentUser.name}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-card border-[#CBF1F5] dark:border-[#1e364d]">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-semibold text-xs">My Vault Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-xs text-muted-foreground">{currentUser.email}</DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            className="text-xs cursor-pointer"
            onClick={() => {
              localStorage.removeItem("minivers_user");
              authClient.signOut({
                fetchOptions: {
                  onSuccess: () => {
                    navigate("/");
                  },
                },
              });
              navigate("/");
            }}
          >
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
