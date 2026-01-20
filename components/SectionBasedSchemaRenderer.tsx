"use client";

import React from "react";

interface SchemaNode {
  id: string;
  label: string;
  color: string;
  description?: string;
  letter?: string;
  characteristic?: string;
}

interface SchemaEdge {
  from: string;
  to: string;
}

interface SectionBasedSchemaData {
  nodes: SchemaNode[];
  edges: SchemaEdge[];
  title?: string;
}

interface SectionBasedSchemaRendererProps {
  data: SectionBasedSchemaData;
  colorTheme: "dark" | "light";
}

export default function SectionBasedSchemaRenderer({ data, colorTheme }: SectionBasedSchemaRendererProps) {
  console.log('SectionBasedSchemaRenderer - Data received:', data);
  
  if (!data || !data.nodes || data.nodes.length === 0) {
    console.warn('SectionBasedSchemaRenderer - No data or nodes');
    return null;
  }

  // Encontrar nodos raíz (sin conexiones entrantes)
  const hasIncoming: Record<string, boolean> = {};
  (data.edges || []).forEach(edge => {
    hasIncoming[edge.to] = true;
  });

  const rootNodes = data.nodes.filter(node => !hasIncoming[node.id]);
  const rootNode = rootNodes[0] || data.nodes[0];

  // Detectar si es una comparación - buscar en título
  const title = (data.title || rootNode.label || "").toLowerCase();
  let isComparison = title.includes(" vs ") || title.includes(" versus") || 
                     title.includes(" contra ") || title.includes(" vs. ") ||
                     title.includes("comparación entre") || title.includes("comparacion entre") ||
                     title.includes("comparar") || title.includes("comparación") ||
                     title.match(/\bvs\b/i) !== null;
  
  // Si hay exactamente 2 nodos raíz sin conexiones entrantes, es probablemente una comparación
  let comparisonNodes = rootNodes;
  if (!isComparison && rootNodes.length === 2) {
    isComparison = true;
    console.log('SectionBasedSchemaRenderer - Detected comparison by having 2 root nodes:', rootNodes.map(n => n.label));
  }
  
  // Si hay un nodo raíz y exactamente 2 nodos hijos principales, también puede ser una comparación
  if (rootNodes.length === 1) {
    const directChildren = data.nodes.filter(node => {
      if (node.id === rootNodes[0].id) return false;
      return (data.edges || []).some(edge => edge.from === rootNodes[0].id && edge.to === node.id);
    });
    
    // Si hay exactamente 2 hijos directos y el título sugiere comparación O si ya es comparación
    if (directChildren.length === 2 && (
      isComparison || title.includes("comparación") || title.includes("comparar") || 
      title.includes("entre") || title.includes("vs") || title.includes("versus")
    )) {
      isComparison = true;
      comparisonNodes = directChildren;
      console.log('SectionBasedSchemaRenderer - Detected comparison by having root node with 2 direct children:', comparisonNodes.map(n => n.label));
    }
  }
  
  // Si es comparación pero comparisonNodes está vacío o tiene menos de 2 nodos, intentar usar todos los nodos disponibles
  if (isComparison && comparisonNodes.length < 2 && data.nodes.length >= 2) {
    // Si hay un nodo raíz, excluirlo y usar los demás
    if (rootNodes.length > 0) {
      const nonRootNodes = data.nodes.filter(n => n.id !== rootNodes[0].id);
      if (nonRootNodes.length >= 2) {
        comparisonNodes = nonRootNodes.slice(0, 2);
        console.log('SectionBasedSchemaRenderer - Using first 2 non-root nodes as comparison (fallback):', comparisonNodes.map(n => n.label));
      } else {
        // Si no hay suficientes nodos no-raíz, usar los primeros 2 nodos en total
        comparisonNodes = data.nodes.slice(0, 2);
        console.log('SectionBasedSchemaRenderer - Using first 2 nodes as comparison (fallback):', comparisonNodes.map(n => n.label));
      }
    } else {
      // Si no hay nodos raíz, usar los primeros 2 nodos
      comparisonNodes = data.nodes.slice(0, 2);
      console.log('SectionBasedSchemaRenderer - Using first 2 nodes as comparison (no root nodes):', comparisonNodes.map(n => n.label));
    }
  }
  
  // Si es comparación pero no tenemos 2 nodos de comparación, intentar extraerlos del título o usar todos los nodos
  if (isComparison && comparisonNodes.length < 2) {
    // Intentar extraer los nombres de los elementos del título
    const fullTitle = data.title || rootNode.label || "";
    const vsMatch = fullTitle.match(/(.+?)\s+(?:vs|versus|contra|VS)\s+(.+)/i);
    if (vsMatch) {
      const leftName = vsMatch[1].trim();
      const rightName = vsMatch[2].trim();
      
      // Buscar nodos que coincidan con estos nombres
      const leftNode = data.nodes.find(n => 
        n.label.toLowerCase().includes(leftName.toLowerCase()) || 
        leftName.toLowerCase().includes(n.label.toLowerCase())
      );
      const rightNode = data.nodes.find(n => 
        (n.label.toLowerCase().includes(rightName.toLowerCase()) || 
        rightName.toLowerCase().includes(n.label.toLowerCase())) &&
        n.id !== leftNode?.id
      );
      
      if (leftNode && rightNode) {
        comparisonNodes = [leftNode, rightNode];
        console.log('SectionBasedSchemaRenderer - Found comparison nodes from title:', comparisonNodes.map(n => n.label));
      } else if (data.nodes.length >= 2) {
        // Si hay al menos 2 nodos en total, usar los primeros 2 nodos que no sean el raíz (si hay raíz)
        const nonRootNodes = rootNodes.length > 0 
          ? data.nodes.filter(n => n.id !== rootNodes[0].id)
          : data.nodes;
        if (nonRootNodes.length >= 2) {
          comparisonNodes = nonRootNodes.slice(0, 2);
          console.log('SectionBasedSchemaRenderer - Using first 2 non-root nodes as comparison:', comparisonNodes.map(n => n.label));
        } else if (data.nodes.length >= 2) {
          // Si no hay suficientes nodos no-raíz, usar los primeros 2 nodos en total
          comparisonNodes = data.nodes.slice(0, 2);
          console.log('SectionBasedSchemaRenderer - Using first 2 nodes as comparison:', comparisonNodes.map(n => n.label));
        }
      }
    } else if (data.nodes.length >= 2) {
      // Si no hay match del título pero hay al menos 2 nodos, usar los primeros 2
      const nonRootNodes = rootNodes.length > 0 
        ? data.nodes.filter(n => n.id !== rootNodes[0].id)
        : data.nodes;
      if (nonRootNodes.length >= 2) {
        comparisonNodes = nonRootNodes.slice(0, 2);
        console.log('SectionBasedSchemaRenderer - Using first 2 non-root nodes as comparison (no title match):', comparisonNodes.map(n => n.label));
      } else if (data.nodes.length >= 2) {
        comparisonNodes = data.nodes.slice(0, 2);
        console.log('SectionBasedSchemaRenderer - Using first 2 nodes as comparison (no title match):', comparisonNodes.map(n => n.label));
      }
    }
  }

  const bgColor = colorTheme === "dark" 
    ? "rgba(15, 23, 42, 0.98)" 
    : "#ffffff";
  
  const textColor = colorTheme === "dark" ? "#f1f5f9" : "#0f172a";
  const borderColor = colorTheme === "dark" ? "rgba(71, 85, 105, 0.4)" : "rgba(203, 213, 225, 0.6)";

  const circleSize = 320;
  const displayTitle = data.title || rootNode.label || "";

  console.log('SectionBasedSchemaRenderer - Root nodes:', rootNodes.map(n => n.label), 'Is comparison:', isComparison, 'Comparison nodes:', comparisonNodes.map(n => n.label));
  
  // PLANTILLA PARA COMPARACIONES (2 elementos)
  if (isComparison && comparisonNodes.length >= 2) {
    console.log('SectionBasedSchemaRenderer - Rendering comparison schema');
    const leftNode = comparisonNodes[0];
    const rightNode = comparisonNodes[1];
    
    // Obtener nodos hijos de cada elemento para características
    const leftNodeChildren = data.nodes.filter(node => {
      return (data.edges || []).some(edge => edge.from === leftNode.id && edge.to === node.id);
    });
    const rightNodeChildren = data.nodes.filter(node => {
      return (data.edges || []).some(edge => edge.from === rightNode.id && edge.to === node.id);
    });
    
    // Usar el primer hijo como característica, o el label del nodo si no hay hijos
    const leftCharacteristicNode = leftNodeChildren[0];
    const rightCharacteristicNode = rightNodeChildren[0];
    
    // Colores fijos para comparaciones (paleta de 4 colores)
    const comparisonColors = [
      "#a98edf", // Morado pastel
      "#e8bf82", // Naranja/beige pastel
      "#7cd6cb", // Teal/cyan pastel
      "#e196af", // Rosa pastel
    ];
    
    // Usar colores fijos diferentes para cada elemento
    const leftColor = comparisonColors[0]; // Morado para el izquierdo
    const rightColor = comparisonColors[1]; // Naranja para el derecho
    
    // Extraer nombres de elementos
    let leftElement = leftNode.label || "";
    let rightElement = rightNode.label || "";
    const fullTitle = data.title || rootNode.label || "";
    const vsMatch = fullTitle.match(/(.+?)\s+(?:vs|versus|contra|VS)\s+(.+)/i);
    if (vsMatch) {
      leftElement = vsMatch[1].trim();
      rightElement = vsMatch[2].trim();
    }
    leftElement = leftElement.charAt(0).toUpperCase() + leftElement.slice(1);
    rightElement = rightElement.charAt(0).toUpperCase() + rightElement.slice(1);

    // Características para cajas superiores - usar el primer hijo o el label del nodo
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const leftCharacteristic = leftCharacteristicNode?.label?.toUpperCase() || 
      leftNode.characteristic || 
      (leftNode.description ? leftNode.description.split('.')[0].split(':')[0].trim().toUpperCase() : "CARACTERÍSTICA");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const rightCharacteristic = rightCharacteristicNode?.label?.toUpperCase() || 
      rightNode.characteristic || 
      (rightNode.description ? rightNode.description.split('.')[0].split(':')[0].trim().toUpperCase() : "CARACTERÍSTICA");
    
    // Descripciones - usar directamente la descripción del nodo si existe
    let leftDescription = leftNode.description || "";
    let rightDescription = rightNode.description || "";
    
    // Si no hay descripción, intentar obtenerla de los hijos
    if (!leftDescription && leftNodeChildren.length > 0) {
      // Combinar labels de hijos con sus descripciones si las tienen
      leftDescription = leftNodeChildren.map(c => {
        if (c.description) {
          return `${c.label}: ${c.description}`;
        }
        return c.label;
      }).join("\n");
    }
    
    if (!rightDescription && rightNodeChildren.length > 0) {
      // Combinar labels de hijos con sus descripciones si las tienen
      rightDescription = rightNodeChildren.map(c => {
        if (c.description) {
          return `${c.label}: ${c.description}`;
        }
        return c.label;
      }).join("\n");
    }
    
    // Si aún no hay descripción, usar un texto por defecto
    if (!leftDescription) {
      leftDescription = `Características de ${leftElement}.\n${leftNodeChildren.map(c => c.label).join(", ")}.`;
    }
    if (!rightDescription) {
      rightDescription = `Características de ${rightElement}.\n${rightNodeChildren.map(c => c.label).join(", ")}.`;
    }
    
    // Normalizar saltos de línea (por si vienen como \\n en el JSON)
    leftDescription = leftDescription.replace(/\\n/g, '\n');
    rightDescription = rightDescription.replace(/\\n/g, '\n');
    
    console.log('Left description:', leftDescription);
    console.log('Right description:', rightDescription);

    return (
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "3rem 2rem",
          margin: "2rem 0",
          background: bgColor,
          borderRadius: "20px",
          border: `1px solid ${borderColor}`,
          position: "relative",
          overflow: "visible",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "900px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "2rem",
            minHeight: "600px",
          }}
        >
          {/* Círculo central dividido en 2 */}
          <div
            style={{
              position: "relative",
              width: `${circleSize}px`,
              height: `${circleSize}px`,
              zIndex: 5,
            }}
          >
            {/* Círculo base */}
            <div
              style={{
                position: "absolute",
                width: `${circleSize}px`,
                height: `${circleSize}px`,
                borderRadius: "50%",
                border: `2px solid ${colorTheme === "dark" ? "rgba(148, 163, 184, 0.2)" : "rgba(148, 163, 184, 0.3)"}`,
                background: "transparent",
              }}
            />

            {/* Mitad izquierda */}
            <div
              style={{
                position: "absolute",
                width: `${circleSize}px`,
                height: `${circleSize}px`,
                borderRadius: "50%",
                background: leftColor,
                clipPath: "polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%)",
                opacity: 1,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "25%",
                  transform: "translate(-50%, -50%)",
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: leftColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontSize: "3rem",
                  fontWeight: 700,
                }}
              >
                {leftNode.letter || "H"}
              </div>
            </div>

            {/* Mitad derecha */}
            <div
              style={{
                position: "absolute",
                width: `${circleSize}px`,
                height: `${circleSize}px`,
                borderRadius: "50%",
                background: rightColor,
                clipPath: "polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%)",
                opacity: 1,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  right: "25%",
                  transform: "translate(50%, -50%)",
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: rightColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontSize: "3rem",
                  fontWeight: 700,
                }}
              >
                {rightNode.letter || "D"}
              </div>
            </div>

            {/* Línea divisoria vertical */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "50%",
                width: "2px",
                height: "100%",
                background: "#ffffff",
                transform: "translateX(-50%)",
                zIndex: 2,
              }}
            />

            {/* Título "vs" superpuesto */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 10,
              }}
            >
              <div
                style={{
                  padding: "0.5rem 2rem",
                  background: "#ffffff",
                  border: "3px solid #000000",
                  borderRadius: "50px",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1.125rem",
                    fontWeight: 700,
                    color: "#000000",
                    textTransform: "lowercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  vs
                </h3>
              </div>
            </div>
          </div>

          {/* Cajas inferiores con descripciones completas */}
          <div
            style={{
              display: "flex",
              gap: "2rem",
              width: "100%",
              justifyContent: "center",
              marginTop: "1.5rem",
            }}
          >
            {/* Caja izquierda */}
            <div
              style={{
                flex: 1,
                padding: "1.75rem",
                background: colorTheme === "dark" ? "transparent" : "#ffffff",
                border: `4px solid ${leftColor}`,
                borderRadius: "16px",
                maxWidth: "400px",
                minHeight: "280px",
              }}
            >
              <h4
                style={{
                  margin: "0 0 1.5rem 0",
                  fontSize: "1.75rem",
                  fontWeight: 800,
                  color: leftColor,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {leftElement}
              </h4>
              {leftDescription && (
                <div
                  style={{
                    fontSize: "0.9375rem",
                    lineHeight: 1.8,
                    color: textColor,
                    opacity: colorTheme === "dark" ? 0.9 : 0.75,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {leftDescription.split(/\r?\n/).map((line, lineIndex) => {
                    const trimmedLine = line.trim();
                    if (!trimmedLine) return <br key={lineIndex} />;
                    
                    // Detectar si es un título (Ventajas:, Desventajas:)
                    const titleMatch = trimmedLine.match(/^(Ventajas|Desventajas):\s*$/i);
                    if (titleMatch) {
                      return (
                        <h5
                          key={lineIndex}
                          style={{
                            margin: "1.5rem 0 0.75rem 0",
                            fontSize: "1rem",
                            fontWeight: 700,
                            color: leftColor,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {titleMatch[1]}
                        </h5>
                      );
                    }
                    
                    // Detectar si es un elemento de lista (empieza con -)
                    if (trimmedLine.startsWith('-') || trimmedLine.startsWith('•')) {
                      const cleanLine = trimmedLine.replace(/^[-•]\s*/, '');
                      const colonIndex = cleanLine.indexOf(':');
                      
                      if (colonIndex > 0) {
                        const title = cleanLine.substring(0, colonIndex).trim();
                        const description = cleanLine.substring(colonIndex + 1).trim();
                        
                        return (
                          <div
                            key={lineIndex}
                            style={{
                              margin: "0.75rem 0",
                              paddingLeft: "1.25rem",
                              position: "relative",
                            }}
                          >
                            <span
                              style={{
                                position: "absolute",
                                left: "0",
                                color: leftColor,
                                fontWeight: 600,
                              }}
                            >
                              •
                            </span>
                            <strong style={{ color: leftColor, fontWeight: 600 }}>{title}:</strong>
                            {description && (
                              <span style={{ marginLeft: "0.5rem", display: "block", marginTop: "0.25rem" }}>
                                {description}
                              </span>
                            )}
                          </div>
                        );
                      } else {
                        // Si no tiene dos puntos, mostrar como texto normal
                        return (
                          <div
                            key={lineIndex}
                            style={{
                              margin: "0.5rem 0",
                              paddingLeft: "1rem",
                            }}
                          >
                            {cleanLine}
                          </div>
                        );
                      }
                    }
                    
                    // Texto normal - detectar si tiene formato "Etiqueta: descripción"
                    const colonIndex = trimmedLine.indexOf(':');
                    if (colonIndex > 0 && colonIndex < trimmedLine.length - 1) {
                      const label = trimmedLine.substring(0, colonIndex).trim();
                      const description = trimmedLine.substring(colonIndex + 1).trim();
                      
                      return (
                        <p
                          key={lineIndex}
                          style={{
                            margin: "0.75rem 0",
                            lineHeight: 1.6,
                          }}
                        >
                          <strong style={{ color: leftColor, fontWeight: 700, fontSize: "1rem" }}>{label}:</strong> {description}
                        </p>
                      );
                    }
                    
                    // Texto normal sin formato
                    return (
                      <p
                        key={lineIndex}
                        style={{
                          margin: "0.75rem 0",
                          lineHeight: 1.6,
                        }}
                      >
                        {trimmedLine}
                      </p>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Caja derecha */}
            <div
              style={{
                flex: 1,
                padding: "1.75rem",
                background: colorTheme === "dark" ? "transparent" : "#ffffff",
                border: `4px solid ${rightColor}`,
                borderRadius: "16px",
                maxWidth: "400px",
                minHeight: "280px",
              }}
            >
              <h4
                style={{
                  margin: "0 0 1.5rem 0",
                  fontSize: "1.75rem",
                  fontWeight: 800,
                  color: rightColor,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {rightElement}
              </h4>
              {rightDescription && (
                <div
                  style={{
                    fontSize: "0.9375rem",
                    lineHeight: 1.8,
                    color: textColor,
                    opacity: colorTheme === "dark" ? 0.9 : 0.75,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {rightDescription.split(/\r?\n/).map((line, lineIndex) => {
                    const trimmedLine = line.trim();
                    if (!trimmedLine) return <br key={lineIndex} />;
                    
                    // Detectar si es un título (Ventajas:, Desventajas:)
                    const titleMatch = trimmedLine.match(/^(Ventajas|Desventajas):\s*$/i);
                    if (titleMatch) {
                      return (
                        <h5
                          key={lineIndex}
                          style={{
                            margin: "1.5rem 0 0.75rem 0",
                            fontSize: "1rem",
                            fontWeight: 700,
                            color: rightColor,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {titleMatch[1]}
                        </h5>
                      );
                    }
                    
                    // Detectar si es un elemento de lista (empieza con -)
                    if (trimmedLine.startsWith('-') || trimmedLine.startsWith('•')) {
                      const cleanLine = trimmedLine.replace(/^[-•]\s*/, '');
                      const colonIndex = cleanLine.indexOf(':');
                      
                      if (colonIndex > 0) {
                        const title = cleanLine.substring(0, colonIndex).trim();
                        const description = cleanLine.substring(colonIndex + 1).trim();
                        
                        return (
                          <div
                            key={lineIndex}
                            style={{
                              margin: "0.75rem 0",
                              paddingLeft: "1.25rem",
                              position: "relative",
                            }}
                          >
                            <span
                              style={{
                                position: "absolute",
                                left: "0",
                                color: rightColor,
                                fontWeight: 600,
                              }}
                            >
                              •
                            </span>
                            <strong style={{ color: rightColor, fontWeight: 600 }}>{title}:</strong>
                            {description && (
                              <span style={{ marginLeft: "0.5rem", display: "block", marginTop: "0.25rem" }}>
                                {description}
                              </span>
                            )}
                          </div>
                        );
                      } else {
                        // Si no tiene dos puntos, mostrar como texto normal
                        return (
                          <div
                            key={lineIndex}
                            style={{
                              margin: "0.5rem 0",
                              paddingLeft: "1rem",
                            }}
                          >
                            {cleanLine}
                          </div>
                        );
                      }
                    }
                    
                    // Texto normal - detectar si tiene formato "Etiqueta: descripción"
                    const colonIndex = trimmedLine.indexOf(':');
                    if (colonIndex > 0 && colonIndex < trimmedLine.length - 1) {
                      const label = trimmedLine.substring(0, colonIndex).trim();
                      const description = trimmedLine.substring(colonIndex + 1).trim();
                      
                      return (
                        <p
                          key={lineIndex}
                          style={{
                            margin: "0.75rem 0",
                            lineHeight: 1.6,
                          }}
                        >
                          <strong style={{ color: rightColor, fontWeight: 700, fontSize: "1rem" }}>{label}:</strong> {description}
                        </p>
                      );
                    }
                    
                    // Texto normal sin formato
                    return (
                      <p
                        key={lineIndex}
                        style={{
                          margin: "0.75rem 0",
                          lineHeight: 1.6,
                        }}
                      >
                        {trimmedLine}
                      </p>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Obtener nodos hijos para esquemas normales (si no es comparación)
  let childNodes: SchemaNode[] = [];
  if (!isComparison) {
    childNodes = data.nodes.filter(node => {
      if (rootNodes.includes(node)) return false;
      if ((data.edges || []).length === 0) {
        return true;
      }
      return (data.edges || []).some(edge => rootNodes.some(rn => edge.from === rn.id && edge.to === node.id));
    });
    
    if (childNodes.length === 0 && data.nodes.length > rootNodes.length) {
      childNodes = data.nodes.filter(node => !rootNodes.includes(node));
    }
  }

  // PLANTILLA PARA ESQUEMAS NORMALES (4 elementos) - Diseño de la segunda imagen
  if (!isComparison && childNodes.length >= 4) {
    console.log('SectionBasedSchemaRenderer - Rendering 4-element schema');
    const categories = childNodes.slice(0, 4);
    
    // Colores pasteles fijos para los 4 cuadrantes
    const quadrantColors = [
      "#a98edf", // Morado pastel (top-left)
      "#e8bf82", // Naranja/beige pastel (top-right)
      "#7cd6cb", // Teal/cyan pastel (bottom-left)
      "#e196af", // Rosa pastel (bottom-right)
    ];

    const letters = ["H", "D", "T", "C"];

    const getQuadrantColor = (index: number, nodeColor?: string) => {
      if (nodeColor) {
        return nodeColor;
      }
      return quadrantColors[index % quadrantColors.length];
    };

    return (
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "3rem 2rem",
          margin: "2rem 0",
          background: bgColor,
          borderRadius: "20px",
          border: `1px solid ${borderColor}`,
          position: "relative",
          overflow: "visible",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "900px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "2rem",
            minHeight: "600px",
          }}
        >
          {/* Círculo central dividido en 4 cuadrantes */}
          <div
            style={{
              position: "relative",
              width: `${circleSize}px`,
              height: `${circleSize}px`,
              zIndex: 5,
            }}
          >
            {/* Círculo base */}
            <div
              style={{
                position: "absolute",
                width: `${circleSize}px`,
                height: `${circleSize}px`,
                borderRadius: "50%",
                border: `2px solid ${colorTheme === "dark" ? "rgba(148, 163, 184, 0.2)" : "rgba(148, 163, 184, 0.3)"}`,
                background: "transparent",
              }}
            />

            {/* Cuadrantes */}
            {categories.map((node, index) => {
              const quadrantColor = getQuadrantColor(index, node.color);
              const clipPaths = [
                "polygon(0% 0%, 50% 0%, 50% 50%, 0% 50%)", // Top-left
                "polygon(50% 0%, 100% 0%, 100% 50%, 50% 50%)", // Top-right
                "polygon(0% 50%, 50% 50%, 50% 100%, 0% 100%)", // Bottom-left
                "polygon(50% 50%, 100% 50%, 100% 100%, 50% 100%)", // Bottom-right
              ];

              const letterPositions = [
                { top: "25%", left: "25%" },
                { top: "25%", right: "25%" },
                { bottom: "25%", left: "25%" },
                { bottom: "25%", right: "25%" },
              ];

              return (
                <div
                  key={node.id}
                  style={{
                    position: "absolute",
                    width: `${circleSize}px`,
                    height: `${circleSize}px`,
                    borderRadius: "50%",
                    background: quadrantColor,
                    clipPath: clipPaths[index],
                    opacity: 0.5,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      ...letterPositions[index],
                      transform: "translate(-50%, -50%)",
                      width: "75px",
                      height: "75px",
                      borderRadius: "50%",
                      background: quadrantColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ffffff",
                      fontSize: "2.5rem",
                      fontWeight: 700,
                    }}
                  >
                    {node.letter || letters[index]}
                  </div>
                </div>
              );
            })}

            {/* Líneas divisorias (cruz blanca más gruesa) */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "50%",
                width: "3px",
                height: "100%",
                background: "#ffffff",
                transform: "translateX(-50%)",
                zIndex: 3,
                boxShadow: "0 0 2px rgba(0, 0, 0, 0.1)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 0,
                top: "50%",
                width: "100%",
                height: "3px",
                background: "#ffffff",
                transform: "translateY(-50%)",
                zIndex: 3,
                boxShadow: "0 0 2px rgba(0, 0, 0, 0.1)",
              }}
            />

            {/* Título superpuesto en óvalo (más grande y visible) */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 15,
              }}
            >
              <div
                style={{
                  padding: "0.75rem 2.5rem",
                  background: "#ffffff",
                  border: "4px solid #000000",
                  borderRadius: "50px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "#000000",
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                    whiteSpace: "nowrap",
                  }}
                >
                  {displayTitle}
                </h3>
              </div>
            </div>
          </div>

          {/* Cajas de información en las 4 esquinas */}
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "900px",
              minHeight: "400px",
            }}
          >
            {categories.map((node, index) => {
              const quadrantColor = getQuadrantColor(index, node.color);
              const boxPositions = [
                { top: "5%", left: "5%", transform: "translateX(-50%)" }, // Top-left
                { top: "5%", right: "5%", transform: "translateX(50%)" }, // Top-right
                { bottom: "5%", left: "5%", transform: "translateX(-50%)" }, // Bottom-left
                { bottom: "5%", right: "5%", transform: "translateX(50%)" }, // Bottom-right
              ];
              
              const boxPos = boxPositions[index];
              
              return (
                <div
                  key={node.id}
                  style={{
                    position: "absolute",
                    ...boxPos,
                    width: "240px",
                    zIndex: 2,
                  }}
                >
                  <div
                    style={{
                      padding: "1.5rem",
                      background: colorTheme === "dark" ? `${quadrantColor}15` : "#ffffff",
                      border: `2px solid ${quadrantColor}`,
                      borderRadius: "12px",
                      minWidth: "220px",
                      maxWidth: "280px",
                    }}
                  >
                    <h4
                      style={{
                        margin: "0 0 0.75rem 0",
                        fontSize: "0.875rem",
                        fontWeight: 700,
                        color: quadrantColor,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {node.label}
                    </h4>
                    {node.description && (
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.875rem",
                          lineHeight: 1.6,
                          color: textColor,
                          opacity: colorTheme === "dark" ? 0.9 : 0.7,
                        }}
                      >
                        {node.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  console.warn('SectionBasedSchemaRenderer - No matching template. Is comparison:', isComparison, 'Child nodes count:', childNodes.length);
  console.warn('SectionBasedSchemaRenderer - Full data:', JSON.stringify(data, null, 2));
  
  // Fallback: mostrar un mensaje de depuración
  return (
    <div style={{
      padding: "2rem",
      background: bgColor,
      borderRadius: "12px",
      border: `2px solid ${borderColor}`,
      color: textColor,
    }}>
      <strong>Debug: Esquema no renderizado</strong>
      <p>Is comparison: {isComparison ? 'Yes' : 'No'}</p>
      <p>Child nodes: {childNodes.length}</p>
      <p>Title: {displayTitle}</p>
      <details>
        <summary>Ver datos completos</summary>
        <pre style={{ fontSize: "0.75rem", overflow: "auto" }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </div>
  );
}
