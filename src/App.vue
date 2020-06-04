<template>
  <div id="app">
    Moon rise today: {{ times.riseString }}<br />
    {{ now }}<br />
    <p v-if="coordinates.default">
      I've assumed you're in London<br />
      <a href="#" v-if="!coordinates.error" @click="locate">Update location</a>
    </p>
    <p v-if="coordinates.error">
      {{ coordinates.error }}
    </p>
    <sky-component
      :now="now"
      :phase="illumination.phase"
    ></sky-component>
  </div>
</template>

<script>
import SkyComponent from "./SkyComponent.vue";
const SunCalc = require("suncalc");

export default {
  name: "App",
  components: { SkyComponent },
  data: () => ({
    coordinates: {
      default: true,
      error: false,
      latitude: 51.5074,
      longitude: 0.1278
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
          this.coordinates.latitude = position.coords.latitude;
          this.coordinates.longitude = position.coords.longitude;
          this.coordinates.default = false;
        },
        error => {
          this.coordinates.error = error.message;
        },
        { maximumAge: 50000, timeout: 20000 }
      );
    }
  },
  computed: {
    times: function() {
      let times = SunCalc.getMoonTimes(
        this.now,
        this.coordinates.latitude,
        this.coordinates.longitude
      );
      return {
        riseString: new Date(times.rise).toLocaleTimeString(),
        rise: times.rise,
        setString: new Date(times.set).toLocaleTimeString(),
        set: times.set
      };
    },
    position: function() {
      let position = SunCalc.getMoonPosition(
        this.now,
        this.coordinates.latitude,
        this.coordinates.longitude
      );
      return position;
    },
    illumination: function() {
      let illumination = SunCalc.getMoonIllumination(
        this.now,
        this.coordinates.latitude,
        this.coordinates.longitude
      );
      return illumination;
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
  color: #2c3e50;
  margin-top: 60px;
}
</style>
