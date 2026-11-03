export function requiresMenuItemDescription(categoryName: string): boolean {
  return !/\b(drinks?|beverages?|coffee|tea|juices?|wines?|cocktails?)\b/i.test(categoryName);
}
