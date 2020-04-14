/*
* a lot of this example is hard-coded to match our tableau prototype...
* and this is a reasonable approach for your own visualizations.
* however, there are ways to automatically calculate these hard-coded values
* in our javascript/d3 code.
*/

// showing use of const
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const

// if you need to change values, use let instead
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let

// set svg size and plot margins
const width = 960;
const height = 500;

const margin = {
  top: 20,
  bottom: 35,
  left: 60,
  right: 150
};

// select svg
const svg = d3.select("svg#bubble");
console.assert(svg.size() == 1);

// set svg size
svg.attr("width", width);
svg.attr("height", height);

// add plot region
const plot = svg.append("g").attr("id", "plot");

// this is just so we can see the transform of the plot
// comment out for final version
// plot.append("rect").attr("width", 10).attr("height", 10);

// transform region by margin
plot.attr("transform", translate(margin.left, margin.top));

/*
* setup scales with ranges and the domains we set from tableau
* defined globally for access within other functions
*/

const scales = {
  x: d3.scaleTime(), //TODO datetime
  y: d3.scaleTime(), // TODO datetime
  // do not linearly scale radius...
  // area = pi * r * r, so use sqrt of r!
  r: d3.scaleSqrt(),
  fill: d3.scaleOrdinal()
  //.range(d3.schemeTableau10)
};

// we are going to hardcode the domains, so we can setup our scales now
// that is one benefit of prototyping!
scales.x.range([0, width - margin.left - margin.right]);
scales.x.domain([new Date(2018,11,5,0,0,0,0), new Date(2019,11,31,23,59,59,0)]);
//scales.x.ticks(12);
//scales.x.nice();
//scales.x.tickFormat(d3.time.format("%M"));


scales.y.range([height - margin.top - margin.bottom, 0]);
scales.y.domain([new Date(2019,0,1,23,59,59,0), new Date(2018,11,31,23,30,0,0)]); // we want 0 at top, 23 at bottom

// note we can chain if we want
scales.r.range([1, 20]).domain([0, 125]);

scales.fill.domain(["Structure Fire", "Water Rescue", "Industrial Accidents", "Other", "Outside Fire", "Vehicle Fire", "Explosion"])
.range(["#f28e2b", "#4e79a7", "#ff9da7", "#b07aa1", "#e15759", "#edc948", "#9c755f"]);

// since we do not need the data for our domains, we can draw our axis/legends right away
// can move the
drawAxis();
drawTitles();
drawCircleLegend();
drawColorLegend();

// load data and trigger draw
d3.csv("processed.csv", convert).then(draw);

function draw(data) {
  console.log("loaded:", data.length, data[0]);

  //scales.fill.domain(data.map(d => d.CallType));

  // filter for only california universities
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions
  //data = data.filter(row => row.state === "CA");
  //console.log("filter:", data.length, data[0]);

  // sort by count so small circles are drawn last
  //TODO will need to put this back in
  data.sort((a, b) => b.CallDuration - a.CallDuration);
  //console.log("sorted:", data.length, data[0]);

  drawBubble(data);
  //drawAverage(data); // in this order, lines will be on top of bubbles
  //drawLabels(data);

  svg.append("text")
     .attr("text-anchor", "middle")
     .attr("x", 480)
     .attr("font-size", 10)
     .attr("y", 15)
     .text("San Francisco Tenderloin Fire Emergency Calls, 2019");
}

/*
* draw bubbles
*/
function drawBubble(data) {
  // place all of the bubbles in their own group
  const group = plot.append('g').attr('id', 'bubbles');

  const bubbles = group.selectAll('circle')
  .data(data)
  .enter()
  .append('circle');

  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions
  bubbles.attr('cx', d => scales.x(new Date(d.CallDate)));
  //bubbles.attr('cy', d => scales.y(new Date(d.CallTime)));
  bubbles.attr('cy', function(d) {
    //split = d.CallTime.split(":");
    var constructedDate = new Date(2019, 0, 1, d.CallHour, d.CallMinute,d.CallSecond);
    return scales.y(constructedDate);
  })

  bubbles.attr('r',  d => scales.r(d.CallDuration));

  bubbles.style('stroke', 'white');
  bubbles.style('fill', d => scales.fill(d.CallType));


  circles = d3.select("g#bubbles").selectAll("circle");
  circles.on("mouseover.highlight", function(d) {
    d3.select(this)
    .raise() // bring to front
    .style("stroke", "red")
    .style("stroke-width", 2);

    // show what we interacted with
    //d3.select(status).text("highlight: dog");
  });

  circles.on("mouseout.highlight", function(d) {
    d3.select(this).lower().style("stroke", null);
    //d3.select(status).text("highlight: none");
  });

  circles.on("mouseover.brush1", function(d) {
    circles.filter(e => (d.CallType !== e.CallType)).transition().style("fill", "#bbbbbb");

    // show what we interacted with
    //d3.select(status).text("brush: " + d.type);
  });

  circles.on("mouseout.brush1", function(d) {
    circles.transition().style("fill", d => scales.fill(d.CallType));
  });

  circles.on("mouseover.hover2", function(d) {
    let me = d3.select(this);
    //let div = svg.append("div");
    //let div = d3.select("div#details");
    //let div = d3.select("svg").append("div").attr("id", "details");
    let div = d3.select("body").append("div").attr("id", "details");
    div.attr("class", "tooltip");



    //body.html(html);
    //div.style("visibility", "visible");
    div.html(generateTooltip(d));

    // copied over

  });

  circles.on("mousemove.hover2", function(d) {

    let div = d3.select("div#details");
    // get height of tooltip
    let bbox = div.node().getBoundingClientRect();

    //div.style("left", (d3.event.pageX + "px"));
    //div.style("bottom",  (d3.event.pageY + "px"));

    div.style("left", d3.event.clientX + "px");
    div.style("top",  (d3.event.pageY - bbox.height) + "px");

    //console.log("pageX: " + d3.event.pageX + "pageY: " + d3.event.pageY)
    //console.log("clientX: " + d3.event.clientX + "clientY: " + d3.event.clientY)
    //console.log(bbox.height);
    //console.log("left: " + (d3.event.clientX - margin.left - margin.right));
    //console.log("top: " + (d3.event.clientY - margin.top - margin.top));

  });

  circles.on("mouseout.hover2", function(d) {
    //  d3.selectAll("div#details").style("visibility", "hidden");
    d3.selectAll("div#details").remove();
  });

  circles.on("mousedown.level", function(d) {
    d3.select(this).lower().style("stroke", null);
    circles.transition().style("fill", d => scales.fill(d.CallType));
  })

  circles.on("mouseup.level", function(d) {
    let div = d3.select("div#details");

    //body.html(html);
    //div.style("visibility", "visible");
        div.html(generateTooltip(d));
  })

}

function drawColorLegend() {
  const colgroup = svg.append('g').attr('id', 'color-legend');

  colgroup.attr("transform", translate(835,250))
  //.style("font-size", "15px");

  // https://d3-legend.susielu.com/#size-linear
  const legendColor = d3.legendColor()
  .scale(scales.fill)
  .shape('circle')
  .ascending(false)
  .shapePadding(4)
  .labelOffset(10)
  .labelFormat("d")
  .title("Call Type Category")
  .orient('vertical');

  colgroup.call(legendColor);
}


/*
* this demonstrates d3-legend for creating a circle legend
* it is made to work with d3v4 not d3v5 however
*/
function drawCircleLegend() {
  const legendWidth = 200;
  const legendHeight = 20;

  // place legend into its own group
  const group = svg.append('g').attr('id', 'circle-legend');

  // position legend
  //group.attr('transform', translate(width - margin.right - legendWidth, margin.top + 75))
  group.attr('transform', translate(835, 50))

  // https://d3-legend.susielu.com/#size-linear
  const legendSize = d3.legendSize()
  .scale(scales.r)
  .shape('circle')
  .cells(6)
  .ascending(false)
  .shapePadding(4)
  .labelOffset(10)
  .labelFormat("d")
  .title('Response Time (Min)')
  .orient('vertical');

  group.call(legendSize);

  // fix the title spacing
  group.select('text.legendTitle').attr('dy', -8);

  // note it is harder to get this to be two column using this package
  // we have to select what was drawn and then move it around
}

/*
* draw axis titles
*/
function drawTitles() {
  const xMiddle = margin.left + midpoint(scales.x.range());
  const yMiddle = margin.top + midpoint(scales.y.range());

  // test middle calculation
  // svg.append("circle").attr("cx", xMiddle).attr("cy", yMiddle).attr("r", 5);

  const xTitle = svg.append('text')
  .attr('class', 'axis-title')
  .text('Date of Call (2019)');

  xTitle.attr('x', xMiddle);
  xTitle.attr('y', 500);
  xTitle.attr('dy', -4);
  xTitle.attr('text-anchor', 'middle');

  // it is easier to rotate text if you place it in a group first
  // https://developer.mozilla.org/en-US/docs/Web/CSS/transform-function/rotate

  const yGroup = svg.append('g');

  // set the position by translating the group
  yGroup.attr('transform', translate(4, yMiddle));

  const yTitle = yGroup.append('text')
  .attr('class', 'axis-title')
  .text('Time of Day');

  // keep x, y at 0, 0 for rotation around the origin
  yTitle.attr('x', 0);
  yTitle.attr('y', 0);

  yTitle.attr('dy', '1.75ex');
  yTitle.attr('text-anchor', 'middle');
  yTitle.attr('transform', 'rotate(-90)');
}

/*
* create axis lines
*/
function drawAxis() {
  // place the xaxis and yaxis in their own groups
  const xGroup = svg.append('g').attr('id', 'x-axis').attr('class', 'axis');
  const yGroup = svg.append('g').attr('id', 'y-axis').attr('class', 'axis');

  const xBar = svg.select('g#x-grid').attr('class', 'axis');
  const yBar = svg.select('g#y-grid').attr('class', 'axis');

  // create axis generators
  const xAxis = d3.axisBottom(scales.x);
  const yAxis = d3.axisLeft(scales.y);

  const xGrid = d3.axisBottom(scales.x);
  const yGrid = d3.axisLeft(scales.y);


  //scales.x.tickArguments([12, "M"]);
  // https://github.com/d3/d3-format#locale_formatPrefix
  //xAxis.ticks(12, 's').tickSizeOuter(0); was original
  xAxis.tickArguments([12, "%B"]).tickSizeOuter(0)//.tickSizeInner(100);
  xGrid.tickArguments([12, "%B"]).tickSizeOuter(0).tickSizeInner(-(height - margin.top - margin.bottom)).tickFormat("");

  //xAxis.ticks(11);
  //yAxis.ticks(6).tickSizeOuter(0);;
  yAxis.tickArguments([16, "%I %p"]).tickSizeOuter(0);
  yGrid.ticks(9).tickSizeOuter(0).tickSizeInner(-(width - margin.left - margin.right)).tickFormat("");

  // shift y axis to correct location
  yGroup.attr('transform', translate(margin.left, margin.top))
  yGroup.call(yAxis);

  yBar.attr('transform', translate(margin.left, margin.top))
  yBar.call(yGrid);

  // https://stackoverflow.com/questions/38921226/show-every-other-tick-label-on-d3-time-axis
  var ticks = d3.selectAll(".tick text");
  ticks.each(function(_, i) {
    if (i % 2 == 0) d3.select(this).remove();
  });

// shift x axis to correct location
xGroup.attr('transform', translate(margin.left, height - margin.bottom));
xGroup.call(xAxis);

xBar.attr('transform', translate(margin.left, height - margin.bottom));
xBar.call(xGrid);

length = height - margin.top - margin.bottom;

}

/*
* converts values as necessary and discards unused columns
*/
function convert(row) {

  //data wrangling handled in python & excel

  return row;
}

/*
* calculates the midpoint of a range given as a 2 element array
*/
function midpoint(range) {
  return range[0] + (range[1] - range[0]) / 2.0;
}

/*
* returns a translate string for the transform attribute
*/
function translate(x, y) {
  return 'translate(' + String(x) + ',' + String(y) + ')';
}

/*
* generates the HTML tooltip string from a given data
*/
function generateTooltip(d) {
  const html = `
  <table border="0" cellspacing="0" cellpadding="2">
  <tbody>
  <tr>
  <th>Category: </th>
  <td>${d.CallType}</td>
  </tr>
  <tr>
  <th>Call #: </th>
  <td>${d.CallNumber}</td>
  </tr>
  <tr>
  <th>Call Time: </th>
  <td>${d.ReceivedDtTm}</td>
  </tr>
  <tr>
  <th>All Unit Time: </th>
  <td>${d.CallDuration} min</td>
  </tr>
  <tr>
  <th>Last Unit Free: </th>
  <td>${d.AvailableDtTm}</td>
  </tr>
  <tr>
  <th>Unit(s): </th>
  <td>${d.UnitID}</td>
  </tr>
  <tr>
  <th>Location: </th>
  <td>${d.Address}</td>
  </tr>
  </tbody>
  </table>
  `;

  return html;
}
