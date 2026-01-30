import yaml from 'js-yaml';
import * as XLSX from 'xlsx';
import { createPlan, createDay, createExercise } from './PlanModel';

// Helper to normalize different inputs into our strict Plan Model
const normalizePlan = (rawData) => {
    // Basic validation logic would go here
    // For now, we assume if it's JSON/YAML it largely matches or we map it
    // This is a simplified mapper
    const plan = createPlan(rawData.title || "Imported Plan");
    plan.description = rawData.description || "";

    if (Array.isArray(rawData.days)) {
        plan.days = rawData.days.map(d => ({
            ...createDay(d.name),
            exercises: Array.isArray(d.exercises) ? d.exercises.map(e => ({
                ...createExercise(e.name),
                sets: e.sets || 3,
                reps: e.reps || "10",
                rpe: e.rpe || 8,
                notes: e.notes || ""
            })) : []
        }));
    }
    return plan;
};

export const parseFile = async (file) => {
    const extension = file.name.split('.').pop().toLowerCase();

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const content = e.target.result;
            try {
                let rawData = null;

                if (extension === 'json') {
                    rawData = JSON.parse(content);
                }
                else if (extension === 'yaml' || extension === 'yml') {
                    rawData = yaml.load(content);
                }
                else if (extension === 'xlsx' || extension === 'xls') {
                    // Excel Logic:
                    // Assumption: Sheet 1. Columns: Day | Exercise | Sets | Reps | RPE
                    const workbook = XLSX.read(content, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    const json = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

                    // Transform flat Excel Rows to Hierarchical Plan
                    rawData = convertExcelRowsToPlan(json);
                }

                if (rawData) {
                    resolve(normalizePlan(rawData));
                } else {
                    reject(new Error("Unsupported format or empty file"));
                }
            } catch (err) {
                reject(err);
            }
        };

        if (extension === 'xlsx' || extension === 'xls') {
            reader.readAsBinaryString(file);
        } else {
            reader.readAsText(file);
        }
    });
};

const convertExcelRowsToPlan = (rows) => {
    // Expects rows like: { Day: "Legs", Exercise: "Squat", Sets: 3, Reps: 10 ... }
    const struct = { title: "Excel Plan", days: [] };

    let currentDay = null;

    rows.forEach(row => {
        const dayName = row.Day || row.day || (currentDay ? currentDay.name : "Day 1");

        // If we switched days (or it's the first one)
        if (!currentDay || currentDay.name !== dayName) {
            currentDay = { name: dayName, exercises: [] };
            struct.days.push(currentDay);
        }

        if (row.Exercise || row.exercise) {
            currentDay.exercises.push({
                name: row.Exercise || row.exercise,
                sets: row.Sets || row.sets,
                reps: row.Reps || row.reps,
                rpe: row.RPE || row.rpe || 8,
                notes: row.Notes || row.notes
            });
        }
    });

    return struct;
};
