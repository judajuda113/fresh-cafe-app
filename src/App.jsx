import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ShoppingCart, ChevronRight, ChevronLeft, Check, Clock, X, Plus, Minus, Search } from 'lucide-react';

// ─── Supabase ───────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://dmpcrwzxzosuerjyrdcd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtcGNyd3p4em9zdWVyanlyZGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwMTg3OTYsImV4cCI6MjA5NzU5NDc5Nn0._bkf9MqBp5Nkg4m3aaLExh-CD_V0SDaiSbJZGvrlDbk';
const POLL_MS = 4000;

async function sbFetch(path, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  if (res.status === 204) return null;
  if (!res.ok) throw new Error(`${res.status} ${await res.text().catch(() => '')}`);
  return res.json();
}

async function fetchOrders() {
  try {
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const rows = await sbFetch(`orders?select=order_id,data,created_at&created_at=gte.${since}&order=created_at.asc`);
    const parsed = (rows || []).map(r => { try { return JSON.parse(r.data); } catch { return null; } }).filter(Boolean);
    return { orders: parsed, error: null };
  } catch (e) { return { orders: null, error: e.message }; }
}

async function insertOrder(order) {
  try { await sbFetch('orders', { method: 'POST', body: JSON.stringify({ order_id: order.id, data: JSON.stringify(order) }) }); return true; }
  catch { return false; }
}

async function updateOrderRemote(order) {
  try { await sbFetch(`orders?order_id=eq.${encodeURIComponent(order.id)}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ data: JSON.stringify(order) }) }); }
  catch {}
}

function genId() { return 'o' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
function genNum() { return Math.floor(1000 + Math.random() * 9000); }

// ─── Menu Data ───────────────────────────────────────────────────────────────
// Placeholder gradient colors used until real photos are added
const CAT_COLORS = {
  hot: 'linear-gradient(135deg,#5C3D2E,#A0522D)',
  cold: 'linear-gradient(135deg,#1a3a5c,#2980b9)',
  sandwich: 'linear-gradient(135deg,#4a3728,#8B6914)',
  salad: 'linear-gradient(135deg,#1a4a2e,#27ae60)',
  breakfast: 'linear-gradient(135deg,#4a3000,#d4a017)',
  pizza: 'linear-gradient(135deg,#5c1a1a,#c0392b)',
  pasta: 'linear-gradient(135deg,#3a2a1a,#e67e22)',
  tortilla: 'linear-gradient(135deg,#2a3a1a,#7f8c3d)',
  burger: 'linear-gradient(135deg,#3a1a00,#e74c3c)',
  meal: 'linear-gradient(135deg,#1a2a3a,#2471a3)',
  dessert: 'linear-gradient(135deg,#3a1a3a,#8e44ad)',
  bakery: 'linear-gradient(135deg,#3a2a1a,#ca8a04)',
};

const CATEGORIES = [
  {
    id: 'hot', nameAr: 'مشروبات ساخنة', nameHe: 'משקאות חמים', emoji: '☕',
    items: [
      { id: 'hd1', nameAr: 'اسبرسو', nameHe: 'אספרסו', price: 7 },
      { id: 'hd2', nameAr: 'هفوך / نسكافيه', nameHe: 'הפוך / נסקפה', descAr: 'صغير ١٠ / كبير ١٤', descHe: 'קטן ₪10 / גדול ₪14', price: 10 },
      { id: 'hd3', nameAr: 'ماكياتو', nameHe: 'מקיאטו', price: 9 },
      { id: 'hd4', nameAr: 'شاي', nameHe: 'תה', price: 8 },
      { id: 'hd5', nameAr: 'قهوة تركية', nameHe: 'קפה טורקי', price: 9 },
      { id: 'hd6', nameAr: 'أمريكانو', nameHe: 'אמריקנו', price: 11 },
      { id: 'hd7', nameAr: 'شوكو', nameHe: 'שוקו', descAr: 'صغير ١٠ / كبير ١٤', descHe: 'קטן ₪10 / גדול ₪14', price: 10 },
      { id: 'hd8', nameAr: 'شوكولاتة ساخنة', nameHe: 'שוקולד חם', price: 20 },
      { id: 'hd9', nameAr: 'سحلب', nameHe: 'סחלב', descAr: 'صغير ١٥ / كبير ٢٠', descHe: 'קטן ₪15 / גדול ₪20', price: 15 },
      { id: 'hd10', nameAr: 'ماتشا', nameHe: 'מאצ׳ה', price: 20 },
      { id: 'hd11', nameAr: 'تشاي لاتيه', nameHe: 'צ׳אי לאטה', descAr: 'صغير ١٠ / كبير ١٤', descHe: 'קטן ₪10 / גדול ₪14', price: 10 },
      { id: 'hd12', nameAr: 'سبانيش لاتيه', nameHe: 'ספניש לאטה', price: 18 },
    ]
  },
  {
    id: 'cold', nameAr: 'مشروبات باردة', nameHe: 'משקאות קרים', emoji: '🧃',
    items: [
      { id: 'cd1', nameAr: 'عصائر طبيعية', nameHe: 'מיצים טבעיים', descAr: 'برتقال، جزر، رمان، شمندر، زنجبيل', price: 20 },
      { id: 'cd2', nameAr: 'ليمونادا', nameHe: 'לימונדה', price: 20 },
      { id: 'cd3', nameAr: 'ليمون نعنع', nameHe: 'לימון נענע', price: 20 },
      { id: 'cd4', nameAr: 'موهيتو', nameHe: 'מוחיטו', price: 23 },
      { id: 'cd5', nameAr: 'آيس تي بابلز (خوخ)', nameHe: 'איס טי בבלס', price: 23 },
      { id: 'cd6', nameAr: 'آيس كافيه', nameHe: 'איס קפה', price: 20 },
      { id: 'cd7', nameAr: 'آيس كوكيز', nameHe: 'איס קוקיז', price: 20 },
      { id: 'cd8', nameAr: 'آيس كافيه دايت', nameHe: 'איס קפה דיאט', price: 23 },
      { id: 'cd9', nameAr: 'ميلك شيك', nameHe: 'מילקשייק', descAr: 'كيندر، نوتيلا، أوريو، لوتوس، بستاشيو', price: 30 },
      { id: 'cd10', nameAr: 'كوكتيل / سموثي', nameHe: 'קוקטייל / סמות׳י', price: 25 },
      { id: 'cd11', nameAr: 'آيس لاتيه', nameHe: 'איס לאטה', price: 23 },
      { id: 'cd12', nameAr: 'ماتشا لاتيه', nameHe: 'מאצ׳ה לאטה', price: 25 },
      { id: 'cd13', nameAr: 'تروبيكال كلاود', nameHe: 'טרופיקל קלאוד', price: 32 },
    ]
  },
  {
    id: 'sandwich', nameAr: 'ساندويتش', nameHe: 'סנדוויצ׳', emoji: '🥪',
    items: [
      { id: 'sw1', nameAr: 'ساندويتش أبوكادو', nameHe: 'סנדוויץ׳ אבוקדו', descAr: 'أبوكادو، خس، بندورة، مخلل', price: 30 },
      { id: 'sw2', nameAr: 'ساندويتش طونا', nameHe: 'סנדוויץ׳ טונה', descAr: 'طونا، خس، بندورة، مخلل خيار، صلصة فرش', price: 30 },
      { id: 'sw3', nameAr: 'ساندويتش كابريزا', nameHe: 'סנדוויץ׳ קפרזה', descAr: 'موتساريلا، جبنة كريمية، خس، بندورة، بيستو، خل بلسامي', price: 38 },
      { id: 'sw4', nameAr: 'ساندويتش بيض مخفوق', nameHe: 'סנדוויץ׳ ביצה מקושקשת', descAr: 'عجة بيض، جبنة كريمية، خس، بندورة، مخلل خيار', price: 30 },
      { id: 'sw5', nameAr: 'جبنة بلغارية', nameHe: 'גבינה בולגרית', descAr: 'جبنة كريمية، خس، بندورة، مخلل، خيار، جبنة بلغارية', price: 38 },
      { id: 'sw6', nameAr: 'ميني ساندويتش', nameHe: 'מיני סנדוויץ׳', descAr: 'كابريزا، أبوكادو، طونا، حلومي، عجة بيض، بلغارية', price: 18 },
      { id: 'sw7', nameAr: 'ساندويتش صدر دجاج', nameHe: 'סנדוויץ׳ חזה עוף', descAr: 'أبوكادو، خس، بندورة، صدر دجاج مشوي، مخلل خيار، صلصة فرش', price: 49 },
      { id: 'sw8', nameAr: 'ساندويتش حلومي', nameHe: 'סנדוויץ׳ חלומי', descAr: 'حلومي مشوية، جبنة كريمية، خس، بندورة، مخلل خيار', price: 38 },
      { id: 'sw9', nameAr: 'كرواسون ساندويتش', nameHe: 'קרואסון סנדוויץ׳', price: 35 },
      { id: 'sw10', nameAr: 'ساندويتش سالمون مدخن', nameHe: 'סנדוויץ׳ סלמון מעושן', price: 45 },
    ]
  },
  {
    id: 'salad', nameAr: 'سلطات', nameHe: 'סלטים', emoji: '🥗',
    items: [
      { id: 'sl1', nameAr: 'سلطة طونا', nameHe: 'סלט טונה', price: 38 },
      { id: 'sl2', nameAr: 'سلطة فتوش', nameHe: 'סלט פתוש', price: 38 },
      { id: 'sl3', nameAr: 'سلطة فرش كافيه', nameHe: 'סלט פרש קפה', price: 38 },
      { id: 'sl4', nameAr: 'سلطة قيصر', nameHe: 'סלט קיסר', price: 38 },
      { id: 'sl5', nameAr: 'سلطة صدر دجاج', nameHe: 'סלט חזה עוף', price: 49 },
      { id: 'sl6', nameAr: 'سلطة يونانية', nameHe: 'סלט יווני', price: 38 },
      { id: 'sl7', nameAr: 'سلطة باستا', nameHe: 'סלט פסטה', price: 38 },
      { id: 'sl8', nameAr: 'تبولة', nameHe: 'טאבולה', price: 35 },
      { id: 'sl9', nameAr: 'سلطة حلومي', nameHe: 'סלט חלומי', price: 38 },
      { id: 'sl10', nameAr: 'سلطة كينوا', nameHe: 'סלט קינואה', price: 38 },
      { id: 'sl11', nameAr: 'سلطة بتركيب شخصي', nameHe: 'סלט בהרכב אישי', price: 35 },
    ]
  },
  {
    id: 'breakfast', nameAr: 'وجبات فطور', nameHe: 'ארוחות בוקר', emoji: '🍳',
    items: [
      { id: 'bf1', nameAr: 'وجبة فطور شخصية', nameHe: 'ארוחת בוקר אישית', descAr: 'عجة + ٣ إضافات + سلطة شخصية + خبز + هفوخ/عصير صغير', price: 65 },
      { id: 'bf2', nameAr: 'وجبة فطور زوجية', nameHe: 'ארוחת בוקר זוגית', descAr: 'حبيتتان + ٦ إضافات + ٢ سلطة + خبز + ٢ هفوخ/عصير', price: 130 },
      { id: 'bf3', nameAr: 'شكشوكة', nameHe: 'שקשוקה', descAr: 'شكشوكة ٢ بيض + سلطة شخصية + خبز البيت', price: 65 },
    ]
  },
  {
    id: 'toast', nameAr: 'توست', nameHe: 'טוסט', emoji: '🍞',
    items: [
      { id: 'ts1', nameAr: 'بيجل توست', nameHe: 'בייגל טוסט', price: 30 },
      { id: 'ts2', nameAr: 'توست جيبيتا بذور / بدون طحين', nameHe: 'טוסט ג׳יבטה זרעים / ללא גלוטן', descAr: 'إضافات بدفع: بيض ٥، أبوكادو ٤، طونا ٣، جبنة بلغارية ٤، موتساريلا ٤، فطر ٣، سلطة شخصية ١٥', price: 40 },
    ]
  },
  {
    id: 'pizza', nameAr: 'بيتسا وفوكاتشا', nameHe: 'פיצה ופוקאצ׳ה', emoji: '🍕',
    items: [
      { id: 'pz1', nameAr: 'بيتسا مرجريتا', nameHe: 'פיצה מרגריטה', price: 49 },
      { id: 'pz2', nameAr: 'بيتسا أجبان', nameHe: 'פיצה גבינות', descAr: 'جبنة فريسكا، موتساريلا، بارميجان', price: 56 },
      { id: 'pz3', nameAr: 'بيتسا بوراتا', nameHe: 'פיצה בוראטה', price: 65 },
      { id: 'pz4', nameAr: 'بيتسا بيستو', nameHe: 'פיצה פסטו', descAr: 'بيستو، ريحان، جبنة موتساريلا', price: 49 },
      { id: 'pz5', nameAr: 'فوكاتشا', nameHe: 'פוקאצ׳ה', price: 25 },
      { id: 'pz6', nameAr: 'فوكاتشا ٣ أجبان', nameHe: 'פוקאצ׳ה 3 גבינות', price: 35 },
      { id: 'pz7', nameAr: 'صفيحة زعتر', nameHe: 'ספיחה זעתר', price: 25 },
    ]
  },
  {
    id: 'pasta', nameAr: 'باستا', nameHe: 'פסטה', emoji: '🍝',
    items: [
      { id: 'ps1', nameAr: 'رافيولي بطاطا حلوة', nameHe: 'ראביולי בטטה', price: 55 },
      { id: 'ps2', nameAr: 'رافيولي جبنة', nameHe: 'ראביולי גבינה', price: 55 },
      { id: 'ps3', nameAr: 'باستا بيني', nameHe: 'פסטה פנה', price: 50 },
      { id: 'ps4', nameAr: 'سباجيتي بولونيز', nameHe: 'ספגטי בולונז', price: 60 },
      { id: 'ps5', nameAr: 'نودلز', nameHe: 'נודלס', price: 50 },
      { id: 'ps6', nameAr: 'باستا بكريما الفطر', nameHe: 'פסטה קרם פטריות', price: 50 },
      { id: 'ps7', nameAr: 'فتوشيني', nameHe: 'פטוצ׳יני', price: 50 },
    ]
  },
  {
    id: 'tortilla', nameAr: 'تورتيا', nameHe: 'טורטייה', emoji: '🌯',
    items: [
      { id: 'tr1', nameAr: 'تورتيا صدر دجاج', nameHe: 'טורטייה חזה עוף', price: 40 },
      { id: 'tr2', nameAr: 'تورتيا شنيتسل', nameHe: 'טורטייה שניצל', price: 40 },
      { id: 'tr3', nameAr: 'تورتيا كريسبي', nameHe: 'טורטייה קריספי', price: 40 },
      { id: 'tr4', nameAr: 'تورتيا كباب', nameHe: 'טורטייה קבב', price: 48 },
      { id: 'tr5', nameAr: 'تورتيا انتريكوت', nameHe: 'טורטייה אנטריקוט', price: 50 },
    ]
  },
  {
    id: 'burger', nameAr: 'برغر', nameHe: 'המבורגר', emoji: '🍔',
    items: [
      { id: 'bg1', nameAr: 'همبرغر كلاسيك', nameHe: 'המבורגר קלאסי', descAr: 'شطيرة ٢٠٠غم، خس، بندورة، مخلل، بصل', price: 50 },
      { id: 'bg2', nameAr: 'برغر بدون جلوتين', nameHe: 'המבורגר ללא גלוטן', price: 58 },
      { id: 'bg3', nameAr: 'برغر كريسبي', nameHe: 'המבורגר קריספי', price: 45 },
      { id: 'bg4', nameAr: 'برغر شنيتسل', nameHe: 'המבורגר שניצל', price: 45 },
    ]
  },
  {
    id: 'meal', nameAr: 'وجبات', nameHe: 'ארוחות', emoji: '🍽️',
    items: [
      { id: 'ml1', nameAr: 'وجبة صدر دجاج', nameHe: 'ארוחת חזה עוף', descAr: 'مع رز أو بيوريه', price: 56 },
      { id: 'ml2', nameAr: 'وجبة صدر دجاج مع كريما وفطر', nameHe: 'ארוחת חזה עוף קרם פטריות', descAr: 'مع رز أو بيوريه', price: 65 },
      { id: 'ml3', nameAr: 'وجبة سالمون', nameHe: 'ארוחת סלמון', price: 90 },
      { id: 'ml4', nameAr: 'وجبة شريمبس', nameHe: 'ארוחת שרימפס', price: 90 },
    ]
  },
  {
    id: 'dessert', nameAr: 'تحليات', nameHe: 'קינוחים', emoji: '🍰',
    items: [
      { id: 'ds1', nameAr: 'كعكة جبنة', nameHe: 'עוגת גבינה', price: 35 },
      { id: 'ds2', nameAr: 'كهكة بسكوت', nameHe: 'עוגת ביסקוויט', price: 35 },
      { id: 'ds3', nameAr: 'سوفليه', nameHe: 'סופלה', price: 30 },
      { id: 'ds4', nameAr: 'الفخورس', nameHe: 'הפוכרוס', price: 35 },
      { id: 'ds5', nameAr: 'كعكة جبنة بدون سكر', nameHe: 'עוגת גבינה ללא סוכר', price: 35 },
      { id: 'ds6', nameAr: 'شوكولاتة بدون سكر', nameHe: 'שוקולד ללא סוכר', price: 35 },
      { id: 'ds7', nameAr: 'فشافيش ٦ قطع', nameHe: 'פשפשים 6 יח׳', price: 15 },
      { id: 'ds8', nameAr: 'بافل بلجيكي', nameHe: 'וופל בלגי', price: 40 },
      { id: 'ds9', nameAr: 'فرش ديزيرت', nameHe: 'פרש דזרט', price: 35 },
      { id: 'ds10', nameAr: 'كريب', nameHe: 'קרפ', price: 30 },
      { id: 'ds11', nameAr: 'بانكيك / إضافة بروتين', nameHe: 'פנקייק / תוספת חלבון', price: 35 },
      { id: 'ds12', nameAr: 'كريم بروليه', nameHe: 'קרם ברולה', price: 35 },
      { id: 'ds13', nameAr: 'ام علي', nameHe: 'אום עלי', price: 35 },
      { id: 'ds14', nameAr: 'كراك باي', nameHe: 'קראק פאי', price: 35 },
      { id: 'ds15', nameAr: 'كوكي سكوب', nameHe: 'קוקי סקופ', price: 35 },
      { id: 'ds16', nameAr: 'كوكي كيندر', nameHe: 'קוקי קינדר', price: 35 },
      { id: 'ds17', nameAr: 'شوكولاتة بلجيكية بدون طحين', nameHe: 'שוקולד בלגי ללא קמח', price: 35 },
      { id: 'ds18', nameAr: 'اوريو', nameHe: 'אוריאו', price: 35 },
      { id: 'ds19', nameAr: 'سان سباستيان', nameHe: 'סן סבסטיאן', price: 40 },
      { id: 'ds20', nameAr: 'تيراميسو', nameHe: 'טירמיסו', price: 38 },
    ]
  },
  {
    id: 'bakery', nameAr: 'مخبوزات', nameHe: 'מאפים', emoji: '🥐',
    items: [
      { id: 'bk1', nameAr: 'دنيش فانيل شوكولاتة', nameHe: 'דניש וניל שוקולד', price: 20 },
      { id: 'bk2', nameAr: 'دنيش فانيل زبيب', nameHe: 'דניש וניל צימוקים', price: 18 },
      { id: 'bk3', nameAr: 'كرواسون لوز', nameHe: 'קרואסון שקדים', price: 18 },
      { id: 'bk4', nameAr: 'كرواسون زبدة', nameHe: 'קרואסון חמאה', price: 14 },
      { id: 'bk5', nameAr: 'كرواسون شوكولاتة', nameHe: 'קרואסון שוקולד', price: 15 },
      { id: 'bk6', nameAr: 'دنيش قرفة', nameHe: 'דניש קינמון', price: 18 },
    ]
  },
];

// ─── Translations ─────────────────────────────────────────────────────────────
const T = {
  ar: {
    dir: 'rtl', shekel: '₪', table: 'طاولة', search: 'ابحث في القائمة...',
    addToCart: 'أضف للسلة', cart: 'السلة', total: 'المجموع', order: 'اطلب الآن',
    payAtCounter: 'ادفع عند الكاشير', payByCard: 'دفع بالبطاقة (تجريبي)',
    orderPlaced: 'تم إرسال طلبك!', trackOrder: 'تتبع الطلب',
    newOrder: 'طلب جديد', myOrders: 'طلباتي', viewOrders: 'عرض طلباتي',
    statusNew: 'جديد', statusPreparing: 'قيد التحضير', statusReady: 'جاهز', statusDone: 'تم',
    notes: 'ملاحظات...', qty: 'الكمية', emptyCart: 'السلة فارغة',
    enterTable: 'أدخل رقم الطاولة', startOrder: 'ابدأ الطلب', tablePlaceholder: 'مثال: 5',
    kitchen: 'لوحة المطبخ', kitchenSub: 'الطلبات الواردة مباشرة',
    new: 'جديد', preparing: 'قيد التحضير', ready: 'جاهز',
    startPrep: 'بدء التحضير', markReady: 'جاهز', done: 'تم',
    unpaid: 'لم يُدفع بعد', noOrders: 'لا توجد طلبات',
    connectionError: 'لا يوجد اتصال بقاعدة البيانات',
    orderNum: 'رقم الطلب', welcome: 'مرحباً بكم',
    tagline: 'أكل صحي وطازج يُقدَّم بحب 🌿',
    orderNow: '🍽 اطلب الآن', trackMyOrder: '📋 تتبع طلبي',
    switchToCustomer: 'عرض الزبون', printBtn: 'طباعة',
  },
  he: {
    dir: 'rtl', shekel: '₪', table: 'שולחן', search: 'חיפוש בתפריט...',
    addToCart: 'הוסף לסל', cart: 'סל', total: 'סה״כ', order: 'הזמן עכשיו',
    payAtCounter: 'תשלום בקופה', payByCard: 'תשלום בכרטיס (ניסיון)',
    orderPlaced: 'ההזמנה נשלחה!', trackOrder: 'עקוב אחר ההזמנה',
    newOrder: 'הזמנה חדשה', myOrders: 'ההזמנות שלי', viewOrders: 'הזמנות שלי',
    statusNew: 'חדש', statusPreparing: 'בהכנה', statusReady: 'מוכן', statusDone: 'הושלם',
    notes: 'הערות...', qty: 'כמות', emptyCart: 'הסל ריק',
    enterTable: 'הזינו מספר שולחן', startOrder: 'התחל הזמנה', tablePlaceholder: 'לדוגמה: 5',
    kitchen: 'לוח מטבח', kitchenSub: 'הזמנות בזמן אמת',
    new: 'חדש', preparing: 'בהכנה', ready: 'מוכן',
    startPrep: 'התחל הכנה', markReady: 'מוכן', done: 'הושלם',
    unpaid: 'טרם שולם', noOrders: 'אין הזמנות',
    connectionError: 'אין חיבור למסד הנתונים',
    orderNum: 'מספר הזמנה', welcome: 'ברוכים הבאים',
    tagline: 'אוכל טרי ובריא מוגש באהבה 🌿',
    orderNow: '🍽 הזמן עכשיו', trackMyOrder: '📋 עקוב אחר ההזמנה',
    switchToCustomer: 'תצוגת לקוח', printBtn: 'הדפס',
  }
};

// ─── Global styles ─────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
  body { background: #111; font-family: 'Tajawal', sans-serif; }
  ::-webkit-scrollbar { display: none; }
  input, button, textarea { font-family: inherit; }
  .fade-in { animation: fadeIn 0.3s ease; }
  @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  .slide-up { animation: slideUp 0.35s cubic-bezier(.16,1,.3,1); }
  @keyframes slideUp { from { transform:translateY(100%); } to { transform:translateY(0); } }
  @media print { .no-print { display:none!important; } }
`;

// ─── Root App ───────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState('loading');
  const [lang, setLang] = useState('ar');
  const [orders, setOrders] = useState([]);
  const [dbError, setDbError] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => {
    const hash = window.location.hash || '';
    setView(hash.includes('kitchen') ? 'kitchen' : 'customer');
    const sync = async () => {
      const { orders: o, error } = await fetchOrders();
      if (error) setDbError(error);
      else { setDbError(null); setOrders(o); }
    };
    sync();
    pollRef.current = setInterval(sync, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, []);

  const addOrder = useCallback(order => {
    setOrders(prev => [...prev, order]);
    insertOrder(order);
  }, []);

  const updateOrder = useCallback((id, updates) => {
    setOrders(prev => {
      const next = prev.map(o => o.id === id ? { ...o, ...updates } : o);
      const updated = next.find(o => o.id === id);
      if (updated) updateOrderRemote(updated);
      return next;
    });
  }, []);

  if (view === 'loading') return <div style={{ minHeight: '100vh', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 40, height: 40, border: '3px solid #333', borderTop: '3px solid #C9A24B', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;
  if (view === 'kitchen') return <KitchenApp lang={lang} setLang={setLang} orders={orders} updateOrder={updateOrder} dbError={dbError} goCustomer={() => { window.location.hash = ''; setView('customer'); }} />;
  return <CustomerApp lang={lang} setLang={setLang} orders={orders} addOrder={addOrder} goKitchen={() => { window.location.hash = 'kitchen'; setView('kitchen'); }} />;
}

// ─── Customer App ────────────────────────────────────────────────────────────
function CustomerApp({ lang, setLang, orders, addOrder, goKitchen }) {
  const t = T[lang];
  const [screen, setScreen] = useState('splash');
  const [table, setTable] = useState(null);
  const [cart, setCart] = useState([]);
  const [activeItem, setActiveItem] = useState(null);
  const [sessionOrderIds, setSessionOrderIds] = useState([]);
  const [lastOrderData, setLastOrderData] = useState(null);

  const addSessionOrderId = id => {
    setSessionOrderIds(prev => {
      const next = [...prev, id];
      try { localStorage.setItem('fc_orderIds', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  useEffect(() => {
    const hash = window.location.hash || '';
    const m = hash.match(/table=(\d+)/);
    if (m) { setTable(parseInt(m[1])); setScreen('menu'); }
    try {
      const saved = localStorage.getItem('fc_orderIds');
      if (saved) setSessionOrderIds(JSON.parse(saved));
    } catch {}
  }, []);

  const trackedOrders = sessionOrderIds.map(id => orders.find(o => o.id === id)).filter(Boolean);
  const trackedFull = trackedOrders.length > 0 ? trackedOrders : (lastOrderData ? [lastOrderData] : []);
  const hasActive = trackedFull.some(o => o.status !== 'done');

  const cartTotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  const addToCart = item => {
    setCart(prev => {
      const ex = prev.find(c => c.id === item.id);
      if (ex) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const removeFromCart = id => setCart(prev => prev.map(c => c.id === id ? { ...c, qty: c.qty - 1 } : c).filter(c => c.qty > 0));

  const placeOrder = () => {
    const orderId = genId();
    const order = {
      id: orderId, number: genNum(), table, items: cart,
      total: cartTotal, status: 'new', paid: false, createdAt: Date.now()
    };
    addOrder(order);
    addSessionOrderId(orderId);
    setLastOrderData(order);
    setCart([]);
    setScreen('confirmed');
  };

  return (
    <div dir={t.dir} style={{ minHeight: '100vh', background: '#111', color: '#F0EAD6', fontFamily: "'Tajawal', sans-serif" }}>
      <style>{GLOBAL_CSS}</style>

      {screen === 'splash' && <SplashScreen t={t} lang={lang} setLang={setLang} onEnter={() => setScreen('tablepicker')} onTrack={hasActive ? () => setScreen('tracking') : null} />}
      {screen === 'tablepicker' && <TablePicker t={t} lang={lang} onPick={n => { setTable(n); setScreen('menu'); }} onBack={() => setScreen('splash')} />}
      {screen === 'menu' && (
        <MenuScreen t={t} lang={lang} setLang={setLang} table={table}
          cart={cart} cartCount={cartCount} cartTotal={cartTotal}
          hasActive={hasActive} trackedFull={trackedFull}
          onItemTap={item => { setActiveItem(item); setScreen('item'); }}
          onCartTap={() => setScreen('cart')}
          onTrackTap={() => setScreen('tracking')}
        />
      )}
      {screen === 'item' && activeItem && (
        <ItemSheet t={t} lang={lang} item={activeItem} cart={cart}
          onAdd={() => { addToCart(activeItem); setScreen('menu'); }}
          onClose={() => setScreen('menu')}
        />
      )}
      {screen === 'cart' && (
        <CartScreen t={t} lang={lang} cart={cart} total={cartTotal}
          onAdd={addToCart} onRemove={removeFromCart}
          onBack={() => setScreen('menu')}
          onPlace={placeOrder}
        />
      )}
      {screen === 'confirmed' && lastOrderData && (
        <ConfirmedScreen t={t} order={lastOrderData} table={table}
          onTrack={() => setScreen('tracking')}
          onMenu={() => setScreen('menu')}
        />
      )}
      {screen === 'tracking' && trackedFull.length > 0 && (
        <TrackingScreen t={t} lang={lang} orders={trackedFull} onMenu={() => setScreen('menu')} />
      )}
    </div>
  );
}

// ─── Splash Screen ────────────────────────────────────────────────────────────
function SplashScreen({ t, lang, setLang, onEnter, onTrack }) {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#1a1208 0%,#111 60%)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 0 40px' }}>
      {/* Hero */}
      <div style={{ width: '100%', height: 260, background: 'linear-gradient(160deg,#1f1609 0%,#0e0b06 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #2a2010', position: 'relative' }}>
        <div style={{ fontSize: 64, marginBottom: 8 }}>☕</div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#C9A24B', letterSpacing: 1, textAlign: 'center' }}>Fresh Cafe' & Market</h1>
        <p style={{ color: '#857C6C', fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', marginTop: 4 }}>كفر قاسم · כפר קאסם</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 16, alignItems: 'center' }}>
          <div style={{ width: 30, height: 1, background: 'linear-gradient(to right,transparent,#C9A24B)' }} />
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#C9A24B' }} />
          <div style={{ width: 30, height: 1, background: 'linear-gradient(to left,transparent,#C9A24B)' }} />
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '28px 24px', textAlign: 'center' }}>
        <p style={{ color: '#9B9384', fontSize: 15, lineHeight: 2, maxWidth: 300 }}>{t.tagline}</p>
        <p style={{ color: '#5a5449', fontSize: 12, marginTop: 12 }}>📍 عمر بن الخطاب 28، كفر قاسم · 039072628</p>
      </div>

      {/* Actions */}
      <div style={{ width: '100%', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
          {['ar', 'he'].map(l => (
            <button key={l} onClick={() => setLang(l)} style={{
              padding: '7px 20px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
              background: lang === l ? '#C9A24B' : '#1f1a12', color: lang === l ? '#111' : '#857C6C',
            }}>{l === 'ar' ? 'العربية' : 'עברית'}</button>
          ))}
        </div>
        <button onClick={onEnter} style={{ width: '100%', maxWidth: 360, padding: 18, borderRadius: 16, background: '#C9A24B', color: '#111', fontWeight: 900, fontSize: 18, border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(201,162,75,0.35)' }}>
          {t.orderNow}
        </button>
        {onTrack && (
          <button onClick={onTrack} style={{ width: '100%', maxWidth: 360, padding: 14, borderRadius: 16, background: 'transparent', color: '#C9A24B', fontWeight: 700, fontSize: 15, border: '1.5px solid #2a2010', cursor: 'pointer' }}>
            {t.trackMyOrder}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Table Picker ─────────────────────────────────────────────────────────────
function TablePicker({ t, lang, onPick, onBack }) {
  const [val, setVal] = useState('');
  const num = parseInt(val);
  const valid = val.trim() !== '' && Number.isInteger(num) && num > 0;
  return (
    <div style={{ minHeight: '100vh', background: '#111', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px 40px' }}>
      <button onClick={onBack} style={{ position: 'absolute', top: 20, [lang === 'ar' ? 'right' : 'left']: 20, background: 'none', border: 'none', color: '#C9A24B', cursor: 'pointer', fontSize: 24 }}>←</button>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🪑</div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#F0EAD6', marginBottom: 8 }}>{t.enterTable}</h2>
      <input type="number" inputMode="numeric" min="1" value={val} onChange={e => setVal(e.target.value)}
        placeholder={t.tablePlaceholder}
        style={{ width: '100%', maxWidth: 320, padding: 20, borderRadius: 16, textAlign: 'center', fontSize: 36, fontWeight: 800, color: '#C9A24B', background: '#1a1a1a', border: '2px solid #2a2a2a', marginTop: 24, outline: 'none' }}
      />
      <button disabled={!valid} onClick={() => onPick(num)} style={{
        marginTop: 20, width: '100%', maxWidth: 320, padding: 18, borderRadius: 16,
        background: valid ? '#C9A24B' : '#222', color: valid ? '#111' : '#555',
        fontWeight: 900, fontSize: 18, border: 'none', cursor: valid ? 'pointer' : 'not-allowed',
      }}>{t.startOrder}</button>
    </div>
  );
}

// ─── Menu Screen (Wolt-style) ─────────────────────────────────────────────────
function MenuScreen({ t, lang, setLang, table, cart, cartCount, cartTotal, hasActive, trackedFull, onItemTap, onCartTap, onTrackTap }) {
  const [activeCat, setActiveCat] = useState(CATEGORIES[0].id);
  const [search, setSearch] = useState('');
  const catRef = useRef(null);
  const sectionRefs = useRef({});

  const scrollToCategory = id => {
    setActiveCat(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const filteredCats = search.trim()
    ? CATEGORIES.map(c => ({ ...c, items: c.items.filter(i => i.nameAr.includes(search) || i.nameHe.includes(search)) })).filter(c => c.items.length > 0)
    : CATEGORIES;

  return (
    <div style={{ minHeight: '100vh', background: '#111', paddingBottom: cartCount > 0 ? 90 : 0 }}>
      {/* Sticky Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: '#111', borderBottom: '1px solid #1e1e1e' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px' }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#F0EAD6' }}>Fresh Cafe' & Market</div>
            <div style={{ fontSize: 12, color: '#857C6C' }}>{t.table} {table}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {hasActive && (
              <button onClick={onTrackTap} style={{ background: 'rgba(201,162,75,0.15)', border: '1px solid #C9A24B', color: '#C9A24B', borderRadius: 20, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                {trackedFull.length > 1 ? `${trackedFull.length} طلبات` : `#${trackedFull[0]?.number}`} ↗
              </button>
            )}
            <button onClick={() => setLang(l => l === 'ar' ? 'he' : 'ar')} style={{ background: '#1e1e1e', border: 'none', color: '#857C6C', borderRadius: 20, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>
              {lang === 'ar' ? 'עב' : 'عر'}
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: '0 16px 10px', position: 'relative' }}>
          <Search size={16} color="#555" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', [lang === 'ar' ? 'right' : 'left']: 28 }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.search}
            style={{ width: '100%', padding: '11px 42px', borderRadius: 12, background: '#1a1a1a', border: '1px solid #222', color: '#F0EAD6', fontSize: 14, outline: 'none', direction: 'rtl' }}
          />
        </div>

        {/* Category tabs */}
        {!search && (
          <div ref={catRef} style={{ display: 'flex', gap: 8, padding: '0 16px 12px', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {CATEGORIES.map(c => (
              <button key={c.id} onClick={() => scrollToCategory(c.id)} style={{
                flexShrink: 0, padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none', whiteSpace: 'nowrap',
                background: activeCat === c.id ? '#C9A24B' : '#1e1e1e',
                color: activeCat === c.id ? '#111' : '#9B9384',
              }}>
                {c.emoji} {lang === 'ar' ? c.nameAr : c.nameHe}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Menu Sections */}
      <div style={{ padding: '8px 0' }}>
        {filteredCats.map(cat => (
          <div key={cat.id} ref={el => sectionRefs.current[cat.id] = el} style={{ marginBottom: 8 }}>
            {/* Category header */}
            <div style={{ padding: '16px 16px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>{cat.emoji}</span>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#F0EAD6' }}>{lang === 'ar' ? cat.nameAr : cat.nameHe}</h2>
            </div>

            {/* Items grid — 2 columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 12px' }}>
              {cat.items.map(item => {
                const inCart = cart.find(c => c.id === item.id);
                return (
                  <button key={item.id} onClick={() => onItemTap(item)} style={{
                    background: '#1a1a1a', border: inCart ? '2px solid #C9A24B' : '2px solid transparent',
                    borderRadius: 14, overflow: 'hidden', cursor: 'pointer', textAlign: lang === 'ar' ? 'right' : 'left',
                    position: 'relative', transition: 'border-color 0.2s',
                  }}>
                    {/* Photo placeholder */}
                    <div style={{
                      width: '100%', height: 120,
                      background: CAT_COLORS[cat.id] || 'linear-gradient(135deg,#1a1a1a,#2a2a2a)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36
                    }}>
                      {/* Photo will go here */}
                      {cat.emoji}
                    </div>

                    {/* Info */}
                    <div style={{ padding: '10px 10px 12px' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#F0EAD6', lineHeight: 1.3, marginBottom: 4 }}>
                        {lang === 'ar' ? item.nameAr : item.nameHe}
                      </div>
                      {(item.descAr || item.descHe) && (
                        <div style={{ fontSize: 11, color: '#6b6457', marginBottom: 6, lineHeight: 1.4 }}>
                          {lang === 'ar' ? item.descAr : item.descHe}
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: '#C9A24B' }}>₪{item.price}</span>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%', background: inCart ? '#C9A24B' : '#252525',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          <Plus size={14} color={inCart ? '#111' : '#857C6C'} />
                        </div>
                      </div>
                    </div>

                    {inCart && (
                      <div style={{ position: 'absolute', top: 8, [lang === 'ar' ? 'left' : 'right']: 8, background: '#C9A24B', color: '#111', borderRadius: 10, padding: '2px 7px', fontSize: 11, fontWeight: 800 }}>
                        {inCart.qty}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Cart FAB */}
      {cartCount > 0 && (
        <button onClick={onCartTap} style={{
          position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          background: '#C9A24B', color: '#111', borderRadius: 50, padding: '14px 28px',
          display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, fontSize: 15,
          border: 'none', cursor: 'pointer', boxShadow: '0 4px 24px rgba(201,162,75,0.4)',
          minWidth: 200, justifyContent: 'space-between', zIndex: 100
        }}>
          <span style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 20, padding: '2px 10px', fontSize: 13 }}>{cartCount}</span>
          <span>{t.cart}</span>
          <span>₪{cartTotal}</span>
        </button>
      )}
    </div>
  );
}

// ─── Item Sheet ────────────────────────────────────────────────────────────────
function ItemSheet({ t, lang, item, cart, onAdd, onClose }) {
  const inCart = cart.find(c => c.id === item.id);
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ flex: 1, background: 'rgba(0,0,0,0.6)' }} />
      <div className="slide-up" style={{ background: '#1a1a1a', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px' }}>
        {/* Drag handle */}
        <div style={{ width: 40, height: 4, background: '#333', borderRadius: 2, margin: '0 auto 20px' }} />

        {/* Photo placeholder */}
        <div style={{ width: '100%', height: 200, borderRadius: 14, background: CAT_COLORS['dessert'] || '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, marginBottom: 20 }}>
          🍽
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#F0EAD6', marginBottom: 6 }}>{lang === 'ar' ? item.nameAr : item.nameHe}</h2>
        {(item.descAr || item.descHe) && <p style={{ color: '#857C6C', fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>{lang === 'ar' ? item.descAr : item.descHe}</p>}
        <p style={{ fontSize: 22, fontWeight: 900, color: '#C9A24B', marginBottom: 24 }}>₪{item.price}</p>

        <button onClick={onAdd} style={{
          width: '100%', padding: 18, borderRadius: 14, background: '#C9A24B', color: '#111',
          fontWeight: 900, fontSize: 17, border: 'none', cursor: 'pointer',
        }}>
          {t.addToCart} {inCart ? `(${inCart.qty})` : ''}
        </button>
      </div>
    </div>
  );
}

// ─── Cart Screen ──────────────────────────────────────────────────────────────
function CartScreen({ t, lang, cart, total, onAdd, onRemove, onBack, onPlace }) {
  return (
    <div style={{ minHeight: '100vh', background: '#111', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 16px', borderBottom: '1px solid #1e1e1e' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#C9A24B', cursor: 'pointer', fontSize: 22 }}>←</button>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#F0EAD6' }}>{t.cart}</h2>
      </div>

      {/* Items */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#555', padding: 60, fontSize: 15 }}>{t.emptyCart}</div>
        ) : cart.map(item => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: '1px solid #1e1e1e' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#F0EAD6' }}>{lang === 'ar' ? item.nameAr : item.nameHe}</div>
              <div style={{ fontSize: 14, color: '#C9A24B', marginTop: 4 }}>₪{item.price * item.qty}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => onRemove(item.id)} style={{ width: 32, height: 32, borderRadius: '50%', background: '#1e1e1e', border: 'none', color: '#C9A24B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={14} /></button>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#F0EAD6', minWidth: 20, textAlign: 'center' }}>{item.qty}</span>
              <button onClick={() => onAdd(item)} style={{ width: 32, height: 32, borderRadius: '50%', background: '#C9A24B', border: 'none', color: '#111', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      {cart.length > 0 && (
        <div style={{ padding: '16px 16px 32px', borderTop: '1px solid #1e1e1e', background: '#111' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 16, fontWeight: 800, color: '#F0EAD6' }}>
            <span>{t.total}</span><span style={{ color: '#C9A24B' }}>₪{total}</span>
          </div>
          <button onClick={onPlace} style={{ width: '100%', padding: 18, borderRadius: 14, background: '#C9A24B', color: '#111', fontWeight: 900, fontSize: 17, border: 'none', cursor: 'pointer' }}>
            {t.payAtCounter}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Confirmed Screen ─────────────────────────────────────────────────────────
function ConfirmedScreen({ t, order, table, onTrack, onMenu }) {
  return (
    <div style={{ minHeight: '100vh', background: '#111', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 72, marginBottom: 20 }}>✅</div>
      <h2 style={{ fontSize: 26, fontWeight: 900, color: '#C9A24B', marginBottom: 8 }}>{t.orderPlaced}</h2>
      <p style={{ color: '#857C6C', fontSize: 15, marginBottom: 8 }}>{t.table} {table}</p>
      <p style={{ color: '#C9A24B', fontSize: 36, fontWeight: 900, marginBottom: 32 }}>#{order.number}</p>
      <button onClick={onTrack} style={{ width: '100%', maxWidth: 320, padding: 18, borderRadius: 14, background: '#C9A24B', color: '#111', fontWeight: 900, fontSize: 17, border: 'none', cursor: 'pointer', marginBottom: 12 }}>
        {t.trackOrder}
      </button>
      <button onClick={onMenu} style={{ width: '100%', maxWidth: 320, padding: 16, borderRadius: 14, background: 'transparent', color: '#C9A24B', fontWeight: 700, fontSize: 15, border: '1.5px solid #2a2010', cursor: 'pointer' }}>
        {t.newOrder}
      </button>
    </div>
  );
}

// ─── Tracking Screen ──────────────────────────────────────────────────────────
function TrackingScreen({ t, lang, orders, onMenu }) {
  const steps = [
    { key: 'new', label: t.statusNew },
    { key: 'preparing', label: t.statusPreparing },
    { key: 'ready', label: t.statusReady },
    { key: 'done', label: t.statusDone },
  ];
  return (
    <div style={{ minHeight: '100vh', background: '#111', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 16px', borderBottom: '1px solid #1e1e1e' }}>
        <button onClick={onMenu} style={{ background: 'none', border: 'none', color: '#C9A24B', cursor: 'pointer', fontSize: 22 }}>←</button>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#F0EAD6' }}>{t.myOrders}</h2>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {orders.map(order => {
          const idx = Math.max(0, steps.findIndex(s => s.key === order.status));
          return (
            <div key={order.id} style={{ background: '#1a1a1a', borderRadius: 16, padding: 18, border: order.status === 'ready' ? '2px solid #27ae60' : '2px solid #222' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 22, fontWeight: 900, color: '#C9A24B' }}>#{order.number}</span>
                <span style={{
                  borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700,
                  background: order.status === 'ready' ? 'rgba(39,174,96,0.15)' : order.status === 'preparing' ? 'rgba(201,162,75,0.15)' : '#222',
                  color: order.status === 'ready' ? '#27ae60' : order.status === 'preparing' ? '#C9A24B' : '#857C6C',
                }}>{steps.find(s => s.key === order.status)?.label}</span>
              </div>

              {/* Progress */}
              <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginBottom: 20, padding: '0 4px' }}>
                <div style={{ position: 'absolute', top: 12, left: 20, right: 20, height: 2, background: '#2a2a2a' }} />
                <div style={{ position: 'absolute', top: 12, left: 20, height: 2, background: '#C9A24B', width: `${(idx / (steps.length - 1)) * 100}%`, maxWidth: 'calc(100% - 40px)', transition: 'width 0.5s' }} />
                {steps.map((s, i) => (
                  <div key={s.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, zIndex: 2, flex: 1 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: i <= idx ? '#C9A24B' : '#222', border: i <= idx ? 'none' : '2px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {i <= idx && <Check size={12} color="#111" strokeWidth={3} />}
                    </div>
                    <span style={{ fontSize: 9, color: i <= idx ? '#F0EAD6' : '#555', textAlign: 'center' }}>{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Items */}
              {order.items.map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #222', fontSize: 13 }}>
                  <span style={{ color: '#F0EAD6' }}>{c.qty}× {lang === 'ar' ? c.nameAr : c.nameHe}</span>
                  <span style={{ color: '#857C6C' }}>₪{c.price * c.qty}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, fontWeight: 800, color: '#C9A24B', fontSize: 14 }}>
                <span>{t.total}</span><span>₪{order.total}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ padding: '16px 16px 32px' }}>
        <button onClick={onMenu} style={{ width: '100%', padding: 16, borderRadius: 14, background: 'transparent', color: '#C9A24B', fontWeight: 700, fontSize: 15, border: '1.5px solid #2a2010', cursor: 'pointer' }}>
          {t.newOrder}
        </button>
      </div>
    </div>
  );
}

// ─── Kitchen App ──────────────────────────────────────────────────────────────
function KitchenApp({ lang, setLang, orders, updateOrder, dbError, goCustomer }) {
  const t = T[lang];
  const newOrders = orders.filter(o => o.status === 'new');
  const prepOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#0d0d0d', fontFamily: "'Tajawal', sans-serif" }}>
      <style>{GLOBAL_CSS + `@media print{.no-print{display:none!important}}`}</style>

      {/* Kitchen Header */}
      <div className="no-print" style={{ background: '#111', borderBottom: '1px solid #1e1e1e', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#C9A24B' }}>{t.kitchen}</div>
          <div style={{ fontSize: 12, color: '#555' }}>{t.kitchenSub}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setLang(l => l === 'ar' ? 'he' : 'ar')} style={{ background: '#1e1e1e', border: 'none', color: '#857C6C', borderRadius: 20, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>
            {lang === 'ar' ? 'עב' : 'عر'}
          </button>
          <button onClick={goCustomer} style={{ background: '#1e1e1e', border: 'none', color: '#857C6C', borderRadius: 20, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>
            {t.switchToCustomer}
          </button>
        </div>
      </div>

      {/* DB Error */}
      {dbError && (
        <div className="no-print" style={{ background: 'rgba(180,60,40,0.15)', borderBottom: '1px solid #b44', color: '#f87', fontSize: 12, padding: '8px 20px', textAlign: 'center', wordBreak: 'break-word' }}>
          {t.connectionError}: {dbError}
        </div>
      )}

      {/* Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, padding: 12 }}>
        {[
          { label: `🆕 ${t.new}`, orders: newOrders, action: o => updateOrder(o.id, { status: 'preparing' }), actionLabel: t.startPrep, color: '#C9A24B' },
          { label: `👨‍🍳 ${t.preparing}`, orders: prepOrders, action: o => updateOrder(o.id, { status: 'ready' }), actionLabel: t.markReady, color: '#3498db' },
          { label: `✅ ${t.ready}`, orders: readyOrders, action: o => updateOrder(o.id, { status: 'done' }), actionLabel: t.done, color: '#27ae60' },
        ].map(col => (
          <div key={col.label}>
            <div style={{ fontSize: 13, fontWeight: 800, color: col.color, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              {col.label}
              {col.orders.length > 0 && <span style={{ background: col.color, color: '#111', borderRadius: 10, padding: '1px 7px', fontSize: 11 }}>{col.orders.length}</span>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {col.orders.length === 0 && <div style={{ color: '#333', fontSize: 12, textAlign: 'center', padding: 20 }}>{t.noOrders}</div>}
              {col.orders.map(order => (
                <div key={order.id} style={{ background: '#1a1a1a', borderRadius: 12, padding: 12, border: `1.5px solid ${col.color}22` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontWeight: 900, color: col.color, fontSize: 15 }}>#{order.number}</span>
                    <span style={{ fontSize: 11, color: '#555' }}>{t.table} {order.table}</span>
                  </div>
                  {!order.paid && <div style={{ background: 'rgba(201,162,75,0.1)', color: '#C9A24B', borderRadius: 6, padding: '2px 8px', fontSize: 10, marginBottom: 8, display: 'inline-block' }}>{t.unpaid}</div>}
                  {order.items.map(c => (
                    <div key={c.id} style={{ fontSize: 12, color: '#9B9384', padding: '2px 0' }}>{c.qty}× {lang === 'ar' ? c.nameAr : c.nameHe}</div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#555' }}>₪{order.total}</span>
                    <button onClick={() => col.action(order)} style={{ background: col.color, color: '#111', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                      {col.actionLabel}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
