"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Calendar, Trophy, Target, MessageCircle, Volume2, CheckCircle2, Lock } from "lucide-react"
import { DailyQuiz } from "@/components/daily-quiz"
import { ProgressChart } from "@/components/progress-chart"

interface UserProgress {
  currentStreak: number
  totalDays: number
  level: number
  xp: number
  completedToday: boolean
  lastCompletedDate: string
}

export default function HomePage() {
  const [userProgress, setUserProgress] = useState<UserProgress>({
    currentStreak: 7,
    totalDays: 23,
    level: 3,
    xp: 1250,
    completedToday: false,
    lastCompletedDate: "2024-01-14",
  })

  const [showQuiz, setShowQuiz] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleStartQuiz = () => {
    setShowQuiz(true)
  }

  const handleQuizComplete = (score: number) => {
    setUserProgress((prev) => ({
      ...prev,
      completedToday: true,
      currentStreak: prev.currentStreak + 1,
      totalDays: prev.totalDays + 1,
      xp: prev.xp + score * 10,
      lastCompletedDate: new Date().toISOString().split("T")[0],
    }))
    setShowQuiz(false)
  }

  const xpToNextLevel = userProgress.level * 500 - (userProgress.xp % 500)
  const progressToNextLevel = ((userProgress.xp % 500) / 500) * 100

  if (showQuiz) {
    return <DailyQuiz onComplete={handleQuizComplete} level={userProgress.level} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-green-600 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">EthicsAI</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Capacitación Anti-Corrupción</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge
                variant="secondary"
                className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
              >
                <Trophy className="w-4 h-4 mr-1" />
                Nivel {userProgress.level}
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {userProgress.xp} XP
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Daily Challenge Card */}
            <Card className="border-2 border-blue-200 dark:border-blue-800 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Desafío Diario</CardTitle>
                      <CardDescription>Conversación con IA - 5 minutos</CardDescription>
                    </div>
                  </div>
                  {userProgress.completedToday ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Completado
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-blue-300 text-blue-700">
                      Pendiente
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {currentTime.toLocaleDateString("es-ES", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      Tema de Hoy: Conflictos de Interés
                    </h4>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Practica identificar y manejar situaciones donde tus intereses personales podrían entrar en
                      conflicto con tus responsabilidades profesionales.
                    </p>
                  </div>

                  <Button
                    onClick={handleStartQuiz}
                    disabled={userProgress.completedToday}
                    style={{
                      backgroundColor: userProgress.completedToday ? "#6b7280" : "#1d4ed8",
                      color: "#ffffff",
                      border: "none",
                    }}
                    className="w-full font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105"
                    onMouseEnter={(e) => {
                      if (!userProgress.completedToday) {
                        e.currentTarget.style.backgroundColor = "#1e40af"
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!userProgress.completedToday) {
                        e.currentTarget.style.backgroundColor = "#1d4ed8"
                      }
                    }}
                  >
                    {userProgress.completedToday ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        Completado por Hoy
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-5 h-5 mr-2" />
                        Iniciar Conversación
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Progress Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Tu Progreso
                </CardTitle>
                <CardDescription>Seguimiento de tu desarrollo en los últimos 30 días</CardDescription>
              </CardHeader>
              <CardContent>
                <ProgressChart />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Level Progress */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Progreso de Nivel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Nivel {userProgress.level}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {xpToNextLevel} XP para siguiente nivel
                  </span>
                </div>
                <Progress value={progressToNextLevel} className="h-3" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{userProgress.xp}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Puntos de Experiencia</p>
                </div>
              </CardContent>
            </Card>

            {/* Streak Counter */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-orange-500" />
                  Racha Actual
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-2">
                <div className="text-4xl font-bold text-orange-500">{userProgress.currentStreak}</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">días consecutivos</p>
                <div className="pt-2">
                  <Badge variant="outline" className="border-orange-300 text-orange-700">
                    {userProgress.totalDays} días totales
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Topics */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Próximos Temas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { topic: "Transparencia Financiera", level: 4, locked: false },
                  { topic: "Denuncias Éticas", level: 5, locked: true },
                  { topic: "Liderazgo Íntegro", level: 6, locked: true },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {item.locked ? (
                        <Lock className="w-4 h-4 text-gray-400" />
                      ) : (
                        <div className="w-4 h-4 bg-green-500 rounded-full" />
                      )}
                      <span className={`text-sm ${item.locked ? "text-gray-400" : "text-gray-700 dark:text-gray-300"}`}>
                        {item.topic}
                      </span>
                    </div>
                    <Badge variant="outline" size="sm">
                      Nivel {item.level}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
