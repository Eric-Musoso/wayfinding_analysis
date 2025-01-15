queue()
    .defer(d3.json, "/data") // Fetch data from Flask backend
    .await(makeGraphs);

function makeGraphs(error, recordsJson) {
    if (error) {
        console.error("Error loading data:", error);
        return;
    }

    // Debug: Log loaded data
    console.log("Loaded Data:", recordsJson);

    // Clean data
    var records = recordsJson;
    var dateFormat = d3.isoParse;

    records.forEach(function (d) {
        d["timestamp"] = dateFormat(d["timestamp"]); // Parse timestamp
        d["speed"] = +d["speed"]; // Ensure speed is numerical
    });

    console.log("Processed Records:", records.slice(0, 5));

    // Crossfilter instance
    var ndx = crossfilter(records);

    // Dimensions
    var timeDim = ndx.dimension(function (d) {
        return d["timestamp"];
    });
    var durationDim = ndx.dimension(function (d) {
        return d["participant"];
    });

    // Group Data
    var speedGroup = timeDim.group().reduceSum(function (d) {
        return d["speed"];
    });

    var minDate = timeDim.bottom(1)[0]["timestamp"];
    var maxDate = timeDim.top(1)[0]["timestamp"];

    console.log("Min Date:", minDate, "Max Date:", maxDate);

    // Create charts and data table
    dc.config.defaultColors(d3.schemePastel2); // Apply global color scheme

    // Route length dimension
    var routelengthDim = ndx.dimension(function (d) {
        return d["participant"];
    });

    // Summary dimension
    var summaryDim = ndx.dimension(function (d) {
        return d["participant"];
    });

    // Average speed dimension
    var avgSpeedDim = ndx.dimension(function (d) {
        return d["participant"];
    });

    // Stops dimension
    var stopsDim = ndx.dimension(function (d) {
        return d["participant"];
    });


    // Summary Group
    var summaryGroup = summaryDim.group().reduce(
        function(p, v) {
            // Initialize participant statistics if not already set
            if (!p.timestamp_min || v.timestamp < p.timestamp_min) {
                p.timestamp_min = v.timestamp;
            }
            if (!p.timestamp_max || v.timestamp > p.timestamp_max) {
                p.timestamp_max = v.timestamp;
            }

            // Duration calculation
            if (p.timestamp_min && p.timestamp_max) {
                p.totalDuration = Math.round((p.timestamp_max - p.timestamp_min) / 60000 * 100) / 100; // Duration in minutes
            }

            // Route length calculation (using Turf.js for distance between coordinates)
            if (!p.coordinates) p.coordinates = [];
            p.coordinates.push([v.longitude, v.latitude]);

            if (p.coordinates.length > 1) {
                p.coordinates.sort((a, b) => a.timestamp - b.timestamp); // Sort coordinates by timestamp
                var line = turf.lineString(p.coordinates);
                p.routeLength = Math.round(turf.length(line, { units: 'kilometers' }) * 100) / 100; // Distance in kilometers
            }

            // Average speed calculation (converted to km/h)
            p.avgSpeed = p.routeLength / (p.totalDuration / 60); // Route Length (km) / Duration (hours)

            // Stops calculation (count where speed is 0 or less)
            if (v.speed <= 0) {
                p.stops = (p.stops || 0) + 1;
            }

            // Pan and zoom counts
            p.panCount = (p.panCount || 0) + v.panCount;
            p.zoomCount = (p.zoomCount || 0) + v.zoomCount;

            return p;
        },
        function(p, v) {
            // Reset participant statistics when records are removed (on filtering)
            p.routeLength = 0;
            p.totalDuration = 0;
            p.avgSpeed = 0;
            p.stops = 0;
            p.panCount = 0;
            p.zoomCount = 0;
            p.coordinates = [];
            return p;
        },
        function() {
            // Initialize participant statistics
            return {
                routeLength: 0,
                totalDuration: 0,
                avgSpeed: 0,
                stops: 0,
                panCount: 0,
                zoomCount: 0,
                coordinates: []
            };
        }
    );

   // Debugging: Log the grouped data to verify
summaryGroup.all().forEach(function(d) {
    console.log("Group Data: Key = ", d.key, ", Value = ", d.value);
});


    // chart initialization
    var timeChart = dc.lineChart("#time-chart");
    var routelengthChart = dc.rowChart("#routelength-row-chart");
    var durationChart = dc.rowChart("#duration-row-chart");
    var summaryTable = dc.dataTable("#data-table"); 
    var avgSpeedChart = dc.rowChart("#avgSpeed-row-chart");
    var stopsChart = dc.rowChart("#stops-row-chart");

    // Time Chart
    timeChart
        .width(650)
        .height(300)
        .margins({ top: 10, right: 50, bottom: 30, left: 40 })
        .dimension(timeDim)
        .group(speedGroup, "Speed by Time")
        .transitionDuration(500)
        .x(d3.scaleTime().domain([minDate, maxDate]))
        .elasticY(true)
        .colors(d3.scaleOrdinal(d3.schemeTableau10))
        .renderHorizontalGridLines(true)
        .title(function (d) {
            return `Time: ${d.key}\nSpeed: ${d.value}`;
        })
        .yAxis().ticks(4);

    routelengthChart
       .width(200)
       .height(180)
       .dimension(routelengthDim)
       .group(summaryGroup)
       .valueAccessor(function (d) {
        return d.value.routeLength || 0;
       })
       .ordering(function (d) {
        return -d.value.routeLength;  // Order by route length in descending order
    })
    .elasticX(true)
    .colors([d3.schemeTableau10[2]])
    .xAxis().ticks(4);
    
    // Avg Speed Chart
    avgSpeedChart
       .width(200)
       .height(180)
       .dimension(avgSpeedDim)
       .group(summaryGroup)
       .valueAccessor(function (d) {
        return d.value.avgSpeed || 0;
       })
       .ordering(function (d) {
        return -d.value.avgSpeed;  // Order by route length in descending order
    })
    .elasticX(true)
    .colors([d3.schemeTableau10[4]])
    .xAxis().ticks(4);

    // Stops Chart
    stopsChart
       .width(200)
       .height(180)
       .dimension(stopsDim)
       .group(summaryGroup)
       .valueAccessor(function (d) {
        return d.value.stops;
       })
       .ordering(function (d) {
        return -d.value.stops;  // Order by route length in descending order
    })
    .elasticX(true)
    .colors([d3.schemeTableau10[3]])
    .xAxis().ticks(4);

    // Duration Chart
    durationChart
        .width(300)
        .height(180)
        .dimension(durationDim)
        .group(summaryGroup)
        .valueAccessor(function (d) {
            return d.value.totalDuration || 0;
        })
        .ordering(function (d) {
            return -d.value.totalDuration;
        })
        .elasticX(true)
        .colors([d3.schemeTableau10[0]])
        .xAxis().ticks(4);

        summaryTable
        .width(600)
        .height(300)
        .dimension(summaryDim) // Use the dimension
        .section(function () {
            return ""; // Leave the group header blank to avoid repetition
        })
        .columns([
            function (d) {
                // Get the aggregated group data
                const groupData = summaryGroup.all().find(g => g.key === d.participant);
                return groupData ? groupData.key : "N/A"; // Participant name
            },
            function (d) {
                const groupData = summaryGroup.all().find(g => g.key === d.participant);
                return groupData && groupData.value.routeLength
                    ? groupData.value.routeLength.toFixed(2)
                    : "N/A";
            },
            function (d) {
                const groupData = summaryGroup.all().find(g => g.key === d.participant);
                return groupData && groupData.value.totalDuration
                    ? groupData.value.totalDuration.toFixed(2)
                    : "N/A";
            },
            function (d) {
                const groupData = summaryGroup.all().find(g => g.key === d.participant);
                return groupData && groupData.value.avgSpeed
                    ? groupData.value.avgSpeed.toFixed(2)
                    : "N/A";
            },
            function (d) {
                const groupData = summaryGroup.all().find(g => g.key === d.participant);
                return groupData && groupData.value.stops ? groupData.value.stops : "N/A";
            },
            function (d) {
                const groupData = summaryGroup.all().find(g => g.key === d.participant);
                return groupData && groupData.value.panCount ? groupData.value.panCount : "N/A";
            },
            function (d) {
                const groupData = summaryGroup.all().find(g => g.key === d.participant);
                return groupData && groupData.value.zoomCount ? groupData.value.zoomCount : "N/A";
            }
        ])
        .size(Infinity) // Show all rows
        .sortBy(function (d) {
            return d.participant; // Sort by participant name
        })
        .order(d3.ascending) // Sort in ascending order
        .on('renderlet', function (table) {
            // Remove duplicate rows by filtering unique participants
            const uniqueParticipants = new Set();
            table.selectAll('tbody tr').each(function (d) {
                const participant = d.participant;
                if (uniqueParticipants.has(participant)) {
                    d3.select(this).remove();
                } else {
                    uniqueParticipants.add(participant);
                }
            });
        })
        .render(); 
    

    // Check if the map is already initialized
if (map !== undefined && map !== null) {
    map.remove(); // Remove the existing map instance
}

// Initialize the Leaflet map
var map = L.map("map").setView([51.94615, 7.61479], 14);

// Basemaps
var osm = L.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; <a href='http://openstreetmap.org'>OpenStreetMap</a> Contributors",
    maxZoom: 20,
}).addTo(map); // Default basemap

var imagery = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
    attribution: "Tiles © Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
    maxZoom: 18,
});

var darkGrayCanvas = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
    attribution: "Tiles © Esri &mdash; Esri, HERE, DeLorme, MapmyIndia, OpenStreetMap contributors, and the GIS user community",
    maxZoom: 18,
});

// Layers for overlays
var heatLayer = L.layerGroup(); // Heatmap layer as a placeholder
var pointLayer = L.layerGroup(); // Point layer as a placeholder
var clusterLayer = L.markerClusterGroup(); // Initialize cluster layer

// Base maps and overlays
var baseMaps = {
    "OpenStreetMap": osm,
    "Imagery": imagery,
    "Dark Gray Canvas": darkGrayCanvas,
};

var overlayMaps = {
    "Heatmap": heatLayer,
    "Point Layer (Heading Range)": pointLayer,
    "Cluster Layer (Speed ≤ 0)": clusterLayer,
};

// Add control layers
var layerControl = L.control.layers(baseMaps, overlayMaps, { collapsed: false }).addTo(map);
layerControl.getContainer().style.backgroundColor = "rgba(255, 255, 255, 0.8)"; // Transparent background

// Create the legend for the Point Layer with color and labels
var legend = L.control({ position: "bottomleft" });

legend.onAdd = function () {
    var div = L.DomUtil.create("div", "info legend");
    div.innerHTML += "<h4>Direction Heading</h4>";

    // Define the color range for each heading group
    var colorRange = [
        { label: '0-90 North-East', color: '#DAF7A6' },  // Light Green
        { label: '91-180 North-West', color: '#FFC300' }, // Yellow
        { label: '181-270 South-West', color: '#FF5733' }, // Red
        { label: '271-360 South-East', color: '#C70039' }  // Dark Red
    ];

    // Add colored boxes with labels
    colorRange.forEach(function (item) {
        div.innerHTML += "<div style='display: flex; align-items: center;'>" +
                            "<div style='background-color: " + item.color + "; width: 20px; height: 20px; margin-right: 10px;'></div>" +
                            "<span>" + item.label + "</span>" +
                          "</div>";
    });

    return div;
};

// Function to update HeatLayer dynamically
function updateHeatLayer(filteredData) {
    heatLayer.clearLayers(); // Clear any existing heatmap data
    var heatData = filteredData.map((d) => [d.latitude, d.longitude, 1]);
    var newHeatLayer = L.heatLayer(heatData, { radius: 10, blur: 20, maxZoom: 2 });
    heatLayer.addLayer(newHeatLayer); // Add new heatLayer to the group
}

// Define the getColor function to map values to colors
function getColor(heading) {
    return heading <= 90     ? '#DAF7A6' :
           heading <= 180    ? '#FFC300' : 
           heading <= 270    ? '#FF5733' :  
           heading <= 360    ? '#C70039' :  
                               '#ffffb2';   // Default color 
}

// Function to update Point Layer dynamically
function updatePointLayer(filteredData) {
    pointLayer.clearLayers(); // Clear existing points

    // First, filter the data into separate heading ranges
    var heading0to90 = filteredData.filter((d) => d.heading <= 90);
    var heading91to180 = filteredData.filter((d) => d.heading > 90 && d.heading <= 180);
    var heading181to270 = filteredData.filter((d) => d.heading > 180 && d.heading <= 270);
    var heading271to360 = filteredData.filter((d) => d.heading > 270 && d.heading <= 360);

    // Combine the filtered data (this may not be necessary if you're processing them separately)
    var filteredHeading = [
        ...heading0to90,
        ...heading91to180,
        ...heading181to270,
        ...heading271to360
    ];

    // For each filtered data, assign a color and create a marker
    filteredHeading.forEach((d) => {
        var heading = parseFloat(d.heading) || 0; // Use heading field directly

        // Use getColor to get the color based on heading value
        var color = getColor(heading);

        // Create a marker with the assigned color
        var marker = L.circleMarker([d.latitude, d.longitude], {
            color: color, // Apply the custom color based on heading
            radius: 5,
            fillOpacity: 0.8,
        });

        pointLayer.addLayer(marker); // Add the marker to the point layer
    });
}
// Function to update Cluster Layer dynamically
function updateClusterLayer(filteredData) {
    clusterLayer.clearLayers(); // Clear existing clusters
    filteredData
        .filter((d) => d.speed <= 0)
        .forEach((d) => {
            var marker = L.circleMarker([d.latitude, d.longitude], {
                color: "blue", // Provide a color for better visibility
                radius: 6,
                fillOpacity: 0.8,
            });
            clusterLayer.addLayer(marker); // Add the marker to the cluster
        });
}



// Handle Chart Filtering
function updateMap() {
    var filteredData = ndx.dimension(function (d) {
        return d;
    }).top(Infinity);

    // Update each layer dynamically based on the current filter
    if (map.hasLayer(heatLayer)) {
        updateHeatLayer(filteredData);
    }
    if (map.hasLayer(pointLayer)) {
        updatePointLayer(filteredData);
    }
    if (map.hasLayer(clusterLayer)) {
        updateClusterLayer(filteredData);
    }
}

// Handle toggling of layers
map.on("overlayadd", function (eventLayer) {
    var filteredData = ndx.dimension(function (d) {
        return d;
    }).top(Infinity);

    if (eventLayer.name === "Heatmap") {
        updateHeatLayer(filteredData);
    } else if (eventLayer.name === "Point Layer (Heading Range)") {
        updatePointLayer(filteredData);
        legend.addTo(map); // Add legend when Point Layer is active
    } else if (eventLayer.name === "Cluster Layer (Speed ≤ 0)") {
        updateClusterLayer(filteredData);
    }
});

map.on("overlayremove", function (eventLayer) {
    if (eventLayer.name === "Heatmap") {
        heatLayer.clearLayers();
    } else if (eventLayer.name === "Point Layer (Heading Range)") {
        pointLayer.clearLayers();
        map.removeControl(legend); // Remove legend when Point Layer is inactive
    } else if (eventLayer.name === "Cluster Layer (Speed ≤ 0)") {
        clusterLayer.clearLayers();
    }
});

// Initial render with charts
[timeChart, routelengthChart, durationChart, avgSpeedChart, summaryTable].forEach(function (chart) {
    chart.on("filtered", function () {
        updateMap();
    });
});

// Initial render
updateMap();
dc.renderAll();
console.log("Charts Rendered!");

}
