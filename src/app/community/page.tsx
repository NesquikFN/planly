"use client";

import { useState } from "react";
import { Heart, MessageCircle, Trash2, Users } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { Avatar } from "@/components/ui/Avatar";
import { useProfileStore } from "@/hooks/useProfileStore";
import {
  COMMENT_MAX_LENGTH,
  POST_MAX_LENGTH,
  useCommunityStore,
  type CommunityPost,
} from "@/hooks/useCommunityStore";
import { BUTTON_PRIMARY, INPUT } from "@/lib/ui-tokens";
import { cn } from "@/lib/utils";

function formatPostDate(iso: string): string {
  const date = new Date(iso);
  const datePart = date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  const timePart = date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  return `${datePart}, ${timePart}`;
}

function PostComposer({ onSubmit }: { onSubmit: (content: string) => boolean }) {
  const { profile } = useProfileStore();
  const [content, setContent] = useState("");
  const [error, setError] = useState(false);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const ok = onSubmit(content);
    if (ok) {
      setContent("");
      setError(false);
    } else {
      setError(true);
    }
  }

  const overLimit = content.length > POST_MAX_LENGTH;

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/8 dark:bg-surface dark:shadow-none"
    >
      <div className="flex gap-3">
        <Avatar name={profile.displayName} src={profile.avatarDataUrl} size={36} />
        <textarea
          value={content}
          onChange={(event) => {
            setContent(event.target.value);
            setError(false);
          }}
          rows={2}
          placeholder="Поделитесь чем-то с сообществом..."
          className={cn(INPUT, "resize-none")}
        />
      </div>
      <div className="mt-2 flex items-center justify-between pl-[calc(36px+0.75rem)]">
        <span className={cn("text-xs", overLimit ? "text-red-500" : "text-gray-400 dark:text-ink-faint")}>
          {content.length} / {POST_MAX_LENGTH}
          {error && !content.trim() && " — введите текст публикации"}
        </span>
        <button
          type="submit"
          disabled={!content.trim() || overLimit}
          className={BUTTON_PRIMARY}
        >
          Опубликовать
        </button>
      </div>
    </form>
  );
}

function CommentForm({ onSubmit }: { onSubmit: (content: string) => boolean }) {
  const [content, setContent] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (onSubmit(content)) setContent("");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex gap-2">
      <input
        type="text"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        maxLength={COMMENT_MAX_LENGTH}
        placeholder="Написать комментарий..."
        className={cn(INPUT, "py-1.5")}
      />
      <button
        type="submit"
        disabled={!content.trim()}
        className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Отправить
      </button>
    </form>
  );
}

function PostCard({
  post,
  onDelete,
  onToggleLike,
  onAddComment,
}: {
  post: CommunityPost;
  onDelete: () => void;
  onToggleLike: () => void;
  onAddComment: (content: string) => boolean;
}) {
  const [showComments, setShowComments] = useState(false);

  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/8 dark:bg-surface dark:shadow-none">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <Avatar name={post.authorName} src={post.authorAvatar} size={36} />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-ink">{post.authorName}</p>
            <p className="text-xs text-gray-400 dark:text-ink-faint">{formatPostDate(post.createdAt)}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onDelete}
          aria-label="Удалить публикацию"
          className="shrink-0 rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500 dark:text-ink-faint dark:hover:bg-red-500/10"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700 dark:text-ink-dim">{post.content}</p>

      <div className="mt-3 flex items-center gap-4 text-sm">
        <button
          type="button"
          onClick={onToggleLike}
          aria-pressed={post.likedByMe}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-2 py-1 font-medium transition-colors",
            post.likedByMe
              ? "text-red-500"
              : "text-gray-400 hover:text-red-500 dark:text-ink-faint",
          )}
        >
          <Heart size={15} fill={post.likedByMe ? "currentColor" : "none"} />
          {post.likesCount}
        </button>
        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 font-medium text-gray-400 hover:text-gray-600 dark:text-ink-faint dark:hover:text-ink-dim"
        >
          <MessageCircle size={15} />
          {post.comments.length}
        </button>
      </div>

      {showComments && (
        <div className="mt-2 border-t border-gray-100 pt-3 dark:border-white/8">
          {post.comments.length > 0 && (
            <ul className="space-y-2">
              {post.comments.map((comment) => (
                <li key={comment.id} className="flex items-start gap-2.5">
                  <Avatar name={comment.authorName} src={comment.authorAvatar} size={24} />
                  <div className="min-w-0 rounded-lg bg-gray-50 px-3 py-1.5 text-sm dark:bg-surface-2">
                    <span className="font-medium text-gray-900 dark:text-ink">{comment.authorName}</span>{" "}
                    <span className="text-gray-600 dark:text-ink-dim">{comment.content}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <CommentForm onSubmit={onAddComment} />
        </div>
      )}
    </article>
  );
}

export default function CommunityPage() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { profile } = useProfileStore();
  const { posts, createPost, deletePost, toggleLike, addComment } = useCommunityStore();

  const author = { name: profile.displayName, avatar: profile.avatarDataUrl };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-canvas">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-h-screen flex-col lg:pl-64">
        <Header onMenuClick={() => setSidebarOpen(true)} title="Сообщество" enableTaskSearch={false} />

        <main className="mx-auto w-full max-w-2xl flex-1 space-y-4 px-4 pb-16 pt-2 sm:px-6 lg:px-8">
          <div className="flex items-start gap-2 rounded-xl border border-gray-100 bg-gray-50/60 p-3 text-xs text-gray-500 dark:border-white/8 dark:bg-surface-2/60 dark:text-ink-faint">
            <Users size={15} className="mt-0.5 shrink-0 text-accent" />
            <span>
              Первая версия «Сообщества» работает локально: публикации видны только вам на этом устройстве, пока в
              Planly нет общего сервера.
            </span>
          </div>

          <PostComposer onSubmit={(content) => createPost(content, author)} />

          {posts.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-400 shadow-sm dark:border-white/8 dark:bg-surface dark:text-ink-faint dark:shadow-none">
              Пока нет ни одной публикации — станьте первым.
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onDelete={() => deletePost(post.id)}
                  onToggleLike={() => toggleLike(post.id)}
                  onAddComment={(content) => addComment(post.id, content, author)}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
