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
    console.log(date.getTimezoneOffset());
    document.getElementById("fromTime").valueAsDate = new Date(date.getTime() - 45 * MS_PER_MINUTE);
    document.getElementById("toTime").valueAsDate = date;

    // Dynamically set options
    let chartConatiner = document.getElementById("chart");

    chartOptions.width = (chartConatiner.innerWidth*0.85);
    chartOptions.height = (chartConatiner.innerHeight*0.85);
    chartOptions.showPoint = false;
    chartOptions.lineSmooth = false;

    requestChartData();
});

async function requestChartData(){

    let resource = "http://"
    resource += window.location.host;
    resource += "/api/data/";
    resource += cubeId;

    let data = [];

    try {
        let response = await fetch(resource, {
            method: "post",
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
          
            //make sure to serialize your JSON body
            body: JSON.stringify({
              
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

function drawChart(data){

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

    new Chartist.Line('.ct-chart', formatData, chartOptions);
    
    console.log("done");
}