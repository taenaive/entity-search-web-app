import { Component, OnInit,ChangeDetectorRef } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { SzSearchComponent,
          SzConfigurationService,
          SzPrefsService ,
          SzSearchService,
          SzFoliosService
        } from '@senzing/sdk-components-ng';
import { ConfigService } from '@senzing/rest-api-client-ng';
import { Title } from '@angular/platform-browser';
//import {UiService} from '../../services/ui.service'


@Component({
    selector: 'biss-search',
    templateUrl: './biss-search.component.html',
    styleUrls: ['./biss-search.component.scss']
  })
  export class BissSearchComponent extends SzSearchComponent implements OnInit{
    constructor( fb: FormBuilder,
                  configService: ConfigService,
                  cd: ChangeDetectorRef,
                  apiConfigService: SzConfigurationService,
                  prefs: SzPrefsService,
                  searchService: SzSearchService,
                  folios: SzFoliosService,
                  dialog: MatDialog,
                  bottomSheet: MatBottomSheet,
               // private uiService:UiService,
                private  titleService: Title,
                public breakpointObserver: BreakpointObserver) {
                      super(fb, 
                            configService, 
                            cd, 
                            apiConfigService, 
                            prefs, 
                            searchService, 
                            folios,
                            dialog,
                            bottomSheet,
                            breakpointObserver);
    }
   ngOnInit(): void {
     super.ngOnInit();
   }
   clearSearch(): void{
    super.clearSearch()
    this.titleService.setTitle( "CBP Entity Search" );
   }
  }