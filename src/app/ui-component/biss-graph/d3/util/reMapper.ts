import {Graph} from '../../graph-types';

export function restoreMapper (graph:Graph , original:Graph) {
    original.nodes.forEach( r=>{
        graph.nodes.forEach(s =>{
            if(r.entityId === s.entityId){
                s.index = r.index
            }
        })
    }
    )
}

export default function reMapper (graph:Graph , original:Graph , primaryIndex){
    
    const linkOriginalFiltered = original.links.filter(r => {
        return r.source === primaryIndex
      })
      console.log('linkOriginalFiltered',primaryIndex, linkOriginalFiltered,original)
       // @ts-ignore: number is passed .
      const nodesIndexs = linkOriginalFiltered.map((r) => r.target)
      // @ts-ignore: number is passed .
      const links =  linkOriginalFiltered.map((r) => graph.links[r.id])
      //sparse array construction
      const arrNodes = new Array()
            arrNodes[primaryIndex] = graph.nodes[primaryIndex]
            nodesIndexs.forEach(r => {
              // @ts-ignore: string is passed .
              arrNodes[r]=graph.nodes[r]
            })
      const result = {nodes: arrNodes, links}
            console.log('real result:', result)
            //Algorithm
            // 1. iterate nodes.
            // 2 find next empty spot
            // 3 if none empty we are good. return the the result
            // 4 else  we start
            // 5 get the empty index => find next available node index
            // 6 move the next available node to empty spot
            // 7 update the target location at the link
            // 8 go to 5 until no more things to move.
            // 9 end
            //Algorithm 2 (compact array)
            // 4 else  we start
            // 4.5 create new Array() arr
            // 5 skip the empty index => find next available node index
            // 6 copy to  the new postion
            // 7 update the target location at the link
            // 8 go to 5 until the end
            // 9 end
            const compactedNodes = []
            
            result.nodes.forEach( (node,index) => {
                if (node) {
                    compactedNodes.push(node)
                    const currentPosition =compactedNodes.length -1
                    node.index = currentPosition
                    result.links.forEach( link =>{
                        if (link.source === index){
                            link.source= currentPosition
                        }
                        if (link.target === index){
                            link.target= currentPosition
                        }
                    })
                }

            })
    //   console.log("final Filtered result: ",{nodes:compactedNodes, links:result.links})
    //   return {nodes:[], links:[]}      
     return {nodes:compactedNodes, links:result.links}
  }