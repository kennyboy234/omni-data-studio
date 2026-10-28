/**
 * Robust CSV parser handling quotes, delimiters, newlines, and automatic type conversion
 */
export function parseCSV(csvText: string): Record<string, any>[] {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];

  // Determine delimiter
  const firstLine = lines[0];
  const commaCount = (firstLine.match(/,/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  let delimiter = ',';
  if (tabCount > commaCount && tabCount > semiCount) delimiter = '\t';
  else if (semiCount > commaCount) delimiter = ';';

  // Helper to parse line into tokens
  const parseLine = (text: string): string[] => {
    const tokens: string[] = [];
    let insideQuotes = false;
    let currentToken = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        if (insideQuotes && text[i + 1] === '"') {
          currentToken += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === delimiter && !insideQuotes) {
        tokens.push(currentToken.trim());
        currentToken = '';
      } else {
        currentToken += char;
      }
    }
    tokens.push(currentToken.trim());
    return tokens;
  };

  const headers = parseLine(lines[0]).map((h) => h.replace(/^["']|["']$/g, '').trim());
  const rows: Record<string, any>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawValues = parseLine(lines[i]);
    if (rawValues.length === 0 || (rawValues.length === 1 && rawValues[0] === '')) continue;

    const row: Record<string, any> = {};
    for (let j = 0; j < headers.length; j++) {
      const header = headers[j];
      const val = rawValues[j] !== undefined ? rawValues[j].replace(/^["']|["']$/g, '').trim() : '';

      if (val === '' || val.toLowerCase() === 'null' || val.toLowerCase() === 'na' || val.toLowerCase() === 'nan') {
        row[header] = null;
      } else if (/^-?\d+$/.test(val)) {
        row[header] = parseInt(val, 10);
      } else if (/^-?\d+\.\d+$/.test(val)) {
        row[header] = parseFloat(val);
      } else if (val.toLowerCase() === 'true') {
        row[header] = true;
      } else if (val.toLowerCase() === 'false') {
        row[header] = false;
      } else {
        row[header] = val;
      }
    }
    rows.push(row);
  }

  return rows;
}

/**
 * Convert dataset to CSV string
 */
export function exportToCSV(data: Record<string, any>[]): string {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);

  const escapeCell = (val: any) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = headers.map(escapeCell).join(',');
  const rowLines = data.map((row) => headers.map((h) => escapeCell(row[h])).join(','));

  return [headerLine, ...rowLines].join('\n');
}
