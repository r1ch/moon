<template>
  <div>
    <div id="d3"></div>
  </div>
</template>

<script>
const d3 = require("d3");

export default {
  name: "sky-component",
  props: ["now", "angle", "illuminated","moonPosition"],
  data: function() {
    let full = {
      width: 600,
      height: 600
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
    let moon = {
      radius: inner.width/8,
    };
    moon.offset = [inner.width/2-moon.radius, 0].join(",");
    let orb = {
      radius: inner.height/3
    };
    let tiny = {
      radius: 10
    };
    orb.offset = [inner.width/2-orb.radius, inner.height-2*orb.radius].join(",")
    return {
      full: full,
      margin: margin,
      inner: inner,
      moon: moon,
      orb:orb,
      tiny:tiny
    };
  },
  mounted: function() {
    this.svg = d3
      .select("#d3")
      .append("svg")
      .attr("width", this.full.width)
      .attr("height", this.full.height)
      .append("g")
      .attr("transform",`translate(${this.margin.left},${this.margin.top})`)
      
    this.disk = this.svg
      .append("g")
      .attr("transform",`translate(${this.moon.offset}) rotate(${this.angle}, ${this.moon.radius}, ${this.moon.radius})`);

    this.disk
      .append("clipPath")
      .attr("id", "outer-clip")
      .append("circle")
      .attr("r", this.moon.radius)
      .attr("cx", this.moon.radius)
      .attr("cy", this.moon.radius);

    this.orbit = this.svg
      .append("g")
      .attr("transform",`translate(${this.orb.offset})`);

    this.orbit
      .append("path")
      .attr("d",`M 0 ${this.orb.radius} l ${this.orb.radius*2} 0`)
      .attr("class","horizon")

    this.orbit
      .append("circle")
      .attr("class","orbit")
      .attr("r", this.orb.radius)
      .attr("cx", this.orb.radius)
      .attr("cy", this.orb.radius);

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
      console.log(this.moonPosition)
      this.draw();
    }
  },
  computed: {
    phase() {
      let phase =  1 - this.illuminated / 2;
      console.log(phase,this.illuminated)
      return phase
    }
  },
  methods: {
    sweeps: function(radius,phase){
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
      return sweeps
    },
    draw: function() {
      let moonSweeps = this.sweeps(this.moon.radius, this.phase);
      let tinySweeps = this.sweeps(this.tiny.radius, this.phase);

      this.disk
        .selectAll(".moonlit")
        .data([1])
        .join(enter =>
          enter
            .append("path")
            .attr("class", "moonlit")
            .attr("clip-path", "url(#outer-clip)")
        )
        .attr("d",`${moonSweeps.lit.join(" ")}`);

      this.disk
        .selectAll(".moondark")
        .data([1])
        .join(enter =>
          enter
            .append("path")
            .attr("class", "moondark")
            .attr("clip-path", "url(#outer-clip)")
        )
        .attr("d",`${moonSweeps.dark.join(" ")}`)
        .style("filter", "url(#glow)");

      this.orbit
        .selectAll(".tiny")
        .data([1])
        .join(enter =>
          enter
            .append("path")
            .attr("class","tiny")
        )
        .attr("d",`${tinySweeps.lit.join(" ")}`)
        .attr("transform",`translate(${-this.tiny.radius},${this.orb.radius-this.tiny.radius})`)
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
.orbit {
  fill: none;
  stroke: white;  
  stroke-width: 1px;
  stroke-dasharray: 2 2
}
.horizon {
  stroke: white;
  stroke-width: 1px;
    stroke-dasharray: 2 8
}
.tiny {
  fill: midnightblue;
  stroke: white;
  stroke-width: 1px;
}
</style>
