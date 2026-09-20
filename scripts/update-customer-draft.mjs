import { Composio } from '@composio/core';
import fs from 'fs';
import path from 'path';

const env = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
const apiKey = env.match(/COMPOSIO_API_KEY=([^\r\n]+)/)[1].trim();
const composio = new Composio({ apiKey });

async function run() {
  const session = await composio.create('sunnyeora_store_owner');

  const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sunnyeora Autumn Collection</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f3f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <center style="width: 100%; background-color: #f4f3f0; padding: 24px 0;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06); text-align: left;">
      
      <!-- Top Brand Announcement Bar -->
      <div style="background-color: #1a1a1a; color: #ffffff; padding: 9px 16px; text-align: center; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; font-weight: 600;">
        🍂 Private VIP Access &bull; 48 Hours Only &bull; Code: <strong>AUTUMN20</strong>
      </div>

      <!-- Luxury Header -->
      <div style="padding: 32px 24px 20px; text-align: center; border-bottom: 1px solid #f0eee9;">
        <div style="font-family: 'Playfair Display', Georgia, serif; font-size: 30px; letter-spacing: 6px; font-weight: 700; color: #1a1a1a; text-transform: uppercase;">SUNNYEORA</div>
        <div style="font-size: 11px; letter-spacing: 2.5px; color: #8c827a; margin-top: 4px; text-transform: uppercase;">Modern Luxury &bull; Autumn Capsule</div>
        
        <!-- Navigation Links -->
        <div style="margin-top: 18px; font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase;">
          <a href="https://sunnyeora.myshopify.com/collections/all" style="color: #4a4540; text-decoration: none; margin: 0 12px; font-weight: 500;">New In</a>
          <span style="color: #d1cbc4;">&bull;</span>
          <a href="https://sunnyeora.myshopify.com/collections/all" style="color: #4a4540; text-decoration: none; margin: 0 12px; font-weight: 500;">Bestsellers</a>
          <span style="color: #d1cbc4;">&bull;</span>
          <a href="https://sunnyeora.myshopify.com/collections/all" style="color: #b85d19; text-decoration: none; margin: 0 12px; font-weight: 700;">Autumn Sale</a>
        </div>
      </div>

      <!-- Editorial Hero Banner -->
      <div style="background: linear-gradient(135deg, #a45318 0%, #cb7632 50%, #d8894a 100%); padding: 48px 32px; text-align: center; color: #ffffff;">
        <span style="display: inline-block; background-color: rgba(255, 255, 255, 0.2); padding: 5px 14px; border-radius: 20px; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; font-weight: 600; margin-bottom: 14px;">The Autumn Edit // 2026</span>
        <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 34px; line-height: 1.2; margin: 0 0 12px; font-weight: 700; letter-spacing: 0.5px;">Elegance in Every Layer</h1>
        <p style="font-size: 15px; line-height: 1.6; max-width: 440px; margin: 0 auto 24px; color: #fff1e6; font-weight: 300;">Discover rich earth tones, cozy knitwear, and timeless essentials designed to carry you effortlessly through the season.</p>
        <a href="https://sunnyeora.myshopify.com/collections/all" style="display: inline-block; background-color: #ffffff; color: #1a1a1a; padding: 14px 34px; border-radius: 30px; font-weight: 700; font-size: 13px; letter-spacing: 1.5px; text-transform: uppercase; text-decoration: none; box-shadow: 0 6px 18px rgba(0,0,0,0.15);">Explore Collection &rarr;</a>
      </div>

      <!-- VIP Voucher Card -->
      <div style="padding: 28px 24px 12px;">
        <div style="background-color: #faf7f2; border: 2px dashed #d97736; border-radius: 12px; padding: 22px 20px; text-align: center;">
          <div style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #8a7c70; font-weight: 600; margin-bottom: 6px;">Exclusive VIP Unlock</div>
          <div style="font-size: 32px; font-weight: 900; letter-spacing: 5px; color: #b85d19; font-family: 'Courier New', Courier, monospace;">AUTUMN20</div>
          <div style="font-size: 14px; color: #524b45; margin-top: 6px; font-weight: 500;">Take <strong>20% OFF</strong> your entire cart &bull; Valid for 48 hours</div>
          <div style="margin-top: 14px;">
            <a href="https://sunnyeora.myshopify.com/collections/all" style="display: inline-block; background-color: #b85d19; color: #ffffff; padding: 10px 24px; border-radius: 6px; font-size: 12px; letter-spacing: 1px; text-transform: uppercase; font-weight: 700; text-decoration: none;">Apply Code at Checkout &rarr;</a>
          </div>
        </div>
      </div>

      <!-- Curated Lookbook Spotlight Section -->
      <div style="padding: 24px 24px 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #b85d19; font-weight: 700;">Curated Essentials</div>
          <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 24px; color: #1a1a1a; margin: 4px 0 0;">Trending This Week</h2>
        </div>

        <!-- 3-Item Curated Cards -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
          <tr>
            <!-- Item 1 -->
            <td width="48%" style="vertical-align: top; background-color: #faf9f7; border-radius: 10px; padding: 18px; text-align: center; border: 1px solid #edebe6;">
              <div style="font-size: 32px; margin-bottom: 8px;">🧥</div>
              <div style="font-size: 14px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px;">Cashmere Knit Cardigan</div>
              <div style="font-size: 12px; color: #736c64; margin-bottom: 8px;">Rich camel &bull; Ultra-soft blend</div>
              <div style="font-size: 15px; font-weight: 800; color: #b85d19; margin-bottom: 12px;">$48.00 <span style="font-size: 12px; color: #a89f97; text-decoration: line-through; font-weight: 400;">$60.00</span></div>
              <a href="https://sunnyeora.myshopify.com/collections/all" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 8px 16px; border-radius: 4px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; text-decoration: none;">Shop Item</a>
            </td>

            <td width="4%"></td>

            <!-- Item 2 -->
            <td width="48%" style="vertical-align: top; background-color: #faf9f7; border-radius: 10px; padding: 18px; text-align: center; border: 1px solid #edebe6;">
              <div style="font-size: 32px; margin-bottom: 8px;">👜</div>
              <div style="font-size: 14px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px;">Terracotta Leather Tote</div>
              <div style="font-size: 12px; color: #736c64; margin-bottom: 8px;">Structured &bull; Everyday luxury</div>
              <div style="font-size: 15px; font-weight: 800; color: #b85d19; margin-bottom: 12px;">$38.40 <span style="font-size: 12px; color: #a89f97; text-decoration: line-through; font-weight: 400;">$48.00</span></div>
              <a href="https://sunnyeora.myshopify.com/collections/all" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 8px 16px; border-radius: 4px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; text-decoration: none;">Shop Item</a>
            </td>
          </tr>
        </table>

        <!-- Single Feature Card -->
        <div style="background-color: #faf9f7; border-radius: 10px; padding: 18px 24px; text-align: center; border: 1px solid #edebe6; margin-bottom: 24px;">
          <div style="font-size: 32px; margin-bottom: 6px;">🧣</div>
          <div style="font-size: 15px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px;">The Alpaca Wool Fringe Scarf</div>
          <div style="font-size: 13px; color: #736c64; margin-bottom: 8px;">Warm oatmeal &bull; Oversized blanket silhouette</div>
          <div style="font-size: 16px; font-weight: 800; color: #b85d19; margin-bottom: 12px;">$22.40 <span style="font-size: 13px; color: #a89f97; text-decoration: line-through; font-weight: 400;">$28.00</span></div>
          <a href="https://sunnyeora.myshopify.com/collections/all" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 9px 24px; border-radius: 4px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; text-decoration: none;">Shop The Scarf &rarr;</a>
        </div>
      </div>

      <!-- Editorial Stylist Note -->
      <div style="padding: 24px 32px; background-color: #f7f5f0; border-top: 1px solid #eee9e0; border-bottom: 1px solid #eee9e0; text-align: center;">
        <p style="font-family: 'Playfair Display', Georgia, serif; font-style: italic; font-size: 16px; line-height: 1.7; color: #3d3935; margin: 0 0 10px;">
          &ldquo;We curated this capsule with one simple philosophy: quiet luxury, premium seasonal textures, and timeless versatility &mdash; without the traditional designer markup.&rdquo;
        </p>
        <p style="font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; color: #9c9288; margin: 0; font-weight: 600;">&mdash; The Sunnyeora Design Studio</p>
      </div>

      <!-- Trust Badges Bar -->
      <div style="padding: 24px 20px; background-color: #ffffff;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="text-align: center; font-size: 11px; color: #5a544e;">
          <tr>
            <td width="33%" style="padding: 0 8px;">
              <div style="font-size: 18px; margin-bottom: 4px;">✈️</div>
              <strong>Fast Dispatch</strong><br/>Worldwide shipping
            </td>
            <td width="33%" style="padding: 0 8px; border-left: 1px solid #eee; border-right: 1px solid #eee;">
              <div style="font-size: 18px; margin-bottom: 4px;">🔄</div>
              <strong>30-Day Guarantee</strong><br/>Hassle-free returns
            </td>
            <td width="33%" style="padding: 0 8px;">
              <div style="font-size: 18px; margin-bottom: 4px;">🔒</div>
              <strong>Shopify Secure</strong><br/>256-bit encryption
            </td>
          </tr>
        </table>
      </div>

      <!-- Community / Instagram Strip -->
      <div style="background-color: #1a1a1a; color: #ffffff; padding: 28px 24px; text-align: center;">
        <div style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #d97736; font-weight: 700; margin-bottom: 4px;">Join The Community</div>
        <div style="font-family: 'Playfair Display', Georgia, serif; font-size: 18px; margin-bottom: 8px;">Tag #SunnyeoraStyle on Instagram & TikTok</div>
        <p style="font-size: 12px; color: #999999; margin: 0 0 16px;">Share your autumn fit and get featured on our official channel.</p>
        <a href="https://sunnyeora.myshopify.com" style="display: inline-block; background-color: transparent; border: 1px solid #555; color: #fff; padding: 8px 20px; border-radius: 20px; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; text-decoration: none;">Visit Storefront &rarr;</a>
      </div>

      <!-- Footer & Unsubscribe -->
      <div style="background-color: #111111; padding: 24px; text-align: center; font-size: 11px; color: #777777; border-top: 1px solid #222222;">
        <p style="margin: 0 0 8px;">&copy; 2026 Sunnyeora Studio. All rights reserved.</p>
        <p style="margin: 0 0 12px;">You received this private preview because you are an active VIP member.</p>
        <p style="margin: 0;">
          <a href="https://sunnyeora.myshopify.com" style="color: #999999; text-decoration: underline; margin: 0 6px;">Manage Preferences</a> &bull;
          <a href="https://sunnyeora.myshopify.com" style="color: #999999; text-decoration: underline; margin: 0 6px;">Unsubscribe</a> &bull;
          <a href="https://sunnyeora.myshopify.com" style="color: #999999; text-decoration: underline; margin: 0 6px;">Privacy Policy</a>
        </p>
      </div>

    </div>
  </center>
</body>
</html>
`;

  try {
    const res = await session.execute('GMAIL_UPDATE_DRAFT', {
      draft_id: 'r7012996690691937989',
      subject: '🍂 [VIP Unlock] The Autumn Edit: 20% Off Storewide with Code AUTUMN20',
      body: htmlBody,
      is_html: true,
      recipient_email: 'sunnyeora.store@gmail.com'
    });
    console.log('Update Result:', JSON.stringify(res.data || res));
  } catch (err) {
    console.log('Update Draft failed, creating new draft instead:', err.message);
    const newDraft = await session.execute('GMAIL_CREATE_EMAIL_DRAFT', {
      subject: '🍂 [VIP Unlock] The Autumn Edit: 20% Off Storewide with Code AUTUMN20',
      body: htmlBody,
      is_html: true,
      recipient_email: 'sunnyeora.store@gmail.com'
    });
    console.log('New Draft Result:', JSON.stringify(newDraft.data || newDraft));
  }
}

run();
