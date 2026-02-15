import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import type { DependencyGraph as GraphData, DependencyNode } from '../types/package.types'

interface Props {
  data: GraphData
}

export const DependencyGraph = ({ data }: Props) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)

  useEffect(() => {
    if (!svgRef.current || data.nodes.length === 0) return

    d3.select(svgRef.current).selectAll('*').remove()

    const width = 800
    const height = 600

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])

    console.log('Setting up zoom & pan...')

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })

    zoomRef.current = zoom
    svg.call(zoom)

    console.log('✓ Zoom & pan enabled')

    const g = svg.append('g')

    console.log('Drawing edges...')
    const link = g.selectAll('line')
      .data(data.edges)
      .enter()
      .append('line')
      .attr('stroke', '#999')
      .attr('stroke-width', 1)
      .attr('stroke-opacity', 0.6)

    console.log('Drew', data.edges.length, 'edges')

    // Draw nodes
    console.log('Drawing nodes...')
    const node = g.selectAll('circle')
      .data(data.nodes)
      .enter()
      .append('circle')
      .attr('r', d => {
        if (d.type === 'root') return 18
        if (d.depth === 1) return 14
        if (d.depth === 2) return 12
        return 10
      })
      .attr('fill', d => {
        if (d.type === 'root') return '#000000'
        if (d.depth === 1) return '#3b82f6'
        if (d.depth === 2) return '#8b5cf6'
        if (d.depth === 3) return '#355e4a'
        return '#88c139'
      })
      .attr('stroke', '#000')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')

    console.log('Drew', data.nodes.length, 'nodes')

    console.log('Drawing labels...')
    const label = g.selectAll('text')
      .data(data.nodes)
      .enter()
      .append('text')
      .text(d => d.name)
      .attr('font-size', d => d.depth >= 3 ? '9px' : '10px')
      .attr('font-family', 'monospace')
      .attr('fill', '#000')
      .attr('text-anchor', 'middle')
      .attr('pointer-events', 'none')

    console.log('Drew', data.nodes.length, 'labels')

    console.log('Creating force simulation...')

    const simulation = d3.forceSimulation(data.nodes)
      .force('link', d3.forceLink(data.edges)
        .id((d: any) => d.id)
        .distance(80)
      )
      .force('charge', d3.forceManyBody()
        .strength(-200)
      )
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide()
        .radius(20)
      )
      .force('bounds', () => {
        data.nodes.forEach(node => {
          const radius = node.type === 'root' ? 18 : 14
          const padding = 20
          node.x = Math.max(padding + radius, Math.min(width - padding - radius, node.x || 0))
          node.y = Math.max(padding + radius, Math.min(height - padding - radius, node.y || 0))
        })
      })

    console.log('Force simulation created')

    const drag = d3.drag<SVGCircleElement, any>()
      .on('start', dragStarted)
      .on('drag', dragged)
      .on('end', dragEnded)

    node.call(drag)

    console.log('Drag enabled')

    function dragStarted(event: any, d: DependencyNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      d.fx = d.x
      d.fy = d.y

      d3.select(event.sourceEvent.target)
        .attr('stroke', '#000')
        .attr('stroke-width', 3)
    }

    function dragged(event: any, d: DependencyNode) {
      d.fx = event.x
      d.fy = event.y
    }

    function dragEnded(event: any, d: DependencyNode) {
      if (!event.active) simulation.alphaTarget(0)
      d.fx = null
      d.fy = null

      d3.select(event.sourceEvent.target)
        .attr('stroke', '#000')
        .attr('stroke-width', 1)
    }

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y)

      node
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y)

      label
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y + 25)
    })

    return () => {
      simulation.stop()
    }
  }, [data])

  const handleResetZoom = () => {
    if (zoomRef.current && svgRef.current) {
      const svg = d3.select(svgRef.current)
      svg.transition()
        .duration(750)
        .call(zoomRef.current.transform, d3.zoomIdentity)
    }
  }

  const handleZoomIn = () => {
    if (zoomRef.current && svgRef.current) {
      const svg = d3.select(svgRef.current)
      svg.transition()
        .duration(300)
        .call(zoomRef.current.scaleBy, 1.2)
    }
  }

  const handleZoomOut = () => {
    if (zoomRef.current && svgRef.current) {
      const svg = d3.select(svgRef.current)
      svg.transition()
        .duration(300)
        .call(zoomRef.current.scaleBy, 0.8)
    }
  }

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden relative">
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={handleZoomIn}
          className="bg-white border border-gray-300 w-8 h-8 rounded hover:bg-gray-100 transition-colors font-bold text-lg cursor-pointer"
          title="Zoom in"
        >
          +
        </button>

        <button
          onClick={handleZoomOut}
          className="bg-white border border-gray-300 w-8 h-8 rounded hover:bg-gray-100 transition-colors font-bold text-lg cursor-pointer"
          title="Zoom out"
        >
          −
        </button>

        <button
          onClick={handleResetZoom}
          className="bg-white border border-gray-300 px-3 h-8 rounded hover:bg-gray-100 transition-colors text-sm cursor-pointer"
          title="Reset view"
        >
          Reset
        </button>
      </div>

      <svg ref={svgRef} className="w-full h-[600px]" />
    </div>
  )
}