// ─── Language Store ───────────────────────────────────────────────────────────

export type Lang = "en" | "ar";

const LANG_KEY = "sadaqa_lang";

export function getLang(): Lang | null {
  try { return localStorage.getItem(LANG_KEY) as Lang | null; }
  catch { return null; }
}

export function setLang(lang: Lang) {
  try { localStorage.setItem(LANG_KEY, lang); } catch {}
}

// ─── UI Translations ──────────────────────────────────────────────────────────
export const T = {
  en: {
    // Nav
    home: "Home", quran: "Quran", prayer: "Prayer", azkar: "Azkar", settings: "Settings",
    // Home
    nextPrayer: "Next Prayer", in: "in", at: "at", fullSchedule: "Full schedule",
    hideSchedule: "Hide schedule", continueReading: "Continue Reading",
    startReading: "Start Reading", page: "Page", nowAzkar: "Now",
    ayahOfDay: "Ayah of the Day", locationNotSet: "Location not set",
    locationDesc: "Prayer times need your city.",
    setUp: "Set Up",
    // Prayer
    prayerTimes: "Prayer Times", todaySchedule: "Today's Schedule",
    // Settings
    settingsTitle: "Settings", location: "Location", useGPS: "Use My GPS Location",
    orEnterCity: "Or enter city manually:", cityPlaceholder: "e.g. Cairo, Toronto, London…",
    go: "Go", clear: "Clear", calcMethod: "Calculation Method",
    asrCalc: "Asr Calculation", shafi: "Shafi / Maliki / Hanbali", hanafi: "Hanafi",
    savePrefs: "Save Preferences", language: "Language", chooseLanguage: "Choose Language",
    locating: "Locating…", searching: "Searching…", locationSet: "Location set",
    locationCleared: "Location cleared.", calcSaved: "Calculation preferences saved.",
    cityNotFound: "City not found. Try a different spelling.",
    gpsDenied: "Location permission denied. Please enter city manually below.",
    gpsError: "Could not get GPS location. Try entering city manually.",
    // Language picker
    welcomeTitle: "Welcome", welcomeSub: "Choose your language to continue",
    english: "English", arabic: "العربية",
    // Azkar times
    morningAzkar: "Morning Azkar", eveningAzkar: "Evening Azkar",
    sleepAzkar: "Night Azkar", wakingAzkar: "Waking Azkar",
    afterPrayer: "After Prayer", duhaAzkar: "Duha Azkar", afterMaghrib: "After Maghrib",
    morningDesc: "Start your day with remembrance",
    eveningDesc: "Evening remembrance before sunset",
    sleepDesc: "Supplications before sleep",
    wakingDesc: "Remembrance upon waking",
    afterPrayerDesc: "Post-prayer supplications",
    duhaDesc: "The blessed mid-morning remembrance",
    afterMaghribDesc: "Remembrance after the evening prayer",
  },
  ar: {
    // Nav
    home: "الرئيسية", quran: "القرآن", prayer: "الصلاة", azkar: "الأذكار", settings: "الإعدادات",
    // Home
    nextPrayer: "الصلاة القادمة", in: "بعد", at: "في",
    fullSchedule: "جدول كامل", hideSchedule: "إخفاء الجدول",
    continueReading: "متابعة القراءة", startReading: "ابدأ القراءة",
    page: "صفحة", nowAzkar: "الآن", ayahOfDay: "آية اليوم",
    locationNotSet: "الموقع غير محدد",
    locationDesc: "أوقات الصلاة تحتاج إلى مدينتك.",
    setUp: "إعداد",
    // Prayer
    prayerTimes: "أوقات الصلاة", todaySchedule: "جدول اليوم",
    // Settings
    settingsTitle: "الإعدادات", location: "الموقع", useGPS: "استخدام الموقع تلقائياً",
    orEnterCity: "أو أدخل المدينة يدوياً:", cityPlaceholder: "مثال: القاهرة، الرياض، لندن…",
    go: "بحث", clear: "حذف", calcMethod: "طريقة الحساب",
    asrCalc: "حساب العصر", shafi: "شافعي / مالكي / حنبلي", hanafi: "حنفي",
    savePrefs: "حفظ التفضيلات", language: "اللغة", chooseLanguage: "اختر اللغة",
    locating: "جاري التحديد…", searching: "جاري البحث…", locationSet: "تم تحديد الموقع",
    locationCleared: "تم حذف الموقع.", calcSaved: "تم حفظ تفضيلات الحساب.",
    cityNotFound: "المدينة غير موجودة. جرب تهجئة مختلفة.",
    gpsDenied: "تم رفض إذن الموقع. أدخل المدينة يدوياً.",
    gpsError: "تعذر الحصول على الموقع. أدخل المدينة يدوياً.",
    // Language picker
    welcomeTitle: "أهلاً وسهلاً", welcomeSub: "اختر لغتك للمتابعة",
    english: "English", arabic: "العربية",
    // Azkar times
    morningAzkar: "أذكار الصباح", eveningAzkar: "أذكار المساء",
    sleepAzkar: "أذكار النوم", wakingAzkar: "أذكار الاستيقاظ",
    afterPrayer: "أذكار بعد الصلاة", duhaAzkar: "أذكار الضحى", afterMaghrib: "أذكار المغرب",
    morningDesc: "ابدأ يومك بذكر الله",
    eveningDesc: "أذكار المساء قبل الغروب",
    sleepDesc: "أدعية ما قبل النوم",
    wakingDesc: "أذكار الاستيقاظ من النوم",
    afterPrayerDesc: "أذكار ما بعد الصلاة",
    duhaDesc: "أذكار صلاة الضحى المباركة",
    afterMaghribDesc: "أذكار ما بعد المغرب",
  }
};

export type TKeys = keyof typeof T.en;
