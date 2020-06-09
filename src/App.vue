<template>
  <div id="app">
    Rise {{ this.nextRise.time.toLocaleString() }}<br />
    Set {{ this.nextSet.time.toLocaleString() }}<br />
    {{ now }}<br />
    <p v-if="deviceCoordinates.default">
      I've assumed you're in London<br />
      <a href="#" v-if="!deviceCoordinates.error" @click="locate">
        Update location
      </a>
    </p>
    <p v-if="deviceCoordinates.error">
      {{ deviceCoordinates.error }}
    </p>
    <p v-if="!deviceCoordinates.error && !deviceCoordinates.default">
      {{ Number(deviceCoordinates.latitude).toFixed(3) }},{{
        Number(deviceCoordinates.longitude).toFixed(3)
      }}<br />
      {{ Number(deviceCoordinates.altitude).toFixed(1) }}m
    </p>
    <br />
    <sky-component
      :now="now"
      :angle="angle"
      :illuminated="illuminated"
      :times="times"
      :currentPosition="currentPosition"
    ></sky-component>
  </div>
</template>

<script>
import SkyComponent from "./SkyComponent.vue";
const A = require("meeusjs");

export default {
  name: "App",
  components: { SkyComponent },
  data: () => ({
    deviceCoordinates: {
      default: true,
      error: false,
      latitude: 51.5074,
      longitude: 0.1278,
      altitude: 0
    },
    now: new Date()
  }),
  created: function() {
    setInterval(() => {
      this.now = new Date();
    }, 1000);
  },
  methods: {
    locate: function() {
      navigator.geolocation.getCurrentPosition(
        position => {
          console.log(position);
          this.deviceCoordinates.latitude = position.coords.latitude;
          this.deviceCoordinates.longitude = position.coords.longitude;
          this.deviceCoordinates.altitude = position.coords.altitude || 0;
          this.deviceCoordinates.default = false;
        },
        error => {
          this.deviceCoordinates.error = error.message;
        },
        { maximumAge: 50000, timeout: 20000 }
      );
    }
  },
  computed: {
    jdo() {
      return new A.JulianDay(this.now);
    },
    astronomicalCoordinates() {
      return A.EclCoord.fromWgs84(
        this.deviceCoordinates.latitude,
        this.deviceCoordinates.longitude,
        this.deviceCoordinates.altitide
      );
    },
    sunTopocentricPosition() {
      return A.Solar.apparentTopocentric(
        this.jdo,
        this.astronomicalCoordinates
      );
    },
    moonTopocentricPosition() {
      return A.Moon.topocentricPosition(this.jdo, this.astronomicalCoordinates);
    },
    phase() {
      return A.MoonIllum.phaseAngleEq2(
        this.moonTopocentricPosition.eq,
        this.sunTopocentricPosition
      );
    },
    illuminated() {
      return A.MoonIllum.illuminated(this.phase);
    },
    angle() {
      return A.MoonIllum.positionAngle(
        this.moonTopocentricPosition.eq,
        this.sunTopocentricPosition
      );
    },
    midnight() {
      return {
        previous: new Date(
          this.now.getFullYear(),
          this.now.getMonth(),
          this.now.getDate(),
          0,
          0,
          0
        ).getTime(),
        now: new Date(
          this.now.getFullYear(),
          this.now.getMonth(),
          this.now.getDate() + 1,
          0,
          0,
          0
        ).getTime(),
        next: new Date(
          this.now.getFullYear(),
          this.now.getMonth(),
          this.now.getDate() + 2,
          0,
          0,
          0
        ).getTime()
      };
    },
    currentPosition() {
      return A.Moon.topocentricPosition(this.jdo, this.astronomicalCoordinates)
        .hz;
    },
    nextRise() {
      return this.times.rise.find(
        rise => rise.time.getTime() > this.now.getTime()
      );
    },
    nextSet() {
      return this.times.set.find(
        set => set.time.getTime() > this.now.getTime()
      );
    },
    times() {
      let steps = 24 * 60 * 2;
      let step = (this.midnight.next - this.midnight.previous) / steps;
      let times = {
        rise: [],
        set: []
      };
      let running = { position: false, min: 0, max: 0 };
      let detail = [...Array(steps)].map((_, i) => {
        let time = new Date(this.midnight.previous + i * step);
        let position = A.Moon.topocentricPosition(
          new A.JulianDay(new Date(this.midnight.previous + i * step)),
          this.astronomicalCoordinates
        ).hz;
        let entry = {
          time: time,
          position: position
        };
        if (
          running.position &&
          Math.sign(running.position.alt) != Math.sign(position.alt)
        ) {
          position.alt > 0 ? times.rise.push(entry) : times.set.push(entry);
        }
        running.position = position;
        running.min = Math.min(running.min, position.alt);
        running.max = Math.max(running.min, position.alt);
        return entry;
      });
      times.minAltitude = running.min;
      times.maxAltitude = running.max;
      times.detail = [...detail];
      return times;
    }
  }
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  margin-top: 60px;
}
a {
  color: black;
}
html {
  background: white;
}
</style>
