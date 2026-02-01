
export interface packageJson {
    name: string
    version: string
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
    peerDependencies?: Record<string, string>
}

export interface parsedPackageData {
    name: string
    version: string
    dependencies: Record<string, string>
    devDependencies: Record<string, string>
    peerDependencies: Record<string, string>
    totalDependencies: number
}

export interface NpmPackageInfo {
    name:string
    version:string
    description?:string
    homepage?: string
    license?: string
    repository?:{
        type:string
        url:string
    }
    bugs?: {
        url: string
    }
    dependencies?:Record<string, string>
    devDependencies?:Record<string, string>
    peerDependencies?: Record<string, string>
    dist?: {
        tarball: string
        shasum: string
        integrity: string
    }
    maintainers?: Array<{
        name: string
        email: string
    }>
    keywords?: string[]
    main?: string
    engines?: Record<string, string>
}