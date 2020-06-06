<template>
  <div id="app">
    Moon rise today: {{ times.riseString }}<br />
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
      {{ Number(deviceCoordinates.latitude).toFixed(3) }},{{ Number(deviceCoordinates.longitude).toFixed(3) }}<br />
      {{ Number(deviceCoordinates.altitude).toFixed(3) }}m
    </p>
    <br />
    <sky-component
      :now="now"
      :angle="angle"
      :illuminated="illuminated"
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
    times() {
      let times = A.Moon.times(this.jdo, this.astronomicalCoordinates);
      return {
        riseString: A.Coord.secondsToHMSStr(times.rise),
        setString: A.Coord.secondsToHMSStr(times.set)
      };
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
  color: ivory;
  margin-top: 60px;
}
a {
  color: ivory;
}
html {
  background: midnightblue;
}
</style>
