import type { packageJson, parsedPackageData } from "../types/package.types";

export const parsedPackageJson = (jsonString:string):parsedPackageData=>{
    const data: packageJson = JSON.parse(jsonString);
    if(!data.name){
        throw new Error('package.json must have a "name" field');
    }

    const dependencies = data.dependencies || {}
    const devDependencies = data.devDependencies || {}
    const peerDependencies = data.peerDependencies || {}

    const totalDependencies = 
    Object.keys(dependencies).length +
    Object.keys(devDependencies).length +
    Object.keys(peerDependencies).length
  
    return {
        name: data.name,
        version: data.version || '0.0.0',
        dependencies,
        devDependencies,
        peerDependencies,
        totalDependencies
    }
}

export const getExamplePackageJson = ():string=>{
    return JSON.stringify({
                              "name": "my-react-app",
                              "version": "1.0.0",
                              "dependencies": {
                                "react": "^18.2.0",
                                "react-dom": "^18.2.0",
                                "axios": "^1.4.0"
                              },
                              "devDependencies": {
                                "typescript": "^5.0.0",
                                "vite": "^4.0.0"
                              }
                            },null,2); 
}