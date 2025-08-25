import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
/** @typedef { import('node:child_process').SpawnSyncReturns<Buffer<ArrayBufferLike>> } SpawnSyncReturns */
import { log } from './log.js'

/** @type { (file: string) => Promise<void>} */
export async function compile(file) {
  await run(['compile', file])
}

/** @type { (file: string) => Promise<string[]>} */
export async function getImages(file) {
  const contents = readFileSync(file, 'utf-8')
  const lines = contents.split('\n').map(l => l.trim())

  const images = lines
    .map(l => {
      const matches = l.match(/#figure\(image\(\"(.*)\"\)\)/)
      return matches && matches[1]
    })
    .filter(i => i != null)

  return images
}

/** @type { (args: string[]) => Promise<SpawnSyncReturns>} */
export async function run(args) {
  const result = spawnSync('typst', args)
  checkForSpawnErrors(args, result)
  return result
}

/** @type { (args: string[], result: SpawnSyncReturns) => void } */
function checkForSpawnErrors(args, result) {
  const argsList = args.map(a => JSON.stringify(a)).join(' ')
  const { stdout, output, signal, status, stderr, error } = result

  let cause = ''
  if (signal) {
    cause = `killed by signal ${signal}`
  }
  if (status) {
    cause = `exited with status ${status}`
  }

  if (cause === '') return

  log(`typst error: ${cause}`)
  log('stdout:')
  log(stdout.toString())
  log('stderr:')
  log(stderr.toString())
  process.exit(1)
}
