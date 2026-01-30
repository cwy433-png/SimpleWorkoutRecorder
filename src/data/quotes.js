// Quote Packs System
// Each pack has: id, name, enabled (default), quotes[]

export const QUOTE_PACKS = [
    {
        id: 'classic',
        name: '经典语录',
        nameEn: 'Classics',
        enabled: true,
        quotes: [
            { text: "Light weight, baby!", author: "Ronnie Coleman" },
            { text: "Everybody wants to be a bodybuilder, but nobody wants to lift no heavy-ass weights.", author: "Ronnie Coleman" },
            { text: "Suffer now and live the rest of your life as a champion.", author: "Muhammad Ali" },
            { text: "The only place where success comes before work is in the dictionary.", author: "Vidal Sassoon" },
            { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
            { text: "Strength does not come from winning. Your struggles develop your strengths.", author: "Arnold Schwarzenegger" },
            { text: "The last three or four reps is what makes the muscle grow.", author: "Arnold Schwarzenegger" },
            { text: "Vision creates faith and faith creates willpower.", author: "Arnold Schwarzenegger" },
            { text: "To be the best, you have to work the hardest.", author: "Kobe Bryant" },
            { text: "Everyone has a plan until they get punched in the mouth.", author: "Mike Tyson" },
            { text: "Who's gonna carry the boats?", author: "David Goggins" },
            { text: "Obsessed is just a word the lazy use to describe the dedicated.", author: "Russell Warren" },
            { text: "Ain't nothing but a peanut.", author: "Ronnie Coleman" },
            { text: "You can't climb the ladder of success with your hands in your pockets.", author: "Arnold Schwarzenegger" },
            { text: "Sweat is just fat crying.", author: "Anonymous" },
            { text: "Discipline is doing what you hate to do, but doing it like you love it.", author: "Mike Tyson" },
        ]
    },
    {
        id: 'baki',
        name: '范马刃牙',
        nameEn: 'Baki',
        enabled: false,
        quotes: [
            { text: "毒也好，营养也好，都要吃，这才叫做健全。", author: "范马勇次郎" },
            { text: "必可活用与下一次。", author: "烈海王" },
            { text: "是木筷子与纸袋！", author: "愚地独步" },
            { text: "纯度太低了。", author: "范马勇次郎" },
            { text: "人体❤……很神奇吧？", author: "小阿里" },
            { text: "纯度，有用吗？", author: "宫本武藏" },
        ]
    }
];

// Legacy export for backward compatibility
export const QUOTES = QUOTE_PACKS[0].quotes;

// Helper: Get all enabled quotes
export const getEnabledQuotes = (enabledPacks) => {
    return QUOTE_PACKS
        .filter(pack => enabledPacks.includes(pack.id))
        .flatMap(pack => pack.quotes);
};
