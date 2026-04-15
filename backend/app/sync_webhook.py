import os
from app.database import SessionLocal
from app.extremeCloudIQAPI import ExtremeCloudIQAPI
from app import models
from datetime import datetime, timezone

xiq_username = os.getenv('XIQ_USERNAME')
xiq_password = os.getenv('XIQ_PASSWORD')
webhook_url = os.getenv('WEBHOOK_URL')

api = ExtremeCloudIQAPI(xiq_username, xiq_password)
db = SessionLocal()

api.login()
subs = api.list_webhook_subscriptions()

# Delete old webhooks with different URLs
for sub in subs:
    if sub.get('message_type') == 'AUTHENTICATION_LOG_ALL' and sub.get('url') != webhook_url:
        print(f"Deleting old webhook ID {sub.get('id')}: {sub.get('url')}")
        api.delete_webhook_subscription(sub.get('id'))

# Sync current webhook to database
for sub in subs:
    if sub.get('url') == webhook_url and sub.get('message_type') == 'AUTHENTICATION_LOG_ALL':
        sub_id = sub.get('id')
        existing = db.query(models.WebhookSubscription).filter(models.WebhookSubscription.xiq_subscription_id == str(sub_id)).first()
        if not existing:
            webhook_sub = models.WebhookSubscription(
                xiq_subscription_id=str(sub_id),
                message_type='AUTHENTICATION_LOG_ALL',
                webhook_url=webhook_url,
                created_at=datetime.now(timezone.utc),
                is_active=True
            )
            db.add(webhook_sub)
            db.commit()
            print(f"Webhook ID {sub_id} synced to database")
        else:
            print(f"Webhook ID {sub_id} already in database")
        break

api.logout()
db.close()
print("Done!")
