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

interface ConceptualSchemaData {
  nodes: SchemaNode[];
  edges: SchemaEdge[];
  title?: string;
}

interface ConceptualSchemaRendererProps {
  data: ConceptualSchemaData;
  colorTheme: "dark" | "light";
}

export default function ConceptualSchemaRenderer({ data, colorTheme }: ConceptualSchemaRendererProps) {
  console.log('ConceptualSchemaRenderer received data:', data);
  
  if (!data || !data.nodes || data.nodes.length === 0) {
    console.warn('ConceptualSchemaRenderer: No data or nodes');
    return null;
  }

  // Encontrar el nodo raíz
  const hasIncoming: Record<string, boolean> = {};
  (data.edges || []).forEach(edge => {
    hasIncoming[edge.to] = true;
  });

  const rootNodes = data.nodes.filter(node => !hasIncoming[node.id]);
  const rootNode = rootNodes[0] || data.nodes[0];

  // Obtener nodos hijos - si no hay edges, usar todos los nodos excepto el raíz
  let childNodes = data.nodes.filter(node => {
    if (node.id === rootNode.id) return false;
    if ((data.edges || []).length === 0) {
      // Si no hay edges, todos los nodos excepto el raíz son hijos
      return true;
    }
    return (data.edges || []).some(edge => edge.from === rootNode.id && edge.to === node.id);
  });
  
  // Si no hay childNodes pero hay más de un nodo, usar todos excepto el primero
  if (childNodes.length === 0 && data.nodes.length > 1) {
    childNodes = data.nodes.slice(1);
  }

  console.log('Root node:', rootNode, 'Child nodes:', childNodes);

  // Detectar si es una comparación
  const title = (data.title || rootNode.label || "").toLowerCase();
  const isComparison = title.includes(" vs ") || title.includes(" versus") || 
                       title.includes(" contra ") || title.includes(" vs. ") ||
                       title.match(/\bvs\b/i) !== null;
  
  console.log('Is comparison:', isComparison, 'Title:', title);
  
  const numElements = isComparison ? 2 : Math.min(childNodes.length, 4);
  const categories = childNodes.slice(0, numElements);
  
  console.log('Categories:', categories);

  // Extraer nombres si es comparación
  let leftElement = "";
  let rightElement = "";
  
  if (isComparison && categories.length >= 2) {
    const fullTitle = data.title || rootNode.label || "";
    const vsMatch = fullTitle.match(/(.+?)\s+(?:vs|versus|contra|VS)\s+(.+)/i);
    if (vsMatch) {
      leftElement = vsMatch[1].trim();
      rightElement = vsMatch[2].trim();
    } else {
      leftElement = categories[0]?.label || "";
      rightElement = categories[1]?.label || "";
    }
    leftElement = leftElement.charAt(0).toUpperCase() + leftElement.slice(1);
    rightElement = rightElement.charAt(0).toUpperCase() + rightElement.slice(1);
  }

  // Colores pasteles
  const quadrantColors2 = [
    "#c084fc", // Morado pastel
    "#67e8f9", // Teal pastel
  ];

  const quadrantColors4 = [
    "#c084fc", // Morado pastel
    "#fbbf24", // Naranja pastel
    "#67e8f9", // Teal pastel
    "#f9a8d4", // Rosa pastel
  ];

  const getQuadrantColor = (index: number, nodeColor?: string) => {
    if (nodeColor) {
      return nodeColor;
    }
    const colors = isComparison ? quadrantColors2 : quadrantColors4;
    return colors[index % colors.length];
  };

  const bgColor = colorTheme === "dark" 
    ? "rgba(15, 23, 42, 0.98)" 
    : "#ffffff";
  
  const textColor = colorTheme === "dark" ? "#f1f5f9" : "#0f172a";
  const borderColor = colorTheme === "dark" ? "rgba(71, 85, 105, 0.4)" : "rgba(203, 213, 225, 0.6)";

  const circleSize = 320;

  // PLANTILLA PARA COMPARACIONES (2 elementos) - estilo de la tercera imagen
  if (isComparison && categories.length >= 2) {
    const leftNode = categories[0];
    const rightNode = categories[1];
    const leftColor = getQuadrantColor(0, leftNode?.color);
    const rightColor = getQuadrantColor(1, rightNode?.color);
    
    // Características para cajas superiores
    const leftCharacteristic = leftNode?.characteristic || 
      (leftNode?.description ? leftNode.description.split('.')[0].split(':')[0].trim().toUpperCase() : "CARACTERÍSTICA");
    const rightCharacteristic = rightNode?.characteristic || 
      (rightNode?.description ? rightNode.description.split('.')[0].split(':')[0].trim().toUpperCase() : "CARACTERÍSTICA");

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
          {/* Cajas superiores - características clave */}
          <div
            style={{
              display: "flex",
              gap: "2rem",
              width: "100%",
              justifyContent: "center",
              marginBottom: "1rem",
            }}
          >
            <div
              style={{
                padding: "1rem 1.5rem",
                background: colorTheme === "dark" ? `${leftColor}15` : `${leftColor}20`,
                border: `2px solid ${leftColor}`,
                borderRadius: "12px",
                minWidth: "220px",
                maxWidth: "300px",
              }}
            >
              <h4
                style={{
                  margin: 0,
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  color: leftColor,
                  textTransform: "uppercase",
                }}
              >
                {leftCharacteristic}
              </h4>
            </div>
            <div
              style={{
                padding: "1rem 1.5rem",
                background: colorTheme === "dark" ? `${rightColor}15` : `${rightColor}20`,
                border: `2px solid ${rightColor}`,
                borderRadius: "12px",
                minWidth: "220px",
                maxWidth: "300px",
              }}
            >
              <h4
                style={{
                  margin: 0,
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  color: rightColor,
                  textTransform: "uppercase",
                }}
              >
                {rightCharacteristic}
              </h4>
            </div>
          </div>

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
                opacity: 0.5,
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
                {leftNode?.letter || "H"}
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
                opacity: 0.5,
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
                {rightNode?.letter || "D"}
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
                background: colorTheme === "dark" ? "rgba(148, 163, 184, 0.3)" : "rgba(148, 163, 184, 0.4)",
                transform: "translateX(-50%)",
                zIndex: 2,
              }}
            />

            {/* Título "vs" superpuesto en el centro */}
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

          {/* SVG para líneas de conexión desde el círculo a las cajas */}
          <svg
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              zIndex: 1,
            }}
            viewBox="0 0 1000 1000"
          >
            {/* Línea desde círculo izquierdo a caja izquierda */}
            <line
              x1="300"
              y1="500"
              x2="150"
              y2="850"
              stroke={leftColor}
              strokeWidth="2"
              opacity="0.5"
            />
            {/* Línea desde círculo derecho a caja derecha */}
            <line
              x1="700"
              y1="500"
              x2="850"
              y2="850"
              stroke={rightColor}
              strokeWidth="2"
              opacity="0.5"
            />
          </svg>

          {/* Cajas inferiores alrededor del círculo - estilo de la tercera imagen */}
          <div
            style={{
              display: "flex",
              gap: "2rem",
              width: "100%",
              justifyContent: "center",
              marginTop: "1rem",
              position: "relative",
              zIndex: 2,
            }}
          >
            {/* Caja izquierda */}
            <div
              style={{
                flex: 1,
                padding: "1.5rem",
                background: colorTheme === "dark" ? `${leftColor}15` : "#ffffff",
                border: `2px solid ${leftColor}`,
                borderRadius: "12px",
                maxWidth: "400px",
                minHeight: "280px",
              }}
            >
              <h4
                style={{
                  margin: "0 0 1rem 0",
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: leftColor,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {leftElement || leftNode?.label}
              </h4>
              {leftNode?.description && (
                <div
                  style={{
                    fontSize: "0.9375rem",
                    lineHeight: 1.7,
                    color: textColor,
                    opacity: colorTheme === "dark" ? 0.9 : 0.75,
                  }}
                >
                  {leftNode.description.split('.').filter(p => p.trim()).map((paragraph, pIndex, array) => (
                    <p
                      key={pIndex}
                      style={{
                        margin: pIndex < array.length - 1 ? "0 0 0.75rem 0" : "0",
                      }}
                    >
                      {paragraph.trim()}{pIndex < array.length - 1 ? '.' : ''}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Caja derecha */}
            <div
              style={{
                flex: 1,
                padding: "1.5rem",
                background: colorTheme === "dark" ? `${rightColor}15` : "#ffffff",
                border: `2px solid ${rightColor}`,
                borderRadius: "12px",
                maxWidth: "400px",
                minHeight: "280px",
              }}
            >
              <h4
                style={{
                  margin: "0 0 1rem 0",
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: rightColor,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {rightElement || rightNode?.label}
              </h4>
              {rightNode?.description && (
                <div
                  style={{
                    fontSize: "0.9375rem",
                    lineHeight: 1.7,
                    color: textColor,
                    opacity: colorTheme === "dark" ? 0.9 : 0.75,
                  }}
                >
                  {rightNode.description.split('.').filter(p => p.trim()).map((paragraph, pIndex, array) => (
                    <p
                      key={pIndex}
                      style={{
                        margin: pIndex < array.length - 1 ? "0 0 0.75rem 0" : "0",
                      }}
                    >
                      {paragraph.trim()}{pIndex < array.length - 1 ? '.' : ''}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PLANTILLA PARA ESQUEMAS NORMALES (4 elementos) - estilo de la tercera imagen
  if (categories.length >= 4) {
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
            gap: "1.5rem",
            minHeight: "600px",
          }}
        >
          {/* Círculo dividido en 4 */}
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
            {categories.slice(0, 4).map((node, index) => {
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
                    {node.letter || ["H", "D", "T", "C"][index]}
                  </div>
                </div>
              );
            })}

            {/* Líneas divisorias */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "50%",
                width: "2px",
                height: "100%",
                background: colorTheme === "dark" ? "rgba(148, 163, 184, 0.3)" : "rgba(148, 163, 184, 0.4)",
                transform: "translateX(-50%)",
                zIndex: 2,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 0,
                top: "50%",
                width: "100%",
                height: "2px",
                background: colorTheme === "dark" ? "rgba(148, 163, 184, 0.3)" : "rgba(148, 163, 184, 0.4)",
                transform: "translateY(-50%)",
                zIndex: 2,
              }}
            />

            {/* Título superpuesto */}
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
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  {data.title || rootNode.label}
                </h3>
              </div>
            </div>
          </div>

          {/* SVG para líneas de conexión */}
          <svg
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              zIndex: 1,
            }}
            viewBox="0 0 1000 1000"
          >
            {categories.slice(0, 4).map((node, index) => {
              const quadrantColor = getQuadrantColor(index, node.color);
              const angles = [135, 45, 225, 315]; // Top-left, top-right, bottom-left, bottom-right
              const angle = angles[index];
              const angleRad = (angle * Math.PI) / 180;
              const centerX = 500;
              const centerY = 500;
              const radius = 160;
              const startX = centerX + radius * Math.cos(angleRad);
              const startY = centerY + radius * Math.sin(angleRad);
              
              const endPoints = [
                { x: 150, y: 120 }, // Top-left
                { x: 850, y: 120 }, // Top-right
                { x: 150, y: 880 }, // Bottom-left
                { x: 850, y: 880 }, // Bottom-right
              ];
              
              const endPoint = endPoints[index];
              
              return (
                <line
                  key={`line-${node.id}`}
                  x1={startX}
                  y1={startY}
                  x2={endPoint.x}
                  y2={endPoint.y}
                  stroke={quadrantColor}
                  strokeWidth="2"
                  opacity="0.5"
                />
              );
            })}
          </svg>

          {/* Cajas alrededor del círculo - posicionadas en esquinas */}
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "900px",
              minHeight: "400px",
            }}
          >
            {categories.slice(0, 4).map((node, index) => {
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
                      padding: "1.25rem",
                      background: colorTheme === "dark" ? `${quadrantColor}15` : "#ffffff",
                      border: `2px solid ${quadrantColor}`,
                      borderRadius: "12px",
                    }}
                  >
                    <h4
                      style={{
                        margin: "0 0 0.5rem 0",
                        fontSize: "0.875rem",
                        fontWeight: 700,
                        color: quadrantColor,
                        textTransform: "uppercase",
                      }}
                    >
                      {node.label}
                    </h4>
                    {node.description && (
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.8125rem",
                          lineHeight: 1.5,
                          color: textColor,
                          opacity: colorTheme === "dark" ? 0.85 : 0.65,
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

  // Fallback: si hay nodos pero no coincide con ninguna plantilla, renderizar un esquema básico
  console.warn('ConceptualSchemaRenderer: No matching template, using fallback');
  if (categories.length > 0) {
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
        }}
      >
        <h3 style={{ color: textColor, marginBottom: "1rem" }}>
          {data.title || rootNode.label}
        </h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "center" }}>
          {categories.map((node, index) => {
            const quadrantColor = getQuadrantColor(index, node.color);
            return (
              <div
                key={node.id}
                style={{
                  padding: "1rem",
                  background: colorTheme === "dark" ? `${quadrantColor}15` : "#ffffff",
                  border: `2px solid ${quadrantColor}`,
                  borderRadius: "12px",
                  minWidth: "200px",
                }}
              >
                <h4 style={{ margin: "0 0 0.5rem 0", color: quadrantColor }}>
                  {node.label}
                </h4>
                {node.description && (
                  <p style={{ margin: 0, color: textColor, fontSize: "0.875rem" }}>
                    {node.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  
  return null;
}
