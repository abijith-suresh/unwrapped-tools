import {
  createDiffRows,
  DIFF_CONTEXT,
  type DiffRow,
  type DiffStats,
  filterRowsWithContext,
  getChangeSourceIndices,
  getDiffStats,
  type IndexedDiffRow,
} from "./diff";
import type { Language } from "./language";
import {
  prepareStructuredCompare,
  type StructuredCompareError,
  type StructuredCompareResult,
} from "./structuredCompare";

export interface DiffAnalysisInput {
  original: string;
  modified: string;
  leftLanguage: Language;
  rightLanguage: Language;
  changesOnly: boolean;
  context?: number;
}

export interface DiffAnalysisResult {
  strategy: StructuredCompareResult["strategy"];
  errors: StructuredCompareError[];
  rows: DiffRow[];
  filteredRows: IndexedDiffRow[];
  stats: DiffStats;
  changeIndices: number[];
  isIdentical: boolean;
}

export function analyzeDiff(input: DiffAnalysisInput): DiffAnalysisResult {
  const preparedCompare = prepareStructuredCompare({
    original: input.original,
    modified: input.modified,
    leftLanguage: input.leftLanguage,
    rightLanguage: input.rightLanguage,
  });
  const rows = createDiffRows(preparedCompare.original, preparedCompare.modified);
  const filteredRows = filterRowsWithContext(
    rows,
    input.changesOnly,
    input.context ?? DIFF_CONTEXT
  );
  const stats = getDiffStats(rows);

  return {
    strategy: preparedCompare.strategy,
    errors: preparedCompare.errors,
    rows,
    filteredRows,
    stats,
    changeIndices: getChangeSourceIndices(rows),
    isIdentical: stats.added === 0 && stats.removed === 0,
  };
}
