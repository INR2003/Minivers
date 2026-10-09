from decimal import Decimal
from django.db import models
from django.utils import timezone
from authentication.models import UserDetails
from .encryption import encrypt_vault_password, decrypt_vault_password


# ── 1. Bank Accounts & Wallets ────────────────────────────────────────────────
class BankAccount(models.Model):
    ACCOUNT_TYPES = [
        ('savings', 'Savings Account'),
        ('current', 'Current Account'),
        ('salary', 'Salary Account'),
        ('wallet', 'Cash / Digital Wallet'),
        ('credit_card', 'Credit Card'),
        ('investment', 'Investment Account'),
    ]

    user = models.ForeignKey(UserDetails, on_delete=models.CASCADE, related_name='bank_accounts')
    account_name = models.CharField(max_length=120, help_text="e.g. HDFC Salary, SBI Savings, Cash Wallet")
    bank_name = models.CharField(max_length=120, help_text="e.g. HDFC Bank, SBI, Cash")
    account_type = models.CharField(max_length=30, choices=ACCOUNT_TYPES, default='savings')
    account_number_last4 = models.CharField(max_length=10, blank=True, default="", help_text="Last 4 digits or masked identifier")
    opening_balance = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'))
    current_balance = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'))
    currency = models.CharField(max_length=10, default='INR')
    color = models.CharField(max_length=20, default='#007ACC')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'bank_accounts'
        ordering = ['-is_active', 'account_name']

    def __str__(self):
        return f"{self.account_name} ({self.bank_name})"


class MoneyTransaction(models.Model):
    TRANSACTION_TYPES = [
        ('income', 'Income / Deposit'),
        ('expense', 'Expense / Withdrawal'),
        ('transfer', 'Transfer Between Accounts'),
    ]

    user = models.ForeignKey(UserDetails, on_delete=models.CASCADE, related_name='money_transactions')
    account = models.ForeignKey(BankAccount, on_delete=models.CASCADE, related_name='transactions')
    to_account = models.ForeignKey(BankAccount, on_delete=models.SET_NULL, null=True, blank=True, related_name='incoming_transfers')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    category = models.CharField(max_length=80, default='General')
    date = models.DateField(default=timezone.now)
    description = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'money_transactions'
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.transaction_type}: {self.amount} ({self.date})"


# ── 2. Daily Costs & Expenses ─────────────────────────────────────────────────
class ExpenseCategory(models.Model):
    user = models.ForeignKey(UserDetails, on_delete=models.CASCADE, related_name='expense_categories')
    name = models.CharField(max_length=80)
    monthly_budget = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    color = models.CharField(max_length=20, default='#007ACC')
    icon = models.CharField(max_length=50, default='receipt')

    class Meta:
        db_table = 'expense_categories'
        unique_together = ('user', 'name')
        ordering = ['name']

    def __str__(self):
        return self.name


class DailyExpense(models.Model):
    PAYMENT_METHODS = [
        ('upi', 'UPI / QR'),
        ('cash', 'Cash'),
        ('debit_card', 'Debit Card'),
        ('credit_card', 'Credit Card'),
        ('net_banking', 'Net Banking'),
        ('other', 'Other'),
    ]

    user = models.ForeignKey(UserDetails, on_delete=models.CASCADE, related_name='daily_expenses')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField(default=timezone.now)
    category = models.CharField(max_length=80, default='Food')
    description = models.CharField(max_length=255, blank=True, default="")
    payment_method = models.CharField(max_length=30, choices=PAYMENT_METHODS, default='upi')
    account = models.ForeignKey(BankAccount, on_delete=models.SET_NULL, null=True, blank=True, related_name='expenses')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'daily_expenses'
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.category}: {self.amount} on {self.date}"


# ── 3. Office & Gym Attendance ────────────────────────────────────────────────
class AttendanceRecord(models.Model):
    ATTENDANCE_TYPES = [
        ('office', 'Office Attendance'),
        ('gym', 'Gym Workout'),
    ]
    STATUS_CHOICES = [
        ('present', 'Present / Worked'),
        ('workout_done', 'Workout Completed'),
        ('absent', 'Absent'),
        ('half_day', 'Half Day'),
        ('leave', 'On Leave'),
        ('rest_day', 'Rest Day'),
        ('holiday', 'Holiday'),
    ]

    user = models.ForeignKey(UserDetails, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField(default=timezone.now)
    record_type = models.CharField(max_length=20, choices=ATTENDANCE_TYPES, default='office')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='present')
    check_in = models.TimeField(null=True, blank=True)
    check_out = models.TimeField(null=True, blank=True)
    duration_minutes = models.PositiveIntegerField(default=0)
    workout_focus = models.CharField(max_length=120, blank=True, default="", help_text="e.g. Chest & Triceps, Leg Day, Cardio")
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'attendance_records'
        unique_together = ('user', 'date', 'record_type')
        ordering = ['-date']

    def __str__(self):
        return f"{self.user.name} - {self.record_type} ({self.date}) [{self.status}]"


# ── 4. Payment Management ─────────────────────────────────────────────────────
class PaymentRecord(models.Model):
    PAYMENT_TYPES = [
        ('received', 'Payment Received (Income)'),
        ('made', 'Payment Made (Sent)'),
    ]
    STATUS_CHOICES = [
        ('completed', 'Completed'),
        ('pending', 'Pending / Scheduled'),
        ('failed', 'Failed / Cancelled'),
    ]

    user = models.ForeignKey(UserDetails, on_delete=models.CASCADE, related_name='payment_records')
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPES, default='made')
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    party_name = models.CharField(max_length=150, help_text="Payer or Payee name / vendor")
    purpose = models.CharField(max_length=200, help_text="e.g. Monthly Rent, Client Invoice, Gym Fee")
    payment_method = models.CharField(max_length=50, default='UPI')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='completed')
    is_recurring = models.BooleanField(default=False)
    due_date = models.DateField(null=True, blank=True)
    payment_date = models.DateField(default=timezone.now)
    notes = models.TextField(blank=True, default="")
    receipt_url = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payment_records'
        ordering = ['-payment_date', '-created_at']

    def __str__(self):
        return f"{self.payment_type.upper()}: {self.amount} - {self.party_name}"


# ── 5. Personal Biodata & Extended Profile ─────────────────────────────────────
class PersonalBiodata(models.Model):
    user = models.OneToOneField(UserDetails, on_delete=models.CASCADE, related_name='biodata')
    gender = models.CharField(max_length=20, blank=True, default="")
    blood_group = models.CharField(max_length=10, blank=True, default="")
    marital_status = models.CharField(max_length=30, blank=True, default="")
    address = models.TextField(blank=True, default="")
    city = models.CharField(max_length=100, blank=True, default="")
    state = models.CharField(max_length=100, blank=True, default="")
    pincode = models.CharField(max_length=20, blank=True, default="")
    country = models.CharField(max_length=100, blank=True, default="India")
    
    # Structured JSON stores for rich details
    education = models.JSONField(default=list, blank=True, help_text="List of education objects: [{degree, institute, year, grade}]")
    employment = models.JSONField(default=list, blank=True, help_text="List of employment objects: [{role, company, start, end, current}]")
    skills = models.JSONField(default=list, blank=True, help_text="List of skill strings: ['Python', 'React']")
    interests = models.JSONField(default=list, blank=True, help_text="List of interest strings: ['Reading', 'Fitness']")
    personal_goals = models.JSONField(default=list, blank=True, help_text="List of goal objects: [{title, target_date, completed}]")
    emergency_contacts = models.JSONField(default=list, blank=True, help_text="List of [{name, relation, phone}]")
    important_dates = models.JSONField(default=list, blank=True, help_text="List of [{title, date, notes}]")
    
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'personal_biodata'

    def __str__(self):
        return f"Biodata of {self.user.name}"


# ── 6. Family & Friends ───────────────────────────────────────────────────────
class PersonalContact(models.Model):
    RELATIONSHIPS = [
        ('family', 'Family'),
        ('friend', 'Friend'),
        ('colleague', 'Colleague / Work'),
        ('relative', 'Relative'),
        ('mentor', 'Mentor / Advisor'),
        ('other', 'Other'),
    ]

    user = models.ForeignKey(UserDetails, on_delete=models.CASCADE, related_name='contacts')
    name = models.CharField(max_length=150)
    relationship = models.CharField(max_length=30, choices=RELATIONSHIPS, default='friend')
    phone = models.CharField(max_length=30, blank=True, default="")
    email = models.EmailField(blank=True, default="")
    birthday = models.DateField(null=True, blank=True)
    anniversary = models.DateField(null=True, blank=True)
    address = models.TextField(blank=True, default="")
    notes = models.TextField(blank=True, default="")
    is_favorite = models.BooleanField(default=False)
    avatar_color = models.CharField(max_length=20, default='#007ACC')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'personal_contacts'
        ordering = ['-is_favorite', 'name']

    def __str__(self):
        return f"{self.name} ({self.relationship})"


# ── 7. Documents & File Storage ───────────────────────────────────────────────
class StoredDocument(models.Model):
    FOLDERS = [
        ('Identity', 'Identity & IDs'),
        ('Financial', 'Financial & Tax'),
        ('Work', 'Work & Career'),
        ('Medical', 'Medical & Health'),
        ('Personal', 'Personal Documents'),
        ('Education', 'Education & Certificates'),
        ('Other', 'Other Documents'),
    ]

    user = models.ForeignKey(UserDetails, on_delete=models.CASCADE, related_name='documents')
    title = models.CharField(max_length=200)
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=50, default='pdf')
    file_size = models.PositiveIntegerField(default=0, help_text="Size in bytes")
    file_data = models.TextField(blank=True, default="", help_text="Base64 data or storage URL")
    folder = models.CharField(max_length=50, choices=FOLDERS, default='Personal')
    tags = models.CharField(max_length=255, blank=True, default="")
    description = models.TextField(blank=True, default="")
    is_trashed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'stored_documents'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.folder})"


# ── 8. Thoughts & Notes ───────────────────────────────────────────────────────
class PersonalNote(models.Model):
    MOODS = [
        ('great', 'Great 😊'),
        ('good', 'Good 🙂'),
        ('neutral', 'Neutral 😐'),
        ('down', 'Down 😔'),
        ('motivated', 'Motivated 🔥'),
        ('creative', 'Creative 💡'),
    ]
    CATEGORIES = [
        ('Journal', 'Daily Journal'),
        ('Ideas', 'Ideas & Brainstorm'),
        ('Reflection', 'Personal Reflection'),
        ('Work', 'Work & Projects'),
        ('Personal', 'Personal Notes'),
    ]

    user = models.ForeignKey(UserDetails, on_delete=models.CASCADE, related_name='notes')
    title = models.CharField(max_length=250)
    content = models.TextField()
    mood = models.CharField(max_length=30, choices=MOODS, blank=True, default='good')
    category = models.CharField(max_length=50, choices=CATEGORIES, default='Journal')
    is_pinned = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'personal_notes'
        ordering = ['-is_pinned', '-updated_at']

    def __str__(self):
        return self.title


# ── 9. Login & Password Vault ─────────────────────────────────────────────────
class PasswordVaultItem(models.Model):
    CATEGORIES = [
        ('Email', 'Email Accounts'),
        ('Social', 'Social Media'),
        ('Banking', 'Banking & Finance'),
        ('Work', 'Work & Portals'),
        ('Entertainment', 'Streaming & Entertainment'),
        ('Utilities', 'Utilities & Services'),
        ('Other', 'Other Logins'),
    ]

    user = models.ForeignKey(UserDetails, on_delete=models.CASCADE, related_name='vault_items')
    title = models.CharField(max_length=150, help_text="e.g. Google, GitHub, SBI Netbanking")
    login_url = models.CharField(max_length=255, blank=True, default="")
    username = models.CharField(max_length=150)
    encrypted_password = models.TextField()
    category = models.CharField(max_length=50, choices=CATEGORIES, default='Other')
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'password_vault_items'
        ordering = ['title']

    def __str__(self):
        return f"{self.title} ({self.username})"

    def set_password(self, plain_text: str):
        self.encrypted_password = encrypt_vault_password(plain_text)

    def get_password(self) -> str:
        return decrypt_vault_password(self.encrypted_password)


# ── 10. Borrowing & Lending (Barrow / Debt Records) ───────────────────────────
class DebtRecord(models.Model):
    RECORD_TYPES = [
        ('borrowed', 'Borrowed (Money I owe to someone)'),
        ('lent', 'Lent (Money someone owes me)'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('partially_paid', 'Partially Paid'),
        ('settled', 'Settled / Closed'),
        ('overdue', 'Overdue'),
    ]

    user = models.ForeignKey(UserDetails, on_delete=models.CASCADE, related_name='debt_records')
    record_type = models.CharField(max_length=20, choices=RECORD_TYPES, default='borrowed')
    person_name = models.CharField(max_length=150)
    contact_info = models.CharField(max_length=100, blank=True, default="")
    principal_amount = models.DecimalField(max_digits=14, decimal_places=2)
    interest_rate = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal('0.00'), help_text="Annual % if applicable")
    start_date = models.DateField(default=timezone.now)
    due_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'debt_records'
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.record_type.capitalize()}: {self.principal_amount} - {self.person_name}"

    @property
    def total_repaid(self) -> Decimal:
        total = self.repayments.aggregate(models.Sum('amount'))['amount__sum']
        return total if total is not None else Decimal('0.00')

    @property
    def remaining_balance(self) -> Decimal:
        rem = self.principal_amount - self.total_repaid
        return max(Decimal('0.00'), rem)


class DebtRepayment(models.Model):
    debt = models.ForeignKey(DebtRecord, on_delete=models.CASCADE, related_name='repayments')
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    repayment_date = models.DateField(default=timezone.now)
    payment_method = models.CharField(max_length=50, default='UPI')
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'debt_repayments'
        ordering = ['-repayment_date']

    def __str__(self):
        return f"Repayment: {self.amount} on {self.repayment_date}"


# ── 11. User Preferences ──────────────────────────────────────────────────────
class UserPreferences(models.Model):
    user = models.OneToOneField(UserDetails, on_delete=models.CASCADE, related_name='preferences')
    theme = models.CharField(max_length=20, default='system')
    currency = models.CharField(max_length=10, default='INR')
    monthly_budget_target = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('50000.00'))
    vault_auto_lock_minutes = models.PositiveIntegerField(default=15)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_preferences'

    def __str__(self):
        return f"Preferences for {self.user.name}"
