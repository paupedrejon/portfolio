/** Filtro suave para halo — blur de SourceGraphic (glow sigue al color del fill). */
export default function HeroNeonFilters() {
  return (
    <svg className="hero-neon-filters" aria-hidden width={0} height={0}>
      <defs>
        <filter
          id="hero-neon-soft"
          colorInterpolationFilters="sRGB"
          x="-60%"
          y="-60%"
          width="220%"
          height="220%"
        >
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="g1" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="g2" />
          <feComponentTransfer in="g2" result="g2b">
            <feFuncA type="linear" slope="0.5" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="g2b" />
            <feMergeNode in="g1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}
