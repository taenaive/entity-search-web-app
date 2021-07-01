import * as d3 from 'd3';
import { NodeInfo, LinkInfo } from '../graph-types';

const ICONS = {
    business: {
      shape: "M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z",
      enclosed: "M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"
    }, // TODO replace the business .png with SVG
    userFemale: {
      // The outline of the face and shoulders for the female icon
      shape: "M687.543 599.771c-29.257 73.143-95.086 124.343-175.543 124.343s-146.286-51.2-175.543-117.029c-146.286 36.571-256 146.286-256 277.943v95.086h870.4v-95.086c0-138.971-117.029-248.686-263.314-285.257zM768 592.457c0 0-51.2-299.886-65.829-365.714-14.629-87.771-95.086-160.914-197.486-160.914-95.086 0-182.857 65.829-197.486 160.914-7.314 51.2-73.143 329.143-80.457 343.771 0 0 7.314 14.629 95.086-14.629 7.314 0 43.886-14.629 51.2-14.629 36.571 51.2 80.457 80.457 138.971 80.457 51.2 0 102.4-29.257 138.971-87.771 29.257 14.629 14.629 36.571 117.029 58.514zM512 599.771c-43.886 0-80.457-21.943-109.714-65.829v0c0 0-7.314-7.314-7.314-7.314s0 0 0 0-7.314-7.314-7.314-14.629c0 0 0 0 0 0 0-7.314-7.314-7.314-7.314-14.629 0 0 0 0 0 0 0-7.314-7.314-7.314-7.314-14.629 0 0 0 0 0 0-7.314 0-7.314-7.314-7.314-7.314s0 0 0 0c0-7.314 0-7.314-7.314-14.629 0 0 0 0 0 0 0-7.314 0-7.314-7.314-14.629 0 0 0 0 0 0 0-7.314 0-7.314 0-14.629 0 0 0-7.314-7.314-7.314-7.314-7.314-14.629-21.943-14.629-43.886s7.314-43.886 14.629-51.2c0 0 7.314 0 7.314-7.314 14.629 14.629 7.314-7.314 7.314-21.943 0-43.886 0-51.2 0-58.514 29.257-21.943 80.457-51.2 117.029-51.2 0 0 0 0 0 0 43.886 0 51.2 14.629 73.143 36.571 14.629 29.257 43.886 51.2 109.714 51.2 0 0 0 0 7.314 0 0 0 0 14.629 0 29.257s0 43.886 7.314 14.629c0 0 0 0 7.314 7.314s14.629 21.943 14.629 51.2c0 21.943-7.314 36.571-21.943 43.886 0 0-7.314 7.314-7.314 7.314 0 7.314 0 7.314 0 14.629 0 0 0 0 0 0-7.314 7.314-7.314 7.314-7.314 14.629 0 0 0 0 0 0 0 7.314 0 7.314-7.314 14.629 0 0 0 0 0 0 0 7.314 0 7.314-7.314 14.629 0 0 0 0 0 0 0 7.314 0 7.314-7.314 14.629 0 0 0 0 0 0s-0 7.314-0 7.314c0 0 0 0 0 0 0 7.314-7.314 7.314-7.314 14.629 0 0 0 0 0 0s-7.314 7.314-7.314 7.314v0c-29.257 43.886-73.143 65.829-109.714 65.829z",
      // The space enclosed by the face of the female icon
      enclosed: "M512 599.771c-43.886 0-80.457-21.943-109.714-65.829v0c0 0-7.314-7.314-7.314-7.314s0 0 0 0-7.314-7.314-7.314-14.629c0 0 0 0 0 0 0-7.314-7.314-7.314-7.314-14.629 0 0 0 0 0 0 0-7.314-7.314-7.314-7.314-14.629 0 0 0 0 0 0-7.314 0-7.314-7.314-7.314-7.314s0 0 0 0c0-7.314 0-7.314-7.314-14.629 0 0 0 0 0 0 0-7.314 0-7.314-7.314-14.629 0 0 0 0 0 0 0-7.314 0-7.314 0-14.629 0 0 0-7.314-7.314-7.314-7.314-7.314-14.629-21.943-14.629-43.886s7.314-43.886 14.629-51.2c0 0 7.314 0 7.314-7.314 14.629 14.629 7.314-7.314 7.314-21.943 0-43.886 0-51.2 0-58.514 29.257-21.943 80.457-51.2 117.029-51.2 0 0 0 0 0 0 43.886 0 51.2 14.629 73.143 36.571 14.629 29.257 43.886 51.2 109.714 51.2 0 0 0 0 7.314 0 0 0 0 14.629 0 29.257s0 43.886 7.314 14.629c0 0 0 0 7.314 7.314s14.629 21.943 14.629 51.2c0 21.943-7.314 36.571-21.943 43.886 0 0-7.314 7.314-7.314 7.314 0 7.314 0 7.314 0 14.629 0 0 0 0 0 0-7.314 7.314-7.314 7.314-7.314 14.629 0 0 0 0 0 0 0 7.314 0 7.314-7.314 14.629 0 0 0 0 0 0 0 7.314 0 7.314-7.314 14.629 0 0 0 0 0 0 0 7.314 0 7.314-7.314 14.629 0 0 0 0 0 0s-0 7.314-0 7.314c0 0 0 0 0 0 0 7.314-7.314 7.314-7.314 14.629 0 0 0 0 0 0s-7.314 7.314-7.314 7.314v0c-29.257 43.886-73.143 65.829-109.714 65.829z"
    },
    userMale: {
      // The outline of the face and shoulders for the male icon
      shape: "M256 48C148.5 48 60.1 129.5 49.2 234.1c-.8 7.2-1.2 14.5-1.2 21.9 0 7.4.4 14.7 1.2 21.9C60.1 382.5 148.5 464 256 464c114.9 0 208-93.1 208-208S370.9 48 256 48zm135.8 326.1c-22.7-8.6-59.5-21.2-82.4-28-2.4-.7-2.7-.9-2.7-10.7 0-8.1 3.3-16.3 6.6-23.3 3.6-7.5 7.7-20.2 9.2-31.6 4.2-4.9 10-14.5 13.6-32.9 3.2-16.2 1.7-22.1-.4-27.6-.2-.6-.5-1.2-.6-1.7-.8-3.8.3-23.5 3.1-38.8 1.9-10.5-.5-32.8-14.9-51.3-9.1-11.7-26.6-26-58.5-28h-17.5c-31.4 2-48.8 16.3-58 28-14.5 18.5-16.9 40.8-15 51.3 2.8 15.3 3.9 35 3.1 38.8-.2.7-.4 1.2-.6 1.8-2.1 5.5-3.7 11.4-.4 27.6 3.7 18.4 9.4 28 13.6 32.9 1.5 11.4 5.7 24 9.2 31.6 2.6 5.5 3.8 13 3.8 23.6 0 9.9-.4 10-2.6 10.7-23.7 7-58.9 19.4-80 27.8C91.6 341.4 76 299.9 76 256c0-48.1 18.7-93.3 52.7-127.3S207.9 76 256 76c48.1 0 93.3 18.7 127.3 52.7S436 207.9 436 256c0 43.9-15.6 85.4-44.2 118.1z",
      // The space enclosed by the face of the male icon
      enclosed: "M256 76c48.1 0 93.3 18.7 127.3 52.7S436 207.9 436 256s-18.7 93.3-52.7 127.3S304.1 436 256 436c-48.1 0-93.3-18.7-127.3-52.7S76 304.1 76 256s18.7-93.3 52.7-127.3S207.9 76 256 76m0-28C141.1 48 48 141.1 48 256s93.1 208 208 208 208-93.1 208-208S370.9 48 256 48z"
    },
    // TODO introduce a gender-neutral person icon for when we can tell a node is a person but the gender isn't specified.
    default: {
      shape: "M256 48C148.5 48 60.1 129.5 49.2 234.1c-.8 7.2-1.2 14.5-1.2 21.9 0 7.4.4 14.7 1.2 21.9C60.1 382.5 148.5 464 256 464c114.9 0 208-93.1 208-208S370.9 48 256 48zm135.8 326.1c-22.7-8.6-59.5-21.2-82.4-28-2.4-.7-2.7-.9-2.7-10.7 0-8.1 3.3-16.3 6.6-23.3 3.6-7.5 7.7-20.2 9.2-31.6 4.2-4.9 10-14.5 13.6-32.9 3.2-16.2 1.7-22.1-.4-27.6-.2-.6-.5-1.2-.6-1.7-.8-3.8.3-23.5 3.1-38.8 1.9-10.5-.5-32.8-14.9-51.3-9.1-11.7-26.6-26-58.5-28h-17.5c-31.4 2-48.8 16.3-58 28-14.5 18.5-16.9 40.8-15 51.3 2.8 15.3 3.9 35 3.1 38.8-.2.7-.4 1.2-.6 1.8-2.1 5.5-3.7 11.4-.4 27.6 3.7 18.4 9.4 28 13.6 32.9 1.5 11.4 5.7 24 9.2 31.6 2.6 5.5 3.8 13 3.8 23.6 0 9.9-.4 10-2.6 10.7-23.7 7-58.9 19.4-80 27.8C91.6 341.4 76 299.9 76 256c0-48.1 18.7-93.3 52.7-127.3S207.9 76 256 76c48.1 0 93.3 18.7 127.3 52.7S436 207.9 436 256c0 43.9-15.6 85.4-44.2 118.1z",
      enclosed: "M256 76c48.1 0 93.3 18.7 127.3 52.7S436 207.9 436 256s-18.7 93.3-52.7 127.3S304.1 436 256 436c-48.1 0-93.3-18.7-127.3-52.7S76 304.1 76 256s18.7-93.3 52.7-127.3S207.9 76 256 76m0-28C141.1 48 48 141.1 48 256s93.1 208 208 208 208-93.1 208-208S370.9 48 256 48z"
    }
  };

  const linkTooltipText =function (d) {
    return "<strong>From</strong>: " + d.source.name +
      "<br/><strong>To</strong>: " + d.target.name +
      "<br/><strong>Match Level</strong>: " + d.matchLevel +
      "<br/><strong>Match Key</strong>: " + d.matchKey;
  }

  const  nodeTooltipText = function (d) {
    return "<strong>Entity ID</strong>: " + d.entityId +
      "<br/><strong>Name</strong>: " + d.name +
      "<br/><strong>Address</strong>: " + d.address +
      "<br/><strong>Phone</strong>: " + d.phone;
  }

  const registerLink = function(d: LinkInfo) {
    // @ts-ignore sourceN is new temp memeber
    const source : NodeInfo = <NodeInfo> d.sourceN;
    // @ts-ignore
    const target : NodeInfo = <NodeInfo> d.targetN;
    console.log(source,target)
    this.linkedByNodeIndexMap[`${source.index ? source.index :source},${target.index ? target.index : target}`] = 1;
  }

export default function updateGraphForaddSvg (svg,graph){
    const linkGroup = svg.selectAll('.sz-graph-link')
    .data(graph.links)
    .enter();

  // Add the lines, except we're not defining how they're drawn here.  That happens in tick()
 
  this.linkArrow = linkGroup.append("line").style("stroke", "orange").style("stroke-width", 2)//.attr("marker-end", "url(#arrow)")

  this.link = linkGroup.append('path')
  .attr('class', d => d.isCoreLink ? 'sz-graph-core-ink' : 'sz-graph-link')
  .attr('id', d => d.id); // This lets SVG know which label goes with which line
              
  // Add link labels
  if (this.showLinkLabels) {
    // TODO Append link labels after initialization on showLinkLabels change.
    this.linkLabel = linkGroup.append('svg:text')
      .attr('text-anchor', 'middle')
      .attr('class', 'sz-graph-link-label')
      .attr('dy', -3)
      .append('textPath')
      .attr('class', d => d.isCoreLink ? 'sz-graph-core-link-text' : 'sz-graph-link-text')
      .attr('startOffset', '50%')
      .attr('xlink:href', d => '#' + d.id) // This lets SVG know which label goes with which line
      .text(d => d.matchKey);
  }

  // Add Nodes.  Adding the nodes after the links is important, because svg doesn't have a z axis.  Later elements are
  //   drawn on top of earlier elements.
  this.activeNodes = svg.selectAll('.sz-graph-node')
    .data(graph.nodes.filter(r=>r))
    .enter().append('g')
    .attr('class', 'sz-graph-node');

  // Add node labels
  this.nodeLabel = this.activeNodes.append("svg:text")
  .attr("text-anchor", "middle")
  .attr("dy", ".25em")
  .attr("y", 25)
  .attr("class", "sz-graph-label")
  .text(d => {
    return d && d.name && d.name.length > 18 ? d.name.substring(0, 15).trim() + "..." : d.name;
  });

   // Add node labels
   this.nodeLabel = this.activeNodes.append("svg:text")
   .attr("text-anchor", "middle")
   .attr("dy", ".25em")
   .attr("y", - 25)
   .attr("class", "sz-graph-label")
   .text(d => {
     return d && d.linkCount
   });
 

  // Adds a background underneath the node labels.  This label is mostly opaque so that the label is still legible in
  //   busy areas of a network.
  const nodeLabelBBoxAry = [];
  this.nodeLabel.each(function (d, i) {
    nodeLabelBBoxAry[i] = this.getBBox();
    });

  // Text background
  this.activeNodes.insert('svg:rect', 'text')
    .attr('x', (d, i) => nodeLabelBBoxAry[i].x - (this._labelPadding / 2))
    .attr('y', (d, i) => nodeLabelBBoxAry[i].y - (this._labelPadding / 2))
    .attr('rx', 5)
    .attr('ry', 5)
    .attr('width', (d, i) => nodeLabelBBoxAry[i].width + this._labelPadding)
    .attr('height', (d, i) => nodeLabelBBoxAry[i].height + this._labelPadding)
    .attr('class', "sz-graph-bbox");

  // Add an SVG circle for the person's face.  This hides the links so they're not visible through the face.
  this.activeNodes.filter(d => d.iconType !== "business" && ICONS[d.iconType])
    //.append('path')
    .append('circle')
    .attr('class', function(d){
      return ['sz-graph-icon-enclosure'].concat(d.relationTypeClasses).join(' ')
    })
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", 15);

    //.attr('d', d => ICONS[d.iconType]["enclosed"])
    //.attr("transform", "translate(-20,-20) scale(.080)");

  // Add an SVG icon for the person.
  this.activeNodes.filter(d => d.iconType !== "business")
    .append('path')
    .attr('class', function(d){
      return ['sz-graph-node-icon'].concat(d.relationTypeClasses).join(' ')
    })
    .attr('fill', d => d.isQueriedNode ? "#000000" : d.isCoreNode ? '#999999' : '#DDDDDD')
    .attr("d", d => ICONS[d.iconType] ?
                    ICONS[d.iconType]["shape"] :
                    ICONS["default"]["shape"])
    .attr("transform", "translate(-20,-20) scale(.080)");

  // Add svg icon for business (corps are not people)
  this.activeNodes.filter(d => d.iconType === "business")
  .append('path')
  .attr('class', function(d){
    return ['sz-graph-node-icon'].concat(d.relationTypeClasses).join(' ')
  })
  .attr('fill', d => d.isQueriedNode ? "#000000" : d.isCoreNode ? '#999999' : '#DDDDDD')
  .attr("d", d => ICONS[d.iconType] ?
                  ICONS[d.iconType]["shape"] :
                  ICONS["default"]["shape"])
  .attr("transform", "translate(-20,-20) scale(1.4)");

  // Add .png icons for businesses
  // TODO replace .png business icon with SVG
  /*
  this.activeNodes.filter(d => d.iconType === "business")
    .append('image')
    .attr("xlink:href", d => {
      const nodeType = d.isQueriedNode ? 'queried' : d.isCoreNode ? 'core' : 'buildout';
      return "../img/icons8-building-50-" + nodeType + ".png";
    })
    .attr("x", -20)
    .attr("y", -20)
    .attr("height", 50)
    .attr("width", 50)
    .attr('class', "sz-graph-icon " + (d => d.isQueriedNode ? 'sz-graph-queried-node' : d.isCoreNode ? 'sz-graph-core-node' : 'sz-graph-node'));
  */
   // Make the tooltip visible when mousing over nodes.  Fade out distant nodes
   const tooltip = d3.select("body")
    .append("div")
    .attr("class", "biss-graph-tooltip")
    .style("opacity", 0);

   this.activeNodes.on('mouseover.tooltip', function (d) {
    tooltip.transition()
      .duration(300)
      .style("opacity", .8);
    tooltip.html(nodeTooltipText(d))
      .style("left", (d3.event.pageX) + "px")
      .style("top", (d3.event.pageY + 10) + "px");
  })
    // .on('mouseover.fade', this.fade(0.1).bind(this))
    .on("mouseout.tooltip", function () {
      tooltip.transition()
        .duration(100)
        .style("opacity", 0);
    })
    // .on('mouseout.fade', this.fade(1).bind(this))
    .on("mousemove", function () {
      tooltip.style("left", (d3.event.pageX) + "px")
        .style("top", (d3.event.pageY + 10) + "px");
    });

  // Make the tooltip visible when mousing over links.  Fade out distant nodes
  this.link.on('mouseover.fade', this.linkFade(0.1).bind(this))
    .on('mouseover.tooltip', function (d) {
      tooltip.transition()
        .duration(300)
        .style("opacity", .8);
      tooltip.html( linkTooltipText(d))
        .style("left", (d3.event.pageX) + "px")
        .style("top", (d3.event.pageY + 10) + "px");
    })
    .on("mouseout.tooltip", function () {
      tooltip.transition()
        .duration(100)
        .style("opacity", 0);
    })
    .on('mouseout.fade', this.linkFade(1).bind(this))
    .on("mousemove", function () {
      tooltip.style("left", (d3.event.pageX) + "px")
        .style("top", (d3.event.pageY + 10) + "px");
    });

  this.linkedByNodeIndexMap={}
  graph.links.forEach( registerLink.bind(this) ); 
  console.log('this.linkedByNodeIndexMap',this.linkedByNodeIndexMap,graph.links)

 
 

  }