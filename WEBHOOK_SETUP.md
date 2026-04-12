# ExtremeCloudIQ Webhook Configuration

## Overview
This application uses the ExtremeCloudIQ Authentication Webhook to track guest connectivity status in real-time. When a guest connects or disconnects from the network, the webhook sends an event to the backend, which updates the guest's connection status.

## Webhook Setup Instructions

### 1. Prerequisites
- ExtremeCloudIQ admin credentials
- The webhook endpoint URL must be publicly accessible
- Backend service must be running and accessible from ExtremeCloudIQ servers

### 2. Webhook Endpoint Details

**Endpoint URL**: `https://your-backend-domain.com/webhooks/authentication`

**Method**: POST

**Expected Payload Format**:
```json
[
  {
    "ownerId": 1234,
    "userId": 5678,
    "timeStamp": 1634567890000,
    "code": 10001,
    "category": 1,
    "description": "Logged in",
    "userName": "guest@example.com"
  }
]
```

**Authentication Codes**:
- `10001`: User login (guest connected to network)
- `10002`: User logout (guest disconnected from network)

### 3. Configure Webhook via ExtremeCloudIQ API

Use the following request to create the webhook subscription:

```bash
curl -X POST https://api.extremecloudiq.com/subscriptions/webhook \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "application": "event-kiosk-auth",
      "url": "https://your-backend-domain.com/webhooks/authentication",
      "secret": "your-webhook-secret",
      "message_type": "AUTHENTICATION_LOG_ALL"
    }
  ]'
```

### 4. Guest Status Indicators

In the frontend, guests are displayed with a colored indicator:
- **Green dot (●)**: Guest is connected to the network
- **Red dot (●)**: Guest is disconnected from the network

### 5. Data Model

The `guests` table now includes:
- `is_connected` (boolean): Current connection status of the guest
- `last_activity_at` (datetime): Timestamp of the last connection/disconnection event

### 6. Verification

To verify the webhook is working:

1. Have a guest connect to the SSID associated with the event
2. Check the guest list in the event details
3. The guest should show a green indicator if connected

### 7. Troubleshooting

- **Webhook not receiving events**: Verify the endpoint URL is publicly accessible
- **Status not updating**: Check that `XIQ_USERNAME` and `XIQ_PASSWORD` environment variables are properly configured
- **Database schema errors**: Run the application to trigger automatic schema migrations

### 8. API Reference

For more information about ExtremeCloudIQ webhooks, refer to:
https://developer.extremecloudiq.com/pages/976054/#about-webhook

### 9. Delete Webhook (if needed)

```bash
curl -X DELETE https://api.extremecloudiq.com/subscriptions/webhook/{id} \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>" \
  -H "Content-Type: application/json"
```
