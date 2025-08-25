#!/usr/bin/env node --use-system-ca

import fs from 'node:fs/promises'
import path from 'node:path'
import * as typst from './lib/typst.js'

import { log } from './lib/log.js'
import { pkg } from './lib/pkg.js'
import { getCli } from './lib/cli.js'
import * as esqlLib from './lib/esql.js'
import { vegaLiteSpecToSvg } from './lib/vegalite.js'

main()

async function main() {
  // get cli arguments, read and generate config
  const cli = getCli(process.argv.slice(2))
  const { args, help, version, debug, es } = cli

  log.setDebug(!!debug)
  log.debug(`cli: ${JSON.stringify(cli)}`)

  // handle flags
  if (help || args.length === 0) { console.log(await getHelp()); process.exit(1) }
  if (version) { console.log(pkg.version); process.exit(1) }

  setTimeout(async () => {
    try {
      await start(args, es)
    } catch (err) {
      log.exit(`error: ${err.message}\n${err.stack}`, 1)
    }
  })
}

/** @type { (files: string[], url: string) => Promise<void> } */
async function start(files, url) {
  for (const file of files) await processFile(file, url)
}

/** @type { (file: string, url: string) => Promise<void> } */
async function processFile(file, url) {
  const images = await typst.getImages(file)
  log.debug(`processing images in ${file}: ${JSON.stringify(images)}`)

  const scripts = await getScripts(file, images)
  for (const script of scripts) {
    log.debug(`processing script from ${file}: ${script}`)
    await processScript(script, url)
  }

  typst.compile(file)
  log(`processed file ${file}`)
}

/** @type { (script: string, url: string) => Promise<void> } */
async function processScript(script, url) {
  const scriptPath = path.resolve(script)
  const exports = await import(scriptPath)
  if (!exports.getEsql) {
    log(`script ${script} does not export a getEsql() function, ignored`)
    return
  }
  if (!exports.getVegaLiteSpec) {
    log(`script ${script} does not export a getVegaLiteSpec() function, ignored`)
    return
  }
  
  /** @type { GetEsql }} */ 
  const getEsql = exports.getEsql 

  /** @type { GetVegaLiteSpec }} */ 
  const getVegaLiteSpec = exports.getVegaLiteSpec

  const esql = await getEsql()
  const keys = Object.keys(esql)

  /** @type { Record<string, TidyData> }  */
  const data = {}
  for (const key of keys) {
    const query = esql[key]
    data[key] = await esqlLib.query(url, query)
  }

  const vegaLiteSpec = await getVegaLiteSpec(data)
  const svg = await vegaLiteSpecToSvg(vegaLiteSpec)
  const imageFile = script.slice(0,-3) // remove .js suffix
  await fs.writeFile(imageFile, svg)
}

/** @type { (file: string, images: string[]) => Promise<string[]> } */
async function getScripts(file, images) {
  const result = [''] // get the variable typed with a hack :-)
  result.pop() 

  const baseDir = path.dirname(file)

  for (const image of images) {
    const scriptBase = `${image}.js`
    const scriptName = path.join(baseDir, scriptBase)

    if (!fileExists(scriptName)) continue
    result.push(scriptName)
  }

  return result
}

/** @type { (file: string) => Promise<boolean>}  */
async function fileExists(file) {
  try {
    await fs.access(file, fs.constants.R_OK)
    return true
  } catch (e) {
    return false
  }
}

/** @type { () => Promise<string> } */
async function getHelp() {
  const thisFile = new URL(import.meta.url).pathname
  const thisDir = path.dirname(thisFile)
  return await fs.readFile(`${thisDir}/README.md`, 'utf-8')
}

/** @typedef { import('./lib/types.ts').TidyData } TidyData */
/** @typedef { Record<string, string> } EsqlQuery */
/** @typedef { Record<string, any> } EsqlResult */
/** @typedef { () => Promise<Record<string, string>> } GetEsql } */
/** @typedef { (esql: EsqlResult) => Promise<VegaLiteSpec> } GetVegaLiteSpec */
/** @typedef { import('vega-lite').TopLevelSpec } VegaLiteSpec */
