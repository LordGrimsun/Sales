// Agents Office — Dropshipping AI Demand & Margin Engine (V3.6)
// Inspired by logeshkannan19/DropShipping-AI-Agent
//
// Provides demand prediction scoring and dynamic margin optimization
// for Sunnyeora's 31 live Shopify SKUs (clothing, 2-piece sets, sweaters).

/**
 * Calculates landed unit profitability and break-even ROAS
 * @param {Object} params
 * @param {number} params.retailPrice - Customer selling price (USD)
 * @param {number} params.supplierCogs - Landed supplier product + freight cost from CJ/AliExpress (USD)
 * @param {number} [params.estimatedCac=14.50] - Target customer acquisition cost via Meta/TikTok ads (USD)
 * @param {number} [params.gatewayRate=0.029] - Shopify Payments transaction fee (default 2.9%)
 * @param {number} [params.gatewayFlat=0.30] - Flat gateway transaction fee ($0.30)
 */
export function calculateUnitEconomics({
  retailPrice,
  supplierCogs,
  estimatedCac = 14.50,
  gatewayRate = 0.029,
  gatewayFlat = 0.30
}) {
  const price = Math.max(0, Number(retailPrice) || 0);
  const cogs = Math.max(0, Number(supplierCogs) || 0);
  const cac = Math.max(0, Number(estimatedCac) || 0);

  const paymentFee = +(price * gatewayRate + gatewayFlat).toFixed(2);
  const totalCost = +(cogs + paymentFee + cac).toFixed(2);
  const netProfit = +(price - totalCost).toFixed(2);
  const netMargin = price > 0 ? +((netProfit / price) * 100).toFixed(1) : 0;
  
  // Gross profit before ad spend
  const grossProfit = +(price - cogs - paymentFee).toFixed(2);
  // Break-even ROAS = Retail Price / Gross Profit
  const breakEvenRoas = grossProfit > 0 ? +(price / grossProfit).toFixed(2) : 99.9;
  
  // Max ad spend allowed to preserve at least 25% net margin
  const maxCacFor25Pct = +(grossProfit - (price * 0.25)).toFixed(2);

  return {
    retailPrice: price,
    supplierCogs: cogs,
    paymentFee,
    estimatedCac: cac,
    totalCost,
    netProfit,
    netMarginPercent: netMargin,
    breakEvenRoas,
    maxCacFor25Pct: Math.max(0, maxCacFor25Pct),
    health: netMargin >= 40 ? 'EXCELLENT' : netMargin >= 25 ? 'HEALTHY' : 'NEEDS_OPTIMIZATION'
  };
}

/**
 * Predicts product demand score (0-100) based on category, rating, price elasticity & viral trends
 */
export function predictDemandScore({
  rating = 4.8,
  reviewCount = 140,
  viralTrendFactor = 1.25, // TikTok/Reels trend multiplier
  priceTier = 'mid' // 'budget' (<$30), 'mid' ($30-$70), 'premium' (>$70)
}) {
  let score = 50;

  // Rating contribution (up to 20 pts)
  score += Math.min(20, Math.max(0, (rating - 3.5) * 13.3));

  // Review volume proof (up to 15 pts)
  score += Math.min(15, Math.log10(Math.max(10, reviewCount)) * 5);

  // Viral social momentum (up to 15 pts)
  score += Math.min(15, (viralTrendFactor - 1.0) * 30);

  // Price elasticity multiplier (women's boutique sweet spot is $45-$65)
  if (priceTier === 'mid') score += 10;
  else if (priceTier === 'budget') score += 5;

  const finalScore = Math.min(100, Math.max(10, Math.round(score)));
  
  let label = 'MODERATE';
  if (finalScore >= 80) label = '🔥 HIGH DEMAND VIRAL CANDIDATE';
  else if (finalScore >= 65) label = '⚡ STRONG STEADY SELLER';
  else label = '❄️ NICHE OR LOW VELOCITY';

  return {
    score: finalScore,
    tier: label,
    recommendedDailyBudget: finalScore >= 80 ? 50 : finalScore >= 65 ? 25 : 10
  };
}

/** Sample metrics for Sunnyeora Catalog SKUs */
export const SUNNYEORA_CATALOG_HEALTH = {
  totalSkus: 31,
  activeDropshipCarrier: 'CJ Dropshipping + USPS',
  avgRetailPrice: 58.00,
  avgSupplierCogs: 19.50,
  avgNetMargin: 41.5,
  avgBreakEvenRoas: 1.82,
  status: 'ALL 31 SKUs AUDITED & PROFITABLE'
};
