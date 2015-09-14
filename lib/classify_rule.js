

function classifyRule(rule) {
  if (rule.type === 'atrule')
    return { include: rule };

  const selectors = classifySelectors(rule);
  const include   = [];
  const inline    = [];

}


function classifySelector(selector) {
  const specificity = [0, 0, 0];

  // See http://www.w3.org/TR/selectors4/#specificity
  selectorParser(function(nodes) {
    nodes.eachInside(function(node) {

    });
  }).process(selector);
}

