const h_width = 960;
const h_height = 500;

const h_margin = {
  top: 30,
  bottom: 35,
  left: 100,
  right: 15
};

const columns = {
  CTG: 'Call Type Group',
  NEIGHBORHOODS: 'Neighborhooods - Analysis Boundaries',
  FINAL_PRIORITY: 'Final Priority',
};

const ctg = {
  FIRE: 'Fire',
  ALARM: 'Alarm',
  NON_LIFE_THREATENING: 'Non Life-threatening',
  POTENTIALLY_LIFE_THREATENING: 'Potentially Life-Threatening',
};

const priorities = {
  NON_EMERGENCY: 2,
  EMERGENCY: 3,
};

const priorityStrings = {
  NON_EMERGENCY: 'Non-Emergency',
  EMERGENCY: 'Emergency',
};

const yearRange = 7;

function priorityString(priority) {
  return priority === 2 ? priorityStrings.NON_EMERGENCY : priorityStrings.EMERGENCY;
}

// select svg
const svg = d3.select('#heatmap');
console.assert(svg.size() === 1);

// add plot region
const plot = svg.append('g')
                .attr('id', 'heatmap');

// load data and trigger draw
d3.csv('drew_Fire_Department_Calls_for_Service_reduced.csv', convert)
  .then(draw);

// Average per year, over 7 years (2013-2019)
function convert(row) {
  let convert = {};

  let callTypeGroup = row[columns.CTG];
  let neighborhood = row[columns.NEIGHBORHOODS];
  let priority = row[columns.FINAL_PRIORITY];

  convert[columns.CTG] = callTypeGroup;
  convert[columns.NEIGHBORHOODS] = neighborhood;
  convert[columns.FINAL_PRIORITY] = parseInt(priority);

  return convert;
}

function draw(data) {
  console.log(data);

  aggregate(data);
}

const h_map = d3.map();

function aggregate(data) {
  data.forEach(d => {
    let neighborhood = d[columns.NEIGHBORHOODS];
    if(neighborhood !== 'None') {
      let group = d[columns.CTG];

      if(group !== '') {
        if (h_map.has(neighborhood)) {
          let groups = h_map.get(neighborhood);
          let callTypeCount = groups[group];

          groups[group] = callTypeCount + 1;
        } else {
          let groups = {
            [ctg.FIRE]: 0,
            [ctg.ALARM]: 0,
            [ctg.NON_LIFE_THREATENING]: 0,
            [ctg.POTENTIALLY_LIFE_THREATENING]: 0,
          };

          groups[group] = 1;

          h_map.set(neighborhood, groups);
        }
      }
    }
  });

  // Average all counts over the course of <yearRange> years
  h_map.each((ctg, n) => {
    // let avgCount;
    Object.entries(ctg).forEach(entry => {
      console.log(entry);
      ctg[entry[0]] = Math.round(entry[1] / yearRange);
      // console.log(entry);
    });
    // console.log(n);
    console.log(ctg);
  });

  console.log(h_map);
}