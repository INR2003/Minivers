/**
 * Centralized API client for Minivers Personal Life Management System.
 * Connects to Django REST API (http://127.0.0.1:8000).
 */

const API_ROOT = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";
const AUTH_BASE = `${API_ROOT}/api/auth`;
const PERSONAL_BASE = `${API_ROOT}/api/personal`;

export interface UserDetails {
  id: number;
  name: string;
  email: string;
  access_code: string;
  display_name?: string;
  phone?: string;
  date_of_birth?: string | null;
  about?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface BankAccount {
  id: number;
  account_name: string;
  bank_name: string;
  account_type: 'savings' | 'current' | 'salary' | 'wallet' | 'credit_card' | 'investment';
  account_number_last4: string;
  opening_balance: string | number;
  current_balance: string | number;
  currency: string;
  color: string;
  is_active: boolean;
  created_at: string;
}

export interface MoneyTransaction {
  id: number;
  account: number;
  account_name?: string;
  to_account?: number | null;
  to_account_name?: string | null;
  transaction_type: 'income' | 'expense' | 'transfer';
  amount: string | number;
  category: string;
  date: string;
  description: string;
  created_at: string;
}

export interface ExpenseCategory {
  id: number;
  name: string;
  monthly_budget: string | number;
  color: string;
  icon: string;
}

export interface DailyExpense {
  id: number;
  amount: string | number;
  date: string;
  category: string;
  description: string;
  payment_method: string;
  account?: number | null;
  account_name?: string | null;
  created_at: string;
}

export interface AttendanceRecord {
  id: number;
  date: string;
  record_type: 'office' | 'gym';
  status: 'present' | 'workout_done' | 'absent' | 'half_day' | 'leave' | 'rest_day' | 'holiday';
  check_in?: string | null;
  check_out?: string | null;
  duration_minutes: number;
  workout_focus?: string;
  notes?: string;
  created_at: string;
}

export interface PaymentRecord {
  id: number;
  payment_type: 'received' | 'made';
  amount: string | number;
  party_name: string;
  purpose: string;
  payment_method: string;
  status: 'completed' | 'pending' | 'failed';
  is_recurring: boolean;
  due_date?: string | null;
  payment_date: string;
  receipt_url?: string;
  notes?: string;
  created_at: string;
}

export interface EducationItem {
  degree: string;
  institute: string;
  year: string;
  grade?: string;
}

export interface EmploymentItem {
  role: string;
  company: string;
  start: string;
  end: string;
  current?: boolean;
}

export interface GoalItem {
  title: string;
  target_date?: string;
  completed?: boolean;
}

export interface EmergencyContactItem {
  name: string;
  relation: string;
  phone: string;
}

export interface ImportantDateItem {
  title: string;
  date: string;
  notes?: string;
}

export interface PersonalBiodata {
  id?: number;
  gender: string;
  blood_group: string;
  marital_status: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  education: EducationItem[];
  employment: EmploymentItem[];
  skills: string[];
  interests: string[];
  personal_goals: GoalItem[];
  emergency_contacts: EmergencyContactItem[];
  important_dates: ImportantDateItem[];
  updated_at?: string;
}

export interface PersonalContact {
  id: number;
  name: string;
  relationship: 'family' | 'friend' | 'colleague' | 'relative' | 'mentor' | 'other';
  phone: string;
  email: string;
  birthday?: string | null;
  anniversary?: string | null;
  address: string;
  notes: string;
  is_favorite: boolean;
  avatar_color: string;
  created_at: string;
}

export interface StoredDocument {
  id: number;
  title: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_data: string;
  folder: string;
  tags: string;
  description: string;
  is_trashed: boolean;
  created_at: string;
}

export interface PersonalNote {
  id: number;
  title: string;
  content: string;
  mood: 'great' | 'good' | 'neutral' | 'down' | 'motivated' | 'creative';
  category: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface PasswordVaultItem {
  id: number;
  title: string;
  login_url: string;
  username: string;
  password?: string;
  decrypted_password?: string;
  category: string;
  notes: string;
  created_at: string;
}

export interface DebtRepayment {
  id: number;
  debt: number;
  amount: string | number;
  repayment_date: string;
  payment_method: string;
  notes: string;
  created_at: string;
}

export interface DebtRecord {
  id: number;
  record_type: 'borrowed' | 'lent';
  person_name: string;
  contact_info: string;
  principal_amount: string | number;
  interest_rate: string | number;
  start_date: string;
  due_date?: string | null;
  status: 'pending' | 'partially_paid' | 'settled' | 'overdue';
  notes: string;
  total_repaid: string | number;
  remaining_balance: string | number;
  repayments: DebtRepayment[];
  created_at: string;
}

export interface DashboardSummaryResponse {
  user: {
    id: number;
    name: string;
    email: string;
    access_code: string;
  };
  summary: {
    total_balance: number;
    monthly_expenses: number;
    monthly_budget: number;
    office_attendance_pct: number;
    office_days_present: number;
    gym_attendance_pct: number;
    gym_days_done: number;
    total_borrowed_outstanding: number;
    total_lent_outstanding: number;
    net_debt: number;
    today_office_status: string;
    today_gym_status: string;
  };
  bank_accounts: BankAccount[];
  recent_transactions: MoneyTransaction[];
  upcoming_payments: PaymentRecord[];
  recent_notes: PersonalNote[];
  recent_documents: StoredDocument[];
}

function getAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  try {
    const raw = localStorage.getItem("minivers_user");
    if (raw) {
      const user = JSON.parse(raw);
      if (user?.id) headers["X-User-Id"] = String(user.id);
      if (user?.access_code) {
        headers["X-Access-Code"] = user.access_code;
      }
    }
  } catch {
    // Ignore storage parse issues
  }
  return headers;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const defaultHeaders = getAuthHeaders();
  const headers = {
    ...defaultHeaders,
    ...((init?.headers as Record<string, string>) || {}),
  };

  const res = await fetch(url, {
    ...init,
    headers,
  });

  if (res.status === 204) {
    return {} as T;
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const firstError =
      data?.access_code?.[0] ||
      data?.email?.[0] ||
      data?.password?.[0] ||
      data?.name?.[0] ||
      data?.non_field_errors?.[0] ||
      data?.detail ||
      data?.error ||
      "Request failed";
    throw new Error(firstError);
  }

  return data as T;
}

export const api = {
  // ── Authentication ──
  auth: {
    login: (accessCode: string) =>
      request<{ message: string; user: UserDetails }>(`${AUTH_BASE}/user-details/login/`, {
        method: "POST",
        body: JSON.stringify({ access_code: accessCode }),
      }),

    register: (name: string, email: string, password: string) =>
      request<{ message: string; access_code: string; user: UserDetails }>(`${AUTH_BASE}/user-details/register/`, {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      }),
  },

  // ── User Profile ──
  profile: {
    get: (id: number) => request<UserDetails>(`${AUTH_BASE}/user-details/${id}/profile/`),
    update: (id: number, data: Partial<UserDetails>) =>
      request<{ message: string; user: UserDetails }>(`${AUTH_BASE}/user-details/${id}/profile/`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    resetCode: (id: number) =>
      request<{ message: string; access_code: string; user: UserDetails }>(`${AUTH_BASE}/user-details/${id}/reset-code/`, {
        method: "POST",
      }),
  },

  // ── Dashboard Overview ──
  dashboard: {
    getSummary: () => request<DashboardSummaryResponse>(`${PERSONAL_BASE}/dashboard/summary/`),
  },

  // ── 01. Bank Accounts & Balance ──
  bankAccounts: {
    list: () => request<BankAccount[]>(`${PERSONAL_BASE}/bank-accounts/`),
    create: (data: Partial<BankAccount>) =>
      request<BankAccount>(`${PERSONAL_BASE}/bank-accounts/`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<BankAccount>) =>
      request<BankAccount>(`${PERSONAL_BASE}/bank-accounts/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request<void>(`${PERSONAL_BASE}/bank-accounts/${id}/`, {
        method: "DELETE",
      }),
  },

  // ── Transactions ──
  transactions: {
    list: () => request<MoneyTransaction[]>(`${PERSONAL_BASE}/transactions/`),
    create: (data: Partial<MoneyTransaction>) =>
      request<MoneyTransaction>(`${PERSONAL_BASE}/transactions/`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  // ── 02. Daily Costs & Expenses ──
  expenses: {
    list: (params?: { category?: string; start_date?: string; end_date?: string }) => {
      const qs = new URLSearchParams(params as Record<string, string>).toString();
      return request<DailyExpense[]>(`${PERSONAL_BASE}/daily-expenses/${qs ? `?${qs}` : ""}`);
    },
    create: (data: Partial<DailyExpense>) =>
      request<DailyExpense>(`${PERSONAL_BASE}/daily-expenses/`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request<void>(`${PERSONAL_BASE}/daily-expenses/${id}/`, {
        method: "DELETE",
      }),
    getCsvExportUrl: () => `${PERSONAL_BASE}/daily-expenses/export-csv/`,
  },

  expenseCategories: {
    list: () => request<ExpenseCategory[]>(`${PERSONAL_BASE}/expense-categories/`),
    create: (data: Partial<ExpenseCategory>) =>
      request<ExpenseCategory>(`${PERSONAL_BASE}/expense-categories/`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  // ── 03. Office & Gym Attendance ──
  attendance: {
    list: (params?: { record_type?: string; month?: number; year?: number }) => {
      const qs = new URLSearchParams(params as unknown as Record<string, string>).toString();
      return request<AttendanceRecord[]>(`${PERSONAL_BASE}/attendance/${qs ? `?${qs}` : ""}`);
    },
    create: (data: Partial<AttendanceRecord>) =>
      request<AttendanceRecord>(`${PERSONAL_BASE}/attendance/`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    quickToggle: (record_type: 'office' | 'gym') =>
      request<AttendanceRecord>(`${PERSONAL_BASE}/attendance/quick-toggle/`, {
        method: "POST",
        body: JSON.stringify({ record_type }),
      }),
  },

  // ── 04. Payment Management ──
  payments: {
    list: (params?: { status?: string; payment_type?: string }) => {
      const qs = new URLSearchParams(params as Record<string, string>).toString();
      return request<PaymentRecord[]>(`${PERSONAL_BASE}/payments/${qs ? `?${qs}` : ""}`);
    },
    create: (data: Partial<PaymentRecord>) =>
      request<PaymentRecord>(`${PERSONAL_BASE}/payments/`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<PaymentRecord>) =>
      request<PaymentRecord>(`${PERSONAL_BASE}/payments/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request<void>(`${PERSONAL_BASE}/payments/${id}/`, {
        method: "DELETE",
      }),
  },

  // ── 05. Personal Biodata ──
  biodata: {
    get: () => request<PersonalBiodata>(`${PERSONAL_BASE}/biodata/`),
    update: (data: Partial<PersonalBiodata>) =>
      request<PersonalBiodata>(`${PERSONAL_BASE}/biodata/`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },

  // ── 06. Family & Friends ──
  contacts: {
    list: (params?: { relationship?: string; favorite?: boolean }) => {
      const qs = new URLSearchParams(params as unknown as Record<string, string>).toString();
      return request<PersonalContact[]>(`${PERSONAL_BASE}/contacts/${qs ? `?${qs}` : ""}`);
    },
    create: (data: Partial<PersonalContact>) =>
      request<PersonalContact>(`${PERSONAL_BASE}/contacts/`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<PersonalContact>) =>
      request<PersonalContact>(`${PERSONAL_BASE}/contacts/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request<void>(`${PERSONAL_BASE}/contacts/${id}/`, {
        method: "DELETE",
      }),
  },

  // ── 07. Documents & File Storage ──
  documents: {
    list: (params?: { folder?: string; trashed?: boolean }) => {
      const qs = new URLSearchParams(params as unknown as Record<string, string>).toString();
      return request<StoredDocument[]>(`${PERSONAL_BASE}/documents/${qs ? `?${qs}` : ""}`);
    },
    create: (data: Partial<StoredDocument>) =>
      request<StoredDocument>(`${PERSONAL_BASE}/documents/`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    trash: (id: number) =>
      request<{ message: string }>(`${PERSONAL_BASE}/documents/${id}/trash/`, {
        method: "POST",
      }),
    restore: (id: number) =>
      request<{ message: string }>(`${PERSONAL_BASE}/documents/${id}/restore/`, {
        method: "POST",
      }),
    delete: (id: number) =>
      request<void>(`${PERSONAL_BASE}/documents/${id}/`, {
        method: "DELETE",
      }),
  },

  // ── 08. Thoughts & Notes ──
  notes: {
    list: (params?: { category?: string }) => {
      const qs = new URLSearchParams(params as Record<string, string>).toString();
      return request<PersonalNote[]>(`${PERSONAL_BASE}/notes/${qs ? `?${qs}` : ""}`);
    },
    create: (data: Partial<PersonalNote>) =>
      request<PersonalNote>(`${PERSONAL_BASE}/notes/`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<PersonalNote>) =>
      request<PersonalNote>(`${PERSONAL_BASE}/notes/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request<void>(`${PERSONAL_BASE}/notes/${id}/`, {
        method: "DELETE",
      }),
  },

  // ── 09. Login & Password Vault ──
  vault: {
    list: (params?: { category?: string }) => {
      const qs = new URLSearchParams(params as Record<string, string>).toString();
      return request<PasswordVaultItem[]>(`${PERSONAL_BASE}/vault-items/${qs ? `?${qs}` : ""}`);
    },
    create: (data: Partial<PasswordVaultItem>) =>
      request<PasswordVaultItem>(`${PERSONAL_BASE}/vault-items/`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<PasswordVaultItem>) =>
      request<PasswordVaultItem>(`${PERSONAL_BASE}/vault-items/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request<void>(`${PERSONAL_BASE}/vault-items/${id}/`, {
        method: "DELETE",
      }),
  },

  // ── 10. Borrowing & Lending (Debt) ──
  debt: {
    list: (params?: { record_type?: string; status?: string }) => {
      const qs = new URLSearchParams(params as Record<string, string>).toString();
      return request<DebtRecord[]>(`${PERSONAL_BASE}/debts/${qs ? `?${qs}` : ""}`);
    },
    create: (data: Partial<DebtRecord>) =>
      request<DebtRecord>(`${PERSONAL_BASE}/debts/`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<DebtRecord>) =>
      request<DebtRecord>(`${PERSONAL_BASE}/debts/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    repay: (id: number, data: { amount: number | string; payment_method?: string; notes?: string }) =>
      request<DebtRecord>(`${PERSONAL_BASE}/debts/${id}/repay/`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request<void>(`${PERSONAL_BASE}/debts/${id}/`, {
        method: "DELETE",
      }),
  },

  // ── Preferences ──
  preferences: {
    get: () => request<Record<string, unknown>>(`${PERSONAL_BASE}/preferences/`),
    update: (data: Record<string, unknown>) =>
      request<Record<string, unknown>>(`${PERSONAL_BASE}/preferences/`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },
};
