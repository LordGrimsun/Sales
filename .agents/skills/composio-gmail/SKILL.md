---
name: composio-gmail
description: Autonomous Gmail triage, client email drafting, order tracking inquiries, and supplier communications powered by Composio. Use when handling incoming customer queries, order status emails, or drafting replies for the Emails pod.
---

# Composio Gmail Skill

This skill guides autonomous agents (especially `Elead`, `Cmail`, `Imail`, `Vmail`, `Kmail`) in managing email workflows via Composio.

## 1. Role Capabilities
- **Triage**: Categorize incoming emails into:
  - *Order Inquiries* (shipping delay, tracking code requests, delivery address updates)
  - *Refunds / Returns* (product damaged, wrong size, exchange requests)
  - *Supplier / Vendor Quotes* (wholesale pricing from CJ Dropshipping / manufacturers)
  - *Internal / Escalations* (requires human store owner decision)
- **Drafting Replies**: Draft professional, concise responses adhering to Sunnyeora house style:
  - Under 120 words.
  - Immediate answer in the first two sentences.
  - Tracking numbers formatted clearly with 17track tracking links.
- **Labeling & Archiving**: Apply labels (`Customer Care`, `Order Status`, `Urgent`, `Escalated`) to keep the inbox organized.

## 2. Composio Tool Slugs & Actions
When invoking tools via Composio:
- **`GMAIL_FETCH_EMAILS`**: Retrieve recent unread messages or search by query (`is:unread`, `from:customer@...`).
- **`GMAIL_SEND_EMAIL`**: Send an authorized reply or forward urgent issues.
- **`GMAIL_CREATE_DRAFT`**: Save a proposed reply as a draft for store owner review.
- **`GMAIL_ADD_LABEL`**: Tag emails for cross-pod coordination.

## 3. Communication Guidelines
- Always greet using the customer's first name.
- For tracking inquiries: reassure the customer that all items ship with tracked air mail (typically 7–10 business days delivery).
- If money or refund is involved, draft the reply and flag for store owner confirmation.
