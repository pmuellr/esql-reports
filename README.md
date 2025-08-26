esql-reports - ES|QL PDF Reports with Vega-Lite and Typst
================================================================================

So many buzz-words!:

- [ES|QL][] - generate data from Elasticsearch
- [Vega Lite][] - generate visualizations
- [Typst][] - generate documents

[Typst]:     https://typst.app/
[Vega Lite]: https://vega.github.io/vega-lite/
[ES|QL]:     https://www.elastic.co/docs/explore-analyze/query-filter/languages/esql

The basic idea is you create dashboard visualizations in Vega Lite, using
data from Elasticsearch ES|QL queries, and then organize them in a Typst
document.

This tool will scan the Typst document for matches of this form:

    #figure(image("event-log-rule-duration.svg"))

For each of those images, it will look for a script, named the same as
the image file, but with a `.js` suffix.  That script will contain the
ES|QL queries to run, and a VegaLite spec to display a visualization.
The queries will be run, then the VegaLite spec will be processed into
a `.svg` file using the data from the ES|QL queries.  Finally, `typst`
will be run on the Typst document to generate a `.pdf` file.

But why?

To explore building PDF-able reports using ES|QL.  There's nothing special
about Typst or Vega-Lite, besides they work well here.  In fact, I started
using a different library (Observable Plot) which didn't actually support
generating "pure" SVG output.  Had to go!  

But somehow, you a graphics library you can feed ES|QL data, and some
nice way to render to a PDF, PNG, etc.  Felt like a pretty nice approach
in terms of the mechanics.

Longer term


- We'd want a better way of indicating images to be generated in the
  `.typ` input file.
- We'd want to figure out a good story for layout - probably 2, 3, 4
  column layouts with all the options of spanning.  And then a width
  for those to feed to Vega-Lite, given they're position.  Probably
  write some Typst code to help with this.  I think we'd want to 
  assume all graphs are the same "size", in terms of text included
  in the graphs, etc.

example
========================================================================

Examples are available in the [`samples`](https://github.dev/pmuellr/esql-reports/tree/main) directory.

**file `event.log.typ`**

This is the "main" file.  images referenced from here in this format
will be regenerated from same-named scripts.

There's no special formatting with this, because I have no idea what
I'm doing with Typst, yet.

```typ
#set page(
  paper: "us-letter",
  margin: (x: 4pt, y: 4pt),  
)

#figure(image("event-log-rule-duration.svg"))
#figure(image("event-log-rule-errors.svg"))
#figure(image("event-log-conn-duration.svg"))
#figure(image("event-log-conn-errors.svg"))
```

**file `event-log-rule-duration.svg.js`**

This is the module that will generate `event-log-rule-duration.svg`.

```js
// Each ES|QL query has it's own name, define them here.  The results
// of the queries are available in getVegaLiteSpec()'s esql parameter.
// The types of the properties here are always the same - string for
// EsqlQuery and TidyData for EsqlResult, and the names of the properties
// you pick yourself and add to both types.

/** @typedef { { eventLog: string   } } EsqlQuery */
/** @typedef { { eventLog: TidyData } } EsqlResult */

const EsqlEventLog = `
  FROM .kibana-event-log-*

  | WHERE event.provider == "alerting"
  | WHERE event.action   == "execute"

  | RENAME rule.category  AS type
  | RENAME @timestamp     AS date
  | EVAL   duration = event.duration / 1000000000.0

  | KEEP date, type, duration

  | SORT date desc
  | LIMIT 5000
`.trim()

// one of the entrypoints of this module: to get the ES|QL
/** @type { () => Promise<EsqlQuery> }} */
export async function getEsql() { return { eventLog: EsqlEventLog } }

// one of the entrypoints of this module: to get the VegaLite spec, given the data
/** @type { (esql: EsqlResult) => Promise<VegaLiteSpec> } */
export async function getVegaLiteSpec(esql) {
  return {
    $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
    title: 'Rule execution duration by type',
    mark: 'point',
    height: 600, width:  800,
    data: { values: esql.eventLog },
    encoding: {
      x: { field: 'date', type: 'temporal' },
      y: { field: 'duration', type: 'quantitative', 
        title: 'duration (seconds)', scale: { type: 'log' }, },
      color: { field: 'type', type: 'nominal' },
    }
  }  
}

// reusable boilerplate typedefs
/** @typedef { Array<Record<string, any>> } TidyData */
/** @typedef { import('vega-lite').TopLevelSpec } VegaLiteSpec */

// Note: vega-lite is nice to have available like this for IDEs
// that support code assist with JSDoc, for Javascript, like VS Code.
```

The other modules are similar.

To generate the PDF, run

```console
$ npx pmuellr/esql-reports samples/event-log/event-log.typ
esql-reports: processed file samples/event-log/event-log.typ
```

The first page of the `event-log` sample will render as below.

I obviously have a lot to learn about Typst, and need to figure out how
to consistently scale visualizations within the page :-)

![sample pdf page](samples/event-log/event-log-pdf.png)


install
================================================================================

    npm install -g pmuellr/esql-reports

or run via

    npx pmuellr/esql-reports
    
usage
================================================================================

    esql-reports <typst file>

options:

| short | long                 | description
| ----- |--------------------- | ---------------------------------------------
| `-e`  | `--es`               | Elasticsearch server url
| `-h`  | `--help`             | display help
| `-d`  | `--debug`            | generate verbose output when running
| `-v`  | `--version`          | print version

The default Elasticsearch server url is `http://elastic:changeme@localhost:9200`.
The environment variable `ES_URL` can also be used.  The command-line option
takes precendence.

If you use an API-key to auth to Elasticsearch, specify it like the Basic
auth `user:pass`, but use `API-KEY` as the `user`, and the API key value
itself as `pass`.  Sorry, user named `API-KEY`!


change log
================================================================================

#### 1.0.0 - 2025-08-22

- barely working


license
================================================================================

This package is licensed under the MIT license.  See the [LICENSE.md][] file
for more information.


contributing
================================================================================

Awesome!  We're happy that you want to contribute.

Please read the [CONTRIBUTING.md][] file for more information.


[LICENSE.md]: LICENSE.md
[CONTRIBUTING.md]: CONTRIBUTING.md
[CHANGELOG.md]: CHANGELOG.md