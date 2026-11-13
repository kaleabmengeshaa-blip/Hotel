import type { MenuLanguage } from "@/lib/menu-i18n";

const amharicCopy: Record<string, string> = {
  "Language and currency": "ቋንቋ እና ገንዘብ",
  "Language options": "የቋንቋ ምርጫዎች",
  "Language options: On": "የቋንቋ ምርጫዎች፡ ክፍት",
  "Language options: Off": "የቋንቋ ምርጫዎች፡ ዝግ",
  "Newest dishes first": "አዲስ ምግቦች መጀመሪያ",
  "Newest dishes first: On": "አዲስ ምግቦች መጀመሪያ፡ ክፍት",
  "Newest dishes first: Off": "አዲስ ምግቦች መጀመሪያ፡ ዝግ",
  On: "ክፍት",
  Off: "ዝግ",
  "Could not load the language setting.": "የቋንቋ ቅንብሩን መጫን አልተቻለም።",
  "Could not update the language setting.": "የቋንቋ ቅንብሩን ማዘመን አልተቻለም።",
  Close: "ዝጋ",
  "Admin sign in": "ወደ አስተዳደር ይግቡ",
  "Sign in to manage the restaurant menu.": "የሬስቶራንቱን ምናሌ ለማስተዳደር ይግቡ።",
  "Return to guest menu": "ወደ እንግዳ ምናሌ ተመለስ",
  Username: "የተጠቃሚ ስም",
  Password: "የይለፍ ቃል",
  "Hide password": "የይለፍ ቃሉን ደብቅ",
  "Show password": "የይለፍ ቃሉን አሳይ",
  "Signing in...": "በመግባት ላይ...",
  "Too many failed attempts. Please try again in {minutes} minutes.": "ብዙ ያልተሳኩ ሙከራዎች ተደርገዋል። እባክዎ ከ{minutes} ደቂቃ በኋላ ይሞክሩ።",
  "Sign in": "ግባ",
  "Invalid username or password.": "የተጠቃሚ ስም ወይም የይለፍ ቃል ትክክል አይደለም።",
  "Enter your username and password.": "የተጠቃሚ ስምዎን እና የይለፍ ቃልዎን ያስገቡ።",
  "Admin login is not configured. Set the required ADMIN variables and restart the server.": "የአስተዳዳሪ መግቢያ አልተዋቀረም። አስፈላጊውን ADMIN ቅንብር ያዘጋጁ።",
  "Add ADMIN_USERNAME, ADMIN_PASSWORD, and a 32-character ADMIN_SESSION_SECRET to your local environment, then restart the server.": "ADMIN_USERNAME፣ ADMIN_PASSWORD እና 32 ቁምፊ ያለው ADMIN_SESSION_SECRET ያክሉ፣ ከዚያ ሰርቨርን ዳግመኛ ያስጀምሩ።",
};

export function getAdminCopy(text: string, language: MenuLanguage): string {
  return language === "am" ? amharicCopy[text] ?? text : text;
}
