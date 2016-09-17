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

// para cada nodo, calcular recursivamente la suma
// de su sub-árbol
// También renombra los keys de los objetos, para
// conformar a BubbleTree
function toSumTree(n) {
    if (_.isNumber(n.values)) {
        n.label = n.key;
        n.id = n.label;
        n.amount = n.values / 1000;
        return;
    }

    n.children = n.values;
    delete n.values;
    n.label = n.key;
    n.id = n.label;
    delete n.key;

    n.children.forEach(toSumTree);
    n.amount = (n.amount || 0) + d3.sum(n.children, _.property('amount'));

    // if (n.children.length == 1) delete n.children;

    return n;
}

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
      return Object.assign(d,
                           _.fromPairs(
                               _.map(MEASURES,
                                     function(m) {
                                         return [m, +d[m]];
                                     })));
  })
  .get(function(error, rows) {

      ROWS = rows;

      // finalidad y función para el bubble tree
      var b = btData(_.filter(rows, function(d) { return d.anio === '2016' }),
                     'vigente');

      console.log('tree', b);
      toSumTree(b);

      new BubbleTree({
          data: b,
          container: '.bubbletree',
          bubbleType: 'icon',
          bubbleStyles: {
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
          },
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
                                    locale: 'es_ES'/*,
                                    number: function(num, key) {
                                        console.log(key, num);
                                        return num;
                                    }*/
                                }
                            )
                            .container(contId + ' .viz')
                            .data(rows)
                            .id(c.dimension)
                            .color({
                                scale: CSCALE,
                                value: _.isArray(c.dimension) ? _.first(c.dimension) : c.dimension
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



      /* stacked */
      /*
      var measure = 'sancion';
      var stacked = d3plus.viz()
                     .container("#stacked .viz")
                     .format({locale: 'es_ES'})
                      .data(rows)
                      .type("stacked")
                      .id("jur_desc")
                      .text("jur_desc")
                      .y(measure)
                      .x("anio")
                      .legend({filters: true})
                      .color({
                          scale: CSCALE,
                          value: 'jur_desc'
                      })
                      .draw();

      d3.select('#stacked select[name=dimension-select]')
        .on('change', function() {
          stacked
           .id(this.value)
           .text(this.value)
           .color({ scale: CSCALE, value: this.value })
           .draw();
      });

      d3.selectAll("#stacked input[name=stacked-measure-select]")
        .on("change", function() {
            var measure = this.value;
            if (d3.select('#stacked input[type=checkbox]').node().checked) {
                measure += '_adjust';
            }
            stacked.y(measure).draw();
      });

      d3.select('#stacked input#adjust-toggle')
        .on('change', function() {
            var measure = d3.selectAll("#stacked input[name=stacked-measure-select]:checked")
                            .node()
                            .value;

            if (this.checked) {
                measure += '_adjust';
            }

            stacked.y(measure).draw();
        });
      */
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
