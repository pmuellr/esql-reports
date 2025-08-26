// Each ES|QL query has it's own name, define them here.  The results
// of the queries are available in getVegaLiteSpec()'s esql parameter.

/** @typedef { { eventLog: string   } } EsqlQuery */
/** @typedef { { eventLog: TidyData } } EsqlResult */

const NanosInASecond = 1000 * 1000 * 1000 * 1.0

const EsqlEventLog = `
  FROM .kibana-event-log-*

  | WHERE event.provider == "actions"
  | WHERE event.action   == "execute"

  | RENAME kibana.action.type_id  AS type
  | RENAME @timestamp             AS date
  | EVAL   duration = event.duration / 1000000000.0

  | KEEP date, type, duration

  | SORT date desc
  | LIMIT 5000
`.trim()

/** @type { () => Promise<EsqlQuery> }} */
export async function getEsql() { return { eventLog: EsqlEventLog } }


/** @type { (esql: EsqlResult) => Promise<VegaLiteSpec> } */
export async function getVegaLiteSpec(esql) {
  return {
    $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
    title: 'Connector execution duration by type',
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
        // scale: { type: 'log' }
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
