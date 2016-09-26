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

d3.csv('Data/presu_agrupado.csv')
  .row(Presupuesto.processBudgetRow)
  .get(function(error, rows) {

      // finalidad y función para el bubble tree
      // se muestra solo para 2016
      var b = Presupuesto.toBubbleTree(_.filter(rows, function(d) { return d.anio === '2016' }),
                                       'vigente');
      new BubbleTree({
          data: b,
          container: '.bubbletree',
          bubbleType: 'icon',
          bubbleStyles: Presupuesto.BUBBLE_STYLES /*,
          tooltipCallback: function(node) { console.log('tt', node); } */
      });

      // secciones
      var classifications = [
          { classification: 'quien', dimension: 'jur_desc' },
          { classification: 'que', dimension: ['inciso_desc', 'ppal_desc'] },
          { classification: 'paraque', dimension: ['fin_desc', 'fun_desc']  },
          { classification: 'como', dimension: 'ff_desc' },
      ];

      classifications.forEach(function(c) {
          Presupuesto.createTreemapAreaViz(c.classification, c.dimension, rows);
      });
  });

d3.csv('Data/geo.csv')
  .row(function(d) {
      return Object.assign(d,
                           _.fromPairs(
                               _.map(['comuna'].concat(Presupuesto.MEASURES),
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
                      .id("comuna")
                      .format(
                          {
                              locale: 'es_ES',
                              number: formatD3Plus
                          }
                      )
                      .text(function(d) {
                          return 'Comuna ' + d.comuna;
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
