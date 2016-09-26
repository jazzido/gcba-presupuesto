$(function() {
    // Smooth scrolling
    $('a[href*="#"]:not([href="#"])').click(function() {
        if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname) {
            var target = $(this.hash);
            target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
            if (target.length) {
                $('html, body').animate({
                    scrollTop: target.offset().top
                }, 1000);
                return false;
            }
        }
    });

    // Activate popovers
    $('[data-toggle="popover"]').popover({ trigger: "hover" });
});

var MEASURES = ['vigente', 'devengado'];

var CSCALE = ['#DF4944',
              '#EE9224',
              '#FAD448',
              '#1FB7DC',
              '#0F74C7',
              '#2AB186',
              '#88B84D',
              '#CBD640',
              '#2F3E4B',
              '#8A55A7',
              '#F04691'];

// reemplazos para valores de algunas columnas.
// Lo hacemos acá porque queremos minimizar la cantidad
// de transformaciones que le hacemos a los datos
// que salen de BAData
var REPLACEMENTS = {
    'fun_desc': {
        'Servicios Urbanos': 'Mantenimiento Urbano',
        'Seguridad Interior': 'Seguridad'
    },
    'inciso_desc': {
        'Servicio De La Deuda Y Disminución De Otros Pasivos': 'Intereses de la Deuda Pública'
    },
    'ppal_desc': {
        'Activos Intangibles': 'Software y otros Activos Intangibles'
    },
    'ff_desc': {
        'Tesoro De La Ciudad': 'Rentas Generales'
    }
};

var BUBBLE_STYLES = {
    id: {
        'Total': {
            color: '#1f77b4',
            icon: 'icons/bubble/total.svg'
        },
        'Deuda Pública  Intereses Y Gastos': {
            color: '#0f74c7'
        },
        'Servicios Sociales': {
            icon: 'icons/bubble/servicios_sociales.svg',
            color: '#1fb7dc'
        },
        'Servicios Económicos': {
            icon: 'icons/bubble/servicios_economicos.svg',
            color: '#fad448'
        },
        'Administración Gubernamental': {
            icon: 'icons/bubble/administracion_gubernamental.svg',
            color: '#df4944'
        },
        'Servicios De Seguridad': {
            icon: 'icons/bubble/servicios_de_seguridad.svg',
            color: '#ee9224'
        },
        'Educación': {
            icon: 'icons/bubble/educacion.svg'
        },
        'Cultura': {
            icon: 'icons/bubble/cultura.svg'
        },
        'Salud': {
            icon: 'icons/bubble/salud.svg'
        },
        'Vivienda': {
            icon: 'icons/bubble/vivienda.svg'
        },
        'Judicial': {
            icon: 'icons/bubble/judicial.svg'
        },
        'Dirección Ejecutiva': {
            icon: 'icons/bubble/direccion_ejecutiva.svg'
        },
        'Administración Fiscal': {
            icon: 'icons/bubble/administracion_fiscal.svg'
        },
        'Transporte': {
            icon: 'icons/bubble/transporte.svg'
        },
        'Servicios Urbanos': {
            icon: 'icons/bubble/servicios_urbanos.svg'
        },
        'Ecología': {
            icon: 'icons/bubble/ecologia.svg'
        },
        'Vivienda': {
            icon: 'icons/bubble/vivienda.svg'
        }
    }
};

var localeES = d3.locale({
    "decimal": ",",
    "thousands": ".",
    "grouping": [3],
    "currency": ["", " €"],
    "dateTime": "%A, %e de %B de %Y, %X",
    "date": "%d/%m/%Y",
    "time": "%H:%M:%S",
    "periods": ["AM", "PM"],
    "days": ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
    "shortDays": ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"],
    "months": ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
    "shortMonths": ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
});

// formateo de números
var d3Format = d3.format('.3s'),
    suffixMap = {
        'M': 'M',
        'G': 'MM',
        'T': 'MMM'
    };

function formatNumber(num) {
    var s = d3Format(num),
        suffix = s[s.length - 1],
        abbN = s.slice(0, s.length - 1);

    if (suffixMap.hasOwnProperty(suffix)) {
        abbN += suffixMap[suffix];
    }

    return abbN;
}

function formatD3Plus(n, o) {
    var rv;
    if (o.key === 'share') {
        if (n === 0)
            rv = 0
        else if (n >= 100)
            rv = localeES.numberFormat(",f")(n);
        else if (n > 99)
            rv = localeES.numberFormat(".3g")(n);
        else
            rv = localeES.numberFormat(".2g")(n);
        rv += "%"
    }
    else {
        rv = formatNumber(n);
    }
    return rv;
}

// patcheamos la función de formateo de BubbleTree
BubbleTree.Utils.formatNumber = formatNumber;

// para cada nodo, calcular recursivamente la suma
// de su sub-árbol
// También renombra los keys de los objetos, para
// conformar a BubbleTree
function toSumTree(n) {
    if (_.isNumber(n.values)) {
        n.label = n.key;
        n.id = n.label;
        n.amount = n.values;// / 1000;
        return;
    }

    n.children = n.values;
    delete n.values;
    n.label = n.key;
    n.id = n.label;
    delete n.key;

    n.children.forEach(toSumTree);
    n.amount = (n.amount || 0) + d3.sum(n.children, _.property('amount'));

    return n;
}

// convertir los datos a una estructura jerárquica
// para el bubble tree
function btData(rows, measure) {
    var total = d3.nest()
                  .rollup(function(leaves) { return d3.sum(leaves, _.property(measure)); })
                  .entries(rows);

    var bub = d3.nest()
                .key(_.property('fin_desc'))
                .key(_.property('fun_desc'))
                .rollup(
                    function(leaves) {
                        return d3.sum(leaves,
                                      _.property(measure));
                    })
                .entries(rows);
    return {
        key: 'Total',
        values: bub
    }
}


d3.csv('Data/presu_agrupado.csv')
  .row(function(d) {

      // aplicar reemplazos
      Object.keys(REPLACEMENTS).forEach(function(k) {
          if (d[k] in REPLACEMENTS[k]) {
              d[k] = REPLACEMENTS[k][d[k]];
          }
      });

      // convertir las measures a números
      var o = Object.assign(d,
                            _.fromPairs(
                                _.map(MEASURES,
                                      function(m) {
                                          return [m, +d[m]];
                                      })));
      return o;
  })
  .get(function(error, rows) {

      // finalidad y función para el bubble tree
      // se muestra solo para 2016
      var b = btData(_.filter(rows, function(d) { return d.anio === '2016' }),
                     'vigente');
      toSumTree(b);

      new BubbleTree({
          data: b,
          container: '.bubbletree',
          bubbleType: 'icon',
          bubbleStyles: BUBBLE_STYLES,
          tooltipCallback: function(node) { console.log('tt', node); }
      });

          // secciones
      var classifications = [
          { classification: 'quien', dimension: 'jur_desc' },
          { classification: 'que', dimension: ['inciso_desc', 'ppal_desc'] },
          { classification: 'paraque', dimension: ['fin_desc', 'fun_desc']  },
          { classification: 'como', dimension: 'ff_desc' },
      ];

      classifications.forEach(function(c) {
          var contId = '#' + c.classification;
          var selectedChartType = d3.selectAll(contId + " input[name*=chart][type=radio]:checked").node().value;
          var selectedMeasure = d3.selectAll(contId + " input[name*=measure][type=radio]:checked").node().value;

          var chart = d3plus.viz()
                            .format(
                                {
                                    locale: 'es_ES',
                                    number: formatD3Plus
                                }
                            )
                            .container(contId + ' .viz')
                            .data(rows)
                            .id(c.dimension)
                            .color({
                                scale: CSCALE,
                                value: _.isArray(c.dimension) ? c.dimension[0] : c.dimension
                            })
                            .labels({"align": "left", "valign": "top"})
                            .font({
                                family: 'Helvetica, Arial, sans-serif',
                                weight: '100'
                            });

          function updateChart() {
              switch (selectedChartType) {
                  case 'tree_map':
                      chart
                            .type('tree_map')
                            .time({
                                value: 'anio',
                                solo: ['2016'], // TODO: Calculate this
                                fixed: false
                            })
                            .timeline(true)
                            .size({
                                value: selectedMeasure,
                                threshold: false
                            })
                            .legend({filters: true})
                            .depth(_.isArray(c.dimension) ? 1 : 0)
                            .title({total: true})
                            .draw();
                      break;
                  case 'stacked':
                      chart
                            .type('stacked')
                            .y(selectedMeasure)
                            .x('anio')
                            .time({value: 'anio', solo: []})
                            .timeline(false)
                            .depth(0)
                            .title({total: false})
                            .draw();
                      break;
              }
          }

          updateChart();

          d3.selectAll(contId + " input[name*=chart][type=radio]")
            .on("change", function() {
                selectedChartType = this.value;
                updateChart();
            });

          d3.selectAll(contId + " input[name*=measure][type=radio]")
            .on("change", function() {
                selectedMeasure = this.value;
                updateChart();
            });
      });
  });

d3.csv('Data/geo.csv')
  .row(function(d) {
      return Object.assign(d,
                           _.fromPairs(
                               _.map(['COMUNAS'].concat(MEASURES),
                                     function(m) {
                                         return [m, +d[m]];
                                     })));
  })
  .get(function(error, rows) {

      var selectedMeasure = 'vigente';

      var map = d3plus.viz()
                      .container("#donde .viz")
                      .data(rows)
                      .coords('Data/comunas_topo.json')
                      .type("geo_map")
                      .id("COMUNAS")
                      .format(
                          {
                              locale: 'es_ES',
                              number: formatD3Plus
                          }
                      )
                      .text(function(d) {
                          return 'Comuna ' + d.COMUNAS;
                      })
                      .time({
                          value: 'anio',
                          solo: ['2016'], // TODO: Calculate this
                          fixed: false
                      })
                      .color(selectedMeasure)
                      .font({
                          family: 'Helvetica, Arial, sans-serif',
                          weight: '100'
                      })
                      .draw();

      d3.selectAll("#donde input[name*=measure][type=radio]")
        .on("change", function() {
            selectedMeasure = this.value;
            map.color(selectedMeasure)
               .draw();
        });
  });
