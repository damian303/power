$(function() {
  var width = 560,
      height = 500,
      barHeight = height / 2 - 40;

  d3.selectAll(".title").style("text-align", "center");//// THIS SHOULD BE IN CSS !!!!!
  d3.selectAll(".navbar").style("height", "0px").style("visibility", "hidden");
  d3.select("body").style("font-family", "Tahoma, Verdana, sans-serif").style("color", "#444642");

  var formatNumber = d3.format("s");
  var now = new Date();

  var endtime = now.getTime();
  var starttime = now-86400000;

  var startDate = new Date(starttime);
  var endDate = new Date(endtime);

  var bst = isBSTinEffect();


  var tooltip = d3.select("body")
    .append("div")
    .attr("id","tree_tooltip")
    .attr("class", "tree_tooltip")
    .style("position","absolute").style("width","auto").style("height","auto").style("min-width","50px").style("visibility","hidden").style("border-radius","4px")
    .style("padding","5px").style("background","white").style("border","1px solid black");

  function showTooltip(text){
  	    var x = d3.event.pageX, y = d3.event.pageY;
            tooltip.html(text);
  			var tt_size = tooltip.node().getBoundingClientRect();
  			var tooltip_offset_x = x>(tt_size.width)?-(tt_size.width/2):(tt_size.width/2);
  			var tooltip_offset_y = y>(tt_size.height+20)? -(tt_size.height+40):30;
  				tooltip.style("visibility","visible")
  	          .style("left",x+ tooltip_offset_x + "px")
  	          .style("top", y+ tooltip_offset_y + "px");
  }

  var data = [];
  var keys = [];
  var time_slice = ((24*60)/15);// 30 minute slices //

  var getJSON = function(){
    $.ajax({
        url:"/power/php/rest.php",
        type: "POST",
        data: "",
        dataType: "json",
        success: function (data) {
          console.log(data);
          process_data(data);
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            console.log(XMLHttpRequest);
            console.log(textStatus);
            console.log(errorThrown);
        }
    });
  }
// For BST
  Date.prototype.addHours = function(h) {    
     this.setTime(this.getTime() + (h*60*60*1000)); 
     return this;   
  }
  //getJSON(summary_devices, process_devices);
  getJSON();
  //getJSON(event_graph, process_events);
  function process_data(res){
    var power = [];
    var times = {};

    for(id in res){
        var obj ={};
        obj.time = new Date(res[id].timestamp);
        if(bst===1)obj.time.addHours(1);
        obj.value = +res[id].value;
        obj.key = res[id].name;
        obj.name = res[id].name;
        obj.percentage = res[id].percentage;
        if(!times[obj.time])times[obj.time]=0;
        obj.start =  times[obj.time];
        obj.end = times[obj.time] + obj.value;
        times[obj.time] = obj.end;
        power.push(obj);
    }
    var total = 0;
    for(var i = 1; i<6; i++){
      total+=power[power.length-i].value;
    }
    d3.select("#total").html(total.toFixed(2)+"GW");
    drawRadial(power, "chart");
  }

    //data.sort(function(a,b) { return b.value - a.value; });
  //drawRadial(data);
  function drawRadial(data, div){
    var div_width = $('#'+div).width();
    margin = barHeight+50;
    if(div == "devices"){
      var legend_position = -1, radial_shift = div_width - margin;
    }
    else {
      var legend_position = 1, radial_shift = margin;
    }

  //data.sort(function(a,b) { return b.value - a.value; });

    var svg = d3.select('#'+div).append("svg")
        .attr("width", div_width)
        .attr("height", height)
      .append("g")
        .attr("transform", "translate(" +radial_shift + "," + height/2 + ")");

    var extent = d3.extent(data, function(d) { return d.end; });

    var barScale = d3.scale.linear()
        .domain(extent)
        .range([(barHeight/4)+2, barHeight]);

    var colorScale = d3.scale.ordinal()
          .domain(["CCGT", "Wind", "Coal", "Nuclear", "Other"])
          .range(['#98999b','#1a9641','#404040','#fdae61','#bcbddc']);

    var numBars = time_slice;

        timeScale_start = startDate.setHours(0,0,0);
        timeScale_end = endDate.setHours(0,0,0);

    var timeScale = d3.time.scale()
        .domain([timeScale_start, timeScale_end])
        .range([0, numBars]);

    var opacityScale = d3.scale.linear()
        .domain([0,time_slice])
        .range([.1, 1]);

    var arc = d3.svg.arc()
        .startAngle(function(d,i) { return (timeScale(d.time) * 2 * Math.PI) / numBars; })
        .endAngle(function(d,i) { return ((timeScale(d.time) + 1) * 2 * Math.PI) / numBars; });

    var x = d3.scale.linear()
        .domain(extent)
        .range([0, -barHeight]);

    var xAxis = d3.svg.axis()
        .scale(x).orient("left")
        .ticks(3)
        .tickFormat(formatNumber);

    /************ setup legend data ************/
    var legend_data = {};
    for(d in data){
      if(!legend_data[timeScale(data[d].time)])legend_data[timeScale(data[d].time)]=[];
      var obj = {};
      obj.key = data[d].key;
      obj.start = data[d].start;
      obj.end = data[d].end;
      legend_data[timeScale(data[d].time)].push(obj);
    }

    var circles = svg.selectAll("circle")
          .data(x.ticks(3))
        .enter().append("circle")
          .attr("r", function(d) {return barScale(d);})
          .style("fill", "none")
          .style("stroke", "#444642")
          .style("stroke-dasharray", "2,2")
          .style("stroke-width",".5px");

///************* Dark background circle ****************//
      svg.append("circle")
          .attr("r", barHeight)
          .classed("outer", true)
          .style("fill", "#444642")
          .style("stroke", "#444642")
          .style("stroke-width","1.5px")
          .style("fill-opacity", 0)
          .transition().duration(500)
          .style("fill-opacity", 1);
/************** White inside circle ***********************/
      svg.append("circle")
          .attr("r", barScale(0))
          .classed("inner", true)
          .style("fill", "white")
          .style("stroke", "none");

    var segments = svg.selectAll("path")
          .data(data)
        .enter().append("path")
          .each(function(d) { d.outerRadius = barScale(0); d.innerRadius=barScale(0);})
          .style("stroke-width", 0)
          .style("stroke", function (d,i) {return  d3.rgb(colorScale(d.key)).darker(1);})//d3.rgb(color(d.value))//d3.rgb(d.color).darker(1);
          .style("fill", function (d,i) { return colorScale(d.key); })//colorScale(d.key)
          .style("fill-opacity", function(d){return (opacityScale(timeScale(d.time))-.4);})// Shim cos opacity scale didnt go to 0
          .attr("d", arc)
          .on("mouseover", function(d,i){
            d3.select(this)
            .style("fill-opacity", 1)
            .style("fill", function (d) {return  d3.rgb(colorScale(d.key)).brighter(1);})
            
            showTooltip(d.name+"</br>"+formatTime(d.time)+"</br>"+d.value+"GW<br/>"+d.percentage+"%");
            
            legend_data = data.filter(function(d2) { return timeScale(d2.time).toFixed(0) == timeScale(d.time).toFixed(0) })
            
            legend.data(legend_data)
            
            legendEnter.transition().duration(1000).attr("transform", function(d) {
             d3.select("#"+div+"_legend_"+d.key).transition().duration(1000).attr("height", function(){return (legend_scale(+d.value)>0)?legend_scale(+d.value):0;})
             return "translate("+(((width/2)+10)*legend_position)+","+(legend_scale(+d.start)-100)+")";
            }).select(".legend_text").select("text").text(function(d) {return d.name+" ("+d.percentage+"%)";


          });
            
            total_power = d3.sum(legend_data, function(d){return d.value;});
            
            legendTotal.transition().duration(1000)
              .attr("transform", "translate("+(((width/2)+10)*legend_position)+","+(legend_scale(total_power)-100)+")")

            legendTotal.select("text").text("Total "+total_power.toFixed(2)+"GW")

          })
          .on("mouseout", function(d){
            d3.select(this)
            .style("fill-opacity", function(d){return opacityScale(timeScale(d.time))-.4;})
            .style("fill", function (d) {return  colorScale(d.key);})
            tooltip.style("visibility", "hidden");
          })

    segments.transition().ease("cubic").duration(2000).delay(function(d,i) {return timeScale(d.time)*30;})
          .attrTween("d", function(d,index) {
            var iO = d3.interpolate(d.outerRadius, barScale(+d.end));
            var iI = d3.interpolate(d.innerRadius, barScale(+d.start));
            return function(t) { d.outerRadius = iO(t); d.innerRadius = iI(t);return arc(d,d.time); };
          });

    var labelRadius = barHeight * 1.025;

    var hourLabels =d3.range(0,24);

    var text = svg.selectAll("g")
      .data(hourLabels)
    .enter().append("g")
      .attr("transform", function(d, i) {return "rotate(" + (-90+ (d * 360/hourLabels.length )) + ")translate("+(barHeight+15)+",0)"; })
      .append("text")
      .text(function(d){
        if(d.toString().length==1)text = "0"+d+":00";
        else text = d+":00";
        return text;})
      .style("font-size", 10)
      .style("stroke", "#444642")
      .style("stroke-width",".5px")
      .attr("text-anchor", function(d){
        if(d==0||d==12)anchor = "middle";
        else if(d<12)anchor = "start";
        else anchor = "end";
        return anchor;
      })
      .attr("dy", function(d){
        if(d>6&&d<18)return 10;
        else return 5;
      })
      .attr("transform", function(d, i) { return "rotate(" + (-(-90+(d * 360/hourLabels.length)) ) + ")"; })

  var dotScale = d3.time.scale()
      .domain([timeScale_start, timeScale_end])
      .range([0, hourLabels.length]);

  var minuteScale = d3.scale.linear()
      .domain([0,time_slice])
      .range([.1, 1]);

  var now_dot =  svg.append("g")
      .attr("transform", function(d, i) { return "rotate(" + (-90+(dotScale(now) * 360/hourLabels.length))+ ")translate("+(barHeight+10)+",0)"; })//(-(-90+(d * 360/hourLabels.length)) )
      .append("circle")
      .attr("class", "now_dot")
      .attr("r", 5)
      .style("fill", "#444642")
      .style("stroke", "#444642")

      legend_data = data.filter(function(d) { return timeScale(d.time).toFixed(0) == timeScale(now).toFixed(0)-1 })

  var max = d3.max(data, function(d) { return +d.end;} );

  var legend_scale = d3.scale.linear()
        .domain([0, max])
        .range([0, 350]);

  var legend = svg.selectAll("g.node")
	      .data(legend_data);

  var legendEnter = legend.enter().append("g")
  		  .attr("class", function(d){return "node_"+keys[d.key]})
  		  .attr("transform", function(d) {return "translate("+(((width/2)+10)*legend_position)+","+(legend_scale(+d.start)-100)+")";})
        .on("mouseover", function(d){
          showTooltip(d.name+"</br>"+formatTime(d.time)+"</br>"+d.value+"GW<br/>"+d.percentage+"%");
        })
        .on("mouseout", function(d){
          tooltip.style("visibility", "hidden");
        })

      legendEnter.append("g").append("rect")
        .attr("class", "legend_bar")
        .attr("id", function(d){return div+"_legend_"+d.key})
	      .attr("stroke", function (d,i) { return colorScale(d.key); })
	      .attr("fill", function (d,i) { return colorScale(d.key); })
	      .attr("x",0)
	      .attr("y",0)
        .attr("width", 10)
        .attr("height", function(d){return (legend_scale(+d.value)>0)?legend_scale(+d.value):0;})

  var legend_offset = 0;
      legendEnter.append("rect")
        .attr("stroke", function (d,i) { return colorScale(d.key); })
        .attr("class", "legend_line")
        .attr("y",0)
        .attr("width", function(d,i) {
          if(i>0)
            if(legend_scale(legendEnter.data()[i-1].value)<30)legend_offset+=25;
          return 15+legend_offset;
        })
        .attr("x",function(d,i){return (legend_position==-1) ? -(d3.select(this).attr("width")) : 0;})
        .attr("height", 1)


      legend_offset = 0;
      legendEnter.append("g")
        .attr("class", "legend_text")
        .attr("transform", function(d,i) {
          if(i>0){
            if(legend_scale(legendEnter.data()[i-1].value)<30)legend_offset+=25;
          }
          return "translate("+(legend_position*(15+legend_offset))+")rotate("+(legend_position*-30)+")";})
        .append("text")
	      .attr("x",5*legend_position)
	      .attr("y",0)
	      .attr("text-anchor", function(){return legend_position==-1?"end":"start"})
        .attr("stroke-width", .5)
        .attr("stroke", function (d,i) { return colorScale(d.key); })//.style("visibility", function(d){return (legend_scale(+d.value)>1?"visible":"hidden")})
	      .text(function(d) {return d.name+" ("+d.percentage+"%)";});//keys[d.key]
   
      var total_power =d3.sum(legend_data, function(d){return d.value;});

      var legendTotal = svg.append("g")
        .attr("class", "legend_text")
        .attr("transform", function(d) {return "translate("+(((width/2)+10)*legend_position)+","+(legend_scale(total_power)-100)+")";})
        
        legendTotal.append("rect")
        .attr("stroke", "#756bb1")
        .attr("class", "legend_line")
        .attr("width", legend_offset+25)
        .attr("height", 1)
        
        legendTotal.append("text")
        .attr("text-anchor", "start")
        .attr("stroke-width", .5)
        .attr("stroke", "#756bb1")
        .attr("transform", "translate("+(legend_offset+25)+", 0)rotate(-30)")
        .text("Total : "+total_power.toFixed(2)+"GW")
        
  }

  setInterval(function(){
    d3.selectAll(".now_dot").transition().duration(1000)
      .attr("r", 1)
      .each("end", function(){
        d3.selectAll(".now_dot").transition().duration(1000)
          .attr("r", 5)
      })
  }, 3000);

  function formatTime(a){
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
        year = a.getFullYear(),
        month = months[a.getMonth()],
        date = a.getDate(),
        hour = a.getHours(),
        min = a.getMinutes();
        min += (min<10)?"0":"";
    var sec = a.getSeconds();
    sec += (sec<10)?"0":"";
    var time = date + '/' + month + '/' + year + ' ' + hour + ':' + min + ':' + sec ;
    return time;
  }

  function isBSTinEffect(){// All credit to : Alex in this post : https://www.neowin.net/forum/topic/1030589-javascript-is-british-summer-time-in-effect/
    var d = new Date();
    // Loop over the 31 days of March for the current year
    for(var i=31; i>0; i--){
    var tmp = new Date(d.getFullYear(), 2, i);
    // If it's Sunday
      if(tmp.getDay() == 0)
      {
        // last Sunday of March
        lSoM = tmp;
        // And stop the loop
        break;
      }
    }
    // Loop over the 31 days of October for the current year
    for(var i=31; i>0; i--)
    {
     var tmp = new Date(d.getFullYear(), 9, i);
    // If it's Sunday
      if(tmp.getDay() == 0)
      {
        // last Sunday of October
        lSoO = tmp;
        // And stop the loop
        break;
      }
    }
    // 0 = DST off (GMT)
    // 1 = DST on  (BST)
    if(d < lSoM || d > lSoO) return 0;
    else return 1;
  }
});
