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

import { Button } from "./ui/button";

export default function UserMenu() {
  const navigate = useNavigate();

  const storedUserRaw =
    typeof window !== "undefined" ? localStorage.getItem("minivers_user") : null;
  const currentUser = storedUserRaw ? JSON.parse(storedUserRaw) : null;

  if (!currentUser) {
    return (
      <Link to="/login">
        <Button
          variant="outline"
          size="sm"
          className="border-[#A6E3E9] text-[#007ACC] hover:bg-[#CBF1F5]/40 font-medium"
        >
          Sign In
        </Button>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="border-[#A6E3E9] font-medium"
          />
        }
      >
        {currentUser.name}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-card border-[#CBF1F5] dark:border-[#1e364d] min-w-[200px]">
        <DropdownMenuGroup>
          {/* Clickable label → navigates to /profile */}
          <DropdownMenuLabel
            className="font-semibold text-xs cursor-pointer hover:text-[#007ACC] transition-colors"
            onClick={() => navigate("/profile")}
          >
            My Vault Account
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            className="text-xs cursor-pointer"
            onClick={() => {
              localStorage.removeItem("minivers_user");
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
