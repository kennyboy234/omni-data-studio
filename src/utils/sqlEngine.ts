export interface QueryResult {
  columns: string[];
  rows: Record<string, any>[];
  rowCount: number;
  executionTimeMs: number;
  query: string;
  error?: string;
  isDestructiveAttempt?: boolean;
}

export interface SQLTemplate {
  name: string;
  description: string;
  sql: string;
}

/**
 * Detect destructive SQL commands
 */
export function checkDestructiveSQL(sql: string): { isDestructive: boolean; command?: string } {
  const normalized = sql.trim().toUpperCase();
  const destructiveRegex = /\b(DROP|DELETE|TRUNCATE|ALTER|UPDATE|INSERT INTO|REPLACE)\b/i;
  const match = normalized.match(destructiveRegex);
  if (match) {
    return { isDestructive: true, command: match[0].toUpperCase() };
  }
  return { isDestructive: false };
}

/**
 * Execute SQL query on in-memory dataset tables safely
 */
export function executeSQL(
  sql: string,
  tables: Record<string, Record<string, any>[]>,
  destructiveAuthorized: boolean = false
): QueryResult {
  const startTime = performance.now();
  const cleanSql = sql.trim().replace(/;$/, '');

  // Guardrail check
  const destructiveCheck = checkDestructiveSQL(cleanSql);
  if (destructiveCheck.isDestructive && !destructiveAuthorized) {
    return {
      columns: [],
      rows: [],
      rowCount: 0,
      executionTimeMs: 0,
      query: sql,
      isDestructiveAttempt: true,
      error: `GUARDRAIL INTERCEPT: Destructive SQL command "${destructiveCheck.command}" detected. Strict non-negotiable rule requires explicit user approval confirmation before proceeding.`,
    };
  }

  // Check for unsupported SQL constructs (JOIN, CTEs, Window Functions)
  const isJoin = /\b(JOIN|INNER\s+JOIN|LEFT\s+JOIN|RIGHT\s+JOIN|FULL\s+JOIN|CROSS\s+JOIN)\b/i.test(cleanSql);
  const isCTE = /^\s*WITH\s+[a-zA-Z0-9_]+\s+AS\s*\(/i.test(cleanSql);
  const isWindow = /\bOVER\s*\(/i.test(cleanSql);

  if (isJoin || isCTE || isWindow) {
    const featureName = isJoin ? 'JOIN' : isCTE ? 'Common Table Expression (WITH/CTE)' : 'Window Function (OVER)';
    return {
      columns: [],
      rows: [],
      rowCount: 0,
      executionTimeMs: 0,
      query: sql,
      error: `SQL NOT SUPPORTED: ${featureName} is not supported by the lightweight in-memory SQL engine. Supported syntax: SELECT [columns/aggregates] FROM table [WHERE conditions] [GROUP BY columns] [ORDER BY col ASC/DESC] [LIMIT n]. Full ANSI SQL joins and window functions via DuckDB-WASM are PLANNED for future release.`,
    };
  }

  try {
    // Parse FROM table
    const fromMatch = cleanSql.match(/FROM\s+([a-zA-Z0-9_]+)/i);
    let tableName = fromMatch ? fromMatch[1].toLowerCase() : Object.keys(tables)[0];
    
    // Find matching table case-insensitively
    const tableKey = Object.keys(tables).find((k) => k.toLowerCase() === tableName) || Object.keys(tables)[0];
    const sourceRows = tables[tableKey] || [];

    if (sourceRows.length === 0) {
      return {
        columns: [],
        rows: [],
        rowCount: 0,
        executionTimeMs: performance.now() - startTime,
        query: sql,
        error: `Table "${tableName}" not found or contains 0 records. Available tables: ${Object.keys(tables).join(', ')}`,
      };
    }

    let filteredRows = [...sourceRows];

    // WHERE clause
    const whereMatch = cleanSql.match(/WHERE\s+([\s\S]*?)(?:GROUP\s+BY|ORDER\s+BY|LIMIT|$)/i);
    if (whereMatch) {
      const whereClause = whereMatch[1].trim();
      filteredRows = filteredRows.filter((row) => evaluateWhereClause(row, whereClause));
    }

    // GROUP BY clause
    const groupMatch = cleanSql.match(/GROUP\s+BY\s+([\s\S]*?)(?:ORDER\s+BY|LIMIT|$)/i);
    const selectMatch = cleanSql.match(/SELECT\s+([\s\S]*?)\s+FROM/i);
    const selectFields = selectMatch ? selectMatch[1].trim() : '*';

    let resultRows: Record<string, any>[] = [];

    if (groupMatch) {
      const groupCols = groupMatch[1].split(',').map((c) => c.trim());
      resultRows = executeGroupBy(filteredRows, groupCols, selectFields);
    } else {
      resultRows = executeSelect(filteredRows, selectFields);
    }

    // ORDER BY clause
    const orderMatch = cleanSql.match(/ORDER\s+BY\s+([a-zA-Z0-9_]+)(?:\s+(ASC|DESC))?/i);
    if (orderMatch) {
      const orderCol = orderMatch[1];
      const isDesc = orderMatch[2]?.toUpperCase() === 'DESC';
      resultRows.sort((a, b) => {
        const valA = a[orderCol];
        const valB = b[orderCol];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return isDesc ? 1 : -1;
        if (valB === null || valB === undefined) return isDesc ? -1 : 1;
        if (typeof valA === 'number' && typeof valB === 'number') {
          return isDesc ? valB - valA : valA - valB;
        }
        return isDesc
          ? String(valB).localeCompare(String(valA))
          : String(valA).localeCompare(String(valB));
      });
    }

    // LIMIT clause
    const limitMatch = cleanSql.match(/LIMIT\s+(\d+)/i);
    if (limitMatch) {
      const limit = parseInt(limitMatch[1], 10);
      resultRows = resultRows.slice(0, limit);
    }

    const columns = resultRows.length > 0 ? Object.keys(resultRows[0]) : [];
    const executionTimeMs = Number((performance.now() - startTime).toFixed(2));

    return {
      columns,
      rows: resultRows,
      rowCount: resultRows.length,
      executionTimeMs,
      query: sql,
    };
  } catch (err: any) {
    return {
      columns: [],
      rows: [],
      rowCount: 0,
      executionTimeMs: performance.now() - startTime,
      query: sql,
      error: err.message || 'Failed to execute SQL query',
    };
  }
}

/**
 * Safe expression evaluation for WHERE clause
 */
function evaluateWhereClause(row: Record<string, any>, clause: string): boolean {
  // Support AND / OR conditions
  if (clause.includes(' AND ')) {
    return clause.split(' AND ').every((cond) => evaluateWhereClause(row, cond));
  }
  if (clause.includes(' OR ')) {
    return clause.split(' OR ').some((cond) => evaluateWhereClause(row, cond));
  }

  const cond = clause.trim();

  // IS NULL / IS NOT NULL
  const nullMatch = cond.match(/^([a-zA-Z0-9_]+)\s+IS\s+NULL$/i);
  if (nullMatch) {
    const v = row[nullMatch[1]];
    return v === null || v === undefined || v === '';
  }
  const notNullMatch = cond.match(/^([a-zA-Z0-9_]+)\s+IS\s+NOT\s+NULL$/i);
  if (notNullMatch) {
    const v = row[notNullMatch[1]];
    return v !== null && v !== undefined && v !== '';
  }

  // LIKE operator
  const likeMatch = cond.match(/^([a-zA-Z0-9_]+)\s+LIKE\s+['"](.*?)['"]$/i);
  if (likeMatch) {
    const colVal = String(row[likeMatch[1]] || '').toLowerCase();
    const pattern = likeMatch[2].toLowerCase().replace(/%/g, '.*');
    return new RegExp(`^${pattern}$`).test(colVal);
  }

  // Comparison operators: =, !=, <>, >=, <=, >, <
  const compMatch = cond.match(/^([a-zA-Z0-9_]+)\s*(=|!=|<>|>=|<=|>|<)\s*(.+)$/);
  if (compMatch) {
    const col = compMatch[1];
    const op = compMatch[2];
    let target: any = compMatch[3].trim().replace(/^['"]|['"]$/g, '');

    const actual = row[col];
    if (actual === null || actual === undefined) return false;

    if (!isNaN(Number(target)) && typeof actual === 'number') {
      const numTarget = Number(target);
      if (op === '=') return actual === numTarget;
      if (op === '!=' || op === '<>') return actual !== numTarget;
      if (op === '>') return actual > numTarget;
      if (op === '<') return actual < numTarget;
      if (op === '>=') return actual >= numTarget;
      if (op === '<=') return actual <= numTarget;
    } else {
      const strActual = String(actual);
      if (op === '=') return strActual === target;
      if (op === '!=' || op === '<>') return strActual !== target;
      if (op === '>') return strActual > target;
      if (op === '<') return strActual < target;
      if (op === '>=') return strActual >= target;
      if (op === '<=') return strActual <= target;
    }
  }

  return true;
}

/**
 * Handle GROUP BY with aggregate functions (COUNT, SUM, AVG, MIN, MAX)
 */
function executeGroupBy(
  rows: Record<string, any>[],
  groupCols: string[],
  selectFields: string[] | string
): Record<string, any>[] {
  const groups: Record<string, Record<string, any>[]> = {};

  rows.forEach((r) => {
    const groupKey = groupCols.map((c) => String(r[c] ?? 'NULL')).join('::');
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(r);
  });

  const parsedAggregates = parseSelectAggregates(selectFields);
  const results: Record<string, any>[] = [];

  Object.entries(groups).forEach(([_, groupRows]) => {
    const outRow: Record<string, any> = {};

    // Assign group col values
    groupCols.forEach((col) => {
      outRow[col] = groupRows[0][col];
    });

    // Compute aggregates
    parsedAggregates.forEach((agg) => {
      if (agg.type === 'COUNT') {
        outRow[agg.alias] = agg.col === '*' ? groupRows.length : groupRows.filter((r) => r[agg.col] != null).length;
      } else if (agg.type === 'SUM') {
        const sum = groupRows.reduce((acc, r) => acc + (Number(r[agg.col]) || 0), 0);
        outRow[agg.alias] = Number(sum.toFixed(2));
      } else if (agg.type === 'AVG') {
        const valid = groupRows.map((r) => Number(r[agg.col])).filter((n) => !isNaN(n));
        const avg = valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
        outRow[agg.alias] = Number(avg.toFixed(2));
      } else if (agg.type === 'MIN') {
        const valid = groupRows.map((r) => Number(r[agg.col])).filter((n) => !isNaN(n));
        outRow[agg.alias] = valid.length > 0 ? Math.min(...valid) : null;
      } else if (agg.type === 'MAX') {
        const valid = groupRows.map((r) => Number(r[agg.col])).filter((n) => !isNaN(n));
        outRow[agg.alias] = valid.length > 0 ? Math.max(...valid) : null;
      }
    });

    results.push(outRow);
  });

  return results;
}

interface AggregateDef {
  type: 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX';
  col: string;
  alias: string;
}

function parseSelectAggregates(selectStr: string | string[]): AggregateDef[] {
  const fields = typeof selectStr === 'string' ? selectStr.split(',').map((s) => s.trim()) : selectStr;
  const aggregates: AggregateDef[] = [];

  fields.forEach((field) => {
    const aggMatch = field.match(/(COUNT|SUM|AVG|MIN|MAX)\((.*?)\)(?:\s+AS\s+([a-zA-Z0-9_]+))?/i);
    if (aggMatch) {
      const type = aggMatch[1].toUpperCase() as any;
      const col = aggMatch[2].trim();
      const alias = aggMatch[3] || `${type.toLowerCase()}_${col === '*' ? 'all' : col}`;
      aggregates.push({ type, col, alias });
    }
  });

  return aggregates;
}

function executeSelect(rows: Record<string, any>[], selectFields: string): Record<string, any>[] {
  if (selectFields.trim() === '*') return rows;

  const rawFields = selectFields.split(',').map((f) => f.trim());
  const hasAggregates = rawFields.some((f) => /(COUNT|SUM|AVG|MIN|MAX)\(/i.test(f));

  if (hasAggregates) {
    const aggregates = parseSelectAggregates(rawFields);
    const summaryRow: Record<string, any> = {};
    aggregates.forEach((agg) => {
      if (agg.type === 'COUNT') {
        summaryRow[agg.alias] = agg.col === '*' ? rows.length : rows.filter((r) => r[agg.col] != null).length;
      } else if (agg.type === 'SUM') {
        const sum = rows.reduce((acc, r) => acc + (Number(r[agg.col]) || 0), 0);
        summaryRow[agg.alias] = Number(sum.toFixed(2));
      } else if (agg.type === 'AVG') {
        const valid = rows.map((r) => Number(r[agg.col])).filter((n) => !isNaN(n));
        summaryRow[agg.alias] = valid.length > 0 ? Number((valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(2)) : 0;
      } else if (agg.type === 'MIN') {
        const valid = rows.map((r) => Number(r[agg.col])).filter((n) => !isNaN(n));
        summaryRow[agg.alias] = valid.length > 0 ? Math.min(...valid) : null;
      } else if (agg.type === 'MAX') {
        const valid = rows.map((r) => Number(r[agg.col])).filter((n) => !isNaN(n));
        summaryRow[agg.alias] = valid.length > 0 ? Math.max(...valid) : null;
      }
    });
    return [summaryRow];
  }

  return rows.map((r) => {
    const selected: Record<string, any> = {};
    rawFields.forEach((f) => {
      const aliasMatch = f.match(/([a-zA-Z0-9_]+)\s+AS\s+([a-zA-Z0-9_]+)/i);
      if (aliasMatch) {
        selected[aliasMatch[2]] = r[aliasMatch[1]];
      } else if (r[f] !== undefined) {
        selected[f] = r[f];
      }
    });
    return selected;
  });
}
