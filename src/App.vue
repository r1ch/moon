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
      :phase="phase"
      :times="times"
      :currentPosition="currentPosition"
    ></sky-component>
  </div>
</template>

<script>
import SkyComponent from "./SkyComponent.vue";
import Moonposition from "astronomia/src/moonposition";
import {Coord} from "astronomia/src/globe";
import {Ecliptic} from "astronomia/src/coord";
import Julian from "astronomia/src/julian";
import Sidereal from "astronomia/src/sidereal";
import {nutation} from "astronomia/src/nutation";

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
    console.log(this.moonPositionOn(new Date()))
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
    moonPositionOn: function(date) {
      let calendar = new Julian.Calendar().fromDate(date)
      let jd = calendar.toJD()
      let jde = calendar.toJDE()
      let siderealTime = Sidereal.apparent0UT(jd);
      let eclipticMoonPosition = Moonposition.position(jde);
      let obliquity = nutation(jde)[1];
      
      let equatorialMoonPosition = new Ecliptic(
        eclipticMoonPosition.lat,
        eclipticMoonPosition.lon
      ).toEquatorial(obliquity);

      console.log(eclipticMoonPosition)

      let horizontalMoonPosition = equatorialMoonPosition.toHorizontal(
        this.geographicCoordinates,
        siderealTime
      );
      return horizontalMoonPosition;
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
    geographicCoordinates() {
      return new Coord(
        this.deviceCoordinates.latitude / 180 * Math.PI,
        this.deviceCoordinates.longitude / 180 * Math.PI
      );
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
      let minute = 3 * 60 * 1000;
      let second = 1000;
      let times = {
        absAlt: 0,
        rise: [],
        set: [],
        detail: []
      };
      let k = 0;
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
        k++;
        let time = new Date(i);
        let position = this.moonPositionOn(time)
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
      console.log(k);
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
