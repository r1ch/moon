A = require('meeusjs');

for(let I = 0; I < 60; I++){
    // gets the moon position and times for zurich
    var now = new Date(Date.now() + I * 24 * 60 * 60 * 1000)
    var jdo = new A.JulianDay(now); // now
    var coord = A.EclCoord.fromWgs84(47.3957, 8.4867, 440); // zurich

    // gets the position of the moon		
    var tp = A.Moon.topocentricPosition(jdo, coord, true);
    // print azi and alt
    //console.log(tp.hz.toString() + ", dist:" + tp.delta); 

    // gets the rise, transit and set time of the moon for today
    var times = A.Moon.times(jdo, coord);

    //console.log(times)
        
    // print rise, transit and set in universal time	
    /*console.log("rise:" + A.Coord.secondsToHMSStr(times.rise) + 
            ", transit:" + A.Coord.secondsToHMSStr(times.transit) + 
            ", set:" +  A.Coord.secondsToHMSStr(times.set));*/
            

    // print moon phase and illuminated
    var suneq = A.Solar.apparentTopocentric(jdo, coord);
    var i = A.MoonIllum.phaseAngleEq2(tp.eq, suneq);
    var k = A.MoonIllum.illuminated(i);
    var chi =  A.MoonIllum.positionAngle(tp.eq, suneq);

    console.log(`date:\t${now.getDate()}\tphase:\t${i}\tilluminated:\t${k}\tangle:\t${chi}`);	
}