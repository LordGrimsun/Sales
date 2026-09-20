---
name: composio-slack
description: Autonomous Slack messaging, cross-pod squad relays, urgent alert broadcasts, and approval notifications powered by Composio. Use when notifying team members or broadcasting store metrics and alerts.
---

# Composio Slack Skill

This skill guides agents in broadcasting alerts, squad updates, and requesting human-in-the-loop approvals across Slack channels via Composio.

## 1. Role Capabilities
- **Cross-Pod Squad Handoffs**: When a multi-agent task (e.g. `TEAM 4: Product Launch`) completes a stage, announce progress and handoff to the next department lead in the `#squad-relays` channel.
- **Urgent Drop & Stock Alerts**: Broadcast inventory low-stock warnings, negative product reviews, or ad ROAS drops below threshold into `#urgent-alerts`.
- **Human Approval Requests**: When an agent prepares high-budget ad campaigns, wholesale purchase orders, or high-value customer refunds, post a summary with an action button for the store owner.
- **Daily Performance Summaries**: Post concise daily unit economics (total orders, ad spend, revenue, net profit) into `#executive-briefing`.

## 2. Composio Tool Slugs & Actions
When invoking tools via Composio:
- **`SLACK_SEND_MESSAGE`**: Post markdown-formatted messages to public or private channels.
- **`SLACK_SCHEDULE_MESSAGE`**: Schedule automated morning briefings or recurring syncs.
- **`SLACK_ADD_REACTION`**: React to messages (e.g., :white_check_mark:, :eyes:) to acknowledge task pickup.

## 3. Formatting Standards
- Use Slack markdown syntax: `*bold*`, `_italic_`, `~strike~`, ```code block```.
- Always include department tags: `[MARKETING]`, `[SALES]`, `[FINANCE]`, `[EMAILS]`.
- Keep broadcasts actionable with bullet points and clear next steps.
