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

      d3plus.viz()
            .format({locale: 'es_ES'})
            .container('#treemap-jurisdiccion')
            .data(rows)
            .id('jur_desc')
            .text('jur_desc')
            .type('tree_map')
            .time('anio')
            .size({
                value: 'sancion',
                threshold: true
            })
            .color({
                scale: CSCALE,
            })
            .ui([
                {
                    "method": "size",
                    "value": [ "sancion" , "sancion_adjust", "vigente", "vigente_adjust", "definitivo", "definitivo_adjust", "devengado", "devengado_adjust"]
                }]
            )
            .labels({"align": "left", "valign": "top"})
            .title({total: true, value: 'Presupuesto según Jurisdicciones'})
            .aggs({sancion: 'sum'})
            .draw();

      /* stacked */
      var measure = 'sancion';
      var stacked = d3plus.viz()
                      .container("#stacked-jurisdiccion")
                      .format({locale: 'es_ES'})
                      .data(rows)
                      .type("stacked")
                      .id("jur_desc")
                      .text("jur_desc")
                      .y(measure)
                      .x("anio")
                      .legend(true)
                      .color({
                          scale: CSCALE,
                      })
                          .draw();

      d3.selectAll("input[name=measure-select]").on("change", function() {
          measure = this.value;
          if (d3.select('input#adjust-toggle').node().checked) {
              measure += '_adjust';
          }
          stacked.y(measure).draw();
      });

      d3.select('input#adjust-toggle').on('change', function() {
          measure = d3.selectAll("input[name=measure-select]:checked").node().value;
          if (this.checked) {
              measure += '_adjust';
          }
          stacked.y(measure).draw();
      })

      /* sankey */

      var d_inciso_ff = CF.dimension(
          function(d) { return [/*d.anio, */d.inciso_desc, d.ff_desc]; },
          true
      );

      var sankey_data = d_inciso_ff
                      .group()
                      .reduceSum(_.property('sancion_adjust'))
                      .all()
                      .map(function(d, i) {
                          return {
                              key: i,
                              //                              anio: d.key[0],
                              source: d.key[0],
                              target: d.key[1],
                              value: d.value
                          };
                      });

      d3plus.viz()
            .container("#sankey-jurisdiccion-ff")
            .id("id")
            .nodes(
                _.map(
                    _.uniq(
                        _.flatMap(sankey_data,
                                  function(d) { return [d.jur, d.ff]; })
                    ),
                    function(d) { return { id: d }; }
                )
            )
            .edges({
                "strength": "value",
                "value": sankey_data
            })
            .time('anio')
            .size(100)
            .type("sankey")
            .draw();





  });
