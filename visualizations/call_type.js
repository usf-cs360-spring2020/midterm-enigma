const h_width = 750;
const h_height = 500;

const h_cellWidth = 200;
const h_cellHeight = 50;

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

const callTypeGroups = ['Fire', 'Alarm', 'Non Life-threatening', 'Potentially Life-Threatening'];
const neighborhoods = [];

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

let myColor = d3.scaleSequential(d3.interpolateYlGnBu)
                .domain([28, 23695]);

// select svg
const svg = d3.select('#heatmap')
              .attr('width', h_width)
              .attr('height', h_height);
console.assert(svg.size() === 1);

// add plot region
const plot = svg.append('g')
                .attr('id', 'heatmap');

// transform region by margin
plot.attr('transform', translate(h_margin.left, h_margin.top));

/*
 * returns a translate string for the transform attribute
 */
function translate(x, y) {
  return 'translate(' + String(x) + ',' + String(y) + ')';
}

const scales = {
  x: d3.scaleBand(),
  y: d3.scaleLinear(),
};

// we are going to hardcode the domains, so we can setup our scales now
// that is one benefit of prototyping!
scales.x.range([0, h_width - h_margin.left - h_margin.right])
        .domain(callTypeGroups)
        .paddingInner(0.05);

scales.y.range([h_height - h_margin.top - h_margin.bottom, 0])
        .domain(neighborhoods);

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

  const group = plot.append('g')
                    .attr('id', 'heatmap');

  group.selectAll('cell')
       .data(h_data)
       .enter()
       .append('rect')
       .attr('fill', d => {
         let color = myColor(d[ctg.FIRE]);
         console.log(color);
         return color;
       })
       // .attr('x', d => scales.x(d[columns.ACTIVITY_PERIOD].str))
       // .attr('y', d => {
       //   let point = scales.y(d[columns.PASSENGER_COUNT]);
       //   domesticStartPoints[d[columns.ACTIVITY_PERIOD].str] = point;
       //   return point;
       // })
       // .attr('width', scales.x.bandwidth())
       // .attr('height', d => height - scales.y(d[columns.PASSENGER_COUNT]) - margin.bottom - margin.top);
}

const h_map = d3.map();
const p_map = d3.map();

const h_data = [];
const p_data = [];

function aggregate(data) {
  // Sum up all calls for each neighborhood
  data.forEach(d => {
    let neighborhood = d[columns.NEIGHBORHOODS];
    if(neighborhood !== 'None') {
      let group = d[columns.CTG];
      let priority = d[columns.FINAL_PRIORITY];

      if(group !== '') {
        if (h_map.has(neighborhood)) {
          let groups = h_map.get(neighborhood);
          let callTypeCount = groups[group];

          groups[group] = callTypeCount + 1;

          let finalPriorities = p_map.get(neighborhood);
          let pCount = finalPriorities[priority];

          finalPriorities[priority] = pCount + 1;
        } else {
          neighborhoods.push(neighborhood);
          let groups = {
            [ctg.FIRE]: 0,
            [ctg.ALARM]: 0,
            [ctg.NON_LIFE_THREATENING]: 0,
            [ctg.POTENTIALLY_LIFE_THREATENING]: 0,
          };

          groups[group] = 1;
          h_map.set(neighborhood, groups);

          let finalPriorities = {
            [priorities.EMERGENCY]: 0,
            [priorities.NON_EMERGENCY]: 0,
          };

          finalPriorities[priority] = 1;
          p_map.set(neighborhood, finalPriorities);
        }
      }
    }
  });

  // Average all counts over the course of <yearRange> years
  h_map.each((ctg, n) => {
    let newEntry = {};
    newEntry[columns.NEIGHBORHOODS] = n;

    Object.entries(ctg).forEach(entry => {
      let type = entry[0];
      let count = Math.round(entry[1] / yearRange);
      ctg[type] = count;
      newEntry[type] = count;
    });
    h_data.push(newEntry);
  });

  p_map.each((fp, n) => {
    let newEntry = {};
    newEntry[columns.NEIGHBORHOODS] = n;

    Object.entries(fp).forEach(entry => {
      let priority = entry[0];
      let count = Math.round(entry[1] / yearRange);
      fp[priority] = count;
      newEntry[priority] = count;
    });
    p_data.push(newEntry);
  });

  console.log(h_map);
  console.log(p_map);
  console.log(neighborhoods);
  console.log(h_data);
  console.log(p_data);
}