export const parseAmount = (amountStr: string): number => {
  if (!amountStr || typeof amountStr !== 'string') return 0;

  let cleaned = amountStr.replace(/[^\d.,-]/g, "").trim();
  if (!cleaned || cleaned === "-") return 0;

  const isNegative = cleaned.startsWith("-");
  if (isNegative) cleaned = cleaned.slice(1);

  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");
  const [dotCount, commaCount] = [
    (cleaned.match(/\./g) || []).length,
    (cleaned.match(/,/g) || []).length
  ];

  if (hasComma && hasDot) {
    const lastCommaIndex = cleaned.lastIndexOf(",");
    const lastDotIndex = cleaned.lastIndexOf(".");

    const [intPart, decPart] = lastCommaIndex > lastDotIndex
      ? [cleaned.split(",")[0].replace(/\./g, ""), cleaned.split(",")[1] || "00"]
      : [cleaned.split(".")[0].replace(/,/g, ""), cleaned.split(".")[1] || "00"];

    const num = parseFloat(`${intPart}.${decPart}`);
    return isNaN(num) ? 0 : (isNegative ? -num : num);
  }

  if (hasComma && !hasDot) {
    if (commaCount === 1) {
      const [part1, part2] = cleaned.split(",");
      if (part2.length <= 2) {
        const num = parseFloat(`${part1}.${part2 || "00"}`);
        return isNaN(num) ? 0 : (isNegative ? -num : num);
      }
    }
    const num = parseFloat(cleaned.replace(/,/g, ""));
    return isNaN(num) ? 0 : (isNegative ? -num : Math.abs(num));
  }

  if (hasDot && !hasComma) {
    if (dotCount > 1) {
      cleaned = cleaned.replace(/\./g, "");
    } else {
      const afterDot = cleaned.substring(cleaned.lastIndexOf(".") + 1);
      if (afterDot.length > 2) {
        cleaned = cleaned.replace(/\./g, "");
      }
    }
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : (isNegative ? -num : Math.abs(num));
};
