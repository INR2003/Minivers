import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  User,
  Shield,
  KeyRound,
  Trash2,
  RefreshCw,
  Clock,
  CheckCircle2,
  Pencil,
  X,
  Save,
  Copy,
  Eye,
  EyeOff,
  ChevronLeft,
  Camera,
  ImagePlus,
  Upload,
  ZoomIn,
} from "lucide-react";

import { api, type UserDetails } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/** Resize + compress image to base64 JPEG (max 400×400, quality 0.82). */
function compressImage(file: File, maxPx = 400, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(maxPx / img.width, maxPx / img.height, 1);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Lightbox modal ────────────────────────────────────────────────────────────

function Lightbox({
  src,
  name,
  onClose,
}: {
  src: string;
  name: string;
  onClose: () => void;
}) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      {/* X button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors z-10"
        aria-label="Close preview"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Full-size image */}
      <img
        src={src}
        alt={name}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[88svh] max-w-[92vw] rounded-2xl object-contain shadow-2xl ring-1 ring-white/20 select-none"
        draggable={false}
      />

      {/* Bottom label */}
      <span className="absolute bottom-5 left-1/2 -translate-x-1/2 text-xs text-white/50 font-medium pointer-events-none">
        {name} &nbsp;·&nbsp; Tap outside or press Esc to close
      </span>
    </div>
  );
}

// ── Avatar Picker + viewer ────────────────────────────────────────────────────

function AvatarPicker({
  currentSrc,
  name,
  editing,
  onChange,
}: {
  currentSrc: string;
  name: string;
  editing: boolean;
  onChange: (dataUrl: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [preview, setPreview] = useState(currentSrc);

  // Keep in sync when draft is reset (cancel)
  useEffect(() => { setPreview(currentSrc); }, [currentSrc]);

  const handleFile = useCallback(async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file."); return; }
    try {
      const dataUrl = await compressImage(file);
      setPreview(dataUrl);
      onChange(dataUrl);
      toast.success("Photo selected — save to apply.");
    } catch {
      toast.error("Could not process the image.");
    } finally {
      setShowMenu(false);
    }
  }, [onChange]);

  const handleClick = () => {
    if (editing) { setShowMenu((s) => !s); return; }
    if (preview) setShowLightbox(true);
  };

  return (
    <div className="relative shrink-0">

      {/* Full-screen lightbox */}
      {showLightbox && preview && (
        <Lightbox src={preview} name={name} onClose={() => setShowLightbox(false)} />
      )}

      {/* Hidden inputs */}
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])} />
      <input ref={cameraRef} type="file" accept="image/*" capture="user" className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])} />

      {/* Avatar circle */}
      <div
        onClick={handleClick}
        className={`relative h-20 w-20 sm:h-24 sm:w-24 rounded-full overflow-hidden group
          ${editing ? "cursor-pointer" : preview ? "cursor-zoom-in" : "cursor-default"}`}
      >
        {preview ? (
          <img src={preview} alt={name} className="h-full w-full object-cover border-2 border-[#71C9CE]" />
        ) : (
          <div className="h-full w-full bg-[#007ACC] text-white text-2xl font-bold flex items-center justify-center shadow-md shadow-[#007ACC]/25">
            {getInitials(name)}
          </div>
        )}

        {/* Overlay — edit mode */}
        {editing && (
          <div className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
            <Camera className="h-5 w-5 text-white" />
            <span className="text-[10px] text-white font-semibold mt-0.5">Change</span>
          </div>
        )}

        {/* Overlay — view mode with image */}
        {!editing && preview && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
            <ZoomIn className="h-6 w-6 text-white drop-shadow" />
          </div>
        )}
      </div>

      {/* Picker dropdown menu */}
      {editing && showMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
          <div className="absolute left-0 top-full mt-2 z-20 w-52 rounded-xl border border-[#CBF1F5] dark:border-[#1e364d] bg-white dark:bg-[#111d2e] shadow-xl shadow-black/10 overflow-hidden">

            <button
              className="flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-[#E3FDFD] dark:hover:bg-[#162a3d] transition-colors"
              onClick={() => { setShowMenu(false); fileRef.current?.click(); }}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E3FDFD] dark:bg-[#162a3d] text-[#007ACC]">
                <ImagePlus className="h-4 w-4" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground leading-tight">Choose from device</p>
                <p className="text-xs text-muted-foreground">Gallery, files…</p>
              </div>
            </button>

            <div className="border-t border-[#E3FDFD] dark:border-[#1e364d]" />

            <button
              className="flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-[#E3FDFD] dark:hover:bg-[#162a3d] transition-colors"
              onClick={() => { setShowMenu(false); cameraRef.current?.click(); }}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E3FDFD] dark:bg-[#162a3d] text-[#007ACC]">
                <Camera className="h-4 w-4" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground leading-tight">Take a photo</p>
                <p className="text-xs text-muted-foreground">Use front camera</p>
              </div>
            </button>

            {preview && (
              <>
                <div className="border-t border-[#E3FDFD] dark:border-[#1e364d]" />
                <button
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-destructive/5 transition-colors text-destructive"
                  onClick={() => { setPreview(""); onChange(""); setShowMenu(false); toast.success("Photo removed — save to apply."); }}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                    <X className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold leading-tight">Remove photo</p>
                    <p className="text-xs text-muted-foreground/70">Revert to initials</p>
                  </div>
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-[#CBF1F5] dark:border-[#1e364d]">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E3FDFD] dark:bg-[#162a3d] text-[#007ACC]">
            <Icon className="h-4.5 w-4.5" />
          </div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

// ── Editable field ────────────────────────────────────────────────────────────

function Field({
  label,
  value,
  placeholder,
  type = "text",
  readOnly = false,
  editing,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  type?: string;
  readOnly?: boolean;
  editing: boolean;
  onChange?: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {editing && !readOnly ? (
        <Input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange?.(e.target.value)}
          className="h-9 text-sm border-[#CBF1F5] dark:border-[#234563] focus-visible:border-[#007ACC]"
        />
      ) : (
        <p className="text-sm font-medium text-foreground min-h-[2rem] flex items-center">
          {value || <span className="text-muted-foreground italic">{placeholder || "Not set"}</span>}
        </p>
      )}
    </div>
  );
}

// ── Main profile page ─────────────────────────────────────────────────────────

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserDetails | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [resettingCode, setResettingCode] = useState(false);
  const [newCode, setNewCode] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const deleteInputRef = useRef<HTMLInputElement>(null);

  const [draft, setDraft] = useState({
    name: "", display_name: "", phone: "",
    date_of_birth: "", about: "", avatar_url: "",
  });

  useEffect(() => {
    const raw = localStorage.getItem("minivers_user");
    if (!raw) { navigate("/login"); return; }
    const stored: UserDetails = JSON.parse(raw);
    setUser(stored);
    api.profile.get(stored.id)
      .then((fresh) => { setUser(fresh); localStorage.setItem("minivers_user", JSON.stringify(fresh)); resetDraft(fresh); })
      .catch(() => resetDraft(stored));
  }, [navigate]);

  function resetDraft(u: UserDetails) {
    setDraft({
      name: u.name ?? "", display_name: u.display_name ?? "",
      phone: u.phone ?? "", date_of_birth: u.date_of_birth ?? "",
      about: u.about ?? "", avatar_url: u.avatar_url ?? "",
    });
  }

  function startEdit() { if (user) resetDraft(user); setEditing(true); }
  function cancelEdit() { if (user) resetDraft(user); setEditing(false); }

  async function saveProfile() {
    if (!user) return;
    setSaving(true);
    try {
      const res = await api.profile.update(user.id, {
        name: draft.name, display_name: draft.display_name,
        phone: draft.phone, date_of_birth: draft.date_of_birth || null,
        about: draft.about, avatar_url: draft.avatar_url,
      });
      const updated = res.user;
      setUser(updated);
      localStorage.setItem("minivers_user", JSON.stringify(updated));
      setEditing(false);
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleResetCode() {
    if (!user) return;
    setResettingCode(true);
    try {
      const res = await api.profile.resetCode(user.id);
      setUser(res.user);
      localStorage.setItem("minivers_user", JSON.stringify(res.user));
      setNewCode(res.access_code);
      setShowCode(true);
      toast.success("Access code reset! Save your new code.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setResettingCode(false);
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }

  if (!user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#007ACC] border-t-transparent" />
      </div>
    );
  }

  const displayCode = newCode ?? user.access_code;
  const liveAvatar = editing ? draft.avatar_url : (user.avatar_url ?? "");

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6 sm:py-8 space-y-6">

      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[#007ACC] transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Dashboard
        </button>
        {!editing ? (
          <Button onClick={startEdit} size="sm" className="gap-2 bg-[#007ACC] hover:bg-[#0066b8] text-white cursor-pointer">
            <Pencil className="h-3.5 w-3.5" /> Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={cancelEdit} className="gap-1.5 cursor-pointer border-[#CBF1F5] dark:border-[#234563]">
              <X className="h-3.5 w-3.5" /> Cancel
            </Button>
            <Button size="sm" onClick={saveProfile} disabled={saving} className="gap-1.5 bg-[#007ACC] hover:bg-[#0066b8] text-white cursor-pointer">
              {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        )}
      </div>

      {/* Hero — avatar + info */}
      <div className="flex items-center gap-5 rounded-2xl border border-[#CBF1F5] dark:border-[#1e364d] bg-gradient-to-r from-[#E3FDFD] via-white to-[#CBF1F5]/40 dark:from-[#111d2e] dark:via-[#0b131e] dark:to-[#162a3d] p-5 sm:p-6">
        <AvatarPicker
          currentSrc={liveAvatar}
          name={user.name}
          editing={editing}
          onChange={(url) => setDraft((d) => ({ ...d, avatar_url: url }))}
        />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-extrabold text-foreground truncate">
            {user.display_name || user.name}
          </h1>
          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Member since {formatDate(user.created_at)}</p>
          {!editing && liveAvatar && (
            <p className="text-xs text-[#007ACC]/70 dark:text-[#A6E3E9]/60 mt-1.5 flex items-center gap-1">
              <ZoomIn className="h-3 w-3" /> Click the photo to view full size
            </p>
          )}
          {editing && (
            <p className="text-xs text-[#007ACC] dark:text-[#A6E3E9] mt-1.5 flex items-center gap-1">
              <Upload className="h-3 w-3" /> Click the avatar to change or take a photo
            </p>
          )}
        </div>
      </div>

      {/* ── 1. Personal Information ───────────────────────────────────────────── */}
      <Section icon={User} title="Personal Information" description="Your name, contact, and personal details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <Field label="Full Name" value={editing ? draft.name : user.name}
            placeholder="Your full name" editing={editing}
            onChange={(v) => setDraft((d) => ({ ...d, name: v }))} />
          <Field label="Display Name" value={editing ? draft.display_name : (user.display_name ?? "")}
            placeholder="How you want to be called" editing={editing}
            onChange={(v) => setDraft((d) => ({ ...d, display_name: v }))} />
          <Field label="Email Address" value={user.email} readOnly editing={editing} />
          <Field label="Mobile Number" value={editing ? draft.phone : (user.phone ?? "")}
            placeholder="e.g. +91 98765 43210" editing={editing}
            onChange={(v) => setDraft((d) => ({ ...d, phone: v }))} />
          <Field label="Date of Birth" value={editing ? draft.date_of_birth : (user.date_of_birth ?? "")}
            type="date" editing={editing}
            onChange={(v) => setDraft((d) => ({ ...d, date_of_birth: v }))} />
          <div className="sm:col-span-2 space-y-1">
            <Label className="text-xs text-muted-foreground">About Me</Label>
            {editing ? (
              <textarea
                value={draft.about} placeholder="A few words about yourself…" rows={3}
                onChange={(e) => setDraft((d) => ({ ...d, about: e.target.value }))}
                className="w-full rounded-md border border-[#CBF1F5] dark:border-[#234563] bg-background px-3 py-2 text-sm focus:outline-none focus:border-[#007ACC] resize-none"
              />
            ) : (
              <p className="text-sm font-medium text-foreground min-h-[3rem]">
                {user.about || <span className="text-muted-foreground italic">Not set</span>}
              </p>
            )}
          </div>
        </div>
      </Section>

      {/* ── 2. Account & Security ────────────────────────────────────────────── */}
      <Section icon={Shield} title="Account & Security" description="Your access code, account info and security settings">
        <div className="space-y-5">

          {/* Access Code */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5" /> Access Code
            </Label>
            <div className="flex items-center gap-2 rounded-xl border border-[#CBF1F5] dark:border-[#234563] bg-[#E3FDFD]/50 dark:bg-[#162a3d] px-4 py-2.5">
              <span className="flex-1 font-mono font-bold tracking-[0.2em] text-[#007ACC] dark:text-[#A6E3E9] text-base select-all">
                {showCode ? displayCode : "MINI-•••••"}
              </span>
              <button onClick={() => setShowCode((s) => !s)} className="text-muted-foreground hover:text-[#007ACC] transition-colors p-1" aria-label={showCode ? "Hide" : "Show"}>
                {showCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              {showCode && (
                <button onClick={() => copyCode(displayCode)} className="text-muted-foreground hover:text-[#007ACC] transition-colors p-1" aria-label="Copy">
                  {codeCopied ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </button>
              )}
            </div>
            {newCode && (
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                ⚠️ New code generated — copy it now, it won't be shown again after you leave.
              </p>
            )}
            <Button size="sm" variant="outline" onClick={handleResetCode} disabled={resettingCode}
              className="gap-2 text-xs border-[#CBF1F5] dark:border-[#234563] hover:border-[#007ACC] hover:text-[#007ACC] cursor-pointer">
              <RefreshCw className={`h-3.5 w-3.5 ${resettingCode ? "animate-spin" : ""}`} />
              {resettingCode ? "Resetting…" : "Reset Access Code"}
            </Button>
          </div>

          <hr className="border-[#E3FDFD] dark:border-[#1e364d]" />

          {/* Account dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Account Created
              </Label>
              <p className="text-sm font-medium text-foreground">{formatDate(user.created_at)}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Last Updated
              </Label>
              <p className="text-sm font-medium text-foreground">{formatDate(user.updated_at)}</p>
            </div>
          </div>

          <hr className="border-[#E3FDFD] dark:border-[#1e364d]" />

          {/* Danger zone */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-destructive uppercase tracking-wide">Danger Zone</p>
            {!showDeleteConfirm ? (
              <Button size="sm" variant="outline" onClick={() => setShowDeleteConfirm(true)}
                className="gap-2 text-xs border-destructive/40 text-destructive hover:bg-destructive/10 cursor-pointer">
                <Trash2 className="h-3.5 w-3.5" /> Delete Account
              </Button>
            ) : (
              <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 space-y-3">
                <p className="text-sm font-semibold text-destructive">Are you sure?</p>
                <p className="text-xs text-muted-foreground">
                  Type your access code <span className="font-mono font-bold">{user.access_code}</span> below to confirm. This cannot be undone.
                </p>
                <Input ref={deleteInputRef} placeholder="Enter access code to confirm"
                  className="h-9 text-sm border-destructive/40 focus-visible:border-destructive font-mono" />
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setShowDeleteConfirm(false)} className="cursor-pointer">Cancel</Button>
                  <Button size="sm" className="bg-destructive hover:bg-destructive/90 text-white cursor-pointer gap-1.5"
                    onClick={() => {
                      const val = deleteInputRef.current?.value ?? "";
                      if (val.toUpperCase() !== user.access_code.toUpperCase()) { toast.error("Access code doesn't match"); return; }
                      toast.info("Account deletion coming soon.");
                      setShowDeleteConfirm(false);
                    }}>
                    <Trash2 className="h-3.5 w-3.5" /> Confirm Delete
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Section>

    </div>
  );
}
