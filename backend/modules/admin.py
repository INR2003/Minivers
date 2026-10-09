from django.contrib import admin
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

admin.site.register(BankAccount)
admin.site.register(MoneyTransaction)
admin.site.register(ExpenseCategory)
admin.site.register(DailyExpense)
admin.site.register(AttendanceRecord)
admin.site.register(PaymentRecord)
admin.site.register(PersonalBiodata)
admin.site.register(PersonalContact)
admin.site.register(StoredDocument)
admin.site.register(PersonalNote)
admin.site.register(PasswordVaultItem)
admin.site.register(DebtRecord)
admin.site.register(DebtRepayment)
admin.site.register(UserPreferences)
