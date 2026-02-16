"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Calendar,
  Building2,
  MapPin,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  Phone,
  Mail,
  ChevronDown,
  Loader2,
  X,
  UserPlus,
  Bell,
} from "lucide-react";
import { signOut } from "next-auth/react";

interface Contact {
  name: string;
  email: string;
  role: string;
}

interface JobApplication {
  id: string;
  company: string;
  position: string;
  location: string | null;
  salary: string | null;
  status: "applied" | "phone_screen" | "interview" | "offer" | "rejected" | "withdrawn";
  priority: "low" | "medium" | "high";
  appliedDate: string;
  interviewDate: string | null;
  followUpDate: string | null;
  jobUrl: string | null;
  notes: string | null;
  contacts: Contact[] | null;
}

interface ReminderItem {
  id: string;
  applicationId: string;
  type: "interview" | "followup";
  dueDate: string;
  company: string;
  position: string;
  urgency: "overdue" | "today" | "upcoming";
}

type FormData = {
  company: string;
  position: string;
  location: string;
  salary: string;
  jobUrl: string;
  status: string;
  priority: string;
  appliedDate: string;
  interviewDate: string;
  followUpDate: string;
  notes: string;
  contacts: Contact[];
};

const EMPTY_FORM: FormData = {
  company: "",
  position: "",
  location: "",
  salary: "",
  jobUrl: "",
  status: "applied",
  priority: "medium",
  appliedDate: new Date().toISOString().split("T")[0],
  interviewDate: "",
  followUpDate: "",
  notes: "",
  contacts: [],
};

const statusConfig = {
  applied: { label: "Applied", color: "bg-blue-100 text-blue-700", icon: Clock },
  phone_screen: { label: "Phone Screen", color: "bg-yellow-100 text-yellow-700", icon: Phone },
  interview: { label: "Interview", color: "bg-purple-100 text-purple-700", icon: Calendar },
  offer: { label: "Offer", color: "bg-green-100 text-green-700", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700", icon: XCircle },
  withdrawn: { label: "Withdrawn", color: "bg-gray-100 text-gray-700", icon: XCircle },
};

const priorityConfig = {
  low: { label: "Low", color: "bg-gray-100 text-gray-600" },
  medium: { label: "Medium", color: "bg-yellow-100 text-yellow-700" },
  high: { label: "High", color: "bg-red-100 text-red-700" },
};

function formatDate(d: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function TrackerPage() {
  const [user, setUser] = useState<{ name: string; planType: string }>({ name: "User", planType: "free" });
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<string>("applied");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [remindersLoading, setRemindersLoading] = useState(true);
  const [downloadingCalendar, setDownloadingCalendar] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadApplications = useCallback(async () => {
    try {
      const res = await fetch("/api/tracker", { cache: "no-store" });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      const data = await res.json();
      setApplications(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  const loadReminders = useCallback(async () => {
    setRemindersLoading(true);
    try {
      const res = await fetch("/api/tracker/reminders", { cache: "no-store" });
      if (!res.ok) return;
      const body = await res.json();
      setReminders(body.reminders || []);
    } catch {
      // silently fail
    } finally {
      setRemindersLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/profile", { cache: "no-store" });
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        if (!res.ok) return;
        const body = await res.json();
        setUser({
          name: body.name || body.email?.split("@")?.[0] || "User",
          planType: body.planType || "free",
        });
      } catch {
        window.location.href = "/login";
      }
    };

    void loadProfile();
    void loadApplications();
    void loadReminders();
  }, [loadApplications, loadReminders]);

  // Filtering (client-side)
  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.position.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const allFilteredSelected =
    filteredApplications.length > 0 &&
    filteredApplications.every((a) => selectedIds.includes(a.id));

  const stats = {
    total: applications.length,
    active: applications.filter((a) => !["rejected", "withdrawn"].includes(a.status)).length,
    interviews: applications.filter((a) => a.status === "interview").length,
    offers: applications.filter((a) => a.status === "offer").length,
  };

  // --- CRUD handlers ---

  function openAddModal() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowModal(true);
  }

  function openEditModal(app: JobApplication) {
    setEditingId(app.id);
    setForm({
      company: app.company,
      position: app.position,
      location: app.location || "",
      salary: app.salary || "",
      jobUrl: app.jobUrl || "",
      status: app.status,
      priority: app.priority,
      appliedDate: app.appliedDate ? app.appliedDate.split("T")[0] : "",
      interviewDate: app.interviewDate ? app.interviewDate.split("T")[0] : "",
      followUpDate: app.followUpDate ? app.followUpDate.split("T")[0] : "",
      notes: app.notes || "",
      contacts: app.contacts || [],
    });
    setFormError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.company.trim() || !form.position.trim()) {
      setFormError("Company and position are required.");
      return;
    }

    setSaving(true);
    setFormError("");

    const payload = {
      ...form,
      interviewDate: form.interviewDate || null,
      followUpDate: form.followUpDate || null,
      contacts: form.contacts.length > 0 ? form.contacts : null,
    };

    try {
      const url = editingId ? `/api/tracker/${editingId}` : "/api/tracker";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error || "Failed to save application.");
        return;
      }

      closeModal();
      await loadApplications();
      await loadReminders();
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await fetch(`/api/tracker/${deleteId}`, { method: "DELETE" });
      setDeleteId(null);
      await loadApplications();
      await loadReminders();
    } catch {
      // silently fail
    } finally {
      setDeleting(false);
    }
  }

  async function updateStatus(id: string, newStatus: string) {
    try {
      const res = await fetch(`/api/tracker/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setApplications((apps) =>
          apps.map((a) => (a.id === id ? { ...a, status: newStatus as JobApplication["status"] } : a))
        );
        await loadReminders();
      }
    } catch {
      // silently fail
    }
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleSelectAllFiltered() {
    if (allFilteredSelected) {
      setSelectedIds((prev) => prev.filter((id) => !filteredApplications.some((a) => a.id === id)));
      return;
    }
    const filteredIds = filteredApplications.map((a) => a.id);
    setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
  }

  async function runBulkDelete() {
    if (!selectedIds.length) return;
    setBulkLoading(true);
    try {
      const res = await fetch("/api/tracker/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, action: "delete" }),
      });
      if (!res.ok) return;
      setSelectedIds([]);
      await loadApplications();
      await loadReminders();
    } finally {
      setBulkLoading(false);
    }
  }

  async function runBulkStatus() {
    if (!selectedIds.length) return;
    setBulkLoading(true);
    try {
      const res = await fetch("/api/tracker/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, action: "status", status: bulkStatus }),
      });
      if (!res.ok) return;
      setSelectedIds([]);
      await loadApplications();
      await loadReminders();
    } finally {
      setBulkLoading(false);
    }
  }

  const calendarEvents = filteredApplications.flatMap((app) => {
    const events: Array<{ date: string; label: string; appId: string; color: string }> = [];
    if (app.interviewDate) {
      events.push({
        date: app.interviewDate.split("T")[0],
        label: `Interview · ${app.company} (${app.position})`,
        appId: app.id,
        color: "text-purple-700 bg-purple-50 border-purple-200",
      });
    }
    if (app.followUpDate) {
      events.push({
        date: app.followUpDate.split("T")[0],
        label: `Follow-up · ${app.company} (${app.position})`,
        appId: app.id,
        color: "text-blue-700 bg-blue-50 border-blue-200",
      });
    }
    return events;
  });

  const groupedCalendar = calendarEvents.reduce<Record<string, typeof calendarEvents>>((acc, event) => {
    if (!acc[event.date]) acc[event.date] = [];
    acc[event.date].push(event);
    return acc;
  }, {});

  async function downloadCalendarIcs() {
    setDownloadingCalendar(true);
    try {
      const res = await fetch('/api/tracker/calendar', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to export calendar');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'resumeai-tracker.ics';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // silently fail
    } finally {
      setDownloadingCalendar(false);
    }
  }

  // Contact helpers
  function addContact() {
    setForm((f) => ({ ...f, contacts: [...f.contacts, { name: "", email: "", role: "" }] }));
  }

  function updateContact(idx: number, field: keyof Contact, value: string) {
    setForm((f) => {
      const contacts = [...f.contacts];
      contacts[idx] = { ...contacts[idx], [field]: value };
      return { ...f, contacts };
    });
  }

  function removeContact(idx: number) {
    setForm((f) => ({ ...f, contacts: f.contacts.filter((_, i) => i !== idx) }));
  }

  const onField = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-2 rounded-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                ResumeAI
              </span>
            </div>
            <div className="flex items-center space-x-6">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</Link>
              <Link href="/templates" className="text-gray-600 hover:text-gray-900">Templates</Link>
              <Link href="/tracker" className="text-blue-600 font-medium">Tracker</Link>
              <Link href="/profile" className="flex items-center space-x-3 hover:opacity-90 transition">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.planType} Plan</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </Link>
              <button type="button" onClick={() => signOut({ callbackUrl: "/login" })} className="text-sm text-gray-600 hover:text-red-600">
                Log out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Application Tracker</h1>
            <p className="text-gray-600">Track and manage all your job applications in one place.</p>
          </div>
          <button
            onClick={openAddModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium inline-flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Application
          </button>
        </div>

        {/* Reminders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="inline-flex items-center text-gray-900 font-semibold">
              <Bell className="h-4 w-4 mr-2 text-amber-500" />
              Notifications & Reminders
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={downloadCalendarIcs}
                disabled={downloadingCalendar}
                className="px-3 py-1.5 rounded-lg text-sm border bg-white text-gray-700 border-gray-300 hover:bg-gray-50 disabled:opacity-60"
              >
                {downloadingCalendar ? 'Exporting...' : 'Download .ics'}
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 rounded-lg text-sm border ${
                  viewMode === "list" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300"
                }`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                className={`px-3 py-1.5 rounded-lg text-sm border ${
                  viewMode === "calendar" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300"
                }`}
              >
                Calendar
              </button>
            </div>
          </div>
          {remindersLoading ? (
            <p className="text-sm text-gray-500">Loading reminders...</p>
          ) : reminders.length === 0 ? (
            <p className="text-sm text-gray-500">No reminders in the next 14 days.</p>
          ) : (
            <div className="space-y-2">
              {reminders.slice(0, 6).map((reminder) => (
                <div
                  key={reminder.id}
                  className={`border rounded-lg px-3 py-2 text-sm ${
                    reminder.urgency === "overdue"
                      ? "border-red-200 bg-red-50 text-red-700"
                      : reminder.urgency === "today"
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : "border-blue-200 bg-blue-50 text-blue-700"
                  }`}
                >
                  {reminder.type === "interview" ? "Interview" : "Follow-up"}: {reminder.company} ({reminder.position}) ·{" "}
                  {formatDate(reminder.dueDate)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Total Applications</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Active</p>
            <p className="text-3xl font-bold text-blue-600">{stats.active}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Interviews</p>
            <p className="text-3xl font-bold text-purple-600">{stats.interviews}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Offers</p>
            <p className="text-3xl font-bold text-green-600">{stats.offers}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by company or position..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="applied">Applied</option>
                <option value="phone_screen">Phone Screen</option>
                <option value="interview">Interview</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
            </div>
          </div>
        </div>

        {/* Applications List */}
        {selectedIds.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4 flex flex-wrap items-center gap-3">
            <span className="text-sm text-gray-700 font-medium">{selectedIds.length} selected</span>
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="applied">Applied</option>
              <option value="phone_screen">Phone Screen</option>
              <option value="interview">Interview</option>
              <option value="offer">Offer</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
            <button
              onClick={runBulkStatus}
              disabled={bulkLoading}
              className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60"
            >
              Apply Status
            </button>
            <button
              onClick={runBulkDelete}
              disabled={bulkLoading}
              className="px-3 py-2 rounded-lg border border-red-300 text-red-600 text-sm hover:bg-red-50 disabled:opacity-60"
            >
              Delete Selected
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-50"
            >
              Clear
            </button>
          </div>
        )}

        {viewMode === "calendar" ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Calendar View</h3>
            {Object.keys(groupedCalendar).length === 0 ? (
              <p className="text-sm text-gray-600">No interview/follow-up events for the current filters.</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedCalendar)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([date, events]) => (
                    <div key={date}>
                      <p className="text-sm font-semibold text-gray-900 mb-2">{formatDate(date)}</p>
                      <div className="space-y-2">
                        {events.map((event) => (
                          <button
                            key={`${event.appId}-${event.label}`}
                            onClick={() => {
                              setExpandedId(event.appId);
                              setViewMode("list");
                            }}
                            className={`w-full text-left border rounded-lg px-3 py-2 text-sm ${event.color}`}
                          >
                            {event.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.length > 0 && (
              <div className="flex items-center justify-between px-1">
                <label className="inline-flex items-center text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleSelectAllFiltered}
                    className="mr-2"
                  />
                  Select all filtered
                </label>
                <span className="text-xs text-gray-500">{filteredApplications.length} items</span>
              </div>
            )}

            {filteredApplications.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Start tracking your job applications"}
              </p>
              <button
                onClick={openAddModal}
                className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                <Plus className="mr-2 h-5 w-5" />
                Add Your First Application
              </button>
            </div>
          ) : (
            filteredApplications.map((app) => {
              const isExpanded = expandedId === app.id;

              return (
                <div key={app.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition">
                  {/* Main Row */}
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(app.id)}
                            onChange={() => toggleSelected(app.id)}
                          />
                          <h3 className="text-lg font-semibold text-gray-900">{app.position}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[app.status].color}`}>
                            {statusConfig[app.status].label}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityConfig[app.priority].color}`}>
                            {priorityConfig[app.priority].label}
                          </span>
                        </div>
                        <div className="flex items-center flex-wrap gap-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Building2 className="h-4 w-4 mr-1" />
                            {app.company}
                          </span>
                          {app.location && (
                            <span className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {app.location}
                            </span>
                          )}
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Applied {formatDate(app.appliedDate)}
                          </span>
                          {app.interviewDate && (
                            <span className="flex items-center text-purple-600 font-medium">
                              <Calendar className="h-4 w-4 mr-1" />
                              Interview {formatDate(app.interviewDate)}
                            </span>
                          )}
                          {app.salary && <span className="text-green-600 font-medium">{app.salary}</span>}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {app.jobUrl && (
                          <a href={app.jobUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                            <ExternalLink className="h-5 w-5" />
                          </a>
                        )}
                        <button onClick={() => setExpandedId(isExpanded ? null : app.id)} className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition">
                          <ChevronDown className={`h-5 w-5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t bg-gray-50 p-4">
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Notes & Dates */}
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                            <p className="text-sm text-gray-600">{app.notes || "No notes added yet."}</p>
                          </div>
                          {(app.interviewDate || app.followUpDate) && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Important Dates</h4>
                              <div className="space-y-1 text-sm">
                                {app.interviewDate && (
                                  <p className="text-purple-700">
                                    <Calendar className="h-4 w-4 inline mr-1" />
                                    Interview: {formatDate(app.interviewDate)}
                                  </p>
                                )}
                                {app.followUpDate && (
                                  <p className="text-blue-700">
                                    <Clock className="h-4 w-4 inline mr-1" />
                                    Follow-up: {formatDate(app.followUpDate)}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Contacts */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Contacts</h4>
                          {app.contacts && app.contacts.length > 0 ? (
                            <div className="space-y-2">
                              {app.contacts.map((contact, idx) => (
                                <div key={idx} className="flex items-center space-x-3 text-sm">
                                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                                    {contact.name.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">{contact.name}</p>
                                    <p className="text-gray-600">{contact.role}</p>
                                  </div>
                                  {contact.email && (
                                    <a href={`mailto:${contact.email}`} className="text-blue-600 hover:text-blue-700">
                                      <Mail className="h-4 w-4" />
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-600">No contacts added.</p>
                          )}
                        </div>
                      </div>

                      {/* Status Update */}
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="font-medium text-gray-900 mb-3">Update Status</h4>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(statusConfig).map(([status, config]) => (
                            <button
                              key={status}
                              onClick={() => updateStatus(app.id, status)}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                                app.status === status
                                  ? config.color + " ring-2 ring-offset-2 ring-blue-500"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                            >
                              {config.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 pt-4 border-t flex justify-end space-x-3">
                        <button
                          onClick={() => openEditModal(app)}
                          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition inline-flex items-center text-sm"
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteId(app.id)}
                          className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition inline-flex items-center text-sm"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
            )}
          </div>
        )}
      </main>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingId ? "Edit Application" : "Add Job Application"}
                </h2>
                <button onClick={closeModal} className="p-1 text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                  <input
                    type="text"
                    value={form.company}
                    onChange={onField("company")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="e.g., Google"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position *</label>
                  <input
                    type="text"
                    value={form.position}
                    onChange={onField("position")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="e.g., Senior Software Engineer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={form.location}
                      onChange={onField("location")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      placeholder="e.g., San Francisco, CA"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Salary Range</label>
                    <input
                      type="text"
                      value={form.salary}
                      onChange={onField("salary")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      placeholder="e.g., $150k - $180k"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job URL</label>
                  <input
                    type="url"
                    value={form.jobUrl}
                    onChange={onField("jobUrl")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="https://..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select value={form.status} onChange={onField("status")} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent">
                      <option value="applied">Applied</option>
                      <option value="phone_screen">Phone Screen</option>
                      <option value="interview">Interview</option>
                      <option value="offer">Offer</option>
                      <option value="rejected">Rejected</option>
                      <option value="withdrawn">Withdrawn</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select value={form.priority} onChange={onField("priority")} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                {/* Date fields */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Applied Date</label>
                    <input
                      type="date"
                      value={form.appliedDate}
                      onChange={onField("appliedDate")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Interview Date</label>
                    <input
                      type="date"
                      value={form.interviewDate}
                      onChange={onField("interviewDate")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
                    <input
                      type="date"
                      value={form.followUpDate}
                      onChange={onField("followUpDate")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={onField("notes")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="Add any notes about this application..."
                  />
                </div>

                {/* Contacts */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Contacts</label>
                    <button type="button" onClick={addContact} className="text-sm text-blue-600 hover:text-blue-700 inline-flex items-center">
                      <UserPlus className="h-4 w-4 mr-1" />
                      Add Contact
                    </button>
                  </div>
                  {form.contacts.map((contact, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={contact.name}
                        onChange={(e) => updateContact(idx, "name", e.target.value)}
                        placeholder="Name"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                      <input
                        type="text"
                        value={contact.role}
                        onChange={(e) => updateContact(idx, "role", e.target.value)}
                        placeholder="Role"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                      <input
                        type="email"
                        value={contact.email}
                        onChange={(e) => updateContact(idx, "email", e.target.value)}
                        placeholder="Email"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                      <button type="button" onClick={() => removeContact(idx)} className="p-2 text-red-500 hover:text-red-700">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {formError && <p className="text-sm text-red-600">{formError}</p>}

                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={closeModal} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-60 inline-flex items-center"
                  >
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingId ? "Save Changes" : "Add Application"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Delete Application</h2>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this application? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-60 inline-flex items-center"
              >
                {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
