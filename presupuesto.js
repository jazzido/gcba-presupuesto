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


var canvas = document.getElementById("icon-canvas");
var ctx = canvas.getContext("2d");
ctx.font = "30px Arial";
ctx.fillStyle = "white";
ctx.textAlign = "center";

function getIconDataURL(text) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillText(text.slice(0,2).toUpperCase(),
                 canvas.width/2,
                 canvas.height/2);
    return canvas.toDataURL();
}



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

      var classifications = [
          { classification: 'quien', dimension: 'jur_desc' },
          { classification: 'que', dimension: ['fin_desc', 'fun_desc'] },
          { classification: 'paraque', dimension: ['inciso_desc', 'ppal_desc'] },
          { classification: 'como', dimension: 'ff_desc' },
      ];

      classifications.forEach(function(c) {
          var contId = '#' + c.classification;
          var selectedChartType = d3.selectAll(contId + " input[name*=chart][type=radio]:checked").node().value;
          var selectedMeasure = d3.selectAll(contId + " input[name*=measure][type=radio]:checked").node().value;

          console.log(selectedChartType, selectedMeasure);
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
                            .title({total: true});

          function updateChart() {
              switch (selectedChartType) {
                  case 'tree_map':
                      chart
                            .type('tree_map')
                          //.text(_.isArray(c.dimension) ? _.last(c.dimension) : c.dimension)
                            .time({
                                value: 'anio',
                                solo: ['2016'] // TODO: Calculate this
                            })
                            .timeline(true)
                            .size({
                                value: selectedMeasure,
                                threshold: false
                            })
                            .legend({filters: true})
                            .depth(_.isArray(c.dimension) ? 1 : 0)
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

      /* sankey */
      /*
      CF = crossfilter(rows);
      var d_inciso_ff = CF.dimension(
          function(d) { return [d.anio, d.inciso_desc, d.ff_desc]; },
          true
      );

      var sankey_data = d_inciso_ff
                      .group()
                      .reduceSum(_.property('sancion_adjust'))
                      .all()
                      .map(function(d, i) {
                          return {
                              key: i,
                              anio: d.key[0],
                              source: d.key[1],
                              target: d.key[2],
                              value: d.value
                          };
                      })
                      .filter(function(d) { return d.anio === '2015'; });

      var nodes = _.map(
          _.uniq(
              _.flatMap(sankey_data,
                        function(d) { return [d.source, d.target]; })
          ),
          function(d) { return { id: d }; }
      );

      var edges = sankey_data.map(function(e) {
          return {
              value: e.value,
              source: nodes.find(function(n) {
                  return n.id == e.source;
              }),
              target: nodes.find(function(n) {
                  return n.id == e.target;
              }),
          }
      }).filter(function(d) { return d.value > 0; });

      console.log(nodes);
      console.log(edges);

      d3plus.viz()
            .container("#sankey .viz")
            .type("sankey")
            .id("id")
            .nodes(
                nodes
            )
            .edges({
                "strength": "value",
                "value": edges
            })
            //.time('anio')
            //.size(100)
            .draw();

      */
  });
