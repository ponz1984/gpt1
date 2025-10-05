declare module 'rollup/parseAst' {
  export function parseAst(code: string, options?: unknown): unknown;
  export function parseAstAsync(code: string, options?: unknown): Promise<unknown>;
}

declare module 'papaparse' {
  export interface ParseError {
    type: string;
    code: string;
    message: string;
    row: number;
  }

  export interface ParseMeta {
    delimiter: string;
    linebreak: string;
    aborted: boolean;
    truncated: boolean;
    fields?: string[];
  }

  export interface ParseResult<T> {
    data: T[];
    errors: ParseError[];
    meta: ParseMeta;
  }

  export interface ParseConfig<T = unknown> {
    header?: boolean;
    skipEmptyLines?: boolean | 'greedy';
    dynamicTyping?: boolean | Record<string, boolean>;
    transform?(value: string, field?: string | number): T;
  }

  export function parse<T = unknown>(input: string, config?: ParseConfig<T>): ParseResult<T>;

  const Papa: {
    parse: typeof parse;
  };

  export default Papa;
}
