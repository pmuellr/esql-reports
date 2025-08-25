// only types, used for validation in vscode

export type TidyData = Array<Record<string, unknown>>

export interface Esql {
  query(url: string, query: string): Promise<TidyData>
}
export type { Val, Err, ValOrErr } from './val-or-error.js'

export interface Cli {
  args:    string[]
  es:      string
  help:    boolean
  version: boolean
  debug:   boolean
}

export interface EsqlResponse {
  columns: { name: string, type: string }[]
  values:  unknown[][]
  error?:  unknown
}

export type RequestCredentials = 'omit' | 'include' | 'same-origin'

export interface RequestInit {
  method:       string
  headers?:     Record<string, string>
  body?:        string
  credentials?: RequestCredentials
}

export interface UrlParsed {
  url:  string
  fetchOpts: RequestInit
}

