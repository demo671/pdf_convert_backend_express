# Email Setup Guide - Using Resend

## Overview
When a client sends documents to a company, the system will:
1. ✅ Display documents in the company dashboard
2. ✅ Send an email to the company's email address with PDF attachments

## Why Resend?

**Resend** is a modern email API that's:
- ✅ **Easy to setup** - No SMTP configuration needed
- ✅ **Reliable** - 99.99% uptime SLA
- ✅ **Fast** - Emails sent in milliseconds
- ✅ **Generous free tier** - 100 emails/day for free
- ✅ **Better deliverability** - Built-in SPF, DKIM, DMARC
- ✅ **Developer-friendly** - Simple API, great documentation

## Quick Setup (5 minutes)

### Step 1: Sign Up for Resend

1. Go to **https://resend.com**
2. Click **"Sign Up"** (it's free!)
3. Verify your email address
4. Log in to your dashboard

### Step 2: Get Your API Key

1. In the Resend dashboard, click **"API Keys"** in the sidebar
2. Click **"Create API Key"**
3. Enter a name: "PDF Portal"
4. Select permissions: **"Sending access"**
5. Click **"Add"**
6. **Copy the API key** (it starts with `re_`)

### Step 3: Add Domain (Optional but Recommended)

For production, add your own domain:

1. In Resend dashboard, go to **"Domains"**
2. Click **"Add Domain"**
3. Enter your domain: `yourdomain.com`
4. Add the DNS records shown to your domain provider
5. Wait for verification (usually 5-10 minutes)

**For testing**, you can use the default `onboarding@resend.dev` email.

### Step 4: Configure Your `.env` File

Update these values in your `.env` file:

```env
# Email Configuration - Using Resend
RESEND_API_KEY=re_YourActualAPIKey123456789
RESEND_FROM_EMAIL=noreply@yourdomain.com
FRONTEND_URL=http://localhost:5173
```

**Important:**
- Replace `re_YourActualAPIKey123456789` with your actual API key from Step 2
- For testing, you can use `onboarding@resend.dev` as `RESEND_FROM_EMAIL`
- For production, use your verified domain: `noreply@yourdomain.com`

### Step 5: Restart Backend Server

```bash
# Stop the server (Ctrl+C)
# Start again
npm run dev
```

You should see:
```
✅ Resend email service initialized
```

## Testing the Email

1. Register a test company with a real email address
2. Have admin approve the company
3. Login as a client
4. Upload and send a document to that company
5. Check the company's email inbox!

## How It Works

When a client sends documents to a company:

1. **Dashboard**: Documents appear immediately in company dashboard
2. **Email Sent via Resend**:
   - Professional HTML email
   - Company name greeting
   - Client information
   - All PDF documents as attachments
   - Link to dashboard

## Email Template

The email includes:
- **From**: Your configured email (e.g., `noreply@yourdomain.com`)
- **To**: Company's email address
- **Subject**: `Nuevos documentos de [Client Email]`
- **Content**:
  - Beautiful HTML design with your brand colors
  - Company name greeting
  - Number of documents received
  - Client name/email
  - Link to dashboard
- **Attachments**: All PDF files sent by the client

## Resend Pricing

### Free Tier (Perfect for Testing)
- ✅ **100 emails/day** (3,000/month)
- ✅ Unlimited team members
- ✅ Email logs for 7 days
- ✅ Support via Discord

### Pro Plan ($20/month)
- ✅ **50,000 emails/month**
- ✅ $1 per additional 1,000 emails
- ✅ Email logs for 90 days
- ✅ Priority support

### Enterprise (Custom Pricing)
- ✅ Custom email volumes
- ✅ Dedicated IP addresses
- ✅ Custom SLA
- ✅ Premium support

👉 **Start with the free tier** - it's enough for most small to medium businesses!

## Troubleshooting

### Email not sending?

**Check backend logs:**

✅ **Success:**
```
✅ Resend email service initialized
📧 Preparing to send 3 documents to company@example.com...
📤 Sending email via Resend to company@example.com...
✅ Email sent successfully via Resend! ID: abc123
```

❌ **Not configured:**
```
⚠️ Resend email service not configured. Set RESEND_API_KEY in .env
```

**Common issues:**

1. **Invalid API Key**
   - Make sure you copied the full API key (starts with `re_`)
   - Check for extra spaces in `.env` file
   - API key should not have quotes around it

2. **"onboarding@resend.dev" rate limited**
   - This is a shared test domain
   - Add your own domain for unlimited sending

3. **Domain not verified**
   - Check DNS records in your domain provider
   - Wait 5-10 minutes after adding DNS records
   - Use `dig` command to verify: `dig TXT yourdomain.com`

### Email going to spam?

If using a custom domain:

1. ✅ **Add DNS records** from Resend dashboard:
   - SPF record
   - DKIM record
   - DMARC record

2. ✅ **Warm up your domain**:
   - Start with small volumes
   - Gradually increase over time

3. ✅ **Avoid spam trigger words**:
   - Don't use ALL CAPS
   - Avoid "FREE", "URGENT", etc.

4. ✅ **Add unsubscribe link** (optional)

### Check Email Status

View sent emails in Resend dashboard:
1. Go to **"Logs"** in Resend dashboard
2. See delivery status, opens, clicks
3. View bounce/complaint details

## Advantages Over SMTP

| Feature | SMTP (Gmail, etc.) | Resend |
|---------|-------------------|--------|
| Setup complexity | ⚠️ Complex (App passwords, 2FA) | ✅ Simple (Just API key) |
| Deliverability | ⚠️ Can get blocked | ✅ Excellent |
| Speed | ⚠️ 1-5 seconds | ✅ Milliseconds |
| Rate limits | ⚠️ 500/day (Gmail) | ✅ 100-50,000+/day |
| Attachments | ⚠️ 25MB limit | ✅ 40MB limit |
| Analytics | ❌ None | ✅ Opens, clicks, bounces |
| Cost | ✅ Free (limited) | ✅ Free tier available |

## Security Notes

- **Never commit** your `.env` file to version control
- Keep your API key secret
- Rotate API keys periodically
- Use different API keys for dev/staging/production
- Monitor email logs for unusual activity

## Support & Resources

- 📚 **Documentation**: https://resend.com/docs
- 💬 **Discord Community**: https://resend.com/discord
- 📧 **Email Support**: support@resend.com
- 🐛 **Report Issues**: https://github.com/resendlabs/resend-node/issues

## Example: Production Setup

```env
# Production Configuration
RESEND_API_KEY=re_ProductionAPIKey_abc123xyz789
RESEND_FROM_EMAIL=documentos@miempresa.com
FRONTEND_URL=https://portal.miempresa.com
```

With verified domain `miempresa.com` and DNS records:

```
TXT  @  v=spf1 include:_spf.resend.com ~all
CNAME resend._domainkey  resend._domainkey.resend.com
TXT  _dmarc  v=DMARC1; p=none; rua=mailto:admin@miempresa.com
```

---

🎉 **You're all set!** Emails will now be sent to companies when clients send them documents.
