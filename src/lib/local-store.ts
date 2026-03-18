import fs from "fs";
import path from "path";
import type { Post } from "@/types";

const DATA_DIR = path.join(process.cwd(), "data");
const POSTS_FILE = path.join(DATA_DIR, "posts.json");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function readPosts(): Post[] {
  ensureDir();
  if (!fs.existsSync(POSTS_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(POSTS_FILE, "utf-8");
    return JSON.parse(raw) as Post[];
  } catch {
    return [];
  }
}

export function writePosts(posts: Post[]) {
  ensureDir();
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2), "utf-8");
}

export function createPost(input: Omit<Post, "id" | "created_at">): Post {
  const posts = readPosts();
  const newPost: Post = {
    id: crypto.randomUUID(),
    title: input.title,
    description: input.description || "",
    images: input.images || [],
    videos: input.videos || [],
    tags: input.tags || [],
    is_new: input.is_new || false,
    price: input.price || "",
    created_at: new Date().toISOString(),
  };
  posts.unshift(newPost);
  writePosts(posts);
  return newPost;
}

export function updatePost(id: string, input: Partial<Post>): Post | null {
  const posts = readPosts();
  const idx = posts.findIndex((p) => p.id === id);
  if (idx === -1) return null;

  posts[idx] = {
    ...posts[idx],
    title: input.title ?? posts[idx].title,
    description: input.description ?? posts[idx].description,
    images: input.images ?? posts[idx].images,
    videos: input.videos ?? posts[idx].videos,
    tags: input.tags ?? posts[idx].tags,
    is_new: input.is_new ?? posts[idx].is_new,
    price: input.price ?? posts[idx].price,
  };
  writePosts(posts);
  return posts[idx];
}

export function deletePost(id: string): boolean {
  const posts = readPosts();
  const filtered = posts.filter((p) => p.id !== id);
  if (filtered.length === posts.length) return false;
  writePosts(filtered);
  return true;
}
