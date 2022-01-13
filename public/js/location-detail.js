// set the dimensions and margins of the graph
let margin, width, height;

// Declare globals
let svg, chart, cubeId;

window.addEventListener("load", function(event) {

    margin = {top: 0, right: 0, bottom: 0, left: 0};
    width = 600 - margin.left - margin.right;
    height = 400 - margin.top - margin.bottom;

    // Get the right chart svg
    svg = d3.select("#chart");

    // Get cubeId from <input> element
    cubeId = document.getElementById("cubeId").value;

    //Append the actual chart with all its properties
    chart = svg.append("g")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    requestChartData();



});

async function requestChartData(){

    let resource = "http://"
    resource += window.location.host;
    resource += "/api/data/";
    resource += cubeId;

    let data;

    console.log(resource);

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
            data = [
                {timestamp: new Date("October 13, 2014 11:13:00"), data: 14},
                {timestamp: new Date("October 13, 2014 11:13:10"), data: 14.5},
                {timestamp: new Date("October 13, 2014 11:13:20"), data: 15},
                {timestamp: new Date("October 13, 2014 11:13:30"), data: 16},
                {timestamp: new Date("October 13, 2014 11:13:40"), data: 18},
                {timestamp: new Date("October 13, 2014 11:13:50"), data: 22},
                {timestamp: new Date("October 13, 2014 11:14:00"), data: 27},
                {timestamp: new Date("October 13, 2014 11:14:10"), data: 35},
                ]
        }

    } catch(error) {
        data = [
        {timestamp: new Date("October 13, 2014 11:13:00"), data: 14},
        {timestamp: new Date("October 13, 2014 11:13:10"), data: 14.5},
        {timestamp: new Date("October 13, 2014 11:13:20"), data: 15},
        {timestamp: new Date("October 13, 2014 11:13:30"), data: 16},
        {timestamp: new Date("October 13, 2014 11:13:40"), data: 18},
        {timestamp: new Date("October 13, 2014 11:13:50"), data: 22},
        {timestamp: new Date("October 13, 2014 11:14:00"), data: 27},
        {timestamp: new Date("October 13, 2014 11:13:10"), data: 35},
        ]

        console.log(error);
    }

    

    drawChart(data);
}

function drawChart(data){

    //Define x-axis gaps and labels
    let x = d3.scaleTime()
        .range([0, width])
        .domain(d3.extent(data, (d) => { return new Date(d.timestamp); }))

    //Define y-axis gaps and labels
    let y = d3.scaleLinear()
        .range([height, 0])
        .domain([0, d3.max(data, (d) => { return d.data; })]);

    // Append x-axis to chart
    svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

    // Add Y axis
    svg.append("g")
    //.attr("transform", "translate(0," + width + ")")
    .call(d3.axisLeft(y));

    // Add the line
    svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 3)
    .attr("d", d3.line()
    .x((d) => { return x(new Date(d.timestamp)) })
    .y((d) => { return y(d.data) })
    )

    console.log("done");

}