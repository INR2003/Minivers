from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BankAccountViewSet,
    MoneyTransactionViewSet,
    ExpenseCategoryViewSet,
    DailyExpenseViewSet,
    AttendanceRecordViewSet,
    PaymentRecordViewSet,
    PersonalBiodataView,
    PersonalContactViewSet,
    StoredDocumentViewSet,
    PersonalNoteViewSet,
    PasswordVaultItemViewSet,
    DebtRecordViewSet,
    UserPreferencesView,
    DashboardSummaryView,
)

router = DefaultRouter()
router.register(r'bank-accounts', BankAccountViewSet, basename='bank-account')
router.register(r'transactions', MoneyTransactionViewSet, basename='transaction')
router.register(r'expense-categories', ExpenseCategoryViewSet, basename='expense-category')
router.register(r'daily-expenses', DailyExpenseViewSet, basename='daily-expense')
router.register(r'attendance', AttendanceRecordViewSet, basename='attendance')
router.register(r'payments', PaymentRecordViewSet, basename='payment')
router.register(r'contacts', PersonalContactViewSet, basename='contact')
router.register(r'documents', StoredDocumentViewSet, basename='document')
router.register(r'notes', PersonalNoteViewSet, basename='note')
router.register(r'vault-items', PasswordVaultItemViewSet, basename='vault-item')
router.register(r'debts', DebtRecordViewSet, basename='debt')

urlpatterns = [
    path('dashboard/summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('biodata/', PersonalBiodataView.as_view(), name='personal-biodata'),
    path('preferences/', UserPreferencesView.as_view(), name='user-preferences'),
    path('', include(router.urls)),
]
