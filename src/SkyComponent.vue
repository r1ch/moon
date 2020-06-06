<template>
  <div>
    <div id="d3"></div>
  </div>
</template>

<script>
const d3 = require("d3");

export default {
  name: "sky-component",
  props: ["now", "angle", "illuminated"],
  data: function() {
    let full = {
      width: 300,
      height: 300
    };
    let margin = {
      top: 10,
      left: 10,
      right: 10,
      bottom: 10
    };
    let inner = {
      width: full.width - margin.left - margin.right,
      height: full.height - margin.top - margin.bottom
    };
    return {
      full: full,
      margin: margin,
      inner: inner,
      radius: Math.min(inner.width, inner.height) / 2
    };
  },
  mounted: function() {
    this.svg = d3
      .select("#d3")
      .append("svg")
      .attr("width", this.full.width)
      .attr("height", this.full.height)
      .append("g")
      .attr(
        "transform",
        `translate(${this.margin.left}, ${this.margin.top}) rotate(${
          this.angle
        }, ${this.inner.width / 2}, ${this.inner.height / 2})`
      );

    this.svg
      .append("circle")
      .attr("class", "orb")
      .attr("r", this.inner.height / 2 - 25)
      .attr("cx", this.inner.width / 2)
      .attr("cy", this.inner.height / 2);

    this.svg
      .append("clipPath")
      .attr("id", "outer-clip")
      .append("circle")
      .attr("r", this.radius)
      .attr("cx", this.inner.width / 2)
      .attr("cy", this.inner.height / 2);

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
      return 1 - this.illuminated / 2;
    }
  },
  methods: {
    draw: function() {
      let sweeps = {
        lit: [],
        dark: []
      };

      // eslint-disable-next-line
      sweeps.lit.push(`a ${this.radius * (this.phase <= 0.5 ? 4 * Math.abs(this.phase - 0.25) : 1)}, ${this.radius} 0 0 ${this.phase <= 0.25 ? 1 : 0} 0,${2 * this.radius}`);
      // eslint-disable-next-line
      sweeps.lit.push(`a ${this.radius * (this.phase <= 0.5 ? 1 : 4 * Math.abs(this.phase - 0.75))}, ${this.radius} 0 0 ${this.phase <= 0.75 ? 0 : 1} 0,${-2 * this.radius}`);
      // eslint-disable-next-line
      sweeps.dark.push(`a ${this.radius * (this.phase <= 0.5 ? 1 : 4 * Math.abs(this.phase - 0.75))},${this.radius} 0 0 ${this.phase > 0.5 && this.phase <= 0.75 ? 1 : 0} 0,${2 * this.radius}`);
      // eslint-disable-next-line
      sweeps.dark.push(`a ${this.radius * (this.phase <= 0.5 ? 4 * Math.abs(this.phase - 0.25) : 1)},${this.radius} 0 0 ${this.phase >= 0.25 && this.phase < 0.5 ? 1 : 0} 0,${-2 * this.radius}`);

      this.svg
        .selectAll(".moonlit")
        .data([1])
        .join(enter =>
          enter
            .append("path")
            .attr("class", "moonlit")
            .attr("clip-path", "url(#outer-clip)")
        )
        .attr(
          "d",
          `M ${this.inner.width / 2} 
          ${this.inner.height / 2 - this.radius} 
          ${sweeps.lit.join(" ")}`
        );

      this.svg
        .selectAll(".moondark")
        .data([1])
        .join(enter =>
          enter
            .append("path")
            .attr("class", "moondark")
            .attr("clip-path", "url(#outer-clip)")
        )
        .attr(
          "d",
          `M ${this.inner.width / 2} 
          ${this.inner.height / 2 - this.radius} 
          ${sweeps.dark.join(" ")}`
        )
        .style("filter", "url(#glow)");
    }
  }
};
</script>

<style>
.moonlit {
  fill: palegoldenrod;
  stroke: none;
}
.moondark {
  fill: #444;
  stroke: none;
}
.orb {
  fill: none;
  stroke: rgba(255, 255, 255, 0.5);
  stroke-width: 50px;
}
</style>
