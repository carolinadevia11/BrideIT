import os
from typing import List, Optional
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr
from dotenv import load_dotenv

load_dotenv()

class EmailService:
    def __init__(self):
        # Ensure environment variables are loaded or provide defaults/handling
        self.conf = ConnectionConfig(
            MAIL_USERNAME=os.getenv("MAIL_USERNAME", ""),
            MAIL_PASSWORD=os.getenv("MAIL_PASSWORD", ""),
            MAIL_FROM=os.getenv("MAIL_FROM", "noreply@dyad.com"),
            MAIL_PORT=int(os.getenv("MAIL_PORT", 587)),
            MAIL_SERVER=os.getenv("MAIL_SERVER", "smtp.gmail.com"),
            MAIL_STARTTLS=True,
            MAIL_SSL_TLS=False,
            USE_CREDENTIALS=True,
            VALIDATE_CERTS=True
        )
        self.fastmail = FastMail(self.conf)

    def _get_html_template(self, title: str, content: str, action_url: str = "") -> str:
        """
        Generates a professional HTML email template with the app branding.
        """
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{title}</title>
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f5;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 30px; padding-top: 20px;">
                    <h1 style="color: #4F46E5; margin: 0; font-size: 28px; font-weight: 700;">Bridge</h1>
                    <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 14px;">Co-parenting made simple</p>
                </div>

                <!-- Main Content -->
                <div style="background-color: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                    <h2 style="color: #111827; margin-top: 0; margin-bottom: 20px; font-size: 20px; font-weight: 600;">{title}</h2>
                    
                    <div style="color: #4b5563; font-size: 16px; margin-bottom: 30px;">
                        {content}
                    </div>

                    {f'''
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="{action_url}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px;">Open Bridge</a>
                    </div>
                    ''' if action_url else ''}
                </div>

                <!-- Footer -->
                <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #9ca3af;">
                    <p style="margin: 0;">This is an automated notification from Bridge.</p>
                    <p style="margin: 5px 0 0 0;">&copy; {os.getenv('YEAR', '2025')} Bridge. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """

    async def send_event_notification(self, recipients: List[str], action: str, event_title: str, event_date: str, performed_by_name: str):
        """
        Sends an email notification for event creation, update, or deletion.
        """
        valid_recipients = [r for r in recipients if r]
        if not valid_recipients:
            return

        action_map = {
            "create": "New Event",
            "update": "Event Updated",
            "delete": "Event Cancelled"
        }
        
        verb_map = {
            "create": "created a new event",
            "update": "updated the event",
            "delete": "cancelled the event"
        }
        
        display_action = action_map.get(action, "Calendar Update")
        subject = f"{display_action}: {event_title}"
        
        content = f"""
        <p><strong>{performed_by_name}</strong> has {verb_map.get(action, 'modified an event')} in the family calendar.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; margin-bottom: 5px;"><strong>Event:</strong> {event_title}</p>
            <p style="margin: 0;"><strong>Date:</strong> {event_date}</p>
        </div>
        <p>Please log in to your dashboard to view the full details.</p>
        """

        try:
            message = MessageSchema(
                subject=subject,
                recipients=valid_recipients,
                body=self._get_html_template(subject, content),
                subtype=MessageType.html
            )
            await self.fastmail.send_message(message)
        except Exception as e:
            print(f"Failed to send email: {e}")

    async def send_swap_request_created(self, requester_email: str, recipient_email: str, requester_name: str, event_title: str, event_date: str):
        """
        Sends notifications for a new swap request:
        1. Confirmation to the requester.
        2. Action request to the recipient.
        """
        # 1. Email to requester
        if requester_email:
            try:
                subject = "Swap Request Sent"
                content = f"""
                <p>You have successfully requested a swap for the event <strong>{event_title}</strong>.</p>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; margin-bottom: 5px;"><strong>Event:</strong> {event_title}</p>
                    <p style="margin: 0;"><strong>Date:</strong> {event_date}</p>
                </div>
                <p>We've notified the other parent. You will receive an email once they respond.</p>
                """
                message = MessageSchema(
                    subject=subject,
                    recipients=[requester_email],
                    body=self._get_html_template(subject, content),
                    subtype=MessageType.html
                )
                await self.fastmail.send_message(message)
            except Exception as e:
                print(f"Failed to send email to requester: {e}")

        # 2. Email to recipient
        if recipient_email:
            try:
                subject = "New Swap Request"
                content = f"""
                <p><strong>{requester_name}</strong> has requested a custody swap.</p>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; margin-bottom: 5px;"><strong>Event:</strong> {event_title}</p>
                    <p style="margin: 0;"><strong>Date:</strong> {event_date}</p>
                </div>
                <p>Please review this request to approve or reject it.</p>
                """
                message = MessageSchema(
                    subject=subject,
                    recipients=[recipient_email],
                    body=self._get_html_template(subject, content, action_url="https://bridge-app.com/calendar"), # Placeholder URL or configured one
                    subtype=MessageType.html
                )
                await self.fastmail.send_message(message)
            except Exception as e:
                print(f"Failed to send email to recipient: {e}")

    async def send_swap_resolution_notification(self, recipients: List[str], event_title: str, status: str, resolved_by_name: str):
        """Sends an email to both parents when a swap is approved or rejected."""
        valid_recipients = [r for r in recipients if r]
        if not valid_recipients:
            return

        subject = f"Swap Request {status.capitalize()}"
        status_color = "#10B981" if status == "approved" else "#EF4444"
        
        content = f"""
        <p>The swap request for event <strong>{event_title}</strong> has been <span style="color: {status_color}; font-weight: bold;">{status}</span> by {resolved_by_name}.</p>
        <p>The family calendar has been updated to reflect this change.</p>
        """

        try:
            message = MessageSchema(
                subject=subject,
                recipients=valid_recipients,
                body=self._get_html_template(subject, content),
                subtype=MessageType.html
            )
            await self.fastmail.send_message(message)
        except Exception as e:
            print(f"Failed to send email: {e}")

    async def send_document_notification(self, recipients: List[str], action: str, document_name: str, performed_by_name: str, document_type: str = "document"):
        """Sends email when a document is added or deleted."""
        valid_recipients = [r for r in recipients if r]
        if not valid_recipients:
            return

        action_verb = "uploaded" if action == "upload" else "deleted"
        subject = f"Document {action_verb.capitalize()}: {document_name}"
        
        content = f"""
        <p><strong>{performed_by_name}</strong> has {action_verb} a {document_type}.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Document:</strong> {document_name}</p>
        </div>
        """
        
        try:
            message = MessageSchema(
                subject=subject,
                recipients=valid_recipients,
                body=self._get_html_template(subject, content),
                subtype=MessageType.html
            )
            await self.fastmail.send_message(message)
        except Exception as e:
            print(f"Failed to send email: {e}")

    async def send_contract_notification(self, recipients: List[str], action: str, performed_by_name: str):
        """Sends email when a custody agreement/contract is uploaded or deleted."""
        valid_recipients = [r for r in recipients if r]
        if not valid_recipients:
            return

        action_verb = "uploaded" if action == "upload" else "deleted"
        subject = f"Custody Agreement {action_verb.capitalize()}"
        
        content = f"""
        <p>This is an important notification regarding your family's legal documents.</p>
        <p>The <strong>Custody Agreement</strong> has been {action_verb} by {performed_by_name}.</p>
        """
        
        try:
            message = MessageSchema(
                subject=subject,
                recipients=valid_recipients,
                body=self._get_html_template(subject, content),
                subtype=MessageType.html
            )
            await self.fastmail.send_message(message)
        except Exception as e:
            print(f"Failed to send email: {e}")

email_service = EmailService()