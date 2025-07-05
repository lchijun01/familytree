const data = {
  name: "Grandparent",
  isDeceased: true,
  children: [
    {
      name: "Parent",
      isDeceased: false,
      children: [
        { name: "Child 1", isDeceased: false },
        { name: "Child 2", isDeceased: false }
      ]
    },
    {
      name: "Uncle",
      isDeceased: true,
      children: [
        { name: "Cousin", isDeceased: false }
      ]
    }
  ]
};

const width = 600;
const dx = 10;
const dy = width / 4;
const tree = d3.tree().nodeSize([dx, dy]);
const diagonal = d3.linkHorizontal().x(d => d.y).y(d => d.x);

const root = d3.hierarchy(data);
root.x0 = dy / 2;
root.y0 = 0;
root.descendants().forEach((d, i) => {
  d.id = i;
  d._children = d.children;
});

const svg = d3.select("#tree").append("svg")
    .attr("viewBox", [-dy / 3, -dx, width, dx * 10])
    .style("font", "10px sans-serif")
    .style("user-select", "none");

const gLink = svg.append("g")
    .attr("class", "links")
    .attr("fill", "none")
    .attr("stroke", "#555")
    .attr("stroke-opacity", 0.4)
    .attr("stroke-width", 1.5);

const gNode = svg.append("g")
    .attr("class", "nodes")
    .attr("cursor", "pointer")
    .attr("pointer-events", "all");

function update(source) {
  const nodes = root.descendants().reverse();
  const links = root.links();

  tree(root);

  let left = root;
  let right = root;
  root.eachBefore(node => {
    if (node.x < left.x) left = node;
    if (node.x > right.x) right = node;
  });

  const height = right.x - left.x + dx * 2;

  const transition = svg.transition()
      .duration(250)
      .attr("viewBox", [-dy / 3, left.x - dx, width, height]);

  const node = gNode.selectAll("g")
    .data(nodes, d => d.id);

  const nodeEnter = node.enter().append("g")
      .attr("transform", d => `translate(${source.y0},${source.x0})`)
      .on("click", (event, d) => {
          d.children = d.children ? null : d._children;
          update(d);
      });

  nodeEnter.append("circle")
      .attr("r", 4)
      .attr("fill", d => d.data.isDeceased ? "#999" : "#fff")
      .attr("stroke", "#555");

  nodeEnter.append("text")
      .attr("dy", "0.31em")
      .attr("x", d => d._children ? -6 : 6)
      .attr("text-anchor", d => d._children ? "end" : "start")
      .text(d => d.data.name)
      .clone(true).lower()
      .attr("stroke", "white");

  node.merge(nodeEnter).transition(transition)
      .attr("transform", d => `translate(${d.y},${d.x})`);

  node.merge(nodeEnter).select("circle")
      .attr("fill", d => d.data.isDeceased ? "#999" : "#fff");

  node.merge(nodeEnter).select("text")
      .attr("x", d => d._children ? -6 : 6)
      .attr("text-anchor", d => d._children ? "end" : "start");

  node.exit().transition(transition).remove()
      .attr("transform", d => `translate(${source.y},${source.x})`)
      .select("circle")
      .attr("r", 0);

  const link = gLink.selectAll("path")
    .data(links, d => d.target.id);

  const linkEnter = link.enter().append("path")
      .attr("d", d => {
          const o = {x: source.x0, y: source.y0};
          return diagonal({source: o, target: o});
      });

  link.merge(linkEnter).transition(transition)
      .attr("d", diagonal);

  link.exit().transition(transition).remove()
      .attr("d", d => {
          const o = {x: source.x, y: source.y};
          return diagonal({source: o, target: o});
      });

  root.eachBefore(d => {
      d.x0 = d.x;
      d.y0 = d.y;
  });
}

update(root);
