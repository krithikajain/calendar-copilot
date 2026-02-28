export const CATEGORY_COLORS: Record<string, string> = {
    Meeting: 'bg-[#bae6fd] text-[#0369a1] border-[#7dd3fc]',  // Light Blue
    Fitness: 'bg-[#bbf7d0] text-[#15803d] border-[#86efac]',  // Light Green
    Break: 'bg-[#fbcfe8] text-[#be185d] border-[#f9a8d4]',  // Light Pink
    Travel: 'bg-[#fef08a] text-[#a16207] border-[#fde047]',  // Light Yellow
    Focus: 'bg-[#e9d5ff] text-[#7e22ce] border-[#d8b4fe]',  // Light Purple
    Uncategorized: 'bg-[#f1f5f9] text-[#475569] border-[#e2e8f0]', // Light Slate
};

export const getEventTheme = (category: string) => {
    return CATEGORY_COLORS[category] || CATEGORY_COLORS.Uncategorized;
};

// You can edit the UI roundedness here for modularity
export const RADIUS = {
    event: 'rounded-2xl',
    dayPill: 'rounded-2xl',
};
