// Credit mostly goes to Zakaria Chowdhury here:
// https://codepen.io/zakariachowdhury/pen/JEmjwq
// which this code is based off of

const MAX_WIDTH = 950;

// Formatter for currency
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

// Function to draw multi-line plot
const drawMultiLinePlot = (data) => {
  // Parse dates in the player data
  const parseDate = d3.timeParse("%Y-%m-%d");

  const cleanData = data.players.map((d1) => ({
    ...d1,
    data: [...d1.data.map((d2) => ({ ...d2, date: parseDate(d2.date) }))],
  }));

  // Sizes
  const width = Math.min(
    MAX_WIDTH,
    document.getElementById("chart").clientWidth
  );
  const height = 0.75 * width;
  const margin = 120;

  // Scales
  const xScale = d3
    .scaleTime()
    .domain(
      d3.extent(
        cleanData.map((player) => player.data.map((v) => v.date)).flat()
      )
    )
    .range([0, width - margin]);

  const yScale = d3
    .scaleLinear()
    .domain(
      d3
        .extent(
          cleanData.map((player) => player.data.map((v) => v.cumSum)).flat()
        )
        .map((x) => 1.05 * x)
    )
    .range([height - margin, 0]);

  // Make the SVG
  const svg = d3
    .select("#chart")
    .append("svg")
    .attr("width", width + margin + "px")
    .attr("height", height + margin + "px")
    .append("g")
    .attr("transform", `translate(${margin}, ${margin})`);

  // Line function
  const line = d3
    .line()
    .x((d) => xScale(d.date))
    .y((d) => yScale(d.cumSum));

  // Add lines
  let lines = svg.append("g").attr("class", "lines");

  const lineOpacity = 0.6;
  const lineOpacityHover = 0.85;
  const otherLinesOpacityHover = 0.15;
  const lineStroke = "1.5px";
  const lineStrokeHover = "2.5px";

  const circleOpacity = 0.85;
  const circleOpacityOnLineHover = 0.95;
  const circleRadius = 4;
  const circleRadiusHover = 8;

  lines
    .selectAll(".line-group")
    .data(cleanData)
    .enter()
    .append("g")
    .attr("class", "line-group")
    .on("mouseover", (event, d) => {
      svg.append("svg:image")
      .attr("class", "title-image")
      .attr("x", (width - margin) / 2)
      .attr("y", 5)
      .attr('width', 50)
      .attr('height', 50)
      .attr("xlink:href", d.avatar)

      svg
        .append("text")
        .attr("class", "title-text")
        .style("fill", d.colour)
        .text(d.name)
        .attr("text-anchor", "middle")
        .attr("x", (width - margin) / 2)
        .attr("y", 5);
    })
    .on("mouseout", function (d) {
      svg.select(".title-text").remove();
      svg.select(".title-image").remove();
    })
    .append("path")
    .attr("class", "line")
    .attr("d", (d) => line(d.data))
    .style("stroke", (d, i) => d.colour)
    .style("opacity", lineOpacity)
    .on("mouseover", (event, d) => {
      d3.selectAll(".line").style("opacity", otherLinesOpacityHover);
      d3.selectAll(".circle").style("opacity", circleOpacityOnLineHover);
      d3.select(event.currentTarget)
        .style("opacity", lineOpacityHover)
        .style("stroke-width", lineStrokeHover)
        .style("cursor", "pointer");
    })
    .on("mouseout", (event, d) => {
      d3.selectAll(".line").style("opacity", lineOpacity);
      d3.selectAll(".circle").style("opacity", circleOpacity);
      d3.select(event.currentTarget)
        .style("stroke-width", lineStroke)
        .style("cursor", "none");
    });

  // Add datapoints to lines
  lines
    .selectAll("circle-group")
    .data(cleanData)
    .enter()
    .append("g")
    .style("fill", (d, i) => d.colour)
    .selectAll("circle")
    .data((d) => d.data)
    .enter()
    .append("g")
    .attr("class", "circle")
    .on("mouseover", (event, d) => {
      d3.select(event.currentTarget)
        .style("cursor", "pointer")
        .append("text")
        .attr("class", "text")
        .text(
          currencyFormatter.format(d.cumSum) +
            " [Δ=" +
            currencyFormatter.format(d.delta) +
            "]"
        )
        .attr("x", (d) => xScale(d.date) - 55)
        .attr("y", (d) => yScale(d.cumSum) - 10);
    })
    .on("mouseout", (event, d) => {
      d3.select(event.currentTarget)
        .style("cursor", "none")
        .transition()
        .selectAll(".text")
        .remove();
    })
    .append("circle")
    .attr("cx", (d) => xScale(d.date))
    .attr("cy", (d) => yScale(d.cumSum))
    .attr("r", circleRadius)
    .style("opacity", circleOpacity)
    .on("mouseover", (event, d) => {
      d3.select(event.currentTarget).transition().attr("r", circleRadiusHover);
    })
    .on("mouseout", (event, d) => {
      d3.select(event.currentTarget).transition().attr("r", circleRadius);
    });

  // y-axis grid
  const yAxisGrid = d3
    .axisLeft(yScale)
    .tickSize(margin - width)
    .tickFormat("")
    .ticks(10)
    .tickSizeOuter(0);

  // SVG axes
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => currencyFormatter.format(d))
    .ticks(10);

  svg.append("g").attr("class", "y axis-grid").call(yAxisGrid);

  svg
    .append("g")
    .attr("class", "x axis")
    .attr("transform", `translate(0, ${height - margin})`)
    .call(xAxis);

  svg
    .append("g")
    .attr("class", "y axis")
    .call(yAxis)
    .append("text")
    .attr("y", 15)
    .attr("transform", "rotate(-90)")
    .attr("fill", "#000")
    .text("cumulative sum");
};

// Draw the graph after fetching data
fetch("../data/data.min.json")
  .then((response) => response.json())
  .then(drawMultiLinePlot);
