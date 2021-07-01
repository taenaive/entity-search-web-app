import { Component, Input, HostBinding, OnInit,OnChanges, SimpleChanges, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import * as d3 from 'd3';
import { Graph, NodeInfo, LinkInfo } from './graph-types';
import { Simulation } from 'd3-force';
import { EntityGraphService, SzEntityNetworkResponse, SzEntityNetworkData } from '@senzing/rest-api-client-ng';
import { map, tap } from 'rxjs/operators';
import updateGraphForaddSvg from './d3/updateSvgGraph'
import reMapper,{restoreMapper} from './d3/util/reMapper'
/**
 * Provides a SVG of a relationship network diagram via D3.
 * @export
 */
@Component({
  selector: 'biss-relationship-network',
  templateUrl: './biss-relationship-network.component.html',
  styleUrls: ['./biss-relationship-network.component.scss']
})
export class BissRelationshipNetworkComponent implements OnInit, OnChanges, AfterViewInit {



  

  @ViewChild('graphEle') svgComponent: ElementRef;
  public svgElement: SVGSVGElement;

  private _showLinkLabels: any = true;
  @Input() public set showLinkLabels(value: boolean) {this._showLinkLabels = value; }
  public get showLinkLabels(): boolean { return this._showLinkLabels; }


  /**
   * arbitrary value just for drawing
   * @internal
   */
  private _statWidth: number = 800;
  /**
   * sets the width of the component
   */
  @HostBinding('style.width.px')@Input() svgWidth;

  /**
   * arbitrary value just for drawing
   * @internal
   */
  private _statHeight: number = 600;
  /**
   * sets the height attribute of the svg.
   * @deprecated svg is always 100% of parent dom elements height
   */
  @HostBinding('style.height.px')@Input() svgHeight: string;

  /**
   * this matches up with the "_statWidth" and "_statHeight" to
   * content centering and dynamic scaling properties.
   * @internal
  */
  private _svgViewBox: string = `0 0 ${this._statWidth} ${this._statHeight}`;
  /**
   * sets the viewBox attribute on the svg element.
  */
  @Input() public set svgViewBox(value: string){ this._svgViewBox = value; }
  /**
   * gets the viewBox attribute on the svg element.
   */
  public get svgViewBox() { return this._svgViewBox; }

  /**
   * the preserveAspectRatio attribute on the svg element.
   * @interal
   */
  private _preserveAspectRatio: string = "xMidYMid meet";
   /**
   * sets the preserveAspectRatio attribute on the svg element.
   * used to set aspect ratio, centering etc for dynamic scaling.
   */
  @Input() public set svgPreserveAspectRatio(value: string) { this._preserveAspectRatio = value; }
  /**
   * gets the preserveAspectRatio attribute on the svg element.
   */
  public get svgPreserveAspectRatio() { return this._preserveAspectRatio; }

  private _forceXYContinuous: boolean = false;
  /**
   * sets whether or not to force XY gravity and node repulsion
   * even after drag repositioning. IE node "snaps" back in to place
   * after drag-end.
   */
  @Input() public set forceXYContinuous(value: boolean) { this._forceXYContinuous = value; }

  private _showArrow: boolean = false;
  /**
   * sets to show the link arrow.
   */
  @Input() public set showArrow(value: boolean) {
            if(value ){
              this.linkArrow && this.linkArrow.attr("marker-end", "url(#arrow)");
            }else {
                    this.linkArrow &&  this.linkArrow.attr("marker-end", "");
                  }
            this._showArrow = value;
          } 

  /** @internal */
  private _entityIds: string[];

  /**
   * Set the entityIds of the src entities to do discovery search around.
   */
  @Input() set entityIds(value: string | number | number[]) {
    if(value && typeof value === 'string'){
      if(value && value.indexOf(',')) {
        // string array
        const sArr = value.split(',');
        this._entityIds = sArr;
      } else {
        // single string
        this._entityIds = [value];
      }
    } else if(value && typeof value === 'number'){
      // single number
      this._entityIds = [ value.toString() ];
    } else if(value){
      // the only other thing it could be is number[]
      this._entityIds = value.toString().split(',');
    }
  }

  /**
   * amount of degrees of separation to populate the graph with
   */
  private _maxDegrees: number;
  @Input() set maxDegrees(value: string) { this._maxDegrees = +value; }

  private _buildOut: number;
  @Input() set buildOut(value: string) { this._buildOut = +value; }

  /**
   * maxiumum entities to display
   */
  private _maxEntities: number;
  @Input() set maxEntities(value: string) { this._maxEntities = +value; }

  /**
   * the space between nodes
   */
  private _linkGravity = 8;
  @Input() public set linkGravity(value: number){ this._linkGravity = value; }

  /**
   * name label padding
   */
  private _labelPadding = 8;
  @Input() public set labelPadding(value: number){ this._labelPadding = value; }

  /**
   * return the raw data node in the payload
   */
  static readonly WITH_RAW: boolean = true;

  activeNodes;
  nodeLabel;
  link;
  linkArrow;
  linkLabel;
  forceSimulation: Simulation<NodeInfo, LinkInfo>;
  linkedByNodeIndexMap;
  primeEntityClick = 0;

  private graphData : Graph
  static graphOriginal: Graph
  private stateObj: {single: boolean} = { single : true }
  private updateGraphForaddSvg = updateGraphForaddSvg.bind(this)

  constructor(
    private graphService: EntityGraphService,
  ) {
    this.linkedByNodeIndexMap = {};
  }

  ngOnInit() {
   

    if (this._entityIds === undefined || this._entityIds.length === 0) {
      console.log("No EntityIDs passed in to " + this);
      return;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    for (const propName in changes) {
     // console.log(propName, changes[propName])
      if(this._entityIds && propName ==='entityIds'){
        d3.select( this.svgElement).selectAll("*").remove();
        this.getNetwork().pipe(
          map(this.asGraph.bind(this)),
          tap( (gdata: Graph) => { console.log('BissRelationshipNetworkGraph: g1 = ', gdata); })
        ).subscribe(  this.preAddSvg.bind(this))//this.addSvg.bind(this) );
      }
    }
   
  
   }

  /** make network request and populate svg */
  ngAfterViewInit() {
       // get dom element reference to svg tag
    this.svgElement = (this.svgComponent.nativeElement as SVGSVGElement);
    if(this._entityIds){
      this.getNetwork().pipe(
        map(this.asGraph.bind(this)),
        tap( (gdata: Graph) => { console.log('BissRelationshipNetworkGraph: g1 = ', gdata); })
      ).subscribe( this.preAddSvg.bind(this) );
    }
  }

  /**
   * make graph network request using input parameters
   */
  private getNetwork() {
    console.log(this._entityIds)
    if(this._entityIds){
      return this.graphService.findEntityNetwork(
        this._entityIds,
        this._entityIds,
        this._maxDegrees,
        this._buildOut,
        this._maxEntities,)
        //BissRelationshipNetworkComponent.WITH_RAW );
    } else {
      throw new Error('entity ids are required to make "findNetworkByEntityID" call.');  
    }
  }
  
  primaryNodeFilterLv1(graph: Graph){
    const original =BissRelationshipNetworkComponent.graphOriginal
    let primaryIndex = 0
    original.nodes.forEach((r,index) => {
        if (r.relationTypeClasses && r.relationTypeClasses.length && r.relationTypeClasses[0] === 'graph-node-rel-primary'){
          primaryIndex= index
        } 
      })
    console.log('LV1 primary index and node',primaryIndex)
    //const graphCopy = { nodes: graph.nodes.map(r=> Object.assign({},r)), links: original.links.map(r=> Object.assign({},r))}
    const graphCopy = { nodes: graph.nodes.map(r=> r), links: original.links.map(r=> Object.assign({},r))}
    const result = reMapper(graphCopy,original,primaryIndex)
    console.log("primaryNodeFilter result", result )

    return result
  }

  primaryNodeFilter(graph: Graph){
    const nodes = graph.nodes.filter((r,index) => {
      if(r.relationTypeClasses && r.relationTypeClasses.length && r.relationTypeClasses[0] === 'graph-node-rel-primary'){
        console.log('primary index',index)
        return true
      }
      return false
    })
    return {nodes, links: []}
  }

  preAddSvg(graph: Graph, parentSelection = d3.select("body")){
    this.graphData = graph
    this.primeEntityClick = 0
    //copy of the nodes and links
    BissRelationshipNetworkComponent.graphOriginal = { nodes: graph.nodes.map(r=> Object.assign({},r)), links: graph.links.map(r=> Object.assign({},r))}
    console.log('preaAddSvg', BissRelationshipNetworkComponent.graphOriginal,this.graphData.links)
    //this.addSvg(graph,parentSelection)
    this.addSvg(this.primaryNodeFilter(this.graphData),parentSelection)
  }

  initializeSvg(parentSelection = d3.select("body")){
     // Add the SVG to the HTML body
     const svg = d3.select( this.svgElement );
     svg.append("svg:defs").append("svg:marker").attr("id", "arrow").attr("viewBox", "0 0 10 10").attr("refX", 27).attr("refY", 5).attr("markerUnits", "strokeWidth").attr("fill", 'red').attr("markerWidth", 8).attr("markerHeight", 6).attr("orient", "auto").append("svg:path").attr("d", "M 0 0 L 10 5 L 0 10 z");
    return svg
  }

  cleanupBeforeAddSvg (svg){
    
    this.linkArrow && this.linkArrow.remove()
    this.link && this.link.remove()
    this.linkLabel && this.linkLabel.remove() 
    this.nodeLabel && this.nodeLabel.remove()
    const linkGroup = svg.selectAll('.sz-graph-link')
    linkGroup.data([]).exit().remove()
    this.activeNodes.data([]).exit().remove()
    d3.select("body").selectAll(".biss-graph-tooltip").remove()
    d3.select('svg').selectAll('g').remove()
    

  }

  forceSimulationReset (graph:Graph){
   
            this.forceSimulation = d3.forceSimulation(graph.nodes)
            .force('link', d3.forceLink().links(graph.links).distance(this._statWidth / this._linkGravity)) // links pull nodes together
             .force('charge', d3.forceManyBody().strength(-50)) // nodes repel each other
            .force('center', d3.forceCenter(this._statWidth / 2, this._statHeight / 2)) // Make all nodes start near the center of the SVG
            .on('tick', this.tick.bind(this));
  }


  /** render svg elements from graph data */
  addSvg(graph: Graph, parentSelection = d3.select("body")) {
    const svg=this.initializeSvg(parentSelection)
    this.updateGraphForaddSvg(svg,graph)
    svg.append("text").attr("x", -100).attr("y",15).style("font", "12px sans-serif").style("fill", "gray").text("")
   
    this.forceSimulationReset(graph) 

    this.activeNodes.on('click',  (d)=> {
      console.log('Node Click',d)
      this.nodeConnectOn(svg,d)
      
    })

    
  }

  nodeConnectOn(svg,node){
    //console.log('this._entityIds',node.entityId, this._entityIds[0])
    if(node.entityId == this._entityIds){
    
    this.forceSimulation.stop()
        this.cleanupBeforeAddSvg(svg)
        this.primeEntityClick += 1
        if(this.primeEntityClick === 0){
            const singleOriginFilter = this.primaryNodeFilter(this.graphData)
            this.updateGraphForaddSvg(svg,singleOriginFilter)
            this.forceSimulationReset(singleOriginFilter)

          }else if (this.primeEntityClick === 1) {
            const levelOneFilter = this.primaryNodeFilterLv1(this.graphData)
            this.updateGraphForaddSvg(svg,levelOneFilter)
            this.forceSimulationReset(levelOneFilter)

          }else{
            restoreMapper(this.graphData, BissRelationshipNetworkComponent.graphOriginal)
            this.updateGraphForaddSvg(svg,this.graphData)
            this.forceSimulationReset(this.graphData)
            
            this.primeEntityClick = -1
          }
        
      } else {
        if (this.activeNodes.fadeState){
          this.fade(1).bind(this)(node)
        }else {
          this.fade(0.1).bind(this)(node)
          
        }
        this.activeNodes.fadeState = !this.activeNodes.fadeState
        return
      }

      svg.select("text").text(`Level:${ this.primeEntityClick === -1 ? 2 : this.primeEntityClick}`)
      this.activeNodes.on('click', (d)=> {this.nodeConnectOn(svg,d)})
     
  }

  
  isConnected(a, b) {
    return this.linkedByNodeIndexMap[`${a.index},${b.index}`] ||
      this.linkedByNodeIndexMap[`${b.index},${a.index}`] ||
      a.index === b.index;
  }

  /**
   * function that is executed on node hover
   * @param opacity
   */
  fade(opacity) {
    const isConnectedLocal = this.isConnected.bind(this);
    return d => {

      this.activeNodes.transition().duration(100).style('opacity', function (o) {
        console.log('isConnectedLocal', d, o)
        const thisOpacity = isConnectedLocal(d, o) ? 1 : opacity;
        this.setAttribute('fill-opacity', thisOpacity);
        return thisOpacity;
      });

      this.link.transition().duration(100).style('opacity', o => (o.source === d || o.target === d ? 1 : opacity));
      this.linkArrow.transition().duration(100).style('opacity', o => (o.source === d || o.target === d ? 1 : opacity));
      if (this.showLinkLabels) {
        this.linkLabel.transition().duration(100).style('opacity', o => (o.source === d || o.target === d ? 1 : opacity));
      }

    };
  }
/**
 * Fade Rules for hovering over links
 * As currently implemented, any nodes that are connected to both source and target are not faded out.
 */
  linkFade(opacity) {
    const isConnectedLocal = this.isConnected.bind(this);
    return d => {
      this.activeNodes.transition().duration(100).style('opacity', function (o) {
        const thisOpacity = isConnectedLocal(d.source, o) &&
                            isConnectedLocal(d.target, o) ? 1 : opacity;
        this.setAttribute('fill-opacity', thisOpacity);
        return thisOpacity;
      });

      this.link.transition().duration(100).style('opacity', o => (o.source === d.source && o.target === d.target ? 1 : opacity));
      this.linkArrow.transition().duration(100).style('opacity', o => (o.source === d.source && o.target === d.target ? 1 : opacity));
      if (this.showLinkLabels) {
        this.linkLabel.transition().duration(100).style('opacity', opacity);
      }
    };
  }

  /**
   * Update the SVG to show changes in node position caused by either the user or D3's forces
   * Not called when D3's forces reach equilibrium
   */
  tick() {
    // Update the SVG for each .node
    this.activeNodes.attr("transform", d => "translate(" + d.x + "," + d.y + ")")
      .call(d3.drag()             // TODO Update dragging code to use v5 conventions for event listening
        .on("start", this.dragstarted.bind(this))
        .on("drag", this.dragged.bind(this))
        .on("end", this.dragended.bind(this)));

    // Update link SVG
    this.linkArrow.attr("x1", function(d) {
      return d.source.x;
    }).attr("y1", function(d) {
      return d.source.y;
    }).attr("x2", function(d) {
      return d.target.x;
    }).attr("y2", function(d) {
      return d.target.y;
    })

    
    // Draws left to right so .link-label stay right-side up
    this.link.attr('d', d => (d.source.x < d.target.x) ?
      BissRelationshipNetworkComponent.linkSvg(d.source, d.target, true) :
      BissRelationshipNetworkComponent.linkSvg(d.target, d.source, false))
     
    // Show or hide .link-label
    
    if (this.showLinkLabels) {
      d3.selectAll('.link-label').attr('opacity', 100);
    } else {
      d3.selectAll('.link-label').attr('opacity', 0);
    }
  }

  /**
   * Generate SVG commands for a straight line between two nodes, always left-to-right.
   */
  static linkSvg(leftNode, rightNode, arrow:boolean) {

    const distanceY = rightNode.y - leftNode.y
    const distanceX = rightNode.x - leftNode.x
    const distance =  Math.sqrt(Math.pow(distanceY,2) + Math.pow(distanceX,2))
    const distanceToCircle = distance - 15

    const ratio = distanceToCircle / distance
    const dx = distanceX * ratio
    const dy = distanceY * ratio
    const  x = leftNode.x + dx
    const  y = leftNode.y + dy

    const ratioL = 15 / distance
    const dxL = distanceX * ratioL
    const dyL = distanceY * ratioL
    const  xL = leftNode.x + dxL
    const  yL = leftNode.y + dyL
    return 'M' + xL + ',' + yL + 'L' + x+ ',' + y;

  }

  /**
   * When the user clicks and drags and node, 'Re-heat' the simulation if nodes have stopped moving.
   *   To oversimplify, alpha is the rate at which the simulation advances.
   *   alpha approaches alphaTarget at a rate of alphaDecay.
   *   The simulation stops once alpha < alphaMin.
   *   Restart sets alpha back to 1.
   */
  dragstarted() {
    if (!d3.event.active) this.forceSimulation.alphaTarget(0.3).restart();
    d3.event.subject.fx = d3.event.subject.x;
    d3.event.subject.fy = d3.event.subject.y;
  }

  /**
   * Update the position of the dragged node while dragging.
   */
  dragged() {
    d3.event.subject.fx = d3.event.x;
    d3.event.subject.fy = d3.event.y;
  }

  /**
   * Allows the simulation to 'cool' to the point that nodes stop moving.
   *   The simulation does not stop while alphaTarget (default 0, set at 0.3 by dragstarted) > alphaMin (default 0.001)
   */
  dragended() {
    if (!d3.event.active) this.forceSimulation.alphaTarget(0);
    if(this._forceXYContinuous) {
      // nodes snap back in to place
      d3.event.subject.fx = null;
      d3.event.subject.fy = null;
    } else {
      // nodes once dragged stay where you put them
      // elegant compromise
      d3.event.subject.fx = d3.event.subject.x;
      d3.event.subject.fy = d3.event.subject.y;
    }
  }


  //////////////////
  // DATA MAPPING //
  //////////////////

  /**
   * primary data model shaper.
   * @param data
   */
  asGraph(resp: SzEntityNetworkResponse) : Graph {
    // @todo change from "any" to SzEntityNetworkResponse once it's fixed in the rest-api-client-ng package
    let data: any;
    if (resp && resp.data) data = resp.data;
    const entityPaths = data.entityPaths;
    const entitiesData = data.entities;
    const entityIndex = [];
    const nodes = [];
    const links = [];
    const linkIndex = [];
    const queriedEntityIds = [];
    const coreEntityIds = [];
    const coreLinkIds = [];
    const primaryEntities = this._entityIds.map( parseInt );

    // Identify queried nodes and the nodes and links that connect them.
    entityPaths.forEach( (entPath, ind) => {
      if (!queriedEntityIds.includes(entPath.startEntityId)){
        queriedEntityIds.push(entPath.startEntityId);
      }
      if (!queriedEntityIds.includes(entPath.endEntityId)) {
        queriedEntityIds.push(entPath.endEntityId);
      }

      const pathIds = entPath.entityIds;
      const nodeCount = pathIds.length;
      pathIds.forEach( (pEntId) => {
        if (!coreEntityIds.includes(pEntId)) {
          coreEntityIds.push(pEntId);
        }
      });
      pathIds.forEach( (pEntId, pEntInd) => {
        const linkArr = [pathIds[pEntInd], pathIds[pEntInd + 1]].sort();
        const linkKey = {firstId: linkArr[0], secondId: linkArr[1]};
        if (!BissRelationshipNetworkComponent.hasKey(coreLinkIds, linkKey)) {
          coreLinkIds.push(linkKey);
        }
      });
    });

    // Add a node for each resolved entity
    entitiesData.forEach(entNode => {
      const resolvedEntity  = entNode.resolvedEntity;
      const relatedEntRels  = entNode.relatedEntities && entNode.relatedEntities.filter( (relEnt)=>{
        return primaryEntities ? primaryEntities.indexOf(relEnt.entityId) >= 0 : false;
      } );

      //console.log('BissRelationshipNetworkGraph.asGraph: ',
      //relatedEntRels, entNode.relatedEntities);

      const relColorClasses = [];
      if(relatedEntRels && relatedEntRels.length) {
        //console.log('get color classes: ', relatedEntRels);
        relatedEntRels.forEach( (relEnt) => {
          if(relEnt.relationType == 'DISCLOSED_RELATION'){ relColorClasses.push('graph-node-rel-disclosed'); }
          if(relEnt.relationType == 'POSSIBLE_MATCH'){ relColorClasses.push('graph-node-rel-pmatch'); }
          if(relEnt.relationType == 'POSSIBLE_RELATION'){ relColorClasses.push('graph-node-rel-prel'); }
        })
      } else if ( primaryEntities.indexOf( resolvedEntity.entityId ) > -1 ) {
        relColorClasses.push('graph-node-rel-primary');
        relColorClasses.push('graph-node-tae-primary');
      } else {
        console.warn('no related ent rels for #'+ resolvedEntity.entityId +'.', primaryEntities.indexOf( resolvedEntity.entityId ), entNode.relatedEntities, relatedEntRels);
      }

      const entityId = resolvedEntity.entityId;
      // Create Node
      entityIndex.push(entityId);
      const features = resolvedEntity.features;
      nodes.push({
        isQueriedNode: queriedEntityIds.includes(entityId),
        isCoreNode: coreEntityIds.includes(entityId),
        iconType: BissRelationshipNetworkComponent.getIconType(resolvedEntity),
        entityId: entityId,
        orgName: resolvedEntity.entityName,
        relationTypeClasses: relColorClasses,
        name: resolvedEntity.entityName,
        address: resolvedEntity.addressData && resolvedEntity.addressData.length > 0 ? resolvedEntity.addressData[0] : BissRelationshipNetworkComponent.firstOrNull(features, "ADDRESS"),
        phone: resolvedEntity.phoneData && resolvedEntity.phoneData.length > 0 ? resolvedEntity.phoneData[0] : BissRelationshipNetworkComponent.firstOrNull(features, "PHONE"),
        linkCount: 0
      });
    });

    // Add links between resolved entities.
    entitiesData.forEach(entityInfo => {
      const entityId = entityInfo.resolvedEntity.entityId;
      const relatedEntities = entityInfo.relatedEntities;
      if(relatedEntities){
          relatedEntities.forEach(relatedEntity => {

            const relatedEntityId = relatedEntity.entityId;
            const linkArr = [entityId, relatedEntityId].sort();
            const linkKey = {firstId: linkArr[0], secondId: linkArr[1]};
            // Only add links between resolved entities
            // TODO Add links to related entities not in resolved entities to show where the network can be expanded.
            if (!BissRelationshipNetworkComponent.hasKey(linkIndex, linkKey) && entityIndex.indexOf(relatedEntityId) !== -1) {
              linkIndex.push(linkKey);
              const sourceN = entityIndex.indexOf(entityId)
              const targetN= entityIndex.indexOf(relatedEntityId)
              links.push({
                source: sourceN,
                target: targetN,
                sourceN,
                targetN,
                matchLevel: relatedEntity.matchLevel,
                matchKey: relatedEntity.matchKey,
                isCoreLink: BissRelationshipNetworkComponent.hasKey(coreLinkIds, linkKey),
                id: linkIndex.indexOf(linkKey)
              });
              nodes[sourceN].linkCount +=1 
            }
          });
        }
    });

 
    // GRAPH CONSTRUCTED
    return {
      nodes: nodes,
      links: links
    };
  }

  static firstOrNull(features, name) {
    return features && features[name] && [name].length !== 0 ? features[name][0]["FEAT_DESC"] : null;
  }

  static hasKey(usedLinks, linkKey) {
    return usedLinks.filter(key => key.firstId === linkKey.firstId && key.secondId === linkKey.secondId).length !== 0;
  }

  static getIconType(resolvedEntity) {
    let retVal = 'default';
    if(resolvedEntity && resolvedEntity.records){
      resolvedEntity.records.slice(0,9).forEach(element => {
        if(element.nameOrg || (element.addressData && element.addressData.some((addr) => { return addr.indexOf('BUSINESS') > -1; }))) {
          retVal = 'business'
        } else if(element.gender && (element.gender === 'FEMALE' || element.gender === 'F') ){
          retVal = 'userFemale'
        } else if(element.gender && (element.gender === 'MALE' || element.gender === 'M') ){
          retVal = 'userMale'
        }
      });
    }
    return retVal;
  }

  /**
   * This uses the RAW data model. It's incompatible with the non-raw data.
   * use getIconType with non-raw data instead.
   * @param resolvedEntity
   * @internal
   * @deprecated
   */
  static getIconTypeOld(resolvedEntity) {
    // Look for type information in the first 10 records.
    const recordsArr = resolvedEntity["RECORDS"].slice(0, 9);
    for (let i = 0; i < recordsArr.length; i++) {
      const elem = recordsArr[i];
      const data = elem["JSON_DATA"];
      if (data) {
        if (data["NAME_ORG"]) {
          return 'business';
        } else if (data["GENDER"] === 'FEMALE' || data["GENDER"] === 'F') {
          return 'userFemale';
        } else if (data["GENDER"] === 'MALE' || data["GENDER"] === 'M') {
          return 'userMale';
        }
      }
    }
    return 'default';
  }
}
