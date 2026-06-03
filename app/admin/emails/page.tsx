"use client"

import { useEffect, useState } from "react"

export default function EmailLogPage() {
  const [logs, setLogs] = useState<any[]>([])

  useEffect(() => {
    // Každých 5 vteřin zkontrolujeme, jestli nepřibyl nový uživatel s tokenem
    const interval = setInterval(async () => {
      const res = await fetch("/api/register-logs") // Pomocná trasa pro čtení z "databáze"
      if (res.ok) {
        const data = await res.json()
        setLogs(data.users || [])
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", marginBottom: "20px" }}>📧 LayalaStudio – Zachycené e-maily</h1>
      <p style={{ color: "#666", marginBottom: "30px" }}>Zde uvidíte registrační odkazy v reálném čase bez nutnosti čekat na e-mail.</p>

      {logs.length === 0 ? (
        <div style={{ padding: "20px", background: "#f5f5f5", borderRadius: "8px", textAlign: "center" }}>
          Zatím nebyly odeslány žádné registrační e-maily...
        </div>
      ) : (
        logs.map((user) => {
          const verifyUrl = `${window.location.origin}/api/verify?token=${user.verificationToken}`
          return (
            <div key={user.id} style={{ border: "1px solid #e0e0e0", borderRadius: "8px", padding: "20px", marginBottom: "15px", background: "#fff", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <strong>Pro e-mail: <span style={{ color: "#0070f3" }}>{user.email}</span></strong>
                <span style={{ fontSize: "12px", background: user.isVerified ? "#e6f4ea" : "#feeed0", color: user.isVerified ? "#137333" : "#b06000", padding: "2px 8px", borderRadius: "12px" }}>
                  {user.isVerified ? "Ověřeno" : "Čeká na ověření"}
                </span>
              </div>
              <p style={{ margin: "10px 0", fontSize: "14px", color: "#333" }}>
                <strong>Předmět:</strong> Dokončení registrace | LayalaStudio
              </p>
              <div style={{ background: "#f9fafb", padding: "15px", borderRadius: "6px", fontSize: "14px", borderLeft: "4px solid #111" }}>
                <p style={{ margin: "0 0 10px 0" }}>Ahoj, děkujeme za registraci na našem e-shopu...</p>
                <a href={verifyUrl} target="_blank" rel="noreferrer" style={{ display: "inline-block", padding: "8px 16px", background: "#111", color: "#fff", textDecoration: "none", borderRadius: "4px", fontSize: "13px", fontWeight: "bold" }}>
                  🔗 KLIKNOUT PRO POTVRZENÍ REGISTRACE
                </a>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}