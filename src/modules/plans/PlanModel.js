/**
 * Plan Data Model Structure
 * 
 * Plan {
 *   id: string,
 *   title: string,
 *   description: string,
 *   author: string,
 *   days: Day[]
 * }
 * 
 * Day {
 *   id: string,
 *   name: string (e.g. "Push Day", "Monday"),
 *   exercises: Exercise[]
 * }
 * 
 * Exercise {
 *   id: string,
 *   name: string,
 *   sets: number,
 *   reps: string (range "8-12" or single "5"),
 *   rpe: number (optional target RPE),
 *   notes: string
 * }
 */

// Safe ID generator for non-secure contexts
const generateId = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export const createPlan = (title = "New Plan") => ({
    id: generateId(),
    title,
    description: "",
    createdAt: new Date().toISOString(),
    days: []
});

export const createDay = (name = "New Day") => ({
    id: generateId(),
    name,
    exercises: []
});

export const createExercise = (name = "Exercise") => ({
    id: generateId(),
    name,
    sets: 3,
    reps: "10",
    rpe: 8,
    targetRest: 90,
    notes: ""
});
