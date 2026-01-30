# Workout Plan Converter Prompt

Copy the text below and send it to any AI Assistant (ChatGPT, Claude, Gemini) along with your workout routine file or text.

---

**PROMPT:**

You are a Fitness Data Converter. I have a workout routine (in text, Excel, or PDF format) that I need to convert into a specific JSON format for my workout app.

**Input Data:**
[PASTE YOUR ROUTINE HERE]

**Required Output Format (JSON):**
Please output a single JSON Object containing a "title" string and a "days" array. Do not include markdown formatting like ```json ... ```, just the raw JSON.

Structure Example:
{
  "title": "My 3-Day Split",
  "days": [
    {
      "name": "Push Day",
      "exercises": [
        {
          "name": "Barbell Bench Press",
          "sets": 3,
          "reps": "8-12",
          "rpe": 8,
          "rest": 180,
          "note": "Focus on chest"
        }
      ]
    }
  ]
}

**Rules:**
1. "reps" can be a number (10) or a string ("8-12").
2. "rpe" (Exertion 1-10) is optional, default to 7 if unknown.
3. "rest" is in seconds (e.g., 90).
4. Extract as many details as possible into "note".
5. Ensure the JSON is valid and minified is NOT required (pretty print is fine).
