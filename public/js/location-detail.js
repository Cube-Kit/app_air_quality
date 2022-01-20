// const { format } = require("path/posix");

// Declare globals
let chartOptions = {};
let cubeId;
var MS_PER_MINUTE = 60000;

window.addEventListener("load", function(event) 
{

    // Get cubeId from <input> element
    cubeId = document.getElementById("cubeId").value;


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

    timeSubmitCallback();

    document.getElementById("timeSubmit").addEventListener("click", timeSubmitCallback);
});

function timeSubmitCallback() {

    let fromDate = document.getElementById("fromTime").valueAsDate;
    let toDate = document.getElementById("toTime").valueAsDate;

    requestChartData(fromDate, toDate);
}


async function requestChartData(fromDate, toDate) {

    let resource = "http://"
    resource += window.location.host;
    resource += "/api/data/";
    resource += cubeId;

    let data = [];

    try {
        let response = await fetch(resource, {
            method: "post",
            headers: {
              "Accept": "application/json",
              "Content-Type": "application/json"
            },
          
            body: JSON.stringify({
                "start": fromDate,
                "end": toDate              
            })
        });

        if (response.ok){

            data = await response.json()

            console.log(data);

        } else {

            console.log(response);
        }

    } catch(error) {
        
        console.log(error);
    }

    
    
    drawChart(data);
}

function drawChart(data) {

    let formatData = {labels: [], series: [[]]};

    data.forEach((element, index) => {
        let date = new Date(element.timestamp);

        let xLabel =    (index == 0 || date.getMinutes() == 0) ? date.getHours().toString().padStart(2, '0') : "";
        xLabel +=       (index == 0 || date.getSeconds() == 0) ? ":" + date.getMinutes().toString().padStart(2, '0') : "";
        xLabel +=       ":" + date.getSeconds().toString().padStart(2, '0');

        formatData.labels.push(xLabel);
        formatData.series[0].push(element.data);
    });

    console.log(formatData);

    new Chartist.Line(".ct-chart", formatData, chartOptions);
    
    console.log("done");
}