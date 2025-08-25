/**
 *  @template V 
 *  @typedef { import('./types.ts').ValOrErr<V> } ValOrErr */
/** @typedef { import('./types.ts').Cli } Cli */

import meow from 'meow'

import { log } from './log.js'

export const DEFAULT_CONFIG = '~/.es-ccs-proxy.toml'
export const OUTPUT_PLAIN = 'plain'
export const OUTPUT_ENV   = 'env'

/** @type { (argv: string[]) => Cli } */
export function getCli(argv) {
  const esUrl = process.env.ES_URL || 'http://elastic:changeme@localhost:9200'
  const cliOptions = meow({
    argv,
    flags: {
      es:      { shortFlag: 'e', type: 'string',  default: esUrl },
      debug:   { shortFlag: 'd', type: 'boolean', default: false },
      help:    { shortFlag: 'h', type: 'boolean', default: false },
      version: { shortFlag: 'v', type: 'boolean', default: false },
    },
    importMeta: import.meta,
    autoHelp: false,
    autoVersion: false,
  })

  const flags = cliOptions.flags
  const result = {
    args:       cliOptions.input,
    es:         flags.es,
    debug:      !!flags.debug,
    help:       !!flags.help,
    version:    !!flags.version,
  }
  return result
}