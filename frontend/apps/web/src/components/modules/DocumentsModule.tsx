import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  FileText,
  UploadCloud,
  Folder,
  Download,
  Trash2,
  RotateCcw,
  Search,
  File,
  Eye,
  Lock,
} from "lucide-react";
import { api } from "@/lib/api";
import type { StoredDocument } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";

const FOLDERS = [
  "Identity",
  "Financial",
  "Work",
  "Medical",
  "Personal",
  "Education",
  "Other",
] as const;

export default function DocumentsModule() {
  const queryClient = useQueryClient();
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [showTrash, setShowTrash] = useState(false);
  const [search, setSearch] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const [form, setForm] = useState({
    title: "",
    file_name: "",
    file_type: "pdf",
    file_size: 0,
    file_data: "",
    folder: "Identity",
    tags: "",
    description: "",
  });

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents", selectedFolder, showTrash],
    queryFn: () =>
      api.documents.list({
        folder: selectedFolder || undefined,
        trashed: showTrash,
      }),
  });

  const uploadMutation = useMutation({
    mutationFn: (data: Partial<StoredDocument>) => api.documents.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      toast.success("Document uploaded securely!");
      setIsUploadOpen(false);
      setForm({
        title: "",
        file_name: "",
        file_type: "pdf",
        file_size: 0,
        file_data: "",
        folder: "Identity",
        tags: "",
        description: "",
      });
    },
    onError: (err: Error) => toast.error(err.message || "Failed to upload document"),
  });

  const trashMutation = useMutation({
    mutationFn: (id: number) => api.documents.trash(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document moved to trash");
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: number) => api.documents.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document restored");
    },
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: (id: number) => api.documents.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document deleted permanently");
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const ext = file.name.split(".").pop() || "file";
      setForm((prev) => ({
        ...prev,
        file_name: file.name,
        file_type: ext.toLowerCase(),
        file_size: file.size,
        file_data: base64,
        title: prev.title || file.name.replace(/\.[^/.]+$/, ""),
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = (doc: StoredDocument) => {
    if (!doc.file_data) {
      toast.error("No file content stored.");
      return;
    }
    const a = document.createElement("a");
    a.href = doc.file_data;
    a.download = doc.file_name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(`Downloaded ${doc.file_name}`);
  };

  const filtered = documents.filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      d.title.toLowerCase().includes(q) ||
      d.file_name.toLowerCase().includes(q) ||
      d.folder.toLowerCase().includes(q) ||
      d.tags.toLowerCase().includes(q)
    );
  });

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Folder Filters and Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents, tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={showTrash ? "default" : "outline"}
            onClick={() => setShowTrash(!showTrash)}
            className="text-xs h-8"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            {showTrash ? "Exit Trash" : "Trash"}
          </Button>
          <Button
            size="sm"
            onClick={() => setIsUploadOpen(true)}
            className="bg-[#007ACC] hover:bg-[#0060a0] text-white"
          >
            <UploadCloud className="h-4 w-4 mr-1.5" /> Upload File
          </Button>
        </div>
      </div>

      {/* Folders Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none touch-pan-x">
        <Button
          size="sm"
          variant={selectedFolder === "" ? "default" : "outline"}
          onClick={() => setSelectedFolder("")}
          className="text-xs h-8 rounded-full px-3"
        >
          All Folders
        </Button>
        {FOLDERS.map((f) => (
          <Button
            key={f}
            size="sm"
            variant={selectedFolder === f ? "default" : "outline"}
            onClick={() => setSelectedFolder(f)}
            className="text-xs h-8 rounded-full px-3 flex items-center gap-1.5 whitespace-nowrap"
          >
            <Folder className="h-3 w-3" /> {f}
          </Button>
        ))}
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <div className="col-span-full py-8 text-center text-xs text-muted-foreground">
            Loading private documents...
          </div>
        ) : filtered.length === 0 ? (
          <Card className="col-span-full border-dashed border-2 p-8 text-center">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-40" />
            <h3 className="font-semibold text-foreground">
              {showTrash ? "Trash is empty" : "No Documents Found"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              {showTrash
                ? "Items moved to trash will appear here."
                : "Upload Aadhaar, Passport, Certificates, Pay Slips, or Medical bills."}
            </p>
            {!showTrash && (
              <Button onClick={() => setIsUploadOpen(true)} size="sm">
                <UploadCloud className="h-4 w-4 mr-1" /> Upload First File
              </Button>
            )}
          </Card>
        ) : (
          filtered.map((doc) => (
            <Card key={doc.id} className="relative overflow-hidden hover:shadow-md transition-all">
              <CardContent className="p-4 flex flex-col justify-between h-full space-y-3">
                <div className="flex items-start justify-between">
                  <div className="p-2.5 rounded-xl bg-[#007ACC]/10 text-[#007ACC]">
                    <File className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className="text-[9px] uppercase">
                    {doc.folder}
                  </Badge>
                </div>

                <div>
                  <h4 className="font-bold text-xs text-foreground truncate" title={doc.title}>
                    {doc.title}
                  </h4>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                    {doc.file_name}
                  </p>
                  <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-2">
                    <span>{formatSize(doc.file_size)}</span>
                    <span>•</span>
                    <span>{doc.created_at.slice(0, 10)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs px-2.5"
                    onClick={() => handleDownload(doc)}
                  >
                    <Download className="h-3.5 w-3.5 mr-1" /> Download
                  </Button>

                  {doc.is_trashed ? (
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-emerald-600"
                        title="Restore"
                        onClick={() => restoreMutation.mutate(doc.id)}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-rose-600"
                        title="Delete permanently"
                        onClick={() => permanentDeleteMutation.mutate(doc.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-rose-600"
                      title="Move to trash"
                      onClick={() => trashMutation.mutate(doc.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal: Upload Document */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Upload File"
        description="Encrypted, private personal file storage."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.file_data) {
              toast.error("Please pick a file to upload");
              return;
            }
            uploadMutation.mutate({
              title: form.title,
              file_name: form.file_name,
              file_type: form.file_type,
              file_size: form.file_size,
              file_data: form.file_data,
              folder: form.folder,
              tags: form.tags,
              description: form.description,
            });
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <Label className="text-xs">Select File (PDF, Image, Doc) *</Label>
            <Input
              type="file"
              required
              onChange={handleFileChange}
              className="mt-1 file:text-xs file:font-semibold"
            />
            {form.file_name && (
              <span className="text-[11px] text-muted-foreground mt-1 block">
                Selected: {form.file_name} ({formatSize(form.file_size)})
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Document Title *</Label>
              <Input
                required
                placeholder="e.g. Passport Scan, Salary Slip June"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Folder</Label>
              <select
                value={form.folder}
                onChange={(e) => setForm({ ...form, folder: e.target.value })}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
              >
                {FOLDERS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label className="text-xs">Tags (comma separated)</Label>
            <Input
              placeholder="e.g. government, tax, confidential"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs">Description / Notes</Label>
            <Input
              placeholder="Optional notes about this document"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="ghost" onClick={() => setIsUploadOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={uploadMutation.isPending}>
              {uploadMutation.isPending ? "Uploading..." : "Save Document"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
