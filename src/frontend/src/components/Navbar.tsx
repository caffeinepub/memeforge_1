import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, ChevronDown, Compass, Flame, PlusCircle } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCallerProfile } from "../hooks/useQueries";

export default function Navbar() {
  const navigate = useNavigate();
  const { identity, login, clear, isLoggingIn, isInitializing } =
    useInternetIdentity();
  const isAuthenticated = !!identity;
  const { data: profile } = useGetCallerProfile();

  const navLinks = [
    { to: "/", label: "Explore", icon: Compass },
    { to: "/trending", label: "Trending", icon: Flame },
  ];

  const username =
    profile?.username ||
    (identity ? `${identity.getPrincipal().toString().slice(0, 8)}...` : "");
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-6">
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center gap-2 shrink-0"
          data-ocid="nav.link"
        >
          <span className="text-xl font-black gradient-brand">MF</span>
          <span className="text-base font-bold text-foreground hidden sm:block">
            MemeForge
          </span>
        </Link>

        {/* Nav Links */}
        <nav className="flex items-center gap-1">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              data-ocid="nav.link"
              activeProps={{ className: "bg-primary/10 text-primary" }}
              inactiveProps={{
                className:
                  "text-muted-foreground hover:text-foreground hover:bg-muted",
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex-1" />

        {/* Create CTA */}
        <Button
          onClick={() => navigate({ to: "/create" })}
          data-ocid="nav.primary_button"
          className="bg-gradient-brand text-white font-semibold text-sm gap-1.5 hidden sm:flex"
          size="sm"
        >
          <PlusCircle className="h-4 w-4" />
          Create Meme
        </Button>

        {/* Auth */}
        {isInitializing ? (
          <div
            className="h-8 w-8 rounded-full bg-muted animate-pulse"
            data-ocid="nav.loading_state"
          />
        ) : isAuthenticated ? (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground"
              data-ocid="nav.button"
            >
              <Bell className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted transition-colors"
                  data-ocid="nav.dropdown_menu"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hidden md:block max-w-24 truncate">
                    {username}
                  </span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={() => navigate({ to: "/profile" })}
                  data-ocid="nav.link"
                >
                  My Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate({ to: "/create" })}
                  data-ocid="nav.link"
                >
                  Create Meme
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => clear()}
                  data-ocid="nav.button"
                  className="text-destructive focus:text-destructive"
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <Button
            onClick={() => login()}
            disabled={isLoggingIn}
            size="sm"
            variant="outline"
            data-ocid="nav.primary_button"
            className="border-primary/50 text-primary hover:bg-primary/10"
          >
            {isLoggingIn ? "Logging in..." : "Login"}
          </Button>
        )}
      </div>
    </header>
  );
}
