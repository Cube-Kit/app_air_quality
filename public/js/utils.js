// Format labels for x axis
function formatXLabels(data)
{
    let output = [];
    data.forEach((element, index) => {
        let date = new Date(element);

        let xLabel =    (index == 0 || date.getMinutes() == 0) ? date.getHours().toString().padStart(2, '0') : "";
        xLabel +=       (index == 0 || date.getSeconds() == 0) ? ":" + date.getMinutes().toString().padStart(2, '0') : "";
        xLabel +=       ":" + date.getSeconds().toString().padStart(2, '0');

        output.push(xLabel);
    });
    return output;
}

// Format data to be compatible with chartist.js
function formatData(data){

    let dateSet = new Set();
    let output = {labels: [], series: []};

    try{
        data.forEach((outerElement, outerIndex) =>{
            outerElement.forEach((innerElement, innerIndex) =>{

                dateSet.add(innerElement.timestamp)

            });
        });

        let dateArray = Array.from(dateSet);

        dateArray.sort((date1, date2) => date1.valueOf() - date2.valueOf());

        data.forEach((cubeData, cubeIndex) =>{

            output.series.push([]);

            dateArray.forEach((date, dateIndex) =>{

                let filtered = cubeData.filter(e => e.timestamp == date)

                if (filtered.length === 0){

                    output.series.push("null");

                } else {

                    output.series[cubeIndex].push(filtered[0].data);
                }
            });
        });

        output.labels = formatXLabels(dateArray);

        console.log(output);

    } catch(error){
        console.error(error);
    }

    return output;
}

// Request data for single cube from given time window
async function requestCubeData(fromDate, toDate, cubeId) {

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

        } else {

            console.log(response);
        }

    } catch(error) {
        
        console.log(error);
    }

    return data;
}