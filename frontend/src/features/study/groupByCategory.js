export function groupByCategory(items, fallback) {
  const groups = new Map();
  items.forEach((item, index) => {
    const category = item.category || fallback;
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push({ item, index });
  });
  return [...groups].map(([category, entries]) => ({ category, entries }));
}
