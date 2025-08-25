import * as vega from 'vega';
import * as vegalite from 'vega-lite';

/** @type { (vegaLiteSpec: vegalite.TopLevelSpec) => Promise<string> } */
export async function vegaLiteSpecToSvg(vegaLiteSpec) {
  const vegaSpec = vegalite.compile(vegaLiteSpec).spec
  const config = {
    // https://github.com/vega/altair/issues/978
    legend: {
      labelLimit: 0,
      labelFontSize: 32,
      titleFontSize: 36,
    },
    title: {
      fontSize: 40
    },
    axis: {
      labelFontSize: 32,
      titleFontSize: 36,
    },
  }    

  const runtime = vega.parse(vegaSpec, config)
  const view = new vega.View(runtime, { renderer: 'none' }).finalize()

  return await view.toSVG()
}
