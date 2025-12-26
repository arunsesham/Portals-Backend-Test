// --- Helper Tools ---
// These are small, reusable tools for calculating dates.
// Instead of writing complex math in every file, we write it here once
// and use these "shortcuts" wherever we need them.

// Returns how many days are in a specific month (e.g., Feb 2024 = 29 days)
export const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

// Returns which day of the week the month starts on (e.g., 0 = Sunday, 1 = Monday)
export const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay(); 

// Checks if a specific date falls between a Start Date and an End Date
export const isDateInRange = (dateStr: string, startStr: string, endStr: string) => {
    if (!startStr || !endStr) return false;
    const d = new Date(dateStr);
    const s = new Date(startStr);
    const e = new Date(endStr);
    const dTime = d.getTime();
    return dTime >= s.getTime() && dTime <= e.getTime();
};