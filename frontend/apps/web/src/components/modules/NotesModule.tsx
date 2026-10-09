import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BookOpen,
  Pin,
  Plus,
  Search,
  Trash2,
  Smile,
  Sparkles,
  Calendar,
} from "lucide-react";
import { api } from "@/lib/api";
import type { PersonalNote } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";

const MOODS = [
  { key: "great", label: "Great 😊" },
  { key: "good", label: "Good 🙂" },
  { key: "neutral", label: "Neutral 😐" },
  { key: "down", label: "Down 😔" },
  { key: "motivated", label: "Motivated 🔥" },
  { key: "creative", label: "Creative 💡" },
] as const;

const CATEGORIES = ["Journal", "Ideas", "Reflection", "Work", "Personal"] as const;

export default function NotesModule() {
  const queryClient = useQueryClient();
  const [selectedCat, setSelectedCat] = useState<string>("");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    title: "",
    content: "",
    mood: "good" as PersonalNote["mood"],
    category: "Journal",
    is_pinned: false,
  });

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["notes", selectedCat],
    queryFn: () => api.notes.list(selectedCat ? { category: selectedCat } : {}),
  });

  const createNoteMutation = useMutation({
    mutationFn: (data: Partial<PersonalNote>) => api.notes.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      toast.success("Thought saved to journal!");
      setIsModalOpen(false);
      setForm({
        title: "",
        content: "",
        mood: "good",
        category: "Journal",
        is_pinned: false,
      });
    },
    onError: (err: Error) => toast.error(err.message || "Failed to save note"),
  });

  const togglePinMutation = useMutation({
    mutationFn: ({ id, is_pinned }: { id: number; is_pinned: boolean }) =>
      api.notes.update(id, { is_pinned }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (id: number) => api.notes.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      toast.success("Note removed");
    },
  });

  const filtered = notes.filter((n) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      n.category.toLowerCase().includes(q)
    );
  });

  const getMoodLabel = (moodKey: string) => {
    return MOODS.find((m) => m.key === moodKey)?.label || moodKey;
  };

  return (
    <div className="space-y-6">
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search thoughts & notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="bg-[#007ACC] hover:bg-[#0060a0] text-white"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Write Thought
          </Button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <Button
          size="sm"
          variant={selectedCat === "" ? "default" : "outline"}
          onClick={() => setSelectedCat("")}
          className="text-xs h-8 rounded-full px-3"
        >
          All Thoughts
        </Button>
        {CATEGORIES.map((c) => (
          <Button
            key={c}
            size="sm"
            variant={selectedCat === c ? "default" : "outline"}
            onClick={() => setSelectedCat(c)}
            className="text-xs h-8 rounded-full px-3 whitespace-nowrap"
          >
            {c}
          </Button>
        ))}
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-8 text-center text-xs text-muted-foreground">
            Loading private notes...
          </div>
        ) : filtered.length === 0 ? (
          <Card className="col-span-full border-dashed border-2 p-8 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-40" />
            <h3 className="font-semibold text-foreground">No Thoughts Logged Yet</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Write down your daily ideas, reflections, and personal diary notes.
            </p>
            <Button onClick={() => setIsModalOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Write First Entry
            </Button>
          </Card>
        ) : (
          filtered.map((note) => (
            <Card
              key={note.id}
              className={`relative overflow-hidden transition-all hover:shadow-md ${
                note.is_pinned ? "border-[#007ACC]/50 dark:border-[#007ACC]/40 bg-[#007ACC]/5" : ""
              }`}
            >
              <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-3">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {note.category}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          togglePinMutation.mutate({
                            id: note.id,
                            is_pinned: !note.is_pinned,
                          })
                        }
                        className={`p-1 rounded-md transition-colors ${
                          note.is_pinned
                            ? "text-[#007ACC]"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        title={note.is_pinned ? "Unpin" : "Pin to top"}
                      >
                        <Pin className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteNoteMutation.mutate(note.id)}
                        className="p-1 text-muted-foreground hover:text-rose-500 rounded-md transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="font-bold text-sm text-foreground mt-2">{note.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap line-clamp-6 leading-relaxed">
                    {note.content}
                  </p>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{getMoodLabel(note.mood)}</span>
                  <span>{note.created_at.slice(0, 10)}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal: Write Thought */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Write Thought / Journal"
        description="Private space for daily reflections, ideas, and diary entries."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createNoteMutation.mutate(form);
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <Label className="text-xs">Title *</Label>
            <Input
              required
              placeholder="e.g. Weekly Reflections, Startup Idea"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Category</Label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs">Current Mood</Label>
              <select
                value={form.mood}
                onChange={(e) => setForm({ ...form, mood: e.target.value as PersonalNote["mood"] })}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
              >
                {MOODS.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label className="text-xs">Note Content *</Label>
            <textarea
              required
              rows={5}
              placeholder="Write what's on your mind..."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="pin_note"
              checked={form.is_pinned}
              onChange={(e) => setForm({ ...form, is_pinned: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="pin_note" className="text-xs font-normal cursor-pointer">
              Pin this note to the top
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createNoteMutation.isPending}>
              {createNoteMutation.isPending ? "Saving..." : "Save Thought"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
