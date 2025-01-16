import * as d3 from "d3";
import PropTypes from "prop-types";
import { useEffect, useRef } from "react";

const PointsChart = ({ data }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const margin = { top: 20, right: 30, bottom: 50, left: 50 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    d3.select(svgRef.current).selectAll("*").remove(); // Clear previous render

    const svg = d3
      .select(svgRef.current)
      .attr(
        "viewBox",
        `0 0 ${width + margin.left + margin.right} ${
          height + margin.top + margin.bottom
        }`
      )
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const formattedData = data.map((d) => ({
      date: new Date(d.date),
      points: d.points,
    }));

    const xScale = d3
      .scaleTime()
      .domain(d3.extent(formattedData, (d) => d.date))
      .range([0, width]);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(formattedData, (d) => d.points)])
      .range([height, 0]);

    svg
      .append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%b %d")));

    svg.append("g").call(d3.axisLeft(yScale));

    const line = d3
      .line()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.points));

    svg
      .append("path")
      .datum(formattedData)
      .attr("fill", "none")
      .attr("stroke", "#4f46e5")
      .attr("stroke-width", 2)
      .attr("d", line);

    svg
      .selectAll(".dot")
      .data(formattedData)
      .enter()
      .append("circle")
      .attr("cx", (d) => xScale(d.date))
      .attr("cy", (d) => yScale(d.points))
      .attr("r", 4)
      .attr("fill", "#4f46e5");
  }, [data]);

  return <svg ref={svgRef} style={{ width: "100%", height: "auto" }} />;
};
PointsChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string.isRequired,
      points: PropTypes.number.isRequired,
    })
  ).isRequired,
};

export default PointsChart;
