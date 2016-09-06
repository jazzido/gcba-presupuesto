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
                                         return [m, parseFloat(d[m])];
                                     })));
  })
  .get(function(error, rows) {

      /* treemap */
      CF = crossfilter(rows);

      var d_jur = CF.dimension(
          function(d) { return [d.anio, d.jur_desc]; },
          true
      );

      function getAgg(column) {
          return d_jur.group().reduceSum(_.property(column))
                      .all()
                      .map(function(d, i) {
                          return {
                              key: i,
                              anio: d.key[0],
                              jur: d.key[1],
                              value: d.value
                          };
                      });
      };

      d3plus.viz()
            .container('#treemap-jurisdiccion')
            .data(getAgg('sancion'))
            .id('jur')
            .text('jur')
            .type('tree_map')
            .time('anio')
            .size({
                value: 'value',
                threshold: true
            })
            .color({
                scale: CSCALE,
            })
            //.tooltip({html: 'caca'})
            .labels({"align": "left", "valign": "top"})
            .title({total: true, value: 'Presupuesto según Jurisdicciones'})
            .draw();

      /* stacked */
      var visualization = d3plus.viz()
          .container("#stacked-jurisdiccion")
                                .data(getAgg('sancion_adjust'))
                                .type("stacked")
                                .id("jur")
                                .text("jur")
                                .y("value")
                                .x("anio")
                                .legend(true)
                                .color({
                                    scale: CSCALE,
                                })
                                .draw();



  });
