"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"

const progressData = [
  { day: "L", score: 85, completed: true },
  { day: "M", score: 92, completed: true },
  { day: "X", score: 78, completed: true },
  { day: "J", score: 88, completed: true },
  { day: "V", score: 95, completed: true },
  { day: "S", score: 82, completed: true },
  { day: "D", score: 0, completed: false },
]

const weeklyData = [
  { week: "Sem 1", avg: 82 },
  { week: "Sem 2", avg: 87 },
  { week: "Sem 3", avg: 91 },
  { week: "Sem 4", avg: 89 },
]

export function ProgressChart() {
  return (
    <div className="space-y-6">
      {/* Daily Progress */}
      <div>
        <h4 className="font-semibold mb-3">Progreso de la Semana</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={progressData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="day" />
            <YAxis domain={[0, 100]} />
            <Tooltip
              formatter={(value: number, name: string) => [`${value}%`, name === "score" ? "Puntuación" : name]}
              labelFormatter={(label) => `Día: ${label}`}
            />
            <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly Trend */}
      <div>
        <h4 className="font-semibold mb-3">Tendencia Mensual</h4>
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="week" />
            <YAxis domain={[70, 100]} />
            <Tooltip formatter={(value: number) => [`${value}%`, "Promedio"]} />
            <Line
              type="monotone"
              dataKey="avg"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
