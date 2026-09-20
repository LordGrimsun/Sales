---
name: composio-meta
description: Autonomous Meta & Facebook Ads management, viral hook generation, ad set copywriting, and ROAS monitoring powered by Composio. Use when drafting ad campaigns, analyzing ad set performance, or updating marketing assets.
---

# Composio Meta & Facebook Ads Skill

This skill guides agents in the Marketing pod (`Ada`, `Iggy`, `Vid`, `Mlead`) in executing high-converting Meta Ad workflows via Composio.

## 1. Role Capabilities
- **Ad Creative & Copy Generation**:
  - Produce 3 distinct variations for every ad set:
    - *Variation A (Direct Problem / Solution)*: Addresses a primary customer pain point (e.g. cold winter outfits, styling frustration, wardrobe fatigue).
    - *Variation B (Social Proof / Viral Trend)*: "POV: You found the viral...", "Everyone in the office asked where I got this...", customer review testimonials.
    - *Variation C (Lifestyle / Aspirational)*: Transition from work to evening drinks, travel elegance with deep functional pockets.
- **Headline & Primary Text Formatting**:
  - Keep primary text between 50 and 120 words with clear line breaks.
  - Punchy, curiosity-driven headlines under 40 characters.
  - Call To Action (CTA): `Shop Now`, `Claim Offer`, or `Order Today`.
- **ROAS & Performance Monitoring**:
  - Track Cost Per Click (CPC), Click-Through Rate (CTR), and Return on Ad Spend (ROAS).
  - Automatically flag ad sets with ROAS < 2.0x for review or budget re-allocation.

## 2. Composio Tool Slugs & Actions
When invoking tools via Composio:
- **`META_GET_AD_ACCOUNTS`**: List active ad accounts and pixel IDs.
- **`META_CREATE_CAMPAIGN`**: Initialize campaigns with objective `OUTCOME_SALES`.
- **`META_CREATE_AD_SET`**: Define daily budgets, target countries (US, UK, CA, AU), and demographic parameters.
- **`META_CREATE_AD`**: Upload creative assets, bind copy variations, and link to Sunnyeora product page.
- **`META_GET_INSIGHTS`**: Retrieve real-time ad performance metrics and ROAS.

## 3. Compliance & Best Practices
- Never make unrealistic or unsubstantiated claims.
- Ensure destination URLs lead directly to the corresponding product variant page with fast mobile loading times.
