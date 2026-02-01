import type { NpmPackageInfo } from "../types/package.types";

export const fetchNpmPackage = async(
    packageName:string
):Promise<NpmPackageInfo | null> =>{
    try{
        const response = await fetch(`https://registry.npmjs.org/${packageName.trim()}`);
        if(!response.ok){
            throw new Error(`Package not found: ${packageName}`);
        }
        const data = await response.json()

        // console.log(data);
        // console.log(data.versions);

        const latestVersion = data['dist-tags']?.latest || Object.keys(data.versions || {}).pop()

        if(!latestVersion){
            console.log(`No version found for ${packageName.trim()}`);
            return null;
        }
        console.log(latestVersion);

        const versionData = data.versions?.[latestVersion];

        if (!versionData) {
            return null
        }

        return {
            name: versionData.name,
            version: versionData.version,
            description: versionData.description,
            homepage: versionData.homepage,
            license: versionData.license,
            repository: versionData.repository,
            bugs: versionData.bugs,
            dependencies: versionData.dependencies,
            devDependencies: versionData.devDependencies,
            peerDependencies: versionData.peerDependencies,
            dist: versionData.dist,
            maintainers: versionData.maintainers,
            keywords: versionData.keywords,
            main: versionData.main,
            engines: versionData.engines
        }
    }catch(error){
        console.error(`Failed to fetch ${packageName}:`, error)
        return null
    }
}

export const fetchMultiplePackages = async (
    packages: Record<string,string>
): Promise<Map<string, NpmPackageInfo>> => {
    const packageMap = new Map<string, NpmPackageInfo>()

    const fetchPromises = Object.keys(packages).map(async (name) => {
    const info = await fetchNpmPackage(name)
    if (info) {
      packageMap.set(name, info)
    }
    })
    await Promise.all(fetchPromises)
    return packageMap;
}