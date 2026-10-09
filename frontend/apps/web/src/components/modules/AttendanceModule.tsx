import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Briefcase,
  Dumbbell,
  CheckCircle2,
  Clock,
  Calendar,
  Plus,
  Flame,
  Check,
  Award,
} from "lucide-react";
import { api } from "@/lib/api";
import type { AttendanceRecord } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";

export default function AttendanceModule() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"office" | "gym">("office");
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    record_type: "office" as "office" | "gym",
    status: "present" as AttendanceRecord["status"],
    check_in: "",
    check_out: "",
    duration_minutes: 480,
    workout_focus: "",
    notes: "",
  });

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["attendance", activeTab],
    queryFn: () => api.attendance.list({ record_type: activeTab }),
  });

  const { data: summaryData } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () => api.dashboard.getSummary(),
  });

  const createAttendanceMutation = useMutation({
    mutationFn: (data: Partial<AttendanceRecord>) => api.attendance.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      toast.success("Attendance entry saved successfully!");
      setIsLogModalOpen(false);
    },
    onError: (err: Error) => toast.error(err.message || "Failed to save attendance"),
  });

  const quickToggleMutation = useMutation({
    mutationFn: (type: "office" | "gym") => api.attendance.quickToggle(type),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      toast.success(
        `Recorded today's ${data.record_type} as ${data.status.replace("_", " ")}!`
      );
    },
    onError: (err: Error) => toast.error(err.message || "Quick check-in failed"),
  });

  const officePct = summaryData?.summary?.office_attendance_pct ?? 0;
  const gymPct = summaryData?.summary?.gym_attendance_pct ?? 0;
  const todayOfficeStatus = summaryData?.summary?.today_office_status ?? "not_recorded";
  const todayGymStatus = summaryData?.summary?.today_gym_status ?? "not_recorded";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
      case "workout_done":
        return <Badge variant="success">{status.replace("_", " ").toUpperCase()}</Badge>;
      case "half_day":
        return <Badge variant="warning">HALF DAY</Badge>;
      case "leave":
      case "absent":
        return <Badge variant="destructive">{status.toUpperCase()}</Badge>;
      case "rest_day":
        return <Badge variant="info">REST DAY</Badge>;
      default:
        return <Badge variant="outline">{status.toUpperCase()}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with office & gym quick check-ins */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Office Card */}
        <Card className="border-sky-200 dark:border-sky-900/40 bg-gradient-to-br from-sky-500/10 via-white dark:via-background to-sky-500/5">
          <CardContent className="p-5 flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-sky-500 text-white shadow-xs">
                  <Briefcase className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Office Attendance</h3>
                  <span className="text-[11px] text-muted-foreground">Monthly: {officePct}% present</span>
                </div>
              </div>

              <div className="pt-2">
                <span className="text-xs text-muted-foreground">Today's Status: </span>
                {todayOfficeStatus === "present" ? (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    Checked In ✓
                  </span>
                ) : (
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                    Not checked in yet
                  </span>
                )}
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => quickToggleMutation.mutate("office")}
              disabled={quickToggleMutation.isPending}
              className="bg-sky-600 hover:bg-sky-700 text-white"
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              {todayOfficeStatus === "present" ? "Update Time" : "Check In Now"}
            </Button>
          </CardContent>
        </Card>

        {/* Gym Card */}
        <Card className="border-orange-200 dark:border-orange-900/40 bg-gradient-to-br from-orange-500/10 via-white dark:via-background to-orange-500/5">
          <CardContent className="p-5 flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-orange-500 text-white shadow-xs">
                  <Dumbbell className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Gym Workout Track</h3>
                  <span className="text-[11px] text-muted-foreground">Monthly: {gymPct}% active</span>
                </div>
              </div>

              <div className="pt-2">
                <span className="text-xs text-muted-foreground">Today's Workout: </span>
                {todayGymStatus === "workout_done" ? (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    Workout Done 🔥
                  </span>
                ) : (
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                    Pending
                  </span>
                )}
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => quickToggleMutation.mutate("gym")}
              disabled={quickToggleMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Flame className="h-3.5 w-3.5 mr-1" />
              {todayGymStatus === "workout_done" ? "Done ✓" : "Mark Workout Done"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Switcher and Log Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex bg-muted p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("office")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "office"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Briefcase className="h-3.5 w-3.5" /> Office Attendance
          </button>
          <button
            onClick={() => setActiveTab("gym")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "gym"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Dumbbell className="h-3.5 w-3.5" /> Gym Tracker
          </button>
        </div>

        <Button
          size="sm"
          onClick={() => {
            setForm((prev) => ({
              ...prev,
              record_type: activeTab,
              status: activeTab === "office" ? "present" : "workout_done",
              duration_minutes: activeTab === "gym" ? 60 : 480,
            }));
            setIsLogModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Log {activeTab === "office" ? "Office Record" : "Workout Session"}
        </Button>
      </div>

      {/* Attendance History Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">
            {activeTab === "office" ? "Office Attendance Records" : "Gym Workout History"}
          </CardTitle>
          <CardDescription className="text-xs">
            Review your working hours, workout focus splits, and statuses
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-8 text-center text-xs text-muted-foreground">Loading attendance...</div>
          ) : records.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <Calendar className="h-8 w-8 text-muted-foreground mx-auto opacity-40" />
              <p className="text-xs text-muted-foreground">No records logged for {activeTab} yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {records.map((rec) => (
                <div
                  key={rec.id}
                  className="flex items-center justify-between p-3.5 sm:px-6 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 mr-2">
                    <div className="p-2 rounded-xl bg-muted text-foreground shrink-0">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-foreground flex items-center gap-2 flex-wrap">
                        <span>{rec.date}</span>
                        {getStatusBadge(rec.status)}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                        {rec.record_type === "gym" ? (
                          <span>
                            {rec.workout_focus ? `Focus: ${rec.workout_focus} • ` : ""}
                            Duration: {rec.duration_minutes} mins
                          </span>
                        ) : (
                          <span>
                            {rec.check_in ? `In: ${rec.check_in.slice(0, 5)} ` : ""}
                            {rec.check_out ? `• Out: ${rec.check_out.slice(0, 5)} ` : ""}
                            ({Math.round(rec.duration_minutes / 60)} hrs)
                          </span>
                        )}
                        {rec.notes && ` • ${rec.notes}`}
                      </div>
                    </div>
                  </div>

                  <Award className="h-4 w-4 text-muted-foreground opacity-40" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Log Attendance */}
      <Modal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title={activeTab === "office" ? "Log Office Attendance" : "Log Gym Workout"}
        description="Record hours, status, workout focus, or notes."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createAttendanceMutation.mutate({
              date: form.date,
              record_type: form.record_type,
              status: form.status,
              check_in: form.check_in || null,
              check_out: form.check_out || null,
              duration_minutes: Number(form.duration_minutes),
              workout_focus: form.workout_focus,
              notes: form.notes,
            });
          }}
          className="space-y-4 text-xs"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Date *</Label>
              <Input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as AttendanceRecord["status"] })
                }
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
              >
                {activeTab === "office" ? (
                  <>
                    <option value="present">Present / Full Day</option>
                    <option value="half_day">Half Day</option>
                    <option value="leave">On Leave</option>
                    <option value="absent">Absent</option>
                    <option value="holiday">Holiday</option>
                  </>
                ) : (
                  <>
                    <option value="workout_done">Workout Completed 🔥</option>
                    <option value="rest_day">Rest Day 🛌</option>
                    <option value="absent">Missed Workout</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {activeTab === "office" ? (
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Check In</Label>
                <Input
                  type="time"
                  value={form.check_in}
                  onChange={(e) => setForm({ ...form, check_in: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Check Out</Label>
                <Input
                  type="time"
                  value={form.check_out}
                  onChange={(e) => setForm({ ...form, check_out: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Minutes</Label>
                <Input
                  type="number"
                  value={form.duration_minutes}
                  onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Workout Focus / Muscle Group</Label>
                <Input
                  placeholder="e.g. Chest & Triceps, Leg Day, Cardio"
                  value={form.workout_focus}
                  onChange={(e) => setForm({ ...form, workout_focus: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Duration (Minutes)</Label>
                <Input
                  type="number"
                  value={form.duration_minutes}
                  onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <div>
            <Label className="text-xs">Notes / Summary</Label>
            <Input
              placeholder="e.g. Completed 5x5 squats, pushed project deploy"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="mt-1"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="ghost" onClick={() => setIsLogModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createAttendanceMutation.isPending}>
              {createAttendanceMutation.isPending ? "Saving..." : "Save Record"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
