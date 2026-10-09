from rest_framework import serializers
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


class BankAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankAccount
        fields = [
            'id', 'account_name', 'bank_name', 'account_type',
            'account_number_last4', 'opening_balance', 'current_balance',
            'currency', 'color', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class MoneyTransactionSerializer(serializers.ModelSerializer):
    account_name = serializers.CharField(source='account.account_name', read_only=True)
    to_account_name = serializers.CharField(source='to_account.account_name', read_only=True, allow_null=True)

    class Meta:
        model = MoneyTransaction
        fields = [
            'id', 'account', 'account_name', 'to_account', 'to_account_name',
            'transaction_type', 'amount', 'category', 'date', 'description', 'created_at'
        ]
        read_only_fields = ['id', 'account_name', 'to_account_name', 'created_at']


class ExpenseCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpenseCategory
        fields = ['id', 'name', 'monthly_budget', 'color', 'icon']
        read_only_fields = ['id']


class DailyExpenseSerializer(serializers.ModelSerializer):
    account_name = serializers.CharField(source='account.account_name', read_only=True, allow_null=True)

    class Meta:
        model = DailyExpense
        fields = [
            'id', 'amount', 'date', 'category', 'description',
            'payment_method', 'account', 'account_name', 'created_at'
        ]
        read_only_fields = ['id', 'account_name', 'created_at']


class AttendanceRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceRecord
        fields = [
            'id', 'date', 'record_type', 'status',
            'check_in', 'check_out', 'duration_minutes',
            'workout_focus', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PaymentRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentRecord
        fields = [
            'id', 'payment_type', 'amount', 'party_name', 'purpose',
            'payment_method', 'status', 'is_recurring', 'due_date',
            'payment_date', 'notes', 'receipt_url', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PersonalBiodataSerializer(serializers.ModelSerializer):
    class Meta:
        model = PersonalBiodata
        fields = [
            'id', 'gender', 'blood_group', 'marital_status',
            'address', 'city', 'state', 'pincode', 'country',
            'education', 'employment', 'skills', 'interests',
            'personal_goals', 'emergency_contacts', 'important_dates',
            'updated_at'
        ]
        read_only_fields = ['id', 'updated_at']


class PersonalContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = PersonalContact
        fields = [
            'id', 'name', 'relationship', 'phone', 'email',
            'birthday', 'anniversary', 'address', 'notes',
            'is_favorite', 'avatar_color', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class StoredDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoredDocument
        fields = [
            'id', 'title', 'file_name', 'file_type', 'file_size',
            'file_data', 'folder', 'tags', 'description', 'is_trashed',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PersonalNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = PersonalNote
        fields = [
            'id', 'title', 'content', 'mood', 'category',
            'is_pinned', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PasswordVaultItemSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    decrypted_password = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = PasswordVaultItem
        fields = [
            'id', 'title', 'login_url', 'username', 'password',
            'decrypted_password', 'category', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'decrypted_password', 'created_at', 'updated_at']

    def get_decrypted_password(self, obj):
        return obj.get_password()

    def create(self, validated_data):
        plain_password = validated_data.pop('password', '')
        item = PasswordVaultItem(**validated_data)
        item.set_password(plain_password)
        item.save()
        return item

    def update(self, instance, validated_data):
        if 'password' in validated_data:
            plain = validated_data.pop('password')
            instance.set_password(plain)
        return super().update(instance, validated_data)


class DebtRepaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = DebtRepayment
        fields = [
            'id', 'debt', 'amount', 'repayment_date',
            'payment_method', 'notes', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class DebtRecordSerializer(serializers.ModelSerializer):
    total_repaid = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    remaining_balance = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    repayments = DebtRepaymentSerializer(many=True, read_only=True)

    class Meta:
        model = DebtRecord
        fields = [
            'id', 'record_type', 'person_name', 'contact_info',
            'principal_amount', 'interest_rate', 'start_date', 'due_date',
            'status', 'notes', 'total_repaid', 'remaining_balance',
            'repayments', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'total_repaid', 'remaining_balance', 'repayments', 'created_at', 'updated_at']


class UserPreferencesSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPreferences
        fields = [
            'id', 'theme', 'currency', 'monthly_budget_target',
            'vault_auto_lock_minutes', 'updated_at'
        ]
        read_only_fields = ['id', 'updated_at']
