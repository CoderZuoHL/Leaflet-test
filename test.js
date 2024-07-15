import fs from 'node:fs';

fetch('http://192.168.3.233:8000/api/source/mainPage/map/getRadarPuzzle', {
  method: 'POST',
  headers: {
    Flt: 'a76cbd31eed144b086a9edb4dbaa8971',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    "provinceCode": "430000",
    "dateTimes": [
      1720746000000,
      1720746360000,
      1720746720000,
      1720747080000,
      1720747440000,
      1720747800000,
      1720748160000,
      1720748520000,
      1720748880000,
      1720749240000,
      1720749600000,
      1720749960000,
      1720750320000,
      1720750680000,
      1720751040000,
      1720751400000,
      1720751760000,
      1720752120000,
      1720752480000,
      1720752840000,
      1720753200000
    ],
    "stepMinute": 6
  })
}).then(res => res.json()).then(data => {
  console.log(data.data["2024-07-12 09:00:00"]);

  fs.writeFileSync('data.json', JSON.stringify(data.data["2024-07-12 09:00:00"].data), 'utf-8');
});