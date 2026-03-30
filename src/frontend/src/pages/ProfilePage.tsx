import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Principal } from "@icp-sdk/core/principal";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Edit, Loader2, PlusCircle, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import MemeCard, { MemeCardSkeleton } from "../components/MemeCard";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useDeleteMeme,
  useGetCallerProfile,
  useGetMemesByUser,
  useGetUserProfile,
  useSaveProfile,
} from "../hooks/useQueries";

function parsePrincipal(id: string): Principal | undefined {
  try {
    return Principal.fromText(id);
  } catch {
    return undefined;
  }
}

export default function ProfilePage() {
  const params = useParams({ strict: false });
  const userId = (params as Record<string, string | undefined>).userId;
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const isOwnProfile =
    !userId || userId === identity?.getPrincipal().toString();

  const principal = userId ? parsePrincipal(userId) : identity?.getPrincipal();

  const callerProfileQuery = useGetCallerProfile();
  const userProfileQuery = useGetUserProfile(
    isOwnProfile ? undefined : principal,
  );
  const memesQuery = useGetMemesByUser(principal);

  const profile = isOwnProfile
    ? callerProfileQuery.data
    : userProfileQuery.data;
  const isProfileLoading = isOwnProfile
    ? callerProfileQuery.isLoading
    : userProfileQuery.isLoading;

  const [editOpen, setEditOpen] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");

  const saveProfile = useSaveProfile();
  const deleteMeme = useDeleteMeme();

  const openEdit = () => {
    setEditUsername(profile?.username || "");
    setEditBio(profile?.bio || "");
    setEditOpen(true);
  };

  const handleSaveProfile = async () => {
    try {
      await saveProfile.mutateAsync({ username: editUsername, bio: editBio });
      toast.success("Profile saved!");
      setEditOpen(false);
    } catch {
      toast.error("Failed to save profile");
    }
  };

  const handleDeleteMeme = async (id: bigint) => {
    try {
      await deleteMeme.mutateAsync(id);
      toast.success("Meme deleted");
    } catch {
      toast.error("Failed to delete meme");
    }
  };

  if (!isAuthenticated && isOwnProfile) {
    return (
      <div
        className="max-w-4xl mx-auto px-4 py-16 text-center"
        data-ocid="profile.section"
      >
        <div className="text-5xl mb-4">🔐</div>
        <h2 className="text-2xl font-bold mb-2">Login Required</h2>
        <p className="text-muted-foreground mb-6">
          Please login to view your profile.
        </p>
        <Button
          onClick={() => navigate({ to: "/login" })}
          className="bg-gradient-brand text-white"
          data-ocid="profile.primary_button"
        >
          Login
        </Button>
      </div>
    );
  }

  const displayName =
    profile?.username ??
    (principal ? `${principal.toString().slice(0, 12)}...` : "Unknown");
  const initials = displayName.slice(0, 2).toUpperCase();
  const memes = memesQuery.data ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8" data-ocid="profile.section">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-6 mb-8 flex flex-col sm:flex-row items-center sm:items-start gap-5"
        data-ocid="profile.card"
      >
        <Avatar className="h-20 w-20 shrink-0">
          <AvatarFallback className="bg-primary/20 text-primary text-2xl font-black">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 text-center sm:text-left">
          {isProfileLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold">{displayName}</h1>
              {profile?.bio && (
                <p className="text-muted-foreground text-sm mt-1 max-w-md">
                  {profile.bio}
                </p>
              )}
              <div className="flex items-center justify-center sm:justify-start gap-4 mt-3 text-sm text-muted-foreground">
                <span>
                  <strong className="text-foreground">{memes.length}</strong>{" "}
                  memes
                </span>
              </div>
            </>
          )}
        </div>

        {isOwnProfile && (
          <div className="flex gap-2">
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openEdit}
                  className="gap-1.5 border-primary/30 hover:bg-primary/10"
                  data-ocid="profile.edit_button"
                >
                  <Edit className="h-3.5 w-3.5" />
                  Edit Profile
                </Button>
              </DialogTrigger>
              <DialogContent data-ocid="profile.dialog">
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      placeholder="Your username"
                      data-ocid="profile.input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder="Tell the world about yourself..."
                      rows={3}
                      data-ocid="profile.textarea"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setEditOpen(false)}
                    data-ocid="profile.cancel_button"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={saveProfile.isPending}
                    className="bg-gradient-brand text-white"
                    data-ocid="profile.save_button"
                  >
                    {saveProfile.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button
              size="sm"
              onClick={() => navigate({ to: "/create" })}
              className="bg-gradient-brand text-white gap-1.5"
              data-ocid="profile.primary_button"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Create
            </Button>
          </div>
        )}
      </motion.div>

      <h2 className="text-lg font-bold mb-4">
        {isOwnProfile ? "Your Memes" : `${displayName}'s Memes`}
      </h2>

      {memesQuery.isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
            <MemeCardSkeleton key={i} />
          ))}
        </div>
      ) : memes.length === 0 ? (
        <div
          className="text-center py-16 rounded-xl border border-dashed border-border"
          data-ocid="profile.empty_state"
        >
          <div className="text-4xl mb-3">😶</div>
          <p className="text-muted-foreground">
            {isOwnProfile
              ? "You haven't created any memes yet."
              : "No memes from this user yet."}
          </p>
          {isOwnProfile && (
            <Button
              onClick={() => navigate({ to: "/create" })}
              className="mt-4 bg-gradient-brand text-white"
              data-ocid="profile.primary_button"
            >
              Create Your First Meme
            </Button>
          )}
        </div>
      ) : (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          data-ocid="profile.list"
        >
          {memes.map((meme, i) => (
            <div
              key={meme.id.toString()}
              className="relative group"
              data-ocid={`profile.item.${i + 1}`}
            >
              <MemeCard meme={meme} index={i} />
              {isOwnProfile && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDeleteMeme(meme.id)}
                  disabled={deleteMeme.isPending}
                  data-ocid={`profile.delete_button.${i + 1}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
