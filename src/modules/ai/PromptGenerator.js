/**
 * Generates a structured prompt for an AI Coach based on user data.
 */
export const generateCoachPrompt = (profile, plan, history, userGoal) => {
    const historySummary = history.slice(0, 5).map(h => {
        return `- ${new Date(h.date).toLocaleDateString()}: ${h.planTitle} (${h.dayName})`;
    }).join('\n');

    return `
You are an expert Strength & Conditioning Coach. I am your client.
Here is my profile and current training context.

**MY PROFILE:**
- Name: ${profile.name}
- Age: ${profile.age}
- Weight: ${profile.weight}kg
- Height: ${profile.height}cm
- Experience: ${profile.experience}
- Goal: ${profile.goals || userGoal}

**CURRENT PLAN:**
Plan Name: ${plan?.title || 'None'}
Focus: ${plan?.focus || 'General'}

**RECENT HISTORY (Last 5 Sessions):**
${historySummary || 'No recent history.'}

**MY REQUEST:**
Please analyze my data and provide:
1. A critique of my consistency.
2. Specific adjustments for my next workout.
3. A motivational quote tailored to my goal.

Keep your response concise and actionable.
`.trim();
};
