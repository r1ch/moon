<template>
  <div>
    <div id="d3"></div>
  </div>
</template>

<script>
const d3 = require("d3");

export default {
  name: "sky-component",
  props: ["now", "angle", "illuminated", "times", "currentPosition"],
  data: function() {
    let full = {
      width: 600,
      height: 600
    };
    let margin = {
      top: 20,
      left: 20,
      right: 20,
      bottom: 20
    };
    let inner = {
      width: full.width - margin.left - margin.right,
      height: full.height - margin.top - margin.bottom
    };
    let moon = {
      radius: inner.width / 8
    };
    moon.offset = [inner.width / 2 - moon.radius, 0].join(",");
    let horizon = {
      width: inner.width,
      offset: [0, inner.height * 0.8].join(","),
      radius: 10
    };
    return {
      full: full,
      margin: margin,
      inner: inner,
      moon: moon,
      horizon: horizon
    };
  },
  mounted: function() {
    this.svg = d3
      .select("#d3")
      .append("svg")
      .attr("width", this.full.width)
      .attr("height", this.full.height)
      .append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

    this.moonSvg = this.svg
      .append("g")
      .attr(
        "transform",
        `translate(${this.moon.offset}) rotate(${this.angle}, ${this.moon.radius}, ${this.moon.radius})`
      );

    this.moonSvg
      .append("clipPath")
      .attr("id", "outer-clip")
      .append("circle")
      .attr("r", this.moon.radius)
      .attr("cx", this.moon.radius)
      .attr("cy", this.moon.radius);

    this.horizonSvg = this.svg
      .append("g")
      .attr("transform", `translate(${this.horizon.offset})`);

    let defs = this.svg.append("defs");
    let filter = defs.append("filter").attr("id", "glow");

    filter
      .append("feGaussianBlur")
      .attr("stdDeviation", "3.5")
      .attr("result", "moonShine");

    let feMerge = filter.append("feMerge");

    feMerge.append("feMergeNode").attr("in", "moonShine");

    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    this.draw();
  },
  watch: {
    now: function() {
      this.draw();
    }
  },
  computed: {
    phase() {
      let phase = 1 - this.illuminated / 2;
      return phase;
    }
  },
  methods: {
    sweeps: function(radius, phase) {
      let sweeps = {
        lit: [`M ${radius} 0`],
        dark: [`M ${radius} 0`]
      };

      // eslint-disable-next-line
      sweeps.lit.push(`a ${radius * (phase <= 0.5 ? 4 * Math.abs(phase - 0.25) : 1)}, ${radius} 0 0 ${phase <= 0.25 ? 1 : 0} 0,${2 * radius}`);
      // eslint-disable-next-line
      sweeps.lit.push(`a ${radius * (phase <= 0.5 ? 1 : 4 * Math.abs(phase - 0.75))}, ${radius} 0 0 ${phase <= 0.75 ? 0 : 1} 0,${-2 * radius}`);
      // eslint-disable-next-line
      sweeps.dark.push(`a ${radius * (phase <= 0.5 ? 1 : 4 * Math.abs(phase - 0.75))},${radius} 0 0 ${phase > 0.5 && phase <= 0.75 ? 1 : 0} 0,${2 * radius}`);
      // eslint-disable-next-line
      sweeps.dark.push(`a ${radius * (phase <= 0.5 ? 4 * Math.abs(phase - 0.25) : 1)},${radius} 0 0 ${phase >= 0.25 && phase < 0.5 ? 1 : 0} 0,${-2 * radius}`);
      return sweeps;
    },
    draw: function() {
      let moonSweeps = this.sweeps(this.moon.radius, this.phase);
      let horizonSweeps = this.sweeps(this.horizon.radius, this.phase);

      this.moonSvg
        .selectAll(".moonlit")
        .data([1])
        .join(enter =>
          enter
            .append("path")
            .attr("class", "moonlit")
            .attr("clip-path", "url(#outer-clip)")
        )
        .attr("d", `${moonSweeps.lit.join(" ")}`);

      this.moonSvg
        .selectAll(".moondark")
        .data([1])
        .join(enter =>
          enter
            .append("path")
            .attr("class", "moondark")
            .attr("clip-path", "url(#outer-clip)")
        )
        .attr("d", `${moonSweeps.dark.join(" ")}`)
        .style("filter", "url(#glow)");

      let horizonScale = d3
        .scaleTime()
        .domain([
          this.times.detail[0].time,
          this.times.detail[this.times.detail.length - 1].time
        ])
        .range([0, this.horizon.width]);

      let altitudeScale = d3
        .scaleLinear()
        .domain([-1*this.times.absAlt, this.times.absAlt])
        .range([50, -50]);

      let horizonAxis = d3.axisBottom().scale(horizonScale);

      let lineGenerator = entries => {
        let curve = entries
          .map(
            d => `L ${horizonScale(d.time)} ${altitudeScale(d.position.alt)}`
          )
          .join(" ");
        return `M ${horizonScale(entries[0].time)} ${altitudeScale(
          entries[0].position.alt
        )}  ${curve}`;
      };

      this.horizonSvg
        .selectAll(".axis")
        .data([1])
        .join(enter => enter.append("g").attr("class", "axis"))
        .call(horizonAxis);

      this.horizonSvg
        .selectAll(".risePath")
        .data([this.times.detail])
        .join(enter => enter.append("path").attr("class", "risePath"))
        .attr("d", d => lineGenerator(d));

      /*this.horizonSvg
        .selectAll(".tinydark")
        .data([1])
        .join(enter => enter.append("path").attr("class", "tinydark"))
        .attr("d", `${horizonSweeps.dark.join(" ")}`)
        .attr("transform-origin","center")
        .attr(
          "transform",
          `translate(${horizonScale(this.now)},${altitudeScale(this.currentPosition.alt)})`
        );*/

      this.horizonSvg
        .selectAll(".tinylit")
        .data([1])
        .join(enter => enter.append("path").attr("class", "tinylit"))
        .attr("d", `${horizonSweeps.lit.join(" ")}`)
        .attr(
          "transform",
          `translate(${horizonScale(this.now)-this.horizon.radius},${altitudeScale(this.currentPosition.alt)- this.horizon.radius})`
        );
    }
  }
};
</script>

<style>
.moonlit {
  fill: white;
  stroke: black;
}
.moondark {
  fill: #444;
  stroke: ;
}
.orbit {
  fill: none;
  stroke: black;
  stroke-width: 1px;
  stroke-dasharray: 2 2;
}

.tinylit {
  fill: rgba(255, 255, 255, 0.75);
  stroke: black;
  stroke-width: 1px;
}
.tinydark {
  fill: black;
  stroke: none;
}
.risePath {
  fill: none;
  stroke: black;
  stroke-width: 1px;
}
</style>
