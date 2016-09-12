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

var MEASURES = ['sancion', 'vigente', 'definitivo', 'devengado', 'sancion_adjust', 'vigente_adjust', 'definitivo_adjust', 'devengado_adjust'];

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
                                    locale: 'es_ES'
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
                          //.text(_.isArray(c.dimension) ? _.last(c.dimension) : c.dimension)
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

  });

d3.csv('Data/geo.csv')
  .row(function(d) {
      return Object.assign(d,
                           _.fromPairs(
                               _.map(['COMUNAS','sancion','vigente','definitivo','devengado'],
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
