const fs = require("fs");
let content = fs.readFileSync("src/app/income/page.tsx", "utf8");
let lines = content.split("\n");

// 1. Fix monthKey (line 108, 0-indexed 107)
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("const monthKey = year +") && lines[i].includes("String(month).padStart(2, '0')")) {
    lines[i] = "  const monthKey = month ? year + '-' + String(month).padStart(2, '0') : String(year);";
  }
  // 2. Fix monthLabel
  if (lines[i].includes("const monthLabel = year +") && lines[i].includes("\\\\u5e74")) {
    lines[i] = "  const monthLabel = month ? year + '\\\\u5e74' + String(month).padStart(2, '0') + '\\\\u6708' : year + '\\\\u5e74 (\\\\u5168\\\\u5e74)';";
  }
  // 3. Remove total amount badge
  if (lines[i].includes("stats && <span") && lines[i].includes("totalIncome.toFixed(0)")) {
    lines[i] = "";
  }
  // 4. Add year toggle button after month label span
  if (lines[i].includes('text-base sm:text-xl font-bold text-green-800') && lines[i].includes('{monthLabel}')) {
    lines[i] = '            <span className="text-base sm:text-xl font-bold text-green-800">{monthLabel}</span>';
    // Insert year toggle after this line
    lines.splice(i + 1, 0, '            <button onClick={() => { setMonth(month === null ? new Date().getMonth() + 1 : null); setPage(1); }} className={"text-xs px-2.5 py-1 rounded-full font-medium transition-all " + (month === null ? "bg-green-600 text-white shadow-sm" : "bg-green-100 text-green-600 hover:bg-green-200")}>全年</button>');
  }
  // 5. Disable arrows in year mode
  if (lines[i].includes("onClick={prevMonth}") && lines[i].includes('p-2 hover:bg-white/70 rounded-xl')) {
    lines[i] = lines[i].replace(
      'className="p-2 hover:bg-white/70 rounded-xl transition-all hover:shadow-sm active:scale-90"',
      "className={'p-2 hover:bg-white/70 rounded-xl transition-all hover:shadow-sm active:scale-90' + (month === null ? ' opacity-30 pointer-events-none' : '')}"
    );
  }
  if (lines[i].includes("onClick={nextMonth}") && lines[i].includes('p-2 hover:bg-white/70 rounded-xl')) {
    lines[i] = lines[i].replace(
      'className="p-2 hover:bg-white/70 rounded-xl transition-all hover:shadow-sm active:scale-90"',
      "className={'p-2 hover:bg-white/70 rounded-xl transition-all hover:shadow-sm active:scale-90' + (month === null ? ' opacity-30 pointer-events-none' : '')}"
    );
  }
  // 6. Fix the analysis IIFE - find the block and replace variable names
  if (lines[i].includes("const daysInMonth = new Date(year, month, 0).getDate();")) {
    lines[i] = "            const totalDays = month === null ? (year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0) ? 366 : 365) : new Date(year, month, 0).getDate();";
    lines[i+1] = "            const workDates = new Set(incomes.map((i) => i.date?.substring(0, 10)).filter(Boolean));";
    lines[i+2] = "            const adjustedWorkDays = workDates.size;";
    lines[i+3] = "            const restDays = totalDays - adjustedWorkDays;";
    lines[i+4] = "            const avgDaily = adjustedWorkDays > 0 ? stats.totalIncome / adjustedWorkDays : 0;";
    lines[i+5] = "            const workRate = totalDays > 0 ? (adjustedWorkDays / totalDays * 100).toFixed(0) : '0';";
    lines[i+6] = "            const dailyTotals: Record<string, number> = {};";
    lines[i+7] = "            incomes.forEach((i) => {";
    lines[i+8] = "              const key = i.date?.substring(0, 10);";
    lines[i+9] = "              if (key) dailyTotals[key] = (dailyTotals[key] || 0) + i.amount;";
    lines[i+10] = "            });";
    lines[i+11] = "            const bestDay = Object.values(dailyTotals).length > 0 ? Math.max(...Object.values(dailyTotals)) : 0;";
  }
  // 7. Fix JSX references in the analysis section (inside return <>)
  if (lines[i].includes("{workDays}") && !lines[i].includes("const ") && !lines[i].includes("let ")) {
    lines[i] = lines[i].replace(/{workDays}/g, "{adjustedWorkDays}");
  }
  if (lines[i].includes("{daysInMonth}") && !lines[i].includes("const ") && !lines[i].includes("let ")) {
    lines[i] = lines[i].replace(/{daysInMonth}/g, "{totalDays}");
  }
}

content = lines.join("\n");
fs.writeFileSync("src/app/income/page.tsx", content, "utf8");
console.log("Done!");
