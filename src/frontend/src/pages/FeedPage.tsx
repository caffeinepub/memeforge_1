import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import {
  Copy,
  MessageCircle,
  PlusCircle,
  Share2,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import MemeCard, { MemeCardSkeleton } from "../components/MemeCard";
import {
  useGetMemes,
  useGetMostLikedMemes,
  useGetTrendingTags,
} from "../hooks/useQueries";

interface FeedPageProps {
  trending?: boolean;
}

export default function FeedPage({ trending = false }: FeedPageProps) {
  const navigate = useNavigate();
  const memesQuery = useGetMemes();
  const trendingQuery = useGetMostLikedMemes(20n);
  const tagsQuery = useGetTrendingTags(10n);

  const memes = trending ? (trendingQuery.data ?? []) : (memesQuery.data ?? []);
  const isLoading = trending ? trendingQuery.isLoading : memesQuery.isLoading;
  const isError = trending ? trendingQuery.isError : memesQuery.isError;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied!");
  };

  const handleShareTwitter = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(
      `https://twitter.com/intent/tweet?url=${url}&text=Check+out+MemeForge+%F0%9F%94%A5`,
      "_blank",
    );
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Check out MemeForge 🔥 ${window.location.href}`,
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Built by Arjun Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-6 py-2 px-4 rounded-xl bg-primary/10 border border-primary/20 text-sm font-medium text-primary tracking-wide"
      >
        ✨ Built by <span className="font-bold">Arjun</span>
      </motion.div>

      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card overflow-hidden mb-10 p-8 md:p-12 text-center"
        data-ocid="feed.section"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-primary/20 blur-3xl rounded-full pointer-events-none" />

        <div className="relative">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-accent" />
            <span className="text-sm font-medium text-accent uppercase tracking-widest">
              The Internet's Meme Factory
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-4 neon-glow gradient-brand">
            WELCOME TO MEMEFORGE
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-6">
            Create legendary memes, share the laughter, and become a meme lord.
          </p>
          <Button
            onClick={() => navigate({ to: "/create" })}
            size="lg"
            className="bg-gradient-brand text-white font-bold gap-2"
            data-ocid="feed.primary_button"
          >
            <PlusCircle className="h-5 w-5" />
            Start Creating Now
          </Button>
        </div>
      </motion.div>

      {/* Trending Tags */}
      {tagsQuery.data && tagsQuery.data.length > 0 && (
        <div
          className="mb-8 flex flex-wrap items-center gap-2"
          data-ocid="feed.panel"
        >
          <TrendingUp className="h-4 w-4 text-accent" />
          <span className="text-sm text-muted-foreground">Trending:</span>
          {tagsQuery.data.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="cursor-pointer border-primary/30 text-primary hover:bg-primary/10 transition-colors text-xs"
            >
              #{tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          {trending ? (
            <>
              <TrendingUp className="h-5 w-5 text-accent" /> Most Liked
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 text-primary" /> Latest Memes
            </>
          )}
        </h2>
        {isLoading && (
          <div
            className="flex items-center gap-2 text-sm text-muted-foreground"
            data-ocid="feed.loading_state"
          >
            <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            Loading...
          </div>
        )}
      </div>

      {/* Error State */}
      {isError && (
        <div
          className="text-center py-16 text-destructive"
          data-ocid="feed.error_state"
        >
          <p className="text-lg font-medium">Failed to load memes</p>
          <p className="text-sm text-muted-foreground mt-1">
            Please try again later
          </p>
        </div>
      )}

      {/* Meme Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
            <MemeCardSkeleton key={i} />
          ))}
        </div>
      ) : memes.length === 0 ? (
        <div
          className="text-center py-20 rounded-xl border border-dashed border-border"
          data-ocid="feed.empty_state"
        >
          <div className="text-5xl mb-4">😶</div>
          <p className="text-lg font-medium text-muted-foreground">
            No memes yet!
          </p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Be the first to forge a meme.
          </p>
          <Button
            onClick={() => navigate({ to: "/create" })}
            className="bg-gradient-brand text-white"
            data-ocid="feed.primary_button"
          >
            Create First Meme
          </Button>
        </div>
      ) : (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          data-ocid="feed.list"
        >
          {memes.map((meme, i) => (
            <MemeCard key={meme.id.toString()} meme={meme} index={i} />
          ))}
        </div>
      )}

      {/* Share MemeForge Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-16 relative rounded-2xl border border-primary/30 bg-gradient-to-br from-accent/10 via-card to-primary/10 overflow-hidden p-8 text-center"
        data-ocid="feed.panel"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-80 h-24 bg-accent/15 blur-3xl rounded-full pointer-events-none" />

        <div className="relative">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Share2 className="h-5 w-5 text-accent" />
            <span className="text-sm font-medium text-accent uppercase tracking-widest">
              Spread the Laughter
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-2">
            Share MemeForge with Friends
          </h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
            Let your friends in on the fun. Share the link and grow the meme
            community!
          </p>

          <div className="flex items-center justify-center gap-2 mb-6 max-w-lg mx-auto">
            <div className="flex-1 bg-muted/60 border border-border rounded-lg px-3 py-2 text-xs text-muted-foreground truncate text-left font-mono">
              {typeof window !== "undefined" ? window.location.href : ""}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 gap-1.5 border-primary/40 hover:border-primary hover:bg-primary/10"
              onClick={handleCopyLink}
              data-ocid="feed.secondary_button"
            >
              <Copy className="h-4 w-4" />
              Copy
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              size="sm"
              variant="outline"
              className="gap-2 border-sky-500/40 text-sky-400 hover:bg-sky-500/10 hover:border-sky-400"
              onClick={handleShareTwitter}
              data-ocid="feed.secondary_button"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 fill-current"
                aria-hidden="true"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.858L1.872 2.25H8.08l4.262 5.636L18.244 2.25ZM17.085 19.77h1.833L7.084 4.126H5.117L17.085 19.77Z" />
              </svg>
              Share on X
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="gap-2 border-green-500/40 text-green-400 hover:bg-green-500/10 hover:border-green-400"
              onClick={handleShareWhatsApp}
              data-ocid="feed.secondary_button"
            >
              <MessageCircle className="h-4 w-4" />
              Share on WhatsApp
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
