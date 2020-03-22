const h_width = 800;
const h_height = 500;

const h_cellWidth = 149;
const h_cellHeight = 11;

const h_margin = {
  top: 60,
  bottom: 35,
  left: 190,
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

let colorBuckets = [100, 500, 1000, 2000, 4000, 6000, 8000, 10000, 12000, 14000, 16000, 18000, 20000, 22000, 24000];
let colors = ['#FCFED2', '#E6F5B6', '#D6EFB3', '#C9EAB4',
              '#BDE5B5', '#A9DDB7', '#8ED3BA','#77CABD',
              '#4CB7C1', '#228ABB', '#2071B1', '#2355A3',
              '#1F358B', '#142772', '#0B1F5E'];

let getColor = value => {
  for(let i = 0; i < colorBuckets.length; i++) {
    if(value <= colorBuckets[i]) {
      return colors[i];
    }
  }
  return colors[0];
};

// select svg
const svg = d3.select('#heatmap')
              .attr('width', h_width)
              .attr('height', h_height);
console.assert(svg.size() === 1);

// add plot region
const plot = svg.append('g')
                .attr('id', 'heatmap')
                .attr('transform', translate(h_margin.left, h_margin.top));

// const annotations = svg.append("g")
//                        .attr("id", "annotation");
//
// const tooltip = svg.append("g")
//                        .attr("id", "tooltip");
/*
 * returns a translate string for the transform attribute
 */
function translate(x, y) {
  return 'translate(' + String(x) + ',' + String(y) + ')';
}

const scales = {
  x: d3.scaleBand(),
  y: d3.scaleBand(),
};

scales.x.range([0, h_width - h_margin.left - h_margin.right])
        .domain(callTypeGroups)
        .paddingInner(0);

const h_data = [];
const p_data = [];

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

function drawAxis() {
  const xGroup = svg.append('g')
                    .attr('id', 'x-axis')
                    .attr('class', 'axis');
  const yGroup = svg.append('g')
                    .attr('id', 'y-axis')
                    .attr('class', 'axis');

  // create axis generators
  const xAxis = d3.axisTop(scales.x);
  const yAxis = d3.axisLeft(scales.y);

  // https://github.com/d3/d3-format#locale_formatPrefix
  xAxis.ticks(4, 's')
       .tickSizeOuter(0)
       .tickSizeInner(0);
  yAxis.ticks(41)
       .tickSizeInner(0)
       .tickSizeOuter(0);

  // shift x axis to correct location
  xGroup.attr('transform', translate(h_margin.left, h_margin.top));
  xGroup.call(xAxis);

  // shift y axis to correct location
  yGroup.attr('transform', translate(h_margin.left, h_margin.top));
  yGroup.call(yAxis);
}

/*
 * draw axis titles
 */
function drawTitles() {
  const xMiddle = h_margin.left + midpoint(scales.x.range());

  const xTitle = svg.append('text')
                    .attr('class', 'axis-title')
                    .text(columns.CTG);

  xTitle.attr('x', xMiddle)
        .attr('y', h_margin.top/2)
        .attr('dy', -4)
        .attr('text-anchor', 'middle')
        .attr('font-size', '14');

  const yGroup = svg.append('g');

  const yTitle = yGroup.append('text')
                       .attr('class', 'axis-title')
                       .text("Neighborhoods");

  yTitle.attr('x', 145)
        .attr('y', h_margin.top - 1)
        .attr('text-anchor', 'middle')
        .attr('font-size', '14')
        .attr('text-decoration', 'underline');
}

/*
 * calculates the midpoint of a range given as a 2 element array
 */
function midpoint(range) {
  return range[0] + (range[1] - range[0]) / 2.0;
}

function draw(data) {
  aggregate(data);

  drawAxis();
  drawTitles();

  const group = plot.append('g')
                    .attr('id', 'heatmap');

  // fire
  group.selectAll('cell')
       .data(h_data)
       .enter()
       .append('rect')
       .attr('fill', d => {
         let color = getColor(d[ctg.FIRE]);
         // console.log(color);
         return color;
       })
       .attr('x', d => {
         let x = scales.x(ctg.FIRE);
         // console.log(x);
         return x;
       })
       .attr('y', d => {
         let y = scales.y(d[columns.NEIGHBORHOODS]);
         // console.log(y);
         return y;
       })
       .attr('width', d => {
         let w = h_cellWidth;
         console.log(w);
         return w;
       })
       .attr('height', d => {
         let h = h_cellHeight;
         console.log(h);
         return h;
       });

  // Alarm
  group.selectAll('cell')
       .data(h_data)
       .enter()

       .append('rect')
       .attr('fill', d => {
         let color = getColor(d[ctg.ALARM]);
         // console.log(color);
         return color;
       })
       .attr('x', d => {
         let x = scales.x(ctg.ALARM);
         // console.log(x);
         return x;
       })
       .attr('y', d => {
         let y = scales.y(d[columns.NEIGHBORHOODS]);
         // console.log(y);
         return y;
       })
       .attr('width', d => {
         let w = h_cellWidth;
         // console.log(w);
         return w;
       })
       .attr('height', d => {
         let h = h_cellHeight;
         // console.log(h);
         return h;
       });

  // NON_LIFE_THREATENING
  group.selectAll('cell')
       .data(h_data)
       .enter()

       .append('rect')
       .attr('fill', d => {
         let color = getColor(d[ctg.NON_LIFE_THREATENING]);
         // console.log(color);
         return color;
       })
       .attr('x', d => {
         let x = scales.x(ctg.NON_LIFE_THREATENING);
         // console.log(x);
         return x;
       })
       .attr('y', d => {
         let y = scales.y(d[columns.NEIGHBORHOODS]);
         // console.log(y);
         return y;
       })
       .attr('width', d => {
         let w = h_cellWidth;
         // console.log(w);
         return w;
       })
       .attr('height', d => {
         let h = h_cellHeight;
         // console.log(h);
         return h;
       });

  // POTENTIALLY_LIFE_THREATENING
  group.selectAll('cell')
       .data(h_data)
       .enter()
       .append('rect')
       .attr('fill', d => {
         let color = getColor(d[ctg.POTENTIALLY_LIFE_THREATENING]);
         // console.log(color);
         return color;
       })
       .attr('x', d => {
         let x = scales.x(ctg.POTENTIALLY_LIFE_THREATENING);
         // console.log(x);
         return x;
       })
       .attr('y', d => {
         let y = scales.y(d[columns.NEIGHBORHOODS]);
         // console.log(y);
         return y;
       })
       .attr('width', d => {
         let w = h_cellWidth;
         // console.log(w);
         return w;
       })
       .attr('height', d => {
         let h = h_cellHeight;
         // console.log(h);
         return h;
       })
       .on("mouseover.tooltip", d => {
         let me = d3.select(this);
         let div = d3.select("body")
                     .append("div");

         div.attr("id", "details")
            .attr("class", "tooltip")
            .transition();

         let rows = div.append("table")
                       .selectAll("tr")
                       .data(Object.keys(d))
                       .enter()
                       .append("tr");

         rows.append("th").text(key => key);
         rows.append("td").text(key => d[key]);
       })
       .on("mousemove.tooltip", d => {
         let div = d3.select("div#details");

         // get height of tooltip
         let bbox = div.node().getBoundingClientRect();

         // Get mouse position relative to the page
         div.style("left", d3.event.pageX + "px");
         div.style("top",  (d3.event.pageY - bbox.height) + "px");
       })
       .on("mouseout.tooltip", d => {
         d3.selectAll("div")
           .transition();

         d3.selectAll("div#details")
           .remove();
       });

  // drawHover();
}

function aggregate(data) {
  const h_map = d3.map();
  const p_map = d3.map();

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

  scales.y.range([h_height - h_margin.top - h_margin.bottom, 0])
        .domain(neighborhoods)
        .paddingInner(0.05);

  // console.log(h_map);
  // console.log(p_map);
  // console.log(neighborhoods);
  console.log(h_data);
  console.log(p_data);
}

function drawHover() {
  // let vis = svg.node();
  // let annotations = svg.append("g")
  //                      .attr("id", "annotation");
  //
  // let cells = d3.select(vis)
  //               .select("#heatmap")
  //               .selectAll("cell");
  //
  // cells.on("mouseover.hover1", function(d) {
  //   let me = d3.select(this);
  //
  //   annotations.insert("text")
  //              .attr("id", "label")
  //              .attr("x", me.attr("cx"))
  //              .attr("y", me.attr("cy"))
  //              // .attr("dy", h_cellWidth/2)
  //              .attr("text-anchor", "middle")
  //              .text(d[columns.NEIGHBORHOODS]);
  //
  //   // show what we interacted with
  //   // d3.select(status).text("hover: " + d[ctg.FIRE]);
  //   console.log("hover: " + d[ctg.FIRE]);
  // });
  //
  // cells.on("mouseout.hover1", function(d) {
  //   annotations.select("text#label").remove();
  //   // d3.select(status).text("hover: none");
  //   console.log("hover: none");
  // });
}