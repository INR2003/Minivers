import base64
import hashlib
from django.conf import settings
from cryptography.fernet import Fernet


def _get_fernet_key() -> bytes:
    """
    Derive a 32-byte urlsafe base64 key from Django SECRET_KEY.
    """
    raw_key = getattr(settings, 'VAULT_SECRET_KEY', settings.SECRET_KEY).encode('utf-8')
    derived = hashlib.sha256(raw_key).digest()
    return base64.urlsafe_b64encode(derived)


def encrypt_vault_password(plain_text: str) -> str:
    """
    Encrypt plaintext password into a base64 ciphertext string.
    """
    if not plain_text:
        return ""
    f = Fernet(_get_fernet_key())
    token = f.encrypt(plain_text.encode('utf-8'))
    return token.decode('utf-8')


def decrypt_vault_password(cipher_text: str) -> str:
    """
    Decrypt base64 ciphertext back to plaintext.
    """
    if not cipher_text:
        return ""
    try:
        f = Fernet(_get_fernet_key())
        decrypted = f.decrypt(cipher_text.encode('utf-8'))
        return decrypted.decode('utf-8')
    except Exception:
        return "[Decryption Error]"
