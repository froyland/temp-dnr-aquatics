
require(['dojo/on','esri/core/Accessor',
 'esri/Map',
 'esri/tasks/IdentifyTask', 
 'esri/tasks/support/IdentifyParameters',
  'esri/views/MapView',
  'esri/layers/FeatureLayer',
  'esri/layers/MapImageLayer', 
  'esri/widgets/Legend', 
  'esri/request',
  'dojo/_base/array',
  'esri/geometry/Polygon',
  'esri/renderers/SimpleRenderer',
  'esri/symbols/SimpleFillSymbol',
  'dojo/domReady!'], 
    function(
        on, 
        Accessor, 
        Map, 
        IdentifyTask,
        IdentifyParameters, 
        MapView, 
        FeatureLayer, 
        MapImageLayer, 
        Legend, 
        esriRequest, 
        arrayUtils, 
        Polygon,
        SimpleRenderer, 
        SimpleFillSymbol
    ){
        mapserviceurl = 'https://fortress.wa.gov/dnr/arcgis102/arcgis/rest/services/Aquatics/WADNR_AQR_EXTRNL/MapServer'
        var mapservice = new MapImageLayer({
            url:mapserviceurl,
            title: 'DNR Aquatic Data',
            id: 0,
            sublayers: [
                {
                    id: 6,
                    title: 'State Owned Aquatic Parcel Boundaries',
                    visible: true
                },
                {
                    id: 27,
                    visible: true,
                    title: 'State Owned Aquatic Parcels'
                },
                {
                    id: 9,
                    title: 'Harbor Areas',
                    visible: true
                },
                {
                    id: 17,
                    title: 'Port Management Agreement Areas',
                    visible: true
                },
                {
                    id: 18,
                    title: 'Port Management Area Boundaries',
                    visible: true
                },                
                {
                    id: 28,
                    visible: true,
                    title: 'Undetermined or N/A parcels'
                }
            ]
        });
        // get ids for identifytask
        var ids = [];
        mapservice.sublayers.forEach(function(l){
            ids.push(l.id)           
        })        
        
        var iden;
        var params;
        var layers;

        var map = new Map({
            basemap: 'streets',
            layers: [mapservice]            
        });

        var view = new MapView({
            container: 'viewDiv',
            map: map,
            zoom: 14,
            center: [-123.08188552856144,47.21191789448752]
        })
        
        view.then(function(){
            view.on('click', doIdentify)
            iden = new IdentifyTask(mapserviceurl)
            params = new IdentifyParameters();
            params.layerIds = ids;
            params.width = view.width;
            params.height = view.height;    
            params.tolerance = 3;
        })
        
        // .then(createLayer)
        .otherwise(errback)
        
        view.whenLayerView(mapservice)
            .then(function(layerView){
                var alllayers = layerView.layer.allSublayers;
                var layers = [];
                alllayers.forEach(function(l){
                    if(l.visible){
                        layers.push(l)
                    }
                })
                layers.length > 0 ? populateLayerDropdown(layers) : populateEmptyList
            })


        var layerList = $('#layerList');
        function populateLayerDropdown(layers){
            layers.map(function(l){
                var layerName = l.title;
                var id = l.id
                l.visible === true ? className = '' : className = 'inactive'
                layerList.append('<li id="layers-item' + id + '" style="margin: 10px; color: #fff;"><a class="layername ' + className + '" id="' + id + '" href="#">' + layerName + '</a></li>')                
            });
            $('#toggle-btn').removeClass('disabled')
        }

        layerList.click(function(evt){
            var layer = mapservice.allSublayers[evt.target.id]
            if(layer !== undefined){
                layer.visible === true ? (layer.visible = false, $(evt.target).addClass('inactive')) : (layer.visible = true,$(evt.target).removeClass('inactive'))
            }
            
        });

        function populateEmptyList(){
            layerList.append('<li>No Layers Loaded</li>')
        }

        function errback(error){
            console.error('error: ',error)
        }

        function doIdentify(evt){
            params.geometry = evt.mapPoint;
            params.mapExtent = view.extent;
            iden.execute(params)
                .then(function(response){                    
                    var results = response.results;   
                    return results.map(
                        function(results){
                            feature = results.feature;                            
                            var layername = results.layerName;
                            feature.popupTemplate = {
                                title: layername,
                                content: '{*}'
                            }
                            return feature
                        })
                }).then(showPopup)
        
            function showPopup(response){
                if(response.length > 0){
                    view.popup.open({
                    features: response,
                    location: evt.mapPoint
                })
                }
                
            }    
        }        
        
        $("#toggle-btn-leg").click(function(){
            $(".leg").toggle();
            $("#toggle-btn-leg").toggleClass('disabled');
            $("#toggle-btn-leg").html() === 'Show Legend' ? $("#toggle-btn-leg").html('Hide Legend') : $("#toggle-btn-leg").html('Show Legend')   
        })
        
});