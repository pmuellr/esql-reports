// Each ES|QL query has it's own name, define them here.  The results
// of the queries are available in getVegaLiteSpec()'s esql parameter.

/** @typedef { { eventLog: string   } } EsqlQuery */
/** @typedef { { eventLog: TidyData } } EsqlResult */

const NanosInASecond = 1000 * 1000 * 1000 * 1.0

const EsqlEventLog = `
  FROM .kibana-event-log-*

  | WHERE event.provider == "alerting"
  | WHERE event.action   == "execute"
  | WHERE event.outcome  == "failure"

  | RENAME rule.category  AS type
  | RENAME @timestamp     AS date
  | RENAME event.duration AS duration

  | KEEP date, type, duration

  | SORT date desc
  | LIMIT 10000
`.trim()

/** @type { () => Promise<EsqlQuery> }} */
export async function getEsql() { return { eventLog: EsqlEventLog } }


/** @type { (esql: EsqlResult) => Promise<VegaLiteSpec> } */
export async function getVegaLiteSpec(esql) {
  // tried to fix this in ES|QL, but oddly couldn't get it
  for (const row of esql.eventLog) {
    row.duration /= NanosInASecond
  }

  return {
    $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
    title: 'Rule execution failures by type',
    data: { values: esql.eventLog },
    mark: 'point',
    height: 600,
    width:  800,
    encoding: {
      x: { 
        field: 'date',     
        type: 'temporal' 
      },
      y: { 
        field: 'duration', 
        title: 'duration (seconds)',
        type: 'quantitative', 
        scale: { type: 'log' }
      },
      color: { 
        field: 'type',     
        type: 'nominal'
      },
    }
  }  
}

// reusable boilerplate typedefs
/** @typedef { Array<Record<string, any>> } TidyData */
/** @typedef { import('vega-lite').TopLevelSpec } VegaLiteSpec */

// Note: vega-lite is nice to have available like this for IDEs
// that support code assist with JSDoc, for Javascript, like VS Code.
