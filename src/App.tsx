import { useState } from 'react'
import { parsedPackageJson, getExamplePackageJson } from './utils/packageParse'
import type { parsedPackageData, DependencyGraph as DependencyGraphType } from './types/package.types'
import { fetchMultiplePackages } from './utils/npmApi';
import { buildDependencyTree } from './utils/dependencyTree';
import { DependencyGraph } from './components/DependencyGraph';


function App() {
  const [packageInput, setPackageInput] = useState('')
  const [parsedData, setParsedData] = useState<parsedPackageData | null>(null)
  const [graphData, setGraphData] = useState<DependencyGraphType | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

                          
  const loadExample = ()=>{
    setPackageInput(getExamplePackageJson());
    setParsedData(null);
    setError('');
    setGraphData(null);
  } 

  const handleAnalyze = async ()=>{
    setError('');
    setParsedData(null);
    setGraphData(null)
    setLoading(true)
    try{
      const parsed = parsedPackageJson(packageInput);
      setParsedData(parsed);
      const graph = await buildDependencyTree(
        parsed.name,
        parsed.version,
        parsed.dependencies,
        4
      )
      setGraphData(graph)
      console.log(`Graph Data: ${graph}`);
    }catch(err){
      if(err instanceof Error){
        setError(err.message);
      }else{
        setError("Invalid JSON format");
      }
    } finally{
      setLoading(false)
    }
  }

  return (
    <div className='h-screen bg-black text-white flex flex-col overflow-hidden'>
      <header className="border-b border-gray-200 p-8 bg-white sticky top-0 z-50">
        <div className='max-w-6xl mx-auto'>
        <h1 className="text-4xl font-light tracking-tight text-black">Dependency Graph Explorer</h1>
        <p className="text-gray-600 text-sm mt-2 font-light">
          Visualize npm package dependencies
        </p>
        </div>
      </header>
      <main className='p-8 flex-1 overflow-y-auto'>
        <div className='max-w-6xl mx-auto space-y-6'>

            <div className="bg-white text-black rounded-lg p-8 border border-gray-200 shadow-sm">
              <label className='block text-xs font-semibold mb-3 tracking-wider text-gray-700 uppercase'>PACKAGE.JSON:</label>
              <textarea 
              value={packageInput}
              onChange={(e)=>setPackageInput(e.target.value)}
              placeholder="Paste your package.json here..."
              spellCheck={false}
              className='w-full h-64 p-5 text-black border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none transition-all duration-200'/>
          

              <div className='flex gap-3 mt-4'>
                <button 
                  disabled={loading || !packageInput.trim()} 
                  onClick={handleAnalyze}
                  className='flex-1 bg-black text-white px-6 py-3 rounded-lg font-medium cursor-pointer hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200'>
                  {loading? "Analyzing...":"Analyze Dependencies"}
                </button>
                <button 
                className='px-6 py-3 rounded-lg font-medium border cursor-pointer border-gray-300 hover:border-black hover:bg-gray-50 transition-all duration-200 hover:shadow-sm'
                onClick={loadExample}>
                  Load Example
                </button>
              </div>

              {
                packageInput && (
                  <div className='flex gap-4 text-gray-500 mt-4 text-xs font-mono'>
                    <span>{packageInput.length} characters</span>
                    <span>{packageInput.split('\n').length} lines</span>
                  </div>
                )
              }
            </div>

            {error && (
              <div className='bg-red-50 border border-red-200 text-red-800 rounded-lg p-4'>
                <p className="font-medium">Error parsing JSON</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            )}

            {loading && (
              <div className="bg-white text-black rounded-lg p-8 border border-gray-200 shadow-sm">
                <div className="text-center">
                  <p className="text-gray-600 mb-2">Building dependency tree...</p>
                  <p className="text-sm text-gray-400">This may take a few seconds</p>
                </div>
              </div>
            )}

            {graphData && !loading && (
              <div className="bg-white text-black rounded-lg p-8 border border-gray-200 shadow-sm">
                <h2 className="text-2xl font-light mb-6">Dependency Graph</h2>
                
                <div className="grid grid-cols-3 gap-8 mb-8 pb-8 border-b border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500 mb-1 tracking-wide uppercase">TOTAL PACKAGES</p>
                    <p className="text-2xl font-medium">{graphData.totalNodes}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1 tracking-wide uppercase">CONNECTIONS</p>
                    <p className="text-2xl font-medium">{graphData.edges.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1 tracking-wide uppercase">MAX DEPTH</p>
                    <p className="text-2xl font-medium">{graphData.maxDepth}</p>
                  </div>
                </div>
                <DependencyGraph data={graphData} />
              </div>
            )}

            {parsedData && !loading && (
              <div className='bg-white text-black rounded-lg p-8 border border-gray-200 shadow-sm'>
                <h1 className='bg-white text-black rounded-lg p-8 mb-4 border border-gray-200 text-2xl'>Analysis Results</h1>

                <div className="grid grid-cols-3 gap-8 mb-8 pb-8 border-b border-gray-200">
                  <div>
                    <p className='text-xs text-gray-500 mb-1 tracking-wide'>PACKAGE NAME</p>
                    <p className="text-lg font-medium">{parsedData.name}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1 tracking-wide">VERSION</p>
                    <p className="text-lg font-medium">{parsedData.version}</p>
                  </div>

                  <div>
                    <p className='text-xs text-gray-500 mb-1 tracking-wide'>TOTAL DEPENDENCIES</p>
                    <p className='text-lg font-medium'>{parsedData.totalDependencies}</p>
                  </div>

                </div>

                {
                  Object.keys(parsedData.dependencies).length>0 && (
                    <div className='mb-6'>
                      <h3 className='text-sm font-medium mb-3 tracking-wide'>DEPENDENCIES</h3>
                      <div className='bg-gray-50 rounded-lg p-4 space-y-2'>
                        {Object.entries(parsedData.dependencies).map(([pkg,version])=>(
                          <div key={pkg} className='flex justify-between items-center py-2 px-3 -mx-3 rounded hover:bg-white transition-colors duration-150'>
                            <span className="font-mono text-sm">{pkg}</span>
                            <span className="text-sm text-gray-500">{version}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                }

                {
                  parsedData.devDependencies && Object.keys(parsedData.devDependencies).length > 0 && (
                    <div className=''>
                      <h3 className="text-sm font-medium mb-3 tracking-wide">DEV DEPENDENCIES</h3>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        {Object.entries(parsedData.devDependencies).map(([pkg, version]) => (
                          <div key={pkg} className="flex justify-between items-center py-2 px-3 -mx-3 rounded hover:bg-white transition-colors duration-150">
                            <span className="font-mono text-sm">{pkg}</span>
                            <span className="text-sm text-gray-500">{version}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                }

                {
                  parsedData.peerDependencies && Object.keys(parsedData.peerDependencies).length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-sm font-medium mb-3 tracking-wide">PEER DEPENDENCIES</h3>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        {Object.entries(parsedData.peerDependencies).map(([pkg, version]) => (
                          <div key={pkg} className="flex justify-between items-center py-2 px-3 py-2 px-3 -mx-3 rounded hover:bg-white transition-colors duration-150">
                            <span className="font-mono text-sm">{pkg}</span>
                            <span className="text-sm text-gray-500">{version}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                }

              </div>
            )}

        </div>
      </main>
    </div>
  )
}

export default App
