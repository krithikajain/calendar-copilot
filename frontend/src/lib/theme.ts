export const CATEGORY_COLORS: Record<string, string> = {
    Meeting: 'bg-[#c7eae4] text-[#2c4c47] border-[#a5d1ca]',  // Frozen Water
    Fitness: 'bg-[#a7e8bd] text-[#2d4a36] border-[#89c59e]',  // Celadon
    Break: 'bg-[#f5cac3] text-[#5c3d38] border-[#e2a9a0]',  // Cotton Rose
    Travel: 'bg-[#ffd972] text-[#5c4a1a] border-[#eec04b]',  // Jasmine
    Focus: 'bg-[#84a59d] text-[#ffffff] border-[#6b8a82]',  // Muted Teal
    Uncategorized: 'bg-[#f28482] text-[#ffffff] border-[#d46a68]', // Light Coral
};

export const getEventTheme = (category: string) => {
    return CATEGORY_COLORS[category] || CATEGORY_COLORS.Uncategorized;
};

// Extremely soft rounded corners inspired by modern high-end UI
export const RADIUS = {
    event: 'rounded-[1.25rem]',
    dayPill: 'rounded-[1.25rem]',
};
