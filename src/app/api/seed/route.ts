import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

const products = [
  {
    name: 'SKMEI 1251 Digital Sports Watch',
    slug: 'skmei-1251-digital-sports',
    description: 'The SKMEI 1251 is a rugged digital sports watch featuring a large LCD display, 50M water resistance, and multiple functions including stopwatch, alarm, and LED backlight. Perfect for outdoor activities and everyday wear.',
    price: 25.99,
    original_price: 35.99,
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600', 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600'],
    category: 'digital', brand: 'SKMEI', sku: 'SKM-1251-BLK', stock: 150,
    features: ['50M Water Resistant', 'LED Backlight', 'Stopwatch Function', 'Dual Time Display', 'Alarm Function', 'Auto Calendar'],
    specifications: { movement: 'Digital Quartz', caseMaterial: 'Resin', bandMaterial: 'PU Rubber', dialColor: 'Black', caseSize: '50mm', waterResistance: '50M / 5ATM', warranty: '1 Year' },
    is_new: false, is_featured: true, is_bestseller: false, on_sale: true, rating: 4.5, review_count: 128,
    colors: [{ name: 'Black', hex: '#1a1a1a' }, { name: 'Red', hex: '#DC2626' }, { name: 'Blue', hex: '#1D4ED8' }],
    video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
  },
  {
    name: 'SKMEI 9198 Business Quartz Watch',
    slug: 'skmei-9198-business-quartz',
    description: 'Elegant business watch with stainless steel construction, date display, and luminous hands. The SKMEI 9198 combines sophistication with reliability for the modern professional.',
    price: 45.99, original_price: 59.99,
    images: ['https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600', 'https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=600'],
    category: 'analog', brand: 'SKMEI', sku: 'SKM-9198-SLV', stock: 85,
    features: ['Stainless Steel Case', 'Date Display', 'Luminous Hands', '30M Water Resistant', 'Sapphire Crystal Glass', 'Japanese Movement'],
    specifications: { movement: 'Japanese Quartz', caseMaterial: 'Stainless Steel', bandMaterial: 'Genuine Leather', dialColor: 'Silver', caseSize: '42mm', waterResistance: '30M / 3ATM', warranty: '1 Year' },
    is_new: true, is_featured: true, is_bestseller: true, on_sale: true, rating: 4.8, review_count: 64,
    colors: [{ name: 'Silver', hex: '#C0C0C0' }, { name: 'Gold', hex: '#D4AF37' }, { name: 'Black', hex: '#1a1a1a' }],
  },
  {
    name: 'SKMEI 1358 Compass Sports Watch',
    slug: 'skmei-1358-compass-sports',
    description: 'Adventure-ready sports watch with built-in compass, altimeter, barometer, and thermometer. The SKMEI 1358 is your ultimate outdoor companion with 50M water resistance.',
    price: 39.99, original_price: null,
    images: ['https://images.unsplash.com/photo-1533139502658-0198f920d8e8?w=600', 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600'],
    category: 'sports', brand: 'SKMEI', sku: 'SKM-1358-GRN', stock: 120,
    features: ['Digital Compass', 'Altimeter', 'Barometer', 'Thermometer', '50M Water Resistant', 'World Time'],
    specifications: { movement: 'Digital Quartz', caseMaterial: 'ABS Resin', bandMaterial: 'PU Rubber', dialColor: 'Green/Black', caseSize: '52mm', waterResistance: '50M / 5ATM', warranty: '1 Year' },
    is_new: false, is_featured: true, is_bestseller: true, on_sale: false, rating: 4.6, review_count: 92,
  },
  {
    name: 'SKMEI W30 Smart Watch',
    slug: 'skmei-w30-smart-watch',
    description: 'Full-featured smartwatch with heart rate monitoring, blood pressure tracking, sleep analysis, and smartphone notifications. Stay connected and healthy with the SKMEI W30.',
    price: 65.99, original_price: 89.99,
    images: ['https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600', 'https://images.unsplash.com/photo-1617043786394-f977fa12eddf?w=600'],
    category: 'smart', brand: 'SKMEI', sku: 'SKM-W30-BLK', stock: 75,
    features: ['Heart Rate Monitor', 'Blood Pressure Tracking', 'Sleep Analysis', 'Step Counter', 'Smartphone Notifications', 'IP68 Waterproof'],
    specifications: { movement: 'Smart Digital', caseMaterial: 'Aluminum Alloy', bandMaterial: 'Silicone', dialColor: 'Black', caseSize: '44mm', waterResistance: 'IP68', warranty: '1 Year' },
    is_new: true, is_featured: true, is_bestseller: false, on_sale: true, rating: 4.4, review_count: 156,
  },
  {
    name: 'SKMEI 9305 Luxury Chronograph',
    slug: 'skmei-9305-luxury-chronograph',
    description: 'Premium chronograph watch featuring a stunning rose gold finish, genuine leather strap, and precise Japanese movement. The SKMEI 9305 is perfect for those who appreciate luxury.',
    price: 89.99, original_price: 129.99,
    images: ['https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=600', 'https://images.unsplash.com/photo-1548169874-53e85f753f1e?w=600'],
    category: 'luxury', brand: 'SKMEI', sku: 'SKM-9305-RSG', stock: 40,
    features: ['Chronograph Function', 'Rose Gold Finish', 'Genuine Leather Strap', 'Sapphire Crystal', '30M Water Resistant', 'Date Display'],
    specifications: { movement: 'Japanese Quartz Chronograph', caseMaterial: 'Stainless Steel (Rose Gold PVD)', bandMaterial: 'Genuine Leather', dialColor: 'Rose Gold/White', caseSize: '45mm', waterResistance: '30M / 3ATM', warranty: '1 Year' },
    is_new: false, is_featured: true, is_bestseller: false, on_sale: true, rating: 4.9, review_count: 38,
    colors: [{ name: 'Rose Gold', hex: '#B76E79' }, { name: 'Gold', hex: '#D4AF37' }, { name: 'Silver', hex: '#C0C0C0' }],
  },
  {
    name: 'SKMEI 1335 Military Watch',
    slug: 'skmei-1335-military',
    description: 'Tough military-style watch with dual time zones, EL backlight, and rugged construction. Built to withstand extreme conditions while maintaining precise timekeeping.',
    price: 32.99, original_price: null,
    images: ['https://images.unsplash.com/photo-1548171915-e79a380a2a4b?w=600', 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=600'],
    category: 'sports', brand: 'SKMEI', sku: 'SKM-1335-CAM', stock: 200,
    features: ['Dual Time Zones', 'EL Backlight', 'Shock Resistant', '50M Water Resistant', 'Military Design', 'Countdown Timer'],
    specifications: { movement: 'Digital + Analog Quartz', caseMaterial: 'ABS Resin', bandMaterial: 'Nylon Canvas', dialColor: 'Camouflage', caseSize: '48mm', waterResistance: '50M / 5ATM', warranty: '1 Year' },
    is_new: false, is_featured: false, is_bestseller: true, on_sale: false, rating: 4.3, review_count: 211,
  },
  {
    name: 'SKMEI 1464 Minimalist Watch',
    slug: 'skmei-1464-minimalist',
    description: 'Ultra-thin minimalist design with clean aesthetics and reliable timekeeping. The SKMEI 1464 is perfect for those who appreciate understated elegance.',
    price: 29.99, original_price: null,
    images: ['https://images.unsplash.com/photo-1434056886845-dbbe837fd1d5?w=600', 'https://images.unsplash.com/photo-1495857000853-fe46c8aefc30?w=600'],
    category: 'analog', brand: 'SKMEI', sku: 'SKM-1464-WHT', stock: 95,
    features: ['Ultra-Thin Design (7mm)', 'Minimalist Dial', 'Mesh Steel Band', '30M Water Resistant', 'Japanese Movement', 'Scratch-Resistant Glass'],
    specifications: { movement: 'Japanese Quartz', caseMaterial: 'Stainless Steel', bandMaterial: 'Stainless Steel Mesh', dialColor: 'White', caseSize: '40mm', waterResistance: '30M / 3ATM', warranty: '1 Year' },
    is_new: true, is_featured: false, is_bestseller: false, on_sale: false, rating: 4.7, review_count: 78,
  },
  {
    name: 'SKMEI 1155B G-Style Sport',
    slug: 'skmei-1155b-g-style',
    description: 'Bold G-style sports watch with dual display, multiple time zones, and exceptional durability. A statement piece for active individuals.',
    price: 28.99, original_price: 39.99,
    images: ['https://images.unsplash.com/photo-1585123334904-845d60e97b29?w=600', 'https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?w=600'],
    category: 'sports', brand: 'SKMEI', sku: 'SKM-1155B-RED', stock: 180,
    features: ['Dual Display (Analog + Digital)', 'Shock Resistant', '50M Water Resistant', 'LED Backlight', 'Multiple Alarms', 'Hourly Chime'],
    specifications: { movement: 'Digital + Analog Quartz', caseMaterial: 'ABS Resin', bandMaterial: 'PU Rubber', dialColor: 'Black/Red', caseSize: '55mm', waterResistance: '50M / 5ATM', warranty: '1 Year' },
    is_new: false, is_featured: true, is_bestseller: true, on_sale: true, rating: 4.5, review_count: 342,
  },
  {
    name: 'SKMEI W37 Pro Smartwatch',
    slug: 'skmei-w37-pro-smartwatch',
    description: 'Advanced smartwatch with AMOLED display, GPS tracking, and comprehensive health monitoring. The W37 Pro is your complete fitness and lifestyle companion.',
    price: 99.99, original_price: 149.99,
    images: ['https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=600', 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600'],
    category: 'smart', brand: 'SKMEI', sku: 'SKM-W37P-BLK', stock: 50,
    features: ['AMOLED Display', 'Built-in GPS', 'Heart Rate + SpO2', '100+ Sport Modes', '7-Day Battery Life', 'Always-On Display'],
    specifications: { movement: 'Smart Digital', caseMaterial: 'Titanium Alloy', bandMaterial: 'Fluoroelastomer', dialColor: 'Black', caseSize: '46mm', waterResistance: '5ATM + IP68', warranty: '1 Year' },
    is_new: true, is_featured: true, is_bestseller: false, on_sale: true, rating: 4.7, review_count: 89,
  },
  {
    name: 'SKMEI 9266 Classic Dress Watch',
    slug: 'skmei-9266-classic-dress',
    description: 'Timeless dress watch with Roman numerals, moonphase display, and premium craftsmanship. Perfect for formal occasions and everyday elegance.',
    price: 55.99, original_price: null,
    images: ['https://images.unsplash.com/photo-1526045431048-f857369baa09?w=600', 'https://images.unsplash.com/photo-1539874754764-5a96559165b0?w=600'],
    category: 'luxury', brand: 'SKMEI', sku: 'SKM-9266-BLU', stock: 65,
    features: ['Roman Numeral Dial', 'Moonphase Display', 'Date Function', 'Genuine Leather', 'Sapphire Crystal', '30M Water Resistant'],
    specifications: { movement: 'Japanese Quartz', caseMaterial: 'Stainless Steel', bandMaterial: 'Genuine Leather', dialColor: 'Blue', caseSize: '43mm', waterResistance: '30M / 3ATM', warranty: '1 Year' },
    is_new: false, is_featured: false, is_bestseller: false, on_sale: false, rating: 4.8, review_count: 52,
  },
  {
    name: 'SKMEI 1712 LED Matrix Watch',
    slug: 'skmei-1712-led-matrix',
    description: 'Futuristic LED matrix display watch with unique time reading format. A conversation starter that combines technology with bold design.',
    price: 22.99, original_price: null,
    images: ['https://images.unsplash.com/photo-1557438159-51eec7a6c9e8?w=600', 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600'],
    category: 'digital', brand: 'SKMEI', sku: 'SKM-1712-BLK', stock: 140,
    features: ['LED Matrix Display', 'Binary Time Option', 'Date Display', '30M Water Resistant', 'Stainless Steel', 'Unique Design'],
    specifications: { movement: 'LED Digital', caseMaterial: 'Stainless Steel', bandMaterial: 'Stainless Steel', dialColor: 'Black LED', caseSize: '44mm', waterResistance: '30M / 3ATM', warranty: '1 Year' },
    is_new: false, is_featured: false, is_bestseller: false, on_sale: false, rating: 4.2, review_count: 167,
  },
  {
    name: 'SKMEI Kids Sports Watch',
    slug: 'skmei-kids-sports',
    description: 'Colorful and durable kids watch with educational time display, alarm function, and fun design. Perfect for young adventurers learning to tell time.',
    price: 15.99, original_price: null,
    images: ['https://images.unsplash.com/photo-1533139502658-0198f920d8e8?w=600', 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600'],
    category: 'digital', brand: 'SKMEI', sku: 'SKM-KIDS-BLU', stock: 250,
    features: ['Kid-Friendly Design', 'Colorful Display', '50M Water Resistant', 'Alarm Function', 'LED Backlight', 'Shock Resistant'],
    specifications: { movement: 'Digital Quartz', caseMaterial: 'ABS Plastic', bandMaterial: 'Soft Silicone', dialColor: 'Blue/Multi', caseSize: '38mm', waterResistance: '50M / 5ATM', warranty: '1 Year' },
    is_new: false, is_featured: false, is_bestseller: false, on_sale: false, rating: 4.1, review_count: 203,
  },
];

export async function GET(req: NextRequest) {
  // Disabled in production — only allow with secret token in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Seed endpoint disabled in production' }, { status: 403 });
  }

  // const secret = req.nextUrl.searchParams.get('secret');
  // const expected = process.env.ADMIN_SESSION_SECRET;
  // if (!secret || secret !== expected) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  await supabaseServer.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  const { data, error } = await supabaseServer
    .from('products')
    .insert(products)
    .select('id, name, slug');

  if (error) {
    return NextResponse.json({ error: error.message, details: error }, { status: 500 });
  }

  return NextResponse.json({ seeded: data?.length ?? 0, products: data });
}
