<template>
  <div id="app">
    {{ times }}<br />
    {{ now }}<br />
    <p v-if="coordinates.default">
      I've assumed you're in London<br />
      <a href="#" @click="locate">Update location</a>
    </p>
    <p v-if="coordinates.error">
      {{ coordinates.error }}
    </p>
    {{ JSON.stringify(error) }}
  </div>
</template>

<script>
const SunCalc = require("suncalc");

export default {
  name: "App",
  data: () => ({
    coordinates: {
      default: true,
      error: false,
      errorString : false,
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
      try {
        navigator.geolocation.getCurrentPosition(
          position => {
            console.log(position);
            this.coordinates.latitude = position.coords.latitude;
            this.coordinates.longitude = position.coords.longitude;
            this.coordinates.default = false;
          },
          error => {
            console.log(error);
            this.coordinates.error = error;
            this.coordinates.errorString = JSON.stringify(error)

          },
          { maximumAge: 50000, timeout: 20000 }
        );
      } catch (error) {
        this.coordinates.error = error;
        this.coordinates.errorString = JSON.stringify(error)
      }
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
        rise: new Date(times.rise).toLocaleTimeString(),
        set: new Date(times.set).toLocaleTimeString()
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
  color: #2c3e50;
  margin-top: 60px;
}
</style>
