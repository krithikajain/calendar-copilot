export const CATEGORY_COLORS: Record<string, string> = {
    Meeting: 'bg-[#e8f0fe] text-[#1a73e8] border-l-[#1a73e8]',
    Fitness: 'bg-[#ceead6] text-[#0d652d] border-l-[#0d652d]',
    Break: 'bg-[#feefe3] text-[#cf6a15] border-l-[#cf6a15]',
    Travel: 'bg-[#fef7e0] text-[#b06000] border-l-[#b06000]',
    Focus: 'bg-[#fce8e6] text-[#c5221f] border-l-[#c5221f]',
    Uncategorized: 'bg-[#f1f3f4] text-[#5f6368] border-l-[#5f6368]',
};

export const getEventTheme = (category: string) => {
    return CATEGORY_COLORS[category] || CATEGORY_COLORS.Uncategorized;
};

export const RADIUS = {
    event: 'rounded-md',
    dayPill: 'rounded-full',
};
