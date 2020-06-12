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
          {{ this.nextRise.time.toLocaleTimeString() }}<br />
          <small>{{
            this.nextRise.time.getDate() == this.now.getDate()
              ? "today"
              : "tomorrow"
          }}</small>
        </td>
        <td>
          {{ this.nextSet.time.toLocaleTimeString() }}<br />
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
    setTimeout(() => {
      this.detailed = true;
    }, 100);
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
    getTimesFor() {},
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
      let PA = A.MoonIllum.positionAngle(
        this.moonTopocentricPosition.eq,
        this.sunTopocentricPosition
      );
      return ((PA - this.moonTopocentricPosition.q) / Math.PI) * -180 + 90;
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
      let minute = 60 * 1000;
      let second = 1000;
      let times = {
        absAlt: 0,
        rise: [],
        set: [],
        detail: []
      };
      for (
        let [i, step, previousPosition] = [
          this.midnight.previous,
          minute,
          false,
          0
        ];
        i <= this.midnight.next;
        i += step
      ) {
        let time = new Date(i);
        let position = A.Moon.topocentricPosition(
          new A.JulianDay(time),
          this.astronomicalCoordinates
        ).hz;
        let entry = {
          time: time,
          position: position
        };
        if (
          previousPosition &&
          Math.sign(previousPosition.alt) != Math.sign(position.alt)
        ) {
          // we just crossed the horizon
          if (step == minute) {
            //backtrack and do this in seconds
            console.log(`Crossed ${time}, ${step}`);
            i -= step;
            step = second;
            i += step;
            console.log(`Crossed ${time}, ${step}`);
            continue;
          } else {
            console.log(`Crossed ${time}, ${step}`);
            //capture the crossing, then skip to next iteration
            position.alt > 0 ? times.rise.push(entry) : times.set.push(entry);
            step = minute;
            i -= i % step;
            console.log(`Crossed ${time}, ${step}`);
          }
        }
        previousPosition = position;
        times.absAlt = Math.max(times.absAlt, Math.abs(position.alt));
        times.detail.push(entry);
      }
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
