// Format labels for x axis
function formatXLabels(data)
{
    let output = [];
    let step = Math.round(data.length / 10);
    data.forEach((element, index) => {

        let xLabel = "";

        if(index % step == 0) {
            let date = new Date(element);

            xLabel = date.getHours().toString().padStart(2, '0') + ":" + 
                date.getMinutes().toString().padStart(2, '0') + ":" +
                date.getSeconds().toString().padStart(2, '0');

            // xLabel =    (index == 0 || date.getMinutes() == 0) ? date.getHours().toString().padStart(2, '0') : "";
            // xLabel +=       (index == 0 || date.getSeconds() == 0) ? ":" + date.getMinutes().toString().padStart(2, '0') : "";
            // xLabel +=       ":" + date.getSeconds().toString().padStart(2, '0');
            
            
        }        
        output.push(xLabel);
    });
    return output;
}

// Format data to be compatible with chartist.js
function formatData(data, thresholds){

    console.log(data);

    let dateSet = new Set();
    let output = {labels: [], series: []};

    try{
        // collect all occurring dates to a set
        data.forEach((outerElement, outerIndex) =>{
            outerElement.forEach((innerElement, innerIndex) =>{

                dateSet.add(innerElement.timestamp)

            });
        });

        let dateArray = Array.from(dateSet);

        // sort set
        dateArray.sort();

        // add thresholds as graphs to be displayed
        let thresholdCount = thresholds.length;

        chartOptions.series = new Object();

        thresholds.forEach((threshold, thresholdIndex) =>{

            output.series.push({
                name: ("threshold_" + thresholdIndex),
                data: []});

            chartOptions.series["threshold_" + thresholdIndex] = {
                showArea: true,
                showLine: true,
                showPoint: false,
            }

            dateArray.forEach((date, dateIndex) =>{

                output.series[thresholdIndex].data.push(thresholds[thresholdCount-thresholdIndex-1]);
            });
        });

        // add cube-data for each timestamp compensating for holes in the data
        data.forEach((cubeData, cubeIndex) =>{

            output.series.push({
                name: ("cube_" + cubeIndex),
                data: []});

            dateArray.forEach((date, dateIndex) =>{

                let filtered = cubeData.filter(e => e.timestamp == date)

                if (filtered.length == 0){

                    output.series[cubeIndex + thresholdCount].data.push("null");

                } else {

                    output.series[cubeIndex + thresholdCount].data.push(filtered[0].data);
                }
            });
        });

        console.log(output);

        output.labels = formatXLabels(dateArray);

    } catch(error){
        console.error(error);
    }

    return output;
}

// Request data for single cube from given time window
async function requestCubeData(fromDate, toDate, cubeId) {

    let appAddress = document.getElementById("appAddress").value;
    let resource = "http://" + appAddress + "/api/data/" + cubeId;

    let token = document.getElementById("token").value;
    let data = [];

    try {
        let response = await fetch(resource, {
            method: "post",
            headers: {
              "Accept": "application/json",
              "Content-Type": "application/json",
              "Authorization": "Bearer " + token.trim()
            },
          
            body: JSON.stringify({
                "start": fromDate,
                "end": toDate              
            })
        });

        if (response.ok){

            data = await response.json()

        } else {

            console.log(response);
        }

    } catch(error) {
        
        console.log(error);
    }

    return data;
}

function callSubPage(subUrl) {
    let hostname = window.location.hostname;
    window.location = hostname.concat(subUrl);
}

async function updateToken() {
    let appAddress = document.getElementById("appAddress").value;
    let token = document.getElementById("token").value;

    let resource = "http://" + appAddress + "/api/token/refresh/" + token;

    try {
        let response = await fetch(resource, {
            method: "post",
            headers: {
              "Accept": "application/json",
              "Authorization": "Bearer " + token.trim()
            },
        });

        if (response.ok){

            let token = await response.json()
            console.log(token);
            document.getElementById("token").value = token.key;
        } else {
            console.log(response);
        }

    } catch(error) {
        console.log(error);
    }
}