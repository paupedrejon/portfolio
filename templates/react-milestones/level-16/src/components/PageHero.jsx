export default function PageHero({ title, subtitle, videoSrc }) {
  return (
    <header className="page-hero">
      {videoSrc ? (
        <>
          <video
            className="page-hero__video"
            autoPlay
            muted
            loop
            playsInline
            aria-hidden="true"
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
          <div className="page-hero__overlay" aria-hidden="true" />
        </>
      ) : (
        <div className="page-hero__overlay page-hero__overlay--solid" aria-hidden="true" />
      )}
      <div className="page-hero__content">
        <h1 className="text-4xl md:text-5xl font-bold theme-text">{title}</h1>
        {subtitle ? (
          <p className="theme-text-secondary mt-3 text-lg">{subtitle}</p>
        ) : null}
      </div>
    </header>
  );
}
