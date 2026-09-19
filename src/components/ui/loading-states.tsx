type DashboardLoadingProps = {
  editor?: boolean;
};

const Lines = ({ count = 3 }: { count?: number }) => (
  <div className="loading-lines" aria-hidden="true">
    {Array.from({ length: count }, (_, index) => <i key={index} />)}
  </div>
);

export function AppLoading() {
  return (
    <main className="route-loading route-loading-app" aria-busy="true" aria-live="polite">
      <div className="loading-mark" aria-hidden="true"><i /><i /><i /></div>
      <p className="sr-only">Loading Cleanie</p>
    </main>
  );
}

export function AuthLoading() {
  return (
    <main className="auth-page" aria-busy="true" aria-live="polite">
      <div className="auth-loading-card">
        <span className="skeleton skeleton-wordmark" />
        <span className="skeleton skeleton-heading" />
        <Lines count={2} />
        <span className="skeleton skeleton-input" />
        <span className="skeleton skeleton-input" />
        <span className="skeleton skeleton-button" />
      </div>
      <p className="sr-only">Loading account access</p>
    </main>
  );
}

export function DashboardLoading({ editor = false }: DashboardLoadingProps) {
  return (
    <main className="dashboard-loading-page" aria-busy="true" aria-live="polite">
      <aside className="dashboard-loading-sidebar" aria-hidden="true">
        <span className="skeleton skeleton-wordmark" />
        <Lines count={5} />
      </aside>
      <section className="dashboard-loading-content">
        <header>
          <div><span className="skeleton skeleton-kicker" /><span className="skeleton skeleton-heading" /><Lines count={1} /></div>
          <span className="skeleton skeleton-button" />
        </header>
        {editor ? (
          <div className="editor-loading-grid">
            <div className="editor-loading-nav"><Lines count={7} /></div>
            <div className="editor-loading-panel"><span className="skeleton skeleton-heading" /><Lines count={5} /><span className="skeleton skeleton-button" /></div>
            <div className="editor-loading-preview"><span className="skeleton skeleton-kicker" /><div className="skeleton skeleton-site" /></div>
          </div>
        ) : (
          <div className="dashboard-loading-cards">
            <div className="skeleton skeleton-card" />
            <div className="skeleton skeleton-card" />
            <div className="skeleton skeleton-card" />
          </div>
        )}
      </section>
      <p className="sr-only">Loading your dashboard</p>
    </main>
  );
}

export function PublicSiteLoading() {
  return (
    <main className="public-site-loading" aria-busy="true" aria-live="polite">
      <header><span className="skeleton skeleton-kicker" /><span className="skeleton skeleton-hero-title" /><Lines count={2} /><span className="skeleton skeleton-button" /></header>
      <section><span className="skeleton skeleton-section-title" /><div className="public-loading-services"><div className="skeleton skeleton-service" /><div className="skeleton skeleton-service" /><div className="skeleton skeleton-service" /></div></section>
      <section><span className="skeleton skeleton-section-title" /><div className="skeleton skeleton-booking" /></section>
      <p className="sr-only">Loading this Cleanie page</p>
    </main>
  );
}
