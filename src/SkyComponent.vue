<template>
  <div>
    <div id="d3"></div>
  </div>
</template>

<script>
const d3 = require("d3");

export default {
  name: "sky-component",
  props: ["now", "position", "phase"],
  data: () => {
    let full = {
      width: 600,
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
      inner: inner
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
        `translate(${this.margin.left}, ${this.margin.top}) 
        rotate(20, ${this.inner.width / 2}, ${this.inner.height / 2})`
      );

    this.svg
      .append("clipPath")
      .attr("id", "outer-clip")
      .append("circle")
      .attr("r", "50")
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
  },
  watch: {
    now: function() {
      this.draw();
    }
  },
  methods: {
    draw: function() {
      let sweeps = {
        lit: [],
        dark: []
      };

      let radius = Math.min(this.inner.width,this.inner.height)/2

      sweeps.lit.push(
        `a ${radius * (this.phase <=0.5 ? 4*Math.abs(this.phase - 0.25) : 1)},${radius} 0 0 ${this.phase <=0.25 ? 1 : 0} 0,${2 * radius}`
      );
      sweeps.lit.push(
        `a ${radius * (this.phase <=0.5 ? 1 : 4*Math.abs(this.phase - 0.75))},${radius} 0 0 ${this.phase <=0.75 ? 0 : 1} 0,${-2 * radius}`
      );

      sweeps.dark.push(
        `a ${radius * (this.phase <=0.5 ? 1 : 4*Math.abs(this.phase - 0.75))},${radius} 0 0 ${this.phase > 0.5 && this.phase <= 0.75 ? 1 : 0} 0,${2 * radius}`
      );
      sweeps.dark.push(
        `a ${radius * (this.phase <=0.5 ? 4*Math.abs(this.phase - 0.25) : 1)},${radius} 0 0 ${this.phase >= 0.25 && this.phase < 0.5 ? 1 : 0} 0,${-2 * radius}`
      );

      this.svg
        .selectAll(".moondark")
        .data([1])
        .join(
          enter => enter.append("path").attr("class", "moondark")
          //.attr("clip-path", "url(#outer-clip)")
        )
        .attr(
          "d",
          `M ${this.inner.width / 2} 
          ${this.inner.height / 2 - radius} 
          ${sweeps.dark.join(" ")}`
        );

      this.svg
        .selectAll(".moonlit")
        .data([1])
        .join(
          enter => enter.append("path").attr("class", "moonlit")
          //.attr("clip-path", "url(#outer-clip)")
        )
        .attr(
          "d",
          `M ${this.inner.width / 2} 
          ${this.inner.height / 2 - radius} 
          ${sweeps.lit.join(" ")}`
        )
        .style("filter", "url(#glow)");
    }
  }
};
</script>

<style>
.moonlit {
  fill: yellow;
  stroke: none;
}
.moondark {
  fill: gray;
  stroke: none;
}
</style>
