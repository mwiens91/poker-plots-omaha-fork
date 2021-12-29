// This code is based off of the following two links
// https://www.d3-graph-gallery.com/graph/boxplot_several_groups.html
// https://observablehq.com/@d3/box-plot

// Function to draw box plot
const drawBoxPlot = (data, divId, maxWidth, xmargin, ymargin) => {
  // Display options
  const jitter = 0; // amount of random displacement for outlier dots (px)
  const outlierRadius = 3;
  const outlierOpacity = 1;
  const halfBoxWidth = 20;

  // Initialise a formatter for displaying currency
  const parseCurrency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  // Get relevant stats from data. Also filter out any players with < 3
  // data points
  const playersNew = data.players
    .filter((player) => player.data.length > 2)
    .map((player) => {
      const vals = player.data.map((d) => d.cumSum);

      const q1 = d3.quantile(vals, 0.25);
      const q2 = d3.quantile(vals, 0.5);
      const q3 = d3.quantile(vals, 0.75);
      const iqr = q3 - q1;
      const r0 = q1 - 1.5 * iqr;
      const r1 = q3 + 1.5 * iqr;

      return {
        ...player,
        quartiles: [q1, q2, q3],
        range: [r0, r1],
        outliers: vals.filter((x) => x < r0 || x > r1),
      };
    });

  // Sizes
  const width = Math.min(maxWidth, document.getElementById(divId).clientWidth);
  const height = 0.65 * width;

  // Scales
  const xScale = d3
    .scaleBand()
    .domain(playersNew.map((player) => player.name))
    .paddingInner(1)
    .paddingOuter(0.5)
    .range([0, width - xmargin]);
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
    .range([height - ymargin, 0]);

  // Make the SVG
  const svg = d3
    .select("#" + divId)
    .append("svg")
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", "0 0 " + (width + xmargin) + " " + (height + ymargin))
    .append("g")
    .attr("transform", `translate(${xmargin}, ${ymargin})`);

  // Axes
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => parseCurrency.format(d))
    .ticks(10);

  // Grids
  const yAxisGrid = d3
    .axisLeft(yScale)
    .tickSize(xmargin - width)
    .tickFormat("")
    .ticks(10)
    .tickSizeOuter(0);

  // Draw grids first, then axes
  svg.append("g").attr("class", "y axis-grid").call(yAxisGrid);

  svg
    .append("g")
    .attr("class", "x axis")
    .attr("transform", `translate(0, ${height - ymargin})`)
    .call(xAxis);

  svg
    .append("g")
    .attr("class", "y axis")
    .call(yAxis)
    .append("text")
    .attr("y", 15)
    .attr("transform", "rotate(-90)")
    .attr("fill", "#000")
    .text("cumulative sum (CAD)");

  // Show the main vertical lines
  svg
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
    .style("width", 40);

  // Draw the main box
  svg
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
    );

  // Median lines
  svg
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
    );

  // Outlier circles
  svg
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
    .attr("cy", (d) => yScale(d));
};

export { drawBoxPlot };
