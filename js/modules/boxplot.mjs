// This code is based off of the following two links
// https://www.d3-graph-gallery.com/graph/boxplot_several_groups.html
// https://observablehq.com/@d3/box-plot

// Function to draw box plot. Returns a redraw function.
const drawBoxPlot = (data, divId, margin) => {
  // Display options
  const jitter = 0; // amount of random displacement for outlier dots (px)
  const outlierRadius = "0.22em";
  const outlierOpacity = 0.5;

  // Offset for the currency text
  const currencyTextOffset = 20;

  // Minimum number of games to be eligible for box plot
  const minNumberGames = 5;

  // Max and min percentage of width that height is
  const minWidthHeightFactor = 0.45;
  const maxWidthHeightFactor = 0.65;

  // Size functions
  const containerElement = document.getElementById("main-container");
  const getWidth = () => containerElement.clientWidth;
  const getHeight = (width) =>
    Math.max(
      Math.min(
        Math.floor(document.documentElement.clientHeight / 100) * 100 - 200,
        maxWidthHeightFactor * width
      ),
      minWidthHeightFactor * width
    );

  // Scale the boxplot boxes' width based on viewport
  const getHalfBoxWidth = (width) => (width * 22) / 1296;

  // Initialise a formatter for displaying currency
  const parseCurrency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  // Extend the formatter to show plusminus, using the minus sign that
  // has the same width as a plus sign
  const parseCurrencyPlusMinus = (x) =>
    (x >= 0 ? "+" : "") + parseCurrency.format(x);

  // Get relevant stats from data
  const playersNew = data.players
    .filter((player) => player.data.length >= minNumberGames)
    .map((player) => {
      const vals = player.data.map((d) => d.delta);

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
        outliers: vals
          .filter((x) => x < r0 || x > r1)
          .map((x) => ({ value: x, name: player.name })),
      };
    });

  // Sizes
  let width = getWidth();
  let height = getHeight(width);

  // Width of boxplot ... boxes
  let halfBoxWidth = getHalfBoxWidth(width);

  // Scales
  const xScale = d3
    .scaleBand()
    .domain(playersNew.map((player) => player.name))
    .paddingInner(1)
    .paddingOuter(0.5)
    .range([margin.left, width - margin.right]);
  const yScale = d3
    .scaleLinear()
    .domain(
      d3
        .extent(
          playersNew
            .map((player) => [
              ...player.outliers.map((x) => x.value),
              ...player.range,
            ])
            .flat()
        )
        .map((x) => 1.05 * x)
    )
    .range([height - margin.bottom, margin.top]);

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
  const tooltipNormalMouseover = (event, d) => {
    const q4Str = parseCurrencyPlusMinus(d.range[1]);
    const q3Str = parseCurrencyPlusMinus(d.quartiles[2]);
    const q2Str = parseCurrencyPlusMinus(d.quartiles[1]);
    const q1Str = parseCurrencyPlusMinus(d.quartiles[0]);
    const q0Str = parseCurrencyPlusMinus(d.range[0]);

    tooltip
      .style("opacity", 0.8)
      .html(
        `<b>${d.name}</b><br>` +
          '<span class="tooltip-boxplot-first-item">' +
          "max:" +
          "</span>" +
          '<span class="font-tabular-numbers tooltip-boxplot-second-item">' +
          q4Str +
          "</span>" +
          "<br>" +
          '<span class="tooltip-boxplot-first-item">' +
          "Q<sub>3</sub>:" +
          "</span>" +
          '<span class="font-tabular-numbers tooltip-boxplot-second-item">' +
          q3Str +
          "</span>" +
          "<br>" +
          '<span class="tooltip-boxplot-first-item">' +
          "Q<sub>2</sub>:" +
          "</span>" +
          '<span class="font-tabular-numbers tooltip-boxplot-second-item">' +
          q2Str +
          "</span>" +
          "<br>" +
          '<span class="tooltip-boxplot-first-item">' +
          "Q<sub>1</sub>:" +
          "</span>" +
          '<span class="font-tabular-numbers tooltip-boxplot-second-item">' +
          q1Str +
          "</span>" +
          "<br>" +
          '<span class="tooltip-boxplot-first-item">' +
          "min:" +
          "</span>" +
          '<span class="font-tabular-numbers tooltip-boxplot-second-item">' +
          q0Str +
          "</span>"
      );
  };
  const tooltipOutlierMouseover = (event, d) =>
    tooltip
      .style("opacity", 0.8)
      .html(
        `<b>${d.name}</b><br>` + `outlier: ${parseCurrency.format(d.value)}`
      );

  // Function to draw plot
  const drawGraph = () => {
    // Make the SVG ... G
    const svgG = svg
      .attr("viewBox", [0, 0, width, height])
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Axes
    const numYAxisTicks = 10;

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3
      .axisLeft(yScale)
      .tickFormat((d) => parseCurrency.format(d))
      .ticks(numYAxisTicks);

    // Grids
    const yAxisGrid = d3
      .axisLeft(yScale)
      .tickSize(margin.left + margin.right - width)
      .tickFormat("")
      .ticks(numYAxisTicks)
      .tickSizeOuter(0);

    // Draw grids first, then axes
    svgG
      .append("g")
      .attr("class", "y axis-grid")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(yAxisGrid);

    svgG
      .append("g")
      .attr("class", "x axis")
      .attr("transform", `translate(0, ${height - margin.bottom})`)
      .call(xAxis);

    svgG
      .append("g")
      .attr("class", "y axis")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(yAxis)
      .append("text")
      .attr("y", 15)
      .attr("transform", `rotate(-90) translate(-${currencyTextOffset}, 0.2)`)
      .attr("fill", "#000")
      .text("winnings/losses (CAD)");

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
      V${yScale(d.quartiles[2])}
      `
      )
      .attr("stroke", "black")
      .on("mouseover", tooltipNormalMouseover)
      .on("mousemove", tooltipMousemove)
      .on("mouseout", tooltipMouseout);

    svgG
      .selectAll("vertlines")
      .data(playersNew)
      .enter()
      .append("path")
      .attr(
        "d",
        (d) => `
      M${xScale(d.name)}, ${yScale(d.quartiles[0])}
      V${yScale(d.range[0])}
      `
      )
      .attr("stroke", "black")
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
      .style("opacity", 0.8)
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
      .attr("cy", (d) => yScale(d.value))
      .on("mouseover", tooltipOutlierMouseover)
      .on("mousemove", tooltipMousemove)
      .on("mouseout", tooltipMouseout);
  };

  // Call graph drawing function
  drawGraph();

  // Return function to redraw graph
  return () => {
    // Get new proposed size
    const newWidth = getWidth();
    const newHeight = getHeight(newWidth);

    // Don't redraw if width and height remain unchanged
    if (newWidth !== width || newHeight !== height) {
      width = newWidth;
      height = newHeight;

      halfBoxWidth = getHalfBoxWidth(width);

      // Update scales
      xScale.range([margin.left, width - margin.right]);
      yScale.range([height - margin.bottom, margin.top]);

      // Remove everything and redraw
      svg.selectAll("*").remove();
      drawGraph();
    }
  };
};

export { drawBoxPlot };
