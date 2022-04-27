// const { format } = require("path/posix");

// Declare globals
let chartOptions = {};
let cubeId;
let thresholds;
var MS_PER_MINUTE = 60000;

window.addEventListener("load", function(event) 
{

    // Get cubeId from <input> element
    cubeId = document.getElementById("cubeId").value;
    // Get cubeIds from <input> element
    thresholds = document.getElementById("thresholds").value.split(",");

    //Set input fields to default
    let now = new Date();
    
    now.setMilliseconds(0);
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById("fromTime").valueAsDate = new Date(now.getTime() - 45 * MS_PER_MINUTE);
    document.getElementById("toTime").valueAsDate = now;

    // Dynamically set options
    let chartContainer = document.getElementById("chart");

    chartOptions.width = (chartContainer.innerWidth*0.85);
    chartOptions.height = (chartContainer.innerHeight*0.85);
    chartOptions.showPoint = false;
    chartOptions.lineSmooth = false;
    chartOptions.showGrid = false;
    chartOptions.low = 0;
    chartOptions.high = thresholds[thresholds.length - 1];
    chartOptions.lineSmooth = Chartist.Interpolation.cardinal({
        fillHoles: true
      });

    // First time call for default settings
    timeSubmitCallback();

    // Set click listener for submit button
    document.getElementById("timeSubmit").addEventListener("click", timeSubmitCallback);
});

// Callback for submit button
async function timeSubmitCallback() {

    let fromDate = document.getElementById("fromTime").valueAsDate;
    let toDate = document.getElementById("toTime").valueAsDate;

    drawChart(formatData(await requestChartData(fromDate, toDate), thresholds));
}

// Combine needed data for the chart
async function requestChartData(fromDate, toDate) {

    let data = [await requestCubeData(fromDate, toDate, cubeId)];
    
    return data;
}

// Draw chart
function drawChart(data) {

    new Chartist.Line(".ct-chart", data, chartOptions);
    
    console.log("done");
}