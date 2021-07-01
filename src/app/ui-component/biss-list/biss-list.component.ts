import {  HostListener, Component, OnInit,ViewChild , AfterViewInit} from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { Title } from '@angular/platform-browser';
import { ElasticService } from '../../services/elastic.service'
import {UiService} from '../../services/ui.service'
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import { RouterLinkWithHref } from '@angular/router';
import {HighlightResult} from 'ngx-highlightjs';
import { JsonpClientBackend } from '@angular/common/http';

@Component({
    selector: 'biss-list',
    templateUrl: './biss-list.component.html',
    styleUrls: ['./biss-list.component.scss']
  })
  export class BissListComponent  implements OnInit , AfterViewInit{
   
    lists :MatTableDataSource<any>;
    response: HighlightResult;

    dataSources: Array<any> ;
    dataSource: string  = 'none';
    showArrow: boolean = false;
    showLinkLabels: boolean = true;
    static x1:number = 800
    static y1:number = 600
    svgViewBox ="0 0 800 600"
    searchColumn1Pre: string = "none";
    search1valuePre: string;
    searchColumn1: string = "none";
    search1value: string;
    searchLabels: string[] = ['entity id','record id', 'name', /*'phone number', 'address','city','postal code','state',*/'data source'];
    searchLabelMap ={ 'entity id':['ENTITY_ID'],
                      'record id': ['record_id','RECORD_ID'], 
                      'name': ['ENTITY_NAME'], 
                      'phone number': ['HOME_PHONE_NUMBER','PHONE_NUMBER'],
                      'address':['HOME_ADDR_LINE1', 'ADDR_LINE1'],
                      'city':['HOME_ADDR_CITY','ADDR_CITY'],
                      'postal code':['HOME_ADDR_POSTAL_CODE'],
                      'state':['HOME_ADDR_STATE', 'ADDR_STATE'],
                      'data source': ['DATA_SOURCE']}
                     // displayedColumns: string[] = ['_id', 'RECORD_ID', 'PRIMARY_NAME_FIRST', 'HOME_PHONE_NUMBER', 'HOME_ADDR_LINE1','HOME_ADDR_CITY','HOME_ADDR_POSTAL_CODE','HOME_ADDR_STATE','DATA_SOURCE'];
    displayedColumns: string[] = ['_id', 'PRIMARY_NAME_FIRST', 'RECORD_ID','DATA_SOURCE'];
    tableClickedRow ={
      selectedRow:{},
      has:(row) =>{return row === this.tableClickedRow.selectedRow },
      add:(row) =>{this.tableClickedRow.selectedRow = row ; this.entityId = row._id }
    } 
    //Json highlighting
      onHighlight(e) {
        this.response = {
          language: e.language,
          relevance: e.relevance,
          second_best: '{...}',
          top: '{...}',
          value: '{...}'
        }
      }
    limit: string = '50';
    offset: string  = '0';
    entityId: string ='34986'
    entityIdSelected: string ='';
    z: boolean = false;
    private entireDataCount: string = '0'
    constructor(private  titleService: Title,
                private ElasticService:ElasticService,
                private uiService:UiService,
                ) {
                     
    }
  
    @ViewChild(MatSort) sort: MatSort;
    @ViewChild(MatPaginator) paginator: MatPaginator;
    ngAfterViewInit() {
     // this.lists.sort = this.sort;
     this.uiService.spinnerActive = true
     this.ElasticService.getList({limit:this.limit,offset:this.offset}).subscribe(data => {this.displayList(data)
                                                                                      this.lists.sort = this.sort
                                                                                      this.lists.paginator = this.paginator;
                                                                                      this.uiService.spinnerActive = false
                                                                                    });
     this.ElasticService.getTotalCounts().subscribe(data => {this.entireDataCount = data.count})
     this.ElasticService.getDataSources().subscribe(data => this.dataSources = data.data.dataSources)
    }

   ngOnInit(): void {
    //this.uiService.searchShow = false
   }
   sendEntityIdToGraph() {
    this.entityIdSelected = this.entityId
   }
   
  
   onToggleArrow(){
     this.showArrow = !this.showArrow
   }
   onToggleLinkLables(){
    this.showLinkLabels =!this.showLinkLabels
   }

   // pan and zoom of SVG
   @HostListener('document:mousemove', ['$event'])
   onMouseMove(event: MouseEvent) {
    
      if ( event.buttons && this.mouseEnteredSvg) {
        this.panLevel.x = (this.panLevel.x - event.movementX * this.zoomLevel )
        this.panLevel.y = (this.panLevel.y - event.movementY * this.zoomLevel )
        this.onZoomSvg(true,this.zoomLevel)
     }
   };
   mouseEnteredSvg: boolean =false
   mousePanSvg(b:boolean){
    this.mouseEnteredSvg = b
   }

   zoomLevel:number = 1
   panLevel: {x:number,y:number} = {x:0,y:0}//x,y
   onZoomSvg(plusOrMinus: boolean, zoom ?: number){
     if(zoom){
       this.zoomLevel = zoom
     }else{
        this.zoomLevel =  this.zoomLevel *  (plusOrMinus ? 1/2 : 2)
     }
     const resized_x1 = (BissListComponent.x1 * this.zoomLevel) //+ this.panLevel.x
     const resized_y1 = (BissListComponent.y1 * this.zoomLevel)// + this.panLevel.y
     const resized_x = (BissListComponent.x1/2 - resized_x1/2) + this.panLevel.x
     const resized_y = (BissListComponent.y1/2 - resized_y1/2) + this.panLevel.y
      this.svgViewBox = `${resized_x} ${resized_y} ${resized_x1} ${resized_y1}`
   }

   whereClause: string =''
   whereClauseJson: any ={}
   onJsonChange(){
      console.log(this.whereClause)
   }
   private buildWhereClause(){
      const key = this.searchColumn1Pre
      const val = this.search1valuePre
      if( !key || !val) return null
      const realKeyVals = this.searchLabelMap[key].map(r => {
        if(r ==="RECORD_ID"){
          return {[`RESOLVED_ENTITY.RECORDS.JSON_DATA.${r}`]:val}
        } else {
          return {[`RESOLVED_ENTITY.${r}`]:val}
        }
      })
      const result: Array<any> = [...realKeyVals]
      
      
      const retObj:{should: any,must:any} = {should: result.map(r=>{ return {"match" : r}}),must:null}
      if(this.dataSource && this.dataSource === 'none'){
        console.log('none selected for the data source')
      } else{
       retObj.must= {"match": {"RESOLVED_ENTITY.RECORD_SUMMARY.DATA_SOURCE": this.dataSource}}
      }
      const textTransform = {size:this.limit, query: {bool: retObj}}
      this.whereClause =JSON.stringify(textTransform, undefined,4)
      this.whereClauseJson = textTransform
      return retObj
      //return result.map(r=>{ return {"match" : r}})
      //console.log(JSON.stringify(result))
      //return JSON.stringify(result)
    }

   onClickSelectSearch(){
    this.uiService.spinnerActive = true
    const whereClause = this.buildWhereClause()
    this.ElasticService.getList({limit:this.limit,offset:this.offset,where:whereClause}).subscribe(data => {this.displayList(data)
      this.lists.sort = this.sort
      this.uiService.spinnerActive = false
    });
   }
   onClickRawSearch(){
    this.uiService.spinnerActive = true
    let parsedJsonFromTextArea = null
    try{parsedJsonFromTextArea = JSON.parse(this.whereClause)}
    catch (e){
      this.uiService.spinnerActive = false
      alert(e)
      console.log(e)
      return
    }
   
    this.ElasticService.getListFromJson(parsedJsonFromTextArea).subscribe(data => {this.displayList(data)
      this.lists.sort = this.sort
      this.uiService.spinnerActive = false
    });
   
      this.uiService.spinnerActive = false
   }

   get totalCount(){
     return this.entireDataCount
   }

   get totalData(){ 
     
     return this.lists && this.lists.data.length
   }
   private jsonDataNormalizer(obj){
     
     if(obj.ADDR_LINE1){
      obj.HOME_ADDR_LINE1  = obj.ADDR_LINE1
     }
     if(obj.BUSINESS_ADDR_LINE1){
      obj.HOME_ADDR_LINE1  = obj.BUSINESS_ADDR_LINE1
     }
     if(obj.ADDR_CITY){
      obj.HOME_ADDR_CITY = obj.ADDR_CITY
     }
     if(obj["Home Jurisdiction Text"]){
      obj.HOME_ADDR_STATE  = obj["Home Jurisdiction Text"]
     }
     if(obj.ADDR_STATE){
      obj.HOME_ADDR_STATE  = obj.ADDR_STATE
     }
     if(obj.ADDR_POSTAL_CODE){
      obj.HOME_ADDR_POSTAL_CODE = obj.ADDR_POSTAL_CODE
     }
     
     if(obj.PHONE_NUMBER){
      obj.HOME_PHONE_NUMBER  = obj.PHONE_NUMBER
     }

     if(obj.PRIMARY_NAME_ORG){
      obj.PRIMARY_NAME_FIRST  = obj.PRIMARY_NAME_ORG
     }

     if(obj.NAME_FIRST){
      obj.PRIMARY_NAME_FIRST  = obj.NAME_FIRST
     }
     if(obj.NAME_LAST){
      obj.PRIMARY_NAME_LAST  = obj.NAME_LAST
     }
  
     return obj
   }
   private filterData(data){
     const hits = data.hits.hits
     //console.log(hits[0]._id, hits[0]._source.RESOLVED_ENTITY.RECORDS[0].JSON_DATA)
    const objectfied = hits.map( r => {return {_id:r._id, ...this.jsonDataNormalizer(r._source.RESOLVED_ENTITY.RECORDS[0].JSON_DATA)} })
    return new MatTableDataSource(objectfied)
   }

   displayList(data): void{
    this.lists = this.filterData(data)
    this.lists.filterPredicate = (data: any, filter: string) => { 
      if(this.searchColumn1 && this.searchColumn1!=='none' && this.search1value && this.search1value !=='none'){
        
        switch(this.searchColumn1){
          case 'entity id': return data._id.toLowerCase().indexOf(filter) != -1;
          case 'record id': return data.RECORD_ID.toLowerCase().indexOf(filter) != -1;
          case 'name': return `${data.PRIMARY_NAME_FIRST} ${data.PRIMARY_NAME_LAST}`.toLowerCase().indexOf(filter) != -1;
          case 'phone number': return data.HOME_PHONE_NUMBER.indexOf(filter) != -1;
          case 'address': return data.HOME_ADDR_LINE1.toLowerCase().indexOf(filter) != -1;
          case 'city': return data.HOME_ADDR_CITY.toLowerCase().indexOf(filter) != -1;
          case 'postal code': return data.HOME_ADDR_POSTAL_CODE.toLowerCase().indexOf(filter) != -1;
          case 'state': return data.HOME_ADDR_STATE.toLowerCase().indexOf(filter) != -1;
          case 'data source': return data.DATA_SOURCE.toLowerCase().indexOf(filter) != -1;
          default: return true;
        }
       
      }
      return true
    }
    this.titleService.setTitle( "CBP Data List" );
   }
   onClickSearchFilterButton() {
    //console.log(this.searchColumn1, this.search1value)
    this.lists.filter = this.search1value.toLowerCase();
  }
  }