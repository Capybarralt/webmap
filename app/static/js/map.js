// Для таблицы индексы всех объектов.
l = '{{ list }}'
l = l.substring(1, (l.length-1));
l = l.replace(/ /gi, '')
l = l.split(',')
// Получаем объекты из базы данных.
d = '{{d}}'
d = d.replace(/&#34;/gi, '"')
str = `{"type": "FeatureCollection", "features": ${d} }`
geojsonObject = JSON.parse(str)

// Нужно заменить на максимальный индекс объекта из бд.
var ovt = 0;

// Выбор элемента по имени из таблицы.
function selectFromTable(name) {
    var features = source.getFeatures();

    var property = 'name';
    var found;
    for (var i = 0; i < features.length; i++) {
        if (features[i].getProperties().name == name) {
            found = features[i];
            break;
        }
    }
    var writer = new ol.format.GeoJSON();
    var geojsonStr = writer.writeFeatures([found]);
    document.getElementById('new_coordinates').value = null;
    document.getElementById('old_coordinates').value = geojsonStr;

    map.addInteraction(select_table)
    select_table.getFeatures().clear()
    select_table.getFeatures().push(found)
};

// Формирование списка для заполнеия таблицы. Возвращает список.
function listForTable(geo, indexes) {
    var result = []
    indexes.map(function(index, value) {
        var coordinates = geo['features'][Number(value)]['geometry']['coordinates']
        var type = geo['features'][Number(value)]['geometry']['type']
        var name = geo['features'][Number(value)]['properties']['name']
        result.push([name, listDms(coordinates, type)])
    })
    return result
}

// Создание и заполнеие полей таблицы.
function fillTable(table, arr) {
    var tr = document.createElement('tr')
    var td = document.createElement('td');
    td.innerHTML = 'Название';
    tr.appendChild(td);
    var td = document.createElement('td');
    td.innerHTML = 'Положение';
    tr.appendChild(td);
    tr.align = 'center'

    table.appendChild(tr);

    for (var i = 0; i < arr.length; i++) {
        var tr = document.createElement('tr');
        for (var j = 0; j < arr[i].length; j++) {
            var td = document.createElement('td');
            td.innerHTML = arr[i][j];
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }
}

// Перевод пары координат в формат DMS. Возвращает строку.
function ddToDms(c) {
    lonLat = ol.proj.toLonLat(c)
    var result = []
    for (var j=0; j<lonLat.length; j++) {
        d = lonLat[j]
        ddd = Math.abs(d)
        dd = Math.trunc(ddd)
        mm = Math.trunc((ddd-dd)*60)
        ss = Math.trunc(((ddd-dd)*60-mm)*60)
        if (d > 0) {
            if (j == 0) {
                str = `в. д. ${dd}°${mm}'${ss}"`
            } else {
                str = `с. ш. ${dd}°${mm}'${ss}"`
            }
        } else {
            if (j == 0) {
                str = `з. д. ${dd}°${mm}'${ss}"`
            } else {
                str = `ю. ш. ${dd}°${mm}'${ss}"`
            }
        }
        result.push(str)
    }
    return `[${result[0]}; ${result[1]}]`
}

// В зависимости от типа геометрии объекта по разному оброботываются координаты.
function listDms(c, t) {
    var result = []
    switch (t) {
        case 'Point': {
            result.push(ddToDms(c))
            break;
        }
        case 'LineString': {
            for (var i=0; i<c.length; i++) {
                result.push(ddToDms(c[i]))
            }
            break;
        }
        case 'Polygon': {
            c = c[0]
            for (var i=0; i<c.length; i++) {
                result.push(ddToDms(c[i]))
            }
            break;
        }
        default:
    }
    return result
}

// В зависимости от класса объекта выбирается стиль отрисовки на карте.
function checkStyle(name) {
    var text = new ol.style.Text({
            text: name,
            scale: 1.3,
            fill: new ol.style.Fill({
              color: '#000000'
            }),
            offsetY: -15
            // stroke: new ol.style.Stroke({
            //   color: '#FFFF99',
            //   width: 3.5
            // })
          })
    var pointStyle = {
        'Первый': new ol.style.Style({
          image: new ol.style.Circle({
                radius: 7,
                fill: new ol.style.Fill({color: 'black'}),
                stroke: new ol.style.Stroke({
                      color: [255,0,0], width: 2
                }),
            }),
            text: text,
        }),
        'Второй': new ol.style.Style({
          image: new ol.style.Circle({
                radius: 7,
                fill: new ol.style.Fill({color: 'black'}),
                stroke: new ol.style.Stroke({
                      color: [0,255,0], width: 2
                }),
            }),
            text: text,

        }),
        'Третий': new ol.style.Style({
          image: new ol.style.Circle({
                radius: 7,
                fill: new ol.style.Fill({color: 'black'}),
                stroke: new ol.style.Stroke({
                      color: [0,0,255], width: 2
                })
            }),
            text: text,
        }),
        'Base': new ol.style.Style({
          image: new ol.style.Circle({
                radius: 7,
                fill: new ol.style.Fill({color: 'white'}),
                stroke: new ol.style.Stroke({
                      color: [0,0,0], width: 2
                })
              })
        }),
    }
    return pointStyle
}
var styleFunction = function (feature) {
    var style = checkStyle(feature.getProperties().name)
    console.log(feature.getId())
    if (feature.getProperties().class == undefined) {
        return style['Base']
    }

    return style[feature.getProperties().class];
};


// Initialization of HTML elements
var mode_drawing = document.getElementById('type');
var mode = document.getElementById('mode');
var editing_form = document.getElementById('editing_form')
var test = document.getElementById('test')

// TODO: Source for vector layer. It's where the features are loaded. Reading geojson/
var source = new ol.source.Vector({
    format: new ol.format.GeoJSON(),
    features: new ol.format.GeoJSON().readFeatures(geojsonObject),

    //url: 'test.json'
});
var vlayer = new ol.layer.Vector({
    source: source,
    style: styleFunction,
})
// TODO: Initialization of Map. Added two layers.
var map = new ol.Map({
    target: 'map',
    layers: [
        new ol.layer.Tile({
            source: new ol.source.OSM(),
        }),
        vlayer,
    ],
    view: new ol.View({
        center: [-11000000, 4600000],
        zoom: 2,
    }),
});



// TODO: Initialization of interaction.
var select = new ol.interaction.Select();
var select_draw = new ol.interaction.Select();
var select_remov = new ol.interaction.Select();
var select_table = new ol.interaction.Select();
var modify = new ol.interaction.Modify({
    features: select.getFeatures(),
});
var draw = new ol.interaction.Draw({
    type: mode_drawing.value,
    source: source,
});
var snap = new ol.interaction.Snap({
    source: source,
});


// TODO:Removing interactions function
function removeInteractions() {
    select_table.getFeatures().clear()
    select.getFeatures().clear()
    select_draw.getFeatures().clear()
    select_remov.getFeatures().clear()

    map.removeInteraction(modify);
    map.removeInteraction(select);
    map.removeInteraction(draw);
    map.removeInteraction(select);
    map.removeInteraction(select_draw);
    map.removeInteraction(select_remov);
    map.removeInteraction(select_table);
}
// TODO: Mode switching function
function onChange() {
    removeInteractions();
    switch (mode.value) {
        // TODO: Mode switching function: DRAW
        case 'draw': {
            mode_drawing.hidden = false
            draw = new ol.interaction.Draw({
                type: mode_drawing.value,
                source: source,
            })
            map.addInteraction(draw);
            map.addInteraction(select_draw);
            map.addInteraction(snap);
            // WHY: working only here?
            draw.on('drawend', function(evt) {
                evt.feature.setId(ovt);
                ovt = ovt + 1;
                var writer = new ol.format.GeoJSON();
                var geojsonStr = writer.writeFeatures([evt.feature]);
                //console.log(geojsonStr);
                //editing_form.hidden = false;
                document.getElementById('new_coordinates').value = geojsonStr;
                document.getElementById('old_coordinates').value = null;
            });
            break;
        }
        // TODO: Mode switching function: MODIFY
        case 'modify': {
            mode_drawing.hidden = true;
            map.addInteraction(select);
            map.addInteraction(modify);
            map.addInteraction(snap);

            select.on('select', function (evt){
                select.getFeatures().forEach(function(feature){
                    var writer = new ol.format.GeoJSON();
                    var geojsonStr = writer.writeFeatures([feature]);
                    //console.log(geojsonStr);
                    document.getElementById('new_coordinates').value = geojsonStr;
                    document.getElementById('old_coordinates').value = geojsonStr;
                })
            })

            modify.on('modifyend', function(evt) {
                //console.log(evt.features.item(0).getGeometry().getType());
                var writer = new ol.format.GeoJSON();
                var geojsonStr = writer.writeFeatures([evt.features.item(0)]);
                //console.log(geojsonStr);
                document.getElementById('new_coordinates').value = geojsonStr;
                //document.getElementById('old_coordinates').value = geojsonStr;
            })
            break;
        }
        // TODO: Mode switching function: REMOVE
        case 'remove': {
            mode_drawing.hidden = true
            map.addInteraction(select_remov);
            select_remov.on('select', function (){
                select_remov.getFeatures().forEach(function(feature){
                    source.removeFeature(feature);
                })
            })

        }
        case 'block': {
            mode_drawing.hidden = true
            var tds = document.querySelectorAll('td');
            for (var i = 0; i < tds.length; i++) {
                tds[i].addEventListener('click', function() {
                    var name = this.innerHTML
                    selectFromTable(name)
                })
            }
        }

        default: {
            // pass
        }
    }
}

// TODO: Enabling functions and listeners
mode.addEventListener('change', onChange);
mode_drawing.addEventListener('change', onChange)
// qwerty.onclick = function() {
//     geo = {
//       'type': 'Feature',
//       'geometry': {
//         'type': 'LineString',
//         'coordinates': [
//           [4e6, -2e6],
//           [8e6, 2e6] ],
//       },
//     }
    // source.clear()
//     var features = new ol.format.GeoJSON().readFeatures(geo)
//     source.addFeatures(features);
// }

var table = document.querySelector('#table');

var test = listForTable(geojsonObject, l)
var arr = test;
//console.log(arr)
fillTable(table, arr);

editing_form.hidden = false;

onChange();
