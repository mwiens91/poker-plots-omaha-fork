// Based off this link
// https://observablehq.com/@d3/calendar

// Function to draw calendar
const drawCalendar = (data, divId, margin) => {
  // Display options
  const dayAbbrevs = "SMTWRFS";
  const cellSize = 17;

  const height = cellSize * 9;

  // Fixed width
  const width = 950

  // Initialise a formatter for displaying currency
  const parseCurrency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  // Initialise a formatter for displaying dates
  const parseDate = d3.timeParse("%Y-%m-%d");

  // Massage the data so we just have (parsed) dates, total buy-ins and
  // game id
  let newData = data.games.map((game) => ({
    date: parseDate(game.date),
    val: game.data.reduce((tot, datum) => tot + datum.buyin, 0),
    id: game.id,
  }));

  // Get all dates to add in
  const firstYearAddInDates = d3.timeDays(
    new Date(newData[newData.length - 1].date.getFullYear(), 0, 1),
    newData[newData.length - 1].date
  );
  let lastYearAddInDates = d3.timeDays(
    newData[0].date,
    new Date(newData[0].date.getFullYear() + 1, 0, 1)
  );
  lastYearAddInDates.shift();

  let addInDates = [...firstYearAddInDates, ...lastYearAddInDates];

  newData.reduce((curr, next) => {
    let tempDates = d3.timeDays(next.date, curr.date);
    tempDates.shift();
    addInDates.push(...tempDates);
    return next;
  });

  // Add in new dates
  for (const date of addInDates) {
    newData.push({ date: date, val: 0, id: null });
  }

  newData.sort((a, b) => b.date - a.date);

  // Seperate the data into
  // - X (temporal values)
  // - Y (quant values)
  // - I (indices)
  const X = d3.map(newData, (d) => d.date);
  const Y = d3.map(newData, (d) => d.val);
  const I = d3.range(X.length);

  // Group data by year (data already sorted)
  const years = d3.groups(I, (i) => X[i].getUTCFullYear());

  // Formating options
  const formatDay = (i) => dayAbbrevs[i];
  const formatMonth = d3.utcFormat("%b");

  // Set up the colour scheme
  const colour = d3
    .scaleSqrt()
    .domain([0, d3.max(newData.map((datum) => datum.val))])
    .range(["#ebedf0", "teal"]);

  // Make the SVG
  const svg = d3
    .select("#" + divId)
    .append("svg")
    .attr("id", "calendar-svg");

  // Tooltip stuff
  const tooltip = d3
    .select("#" + divId)
    .append("div")
    .style("opacity", 0)
    .style("position", "absolute")
    .attr("class", "tooltip");
  const tooltipMousemove = (event, d) =>
    tooltip
      .style("left", event.pageX + 30 + "px")
      .style("top", event.pageY - 20 + "px");
  const tooltipMouseout = (event, d) => tooltip.style("opacity", 0);
  const tooltipMouseover = (event, d) =>
    tooltip.style("opacity", 0.8).html(
      `<b>${X[d].toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })}</b><br>` +
        (newData[d].id === null
          ? "no game"
          : `total buy-in: ${parseCurrency.format(newData[d].val)}`)
    );

  // svg stuff
  svg
    .attr("width", width + margin.left + margin.right)
    .attr("height", height * years.length + margin.top + margin.bottom)
    .attr(
      "viewBox",
      "0 0 " +
        (width + margin.left + margin.right) +
        " " +
        (height * years.length + margin.top + margin.bottom)
    )
    .attr("font-family", "sans-serif")
    .attr("font-size", 10);

  const year = svg
    .selectAll("g")
    .data(years)
    .join("g")
    .attr(
      "transform",
      (d, i) => `translate(40.5,${height * i + cellSize * 1.5})`
    );

  year
    .append("text")
    .attr("x", -5)
    .attr("y", -5)
    .attr("font-weight", "bold")
    .attr("text-anchor", "end")
    .text(([key]) => key);

  year
    .append("g")
    .attr("text-anchor", "end")
    .selectAll("text")
    .data(d3.range(7))
    .join("text")
    .attr("x", -5)
    .attr("y", (i) => (i + 0.5) * cellSize)
    .attr("dy", "0.31em")
    .text(formatDay);

  const cell = year
    .append("g")
    .selectAll("rect")
    .data(([, I]) => I)
    .join("rect")
    .attr("width", cellSize - 1)
    .attr("height", cellSize - 1)
    .attr(
      "x",
      (i) => d3.utcSunday.count(d3.utcYear(X[i]), X[i]) * cellSize + 0.5
    )
    .attr("y", (i) => X[i].getUTCDay() * cellSize + 0.5)
    .attr("fill", (i) => colour(Y[i]))
    .on("mouseover", tooltipMouseover)
    .on("mousemove", tooltipMousemove)
    .on("mouseout", tooltipMouseout)
    .on("click", (event, d) =>
      newData[d].id === null
        ? null
        : document.getElementById("game-" + newData[d].id).scrollIntoView()
    );

  const month = year
    .append("g")
    .selectAll("g")
    .data(([, I]) => d3.timeMonths(X[I[I.length - 1]], X[I[0]]))
    .join("g");

  month
    .filter((d, i) => i)
    .append("path")
    .attr("fill", "none")
    .attr("stroke", "#fff")
    .attr("stroke-width", 3)
    .attr("d", (t) => {
      const d = Math.min(7, t.getUTCDay());
      const w = d3.utcSunday.count(d3.utcYear(t), t);
      return `${
        d === 7
          ? `M${(w + 1) * cellSize},0`
          : `M${(w + 1) * cellSize},0V${d * cellSize}H${w * cellSize}`
      }V${7 * cellSize}`;
    });

  month
    .append("text")
    .attr(
      "x",
      (d) =>
        d3.utcSunday.count(d3.utcYear(d), d3.utcSunday.ceil(d)) * cellSize + 2
    )
    .attr("y", -5)
    .text(formatMonth);
};

export { drawCalendar };
