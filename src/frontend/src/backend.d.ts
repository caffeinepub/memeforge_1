import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Meme {
    id: bigint;
    title: string;
    blob: ExternalBlob;
    createdAt: bigint;
    tags: Array<string>;
    authorName: string;
    author: Principal;
    likes: bigint;
}
export interface CreateMemeRequest {
    title: string;
    blob: ExternalBlob;
    tags: Array<string>;
    authorName: string;
}
export interface UserProfile {
    bio: string;
    username: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createMeme(req: CreateMemeRequest): Promise<bigint>;
    deleteMeme(id: bigint): Promise<void>;
    getAllUserProfiles(): Promise<Array<UserProfile>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMemeById(id: bigint): Promise<Meme | null>;
    getMemeCount(): Promise<bigint>;
    getMemes(): Promise<Array<Meme>>;
    getMemesByUser(user: Principal): Promise<Array<Meme>>;
    getMostLikedMemes(limit: bigint): Promise<Array<Meme>>;
    getTotalLikes(): Promise<bigint>;
    getTrendingTags(limit: bigint): Promise<Array<string>>;
    getUserMemeCount(user: Principal): Promise<bigint>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserTotalLikes(user: Principal): Promise<bigint>;
    hasLikedMeme(id: bigint): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    toggleLikeMeme(id: bigint): Promise<void>;
    upsertUserProfile(profile: UserProfile): Promise<void>;
}
