// Based off this link
// https://observablehq.com/@d3/calendar
//
// A lot of the code here is hard to read. Refactoring or whatever might
// be a good idea.

import { changeSelectedGame } from "./util.mjs";

// Function to draw calendar
const drawCalendar = (data, divId) => {
  // Display options
  const dayAbbrevs = "SMTWRFS";
  const cellSize = 17;

  const yearHeight = cellSize * 9;

  // Fixed width
  const width = 950;

  // Initialise a formatter for displaying currency
  const parseCurrency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  // Initialise a formatter for displaying dates
  const parseDate = d3.utcParse("%Y-%m-%d");

  // Massage the data so we just have (parsed) dates, total buy-ins,
  // average absolute deviation of the deltas, Gini mean difference of
  // the deltas, and game id
  const newData = data.games.map((game) => ({
    date: parseDate(game.date),
    totalBuyins: game.data.reduce((tot, datum) => tot + datum.buyin, 0),
    deltasAad:
      game.data.reduce((tot, x) => tot + Math.abs(x.delta), 0) /
      game.data.length,
    deltasGmd:
      game.data.reduce(
        (totOuter, x) =>
          totOuter +
          game.data.reduce(
            (totInner, y) => totInner + Math.abs(x.delta - y.delta),
            0
          ),
        0
      ) / Math.pow(game.data.length, 2),
    id: game.id,
  }));

  // Merge multiple games on same date
  const mergedGameIdsMap = {};
  const visitedIndicesSet = new Set();
  const indicesToPop = [];

  for (let i = 0; i < newData.length; i++) {
    // Skip over elements we've already processed
    if (visitedIndicesSet.has(i)) {
      continue;
    }

    // Find all elements that share this date
    const targetDate = newData[i].date;

    const elemsWithDate = newData
      .map((d, i) => (d.date.getTime() === targetDate.getTime() ? i : ""))
      .filter(String);

    // Add the game IDs to the merged game IDs map (the key will be the
    // game ID of the element which we will merge all other elements
    // into)
    const gameIdsWithDate = elemsWithDate.map((i) => newData[i].id);
    mergedGameIdsMap[gameIdsWithDate[0]] = gameIdsWithDate.slice().reverse();

    // If there's only one element for this date get out
    if (elemsWithDate.length === 1) {
      continue;
    }

    // (1) add the total buy-ins to the smallest game index (i.e, the
    // largest/latest game ID)
    // (2) and mark all but the smallest game index to remove from the
    // newData array
    // (3) add all of the indices to the set of indices to skip
    for (let j = 1; j < elemsWithDate.length; j++) {
      newData[i].totalBuyins += newData[j].totalBuyins;
      indicesToPop.push(elemsWithDate[j]);
      visitedIndicesSet.add(elemsWithDate[j]);
    }

    // Set the date of the smallest game index to the largest game
    // index (this is necessary for the merged game to render in the
    // correct cell)
    newData[i].date = newData[elemsWithDate[elemsWithDate.length - 1]].date;
  }

  // Pop all extraneous elements
  for (const i of indicesToPop.reverse()) {
    newData.splice(i, 1);
  }

  // Get all dates to add in
  const firstYearAddInDates = d3.utcDays(
    new Date(Date.UTC(newData[newData.length - 1].date.getFullYear(), 0, 1)),
    newData[newData.length - 1].date
  );
  const lastYearAddInDates = d3.utcDays(
    newData[0].date,
    new Date(Date.UTC(newData[0].date.getFullYear() + 1, 0, 1))
  );
  lastYearAddInDates.shift();

  const addInDates = [...firstYearAddInDates, ...lastYearAddInDates];

  newData.reduce((curr, next) => {
    const tempDates = d3.utcDays(next.date, curr.date);
    tempDates.shift();
    addInDates.push(...tempDates);
    return next;
  });

  // Add in new dates
  for (const date of addInDates) {
    newData.push({ date: date, totalBuyins: 0, id: null });
  }

  newData.sort((a, b) => b.date - a.date);

  // Seperate the data into
  // - X (temporal values)
  // - Y (quant values)
  // - I (indices)
  const X = d3.map(newData, (d) => d.date);
  const Y = d3.map(newData, (d) => d.totalBuyins);
  const I = d3.range(X.length);

  // Group data by year (data already sorted)
  const years = d3.groups(I, (i) => X[i].getUTCFullYear());

  // Formating options
  const formatDay = (i) => dayAbbrevs[i];
  const formatMonth = d3.utcFormat("%b");

  // Set up the colour scheme
  const colour = d3
    .scaleSqrt()
    .domain([0, d3.max(newData.map((datum) => datum.totalBuyins))])
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
  const tooltipMousemove = (event) =>
    tooltip
      .style("left", event.pageX + 30 + "px")
      .style("top", event.pageY - 20 + "px");
  const tooltipMouseout = () => tooltip.style("opacity", 0);
  const tooltipMouseover = (event, d) =>
    tooltip.style("opacity", 0.8).html(
      `<b>${X[d].toLocaleDateString("en-US", {
        timeZone: "UTC",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })}</b><br>` +
        (newData[d].id === null
          ? "no game"
          : `total buy-ins: ${parseCurrency.format(
              newData[d].totalBuyins
            )}<br>` +
            `deltas AAD: ${parseCurrency.format(newData[d].deltasAad)}` +
            "<br>" +
            `deltas GMD: ${parseCurrency.format(newData[d].deltasGmd)}`)
    );

  // svg stuff
  const height = yearHeight * years.length;

  svg
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("font-family", "sans-serif")
    .attr("font-size", 10);

  // Setup where to put years
  const year = svg
    .selectAll("g")
    .data(years)
    .join("g")
    .attr(
      "transform",
      (d, i) => `translate(40.5,${yearHeight * i + cellSize * 1.5})`
    );

  // Bolded year text
  year
    .append("text")
    .attr("x", -5)
    .attr("y", -5)
    .attr("font-weight", "bold")
    .attr("text-anchor", "end")
    .text(([key]) => key);

  // Date texts (e.g., SMTWRFS)
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

  // Make the cells
  year
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
    .on("click", (event, d) => {
      newData[d].id === null
        ? null
        : changeSelectedGame(data, mergedGameIdsMap[newData[d].id]);
      document.getElementById("selected-game-title").scrollIntoView();
    });

  // Get the months. This is highly unreadable. Sorry?
  const month = year
    .append("g")
    .selectAll("g")
    .data(([, I]) => d3.utcMonths(X[I[I.length - 1]], X[I[0]]))
    .join("g");

  // Draw a white border on the grid to delineate months
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

  // Month text
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
