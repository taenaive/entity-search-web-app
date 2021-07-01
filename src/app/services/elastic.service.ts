import { Injectable, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ElasticService {
 
  constructor( private http: HttpClient ) {
  }
  // // Postgres calls
  // public getList({limit ='10', offset ='0' ,where=null}): Observable<any> {
  //   if(where){
  //     return this.http.get<any>(`/elastic/all?limit=${limit}&offset=${offset}&where=${where}`)
  //   }
  //   return this.http.get<any>(`/elastic/all?limit=${limit}&offset=${offset}`)
  // }

   public getList({limit ='10', offset ='0' ,where=null}): Observable<any> {
    if(where){
      return this.http.post<any>(`/elastic/senzing/_search`,{
        size:limit,
        query:{
          bool:{
            must:where.must,
            should: where.should
          }
        }
      })
    }
    return this.http.post<any>(`/elastic/senzing/_search`,{
      size:limit,
      query: {
        "match_all": {}
        
      }
    }) 
  }

  public getListFromJson(jsonObj): Observable<any> {
    if(jsonObj){
        return this.http.post<any>(`/elastic/senzing/_search`,jsonObj) 
      }
  }
  


  public getTotalCounts(){
    return this.http.post<any>(`/elastic/senzing/_count`,{
      "query": {
        "match_all": {}
      }
    })
  }
  
  // Senzing API calls
  public getDataSources(){
    return this.http.get<any>(`/api/data-sources`)
  }
  
  
}
