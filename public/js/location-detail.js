// const { format } = require("path/posix");

// Declare globals
let chartOptions = {};
let cubeIds;
var MS_PER_MINUTE = 60000;

window.addEventListener("load", function(event) 
{

    // Get cubeIds from <input> element
    cubeIds = document.getElementById("cubeIds").value.split(",");

    // Get cubeIds from <input> element
    thresholds = document.getElementById("thresholds").value.split(",");



    console.log(thresholds);


    //Set input fields to default
    let date = new Date();
    date.setMilliseconds(0);
    console.log(date);
    document.getElementById("fromTime").valueAsDate = new Date(date.getTime() - 45 * MS_PER_MINUTE);
    document.getElementById("toTime").valueAsDate = date;

    // Dynamically set options
    let chartContainer = document.getElementById("chart");

    chartOptions.width = (chartContainer.innerWidth*0.85);
    chartOptions.height = (chartContainer.innerHeight*0.85);
    chartOptions.showPoint = false;
    chartOptions.lineSmooth = false;
    chartOptions.showGrid = true;

    // First time call for default settings
    timeSubmitCallback();

    // Set click listener for submit button
    document.getElementById("timeSubmit").addEventListener("click", timeSubmitCallback);
});

// Callback for submit button
async function timeSubmitCallback() {

    let fromDate = document.getElementById("fromTime").valueAsDate;
    let toDate = document.getElementById("toTime").valueAsDate;

    drawChart(formatData(await requestChartData(fromDate, toDate, cubeIds), thresholds));
}

// Combine needed data for the chart
async function requestChartData(fromDate, toDate, cubeIds) {

    let data = [];

    console.log(cubeIds);

    for (cubeId of cubeIds)
    {
        data.push(await requestCubeData(fromDate, toDate, cubeId));
    }
    
    console.log(data);
    
    return data;
}

// Draw chart
function drawChart(data) {

    new Chartist.Line(".ct-chart", data, chartOptions);
    
    console.log("done");
}