"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Trophy, User } from "lucide-react"

export default function PerfilPage() {
  // Datos de ejemplo, en una app real vendrían de la sesión/DB
  const user = {
    nombre: "Julieta Pérez",
    nivel: 3,
    xp: 1250,
    racha: 7,
    totalDias: 23,
    email: "julieta@email.com"
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="header border-b py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="w-12 h-12 perfil-icon" />
            <div>
              <h1 className="header-title-dark">Perfil</h1>
              <p className="header-subtitle">Datos personales y progreso</p>
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="card-custom">
            <CardHeader>
              <CardTitle className="card-title-gold flex items-center gap-2">
                <User className="w-6 h-6 icon-gold" />
                {user.nombre}
              </CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="chip">Nivel actual: {user.nivel}</div>
                <div className="chip">XP acumulada: {user.xp}</div>
                <div className="chip">Racha actual: {user.racha} días</div>
                <div className="chip">Días totales: {user.totalDias}</div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-custom">
            <CardHeader>
              <CardTitle className="card-title-gold flex items-center gap-2">
                <Trophy className="w-6 h-6 icon-gold" />
                Progreso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="chip">Nivel: {user.nivel}</div>
                <div className="chip">XP: {user.xp}</div>
                <div className="chip">Racha: {user.racha} días</div>
                <div className="chip">Días totales: {user.totalDias}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

