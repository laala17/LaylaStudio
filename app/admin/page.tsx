"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts"

type RangeOption = "24h" | "7d" | "30d" | "all"

interface TopPage {
  url: string
  count: number
}

interface DeviceBreakdown {
  device_type: string
  count: number
}

interface DailyVisit {
  date: string
  count: number
}

interface Analytics {
  totalVisits: number
  uniqueVisitors: number
  topPages: TopPage[]
  deviceBreakdown: DeviceBreakdown[]
  dailyVisits: DailyVisit[]
  range: string
}

const RANGE_LABELS: Record<RangeOption, string> = {
  "24h": "Posledních 24 hodin",
  "7d": "Posledních 7 dní",
  "30d": "Posledních 30 dní",
  "all": "Všechno",
}

const DEVICE_COLORS: Record<string, string> = {
  desktop: "#3b82f6",
  mobile: "#f97316",
}

const CHART_COLOR = "#8b5cf6"

function formatUrl(url: string): string {
  if (url === "/") return "Domovská stránka"
  // Remove leading slash, capitalize first letter
  return url
    .replace(/^\//, "")
    .replace(/\//g, " › ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    || "Domovská stránka"
}

export default function AdminDashboard() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  const [range, setRange] = useState<RangeOption>("7d")
  const [error, setError] = useState<string | null>(null)

  // Verify auth
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const response = await fetch("/api/admin/verify", { method: "GET" })
        if (!response.ok) {
          router.push("/admin/login")
          return
        }
        setIsAuthenticated(true)
      } catch {
        router.push("/admin/login")
      } finally {
        setIsLoading(false)
      }
    }
    verifyAuth()
  }, [router])

  // Fetch analytics
  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/analytics?range=${range}`)
      if (!response.ok) {
        if (response.status === 401) {
          router.push("/admin/login")
          return
        }
        throw new Error(`HTTP ${response.status}`)
      }
      const data: Analytics = await response.json()
      setAnalytics(data)
    } catch (err) {
      console.error("Failed to fetch analytics:", err)
      setError("Nepodařilo se načíst statistiky")
    } finally {
      setAnalyticsLoading(false)
    }
  }, [range, router])

  useEffect(() => {
    if (isAuthenticated) {
      fetchAnalytics()
    }
  }, [isAuthenticated, fetchAnalytics])

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" })
    router.push("/admin/login")
  }

  if (isLoading || !isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-20 flex justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  const deviceData = analytics?.deviceBreakdown.map((d) => ({
    name: d.device_type === "mobile" ? "Mobil" : "Počítač",
    value: d.count,
    color: DEVICE_COLORS[d.device_type] || "#6b7280",
  })) ?? []

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Admin Panel</h1>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push("/admin/orders")}>
            Objednávky
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            Odhlásit se
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Celkem návštěv</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analytics?.totalVisits ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Unikátní návštěvy</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analytics?.uniqueVisitors ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Nejvytíženější stránka</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold truncate">
              {analytics?.topPages?.[0]
                ? formatUrl(analytics.topPages[0].url)
                : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Desktop / Mobile</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">
              {analytics?.deviceBreakdown?.find((d) => d.device_type === "desktop")?.count ?? 0}
              <span className="text-sm font-normal text-muted-foreground"> / </span>
              {analytics?.deviceBreakdown?.find((d) => d.device_type === "mobile")?.count ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Time range selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(Object.keys(RANGE_LABELS) as RangeOption[]).map((key) => (
          <Button
            key={key}
            variant={range === key ? "default" : "outline"}
            size="sm"
            onClick={() => setRange(key)}
          >
            {RANGE_LABELS[key]}
          </Button>
        ))}
      </div>

      {analyticsLoading ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      ) : error ? (
        <Card className="p-6 text-center text-destructive">
          <p>{error}</p>
          <Button variant="outline" className="mt-4" onClick={fetchAnalytics}>
            Zkusit znovu
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6">
          {/* Daily visits chart */}
          <Card>
            <CardHeader>
              <CardTitle>Návštěvy za den</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics?.dailyVisits ?? []}>
                    <XAxis
                      dataKey="date"
                      tickFormatter={(val) => {
                        if (typeof val !== "string") return ""
                        const d = new Date(val + "T00:00:00")
                        return d.toLocaleDateString("cs-CZ", { day: "numeric", month: "short" })
                      }}
                      fontSize={12}
                    />
                    <YAxis allowDecimals={false} fontSize={12} />
                    <Tooltip
                      labelFormatter={(val) => {
                        if (typeof val !== "string") return ""
                        const d = new Date(val + "T00:00:00")
                        return d.toLocaleDateString("cs-CZ", { day: "numeric", month: "long", year: "numeric" })
                      }}
                      formatter={(value) => {
                        if (typeof value !== "number") return [0, "Návštěvy"]
                        return [value, "Návštěvy"]
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke={CHART_COLOR}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Device breakdown pie chart */}
            <Card>
              <CardHeader>
                <CardTitle>Zařízení</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deviceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine
                      >
                        {deviceData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top pages bar chart */}
            <Card>
              <CardHeader>
                <CardTitle>Nejnavštěvovanější stránky</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={(analytics?.topPages ?? []).slice(0, 10)}
                      layout="vertical"
                      margin={{ left: 0, right: 20 }}
                    >
                      <XAxis type="number" allowDecimals={false} fontSize={12} />
                      <YAxis
                        type="category"
                        dataKey="url"
                        tickFormatter={formatUrl}
                        width={140}
                        fontSize={11}
                      />
                      <Tooltip
                        formatter={(value) => {
                          if (typeof value !== "number") return [0, "Návštěvy"]
                          return [value, "Návštěvy"]
                        }}
                        labelFormatter={(label) => {
                          if (typeof label !== "string") return ""
                          return formatUrl(label)
                        }}
                      />
                      <Bar dataKey="count" fill={CHART_COLOR} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Full top pages table */}
          <Card>
            <CardHeader>
              <CardTitle>Všechny stránky</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 font-medium">Stránka</th>
                      <th className="text-right py-3 px-2 font-medium">Návštěvy</th>
                      <th className="text-right py-3 px-2 font-medium">Podíl</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(analytics?.topPages ?? []).map((page) => {
                      const share = analytics?.totalVisits
                        ? ((page.count / analytics.totalVisits) * 100).toFixed(1)
                        : "0.0"
                      return (
                        <tr key={page.url} className="border-b border-border/50 hover:bg-muted/50">
                          <td className="py-2.5 px-2">{formatUrl(page.url)}</td>
                          <td className="py-2.5 px-2 text-right font-mono">{page.count}</td>
                          <td className="py-2.5 px-2 text-right text-muted-foreground">{share}%</td>
                        </tr>
                      )
                    })}
                    {(!analytics?.topPages || analytics.topPages.length === 0) && (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-muted-foreground">
                          Zatím žádná data. Návštěvy se začnou sbírat po nasazení tracking kódu.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
