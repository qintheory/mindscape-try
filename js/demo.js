var time, date1, date2;

// numerate the nodes    
var id = 0;   
var size = 1;
var svgNodeCount = 0;    
var nodeNum;
var vis = false;
    
var previousClick = null;
var nodeClicked = false;
var loopFormed = false;
var nodeRepeated = false;
var connector = [];
var train = [];
var streams = [];
var nowClick;

var width = 600,
    height = 500;

var svg = d3.select("forum").insert("svg")
            .attr("width", width)
            .attr("height", height),
    g = svg.append("g")
            ;

// DEFINE NODES AND TEXTS    
var nodes = [ ],
    node = g.attr("class", "nodes")
        .selectAll(".node");  

var text = g.attr("class", "texts")
        .selectAll("text");

// DEFINE LINKS    
var link = g.attr("stroke", "aliceblue")
    .selectAll("path");
    
var links = []; 
        
// DEFINE FORCES    
var simulation = d3.forceSimulation()
    .force("x", d3.forceX())
    .force("y", d3.forceY())
    .alphaTarget(0.2)
//    .force("r", d3.forceRadial(10))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .on("tick", tick);   

var zoom = d3.zoom()
        .on("zoom", zoom_actions);

var input = [];

// enabling mouse up at all times   
svg.on("mouseup", mouseUp);

$("#finish").click(function(){
    input = $("#field").val();
    $(".home-text-box").hide();
    input = input.replace(/(?:(?:\r\n|\r|\n)\s*){2}/gm, "\n");
    input = input.split('\n');
    
    $.each(input, function(index, item) {
        drawNode(item);    
    });
})

// DRAWING BEGHINS

function drawNode(name){
   var item = {name, id, size};
   console.log(item);      
   d3.select
   nodes.push(item);
   updateNodes();  
   linkingBegins();
}

//function butterfly(d) {
//  var dx = parseFloat(d.target.x) - parseFloat(d.source.x);
//  var dy = parseFloat(d.target.y) - parseFloat(d.source.y);
//  var dr = Math.sqrt(dx * dx + dy * dy);
//  var r =  d.source.name.size*10; 
//  var xPad,
//      yPad; 
//
//    if(d.target.x < d.source.x) {
//        xPad = d.source.x - r;
//    } else {
//        xPad = d.source.x + r;
//    }
//
//    if(d.target.y < d.source.y) {
//        yPad = d.source.y + r;
//    } else {
//        yPad = d.source.y - r;
//    }
//
//    l = Math.sqrt(dx * dx + r * r);   
//    let tearWidth = 1.05;
//    let path = 
//    `M ${d.target.x} ${d.target.y}, 
//    Q ${xPad*tearWidth} ${yPad*tearWidth}, ${d.source.x} ${d.source.y}, 
//    T ${d.target.x} ${d.target.y},
//    Z`;
//
//    return path;
//}

function updateNodes(d, i) {
    // update id # of the node
    nodes.forEach(function(d, i){
       d.id = i;
    })
    
    // update data for the nodes
    node = node.data(nodes);
    text = text.data(nodes);
    
    node.exit()
        .remove();
    
    node = node.enter()
      .append("circle")
      .attr("class", "node")
      .attr("r", 10)
      .style("fill", "#f6f6f6")
      .style("opacity", "0.3")
      .style("stroke", "aliceblue")
      .style("z-index", 9)
      .attr("id", function(d){ return d.id; })
      .style("stroke-opacity", 1)
      .merge(node)
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended))
    ;
    
    text.exit()
        .remove();
    
    text = text
        .enter()
        .append("text")
            .attr("class", "text")
            .attr("x", 8)
            .attr("y", ".31em")
            .style("z-index", 8)
            .style("fill", "aclieblue")
            .style("opacity", 0.5)
            .merge(text)
            .attr("id", function(d){ return d.id; })
            .text(function(d) { return d.name })
    ;
    
    simulation.nodes(nodes);
    simulation.restart();
}

// ENABLING LINK MAKING FROM NODES     
function linkingBegins() {
    simulation
        .force("charge", d3.forceManyBody().strength(-200))
        .force("collide", d3.forceCollide().radius(10));
    
    node = node
        .on('mousedown.drag', null)
        .on("mousedown", makeLinks);
    
    d3.selectAll("input")
        .style("display", "none");
}


function makeLinks() {
    $("#redo-button").show();
    
    nowClick = this;
    nodeClicked = true;
    
    // check if the clicked node is repeated
    links.forEach(function(d){
        if (d.source.id == nowClick.id & loopFormed == true){
            console.log("nodes aready connected, change node"); 
            nodeClicked = false;
            nodeRepeated = true;
            $("#nodeCounter").text("Repeated Node Detected")
        }
        else {
            nodeRepeated = false;
        }
    })
    
    // CASE 1: if it's a new node
    if (previousClick == null & nodeRepeated == false) {
        previousClick = nowClick;
        train.push(nowClick.id);
        selectedNode(nowClick);
        // register time
        date1 = new Date().getTime();
    } 
    else if (previousClick == nowClick){
        console.log("cannot connect to oneself"); 
        $("#nodeCounter").text("cannot connect to oneself")
    }
    
    // CASE 3 & 4, forming links
    else {
        // register time
        date2 = new Date().getTime();
        time = (date2 - date1) / 1000;
        date1 = date2;
        
        mouseDown(nodes[previousClick.id], nodes[nowClick.id], time);
        
        console.log("new link from"+ previousClick.id + "to" + nowClick.id );
        
        deselectNode(previousClick);
        selectedNode(nowClick);
        train.push(nowClick.id);
        console.log(train);
        //check if loops
        links.forEach(function(d, i){
            if (d.source.id == nowClick.id){
                loopFormed = true;
                train.push(streams);
                d3.select(nowClick).style("fill", "aliceblue");
                nodeClicked = false;
                deselectNode(nowClick);
            }
            else {
                previousClick = nowClick;
            }
        })    
    }
}

function selectedNode(d) {
    // selected node - colour highlighted
    d3.select(d).transition()
            .style("fill", "aliceblue")
            .style("opacity", "0.7");  
    node = node.style("fill", "#f6f6f6").merge(node);
}

function deselectNode(d) {
    // unhighlight the previous node
    d3.select(d)
        .attr("r", 10)
        .style("fill", "#f6f6f6")
        .merge(node); 
}
 
// MOUSE DOWN to create a link
function mouseDown(node1, node2, time) {
  // Updating data
  links.push({source: node1, target: node2, time: time});
  // drawing lines:
  updateLink();    
}

// MOUSE UP to reset first node
function mouseUp() {
  console.log("mouseUp");
  if (nodeClicked == false) {
      console.log("previous node nulled, restart");
      previousClick = null;
      if (links.length == nodes.length && nodes.length > 0) {
        console.log("linking finished");
        //disable makeLinks
        node.on("mousedown", null)
//            .on("dblclick", null);
        untangle();
      } 
  }
} 

function updateLink() {
  link = link.data(links, function(d) { return d.source.id + "-" + d.target.id; });
  link.exit().remove();
  link = link.enter().append("path")
      .attr("class", "link")
      .attr("marker-end", "url(#end)")
      .merge(link);

  // DEFINING Arrows on the links/arcs    
    svg.append("defs").selectAll("marker")
        .data(["end"])
      .enter().append("marker")
        .attr("id", function(d) { return d; })
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 15)
        .attr("refY", -1.5)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .style("fill", "aliceblue")
      .append("path")
        .attr("d", "M0,-5L10,0L0,5");     
  // Update and restart the simulation.
  simulation.nodes(nodes);
  simulation.alpha(1).restart(); 
}

function untangle(){
    simulation.force("link", d3.forceLink(links).distance(100))
        .force("charge", d3.forceManyBody().strength(-1300))
        .force("collide", d3.forceCollide().radius(60));
    console.log("untangled!")
    //innitiate dragging
    
    node.style("color", "#669999")
        .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));
    analysis(links);  
//    $("#vis-button").show();
    var graphAnalysis = JSON.stringify(links);
}

function linkDistance(d){
    return 50 * d.time;
}

function nodeSize(d) {
    return 5 * d;
}

function analysis(links){
    var ids = [];
    var counts = [];
    var n = 1
    
    simulation.force("link", d3.forceLink(links).distance(100))
        .force("charge", d3.forceManyBody().strength(-200))
        .force("collide", d3.forceCollide().radius(30));
    
    links.forEach(function(d, i){
        var item = d.target.id;
        //if it's repeated
        if (ids.includes(item)){
            console.log("repeated")
            var j = ids.indexOf(item);
            counts[j] += 1;
        }
        else{
            ids.push(item);
            counts.push(n);
        }
        console.log(ids);
        console.log(counts);
    });
    
    ids.forEach(function(d, i){
        nodes[d].size *= (counts[i]+0.5); 
        
    })
    
    link.style("z-index", "9");
    
    node.attr("r", "10")
        .style("color", "#669999")
        .style("color", function(d) {if (d.size < 3) {return "#f6f6f6"}});
    
    text.style("font-size", function(d){return (12 + d.size*5) })
        .style("z-index", "8");
    
    svg.on("mouseup", null);
    zoom(svg);
}

// FORCE TRANSFORMATION    
function tick() {
  node.attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; });
  link.attr("d", linkArc);    
  text.attr("transform", transform);    
}

function transform(d) {
  return "translate(" + d.x + "," + d.y + ")";
}    

// MAKING ARC as links    
function linkArc(d) {
  // drawing regular diagram
  var dx = d.target.x - d.source.x,
      dy = d.target.y - d.source.y,
      dr = Math.sqrt(dx * dx + dy * dy);
    
  var r = 25,
      l = Math.sqrt(dx * dx + r * r);
  
  let path = "M" + d.source.x + "," + d.source.y + "A" + l + "," + l + " 0 0,1 " + d.target.x + "," + d.target.y  
  
// drawing butter fly
  var dx2 = parseFloat(d.target.x) - parseFloat(d.source.x);
  var dy2 = parseFloat(d.target.y) - parseFloat(d.source.y);
  var dr2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
  var r2 =  d.source.name.size*10; 
  var xPad,
      yPad;
  
  if(d.target.x < d.source.x) {
            xPad = d.source.x - r2;
        } else {
            xPad = d.source.x + r2;
        }
        
        if(d.target.y < d.source.y) {
            yPad = d.source.y + r2;
        } else {
            yPad = d.source.y - r2;
        }
        
        l2 = Math.sqrt(dx2 * dx2 + r2 * r2);   
        let tearWidth = 1.05;
        let path2 = 
        `M ${d.target.x} ${d.target.y}, 
        Q ${xPad*tearWidth} ${yPad*tearWidth}, ${d.source.x} ${d.source.y}, 
        T ${d.target.x} ${d.target.y},
        Z`;   
      return path;
}

// DR

function dragstarted(d) {
  d3.select(this).raise().classed("active", true);
}

function dragged(d) {
  d3.select(this).select("text")
    .attr("x", d.x = d3.event.x)
    .attr("y", d.y = d3.event.y);
  d3.select(this).select("rect")
    .attr("x", d.x = d3.event.x)
    .attr("y", d.y = d3.event.y);
}

function dragended(d) {
  d3.select(this).classed("active", false);
}

function zoom_actions(){
      g.attr("transform", d3.event.transform);
}

/// UI
$(document).ready(function(){
    console.log("document ready");
//    $("#vis-button").hide();
    $("#undo-button").hide();
    $("#redo-button").hide();
});

$("#redo-button").click(function(){
//    d3.selectAll("circle").remove();
//    d3.selectAll("text").remove();
    d3.selectAll("path").remove();
//    $.each(input, function(index, item) {
//        drawNode(item);    
//    });
})