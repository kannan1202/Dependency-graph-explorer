import { fetchNpmPackage } from "./npmApi";
import type { DependencyNode, DependencyEdge, DependencyGraph } from "../types/package.types";

export const buildDependencyTree = async (
    rootName: string,
    rootVersion: string,
    dependencies: Record<string, string>,
    maxDepth: number = 4
): Promise<DependencyGraph> => {

    console.log(`Building dependency tree for ${rootName}@${rootVersion}, MaxDepth: ${maxDepth}`);

    const nodes:DependencyNode[] = [];
    const edges:DependencyEdge[] = [];
    const visited = new Set<string>();
    let nodeIdCounter = 0;
    const nodeMap = new Map<string,string>();

    const traverse = async(
        packageName:string,
        packageVersion:string,
        depth:number,
        parentId:string | null
    ): Promise<void> => {
        
        const nodeKey = `${packageName}@${packageVersion}`;
        console.log(`  ${'  '.repeat(depth)} ${nodeKey} (depth: ${depth})`)
        if(visited.has(nodeKey)){
            console.log(`  ${'  '.repeat(depth)} Already visited - cycle detected!`)
            if(parentId && nodeMap.has(nodeKey)){
                edges.push({
                    source:parentId,
                    target:nodeMap.get(nodeKey)!
                })
            }
            return
        }

        if(depth>maxDepth){
            console.log(`  ${'  '.repeat(depth)}  ⏸ Max depth (${maxDepth}) reached`);
            return
        }

        visited.add(nodeKey)
        console.log(`  ${'  '.repeat(depth)}  ✓ Marked as visited`);

        const nodeId = `node-${nodeIdCounter++}`
        console.log(`  ${'  '.repeat(depth)}  🆔 Assigned ID: ${nodeId}`)

        const node: DependencyNode = {
            id:nodeId,
            name:packageName,
            version:packageVersion,
            depth,
            type:depth===0?'root':'dependency'
        }
        nodes.push(node)
        console.log(`  ${'  '.repeat(depth)}  Added to nodes array`)

        nodeMap.set(nodeKey,nodeId);
        console.log(`  ${'  '.repeat(depth)}  Stored in nodeMap`);

        if(parentId){
            const edge:DependencyEdge = {
                source:parentId,
                target:nodeId
            }
            edges.push(edge)
            console.log(`  ${'  '.repeat(depth)} Created edge: ${parentId} → ${nodeId}`)
        }

        //
        let packageDependencies: Record<string, string> = {}
        if(depth===0){
            packageDependencies = dependencies;
        }else{
            //fetching the dependency info from npm
            console.log(`  ${'  '.repeat(depth)}  Fetching from npm...`)
            const packageInfo = await fetchNpmPackage(packageName)
            if(!packageInfo){
                console.log(`  ${' '.repeat(depth)} Failed to fetch package info`);
                return
            }
            console.log(packageInfo);
            packageDependencies = packageInfo.dependencies || {}
        }

        if (Object.keys(packageDependencies).length === 0) {
            console.log(`  ${'  '.repeat(depth)} No dependencies`)
            return
        }
        const depsToFetch = Object.entries(packageDependencies).slice(0, 5)


        for (const [depName, depVersion] of depsToFetch) {
            const cleanVersion = depVersion.replace(/[\^~><=]/g, '')
            await traverse(depName, cleanVersion, depth + 1, nodeId)
        }
        console.log(`  ${'  '.repeat(depth)}  ✓ Done processing ${packageName}`)
    }

    await traverse(rootName, rootVersion, 0, null)

    return {
    nodes,
    edges,
    totalNodes: nodes.length,
    maxDepth: nodes.length > 0?Math.max(...nodes.map(node=>node.depth)):0
  }
}