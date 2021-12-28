// Credit mostly goes to Zakaria Chowdhury here:
// https://codepen.io/zakariachowdhury/pen/JEmjwq
// which this code is based off of

// Function to draw multi-line plot
const drawLinePlot = (data, divId, maxWidth) => {
  // Tweak display settings
  const lineOpacity = 0.6;
  const lineOpacityHover = 0.85;
  const otherLinesOpacityHover = 0.15;
  const lineStroke = "1.5px";
  const lineStrokeHover = "2.5px";

  const circleOpacity = 0.85;
  const circleOpacityOnLineHover = 0.95;
  const circleRadius = 4;
  const circleRadiusHover = 8;

  // Initialise a formatter for displaying currency
  const parseCurrency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  // Initialise a formatter for displaying dates
  const parseDate = d3.timeParse("%Y-%m-%d");

  // Make deep clone of player data
  const playersNew = structuredClone(data.players);

  // Parse dates in the player data
  for (const player of playersNew) {
    for (const datum of player.data) {
      datum.date = parseDate(datum.date);
    }
  }

  // Sizes
  const width = Math.min(
    maxWidth,
    document.getElementById(divId).clientWidth
  );
  const height = 0.75 * width;
  const margin = 120;

  // Scales
  const xScale = d3
    .scaleTime()
    .domain(
      d3.extent(
        playersNew.map((player) => player.data.map((v) => v.date)).flat()
      )
    )
    .range([0, width - margin]);

  const yScale = d3
    .scaleLinear()
    .domain(
      d3
        .extent(
          playersNew.map((player) => player.data.map((v) => v.cumSum)).flat()
        )
        .map((x) => 1.05 * x)
    )
    .range([height - margin, 0]);

  // Make the SVG
  const svg = d3
    .select("#" + divId)
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

  lines
    .selectAll(".line-group")
    .data(playersNew)
    .enter()
    .append("g")
    .attr("class", "line-group")
    // .on("mouseover", (event, d) => {
    // svg.append("svg:image")
    // .attr("class", "title-image")
    // .attr("x", (width - margin) / 2)
    // .attr("y", 5)
    // .attr('width', 50)
    // .attr('height', 50)
    // .attr("xlink:href", d.avatar)
    // svg
    //   .append("text")
    //   .attr("class", "title-text")
    //   .style("fill", d.colour)
    //   .text(d.name)
    //   .attr("text-anchor", "middle")
    //   .attr("x", (width - margin) / 2)
    //   .attr("y", 5);
    // })
    // .on("mouseout", function (d) {
    // svg.select(".title-text").remove();
    // svg.select(".title-image").remove();
    // })
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
    .data(playersNew)
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
          parseCurrency.format(d.cumSum) +
            " [Δ=" +
            parseCurrency.format(d.delta) +
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
    .tickFormat((d) => parseCurrency.format(d))
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

export { drawLinePlot };
