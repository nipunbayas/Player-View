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
        makeSlider();
    }
    else if(tabName === 'season') {
        collapsibleTree();
    }
    else if(tabName === 'bump') {
        bumpChart();
    }
}

var margin = {top: 20, right: 20, bottom: 20, left: 20},
    width = 600 - margin.left - margin.right,
    height = 250 - margin.top - margin.bottom;

function makeGameweekPlot() {
    queue()
        .defer(d3.json, "static/leaguejson/players_pca_json.json")
        .await(drawScatterPlot);

    d3.select("#canvas").remove();

    var svg = d3.select("#pca-chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", 385 + margin.top + margin.bottom)
        .attr("id", "canvas")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var tooltip = d3.select("#pca-chart").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    d3.selection.prototype.moveToFront = function() {
        return this.each(function(){
            this.parentNode.appendChild(this);
        });
    };

    function drawScatterPlot(error, playersJson) {
        if (error) throw error;

        var xValue = function(d) { return d.MDS1; };
        var xScale = d3.scale.linear().domain([-2,2]).range([0, width]);
        var xMap = function(d) { return xScale(xValue(d)); };
        var xAxis = d3.svg.axis().scale(xScale).orient("bottom");

        var yValue = function(d) { return d.MDS2; };
        var yScale = d3.scale.linear().domain([-2,2]).range([385, 0]);
        var yMap = function(d) { return yScale(yValue(d)); };
        var yAxis = d3.svg.axis().scale(yScale).orient("left");

        var color = d3.scale.category10();

        var playersData = playersJson;
        if (Math.abs(d3.min(playersData, xValue)) > d3.max(playersData, xValue))
            xScale.domain([d3.min(playersData, xValue) - 0.2, -d3.min(playersData, xValue) + 0.2]);
        else
            xScale.domain([-d3.max(playersData, xValue) - 0.2, d3.max(playersData, xValue) + 0.2]);

        if (Math.abs(d3.min(playersData, yValue)) > d3.max(playersData, yValue))
            yScale.domain([d3.min(playersData, yValue) - 0.2, -d3.min(playersData, yValue) + 0.2]);
        else
            yScale.domain([-d3.max(playersData, yValue) - 0.2, d3.max(playersData, yValue) + 0.2]);


        var zoom = d3.behavior.zoom()
            .x(xScale)
            .y(yScale)
            .scaleExtent([1, 100])
            .on("zoom", zoomed);

        svg.call(zoom);

        svg.append("rect")
            .style("fill", "#fff")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

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
            // .style("font-size", "1.2em")
            .text("MDS-1");

        // Draw the Y-Axis
        svg.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + xScale(0) + ", 0)")
            .call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("x", 10)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .style("font-weight", "bold")
            // .style("font-size", "1.2em")
            .text("MDS-2");

        var points = svg.selectAll(".dot")
            .data(playersData);

        points.enter().append("circle")
            .attr("class", function(d){return "x" + d.Id;})
            .transition()
            .duration(1000)
            .ease("backOut")
            .attr("r", 3.5)
            .attr("cx", xMap)
            .attr("cy", yMap)
            .style("fill", function (d) {
                return color(d);
            });

        highlight = function(Id, name, color, radius, opacity){
            d3.select(".x" + Id).style("fill",color)
                .attr("r", radius)
                .moveToFront();

            console.log(name)

            var xVal = d3.select('.x' + Id).attr("cx");
            var yVal = d3.select('.x' + Id).attr("cy");

            tooltip.transition()
                .duration(200)
                .style("opacity", opacity);
            tooltip.html(name)
                .style("left", (Number(xVal)) + "px")
                .style("top", (Number(yVal) + 20) + "px")
                .style("font-weight", "bold");
        };

        points.on("mouseover", function (d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            //console.log(Number((xValue(d))));
            tooltip.html(d.Name + " (" + Number((xValue(d)).toFixed(3)) + ", " + Number((yValue(d)).toFixed(3)) + ")")
                .style("left", (d3.event.pageX - 670) + "px")
                .style("top", (d3.event.pageY - 180) + "px");
            d3.select(this).style("fill", "red");
        })
            .on("mouseout", function (d) {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
                d3.select(this).style("fill", function (d) {
                    return color(d);
                })


            });

        function zoomed() {
            svg.select(".x.axis").call(xAxis);
            svg.select(".y.axis").call(yAxis);
            svg.selectAll(".dot")
                .attr("cx", xMap)
                .attr("cy", yMap);
        }
    }
    d3.json("static/leaguejson/bps.json", function(error, data) {
        if(error) throw error;

        barChart(1, data);
        drawPieChart(1, data);
        drawPositionDetails(1, data);
    });
}

function makeSlider() {
    d3.select("#sld").remove();

    var slider = d3.select("#slider").append("svg")
        .attr("width", 1200)
        .attr("height", 40)
        .attr("id", "sld")
        .attr("class", "slider")
        .attr("transform", "translate(" + (margin.left+130) + "," + (margin.top) + ")");

    var ticksData = d3.scale.linear()
        .domain([1, 38])
        .range([0, 1000])
        .clamp(true);

    slider.append("line")
        .attr("class", "track")
        .attr("width", 960)
        .attr("height", height + 70)
        .attr("x1", ticksData.range()[0])
        .attr("x2", ticksData.range()[1])
        .select(function() {
            return this.parentNode.appendChild(this.cloneNode(true));
        })
        .attr("class", "track-inset")
        .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track-overlay")
        .call(d3.behavior.drag()
        // .on("dragstart.interrupt", function(){ slider.interrupt();})
            .on("dragend", function() {
                hue(ticksData.invert(d3.mouse(this)[0]));
                xposEnd = ticksData.invert(d3.mouse(this)[0]);
                var gameweek = Math.round(xposEnd);
                slider.interrupt();
                // d3.select("#canvas").remove();

                $.ajaxSetup({
                    async: false
                });

                $.getJSON('/pca', {
                    post: Math.round(xposEnd)
                }, function(data) {

                    var x0 = [-2,2],
                        y0 = [-2,2];
                    var xValue = function(d) { return d.MDS1; };
                    var xScale = d3.scale.linear().domain(x0).range([0, width]);
                    var xMap = function(d) { return xScale(xValue(d)); };
                    var xAxis = d3.svg.axis().scale(xScale).orient("bottom");

                    var yValue = function(d) { return d.MDS2; };
                    var yScale = d3.scale.linear().domain(y0).range([385, 0]);
                    var yMap = function(d) { return yScale(yValue(d)); };
                    var yAxis = d3.svg.axis().scale(yScale).orient("left");

                    var color = d3.scale.category10();
                    d3.select("#canvas").remove();


                    var svg = d3.select("#pca-chart").append("svg")
                        .attr("width", width + margin.left + margin.right)
                        .attr("height", 385 + margin.top + margin.bottom)
                        .attr("id", "canvas")
                        .append("g")
                        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                    var tooltip = d3.select("#pca-chart").append("div")
                        .attr("class", "tooltip")
                        .style("opacity", 0);

                    var playersData = data;
                    if (Math.abs(d3.min(playersData, xValue)) > d3.max(playersData, xValue))
                        xScale.domain([d3.min(playersData, xValue) - 0.2, -d3.min(playersData, xValue) + 0.2]);
                    else
                        xScale.domain([-d3.max(playersData, xValue) - 0.2, d3.max(playersData, xValue) + 0.2]);

                    if (Math.abs(d3.min(playersData, yValue)) > d3.max(playersData, yValue))
                        yScale.domain([d3.min(playersData, yValue) - 0.2, -d3.min(playersData, yValue) + 0.2]);
                    else
                        yScale.domain([-d3.max(playersData, yValue) - 0.2, d3.max(playersData, yValue) + 0.2]);


                    var zoom = d3.behavior.zoom()
                        .x(xScale)
                        .y(yScale)
                        .scaleExtent([1, 100])
                        .on("zoom", zoomed);

                    svg.call(zoom);

                    svg.append("rect")
                        .style("fill", "#fff")
                        .attr("width", width + margin.left + margin.right)
                        .attr("height", height + margin.top + margin.bottom);

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
                        // .style("font-size", "1.2em")
                        .text("MDS-1");

                    // Draw the Y-Axis
                    svg.append("g")
                        .attr("class", "y axis")
                        .attr("transform", "translate(" + xScale(0) + ", 0)")
                        .call(yAxis)
                        .append("text")
                        .attr("transform", "rotate(-90)")
                        .attr("y", 6)
                        .attr("x", 10)
                        .attr("dy", ".71em")
                        .style("text-anchor", "end")
                        .style("font-weight", "bold")
                        // .style("font-size", "1.2em")
                        .text("MDS-2");

                    var points = svg.selectAll(".dot")
                        .data(playersData);

                    points.enter().append("circle")
                        .attr("class", function(d){return "x" + d.Id;})
                        .transition()
                        .duration(1000)
                        .ease("backOut")
                        .attr("r", 3.5)
                        .attr("cx", xMap)
                        .attr("cy", yMap)
                        .style("fill", function (d) {
                            return color(d);
                        });

                    highlight = function(Id, name, color, radius, opacity){
                        d3.select(".x" + Id).style("fill",color)
                            .attr("r", radius)
                            .moveToFront();


                        var xVal = d3.select('.x' + Id).attr("cx");
                        var yVal = d3.select('.x' + Id).attr("cy");

                        tooltip.transition()
                            .duration(200)
                            .style("opacity", opacity);
                        tooltip.html(name)
                            .style("left", (Number(xVal)) + "px")
                            .style("top", (Number(yVal) + 20) + "px")
                            .style("font-weight", "bold");
                    };

                    points.on("mouseover", function (d) {
                        tooltip.transition()
                            .duration(200)
                            .style("opacity", .9);
                        //console.log(Number((xValue(d))));
                        tooltip.html(d.Name + " (" + Number((xValue(d)).toFixed(3)) + ", " + Number((yValue(d)).toFixed(3)) + ")")
                            .style("left", (d3.event.pageX - 670) + "px")
                            .style("top", (d3.event.pageY - 180) + "px");
                        d3.select(this).style("fill", "red");
                    })
                        .on("mouseout", function (d) {
                            tooltip.transition()
                                .duration(500)
                                .style("opacity", 0);
                            d3.select(this).style("fill", function (d) {
                                return color(d);
                            })


                        });

                    function zoomed() {
                        svg.select(".x.axis").call(xAxis);
                        svg.select(".y.axis").call(yAxis);
                        svg.selectAll(".dot")
                            .attr("cx", xMap)
                            .attr("cy", yMap);
                    }

                });

                d3.json("static/leaguejson/bps.json", function(error, data) {
                    if(error) throw error;

                    barChart(gameweek, data);
                    drawPieChart(gameweek, data);
                    drawPositionDetails(gameweek, data);
                });

            })
            .on("drag", function () {

            }));

    slider.insert("g", ".track-overlay")
        .attr("class", "ticks")
        .attr("transform", "translate(0," + 18 + ")")
        .selectAll("text")
        .data(ticksData.ticks(38))
        .enter().append("text")
        .attr("x", ticksData)
        .attr("text-anchor", "middle")
        .style("font-size", "11px")
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
        handle.attr("cx", ticksData(h));
    }
}

function drawPieChart(gameweek, data) {

    var opt = document.getElementById("options");
    var newData = opt.options[opt.selectedIndex].value;
    var getId = getStatId(newData);
    makePieChart(getId);

    d3.select('#options')
        .on('change', function() {
            var newData = d3.event.target.value;
            var stat_id = getStatId(newData);
            makePieChart(stat_id);
        });

    function makePieChart(stat_id) {
        d3.select("#canvas3").remove();
        var color = d3.scale.category10();

        var interesting_statistics_svg = d3.select("#interesting-stats-chart").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", 140 + margin.top + margin.bottom)
            .attr("id", "canvas3");

        var interesting_statistics_tooltip = d3.select("#interesting-stats-chart").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        // Draw the interesting statistics pie chart
        var radius = (140) / 2;
        var height = 140;

        var group = interesting_statistics_svg.append("g").attr("transform", "translate(" +
            (margin.left + 60) + "," + (margin.top + 80) + ")");
        var pie = d3.layout.pie().value(function (d) {
            return d;
        });

        var arc = d3.svg.arc()
            .outerRadius(radius)
            .innerRadius(radius / 4);

        var arcOver = d3.svg.arc()
            .innerRadius(radius / 4)
            .outerRadius(radius + 5 + 5);

        var arcs = group.selectAll(".arc")
            .data(pie(data[gameweek][stat_id].values));

        arcs.enter()
            .append("g")
            .attr("fill", function (d) {
                return color(d.data);
            });

        arcs.append("path")
            .attr("d", arc)
            .on("mouseover", function (d) {
                d3.select(this)
                    .attr("d", arcOver)
                    .attr("stroke", "black")
                    .attr("stroke-width",1)
            })
            .on("mouseout", function (d) {
                d3.select(this)
                    .attr("d", arc)
                    .attr("stroke", "none")
            });

        arcs.append('text')
            .attr('transform', function(d) {
                return "translate(" + arc.centroid(d) + ")";
            })
            .attr("text-anchor", "middle")
            .style("fill", "white")
            .text(function(d) {
                if(d.data > 0)
                    return d.data;
            });

        var showLegend = interesting_statistics_svg.selectAll(".legend")
            .data(pie(data[gameweek][stat_id].values))
            .enter().append("g")
            .attr("transform", function(d,i){
                return "translate(" + (width - 390) + "," + (i * 15 + 20) + ")";
            })
            .attr("class", "legend");

        showLegend.append("rect")
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", function(d, i) {
                return color(d.data);
            });

        showLegend.append("text")
            .text(function(d, i){
                return data[gameweek][stat_id].legend[i];
            })
            .style("font-size", "12px")
            .attr("y", 10)
            .attr("x", 11);

        arcs.exit().remove();
    }

    function getStatId(newData) {
        if(newData === 'Goals_type') {
            stat_id = 2;
        }
        else if(newData === 'Goals_position') {
            stat_id = 3;
        }
        else if(newData === 'Attempts') {
            stat_id = 4;
        }
        else if(newData === 'Passes') {
            stat_id = 5;
        }
        else if(newData === 'Pass_direction') {
            stat_id = 6;
        }
        else if(newData === 'Saves') {
            stat_id = 7;
        }
        else if(newData === 'Crosses') {
            stat_id = 8;
        }
        else if(newData === 'Clearances') {
            stat_id = 9;
        }
        return stat_id;
    }

}

function barChart(position, data) {
    d3.select('#canvas2').remove();

    var players = data[position][0].top_10_players;
    var index = data[position][1].top_10_index;
    var ids = data[position][11].top_10_id;
    console.log(ids)


    var h = 125;

    var top_player_svg = d3.select("#time-chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", h + margin.top + margin.bottom)
        .attr("id", "canvas2")
        .append("g")
        .attr("transform", "translate(80" + "," + margin.top + ")");

    var yScale = d3.scale.linear()
        .range([0,h])
        .domain([0,players.length]);

    var xScale = d3.scale.linear()
        .range([0,475])
        .domain([0, d3.max(index)]);


    var yAxis = d3.svg.axis()
        .scale(yScale)
        .tickSize(2)
        .tickFormat(function(d,i){
            return players[i];})
        .tickValues(d3.range(5))
        .orient("left");

    var gy = top_player_svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(0,4)")
        .call(yAxis);

    var bars = top_player_svg.selectAll("rect")
        .data(index)
        .enter()
        .append("rect")
        .attr("id",function(d,i){return i;})
        .attr("x", 0)
        .attr("y", function (d,i) {
            return yScale(i);
        })
        .attr("height", 16.5)
        .attr("width", 0)
        .style("fill", "steelblue")
        .on("mouseover", function (d) {
            var pos = d3.select(this).attr("id");
            highlight(ids[pos], players[pos], "red", 7.5, 0.9);

            d3.select(this).style("fill", "orange")
        })
        .on("mouseout", function(d){
            var pos = d3.select(this).attr("id");
            highlight(ids[pos], players[pos], "steelblue", 3.5, 0);

            d3.select(this).style("fill", "steelblue");
        });

    var transit = top_player_svg.selectAll("rect")
        .data(index)
        .transition()
        .duration(3000)
        .attr("width", function(d){ return xScale(d)});

    var labels = d3.select("#canvas2").append("g").selectAll("text")
        .data(index)
        .enter()
        .append("text")
        .attr("class", "label")
        .text(function(d){return d;})
        .attr("text-anchor", "end")
        .attr("y", 0)
        .attr("x", 0)
        .style("fill", "black");

    labels.transition()
        .duration(2500)
        .attr("y", function(d,i){
            return yScale(i) + 32;
        })
        .attr("x", function(d){ return xScale(d)+100;})


}

function drawPositionDetails(gameweek, data) {
    d3.select('#positionStats').remove();

    var d = data[gameweek][10];

    var w = 110,
        h = 105;

    var colorscale = d3.scale.category10();

//Legend titles
    var LegendOptions = data[gameweek][0].top_10_players;

//Options for the Radar chart, other than default
    var mycfg = {
        w: w,
        h: h,
        maxValue: 0.6,
        levels: 6,
        ExtraWidthX: 300
    };

//Call function to draw the Radar chart
//Will expect that data is in %'s
    RadarChart.draw("#position-stats-chart", d, mycfg);

////////////////////////////////////////////
/////////// Initiate legend ////////////////
////////////////////////////////////////////

    var svg = d3.select('#position-stats-chart')
        .selectAll('svg')
        .append('svg')
        .attr("width", w+50)
        .attr("height", h);

//Initiate Legend
    var legend = svg.append("g")
        .attr("class", "legend")
        .attr("height", 100)
        .attr("width", 200)
        .attr('transform', 'translate(90,0)');
    //Create colour squares
    legend.selectAll('rect')
        .data(LegendOptions)
        .enter()
        .append("rect")
        .attr("x", w - 185)
        .attr("y", function(d, i){ return i * 15;})
        .attr("width", 10)
        .attr("height", 10)
        .style("fill", function(d, i){ return colorscale(i);});
    //Create text next to squares
    legend.selectAll('text')
        .data(LegendOptions)
        .enter()
        .append("text")
        .attr("x", w - 172)
        .attr("y", function(d, i){ return i * 15 + 9;})
        .attr("font-size", "11px")
        .attr("fill", "#737373")
        .text(function(d) { return d; });

}