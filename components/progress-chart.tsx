"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"

const progressData = [
  { day: "Dom", score: 60, completed: true },
  { day: "Lun", score: 85, completed: true },
  { day: "Mar", score: 92, completed: true },
  { day: "Mie", score: 78, completed: true },
  { day: "Jue", score: 88, completed: true },
  { day: "Vie", score: null, completed: false },
  { day: "Sab", score: null, completed: false },
]

const dayNames: Record<string, string> = {
    Lun: "Lunes",
    Mar: "Martes",
    Mie: "Miércoles",
    Jue: "Jueves",
    Vie: "Viernes",
    Sab: "Sábado",
    Dom: "Domingo",
    return: "",
}

const weeklyData = [
  { week: "Sem 1", avg: 74 },
  { week: "Sem 2", avg: 80 },
  { week: "Sem 3", avg: 85 },
  { week: "Sem 4", avg: 95 },
]

export function ProgressChart() {
  return (
    <div className="space-y-6">
      {/* Daily Progress */}
      <div>
        <h4 className="font-semibold mb-3">Progreso de la Semana</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={progressData}>
            <defs>
              <linearGradient id="goldBarGradient" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#B8860B" />
                <stop offset="100%" stopColor="#D4AF37" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="day" />
            <YAxis domain={[0, 100]} />
            <Tooltip
              formatter={(value: number, name: string) => [`${value}%`, name === "score" ? "Puntuación" : name]}
              labelFormatter={(label) => `Día: ${dayNames[label] || label}`}
              cursor={{ fill: "rgba(0,0,0,0)" }}
              contentStyle={{ background: "#181716", color: "#FAF0E6", border: "none", borderRadius: "0.75rem", boxShadow: "0 2px 8px 0 rgba(40,30,10,0.18)" }}
            />
            <Bar dataKey="score" fill="url(#goldBarGradient)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly Trend */}
      <div>
        <h4 className="font-semibold mb-3">Tendencia Mensual</h4>
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={weeklyData}>
            <defs>
              <filter id="goldGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="week" />
            <YAxis domain={[70, 100]} />
            <Tooltip
              formatter={(value: number) => [`${value}%`, "Promedio"]}
              cursor={{ stroke: "rgba(0,0,0,0)", strokeWidth: 2 }}
              contentStyle={{ background: "#181716", color: "#FAF0E6", border: "none", borderRadius: "0.75rem", boxShadow: "0 2px 8px 0 rgba(40,30,10,0.18)" }}
            />
            <Line
              type="monotone"
              dataKey="avg"
              stroke="#D4AF37"
              strokeWidth={3}
              dot={{ fill: "#D4AF37", strokeWidth: 2, r: 4, filter: "url(#goldGlow)" }}
              filter="url(#goldGlow)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
