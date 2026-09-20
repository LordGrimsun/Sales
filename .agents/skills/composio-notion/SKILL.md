---
name: composio-notion
description: Autonomous Notion knowledge base management, winning product research logs, supplier databases, and weekly strategy archives powered by Composio. Use when archiving product research, updating competitor ad swipe files, or recording team learnings.
---

# Composio Notion Skill

This skill guides agents (especially `Noa`, `Pim`, `Orla`, `Tess`, `Pros`) in maintaining the company knowledge base in Notion via Composio.

## 1. Role Capabilities
- **Product Research Database**:
  - Log newly discovered dropshipping products with product title, supplier cost, recommended retail price, target audience, and AliExpress / CJ Dropshipping supplier links.
  - Track estimated margins and competitor landing page URLs.
- **Competitor Ad Swipe File**:
  - Archive viral TikTok / Meta ad hooks, visual angles, and engagement metrics.
- **Supplier Directory**:
  - Keep records of vetted suppliers, average lead times, shipping reliability, and contact details.
- **SOP & Routine Logs**:
  - Document winning sales routines, conversion rate benchmarks, and seasonal campaign playbooks.

## 2. Composio Tool Slugs & Actions
When invoking tools via Composio:
- **`NOTION_QUERY_DATABASE`**: Search existing databases for products, suppliers, or tasks.
- **`NOTION_CREATE_PAGE`**: Create new entries in the Product Research or Competitor Ad databases with formatted properties.
- **`NOTION_UPDATE_PAGE`**: Update status (e.g. `Testing`, `Scaling`, `Paused`, `Vetted Supplier`).
- **`NOTION_APPEND_BLOCK`**: Add notes, hooks, or image URLs to existing pages.

## 3. Database Schema Standards
- Product records must include: Title, Status, Supplier Price, Target Retail Price, Margin %, Supplier Link.
- Competitor records must include: Hook Text, Format (Reel/Carousel/Static), Target Audience, Ad Spend tier.
