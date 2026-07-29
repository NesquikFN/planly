"use client";

// Minimal "Сообщество" feed — a plain page-local hook (not a Context/Provider
// like the other stores) because only /community reads it today. Persisted
// to its own localStorage key, same hydrate-after-mount pattern as every
// other store here to dodge SSR/client mismatches.
//
// Backend-ready by design: every mutation below (create/delete/like/comment)
// is a small pure function of the current state. Swapping this for a real
// API later means replacing the bodies of these callbacks with network calls
// and `items` with server data — the component tree and prop shapes
// (CommunityPost/CommunityComment) don't need to change. No auth, no
// realtime, no WebSocket here yet: every post is implicitly "by me, on this
// device" until a real backend exists (see the notice rendered on the page).

import { useCallback, useEffect, useState } from "react";
import { readStorage, writeStorage } from "@/lib/storage";

const COMMUNITY_STORAGE_KEY = "planly:community";

export const POST_MAX_LENGTH = 500;
export const COMMENT_MAX_LENGTH = 300;

export interface CommunityComment {
  id: string;
  authorName: string;
  authorAvatar: string | null;
  createdAt: string;
  content: string;
}

export interface CommunityPost {
  id: string;
  authorName: string;
  authorAvatar: string | null;
  createdAt: string;
  content: string;
  likedByMe: boolean;
  likesCount: number;
  comments: CommunityComment[];
}

function generateId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

interface Author {
  name: string;
  avatar: string | null;
}

export function useCommunityStore() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStorage<CommunityPost[] | null>(COMMUNITY_STORAGE_KEY, null);
    if (stored) setPosts(stored);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writeStorage(COMMUNITY_STORAGE_KEY, posts);
  }, [posts, hydrated]);

  const createPost = useCallback((content: string, author: Author): boolean => {
    const trimmed = content.trim();
    if (!trimmed || trimmed.length > POST_MAX_LENGTH) return false;

    const post: CommunityPost = {
      id: generateId("post"),
      authorName: author.name,
      authorAvatar: author.avatar,
      createdAt: new Date().toISOString(),
      content: trimmed,
      likedByMe: false,
      likesCount: 0,
      comments: [],
    };
    setPosts((prev) => [post, ...prev]);
    return true;
  }, []);

  // Every post is implicitly "mine" in this local-only version (no accounts
  // yet) — a real backend would check authorId === currentUserId here first.
  const deletePost = useCallback((id: string) => {
    setPosts((prev) => prev.filter((post) => post.id !== id));
  }, []);

  const toggleLike = useCallback((id: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === id
          ? { ...post, likedByMe: !post.likedByMe, likesCount: post.likesCount + (post.likedByMe ? -1 : 1) }
          : post,
      ),
    );
  }, []);

  const addComment = useCallback((postId: string, content: string, author: Author): boolean => {
    const trimmed = content.trim();
    if (!trimmed || trimmed.length > COMMENT_MAX_LENGTH) return false;

    const comment: CommunityComment = {
      id: generateId("comment"),
      authorName: author.name,
      authorAvatar: author.avatar,
      createdAt: new Date().toISOString(),
      content: trimmed,
    };
    setPosts((prev) =>
      prev.map((post) => (post.id === postId ? { ...post, comments: [...post.comments, comment] } : post)),
    );
    return true;
  }, []);

  return { posts, hydrated, createPost, deletePost, toggleLike, addComment };
}
