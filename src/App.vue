<template>
  <div id="app">
    {{ times }}<br>
    {{ now }}<br>
    <p v-if = "coordinates.default">I've assumed you're in London</p>
  </div>
</template>

<script>
const SunCalc = require("suncalc");

export default {
  name: "App",
  data: () => ({
    coordinates: {
      default: true,
      lat: 51.5074,
      lng: 0.1278
    },
    now: new Date()
  }),
  created: function() {
    this.$getLocation().then(coordinates => {
      this.coordinates.lat = coordinates.lat;
      this.coordinates.lng = coordinates.lng;
      this.coordinates.default = false;
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
