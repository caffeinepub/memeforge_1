import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { Zap } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, clear, identity, isLoggingIn, isLoginSuccess } =
    useInternetIdentity();
  const isAuthenticated = !!identity;

  useEffect(() => {
    if (isLoginSuccess && isAuthenticated) {
      navigate({ to: "/" });
    }
  }, [isLoginSuccess, isAuthenticated, navigate]);

  return (
    <div
      className="min-h-[80vh] flex items-center justify-center px-4"
      data-ocid="login.section"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div
          className="rounded-2xl border border-border bg-card p-8 text-center"
          data-ocid="login.card"
        >
          <div className="mb-6">
            <div className="text-5xl font-black gradient-brand mb-2">MF</div>
            <h1 className="text-2xl font-bold">Welcome to MemeForge</h1>
            <p className="text-muted-foreground text-sm mt-2">
              Login to create memes, like, and join the community.
            </p>
          </div>

          <ul className="text-sm text-left space-y-2 mb-8 text-muted-foreground">
            {[
              "🎨 Create memes with our canvas editor",
              "❤️ Like and share community memes",
              "👤 Build your meme profile",
              "🏆 Climb the meme leaderboard",
            ].map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>

          {isAuthenticated ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                You are already logged in.
              </p>
              <Button
                onClick={() => navigate({ to: "/" })}
                className="w-full bg-gradient-brand text-white font-semibold"
                data-ocid="login.primary_button"
              >
                Go to Feed
              </Button>
              <Button
                variant="outline"
                onClick={() => clear()}
                className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
                data-ocid="login.secondary_button"
              >
                Logout
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => login()}
              disabled={isLoggingIn}
              className="w-full bg-gradient-brand text-white font-semibold gap-2"
              size="lg"
              data-ocid="login.primary_button"
            >
              {isLoggingIn ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Logging in...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Login with Internet Identity
                </>
              )}
            </Button>
          )}

          <p className="text-xs text-muted-foreground mt-4">
            Secure, passwordless authentication powered by the Internet
            Computer.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
