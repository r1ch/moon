<template>
  <div id="app">
    {{ this.now.toLocaleTimeString() }}<br />
    <table>
      <tr>
        <td>Rise</td>
        <td>Set</td>
      </tr>
      <tr>
        <td>
          {{ this.nextSet.time.toLocaleTimeString().slice(0,5) }}<br />
          <small>{{
            this.nextSet.time.getDate() == this.now.getDate()
              ? "today"
              : "tomorrow"
          }}</small>
        </td>
        <td>
          {{ this.nextRise.time.toLocaleTimeString().slice(0,5) }}<br />
          <small>{{
            this.nextSet.time.getDate() == this.now.getDate()
              ? "today"
              : "tomorrow"
          }}</small>
        </td>
      </tr>
    </table>

    <br />
    <p v-if="deviceCoordinates.default">
      I've assumed you're in London
      <br />
      <a href="#" v-if="!deviceCoordinates.error" @click="locate"
        >Update location</a
      >
    </p>
    <p v-if="deviceCoordinates.error">{{ deviceCoordinates.error }}</p>
    <p v-if="!deviceCoordinates.error && !deviceCoordinates.default">
      Lat, Lng: {{ Number(deviceCoordinates.latitude).toFixed(3) }},
      {{ Number(deviceCoordinates.longitude).toFixed(3) }}
      <br />
      Height above sea: {{ Number(deviceCoordinates.altitude).toFixed(1) }}m
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
    day: new Date().getDate(),
    now: new Date(),
    midnight: false
  }),
  created: function() {
    this.midnight = this.calculateMidnight();
    setInterval(() => {
      let date = new Date();
      if (date.getDate() != this.day) this.day = date.getDate();
      this.now = date;
    }, 1000);
  },
  watch: {
    day: function() {
      this.midnight = this.calculateMidnight();
    }
  },
  methods: {
    calculateMidnight: function() {
      console.log("Update to midnight");
      return {
        previous: new Date(
          this.now.getFullYear(),
          this.now.getMonth(),
          this.now.getDate(),
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
      console.log("Recalculate times");
      let steps = 24 * 60 * 2;
      let step = (this.midnight.next - this.midnight.previous) / steps;
      let times = {
        rise: [],
        set: []
      };
      let running = { position: false, absAlt: 0, nextCardinal: false };
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
        running.absAlt = Math.max(running.absAlt, Math.abs(position.alt));
        return entry;
      });
      times.absAlt = running.absAlt;
      times.detail = detail;
      console.log("Times done");
      return times;
    }
  }
};
</script>

<style>
table {
  margin: auto;
}
td {
  padding: 0 10px;
}
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
