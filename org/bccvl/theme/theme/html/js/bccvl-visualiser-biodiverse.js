
// JS code to initialise the biodiverse visualisations

define(['jquery', 'bccvl-preview-layout', 'openlayers3', 'ol3-layerswitcher', 'bccvl-visualiser-common', 'd3', 'jquery-xmlrpc'],
    function( $, preview, ol, layerswitcher, vizcommon, d3  ) {
        
        // visualiser base url
        var visualiserBaseUrl = window.bccvl.config.visualiser.baseUrl;
        var visualiserWMS = visualiserBaseUrl + 'api/wms/1/wms';
 
        // fetch api url
        var fetchurl = visualiserBaseUrl + 'api/fetch';
 
        // dataset manager getMetadata endpoint url
        var dmurl = portal_url + '/API/dm/v1/metadata';
        
        var bioviz = {
            
            addLayersForBiodiverse: function(map, uuid, url, id, params, overlayGroup){
                
                // add special selection to d3
                d3.selection.prototype.first = function() {
                  return d3.select(this[0][0]);
                };
                d3.selection.prototype.last = function() {
                  var last = this.size() - 1;
                  return d3.select(this[0][last]);
                };

                var gridSize = params.cellsize,
                    dataProj = params.srs.toUpperCase(), 
                    mapProj = map.getView().getProjection().getCode(),
                    projection = ol.proj.get(dataProj),
                    projectionExtent = projection.getExtent(),
                    size = ol.extent.getWidth(projectionExtent) / 256,
                    colorBank = ['#FFEDA0', '#FED976', '#FEB24C', '#FD8D3C', '#FC4E2A', '#E31A1C', '#BD0026', '#800026', '#6d0021', '#56001a', '#400013'];
                    
                var dfrd = $.Deferred(),
                    requestStatus = $.Deferred(),
                    jqxhr = $.Deferred();
                    //csv = ;
                
                var fetch = function(){
                    $.ajax({
                        url: fetchurl,
                        data: {'datasetid': uuid, 'DATA_URL': url, 'INSTALL_TO_DB': false}
                    }).done(function(data, status, jqXHR){
                        if(data.status == "COMPLETED"){
                            requestStatus.resolve(data.status);
                        } else if (data.status == "FAILED"){
                            requestStatus.reject(data.reason);
                        } else {
                             setTimeout(function(){
                                fetch();
                             }, 500);
                        }
                    }).fail(function(jqXHR, textStatus, errorThrown) {
                        alert('Problem request dataset, please try again later.')
                    });
                }
                
                requestStatus.then(
                  function(){
                    var meta = $.ajax({
                        url: dmurl,
                        type: 'GET',
                        dataType: 'xml json',
                        converters: {'xml json': $.xmlrpc.parseDocument},
                        data: {'uuid': uuid}})
                        .then(function(data, status, jqXHR) {
                            jqxhr.resolve(data);
                        });
                  }, function(jqXHR, textStatus, errorThrown){
                    alert('Problem preparing dataset for viewing, please try again later.')
                });
                
                jqxhr.then(
                    function(){
                        d3.csv(url, function(error, data) {

                            var check = true;
                            
                            if (data.length > 50000) {
                                check = confirm('Experimental results with greater than 50,000 rows can cause browsers to slow, or even crash, are you sure you want to continue?')
                            }
                            if (check == true){
                                
                                // Convert to GeoJSON
                                var geojson = bioviz.biodiverseCSVtoJSON(data, dataProj, mapProj); 
                                
                                // Create vector grid from GeoJSON
                                var grid = new ol.source.Vector({
                                    features: (new ol.format.GeoJSON()).readFeatures(geojson.points)
                                });
                                
                                var hoverFunction = function(e) {
                                    if (e.dragging) return;
                            
                                    featureOverlay.getSource().clear();
                                       
                                    var pixel = map.getEventPixel(e.originalEvent);
                                    var hit = map.hasFeatureAtPixel(pixel);
                                    
                                    map.getTargetElement().style.cursor = hit ? 'pointer' : '';
                            
                                    if(hit){
                                        map.forEachFeatureAtPixel(pixel, function(feature, layer) {
                                            featureOverlay.getSource().addFeature(feature);
                                        });
                                    } else {
                                        featureOverlay.getSource().clear();
                                    }
                            
                                    return;
                                }
                                
                                map.on('pointermove', hoverFunction );
                                
                                // Create grid selection style
                                var gridSelectStyle = function (feature, resolution) {
                            
                                    // get feature coords and transform back into 4326 (solely for simple grid calc)
                                    var coordinate = feature.getGeometry().getCoordinates();
                                        coordinate = ol.proj.transform(coordinate, mapProj, dataProj);
                            
                                    var currentLayer = bioviz.getVisibleOverlay(map);
                            
                                    var property = currentLayer.get('title');
                                    var range = geojson.vars[property].range;
                            
                                    // subtract half a point to create first point of polygon
                                    var x = coordinate[0] - gridSize / 2,
                                        y = coordinate[1] - gridSize / 2,
                                        val = Number(feature.getProperties()[property]);
    
                                    var colorIdx;
                                    $.each(range, function(i, x){
                                        if (val >= x){
                                            colorIdx = i;
                                        }
                                    });
                                    
                                    var rgb = d3.rgb(colorBank[colorIdx]);
                            
                                    var geom = new ol.geom.Polygon([[
                                            [x,y], [x, y + gridSize], [x + gridSize, y + gridSize], [x + gridSize, y]
                                        ]]);
                            
                                        geom.transform(dataProj,mapProj);
                            
                                    return [
                                        new ol.style.Style({
                                            stroke: new ol.style.Stroke({
                                                color: [0, 0, 0, 1],
                                                width: 0.25 * map.getView().getZoom()
                                            }),
                                            fill: new ol.style.Fill({
                                                color: [rgb.r, rgb.g, rgb.b, .9]
                                            }),
                                            geometry: geom
                                        })
                                    ];
                                };
                            
                                // Create grid select interaction
                                var gridSelect = new ol.interaction.Select({
                                    layers: function (layer) {
                                      return layer.get('type') == 'features';
                                    },
                                    style: gridSelectStyle,
                                    name: 'gridSelect'
                                });
                            
                                // Get selected grid cells collection
                                var selectedGridCells = gridSelect.getFeatures();
                                
                                selectedGridCells.on('add', function (feature) {
                                    var currentLayer = bioviz.getVisibleOverlay(map);
                                    var property = currentLayer.get('title');

                                    bioviz.updateClasses(selectedGridCells);
                            
                                });
                            
                                selectedGridCells.on('remove', function (feature) {
                                    var currentLayer = bioviz.getVisibleOverlay(map);
                                    var property = currentLayer.get('title');
    
                                    bioviz.updateClasses(gridSelect.getFeatures());
                                });
                            
                                // Add select interaction to map
                                map.addInteraction(gridSelect);
                            
                                // Create grid selection style
                                var gridHoverStyle = function (feature, resolution) {
                                    // get feature coords and transform back into 4326 (solely for simple grid calc)
                                    var coordinate = feature.getGeometry().getCoordinates();
                                        coordinate = ol.proj.transform(coordinate, mapProj, dataProj);
                            
                                    var currentLayer = bioviz.getVisibleOverlay(map);
    
                                    var property = currentLayer.get('title');
                                    var range = geojson.vars[property].range;
                                    
                                    // subtract half a point to create first point of polygon
                                    var x = coordinate[0] - gridSize / 2,
                                        y = coordinate[1] - gridSize / 2,
                                        val = Number(feature.getProperties()[property]);
    
                                    var colorIdx;
                                    $.each(range, function(i, x){
                                        if (val >= x){
                                            colorIdx = i;
                                        }
                                    });
                                    
                                    var rgb = d3.rgb(colorBank[colorIdx]);
                            
                                    var geom = new ol.geom.Polygon([[
                                            [x,y], [x, y + gridSize], [x + gridSize, y + gridSize], [x + gridSize, y]
                                        ]]);
                            
                                        geom.transform(dataProj,mapProj);
                            
                                    return [
                                        new ol.style.Style({
                                            fill: new ol.style.Fill({
                                                color: [rgb.r, rgb.g, rgb.b, 1]
                                            }),
                                            stroke: new ol.style.Stroke({
                                                color: [0, 0, 0, .5],
                                                width: 0.25 * map.getView().getZoom()
                                            }),
                                            geometry: geom
                                        })
                                    ];
                                };
                            
                                var features = new ol.Collection();
                                var featureOverlay = new ol.layer.Vector({
                                    source: new ol.source.Vector({features: features}),
                                    name: 'Features',
                                    type: 'hover-overlay',
                                    style: gridHoverStyle,
                                    visible: true
                                });
                            
                                map.addLayer(featureOverlay);
                                
                                var drawFunction = new ol.interaction.Draw({
                                    type: 'Polygon'
                                });
                                
                                drawFunction.on('drawstart', function (evt) {
                                    // wipe legend selects
                                    d3.selectAll('rect.legend-cell')
                                        .attr('class', 'legend-cell');
                            
                                    gridSelect.getFeatures().clear();
                                    
                                });
                            
                                drawFunction.on('drawend', function (evt) {
                            
                                    var geometry = evt.feature.getGeometry(),
                                        extent = geometry.getExtent(),
                                        drawCoords = geometry.getCoordinates()[0];
                            
                                    map.removeInteraction(drawFunction);
                            
                                    grid.forEachFeatureIntersectingExtent(extent, function(feature) {
                                        if (bioviz.pointInPolygon(feature.getGeometry().getCoordinates(), drawCoords)) {
                                            gridSelect.getFeatures().push(feature);
                                        }
                                    });
                            
                                    setTimeout(function(){ // Add delay to avoid deselect
                                        map.on('pointermove', hoverFunction );
                                        gridSelect.setActive(true);
                                    }, 800);
                                });
                            
                            
                                // this is not specifically the event we want, but it works
                                map.on('singleclick', function(evt){
                                    // wipe legend selects
                                    d3.selectAll('rect.legend-cell')
                                        .attr('class', 'legend-cell');
                                });
                                
                                var layercount = 0;
    
                                $.each(geojson.vars, function(key, variable){
                                    bioviz.createBiodiverseLayer(layercount, map, grid, overlayGroup, key, variable, colorBank, dataProj, mapProj, gridSize, hoverFunction, drawFunction);
                                    layercount++;
                                });
                                
                            }
                        });
                    
                    }, function(){
                        console.log('something is wrong fetching csv');
                });
                
                fetch();
                
                return dfrd;
           },
           
           // Convert data to GeoJSON
            biodiverseCSVtoJSON: function (data, dataProj, mapProj) {
            
                var features = {}
            
                features.points = {
                    type: 'FeatureCollection',
                    features: []
                };
            
                features.vars = {
                    'richness': {
                        values: [],
                        range: [],
                        num: [],
                        total: 0
                    },
                    'redundancy':{
                        values: [],
                        range: [],
                        num: [],
                        total: 0
                    },
                    'rarity':{
                        values: [],
                        range: [],
                        num: [],
                        total: 0
                    },
                    'endemism':{
                        values: [],
                        range: [],
                        num: [],
                        total: 0
                    }
                };
            
                data.forEach(function(d){
            
                    var prop = {};
                    $.each(d, function(k, v){
                        prop[k.toLowerCase()] = v;
                    });

                    var id = prop.element,
                        x = parseFloat(prop.axis_0), 
                        y = parseFloat(prop.axis_1),
                        point = ol.proj.transform([x, y], dataProj, mapProj),
                        richness = parseFloat(prop.rarew_richness),
                        redundancy = parseFloat(prop.redundancy_all),
                        rarity = parseFloat(prop.rarew_cwe),
                        endemism = parseFloat(prop.endw_cwe);
            
                    features.vars.richness.values.push(richness);
                    features.vars.redundancy.values.push(redundancy);
                    features.vars.rarity.values.push(rarity);
                    features.vars.endemism.values.push(endemism);
            
                    features.points.features.push({
                        type: 'Feature',
                        properties: {
                            'richness': richness,
                            'redundancy': redundancy,
                            'rarity': rarity,
                            'endemism': endemism,
                            'species': prop.species,
                        },
                        id: id,
                        geometry: {
                            type: 'Point',
                            coordinates: point
                        }
                    });
            
                });
                
                $.each(features.vars, function(key, obj){
                    features.vars[key].total = obj.values.length;
                    // reduce range to discrete values
                    
                    var counts = {};
                    for (var i = 0; i < obj.values.length; i++) {
                        counts[obj.values[i]] = 1 + (counts[obj.values[i]] || 0);
                    }
                    
                    //console.log(counts);
                    
                    var max = function(){
                        var m = -Infinity
                        for(var i=0, len=obj.values.length ; i<len; i++) {
                        var a = obj.values[i]
                        if (a > m) {
                            m = a
                        }
                      }
                      return m
                    }
                    var min = 0;

                    if (Object.keys(counts).length == 1){
                       
                        features.vars[key].range = [min, max()];
                        // set up adjacent range count
                        features.vars[key].num = [0, obj.values.length];
                    } else {
                        //var max = obj.values.reduce(function(a, b) { return a >= b ? a : b});
                        //var min = Math.min(...obj.values);
                        //var min = 0;
                        //features.vars[key].range = [];
                        for (i = 0; i <= 10; i++) { 
                            features.vars[key].range.push( ( ((max()-min)/10)*i)+min );
                            // set up adjacent range count arr for counting
                            features.vars[key].num.push(0);
                        }
                        // count and store number of records within each discrete collection
                        $.each(features.vars[key].range, function(i, rangeVal){
                            $.each(obj.values, function(idx, val){
                                if (i == 0){
                                    if (val <= rangeVal)
                                        features.vars[key].num[i]++; 
                                } else {
                                    if (val <= rangeVal && val > features.vars[key].range[i-1]) {
                                       features.vars[key].num[i]++; 
                                    }
                                }
                            });
                        });
                    }  
                    
                    
                    
                });
                return features;
            },
            
            createBiodiverseLayer: function (i, map, grid, overlayGroup, key, variable, colorBank, dataProj, mapProj, gridSize, hoverFunction, drawFunction){

                // Create grid style function
                var gridStyle = function (feature) {
        
                    // get feature coords and transform back into 4326 (solely for simple grid calc)
                    var coordinate = feature.getGeometry().getCoordinates();
                        coordinate = ol.proj.transform(coordinate, mapProj, dataProj);
                
                    // subtract half a point to create first point of polygon
                    var x = coordinate[0] - gridSize / 2,
                        y = coordinate[1] - gridSize / 2,
                        val = Number(feature.getProperties()[key]);
                    
                    var colorIdx;
                    $.each(variable.range, function(i, x){
                        if (val >= x){
                            colorIdx = i;
                        }
                    });
                    
                    var rgb = d3.rgb(colorBank[colorIdx]);
                    var geom = new ol.geom.Polygon([[
                            [x,y], [x, y + gridSize], [x + gridSize, y + gridSize], [x + gridSize, y]
                        ]]);
        
                        geom.transform(dataProj,mapProj);
        
                    return [
                        new ol.style.Style({
                            fill: new ol.style.Fill({
                                color: [rgb.r, rgb.g, rgb.b, 0.8]
                            }),
                            geometry: geom
                        })
                    ];
                };

                //var colorArr = [];
                //$.each(variable.range, function(i){
                //    colorArr.push(colorBank[i]);
                //});
                //colorArr;
                
                var colorScale = d3.scaleThreshold()
                    .domain(variable.range)
                    .range(colorBank);

                var legend = bioviz.biodiverseLegend(grid, key, variable, map, colorScale, colorBank, hoverFunction, drawFunction);
        
                // Create layer from vector grid and style function
                // only make first layer visible
                var gridLayer = new ol.layer.Vector({
                    source: grid,
                    name: key,
                    title: key,
                    type: 'features',
                    legend: legend,
                    selectedCells: [],
                    visible: (i == 0),
                    style: gridStyle
                });
                
                gridLayer.on('change:visible', function(e) {
                    if (! gridLayer.getVisible()){
                        // wipe legend selects
                        d3.selectAll('.d3legend rect.legend-cell')
                        .attr('class', 'legend-cell');
                    }
                }); 
        
                // Add grid layer to map
                overlayGroup.getLayers().push(gridLayer);
        
            },
            
            biodiverseLegend: function (grid, key, variable, map, colorScale, colorBank, hoverFunction, drawFunction) {

                function legendSelectCells (d) {
                    var selected;
                    
                    map.getInteractions().forEach(function (interaction) {
                        if(interaction instanceof ol.interaction.Select) { 
                           selected = interaction.getFeatures(); 
                        }
                    });
                    
                    // trigger ol cell unselect
                    selected.clear();
                        
                    // for some reason this ignores the style attribute, so a classname is used instead
                    // wipe legend selects
                    d3.selectAll('.d3legend rect.legend-cell')
                        .attr('class', 'legend-cell');
                        
                    // display legend cell select
                    d3.select(this)
                        .attr('class', 'legend-cell selected');

                    // find and select all matching cells in map
                    $.each(grid.getFeatures(), function(i, feature){
                        // this is value matching and doesnt make sense, need to eval differently
                        if(parseFloat(feature.getProperties()[key]) > d[0] && parseFloat(feature.getProperties()[key]) <= d[1]){
                            selected.push(feature);
                        }
                    })
        
                }
        
                var legend = document.createElement('div');
                    legend.className = 'd3legend olLegend ol-unselectable ol-control shown';
                var speciesCont = document.createElement('div');
                    speciesCont.className = 'species-and-select';
                var speciesTitle = document.createElement('p');
                    speciesTitle.innerHTML = '<strong>Species in Selection:</strong>';
                    speciesCont.appendChild(speciesTitle);
                var speciesList = document.createElement('ul');
                    speciesList.className = 'cell-classes';
                var noSelection = document.createElement('li');
                    noSelection.innerHTML = 'No selection.';
                    speciesList.appendChild(noSelection);
                    speciesCont.appendChild(speciesList);
                var drawControl = document.createElement('a');
                    drawControl.setAttribute('href', 'javascript:void()');
                    drawControl.className = 'draw-selection btn btn-small btn-info';
                    drawControl.innerHTML = '<i class="fa fa-pencil"></i> Draw a Selection';
                    speciesCont.appendChild(drawControl);
                    
                    
                var width = 160,
                    height = 300,
                    minHeight = 10,
                    max = Math.max(...colorScale.domain()),
                    propHeights = [],
                    propOffsets = [],
                    ticks = [];
        
                $.each(colorScale.domain(), function(i, v){
                    var barHeight = minHeight+( (height-(10*colorScale.domain().length))/100)*((variable.num[i]/variable.total)*100);
                    propHeights.push(barHeight);
                    
                    if (typeof colorScale.domain()[i+1] !== "undefined") {
                        ticks.push(colorScale.domain()[i].toFixed(6)+' - '+colorScale.domain()[i+1].toFixed(6));
                    } else {
                        ticks.push(''+colorScale.domain()[i].toFixed(6)+'');
                    }
                });
               
                $.each(propHeights, function(i,v){
                    if (i != 0) {
                        var offset = propOffsets[i-1] + propHeights[i-1];
                        propOffsets.push(offset);
                    } else {
                        propOffsets.push(0);
                    }
                });
                
                // I really wish I had a better way to do this.
                // Because we're trying to display continuous data that's often discrete
                // we need to accomodate a segment that will never be shown,
                // but impacts the color range d3 applies to the domain.
                // In this instance, the segment is 0-n. Here we add
                // #FFF to the color array to offset the actual data coloring.
                var offsetColor = colorScale.range();
                    offsetColor.unshift('#FFFFFF');
                    offsetColor.pop();
            
                var threshold = d3.scaleThreshold()
                    .domain(colorScale.domain())
                    .range(offsetColor);
        
                var svg = d3.select(legend).append("svg")
                    .attr("width", width)
                    .attr("height", height)
                    .style('padding-left','1px');
                //    .attr("style", 'padding-top:20px');
        
                var g = svg.append("g")
                    .attr("class", "key")
                    .attr("width", (width-40))
                    .attr("transform", "translate(0,0)");
                    
                var y = d3.scaleOrdinal()
                    .domain(ticks)
                    .range(propOffsets);
        
                var yAxis = d3.axisRight(y);
                    //.scale(y)
                    //.orient('right');
                    //.tickValues(ticks);
                    //.tickFormat(d3.format(".8f"));
        
                g.call(yAxis).selectAll("text")
                    .style("font-size", "10")
                    .attr('transform', 'translate(10,6)');
                
                // move a specific tick
                //g.call(yAxis).selectAll("text").last()
                //    .attr('transform','translate(10,'+(height-6)+')');
                
                // add a legend title
                /*g.append("text")
                    .attr("class", "caption")
                    .attr("y", -6)
                    .text("Value of cell point");*/
                
                g.selectAll('rect')
                    .data(colorScale.range().map(function(color) {
                        var d = colorScale.invertExtent(color);
                        if (d[0] == null) d[0] = 0;
                        if (d[1] == null) d[1] = y.domain()[1];
                        return d;
                    }))
                    .enter().append('rect')
                    .on("click", legendSelectCells)
                    .attr('width', 15)
                    .attr("style", 'cursor:pointer')
                    .attr("class", "legend-cell")
                    .attr("y", function(d, i) { 
                        return propOffsets[i];
                    })
                    .attr('height', function(d, i) { 
                        return propHeights[i]; 
                    })
                    .style('fill', function(d, i) { 
                        return threshold.range()[i];
                    });
        
                d3.select(drawControl).on('click', function(){
                    d3.event.preventDefault();

                    map.getInteractions().forEach(function (interaction) {
                        if(interaction instanceof ol.interaction.Select) { 
                            interaction.getFeatures().clear();
                            interaction.setActive(false); 
                        }
                    });

                    // disable hover function whilst drawing
                    // note that 'drawStart' occurs after first click
                    // so this must be disabled immediately prior
                    map.un('pointermove', hoverFunction);
                    map.addInteraction(drawFunction);
                });
        
                /*$.each(classesPresent, function(i, cls){
                    var classItem = document.createElement('li');
                    var classLink = document.createElement('a');
                    classLink.setAttribute('href', "javascript:void(0);");
                    classLink.setAttribute('title', "Select all cells of this class.");
                    classLink.setAttribute('data-cell-class', cls);
                    classLink.innerHTML = cls;
                    classLink.className = "cell-class-link";
        
                    classLink.addEventListener("click", function(event){
                        event.preventDefault();
        
                        var el = $(this);
                        
                        // trigger ol cell unselect
                        selectedGridCells.clear();
        
                        // wipe legend selects
                        d3.selectAll('rect.legend-cell')
                            .style({stroke: "#000", "stroke-width": "0px"});
        
                        // find and select all matching cells in map
                        $.each( grid.getFeatures(), function(i, feature){
                            
                            if(feature.getProperties().species === el.data('cell-class')){
                                selectedGridCells.push(feature);
                            }
                        });
                    });
        
                    classItem.appendChild(classLink);
                    speciesList.appendChild(classItem);
                });*/
                
                legend.appendChild(speciesCont);
                
                return legend;
            },
            
                
            updateClasses: function (classes) {
                var list = $('.d3legend:visible .cell-classes');

                if (classes.getArray().length == 0){
                    list.empty();
                    list.append('<li>No Selection</li>');
                } else {
                    list.empty();
                
                    var classesPresent = []
                    classes.forEach(function(feature){
                        var speciesInCell = feature.getProperties().species.split(',');
                        $.each(speciesInCell, function(i, species){
                            if ($.inArray(species, classesPresent) == -1){
                                classesPresent.push(species);
                            }
                        });
                    });
                    
                    $.each(classesPresent, function(i, species){

                        list.append('<li>'+species+'</li>');
                    });
                }

            },
            
            getVisibleOverlay: function (map, type){
                var layer;
                map.getLayers().forEach(function(lgr){
                    if(lgr instanceof ol.layer.Group){
                        lgr.getLayers().forEach(function(lyr){
                            if (typeof type !== "undefined"){
                                if (lyr.getVisible() && lyr.get('type') == type){
                                    layer = lyr;
                                }
                            } else {
                                if (lyr.getVisible()){
                                    layer = lyr;
                                }
                            }
                            
                        })
                    }
                });
                return layer;
            },
            
            
            // From https://github.com/substack/point-in-polygon, MIT licence
            // Ray-casting algorithm based on
            // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
            pointInPolygon: function (point, vs) {
                var x = point[0], y = point[1];
            
                var inside = false;
                for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
                    var xi = vs[i][0], yi = vs[i][1];
                    var xj = vs[j][0], yj = vs[j][1];
            
                    var intersect = ((yi > y) != (yj > y))
                        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
                    if (intersect) inside = !inside;
                }
            
                return inside;
            }
        
        }
        
        return bioviz;
           
    }
);
