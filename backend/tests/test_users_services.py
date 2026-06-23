"""
tests/test_users_services.py

Tests for users.services — magic link generation and CU domain detection.
Emails are intercepted via Django's locmem backend so we can assert on content.
"""

from django.test import TestCase, override_settings
from django.core import mail

from users.models import User
from users.services import send_magic_link, is_cu_student


# ---------------------------------------------------------------------------
# CU Domain Detection
# ---------------------------------------------------------------------------

class TestIsCUStudent(TestCase):

    def test_cuchd_in_is_cu_student(self):
        self.assertTrue(is_cu_student('23bce1234@cuchd.in'))

    def test_cumail_in_is_cu_student(self):
        self.assertTrue(is_cu_student('student@cumail.in'))

    def test_gmail_is_not_cu_student(self):
        self.assertFalse(is_cu_student('someone@gmail.com'))

    def test_yahoo_is_not_cu_student(self):
        self.assertFalse(is_cu_student('user@yahoo.com'))

    def test_case_insensitive(self):
        self.assertTrue(is_cu_student('user@CUCHD.IN'))


# ---------------------------------------------------------------------------
# Magic Link Email
# ---------------------------------------------------------------------------

@override_settings(
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
    FRONTEND_URL='http://localhost:3000',
)
class TestSendMagicLink(TestCase):

    def test_creates_new_user_if_not_exists(self):
        self.assertEqual(User.objects.count(), 0)
        send_magic_link('newstudent@cuchd.in')
        self.assertEqual(User.objects.count(), 1)
        user = User.objects.first()
        self.assertEqual(user.email, 'newstudent@cuchd.in')

    def test_does_not_duplicate_existing_user(self):
        User.objects.create(email='existing@cuchd.in', full_name='Existing User')
        send_magic_link('existing@cuchd.in')
        self.assertEqual(User.objects.filter(email='existing@cuchd.in').count(), 1)

    def test_sets_is_cu_student_for_cu_email(self):
        send_magic_link('student@cuchd.in')
        user = User.objects.get(email='student@cuchd.in')
        self.assertTrue(user.is_cu_student)

    def test_sets_is_cu_student_false_for_external_email(self):
        send_magic_link('outsider@gmail.com')
        user = User.objects.get(email='outsider@gmail.com')
        self.assertFalse(user.is_cu_student)

    def test_sends_one_email(self):
        send_magic_link('student@cuchd.in')
        self.assertEqual(len(mail.outbox), 1)

    def test_email_sent_to_correct_address(self):
        send_magic_link('target@cuchd.in')
        self.assertEqual(mail.outbox[0].to, ['target@cuchd.in'])

    def test_email_subject_contains_club_name(self):
        send_magic_link('test@cuchd.in')
        self.assertIn('C Square Club', mail.outbox[0].subject)

    def test_email_body_contains_magic_link_url(self):
        send_magic_link('check@cuchd.in')
        # The token URL should be present in either text or HTML body
        combined = mail.outbox[0].body + str(mail.outbox[0].alternatives)
        self.assertIn('http://localhost:3000/auth/verify?token=', combined)
