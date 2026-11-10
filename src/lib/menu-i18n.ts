export type MenuLanguage = "en" | "am";
export type MenuCurrency = "ETB" | "USD";
export type MenuLocale = "am-ETB" | "en-ETB" | "en-USD";

const copy = {
  en: {
    languageAndCurrency: "Language and currency",
    pageTitle: "Classic Cafe and Restaurant",
    menuTitle: "Menu",
    pageDescription: "Coffee, breakfast, meals & fresh juice",
    backToAdmin: "Back to Admin",
    searchPlaceholder: "Search coffee, breakfast, juice...",
    clear: "Clear",
    feedback: "Feedback",
    feedbackTitle: "Leave feedback",
    feedbackDescription: "Rate your visit and share your experience with the restaurant.",
    foodsHad: "Which foods or drinks did you have?",
    feedbackInstructions: "Search the menu, then open a category to select what you tried.",
    findFood: "Find a food or drink...",
    searchFoods: "Search foods and drinks",
    noItemsSelected: "No items selected",
    selectedItemCount: "{count} item{plural} selected",
    noMatchingFoods: "No matching foods or drinks.",
    selectedCount: "{count} selected",
    itemCount: "{count} items",
    yourRating: "Your rating",
    ratingStars: "Rate your visit from 1 to 5 stars",
    yourName: "Your name",
    optional: "(optional)",
    yourFeedback: "Your feedback",
    sending: "Sending...",
    sendRating: "Send rating",
    sendFeedback: "Send feedback",
    feedbackSuccess: "Thank you! Your feedback was sent to the restaurant.",
    ratingSuccess: "Thank you! Your rating was sent to the restaurant.",
    feedbackError: "Could not send your comment. Please try again.",
    ratingError: "Could not send your rating. Please try again.",
    allDishes: "All Dishes",
    showingItems: "Showing {count} curated item{plural}",
    reset: "Reset",
    chefSpecial: "Chef's Special",
    add: "Add",
    removeOne: "Remove one {name}",
    addOne: "Add one {name}",
    loadingMenu: "Loading the menu...",
    unavailableMenu: "Menu temporarily unavailable",
    menuLoadError: "We could not load the restaurant menu. Please try again.",
    tryAgain: "Try again",
    noAvailableItems: "No menu items are currently available",
    noMatchingItems: "No dishes match your criteria",
    checkBackLater: "Please check back later.",
    changeSearch: "Try changing the selected category or search keywords.",
    showFullMenu: "Show Full Menu",
    etbPriceUnavailable: "ETB price unavailable",
    usdPriceUnavailable: "USD price unavailable",
    yourSelection: "Your selection",
    close: "Close",
    selectedItems: "{count} item{plural} selected",
    updatingKitchen: "Updating the kitchen dashboard...",
    sentToKitchen: "Sent to the kitchen dashboard",
    hide: "Hide",
    viewSelection: "View selection",
    mins: "mins",
    keyIngredients: "Key Ingredients",
    containsAllergens: "Contains Allergens:",
    calories: "kcal",
    dietaryTags: {
      vegetarian: "Vegetarian",
      vegan: "Vegan",
      "gluten-free": "Gluten-free",
      spicy: "Spicy",
      "chef-special": "Chef's special",
      halal: "Halal",
    },
    categories: {
      "all dishes": "All Dishes",
      all: "All Dishes",
      starters: "Starters",
      "starters & salads": "Starters & Salads",
      "main courses": "Main Courses",
      mains: "Mains & Grills",
      "pizza & pasta": "Pasta & Pizza",
      "pizza-pasta": "Pasta & Pizza",
      foods: "Foods",
      breakfast: "Breakfast & Brunch",
      desserts: "Desserts",
      drinks: "Drinks",
      "hot drinks": "Hot Drinks",
      "cold drinks": "Cold Drinks",
      "soft drinks": "Soft Drinks",
    },
    itemNames: {
      bunna: "Bunna",
      "truffle arancini": "Truffle Arancini",
      "spicy tuna tartare": "Spicy Tuna Tartare",
      "pan-seared salmon": "Pan-Seared Salmon",
      "wild mushroom risotto": "Wild Mushroom Risotto",
      "classic tiramisu": "Classic Tiramisu",
      "wild mushroom & truffle risotto": "Wild Mushroom & Truffle Risotto",
      "a5 japanese wagyu ribeye": "A5 Japanese Wagyu Ribeye",
      "butter-poached lobster fettuccine": "Butter-Poached Lobster Fettuccine",
      "artisanal burrata & heirloom salad": "Artisanal Burrata & Heirloom Salad",
      "24k gold chocolate lava soufflé": "24K Gold Chocolate Lava Soufflé",
      "royal smoked old fashioned": "Royal Smoked Old Fashioned",
      "truffle avocado & poached egg toast": "Truffle Avocado & Poached Egg Toast",
      "wood-fired pizza tartufo e funghi": "Wood-Fired Pizza Tartufo e Funghi",
    },
  },
  am: {
    languageAndCurrency: "ቋንቋ እና ገንዘብ",
    pageTitle: "ክላሲክ ካፌ እና ሬስቶራንት",
    menuTitle: "የምግብ ዝርዝር",
    pageDescription: "ቡና፣ ቁርስ፣ ምግቦች እና ትኩስ ጭማቂ",
    backToAdmin: "ወደ አስተዳዳሪ ተመለስ",
    searchPlaceholder: "ቡና፣ ቁርስ ወይም ጭማቂ ፈልግ...",
    clear: "አጽዳ",
    feedback: "አስተያየት",
    feedbackTitle: "አስተያየት ይስጡ",
    feedbackDescription: "ጉብኝትዎን ይመዝኑ እና ልምድዎን ለሬስቶራንቱ ያካፍሉ።",
    foodsHad: "የትኞቹን ምግቦች ወይም መጠጦች ተጠቅመዋል?",
    feedbackInstructions: "የሞከሩትን ለመምረጥ ምግቡን ፈልገው ምድቡን ይክፈቱ።",
    findFood: "ምግብ ወይም መጠጥ ፈልግ...",
    searchFoods: "ምግቦችን እና መጠጦችን ፈልግ",
    noItemsSelected: "ምንም አልተመረጠም",
    selectedItemCount: "{count} ምግቦች ተመርጠዋል",
    noMatchingFoods: "የሚዛመድ ምግብ ወይም መጠጥ አልተገኘም።",
    selectedCount: "{count} ተመርጧል",
    itemCount: "{count} ምግቦች",
    yourRating: "የእርስዎ ደረጃ",
    ratingStars: "ጉብኝትዎን ከ1 እስከ 5 ኮከቦች ይመዝኑ",
    yourName: "ስምዎ",
    optional: "(አማራጭ)",
    yourFeedback: "አስተያየትዎ",
    sending: "በመላክ ላይ...",
    sendRating: "ደረጃውን ላክ",
    sendFeedback: "አስተያየት ላክ",
    feedbackSuccess: "እናመሰግናለን! አስተያየትዎ ለሬስቶራንቱ ተልኳል።",
    ratingSuccess: "እናመሰግናለን! ደረጃዎ ለሬስቶራንቱ ተልኳል።",
    feedbackError: "አስተያየቱን መላክ አልተቻለም። እባክዎ እንደገና ይሞክሩ።",
    ratingError: "ደረጃውን መላክ አልተቻለም። እባክዎ እንደገና ይሞክሩ።",
    allDishes: "ሁሉም ምግቦች",
    showingItems: "{count} ምግቦች ይታያሉ",
    reset: "አጽዳ",
    chefSpecial: "የሼፉ ልዩ ምግብ",
    add: "ጨምር",
    removeOne: "{name} አንድ ቀንስ",
    addOne: "{name} አንድ ጨምር",
    loadingMenu: "የምግብ ዝርዝሩ በመጫን ላይ ነው...",
    unavailableMenu: "የምግብ ዝርዝሩ ለጊዜው አይገኝም",
    menuLoadError: "የሬስቶራንቱን ምግቦች መጫን አልተቻለም። እባክዎ እንደገና ይሞክሩ።",
    tryAgain: "እንደገና ይሞክሩ",
    noAvailableItems: "በአሁኑ ጊዜ የሚገኙ ምግቦች የሉም",
    noMatchingItems: "ከመረጡት ጋር የሚዛመድ ምግብ አልተገኘም",
    checkBackLater: "እባክዎ ቆይተው ይመለሱ።",
    changeSearch: "ምድቡን ወይም የፍለጋ ቃላትን ይቀይሩ።",
    showFullMenu: "ሙሉ ዝርዝሩን አሳይ",
    etbPriceUnavailable: "የብር ዋጋ አይገኝም",
    usdPriceUnavailable: "የዶላር ዋጋ አይገኝም",
    yourSelection: "የመረጡት",
    close: "ዝጋ",
    selectedItems: "{count} ምግቦች ተመርጠዋል",
    updatingKitchen: "ወደ ኩሽናው በመላክ ላይ...",
    sentToKitchen: "ወደ ኩሽናው ተልኳል",
    hide: "ደብቅ",
    viewSelection: "ምርጫዎችን አሳይ",
    mins: "ደቂቃ",
    keyIngredients: "ዋና ዋና ግብዓቶች",
    containsAllergens: "አለርጂ አስከታይ ነገሮች፦",
    calories: "ካሎሪ",
    dietaryTags: {
      vegetarian: "ከስጋ ነጻ",
      vegan: "ከእንስሳት ምርት ነጻ",
      "gluten-free": "ግሉተን የሌለው",
      spicy: "በርበሬ ያለው",
      "chef-special": "የሼፉ ልዩ",
      halal: "ሐላል",
    },
    categories: {
      "all dishes": "ሁሉም ምግቦች",
      all: "ሁሉም ምግቦች",
      starters: "መክፈቻ ምግቦች",
      "starters & salads": "መክፈቻ ምግቦች እና ሰላጣ",
      "main courses": "ዋና ምግቦች",
      mains: "ዋና ምግቦች",
      "pizza & pasta": "ፒዛ እና ፓስታ",
      "pizza-pasta": "ፒዛ እና ፓስታ",
      foods: "ምግቦች",
      breakfast: "ቁርስ",
      desserts: "ጣፋጭ ምግቦች",
      drinks: "መጠጦች",
      "hot drinks": "ትኩስ መጠጦች",
      "cold drinks": "ቀዝቃዛ መጠጦች",
      "soft drinks": "ለስላሳ መጠጦች",
    },
    itemNames: {
      bunna: "ቡና",
      "truffle arancini": "ትሩፍል አራንቺኒ",
      "spicy tuna tartare": "በርበሬ ያለው ቱና ታርታር",
      "pan-seared salmon": "በምጣድ የተጠበሰ ሳልሞን",
      "wild mushroom risotto": "የዱር እንጉዳይ ሪሶቶ",
      "classic tiramisu": "ክላሲክ ቲራሚሱ",
      "wild mushroom & truffle risotto": "የዱር እንጉዳይ እና ትሩፍል ሪሶቶ",
      "a5 japanese wagyu ribeye": "A5 የጃፓን ዋግዩ ስቴክ",
      "butter-poached lobster fettuccine": "በቅቤ የተዘጋጀ ሎብስተር ፈቱቺኒ",
      "artisanal burrata & heirloom salad": "ቡራታ እና ትኩስ የቲማቲም ሰላጣ",
      "24k gold chocolate lava soufflé": "24 ካራት ወርቅ ያለው የቸኮሌት ሶፍሌ",
      "royal smoked old fashioned": "ሮያል የጢስ ኦልድ ፋሽንድ",
      "truffle avocado & poached egg toast": "ትሩፍል፣ አቮካዶ እና የተቀቀለ እንቁላል ቶስት",
      "wood-fired pizza tartufo e funghi": "በእንጨት እሳት የተጋገረ ትሩፍል እና እንጉዳይ ፒዛ",
    },
  },
} as const;

export type MenuCopyKey = Exclude<
  keyof typeof copy.en,
  "dietaryTags" | "categories" | "itemNames"
>;

export function getMenuCopy(language: MenuLanguage, key: MenuCopyKey): string {
  return copy[language][key];
}

export function translateMenuCategory(name: string, language: MenuLanguage): string {
  const normalizedName = name.trim().toLowerCase();
  return copy[language].categories[normalizedName as keyof typeof copy.en.categories] ?? name;
}

export function translateMenuItem(name: string, language: MenuLanguage): string {
  const normalizedName = name.trim().toLowerCase();
  return copy[language].itemNames[normalizedName as keyof typeof copy.en.itemNames] ?? name;
}

export function translateDietaryTag(tag: string, language: MenuLanguage): string {
  const normalizedTag = tag.trim().toLowerCase();
  return (
    copy[language].dietaryTags[normalizedTag as keyof typeof copy.en.dietaryTags] ?? tag
  );
}

export function isMenuLocale(value: string | null): value is MenuLocale {
  return value === "am-ETB" || value === "en-ETB" || value === "en-USD";
}

export function formatMenuPrice(
  priceEtb: number,
  priceUsd: number | null | undefined,
  currency: MenuCurrency,
  language: MenuLanguage
): string {
  const amount = currency === "USD" ? priceUsd : priceEtb;
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    return getMenuCopy(
      language,
      currency === "USD" ? "usdPriceUnavailable" : "etbPriceUnavailable"
    );
  }

  const locale = language === "am" ? "am-ET" : currency === "USD" ? "en-US" : "en-ET";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}
