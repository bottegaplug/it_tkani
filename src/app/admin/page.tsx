"use client";

import { useState, useEffect, useCallback } from "react";
import type { Post } from "@/types";
import { uploadFile } from "@/lib/upload-client";

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [editing, setEditing] = useState<Post | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isNew, setIsNew] = useState(false);
  const [price, setPrice] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [saving, setSaving] = useState(false);

  const checkAuth = useCallback(async () => {
    const res = await fetch("/api/auth");
    if (res.ok) setAuthenticated(true);
  }, []);

  const fetchPosts = useCallback(async () => {
    const res = await fetch("/api/posts");
    if (res.ok) {
      const data = await res.json();
      setPosts(data);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (authenticated) fetchPosts();
  }, [authenticated, fetchPosts]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAuthenticated(true);
    } else {
      setAuthError("Неверный пароль");
    }
  };

  const logout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    setAuthenticated(false);
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setImages([]);
    setVideos([]);
    setTags([]);
    setTagInput("");
    setIsNew(false);
    setPrice("");
    setEditing(null);
    setShowForm(false);
  };

  const startEdit = (post: Post) => {
    setEditing(post);
    setTitle(post.title);
    setDescription(post.description);
    setImages(post.images || []);
    setVideos(post.videos || []);
    setTags(post.tags || []);
    setIsNew(post.is_new);
    setPrice(post.price || "");
    setShowForm(true);
  };

  const startNew = () => {
    resetForm();
    setShowForm(true);
  };

  const uploadFiles = async (files: FileList, type: "image" | "video") => {
    setUploading(true);
    setUploadError("");
    const newUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const url = await uploadFile(files[i]);
        newUrls.push(url);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Неизвестная ошибка";
        setUploadError(`Ошибка загрузки ${files[i].name}: ${msg}`);
      }
    }

    if (type === "image") {
      setImages((prev) => [...prev, ...newUrls]);
    } else {
      setVideos((prev) => [...prev, ...newUrls]);
    }
    setUploading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    await uploadFiles(e.target.files, "image");
    e.target.value = "";
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    await uploadFiles(e.target.files, "video");
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    setVideos((prev) => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/^#/, "");
    if (tag && !tags.includes(tag)) {
      setTags((prev) => [...prev, tag]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  };

  const savePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const body = {
      ...(editing ? { id: editing.id } : {}),
      title,
      description,
      images,
      videos,
      tags,
      is_new: isNew,
      price,
    };

    const res = await fetch("/api/posts", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      resetForm();
      fetchPosts();
    }
    setSaving(false);
  };

  const deletePost = async (id: string) => {
    if (!confirm("Удалить эту запись?")) return;

    await fetch("/api/posts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchPosts();
  };

  // Login screen
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center px-4">
        <form onSubmit={login} className="w-full max-w-sm bg-white p-8 border border-[#e8e0d8]">
          <h1 className="font-heading text-3xl font-semibold text-[#2c2825] mb-1 text-center">
            IT Tkani
          </h1>
          <p className="text-sm text-[#8a8178] text-center mb-8">Панель администратора</p>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль"
            className="w-full py-3 px-4 bg-[#f5f0eb] border border-[#e8e0d8] text-sm text-[#2c2825] placeholder-[#8a8178] focus:outline-none focus:border-[#8a8178] mb-4"
            autoFocus
          />

          {authError && (
            <p className="text-red-600 text-sm mb-4">{authError}</p>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-[#2c2825] text-white font-heading text-base tracking-wide hover:bg-[#3d3632] transition-colors"
          >
            Войти
          </button>
        </form>
      </div>
    );
  }

  // Admin panel
  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Admin header */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#e8e0d8]">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <a href="/" className="font-heading text-2xl font-semibold text-[#2c2825]">
              IT Tkani
            </a>
            <span className="text-xs text-[#8a8178] border border-[#e8e0d8] px-2 py-1 uppercase tracking-wider">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={startNew}
              className="px-5 py-2 bg-[#2c2825] text-white text-sm font-heading tracking-wide hover:bg-[#3d3632] transition-colors"
            >
              + Новая запись
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm text-[#8a8178] border border-[#e8e0d8] hover:bg-[#f5f0eb] transition-colors"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-8">
        {/* Post form */}
        {showForm && (
          <div className="bg-white border border-[#e8e0d8] p-6 lg:p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-2xl font-semibold text-[#2c2825]">
                {editing ? "Редактировать запись" : "Новая запись"}
              </h2>
              <button
                onClick={resetForm}
                className="p-1 text-[#8a8178] hover:text-[#2c2825]"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={savePost} className="space-y-5">
              <div>
                <label className="block text-sm text-[#2c2825] mb-1.5">Название</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full py-2.5 px-4 bg-[#f5f0eb] border border-[#e8e0d8] text-sm text-[#2c2825] focus:outline-none focus:border-[#8a8178]"
                />
              </div>

              <div>
                <label className="block text-sm text-[#2c2825] mb-1.5">Описание</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  className="w-full py-2.5 px-4 bg-[#f5f0eb] border border-[#e8e0d8] text-sm text-[#2c2825] focus:outline-none focus:border-[#8a8178] resize-y"
                />
              </div>

              <div>
                <label className="block text-sm text-[#2c2825] mb-1.5">Цена</label>
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Например: 3500 ₽/м"
                  className="w-full py-2.5 px-4 bg-[#f5f0eb] border border-[#e8e0d8] text-sm text-[#2c2825] placeholder-[#8a8178] focus:outline-none focus:border-[#8a8178]"
                />
              </div>

              {uploadError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
                  {uploadError}
                </div>
              )}

              {/* Photos */}
              <div>
                <label className="block text-sm text-[#2c2825] mb-1.5">
                  Фотографии ({images.length})
                </label>
                <div className="flex flex-wrap gap-3 mb-3">
                  {images.map((url, i) => (
                    <div key={i} className="relative w-24 h-24 bg-[#f5f0eb]">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-xs flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <label className="inline-flex items-center gap-2 px-4 py-2 border border-[#e8e0d8] text-sm text-[#8a8178] hover:bg-[#f5f0eb] transition-colors cursor-pointer">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  {uploading ? "Загрузка..." : "Загрузить фото"}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Videos */}
              <div>
                <label className="block text-sm text-[#2c2825] mb-1.5">
                  Видео ({videos.length})
                </label>
                <div className="flex flex-wrap gap-3 mb-3">
                  {videos.map((url, i) => (
                    <div key={i} className="relative w-32 h-24 bg-[#1a1a1a]">
                      <video src={url} className="w-full h-full object-cover" muted />
                      <button
                        type="button"
                        onClick={() => removeVideo(i)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-xs flex items-center justify-center"
                      >
                        ×
                      </button>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="white" opacity="0.7">
                          <polygon points="5,3 19,12 5,21" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
                <label className="inline-flex items-center gap-2 px-4 py-2 border border-[#e8e0d8] text-sm text-[#8a8178] hover:bg-[#f5f0eb] transition-colors cursor-pointer">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                  {uploading ? "Загрузка..." : "Загрузить видео"}
                  <input
                    type="file"
                    accept="video/*,video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm,.avi"
                    multiple
                    onChange={handleVideoUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm text-[#2c2825] mb-1.5">Хештеги</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 px-2 py-1 bg-[#f5f0eb] text-sm text-[#2c2825]"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-[#8a8178] hover:text-red-500"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Введите тег и нажмите Enter"
                    className="flex-1 py-2.5 px-4 bg-[#f5f0eb] border border-[#e8e0d8] text-sm text-[#2c2825] placeholder-[#8a8178] focus:outline-none focus:border-[#8a8178]"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 border border-[#e8e0d8] text-sm text-[#8a8178] hover:bg-[#f5f0eb] transition-colors"
                  >
                    Добавить
                  </button>
                </div>
              </div>

              {/* Is New toggle — fixed */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <button
                  type="button"
                  role="switch"
                  aria-checked={isNew}
                  onClick={() => setIsNew(!isNew)}
                  className={`relative w-11 h-6 rounded-none transition-colors ${
                    isNew ? "bg-[#2c2825]" : "bg-[#e8e0d8]"
                  }`}
                >
                  <span
                    className="absolute top-[3px] left-[3px] w-[18px] h-[18px] bg-white transition-transform"
                    style={{ transform: isNew ? "translateX(20px)" : "translateX(0)" }}
                  />
                </button>
                <span className="text-sm text-[#2c2825]">Новинка</span>
              </label>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 bg-[#2c2825] text-white font-heading text-base tracking-wide hover:bg-[#3d3632] transition-colors disabled:opacity-50"
                >
                  {saving ? "Сохранение..." : editing ? "Сохранить" : "Создать"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 border border-[#e8e0d8] text-sm text-[#8a8178] hover:bg-[#f5f0eb] transition-colors"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Posts list */}
        <div className="space-y-3">
          {posts.length === 0 && !showForm && (
            <div className="text-center py-16">
              <p className="font-heading text-2xl text-[#8a8178] mb-3">Нет записей</p>
              <button
                onClick={startNew}
                className="px-6 py-3 bg-[#2c2825] text-white font-heading tracking-wide hover:bg-[#3d3632] transition-colors"
              >
                Создать первую запись
              </button>
            </div>
          )}

          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white border border-[#e8e0d8] p-4 flex items-center gap-4"
            >
              {/* Thumbnail */}
              <div className="w-16 h-16 bg-[#f5f0eb] shrink-0">
                {post.images?.[0] ? (
                  <img
                    src={post.images[0]}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#8a8178] text-xs">
                    —
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-heading text-lg text-[#2c2825] truncate">
                    {post.title}
                  </h3>
                  {post.is_new && (
                    <span className="text-[10px] bg-[#2c2825] text-white px-1.5 py-0.5 uppercase tracking-wider shrink-0">
                      New
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-[#8a8178]">
                    {post.images?.length || 0} фото
                  </span>
                  {(post.videos?.length || 0) > 0 && (
                    <span className="text-xs text-[#8a8178]">
                      {post.videos.length} видео
                    </span>
                  )}
                  <span className="text-xs text-[#8a8178]">
                    {post.tags?.length || 0} тегов
                  </span>
                  <span className="text-xs text-[#8a8178]">
                    {new Date(post.created_at).toLocaleDateString("ru-RU")}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => startEdit(post)}
                  className="px-3 py-1.5 text-sm text-[#2c2825] border border-[#e8e0d8] hover:bg-[#f5f0eb] transition-colors"
                >
                  Изменить
                </button>
                <button
                  onClick={() => deletePost(post.id)}
                  className="px-3 py-1.5 text-sm text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
