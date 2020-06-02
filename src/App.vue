<template>
  <div id="app">
    {{ rise }}
  </div>
</template>

<script>
const SunCalc = require("suncalc");

export default {
  name: "App",
  data: () => ({
    word: "Hi!"
  }),
  computed: {
    rise() {
      return SunCalc.getMoonTimes(new Date(), 51.5074, 0.1278);
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
