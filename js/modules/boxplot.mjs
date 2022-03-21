// This code is based off of the following two links
// https://www.d3-graph-gallery.com/graph/boxplot_several_groups.html
// https://observablehq.com/@d3/box-plot

// Function to draw box plot. Returns a redraw function.
const drawBoxPlot = (data, divId, maxWidth, margin) => {
  // Display options
  const jitter = 0; // amount of random displacement for outlier dots (px)
  const outlierRadius = 3;
  const outlierOpacity = 0.5;
  const halfBoxWidth = 20;

  // Minimum number of games to be eligible for box plot
  const minNumberGames = 5;

  // Initialise a formatter for displaying currency
  const parseCurrency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  // Get relevant stats from data
  const playersNew = data.players
    .filter((player) => player.data.length >= minNumberGames)
    .map((player) => {
      const vals = player.data.map((d) => d.cumSum);

      const q1 = d3.quantile(vals, 0.25);
      const q2 = d3.quantile(vals, 0.5);
      const q3 = d3.quantile(vals, 0.75);
      const iqr = q3 - q1;
      const r0 = d3.max([d3.min(vals), q1 - 1.5 * iqr]);
      const r1 = d3.min([d3.max(vals), q3 + 1.5 * iqr]);

      return {
        ...player,
        quartiles: [q1, q2, q3],
        range: [r0, r1],
        outliers: vals.filter((x) => x < r0 || x > r1),
      };
    });

  // Sizes
  let width = Math.min(maxWidth, document.getElementById(divId).clientWidth);
  let height = 0.5 * width;

  // Scales
  const xScale = d3
    .scaleBand()
    .domain(playersNew.map((player) => player.name))
    .paddingInner(1)
    .paddingOuter(0.5)
    .range([0, width - margin.left - margin.right]);
  const yScale = d3
    .scaleLinear()
    .domain(
      d3
        .extent(
          playersNew
            .map((player) => [...player.outliers, ...player.range])
            .flat()
        )
        .map((x) => 1.05 * x)
    )
    .range([height - margin.top - margin.bottom, 0]);

  // Make the SVG
  const svg = d3.select("#" + divId).append("svg");

  // Tooltip stuff
  const tooltip = d3
    .select("#" + divId)
    .append("div")
    .style("opacity", 0)
    .style("position", "absolute")
    .attr("class", "tooltip");
  const tooltipMousemove = (event) =>
    tooltip
      .style("left", event.pageX + 30 + "px")
      .style("top", event.pageY - 20 + "px");
  const tooltipMouseout = () => tooltip.style("opacity", 0);
  const tooltipNormalMouseover = (event, d) =>
    tooltip
      .style("opacity", 0.8)
      .html(
        `max: ${parseCurrency.format(d.range[1])}<br>` +
          `75% quantile: ${parseCurrency.format(d.quartiles[2])}<br>` +
          `50% quantile: ${parseCurrency.format(d.quartiles[1])}<br>` +
          `25% quantile: ${parseCurrency.format(d.quartiles[0])}<br>` +
          `min: ${parseCurrency.format(d.range[0])}`
      );
  const tooltipOutlierMouseover = (event, d) =>
    tooltip.style("opacity", 0.8).html("outlier: " + parseCurrency.format(d));

  // Function to draw plot
  const drawGraph = () => {
    // Make the SVG ... G
    const svgG = svg
      .attr(
        "viewBox",
        "0 0 " +
          (width + margin.left + margin.right) +
          " " +
          (height + margin.top + margin.bottom)
      )
      .append("g")
      .attr(
        "transform",
        `translate(${margin.left + margin.right}, ${
          margin.top + margin.bottom
        })`
      );

    // Axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3
      .axisLeft(yScale)
      .tickFormat((d) => parseCurrency.format(d))
      .ticks(10);

    // Grids
    const yAxisGrid = d3
      .axisLeft(yScale)
      .tickSize(margin.left + margin.right - width)
      .tickFormat("")
      .ticks(10)
      .tickSizeOuter(0);

    // Draw grids first, then axes
    svgG.append("g").attr("class", "y axis-grid").call(yAxisGrid);

    svgG
      .append("g")
      .attr("class", "x axis")
      .attr("transform", `translate(0, ${height - margin.top - margin.bottom})`)
      .call(xAxis);

    svgG
      .append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .append("text")
      .attr("y", 15)
      .attr("transform", "rotate(-90)")
      .attr("fill", "#000")
      .text("cumulative sum (CAD)");

    // Show the main vertical lines
    svgG
      .selectAll("vertlines")
      .data(playersNew)
      .enter()
      .append("path")
      .attr(
        "d",
        (d) => `
      M${xScale(d.name)}, ${yScale(d.range[1])}
      V${yScale(d.range[0])}
      `
      )
      .attr("stroke", "black")
      .style("width", 40)
      .on("mouseover", tooltipNormalMouseover)
      .on("mousemove", tooltipMousemove)
      .on("mouseout", tooltipMouseout);

    // Draw the main box
    svgG
      .selectAll("boxes")
      .data(playersNew)
      .enter()
      .append("path")
      .attr("fill", (d) => d.colourHex)
      .attr(
        "d",
        (d) => `
        M${xScale(d.name) + halfBoxWidth}, ${yScale(d.quartiles[2])}
        H${xScale(d.name) - halfBoxWidth}
        V${yScale(d.quartiles[0])}
        H${xScale(d.name) + halfBoxWidth}
        Z
      `
      )
      .on("mouseover", tooltipNormalMouseover)
      .on("mousemove", tooltipMousemove)
      .on("mouseout", tooltipMouseout);

    // Median lines
    svgG
      .selectAll("horizlines")
      .data(playersNew)
      .enter()
      .append("path")
      .attr("stroke", "black")
      .attr(
        "d",
        (d) => `
        M${xScale(d.name) + halfBoxWidth},${yScale(d.quartiles[1])}
        H${xScale(d.name) - halfBoxWidth}
      `
      )
      .on("mouseover", tooltipNormalMouseover)
      .on("mousemove", tooltipMousemove)
      .on("mouseout", tooltipMouseout);

    // Whiskers
    svgG
      .selectAll("horizlines")
      .data(playersNew)
      .enter()
      .append("path")
      .attr("stroke", "black")
      .attr(
        "d",
        (d) => `
        M${xScale(d.name) + halfBoxWidth / 3},${yScale(d.range[1])}
        H${xScale(d.name) - halfBoxWidth / 3}
      `
      )
      .on("mouseover", tooltipNormalMouseover)
      .on("mousemove", tooltipMousemove)
      .on("mouseout", tooltipMouseout);
    svgG
      .selectAll("horizlines")
      .data(playersNew)
      .enter()
      .append("path")
      .attr("stroke", "black")
      .attr(
        "d",
        (d) => `
        M${xScale(d.name) + halfBoxWidth / 3},${yScale(d.range[0])}
        H${xScale(d.name) - halfBoxWidth / 3}
      `
      )
      .on("mouseover", tooltipNormalMouseover)
      .on("mousemove", tooltipMousemove)
      .on("mouseout", tooltipMouseout);

    // Outlier circles
    svgG
      .selectAll("circle-group")
      .data(playersNew)
      .enter()
      .append("g")
      .attr("fill", (d) => d.colourHex)
      .attr("fill-opacity", outlierOpacity)
      .attr("stroke", "none")
      .attr("transform", (d) => `translate(${xScale(d.name)}, 0)`)
      .selectAll("circle")
      .data((d) => d.outliers)
      .enter()
      .append("g")
      .attr("class", "circle")
      .append("circle")
      .attr("r", outlierRadius)
      .attr("cx", () => (Math.random() - 0.5) * jitter)
      .attr("cy", (d) => yScale(d))
      .on("mouseover", tooltipOutlierMouseover)
      .on("mousemove", tooltipMousemove)
      .on("mouseout", tooltipMouseout);
  };

  // Call graph drawing function
  drawGraph();

  // Return function to redraw graph
  return () => {
    // Reset sizes
    width = Math.min(maxWidth, document.getElementById(divId).clientWidth);
    height = 0.65 * width;

    // Update scales
    xScale.range([0, width - margin.left - margin.right]);
    yScale.range([height - margin.top - margin.bottom, 0]);

    // Remove everything and redraw
    svg.selectAll("*").remove();
    drawGraph();
  };
};

export { drawBoxPlot };
