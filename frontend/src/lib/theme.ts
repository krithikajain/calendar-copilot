export const CATEGORY_COLORS: Record<string, string> = {
    Meeting: 'bg-[#e8f0fe] text-[#1a73e8] border-l-[#1a73e8]',
    Fitness: 'bg-[#ceead6] text-[#0d652d] border-l-[#0d652d]',
    Break: 'bg-[#feefe3] text-[#cf6a15] border-l-[#cf6a15]',
    Travel: 'bg-[#fef7e0] text-[#b06000] border-l-[#b06000]',
    Focus: 'bg-[#fce8e6] text-[#c5221f] border-l-[#c5221f]',
    Shared: 'bg-[#fff5cc] text-[#996600] border-l-[#ffcc00]',
    Uncategorized: 'bg-[#f1f3f4] text-[#5f6368] border-l-[#5f6368]',
};

export const GOOGLE_COLORS: Record<string, string> = {
    '1': 'bg-[#e8ecee] text-[#5c6bc0] border-l-[#5c6bc0]', // Lavender
    '2': 'bg-[#e4edd8] text-[#33b679] border-l-[#33b679]', // Sage
    '3': 'bg-[#f4e2f9] text-[#8e24aa] border-l-[#8e24aa]', // Grape
    '4': 'bg-[#fce8e6] text-[#e67c73] border-l-[#e67c73]', // Flamingo
    '5': 'bg-[#fef7e0] text-[#f6bf26] border-l-[#f6bf26]', // Banana
    '6': 'bg-[#fce5cd] text-[#f4511e] border-l-[#f4511e]', // Tangerine
    '7': 'bg-[#e0f2fe] text-[#039be5] border-l-[#039be5]', // Peacock
    '8': 'bg-[#f1f3f4] text-[#616161] border-l-[#616161]', // Graphite
    '9': 'bg-[#e8f0fe] text-[#3f51b5] border-l-[#3f51b5]', // Blueberry
    '10': 'bg-[#e6f4ea] text-[#0b8043] border-l-[#0b8043]', // Basil
    '11': 'bg-[#fce8e6] text-[#d50000] border-l-[#d50000]', // Tomato
};

export const getEventTheme = (event: any) => {
    if (event.category === 'Shared') {
        return CATEGORY_COLORS.Shared;
    }
    if (event.googleColorId && GOOGLE_COLORS[event.googleColorId]) {
        return GOOGLE_COLORS[event.googleColorId];
    }
    return CATEGORY_COLORS[event.category] || CATEGORY_COLORS.Uncategorized;
};

export const RADIUS = {
    event: 'rounded-md',
    dayPill: 'rounded-full',
};
