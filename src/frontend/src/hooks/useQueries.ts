import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Meme, UserProfile } from "../backend";
import { useActor } from "./useActor";

export function useGetMemes() {
  const { actor, isFetching } = useActor();
  return useQuery<Meme[]>({
    queryKey: ["memes"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMemes();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetMostLikedMemes(limit = 20n) {
  const { actor, isFetching } = useActor();
  return useQuery<Meme[]>({
    queryKey: ["memes", "mostLiked", limit.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMostLikedMemes(limit);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetTrendingTags(limit = 10n) {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ["tags", "trending"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTrendingTags(limit);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCallerProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["profile", "caller"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetUserProfile(principal: Principal | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["profile", principal?.toString()],
    queryFn: async () => {
      if (!actor || !principal) return null;
      return actor.getUserProfile(principal);
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}

export function useGetMemesByUser(principal: Principal | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<Meme[]>({
    queryKey: ["memes", "user", principal?.toString()],
    queryFn: async () => {
      if (!actor || !principal) return [];
      return actor.getMemesByUser(principal);
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}

export function useHasLikedMeme(id: bigint | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["liked", id?.toString()],
    queryFn: async () => {
      if (!actor || id === undefined) return false;
      return actor.hasLikedMeme(id);
    },
    enabled: !!actor && !isFetching && id !== undefined,
  });
}

export function useToggleLike() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.toggleLikeMeme(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["memes"] });
      qc.invalidateQueries({ queryKey: ["liked"] });
    },
  });
}

export function useCreateMeme() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (req: import("../backend").CreateMemeRequest) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.createMeme(req);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["memes"] });
    },
  });
}

export function useDeleteMeme() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.deleteMeme(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["memes"] });
    },
  });
}

export function useSaveProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function formatTimeAgo(nanoseconds: bigint): string {
  const ms = Number(nanoseconds / 1_000_000n);
  const date = new Date(ms);
  const now = Date.now();
  const diff = now - date.getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}
