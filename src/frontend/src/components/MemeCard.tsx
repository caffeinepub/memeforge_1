import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { Heart, Share2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Meme } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { formatTimeAgo, useToggleLike } from "../hooks/useQueries";

interface MemeCardProps {
  meme: Meme;
  likedByUser?: boolean;
  index?: number;
}

export default function MemeCard({
  meme,
  likedByUser = false,
  index = 0,
}: MemeCardProps) {
  const { identity } = useInternetIdentity();
  const [imgLoaded, setImgLoaded] = useState(false);
  const toggleLike = useToggleLike();

  const authorInitials = meme.authorName.slice(0, 2).toUpperCase();
  const authorId = meme.author.toString();

  const handleLike = () => {
    if (!identity) {
      toast.error("Please login to like memes");
      return;
    }
    toggleLike.mutate(meme.id, {
      onError: () => toast.error("Failed to like meme"),
    });
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/?meme=${meme.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: meme.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied!");
      }
    } catch {
      toast.error("Failed to share");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group rounded-xl border border-border bg-card overflow-hidden card-glow transition-all duration-300 hover:border-primary/40 hover:scale-[1.02]"
      data-ocid={`meme.item.${index + 1}`}
    >
      {/* Title */}
      <div className="px-4 pt-3 pb-2">
        <h3 className="font-semibold text-sm line-clamp-1 text-foreground">
          {meme.title}
        </h3>
      </div>

      {/* Image */}
      <div className="relative bg-muted aspect-[4/3] overflow-hidden">
        {!imgLoaded && (
          <Skeleton
            className="absolute inset-0 rounded-none"
            data-ocid="meme.loading_state"
          />
        )}
        <img
          src={meme.blob.getDirectURL()}
          alt={meme.title}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            imgLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgLoaded(true)}
          loading="lazy"
        />
      </div>

      {/* Tags */}
      {meme.tags.length > 0 && (
        <div className="px-4 py-2 flex flex-wrap gap-1">
          {meme.tags.slice(0, 3).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-xs py-0 px-1.5 bg-muted text-muted-foreground"
            >
              #{tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Meta + Actions */}
      <div className="px-4 pb-3 flex items-center justify-between gap-2">
        <Link
          to="/profile/$userId"
          params={{ userId: authorId }}
          className="flex items-center gap-2 min-w-0"
          data-ocid="meme.link"
        >
          <Avatar className="h-6 w-6 shrink-0">
            <AvatarFallback className="bg-primary/20 text-primary text-xs">
              {authorInitials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-xs font-medium truncate text-foreground">
              {meme.authorName}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatTimeAgo(meme.createdAt)}
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 px-2 gap-1 text-xs ${
              likedByUser
                ? "text-destructive"
                : "text-muted-foreground hover:text-destructive"
            }`}
            onClick={handleLike}
            disabled={toggleLike.isPending}
            data-ocid={`meme.toggle.${index + 1}`}
          >
            <Heart
              className={`h-3.5 w-3.5 ${likedByUser ? "fill-current" : ""}`}
            />
            <span>{meme.likes.toString()}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-accent"
            onClick={handleShare}
            data-ocid={`meme.secondary_button.${index + 1}`}
          >
            <Share2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export function MemeCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 pt-3 pb-2">
        <Skeleton className="h-4 w-3/4" />
      </div>
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="px-4 py-3 flex items-center gap-2">
        <Skeleton className="h-6 w-6 rounded-full" />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-2.5 w-16" />
        </div>
      </div>
    </div>
  );
}
