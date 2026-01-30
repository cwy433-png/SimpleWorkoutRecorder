export const LLM_PROMPT_TEMPLATE = `You are a Fitness Data Converter. I have a workout routine that I need to convert into a specific JSON format for my workout app.

**Input Data:**
[PASTE YOUR ROUTINE HERE]

**Required Output Format (JSON):**
Please output a single JSON Object containing a "title" string and a "days" array. Do not include markdown formatting, just the raw JSON.

Structure Example:
{
  "title": "My Split",
  "days": [
    {
      "name": "Day 1",
      "exercises": [
        {
          "name": "Squat",
          "sets": 3,
          "reps": "8-10",
          "rest": 120
        }
      ]
    }
  ]
}`;
