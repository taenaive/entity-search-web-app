import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'bissTableFilter'
})
export class BissTableFilterPipe implements PipeTransform {

  transform(list: any[], filters: any) {

    //const keys       = Object.keys(filters)
    //onsole.log(keys)
    // const filterRow = row => keys.every(key => row[key] === filters[key]);
    console.log(list)
    if(filters.search_key && filters.search_value){
      return list.filter(r => r.search_key.includes(r.search_value))
    }
    // return keys.length ? list.filter(filterRow) : list;
    return list
  }

}