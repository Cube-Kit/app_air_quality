// const { format } = require("path/posix");

// Declare globals
let options, cubeId;

window.addEventListener("load", function(event) {

    // Get cubeId from <input> element
    cubeId = document.getElementById("cubeId").value;

    // TODO: dynamically set options

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
    
    drawChart(formatData, options);
}

function drawChart(data){

    new Chartist.Line('.ct-chart', data, options);
    
    console.log("done");
}