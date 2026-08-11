"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body style={{ margin: 0, background: "#fbf8fa", color: "#1b1b1d", fontFamily: "Arial, sans-serif" }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px", textAlign: "center" }}>
          <div style={{ maxWidth: "560px" }}>
            <p style={{ color: "#f5a623", fontSize: "12px", fontWeight: 700, letterSpacing: "0.3em" }}>EL TRAVEL</p>
            <p style={{ margin: "28px 0 0", color: "#0a1628", fontSize: "72px", fontWeight: 800 }}>500</p>
            <h1 style={{ margin: "16px 0 0", color: "#0a1628", fontSize: "30px" }}>Layanan sedang dalam perbaikan</h1>
            <p style={{ margin: "16px 0 0", color: "#666", lineHeight: 1.7 }}>
              Server sedang mengalami gangguan. Silakan coba muat ulang halaman beberapa saat lagi.
            </p>
            <button
              type="button"
              onClick={() => reset()}
              style={{ marginTop: "28px", border: 0, borderRadius: "12px", padding: "13px 24px", background: "#0a1628", color: "white", cursor: "pointer", fontWeight: 700 }}
            >
              Muat Ulang
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
