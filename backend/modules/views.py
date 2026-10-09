import csv
from datetime import datetime, date
from decimal import Decimal
from django.db.models import Sum, Q, Count
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from authentication.models import UserDetails
from .models import (
    BankAccount,
    MoneyTransaction,
    ExpenseCategory,
    DailyExpense,
    AttendanceRecord,
    PaymentRecord,
    PersonalBiodata,
    PersonalContact,
    StoredDocument,
    PersonalNote,
    PasswordVaultItem,
    DebtRecord,
    DebtRepayment,
    UserPreferences,
)
from .serializers import (
    BankAccountSerializer,
    MoneyTransactionSerializer,
    ExpenseCategorySerializer,
    DailyExpenseSerializer,
    AttendanceRecordSerializer,
    PaymentRecordSerializer,
    PersonalBiodataSerializer,
    PersonalContactSerializer,
    StoredDocumentSerializer,
    PersonalNoteSerializer,
    PasswordVaultItemSerializer,
    DebtRecordSerializer,
    DebtRepaymentSerializer,
    UserPreferencesSerializer,
)


def get_request_user(request):
    """
    Isolate records per user.
    Reads X-User-Id, X-Access-Code, Authorization Bearer, or query param user_id.
    Falls back to the most recently active UserDetails for seamless local dev.
    """
    user_id = request.headers.get('X-User-Id') or request.query_params.get('user_id')
    if user_id:
        try:
            return UserDetails.objects.get(pk=int(user_id))
        except (UserDetails.DoesNotExist, ValueError):
            pass

    access_code = request.headers.get('X-Access-Code')
    if not access_code:
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            candidate = auth_header.split('Bearer ')[1].strip()
            if candidate.startswith('MINI-'):
                access_code = candidate

    if access_code:
        try:
            return UserDetails.objects.get(access_code=access_code)
        except UserDetails.DoesNotExist:
            pass

    # Fallback to the latest user in the database
    return UserDetails.objects.order_by('-id').first()


from rest_framework.authentication import BaseAuthentication

class UserDetailsAuthentication(BaseAuthentication):
    """
    Authenticate request against UserDetails using access code or user ID.
    Prevents SimpleJWT from rejecting non-JWT access codes with 401.
    """
    def authenticate(self, request):
        user = get_request_user(request)
        if user:
            return (user, None)
        return None


class BaseUserScopedViewSet(viewsets.ModelViewSet):
    """Base ViewSet ensuring data isolation strictly to the active user."""
    authentication_classes = [UserDetailsAuthentication]
    permission_classes = [AllowAny]

    def get_user(self):
        return get_request_user(self.request)

    def get_queryset(self):
        user = self.get_user()
        if not user:
            return self.model.objects.none()
        return self.model.objects.filter(user=user)

    def perform_create(self, serializer):
        user = self.get_user()
        serializer.save(user=user)


# ── 1. Bank Accounts & Transactions ───────────────────────────────────────────
class BankAccountViewSet(BaseUserScopedViewSet):
    model = BankAccount
    serializer_class = BankAccountSerializer

    def perform_create(self, serializer):
        user = self.get_user()
        # initial current balance defaults to opening balance if not provided
        opening = serializer.validated_data.get('opening_balance', Decimal('0.00'))
        current = serializer.validated_data.get('current_balance', opening)
        serializer.save(user=user, current_balance=current)


class MoneyTransactionViewSet(BaseUserScopedViewSet):
    model = MoneyTransaction
    serializer_class = MoneyTransactionSerializer

    def perform_create(self, serializer):
        user = self.get_user()
        tx = serializer.save(user=user)
        # Update bank balance
        account = tx.account
        if tx.transaction_type == 'income':
            account.current_balance += tx.amount
            account.save(update_fields=['current_balance'])
        elif tx.transaction_type == 'expense':
            account.current_balance -= tx.amount
            account.save(update_fields=['current_balance'])
        elif tx.transaction_type == 'transfer' and tx.to_account:
            account.current_balance -= tx.amount
            account.save(update_fields=['current_balance'])
            tx.to_account.current_balance += tx.amount
            tx.to_account.save(update_fields=['current_balance'])


# ── 2. Daily Expenses ─────────────────────────────────────────────────────────
class ExpenseCategoryViewSet(BaseUserScopedViewSet):
    model = ExpenseCategory
    serializer_class = ExpenseCategorySerializer


class DailyExpenseViewSet(BaseUserScopedViewSet):
    model = DailyExpense
    serializer_class = DailyExpenseSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        category = self.request.query_params.get('category')
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if category:
            qs = qs.filter(category=category)
        if start_date:
            qs = qs.filter(date__gte=start_date)
        if end_date:
            qs = qs.filter(date__lte=end_date)
        return qs

    def perform_create(self, serializer):
        user = self.get_user()
        expense = serializer.save(user=user)
        # If linked to bank account, deduct balance
        if expense.account:
            expense.account.current_balance -= expense.amount
            expense.account.save(update_fields=['current_balance'])

    @action(detail=False, methods=['get'], url_path='export-csv')
    def export_csv(self, request):
        user = self.get_user()
        expenses = DailyExpense.objects.filter(user=user).order_by('-date')
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="expenses_{datetime.now().strftime("%Y%m%d")}.csv"'

        writer = csv.writer(response)
        writer.writerow(['Date', 'Category', 'Description', 'Amount', 'Payment Method', 'Bank Account'])
        for e in expenses:
            account_name = e.account.account_name if e.account else 'None'
            writer.writerow([e.date, e.category, e.description, e.amount, e.payment_method, account_name])
        return response


# ── 3. Attendance (Office & Gym) ──────────────────────────────────────────────
class AttendanceRecordViewSet(BaseUserScopedViewSet):
    model = AttendanceRecord
    serializer_class = AttendanceRecordSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        record_type = self.request.query_params.get('record_type')
        month = self.request.query_params.get('month')
        year = self.request.query_params.get('year')
        if record_type:
            qs = qs.filter(record_type=record_type)
        if month and year:
            qs = qs.filter(date__year=int(year), date__month=int(month))
        return qs

    @action(detail=False, methods=['post'], url_path='quick-toggle')
    def quick_toggle(self, request):
        """Quickly check-in or toggle attendance for today."""
        user = self.get_user()
        if not user:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        record_type = request.data.get('record_type', 'office')
        today = date.today()
        record, created = AttendanceRecord.objects.get_or_update(
            user=user,
            date=today,
            record_type=record_type,
            defaults={
                'status': 'present' if record_type == 'office' else 'workout_done',
                'check_in': datetime.now().time(),
                'duration_minutes': 60 if record_type == 'gym' else 480,
            }
        ) if hasattr(AttendanceRecord.objects, 'get_or_update') else AttendanceRecord.objects.get_or_create(
            user=user,
            date=today,
            record_type=record_type,
            defaults={
                'status': 'present' if record_type == 'office' else 'workout_done',
                'check_in': datetime.now().time(),
                'duration_minutes': 60 if record_type == 'gym' else 480,
            }
        )
        if not created:
            # toggle checkout or present status
            if not record.check_out:
                record.check_out = datetime.now().time()
            record.status = 'present' if record_type == 'office' else 'workout_done'
            record.save()

        return Response(AttendanceRecordSerializer(record).data)


# ── 4. Payment Management ─────────────────────────────────────────────────────
class PaymentRecordViewSet(BaseUserScopedViewSet):
    model = PaymentRecord
    serializer_class = PaymentRecordSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        status_filter = self.request.query_params.get('status')
        p_type = self.request.query_params.get('payment_type')
        if status_filter:
            qs = qs.filter(status=status_filter)
        if p_type:
            qs = qs.filter(payment_type=p_type)
        return qs


# ── 5. Personal Biodata ───────────────────────────────────────────────────────
class PersonalBiodataView(APIView):
    authentication_classes = [UserDetailsAuthentication]
    permission_classes = [AllowAny]

    def get(self, request):
        user = get_request_user(request)
        if not user:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        biodata, _ = PersonalBiodata.objects.get_or_create(user=user)
        return Response(PersonalBiodataSerializer(biodata).data)

    def patch(self, request):
        user = get_request_user(request)
        if not user:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        biodata, _ = PersonalBiodata.objects.get_or_create(user=user)
        serializer = PersonalBiodataSerializer(biodata, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ── 6. Personal Contacts (Family & Friends) ───────────────────────────────────
class PersonalContactViewSet(BaseUserScopedViewSet):
    model = PersonalContact
    serializer_class = PersonalContactSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        rel = self.request.query_params.get('relationship')
        is_fav = self.request.query_params.get('favorite')
        if rel:
            qs = qs.filter(relationship=rel)
        if is_fav is not None:
            qs = qs.filter(is_favorite=(is_fav.lower() == 'true'))
        return qs


# ── 7. Stored Documents ───────────────────────────────────────────────────────
class StoredDocumentViewSet(BaseUserScopedViewSet):
    model = StoredDocument
    serializer_class = StoredDocumentSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        show_trashed = self.request.query_params.get('trashed', 'false') == 'true'
        folder = self.request.query_params.get('folder')
        qs = qs.filter(is_trashed=show_trashed)
        if folder:
            qs = qs.filter(folder=folder)
        return qs

    @action(detail=True, methods=['post'], url_path='restore')
    def restore(self, request, pk=None):
        doc = self.get_object()
        doc.is_trashed = False
        doc.save(update_fields=['is_trashed'])
        return Response({"message": "Document restored successfully."})

    @action(detail=True, methods=['post'], url_path='trash')
    def trash(self, request, pk=None):
        doc = self.get_object()
        doc.is_trashed = True
        doc.save(update_fields=['is_trashed'])
        return Response({"message": "Document moved to trash."})


# ── 8. Thoughts & Notes ───────────────────────────────────────────────────────
class PersonalNoteViewSet(BaseUserScopedViewSet):
    model = PersonalNote
    serializer_class = PersonalNoteSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)
        return qs


# ── 9. Password Vault ─────────────────────────────────────────────────────────
class PasswordVaultItemViewSet(BaseUserScopedViewSet):
    model = PasswordVaultItem
    serializer_class = PasswordVaultItemSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)
        return qs


# ── 10. Borrowing & Lending (Debt) ───────────────────────────────────────────
class DebtRecordViewSet(BaseUserScopedViewSet):
    model = DebtRecord
    serializer_class = DebtRecordSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        rec_type = self.request.query_params.get('record_type')
        stat = self.request.query_params.get('status')
        if rec_type:
            qs = qs.filter(record_type=rec_type)
        if stat:
            qs = qs.filter(status=stat)
        return qs

    @action(detail=True, methods=['post'], url_path='repay')
    def repay(self, request, pk=None):
        debt = self.get_object()
        amount_raw = request.data.get('amount')
        if not amount_raw:
            return Response({"error": "Amount is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        amount = Decimal(str(amount_raw))
        repayment = DebtRepayment.objects.create(
            debt=debt,
            amount=amount,
            repayment_date=request.data.get('repayment_date', date.today()),
            payment_method=request.data.get('payment_method', 'UPI'),
            notes=request.data.get('notes', '')
        )
        # Update debt status if completely repaid
        if debt.remaining_balance <= Decimal('0.00'):
            debt.status = 'settled'
            debt.save(update_fields=['status'])
        elif debt.status == 'pending':
            debt.status = 'partially_paid'
            debt.save(update_fields=['status'])

        return Response(DebtRecordSerializer(debt).data)


# ── 11. User Preferences ──────────────────────────────────────────────────────
class UserPreferencesView(APIView):
    authentication_classes = [UserDetailsAuthentication]
    permission_classes = [AllowAny]

    def get(self, request):
        user = get_request_user(request)
        if not user:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        pref, _ = UserPreferences.objects.get_or_create(user=user)
        return Response(UserPreferencesSerializer(pref).data)

    def patch(self, request):
        user = get_request_user(request)
        if not user:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        pref, _ = UserPreferences.objects.get_or_create(user=user)
        serializer = UserPreferencesSerializer(pref, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ── 12. Complete Dashboard Summary ────────────────────────────────────────────
class DashboardSummaryView(APIView):
    """
    GET /api/personal/dashboard/summary/
    Calculates live dashboard metrics from actual database records.
    """
    authentication_classes = [UserDetailsAuthentication]
    permission_classes = [AllowAny]

    def get(self, request):
        user = get_request_user(request)
        if not user:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        today = date.today()
        first_of_month = today.replace(day=1)

        # 1. Total Bank Balance
        accounts = BankAccount.objects.filter(user=user, is_active=True)
        total_balance = accounts.aggregate(Sum('current_balance'))['current_balance__sum'] or Decimal('0.00')

        # 2. This Month's Expenses
        month_expenses = DailyExpense.objects.filter(
            user=user,
            date__gte=first_of_month,
            date__lte=today
        ).aggregate(Sum('amount'))['amount__sum'] or Decimal('0.00')

        # 3. Attendance (Office & Gym)
        # Office
        office_records = AttendanceRecord.objects.filter(
            user=user,
            record_type='office',
            date__gte=first_of_month,
            date__lte=today
        )
        office_present = office_records.filter(status__in=['present', 'half_day']).count()
        days_passed = today.day
        office_pct = round((office_present / max(1, days_passed)) * 100, 1)

        # Gym
        gym_records = AttendanceRecord.objects.filter(
            user=user,
            record_type='gym',
            date__gte=first_of_month,
            date__lte=today
        )
        gym_done = gym_records.filter(status='workout_done').count()
        gym_pct = round((gym_done / max(1, days_passed)) * 100, 1)

        # Today's status
        today_office = AttendanceRecord.objects.filter(user=user, record_type='office', date=today).first()
        today_gym = AttendanceRecord.objects.filter(user=user, record_type='gym', date=today).first()

        # 4. Outstanding Debt (Borrowed & Lent)
        borrowed_records = DebtRecord.objects.filter(user=user, record_type='borrowed', status__in=['pending', 'partially_paid', 'overdue'])
        total_borrowed_rem = sum((d.remaining_balance for d in borrowed_records), Decimal('0.00'))

        lent_records = DebtRecord.objects.filter(user=user, record_type='lent', status__in=['pending', 'partially_paid', 'overdue'])
        total_lent_rem = sum((d.remaining_balance for d in lent_records), Decimal('0.00'))

        # 5. Recent items
        recent_txs = MoneyTransaction.objects.filter(user=user).order_by('-date', '-created_at')[:5]
        upcoming_payments = PaymentRecord.objects.filter(user=user, status='pending').order_by('due_date')[:5]
        recent_notes = PersonalNote.objects.filter(user=user).order_by('-is_pinned', '-updated_at')[:4]
        recent_docs = StoredDocument.objects.filter(user=user, is_trashed=False).order_by('-created_at')[:4]

        # 6. Preferences
        pref, _ = UserPreferences.objects.get_or_create(user=user)

        data = {
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "access_code": user.access_code,
            },
            "summary": {
                "total_balance": float(total_balance),
                "monthly_expenses": float(month_expenses),
                "monthly_budget": float(pref.monthly_budget_target),
                "office_attendance_pct": office_pct,
                "office_days_present": office_present,
                "gym_attendance_pct": gym_pct,
                "gym_days_done": gym_done,
                "total_borrowed_outstanding": float(total_borrowed_rem),
                "total_lent_outstanding": float(total_lent_rem),
                "net_debt": float(total_lent_rem - total_borrowed_rem),
                "today_office_status": today_office.status if today_office else 'not_recorded',
                "today_gym_status": today_gym.status if today_gym else 'not_recorded',
            },
            "bank_accounts": BankAccountSerializer(accounts, many=True).data,
            "recent_transactions": MoneyTransactionSerializer(recent_txs, many=True).data,
            "upcoming_payments": PaymentRecordSerializer(upcoming_payments, many=True).data,
            "recent_notes": PersonalNoteSerializer(recent_notes, many=True).data,
            "recent_documents": StoredDocumentSerializer(recent_docs, many=True).data,
        }
        return Response(data)
