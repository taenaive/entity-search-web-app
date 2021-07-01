import { Injectable, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PgService {
 
  constructor( private http: HttpClient ) {
  }
  // Postgres calls
  public getList({limit ='10', offset ='0' ,where=null}): Observable<any> {
    if(where){
      return this.http.get<any>(`/pg/all?limit=${limit}&offset=${offset}&where=${where}`)
    }
    return this.http.get<any>(`/pg/all?limit=${limit}&offset=${offset}`)
  }

  public getTotalCounts(){
    return this.http.get<any>(`/pg`)
  }
  
  // Senzing API calls
  public getDataSources(){
    return this.http.get<any>(`/api/data-sources`)
  }
  
  
}
