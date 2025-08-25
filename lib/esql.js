import { log } from './log.js'

/** @type { (url: string, query: string) => Promise<TidyData> } */
export async function query(url, query) {
  const response = await esqlQueryRaw(url, query)
  return esqlResponseAsTidyData(response)
}

/** @type { (url: string, query: string, headers: Record<string, string>) => Promise<Response | undefined> } */
async function runEsqlQuery(url, query, headers) {
  /** @type { RequestInit } */
  const options = {
    method: 'POST',
    body: JSON.stringify({ query }),
    headers,
  }
  try {
    const response = await fetch(`${url}_query`, options)
    return response
  } catch (e) {
    log(`error running query: ${e.message}; cause: ${e.cause?.message || 'unknown'}`)
    return
  }
}

/** @type { (url: string, query: string) => Promise<EsqlResponse> } */
async function esqlQueryRaw(url, query) {
  const { url: fetchUrl, fetchOpts } = urlToFetchArgs(url)
  const { headers } =  fetchOpts
  const response = await runEsqlQuery(fetchUrl, query, headers || {})

  return await response?.json() || { columns: [], values: [] }
}

/** @type { Map<string, UrlParsed> } */
const cachedUrlFetchArgs = new Map();

/** @type { (url: string) => UrlParsed } */
function urlToFetchArgs(url) {
  const cached = cachedUrlFetchArgs.get(url)
  if (cached) return cached

  const parsedUrl = new URL(url)
  const { origin, username, password, pathname, search } = parsedUrl

  if (username && password == undefined) {
    throw new Error ('in URL, username was provided, but no password')
  }
  if (password && username == undefined) {
    throw new Error ('in URL, password was provided, but no username')
  }
  
  /*
    new URL('https://user:pass@host.name:1963/path/to?q=a&p=b#frag')
    URL {
      href: 'https://user:pass@host.name:1963/path/to?q=a&p=b#frag',
      origin: 'https://host.name:1963',
      protocol: 'https:',
      username: 'user',
      password: 'pass',
      host: 'host.name:1963',
      hostname: 'host.name',
      port: '1963',
      pathname: '/path/to',
      search: '?q=a&p=b',
      searchParams: URLSearchParams { 'q' => 'a', 'p' => 'b' },
      hash: '#frag'
    }  
  */

  const actualUrl = `${origin}${pathname}`

  /** @type { Record<string, string> } */
  const headers = {
    'Content-Type': 'application/json',
  }

  const apiKeyUserName = 'API-KEY'
  if (username) {
    if (username !== apiKeyUserName) {
      const credentials = `${username}:${password}`
      const base64Credentials = Buffer.from(credentials).toString('base64')
      headers.Authorization = `Basic ${base64Credentials}`
    } else {
      headers.Authorization = `ApiKey ${decodeURIComponent(password)}`
    }
  }

  /** @type { UrlParsed } */
  const result = {
    url: actualUrl,
    fetchOpts: {
      method: 'POST',
      headers,
      body: ''
    }
  }

  cachedUrlFetchArgs.set(url, result)
  return result
}

/** @type { (esqlResponse: EsqlResponse) => TidyData } */
function esqlResponseAsTidyData(esqlResponse) {
  if (esqlResponse.error) {
    throw new Error(`response contained error: ${JSON.stringify(esqlResponse, null, 2)}`)
  }

  if (esqlResponse.columns == null) {
    throw new Error(`response contained no columns: ${JSON.stringify(esqlResponse, null, 2)}`)
  }

  if (esqlResponse.values == null) {
    throw new Error(`response contained no values: ${JSON.stringify(esqlResponse, null, 2)}`)
  }

  const names = esqlResponse.columns.map(c => c.name)

  const isDate = new Map()
  for (const column of esqlResponse.columns) {
    isDate.set(column.name, column.type === "date")
  }
  
  return esqlResponse.values.map(value => {
    /** @type { Record<string, unknown> } */
    const obj = {}
    for (let i = 0; i < names.length; i++) {
      if (isDate.get(names[i])) {
        value[i] = new Date(`${value[i]}`)
      } 
      obj[names[i]] = value[i]
    }
    return obj
  })
}

/** @typedef { import('./types.ts').TidyData } TidyData */
/** @typedef { import('./types.ts').EsqlResponse } EsqlResponse */
/** @typedef { import('./types.ts').RequestInit } RequestInit */
/** @typedef { import('./types.ts').RequestCredentials } RequestCredentials */
/** @typedef { import('./types.ts').UrlParsed } UrlParsed */
