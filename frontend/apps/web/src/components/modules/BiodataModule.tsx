import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  User,
  GraduationCap,
  Briefcase,
  Target,
  Phone,
  Calendar,
  Sparkles,
  MapPin,
  Heart,
  Edit3,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { api } from "@/lib/api";
import type { PersonalBiodata } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function BiodataModule() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const storedUserRaw = typeof window !== "undefined" ? localStorage.getItem("minivers_user") : null;
  const currentUser = storedUserRaw ? JSON.parse(storedUserRaw) : null;

  const { data: biodata, isLoading } = useQuery({
    queryKey: ["biodata"],
    queryFn: () => api.biodata.get(),
  });

  const [form, setForm] = useState<Partial<PersonalBiodata>>({
    gender: "",
    blood_group: "",
    marital_status: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    skills: [],
    interests: [],
    education: [],
    employment: [],
    personal_goals: [],
    emergency_contacts: [],
  });

  const [newSkill, setNewSkill] = useState("");
  const [newInterest, setNewInterest] = useState("");
  const [newGoal, setNewGoal] = useState("");

  useEffect(() => {
    if (biodata) {
      setForm({
        gender: biodata.gender || "",
        blood_group: biodata.blood_group || "",
        marital_status: biodata.marital_status || "",
        address: biodata.address || "",
        city: biodata.city || "",
        state: biodata.state || "",
        pincode: biodata.pincode || "",
        country: biodata.country || "India",
        skills: biodata.skills || [],
        interests: biodata.interests || [],
        education: biodata.education || [],
        employment: biodata.employment || [],
        personal_goals: biodata.personal_goals || [],
        emergency_contacts: biodata.emergency_contacts || [],
      });
    }
  }, [biodata]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<PersonalBiodata>) => api.biodata.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["biodata"] });
      toast.success("Biodata saved successfully!");
      setIsEditing(false);
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update biodata"),
  });

  const handleAddSkill = () => {
    if (newSkill.trim()) {
      setForm((prev) => ({
        ...prev,
        skills: [...(prev.skills || []), newSkill.trim()],
      }));
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (index: number) => {
    setForm((prev) => ({
      ...prev,
      skills: (prev.skills || []).filter((_, i) => i !== index),
    }));
  };

  const handleAddGoal = () => {
    if (newGoal.trim()) {
      setForm((prev) => ({
        ...prev,
        personal_goals: [
          ...(prev.personal_goals || []),
          { title: newGoal.trim(), completed: false },
        ],
      }));
      setNewGoal("");
    }
  };

  const toggleGoal = (index: number) => {
    const updated = [...(form.personal_goals || [])];
    updated[index].completed = !updated[index].completed;
    setForm((prev) => ({ ...prev, personal_goals: updated }));
    if (!isEditing) {
      updateMutation.mutate({ personal_goals: updated });
    }
  };

  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-6">
      {/* Profile Header Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#007ACC]/15 via-teal-500/10 to-sky-500/10 border border-[#007ACC]/20 p-4 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex h-14 w-14 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-[#007ACC] text-white text-xl sm:text-2xl font-black shadow-md shrink-0">
              {currentUser?.name?.[0]?.toUpperCase() || "I"}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-2xl font-extrabold text-foreground truncate">
                {currentUser?.name || "User Profile"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {currentUser?.email} • Code: <span className="font-mono font-bold text-foreground">{currentUser?.access_code}</span>
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Badge variant="outline" className="max-w-full whitespace-normal break-words text-[10px]">
                  Blood: {form.blood_group || "O+"}
                </Badge>
                <Badge variant="outline" className="max-w-full whitespace-normal break-words text-[10px]">
                  Location: {form.city || "Chennai"}, {form.country || "India"}
                </Badge>
              </div>
            </div>
          </div>

          <Button
            onClick={() => {
              if (isEditing) {
                updateMutation.mutate(form);
              } else {
                setIsEditing(true);
              }
            }}
            disabled={updateMutation.isPending}
            className="w-full shrink-0 bg-[#007ACC] text-white hover:bg-[#0060a0] sm:w-auto sm:self-center"
          >
            {isEditing ? (
              <>
                <Save className="h-4 w-4 mr-1.5" /> Save Changes
              </>
            ) : (
              <>
                <Edit3 className="h-4 w-4 mr-1.5" /> Edit Biodata
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 items-stretch gap-4 sm:gap-5 md:grid-cols-2">
        {/* Basic Personal Details */}
        <Card className="h-full min-w-0">
          <CardHeader className="pb-3">
            <CardTitle className="flex min-w-0 items-center gap-2 text-sm font-bold">
              <User className="h-4 w-4 shrink-0 text-[#007ACC]" /> Personal Details
            </CardTitle>
          </CardHeader>
          <CardContent className="min-w-0 flex-1 space-y-3 text-xs">
            {isEditing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Gender</Label>
                    <Input
                      value={form.gender || ""}
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Blood Group</Label>
                    <Input
                      value={form.blood_group || ""}
                      onChange={(e) => setForm({ ...form, blood_group: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">City</Label>
                    <Input
                      value={form.city || ""}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">State</Label>
                    <Input
                      value={form.state || ""}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Residential Address</Label>
                  <Input
                    value={form.address || ""}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Gender</span>
                  <span className="break-words font-semibold">{form.gender || "Not specified"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Blood Group</span>
                  <span className="break-words font-semibold text-rose-600 dark:text-rose-400">
                    {form.blood_group || "Not specified"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">City & State</span>
                  <span className="break-words font-semibold">
                    {form.city ? `${form.city}, ${form.state || ""}` : "Not specified"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Country</span>
                  <span className="break-words font-semibold">{form.country || "India"}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-muted-foreground block text-[11px]">Address</span>
                  <span className="break-words font-semibold">{form.address || "Personal private residence"}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Skills & Interests */}
        <Card className="h-full min-w-0">
          <CardHeader className="pb-3">
            <CardTitle className="flex min-w-0 items-center gap-2 text-sm font-bold">
              <Sparkles className="h-4 w-4 shrink-0 text-amber-500" /> Skills & Competencies
            </CardTitle>
          </CardHeader>
          <CardContent className="min-w-0 flex-1 space-y-4 text-xs">
            <div className="flex flex-wrap gap-1.5">
              {(form.skills || []).map((skill, i) => (
                <Badge key={i} variant="secondary" className="max-w-full whitespace-normal break-words px-2.5 py-1 text-xs">
                  <span className="min-w-0 break-words">{skill}</span>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(i)}
                      className="hover:text-rose-500"
                    >
                      ×
                    </button>
                  )}
                </Badge>
              ))}
            </div>

            {isEditing && (
              <div className="flex min-w-0 flex-col gap-2 pt-2 sm:flex-row">
                <Input
                  placeholder="Add skill (e.g. Next.js, Django)"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  className="w-full min-w-0 text-xs"
                />
                <Button size="sm" onClick={handleAddSkill} type="button" className="w-full shrink-0 sm:w-auto">
                  Add
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Education & Employment */}
        <Card className="h-full min-w-0 md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex min-w-0 items-center gap-2 text-sm font-bold">
              <Briefcase className="h-4 w-4 shrink-0 text-blue-500" /> Education & Employment Background
            </CardTitle>
          </CardHeader>
          <CardContent className="grid min-w-0 grid-cols-1 gap-4 text-xs md:grid-cols-2">
            {/* Education List */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4 text-emerald-500" /> Education
              </h4>
              <div className="space-y-2">
                {(form.education || []).map((edu, i) => (
                  <div key={i} className="min-w-0 rounded-xl border bg-muted/30 p-3">
                    <div className="break-words font-semibold text-foreground">{edu.degree}</div>
                    <div className="break-words text-[11px] text-muted-foreground">
                      {edu.institute} • {edu.year} {edu.grade ? `(${edu.grade})` : ""}
                    </div>
                  </div>
                ))}
                {(form.education || []).length === 0 && (
                  <p className="text-muted-foreground text-xs italic">No education recorded.</p>
                )}
              </div>
            </div>

            {/* Employment List */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5">
                <Briefcase className="h-4 w-4 text-blue-500" /> Career Experience
              </h4>
              <div className="space-y-2">
                {(form.employment || []).map((emp, i) => (
                  <div key={i} className="min-w-0 rounded-xl border bg-muted/30 p-3">
                    <div className="break-words font-semibold text-foreground">{emp.role}</div>
                    <div className="break-words text-[11px] text-muted-foreground">
                      {emp.company} • {emp.start} - {emp.end}
                    </div>
                  </div>
                ))}
                {(form.employment || []).length === 0 && (
                  <p className="text-muted-foreground text-xs italic">No employment records.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Goals */}
        <Card className="h-full min-w-0 md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex min-w-0 items-center gap-2 text-sm font-bold">
              <Target className="h-4 w-4 shrink-0 text-rose-500" /> Personal Objectives & Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
              {(form.personal_goals || []).map((goal, i) => (
                <div
                  key={i}
                  onClick={() => toggleGoal(i)}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    goal.completed
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                      : "bg-card hover:bg-muted/50"
                  }`}
                >
                  <CheckCircle2
                    className={`h-4 w-4 ${
                      goal.completed ? "text-emerald-500" : "text-muted-foreground"
                    }`}
                  />
                  <span className={`min-w-0 break-words text-xs font-medium ${goal.completed ? "line-through opacity-80" : ""}`}>
                    {goal.title}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex min-w-0 flex-col gap-2 pt-2 sm:flex-row">
              <Input
                placeholder="Add new goal (e.g. Save ₹2 Lakhs, Finish Certification)"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddGoal();
                  }
                }}
                className="w-full min-w-0 text-xs"
              />
              <Button size="sm" onClick={handleAddGoal} type="button" className="w-full shrink-0 sm:w-auto">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Goal
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
