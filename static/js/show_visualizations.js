getAdaptiveSamples();

function getAdaptiveSamples() {
    queue()
        .defer(d3.json, "/pca");
}

function checkTab(evt, tabName) {
    var i, tabcontent, tabStyles;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tabStyle" and remove the class "active"
    tabStyles = document.getElementsByClassName("tabStyle");
    for (i = 0; i < tabStyles.length; i++) {
        tabStyles[i].className = tabStyles[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";

    if(tabName === 'gameweek') {
        makeGameweekPlot();
    }
    else if(tabName === 'season') {
        collapsibleTree();
    }
}

var margin = {top: 20, right: 20, bottom: 20, left: 20},
    width = 600 - margin.left - margin.right,
    height = 350 - margin.top - margin.bottom;

function makeGameweekPlot() {

    queue()
        .defer(d3.json, "static/leaguejson/players_pca_json.json")
        .await(drawScatterPlot);

    d3.select("#canvas").remove();

    var xValue = function(d) { return d.PCA1; };
    var xScale = d3.scale.linear().domain([-2, 2]).range([0, width]);
    var xMap = function(d) { return xScale(xValue(d)); };
    var xAxis = d3.svg.axis().scale(xScale).orient("bottom");

    var yValue = function(d) { return d.PCA2; };
    var yScale = d3.scale.linear().domain([-2, 2]).range([height, 0]);
    var yMap = function(d) { return yScale(yValue(d)); };
    var yAxis = d3.svg.axis().scale(yScale).orient("left");

    var color = d3.scale.category10();

    var svg = d3.select("#pca-chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("id", "canvas")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var tooltip = d3.select("#pca-chart").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    var slider = d3.select("#slider").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", 40)
        .attr("class", "slider")
        .attr("transform", "translate(" + (margin.left) + "," + (margin.top) + ")");

    var ticksData = d3.scale.linear()
        .domain([0, 38])
        .range([0, width])
        .clamp(true);


    function drawScatterPlot(error, playersJson) {
        if(error) throw error;

        var playersData = playersJson;
        if(Math.abs(d3.min(playersData, xValue)) > d3.max(playersData, xValue))
            xScale.domain([d3.min(playersData, xValue)-0.2, -d3.min(playersData, xValue)+0.2]);
        else
            xScale.domain([-d3.max(playersData, xValue)-0.2, d3.max(playersData, xValue)+0.2]);

        if(Math.abs(d3.min(playersData, yValue)) > d3.max(playersData, yValue))
            yScale.domain([d3.min(playersData, yValue)-0.2, -d3.min(playersData, yValue)+0.2]);
        else
            yScale.domain([-d3.max(playersData, yValue)-0.2, d3.max(playersData, yValue)+0.2]);

        // Draw the X-Axis
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + yScale(0) + ")")
            .call(xAxis)
            .append("text")
            .attr("class", "label")
            .attr("x", width)
            .attr("y", -6)
            .style("text-anchor", "end")
            .style("font-weight", "bold")
            .style("font-size", "1.2em")
            .text("PCA-1");

        // Draw the Y-Axis
        svg.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate("+ xScale(0) + ", 0)")
            .call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("x", 10)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .style("font-weight", "bold")
            .style("font-size", "1.2em")
            .text("PCA-2");

        var points = svg.selectAll(".points")
            .data(playersData);
        points.enter().append("circle")
            .attr("class", "dot")
            .transition()
            .duration(1000)
            .ease("backOut")
            .attr("r", 3.5)
            .attr("cx", xMap)
            .attr("cy", yMap)
            .style("fill", function(d) { return color(d); });

        points.on("mouseover", function(d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(d.Name + " (" + xValue(d) + ", " + yValue(d) + ")")
                .style("left", (d3.event.pageX - 670) + "px")
                .style("top", (d3.event.pageY - 180) + "px");
        })
            .on("mouseout", function(d) {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        slider.append("line")
            .attr("class", "track")
            .attr("width", width+40)
            .attr("height", height + 70)
            .attr("x1", xScale.range()[0])
            .attr("x2", xScale.range()[1])
            .select(function() {
                return this.parentNode.appendChild(this.cloneNode(true));
            })
            .attr("class", "track-inset")
            .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
            .attr("class", "track-overlay")
            .call(d3.behavior.drag())
            .on("dragend", function() {
                xposEnd = d3.mouse(this)[0];
                console.log(xposEnd);
                slider.interrupt(); })
            .on("dragstart", function () {
                hue(x.invert(d3.event.x));
            });

        //     xposEnd = d3.mouse(this)[0];
        //     console.log(xposEnd);
        //     if(xposStart > xposEnd) {
        //         bins = bins - 1;
        //         //makeBarChart(newData, bins);
        //     }
        //     else if(xposStart < xposEnd) {
        //         bins = bins + 1;
        //         //makeBarChart(newData, bins);
        //     }
        //     slider.interrupt();
        // })
        // .on("dragstart", function(d) {
        //     //xposStart = d3.mouse(this)[0];
        // }));

        slider.insert("g", ".track-overlay")
            .attr("class", "ticks")
            .attr("transform", "translate(0," + 18 + ")")
            .selectAll("text")
            .data(ticksData.ticks(38))
            .enter().append("text")
            .attr("x", ticksData)
            .attr("text-anchor", "middle")
            .style("font-size", "9px")
            .text(function(d) { return d; });

        var handle = slider.insert("circle", ".track-overlay")
            .attr("class", "handle")
            .attr("r", 9);

        slider.transition()
            .duration(750)
            .tween("hue", function() {
                var i = d3.interpolate(0, 0.5);
                return function(t) { hue(i(t)); };
            });

        function hue(h) {
            handle.attr("cx", xScale(h));
            svg.style("background-color", d3.hsl(h, 0.8, 0.8));
        }
    }
}