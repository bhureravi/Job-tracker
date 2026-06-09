"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tag } from "@/types/tag";

const supabase = createClient();

export default function TagManager({ applicationId }: { applicationId: string }) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagName, setTagName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadTags = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .eq("application_id", applicationId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setTags((data as Tag[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName.trim()) return;

    setSaving(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase.from("tags").insert({
      user_id: user.id,
      application_id: applicationId,
      tag_name: tagName.trim(),
    });

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    setTagName("");
    await loadTags();
    setSaving(false);
  };

  const handleDeleteTag = async (id: string) => {
    const ok = confirm("Delete this tag?");
    if (!ok) return;

    const { error } = await supabase.from("tags").delete().eq("id", id);

    if (error) {
      setError(error.message);
      return;
    }

    await loadTags();
  };

  if (loading) {
    return (
      <section className="mt-8 rounded-2xl border bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">Loading tags...</p>
      </section>
    );
  }

  return (
    <section className="mt-8 rounded-2xl border bg-card p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Tags</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Add labels to quickly find important applications later.
      </p>

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <form onSubmit={handleAddTag} className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          value={tagName}
          onChange={(e) => setTagName(e.target.value)}
          placeholder="Add a tag"
          className="flex-1 rounded-xl border px-4 py-3 outline-none"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-black px-5 py-3 text-white disabled:opacity-60"
        >
          {saving ? "Adding..." : "Add Tag"}
        </button>
      </form>

      {tags.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
          No tags added yet.
        </div>
      ) : (
        <div className="mt-5 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm"
            >
              {tag.tag_name}
              <button
                type="button"
                onClick={() => handleDeleteTag(tag.id)}
                className="text-xs text-muted-foreground hover:text-red-600"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </section>
  );
}