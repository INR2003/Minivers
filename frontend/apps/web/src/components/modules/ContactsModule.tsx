import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Users,
  Plus,
  Star,
  Search,
  Phone,
  Mail,
  Cake,
  Heart,
  Calendar,
  Trash2,
  Edit,
} from "lucide-react";
import { api } from "@/lib/api";
import type { PersonalContact } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";

const RELATIONS = ["family", "friend", "colleague", "relative", "mentor", "other"] as const;

export default function ContactsModule() {
  const queryClient = useQueryClient();
  const [filterRel, setFilterRel] = useState<string>("");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    name: "",
    relationship: "friend" as PersonalContact["relationship"],
    phone: "",
    email: "",
    birthday: "",
    anniversary: "",
    address: "",
    notes: "",
    is_favorite: false,
    avatar_color: "#007ACC",
  });

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["contacts", filterRel],
    queryFn: () => api.contacts.list(filterRel ? { relationship: filterRel } : {}),
  });

  const createContactMutation = useMutation({
    mutationFn: (data: Partial<PersonalContact>) => api.contacts.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contact saved successfully!");
      setIsModalOpen(false);
      setForm({
        name: "",
        relationship: "friend",
        phone: "",
        email: "",
        birthday: "",
        anniversary: "",
        address: "",
        notes: "",
        is_favorite: false,
        avatar_color: "#007ACC",
      });
    },
    onError: (err: Error) => toast.error(err.message || "Failed to save contact"),
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: ({ id, is_favorite }: { id: number; is_favorite: boolean }) =>
      api.contacts.update(id, { is_favorite }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: (id: number) => api.contacts.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contact deleted");
    },
  });

  const filtered = contacts.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.notes.toLowerCase().includes(q)
    );
  });

  // Calculate upcoming birthdays
  const getUpcomingCountdown = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const today = new Date();
    const dateObj = new Date(dateStr);
    const thisYearDate = new Date(today.getFullYear(), dateObj.getMonth(), dateObj.getDate());
    if (thisYearDate < today) {
      thisYearDate.setFullYear(today.getFullYear() + 1);
    }
    const diffDays = Math.ceil((thisYearDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today! 🎉";
    if (diffDays <= 30) return `In ${diffDays} days`;
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search family & friends..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs"
            />
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-1 sm:flex-initial">
            <Button
              size="sm"
              variant={filterRel === "" ? "default" : "outline"}
              onClick={() => setFilterRel("")}
              className="text-xs h-8 shrink-0"
            >
              All Contacts
            </Button>
            {RELATIONS.map((r) => (
              <Button
                key={r}
                size="sm"
                variant={filterRel === r ? "default" : "outline"}
                onClick={() => setFilterRel(r)}
                className="text-xs h-8 capitalize whitespace-nowrap shrink-0"
              >
                {r}
              </Button>
            ))}
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            size="sm"
            className="bg-[#007ACC] hover:bg-[#0060a0] text-white shrink-0"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Add Person
          </Button>
        </div>
      </div>

      {/* Contacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-8 text-center text-xs text-muted-foreground">
            Loading contacts...
          </div>
        ) : filtered.length === 0 ? (
          <Card className="col-span-full border-dashed border-2 p-8 text-center">
            <Users className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-40" />
            <h3 className="font-semibold text-foreground">No Contacts Found</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Keep important dates, numbers, and relationships organized.
            </p>
            <Button onClick={() => setIsModalOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add Contact
            </Button>
          </Card>
        ) : (
          filtered.map((contact) => {
            const bdayCountdown = getUpcomingCountdown(contact.birthday);
            return (
              <Card key={contact.id} className="relative overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-2xl text-white font-bold text-base shadow-xs"
                        style={{ backgroundColor: contact.avatar_color || "#007ACC" }}
                      >
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                          {contact.name}
                        </h4>
                        <Badge variant="outline" className="text-[10px] capitalize py-0 mt-0.5">
                          {contact.relationship}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          toggleFavoriteMutation.mutate({
                            id: contact.id,
                            is_favorite: !contact.is_favorite,
                          })
                        }
                        className={`p-1 rounded-md transition-colors ${
                          contact.is_favorite
                            ? "text-amber-500 fill-amber-500"
                            : "text-muted-foreground hover:text-amber-500"
                        }`}
                      >
                        <Star className={`h-4 w-4 ${contact.is_favorite ? "fill-current" : ""}`} />
                      </button>
                      <button
                        onClick={() => deleteContactMutation.mutate(contact.id)}
                        className="p-1 text-muted-foreground hover:text-rose-500 rounded-md transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Contact details */}
                  <div className="mt-4 space-y-1.5 text-xs">
                    {contact.phone && (
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-[#007ACC]" /> {contact.phone}
                        </span>
                        <a
                          href={`tel:${contact.phone}`}
                          className="text-[10px] font-bold text-[#007ACC] hover:underline"
                        >
                          Call
                        </a>
                      </div>
                    )}
                    {contact.email && (
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="flex items-center gap-1.5 truncate max-w-[200px]">
                          <Mail className="h-3.5 w-3.5 text-[#007ACC]" /> {contact.email}
                        </span>
                        <a
                          href={`mailto:${contact.email}`}
                          className="text-[10px] font-bold text-[#007ACC] hover:underline"
                        >
                          Mail
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Birthday alert if close */}
                  {(bdayCountdown || contact.birthday) && (
                    <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Cake className="h-3.5 w-3.5 text-rose-500" />
                        {contact.birthday}
                      </span>
                      {bdayCountdown && (
                        <Badge variant="warning" className="text-[9px] py-0">
                          {bdayCountdown}
                        </Badge>
                      )}
                    </div>
                  )}

                  {contact.notes && (
                    <div className="mt-2 text-[11px] text-muted-foreground italic bg-muted/40 p-2 rounded-lg">
                      "{contact.notes}"
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Modal: Add Contact */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Family or Friend"
        description="Store contact details, birth dates, and anniversaries."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createContactMutation.mutate({
              name: form.name,
              relationship: form.relationship,
              phone: form.phone,
              email: form.email,
              birthday: form.birthday || null,
              anniversary: form.anniversary || null,
              address: form.address,
              notes: form.notes,
              is_favorite: form.is_favorite,
              avatar_color: form.avatar_color,
            });
          }}
          className="space-y-4 text-xs"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Full Name *</Label>
              <Input
                required
                placeholder="e.g. Ramesh, Priya"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Relationship</Label>
              <select
                value={form.relationship}
                onChange={(e) =>
                  setForm({ ...form, relationship: e.target.value as PersonalContact["relationship"] })
                }
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
              >
                {RELATIONS.map((r) => (
                  <option key={r} value={r}>
                    {r.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Phone Number</Label>
              <Input
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input
                type="email"
                placeholder="name@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Birthday</Label>
              <Input
                type="date"
                value={form.birthday}
                onChange={(e) => setForm({ ...form, birthday: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Anniversary</Label>
              <Input
                type="date"
                value={form.anniversary}
                onChange={(e) => setForm({ ...form, anniversary: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Notes / Details</Label>
            <Input
              placeholder="e.g. Works at TCS, likes badminton"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs">Avatar Color</Label>
            <div className="flex gap-2 mt-1.5">
              {["#007ACC", "#059669", "#D97706", "#7C3AED", "#EC4899", "#2563EB"].map((col) => (
                <button
                  type="button"
                  key={col}
                  onClick={() => setForm({ ...form, avatar_color: col })}
                  className={`h-6 w-6 rounded-full border-2 ${
                    form.avatar_color === col ? "border-foreground scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: col }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createContactMutation.isPending}>
              {createContactMutation.isPending ? "Saving..." : "Save Contact"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
