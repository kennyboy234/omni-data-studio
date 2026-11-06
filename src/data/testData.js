// Test Data - N=120 - Same population for all Descriptive tests
// Variables: ID, Category, Factory, Age, Satisfaction, Sales
// This file must be imported by DescriptiveTab

function seededRandom(seed) {
  let t = seed + 0x6D2B79F5;
  return function() {
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateTestData() {
  const rand = seededRandom(42);
  const categories = ["Electronics", "Apparel", "Home Goods", "Beauty"];
  const factories = ["Factory12", "Factory7", "Factory9"];
  const data = [];
  for (let i = 1; i <= 120; i++) {
    const r = rand();
    let category = "Electronics";
    if (r < 0.38) category = "Electronics";
    else if (r < 0.63) category = "Home Goods";
    else if (r < 0.84) category = "Apparel";
    else category = "Beauty";
    const factory = factories[Math.floor(rand() * 3)];
    const age = 18 + Math.floor(rand() * 47);
    let satisfaction = 1 + Math.floor(rand() * 5);
    if (category === "Electronics" && satisfaction < 5) satisfaction = satisfaction + 1;
    if (category === "Apparel" && satisfaction > 1) satisfaction = satisfaction - 1;
    const sales = Math.round((155 + rand() * 568) * 100) / 100;
    data.push({ ID: i, Category: category, Factory: factory, Age: age, Satisfaction: satisfaction, Sales: sales });
  }
  return data;
}

export const testData = generateTestData();