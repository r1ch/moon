<template>
  <div id="app">
    {{ times }}
  </div>
</template>

<script>
const SunCalc = require("suncalc");

export default {
  name: "App",
  data: () => ({
    coordinates: {
      lat: 0,
      lng: 0
    },
    now: new Date()
  }),
  created: function() {
    this.$getLocation().then(coordinates => {
      this.coordinates.lat = coordinates.lat;
      this.coordinates.lng = coordinates.lng;
    });
    setInterval(() => {
      this.now = new Date();
    }, 1000);
  },
  computed: {
    times: function() {
      let times = SunCalc.getMoonTimes(
        this.now,
        this.coordinates.lat,
        this.coordinates.lng
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
