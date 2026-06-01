import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { Post } from "@/lib/posts";

export function PostCard({ post }: { post: Post }) {
  return (
    <article className="group rounded-2xl border border-border bg-card overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg">
      <Link to="/blog/$slug" params={{ slug: post.slug }} className="block">
        <div className="aspect-[16/9] overflow-hidden bg-muted">
          <img
            src={post.coverImage}
            alt={post.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
            }}
          />
        </div>
      </Link>
      <div className="p-5">
        <span className="inline-block text-[11px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-md">
          {post.category}
        </span>
        <h3 className="mt-3 font-display text-lg font-bold leading-snug">
          <Link to="/blog/$slug" params={{ slug: post.slug }} className="hover:text-primary">
            {post.title}
          </Link>
        </h3>
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
        <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
          <img
            src={post.author.avatar}
            alt={post.author.name}
            className="size-8 rounded-full bg-muted object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
            }}
          />
          <div className="flex-1">
            <div className="font-medium text-foreground">{post.author.name}</div>
            <div>
              {new Date(post.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })} · {post.readingTime}
            </div>
          </div>
        </div>
        <Link
          to="/blog/$slug"
          params={{ slug: post.slug }}
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:gap-2 transition-all"
        >
          Read More <ArrowRight className="size-4" />
        </Link>
      </div>
    </article>
  );
}
