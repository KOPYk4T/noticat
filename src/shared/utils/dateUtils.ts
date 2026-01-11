import type { DateFormat } from "../types/fileMapping";

export const parseDate = (dateStr: string): number => {
  if (!dateStr?.trim()) return 0;

  const parts = dateStr.split("/");
  if (parts.length !== 3) return 0;

  const [day, month, year] = parts.map(p => parseInt(p, 10));
  if (isNaN(day) || isNaN(month) || isNaN(year)) return 0;

  return new Date(year, month - 1, day).getTime();
};

export const detectDateFormat = (
  sampleDates: string[]
): "MM/DD/YY" | "DD/MM/YYYY" | "auto" => {
  if (!sampleDates?.length) return "auto";

  let mmddCount = 0;
  let ddmmyyyyCount = 0;

  for (const dateStr of sampleDates.slice(0, 10)) {
    const str = String(dateStr || "").trim();
    if (!str) continue;

    const parts = str.split(/[-/]/);
    if (parts.length !== 3) continue;

    const [part1, part2, part3] = parts.map(p => parseInt(p, 10));

    if (part1 > 12 && part2 <= 12) {
      ddmmyyyyCount++;
    } else if (part1 <= 12 && part2 <= 12) {
      ddmmyyyyCount += part3 >= 1000 ? 1 : 0;
      mmddCount += part3 < 1000 ? 1 : 0;
    }
  }

  return mmddCount > ddmmyyyyCount ? "MM/DD/YY" :
         ddmmyyyyCount > mmddCount ? "DD/MM/YYYY" : "auto";
};

export const normalizeDate = (
  dateStr: string,
  dateFormat?: DateFormat
): string => {
  if (!dateStr?.trim()) return dateStr;

  const parts = dateStr.split(/[-/]/);
  if (parts.length !== 3) return dateStr;

  const [part1, part2, part3] = parts.map(p => parseInt(p, 10));

  const detectedFormat: "MM/DD/YY" | "DD/MM/YYYY" =
    dateFormat === "MM/DD/YY" ? "MM/DD/YY" :
    dateFormat === "DD/MM/YYYY" ? "DD/MM/YYYY" :
    part1 > 12 && part2 <= 12 ? "DD/MM/YYYY" :
    part1 <= 12 && part2 > 12 ? "MM/DD/YY" :
    part3 >= 1000 ? "DD/MM/YYYY" : "MM/DD/YY";

  let day: number, month: number, year: number;

  if (detectedFormat === "MM/DD/YY") {
    [month, day, year] = [part1, part2, part3];
  } else {
    [day, month, year] = [part1, part2, part3];
  }

  if (year < 100) {
    year = year < 50 ? 2000 + year : 1900 + year;
  }

  return `${day.toString().padStart(2, "0")}/${month.toString().padStart(2, "0")}/${year}`;
};
