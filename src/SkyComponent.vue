<template>
  <div>
    <div id="d3">
      <div id="moon"></div>
      <!--<small
        >{{ phaseText }} ({{
          Number(100 * this.illuminated).toFixed(1)
        }}%)</small
      >-->
      <div id="horizon"></div>
    </div>
  </div>
</template>

<script>
const d3 = require("d3");

export default {
  name: "sky-component",
  props: ["now", "angle", "illuminated", "times", "currentPosition"],
  data: function() {
    let margin = {
      top: 20,
      left: 20,
      right: 20,
      bottom: 20
    };

    let moonFull = {
      width: 200,
      height: 200
    };
    let moonInner = {
      width: moonFull.width - margin.left - margin.right,
      height: moonFull.height - margin.top - margin.bottom
    };
    let moon = {
      radius: moonInner.width / 2
    };
    moon.offset = [moonInner.width / 2 - moon.radius, 0].join(",");

    let horizonFull = {
      width: 900,
      height: 200
    };
    let horizonInner = {
      width: horizonFull.width - margin.left - margin.right,
      height: horizonFull.height - margin.top - margin.bottom
    };
    let horizon = {
      radius: 10
    };
    horizon.offset = [0, horizonInner.height / 2].join(",");

    return {
      moonFull: moonFull,
      moonInner: moonFull,
      moon: moon,
      horizonFull: horizonFull,
      horizonInner: horizonInner,
      horizon: horizon,
      margin: margin
    };
  },
  mounted: function() {
    this.moonSvg = d3
      .select("#moon")
      .append("svg")
      .attr("width", this.moonFull.width)
      .attr("height", this.moonFull.height)
      .append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`)
      .append("g");

    this.moonSvg
      .append("clipPath")
      .attr("id", "outer-clip")
      .append("circle")
      .attr("r", this.moon.radius)
      .attr("cx", this.moon.radius)
      .attr("cy", this.moon.radius);

    this.horizonSvg = d3
      .select("#horizon")
      .append("svg")
      .attr("width", this.horizonFull.width)
      .attr("height", this.horizonFull.height)
      .append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`)
      .append("g")
      .attr("transform", `translate(${this.horizon.offset})`);

    let defs = this.moonSvg.append("defs");
    let filter = defs
      .append("filter")
      .attr("id", "glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");

    filter
      .append("feGaussianBlur")
      .attr("stdDeviation", 1)
      .attr("result", "moonDark");

    filter
      .append("feGaussianBlur")
      .attr("stdDeviation", 12)
      .attr("result", "moonShine");

    let feMerge = filter.append("feMerge");

    feMerge.append("feMergeNode").attr("in", "moonDark");
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
    phaseText() {
      return [
        { phase: 0.01, text: "New Moon" },
        { phase: 0.249, text: "Waxing Crescent" },
        { phase: 0.251, text: "First Quarter" },
        { phase: 0.499, text: "Waxing Gibbous" },
        { phase: 0.501, text: "Full Moon" },
        { phase: 0.749, text: "Waning Gibbous" },
        { phase: 0.751, text: "Last Quarter" },
        { phase: 0.99, text: "Waning Crescent" },
        { phase: 1.0, text: "New Moon" }
      ].find(name => this.illuminated < name.phase).text;
    },
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

      this.moonSvg.attr(
        "transform",
        `translate(${this.moon.offset}) rotate(${this.angle} ${this.moon.radius}, ${this.moon.radius})`
      );

      this.moonSvg
        .selectAll(".moonborder")
        .data([1])
        .join(enter =>
          enter
            .append("circle")
            .attr("class", "moonborder")
            .attr("r", this.moon.radius)
            .attr("cx", this.moon.radius)
            .attr("cy", this.moon.radius)
        );

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
        .range([0, this.horizonInner.width]);

      let altitudeScale = d3
        .scaleLinear()
        .domain([-1 * this.times.absAlt, this.times.absAlt])
        .range([this.horizonInner.height / 2, this.horizonInner.height / -2]);

      let horizonAxis = d3.axisBottom().scale(horizonScale);

      let risePath = d3
        .line()
        .x(d => horizonScale(d.time))
        .y(d => altitudeScale(d.position.alt));

      //let cardinalPoints = ["S","SSE","SE","ESE","E","ENE","NE","NNE","N","NNW","NW","WNW","W","WSW","SW","SSW","S"]
      let cardinalPoints = [
        "N",
        "NNE",
        "NE",
        "ENE",
        "E",
        "ESE",
        "SE",
        "SSE",
        "S",
        "SSW",
        "SW",
        "WSW",
        "W",
        "WNW",
        "NW",
        "NNW",
        "N"
      ];
      let cardinals = cardinalPoints.map((point, i) => ({
        point: point,
        az: (i / (cardinalPoints.length - 1) - 0.5) * 2 * Math.PI
      }));

      let cardinalFor = point => {
        return cardinals.reduce((previous, current) => {
          return Math.abs(current.az - point.az) <
            Math.abs(previous.az - point.az)
            ? current
            : previous;
        }, cardinals[0]);
      };

      this.horizonSvg
        .selectAll(".cardinal")
        .data([...this.times.rise, ...this.times.set])
        .join(enter =>
          enter
            .append("text")
            .attr("class", "cardinal")
            .call(enter =>
              enter
                .append("tspan")
                .attr("class", "cardinaltime")
                .attr("dy", "1em")
            )
            .call(enter =>
              enter
                .append("tspan")
                .attr("class", "cardinalposition")
                .attr("dy", "1em")
            )
        )
        .attr("y", this.horizonInner.height / -4);

      this.horizonSvg
        .selectAll(".cardinaltime")
        .data([...this.times.rise, ...this.times.set])
        .text(d => d.time.toLocaleTimeString())
        .attr("x", d => horizonScale(d.time));

      this.horizonSvg
        .selectAll(".cardinalposition")
        .data([...this.times.rise, ...this.times.set])
        .text(d => cardinalFor(d.position).point)
        .attr("x", d => horizonScale(d.time));

      this.horizonSvg
        .selectAll(".axis")
        .data([1])
        .join(enter => enter.append("g").attr("class", "axis"))
        .call(horizonAxis);

      this.horizonSvg
        .selectAll(".axislabel")
        .data(["horizon"])
        .join(enter =>
          enter
            .append("text")
            .attr("class", "axislabel")
            .text(d => d)
            .attr("dy", -1)
        );

      this.horizonSvg
        .selectAll(".risePath")
        .data([this.times.detail])
        .join(enter => enter.append("path").attr("class", "risePath"))
        .attr("d", d => risePath(d));

      this.horizonSvg
        .selectAll(".tinydark")
        .data([1])
        .join(enter => enter.append("path").attr("class", "tinydark"))
        .attr("d", `${horizonSweeps.dark.join(" ")}`)
        .attr(
          "transform",
          `translate(${horizonScale(this.now) -
            this.horizon.radius},${altitudeScale(this.currentPosition.alt) -
            this.horizon.radius}),rotate(${this.angle},${this.horizon.radius},${
            this.horizon.radius
          })`
        );

      this.horizonSvg
        .selectAll(".tinylit")
        .data([1])
        .join(enter => enter.append("path").attr("class", "tinylit"))
        .attr("d", `${horizonSweeps.lit.join(" ")}`)
        .attr(
          "transform",
          `translate(${horizonScale(this.now) -
            this.horizon.radius},${altitudeScale(this.currentPosition.alt) -
            this.horizon.radius}),rotate(${this.angle},${this.horizon.radius},${
            this.horizon.radius
          })`
        );

      this.horizonSvg
        .selectAll(".tinycardinal")
        .data([this.currentPosition])
        .join(enter => enter.append("text").attr("class", "tinycardinal"))
        .text(d => cardinalFor(d).point)
        .attr("x", horizonScale(this.now))
        .attr("y", d => altitudeScale(d.alt) + 2 * this.horizon.radius);
    }
  }
};
</script>

<style>
#horizon {
  width: 100%;
  overflow: scroll;
  text-align: center;
}

svg {
  display: block;
  margin: auto;
}

.axislabel {
  font-size: 10px;
}

.moonlit {
  fill: white;
  stroke: none;
}

.moondark {
  fill: #444;
  stroke: none;
}

.moonborder {
  stroke: rgba(0, 0, 0, 0.5);
  stroke-width: 1px;
  fill: none;
}

.orbit {
  fill: none;
  stroke: black;
  stroke-width: 1px;
  stroke-dasharray: 2 2;
}

.tinylit {
  fill: rgba(255, 255, 255, 0.5);
  stroke: black;
  stroke-width: 1px;
}

.tinydark {
  fill: rgba(0, 0, 0, 0.5);
  stroke: rgba(0, 0, 0, 0.5);
  stroke-width: 1px;
}

.risePath {
  stroke: black;
  fill: none;
  stroke-width: 1px;
  stroke-dasharray: 1 1;
}

.cardinaltime {
  font-size: 10px;
  text-anchor: middle;
}

.cardinalposition {
  text-anchor: middle;
}

.tinycardinal {
  text-anchor: middle;
  font-size: 10px;
}
</style>
