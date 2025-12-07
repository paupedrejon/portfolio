"use client";

import { useEffect, useRef, useState } from "react";

interface DiagramNode {
  id: string;
  label: string;
  color: string;
}

interface DiagramEdge {
  from: string;
  to: string;
}

interface DiagramData {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

interface DiagramRendererProps {
  data: DiagramData;
  colorTheme: "dark" | "light";
}

export default function DiagramRenderer({ data, colorTheme }: DiagramRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || !svgRef.current) {
      console.warn('DiagramRenderer: Missing container or SVG ref');
      return;
    }
    
    if (!data || !data.nodes || !Array.isArray(data.nodes) || data.nodes.length === 0) {
      console.warn('DiagramRenderer: Invalid or empty data', data);
      return;
    }

    const svg = svgRef.current;
    
    // Limpiar SVG anterior
    svg.innerHTML = "";

    const nodes = data.nodes;
    const edges = data.edges || [];

    console.log('DiagramRenderer: Rendering diagram with', nodes.length, 'nodes and', edges.length, 'edges');

    // Crear defs PRIMERO (gradientes, filtros, marcadores)
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    
    // Filtro de sombra profesional mejorado
    const shadowFilter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
    shadowFilter.setAttribute("id", "nodeShadow");
    shadowFilter.setAttribute("x", "-50%");
    shadowFilter.setAttribute("y", "-50%");
    shadowFilter.setAttribute("width", "200%");
    shadowFilter.setAttribute("height", "200%");
    
    const feGaussianBlur = document.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
    feGaussianBlur.setAttribute("in", "SourceAlpha");
    feGaussianBlur.setAttribute("stdDeviation", "8");
    shadowFilter.appendChild(feGaussianBlur);
    
    const feOffset = document.createElementNS("http://www.w3.org/2000/svg", "feOffset");
    feOffset.setAttribute("dx", "0");
    feOffset.setAttribute("dy", "6");
    feOffset.setAttribute("result", "offsetBlur");
    shadowFilter.appendChild(feOffset);
    
    const feFlood = document.createElementNS("http://www.w3.org/2000/svg", "feFlood");
    feFlood.setAttribute("flood-color", colorTheme === "dark" ? "#000000" : "#000000");
    feFlood.setAttribute("flood-opacity", colorTheme === "dark" ? "0.5" : "0.25");
    shadowFilter.appendChild(feFlood);
    
    const feComposite = document.createElementNS("http://www.w3.org/2000/svg", "feComposite");
    feComposite.setAttribute("in", "flood");
    feComposite.setAttribute("in2", "offsetBlur");
    feComposite.setAttribute("operator", "in");
    shadowFilter.appendChild(feComposite);
    
    defs.appendChild(shadowFilter);
    
    // Filtro de glow mejorado para hover
    const glowFilter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
    glowFilter.setAttribute("id", "nodeGlow");
    glowFilter.setAttribute("x", "-100%");
    glowFilter.setAttribute("y", "-100%");
    glowFilter.setAttribute("width", "300%");
    glowFilter.setAttribute("height", "300%");
    
    const feGaussianBlurGlow = document.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
    feGaussianBlurGlow.setAttribute("stdDeviation", "12");
    feGaussianBlurGlow.setAttribute("result", "coloredBlur");
    glowFilter.appendChild(feGaussianBlurGlow);
    
    const feMerge = document.createElementNS("http://www.w3.org/2000/svg", "feMerge");
    const feMergeNode1 = document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
    feMergeNode1.setAttribute("in", "coloredBlur");
    feMerge.appendChild(feMergeNode1);
    const feMergeNode2 = document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
    feMergeNode2.setAttribute("in", "SourceGraphic");
    feMerge.appendChild(feMergeNode2);
    glowFilter.appendChild(feMerge);
    
    defs.appendChild(glowFilter);
    
    // Marcador de flecha elegante y visible
    const arrowMarker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
    arrowMarker.setAttribute("id", "arrowhead");
    arrowMarker.setAttribute("markerWidth", "14");
    arrowMarker.setAttribute("markerHeight", "14");
    arrowMarker.setAttribute("refX", "7");
    arrowMarker.setAttribute("refY", "7");
    arrowMarker.setAttribute("orient", "auto");
    arrowMarker.setAttribute("markerUnits", "userSpaceOnUse");
    
    const arrowPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    arrowPath.setAttribute("d", "M 0,0 L 14,7 L 0,14 Z");
    arrowPath.setAttribute("fill", colorTheme === "dark" ? "#94a3b8" : "#64748b");
    arrowMarker.appendChild(arrowPath);
    defs.appendChild(arrowMarker);
    
    svg.appendChild(defs);

    // Calcular layout jerárquico mejorado
    const nodePositions: Record<string, { x: number; y: number }> = {};
    const nodeWidth = 340;
    const nodeHeight = 140;
    const horizontalSpacing = 440;
    const verticalSpacing = 220;
    
    // Encontrar nodo raíz
    const hasIncoming: Record<string, boolean> = {};
    edges.forEach(edge => {
      hasIncoming[edge.to] = true;
    });
    
    const rootNodes = nodes.filter(node => !hasIncoming[node.id]);
    const rootNode = rootNodes[0] || nodes[0];
    
    // Layout en niveles (BFS)
    const levels: DiagramNode[][] = [];
    const visited = new Set<string>();
    const queue: { node: DiagramNode; level: number }[] = [{ node: rootNode, level: 0 }];
    visited.add(rootNode.id);
    
    while (queue.length > 0) {
      const { node, level } = queue.shift()!;
      
      if (!levels[level]) levels[level] = [];
      levels[level].push(node);
      
      edges.forEach(edge => {
        if (edge.from === node.id && !visited.has(edge.to)) {
          const childNode = nodes.find(n => n.id === edge.to);
          if (childNode) {
            visited.add(childNode.id);
            queue.push({ node: childNode, level: level + 1 });
          }
        }
      });
    }
    
    // Añadir nodos no visitados
    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        if (!levels[0]) levels[0] = [];
        levels[0].push(node);
      }
    });
    
    // Calcular posiciones centradas
    const padding = 100;
    const maxLevelWidth = Math.max(...levels.map(l => l.length)) * horizontalSpacing;
    
    levels.forEach((levelNodes, levelIndex) => {
      const levelY = padding + levelIndex * verticalSpacing;
      const totalWidth = (levelNodes.length - 1) * horizontalSpacing;
      // Centrar cada nivel horizontalmente
      const startX = padding + (maxLevelWidth - totalWidth) / 2;
      
      levelNodes.forEach((node, nodeIndex) => {
        const x = startX + nodeIndex * horizontalSpacing;
        nodePositions[node.id] = { x, y: levelY };
      });
    });
    
    // Calcular dimensiones del SVG
    const minX = Math.min(...Object.values(nodePositions).map(p => p.x));
    const maxX = Math.max(...Object.values(nodePositions).map(p => p.x)) + nodeWidth;
    const minY = Math.min(...Object.values(nodePositions).map(p => p.y));
    const maxY = Math.max(...Object.values(nodePositions).map(p => p.y)) + nodeHeight;
    
    // Añadir padding uniforme
    const svgWidth = maxX - minX + padding * 2;
    const svgHeight = maxY - minY + padding * 2;
    
    // Ajustar posiciones para centrar el contenido
    const offsetX = padding - minX;
    const offsetY = padding - minY;
    
    // Aplicar offset a todas las posiciones
    Object.keys(nodePositions).forEach(nodeId => {
      nodePositions[nodeId].x += offsetX;
      nodePositions[nodeId].y += offsetY;
    });
    
    svg.setAttribute("width", svgWidth.toString());
    svg.setAttribute("height", svgHeight.toString());
    svg.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`);
    
    // Dibujar conexiones con líneas más visibles y elegantes
    edges.forEach((edge, index) => {
      const fromPos = nodePositions[edge.from];
      const toPos = nodePositions[edge.to];
      
      if (fromPos && toPos) {
        const x1 = fromPos.x + nodeWidth / 2;
        const y1 = fromPos.y + nodeHeight;
        const x2 = toPos.x + nodeWidth / 2;
        const y2 = toPos.y;
        
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const midY = (y1 + y2) / 2;
        const controlOffset = Math.abs(y2 - y1) * 0.3;
        const pathData = `M ${x1} ${y1} C ${x1} ${y1 + controlOffset}, ${x2} ${y2 - controlOffset}, ${x2} ${y2}`;
        path.setAttribute("d", pathData);
        // Líneas más visibles - estilo hover por defecto (sin animación)
        path.setAttribute("stroke", "#8b5cf6");
        path.setAttribute("stroke-width", "3.5");
        path.setAttribute("stroke-dasharray", "0"); // Línea sólida
        path.setAttribute("fill", "none");
        path.setAttribute("opacity", "1");
        path.setAttribute("marker-end", "url(#arrowhead)");
        path.style.transition = "none"; // Sin animación
        svg.appendChild(path);
      }
    });
    
    // Dibujar nodos con diseño profesional mejorado
    nodes.forEach((node, nodeIndex) => {
      const pos = nodePositions[node.id];
      if (!pos) return;
      
      const isHovered = hoveredNode === node.id;
      const isRoot = rootNode.id === node.id;
      
      const nodeGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      nodeGroup.setAttribute("class", "diagram-node");
      nodeGroup.setAttribute("data-node-id", node.id);
      nodeGroup.style.cursor = "pointer";
      
      // Determinar tamaño del nodo
      const width = isRoot ? nodeWidth * 1.15 : nodeWidth;
      const height = isRoot ? nodeHeight * 1.1 : nodeHeight;
      
      // Rectángulo del nodo con diseño moderno y profesional
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      const rectX = pos.x - (width - nodeWidth) / 2;
      const rectY = pos.y;
      rect.setAttribute("x", rectX.toString());
      rect.setAttribute("y", rectY.toString());
      rect.setAttribute("width", width.toString());
      rect.setAttribute("height", height.toString());
      rect.setAttribute("rx", "18");
      rect.setAttribute("ry", "18");
      
      // Colores profesionales - definir colorMap una sola vez
      const colorMapDark: Record<string, { bg: string; border: string; hoverBorder: string }> = {
        "#6366f1": { bg: "rgba(99, 102, 241, 0.85)", border: "#6366f1", hoverBorder: "#8b5cf6" },
        "#8b5cf6": { bg: "rgba(139, 92, 246, 0.85)", border: "#8b5cf6", hoverBorder: "#a78bfa" },
        "#10b981": { bg: "rgba(16, 185, 129, 0.85)", border: "#10b981", hoverBorder: "#34d399" },
        "#06b6d4": { bg: "rgba(6, 182, 212, 0.85)", border: "#06b6d4", hoverBorder: "#22d3ee" },
        "#f59e0b": { bg: "rgba(245, 158, 11, 0.85)", border: "#f59e0b", hoverBorder: "#fbbf24" }
      };
      
      const colorMapLight: Record<string, { bg: string; border: string; hoverBorder: string }> = {
        "#6366f1": { bg: "#eef2ff", border: "#6366f1", hoverBorder: "#8b5cf6" },
        "#8b5cf6": { bg: "#f3e8ff", border: "#8b5cf6", hoverBorder: "#a78bfa" },
        "#10b981": { bg: "#ecfdf5", border: "#10b981", hoverBorder: "#34d399" },
        "#06b6d4": { bg: "#ecfeff", border: "#06b6d4", hoverBorder: "#22d3ee" },
        "#f59e0b": { bg: "#fffbeb", border: "#f59e0b", hoverBorder: "#fbbf24" }
      };
      
      const colorMap = colorTheme === "dark" ? colorMapDark : colorMapLight;
      const colors = colorMap[node.color] || colorMap["#6366f1"];
      
      // Estilo por defecto igual al hover - colores más opacos para que no se vean las líneas
      const bgColor = isRoot 
        ? (colorTheme === "dark" ? "rgba(99, 102, 241, 0.9)" : "#eef2ff")
        : colors.bg; // Ya tiene 0.85 de opacidad en modo oscuro
      const borderColor = colors.hoverBorder; // Usar color hover por defecto (más vibrante)
      const borderWidth = "4"; // Borde grueso igual al hover
      
      rect.setAttribute("fill", bgColor);
      rect.setAttribute("stroke", borderColor);
      rect.setAttribute("stroke-width", borderWidth);
      
      // Aplicar filtro glow por defecto (estilo hover)
      rect.setAttribute("filter", "url(#nodeGlow)");
      rect.style.transition = "none"; // Sin animación
      
      nodeGroup.appendChild(rect);
      
      // Texto del nodo - diseño limpio y legible
      const words = node.label.split(' ');
      const maxCharsPerLine = 18;
      let currentLine = '';
      let lines: string[] = [];
      
      words.forEach(word => {
        if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
          currentLine = currentLine ? currentLine + ' ' + word : word;
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        }
      });
      if (currentLine) lines.push(currentLine);
      
      const textGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      
      if (lines.length > 1) {
        const lineHeight = 34;
        const startY = rectY + height / 2 - (lines.length - 1) * lineHeight / 2;
        lines.forEach((line, index) => {
          const lineText = document.createElementNS("http://www.w3.org/2000/svg", "text");
          lineText.setAttribute("x", (rectX + width / 2).toString());
          lineText.setAttribute("y", (startY + index * lineHeight).toString());
          lineText.setAttribute("text-anchor", "middle");
          lineText.setAttribute("dominant-baseline", "middle");
          lineText.setAttribute("font-size", isRoot ? "38" : "34");
          lineText.setAttribute("font-weight", isRoot ? "700" : "600");
          lineText.setAttribute("font-family", "system-ui, -apple-system, 'Segoe UI', sans-serif");
          lineText.setAttribute("fill", colorTheme === "dark" ? "#f1f5f9" : "#0f172a");
          lineText.setAttribute("letter-spacing", "-0.3");
          lineText.textContent = line;
          textGroup.appendChild(lineText);
        });
      } else {
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", (rectX + width / 2).toString());
        text.setAttribute("y", (rectY + height / 2).toString());
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("dominant-baseline", "middle");
        text.setAttribute("font-size", isRoot ? "42" : "38");
        text.setAttribute("font-weight", isRoot ? "700" : "600");
        text.setAttribute("font-family", "system-ui, -apple-system, 'Segoe UI', sans-serif");
        text.setAttribute("fill", colorTheme === "dark" ? "#f1f5f9" : "#0f172a");
        text.setAttribute("letter-spacing", "-0.3");
        text.textContent = node.label;
        textGroup.appendChild(text);
      }
      
      nodeGroup.appendChild(textGroup);
      svg.appendChild(nodeGroup);
      
      // Sin animaciones - estilo estático
      nodeGroup.style.transition = "none";
      rect.style.transition = "none";
    });
    
  }, [data, colorTheme, hoveredNode]);

  if (!data || !data.nodes || data.nodes.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "4rem 2rem",
        margin: "3rem 0",
        background: colorTheme === "dark"
          ? "linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.98))"
          : "linear-gradient(135deg, rgba(255, 255, 255, 0.99), rgba(248, 250, 252, 0.99))",
        borderRadius: "24px",
        border: `2px solid ${colorTheme === "dark" ? "rgba(71, 85, 105, 0.4)" : "rgba(203, 213, 225, 0.6)"}`,
        boxShadow: colorTheme === "dark"
          ? "0 20px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
          : "0 20px 60px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
        overflow: "auto",
        minHeight: "400px",
        position: "relative",
      }}
    >
      {/* Efecto de brillo sutil */}
      <div
        style={{
          position: "absolute",
          inset: "0",
          background: colorTheme === "dark"
            ? "radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.1) 0%, transparent 70%)"
            : "radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.05) 0%, transparent 70%)",
          borderRadius: "24px",
          pointerEvents: "none",
        }}
      />
      <svg
        ref={svgRef}
        style={{
          width: "100%",
          height: "auto",
          maxWidth: "100%",
          position: "relative",
          zIndex: 1,
          display: "block",
          margin: "0 auto",
        }}
      />
    </div>
  );
}
