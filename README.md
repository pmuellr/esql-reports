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

Examples are available in the [`samples`](https://github.com/pmuellr/esql-reports/tree/main/samples/)
directory.  The first page of the `event-log` sample will render as below.

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