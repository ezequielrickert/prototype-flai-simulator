"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Trophy, User, Award, CalendarDays, BarChart3, CheckCircle2, Star } from "lucide-react"
import Link from "next/link"
import { ProgressChart } from "@/components/progress-chart"

export default function PerfilPage() {
  // Datos de ejemplo, en una app real vendrían de la sesión/DB
  const user = {
    nombre: "Julieta Pérez",
    email: "julieta.perez@empresa.com",
    cargo: "Analista Senior",
    departamento: "Finanzas",
    fechaIngreso: "2023-03-10",
    idEmpleado: "EMP-2024-156",
    supervisor: "Carlos Mendoza",
    nivel: 3,
    xp: 1250,
    racha: 7,
    mejorRacha: 12,
    totalDias: 23,
    temasCompletados: 8,
    temasTotales: 12,
    puntajeIntegridad: 92,
    certificaciones: [
      { nombre: "Ética Empresarial", icon: <Award className="w-5 h-5 icon-gold mr-2" /> },
      { nombre: "Transparencia", icon: <Star className="w-5 h-5 icon-gold mr-2" /> },
      { nombre: "Anticorrupción", icon: <CheckCircle2 className="w-5 h-5 icon-gold mr-2" /> },
    ],
    actividades: [
      { fecha: "2025-09-17", descripcion: "Completó el tema 'Conflictos de Interés'" },
      { fecha: "2025-09-16", descripcion: "Obtuvo certificación 'Ética Empresarial'" },
      { fecha: "2025-09-15", descripcion: "Completó el desafío diario" },
    ]
  }

  // Formateo de fecha de ingreso
  const fechaIngreso = new Date(user.fechaIngreso)
  const fechaIngresoStr = fechaIngreso.toLocaleDateString("es-ES", { month: "short", year: "numeric" })

  return (
    <div className="min-h-screen bg-background">
      <header className="header border-b py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="badge-header-nivel flex items-center gap-2 px-4 py-2 group mr-4">
                <ArrowLeft className="w-7 h-7 icon-gold transition group-hover:scale-110 group-hover:drop-shadow-lg" />
              </Link>
                  <div className="rounded-2xl p-1 flex items-center justify-center" style={{background: '#181716', boxShadow: '0 0 16px 4px rgba(212,175,55,0.25)'}}>
                    <img src="/logo-integridai.png" alt="IntegridAI Logo" className="w-16 h-16 object-contain" style={{display: 'block'}} />
                  </div>
                  <div>
                    <h1 className="header-title-dark">IntegridAI</h1>
                    <p className="header-subtitle-dark">Capacitación Anti-Corrupción</p>
                  </div>
            </div>
            <div className="flex items-center gap-4">
                <div>
                    <h1 className="header-title-dark">Perfil</h1>
                    <p className="header-subtitle">Datos personales y progreso</p>
                </div>
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {/* Sección superior: Info personal/profesional */}
        <Card className="card-custom mb-8">
          <CardHeader className="pb-2">
            <CardTitle className="card-title-gold flex items-center gap-2">
              <User className="w-7 h-7 icon-gold" />
              {user.nombre}
            </CardTitle>
            <CardDescription className="text-sm text-gray-400">{user.email}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-center text-base">
              <span className="chip">{user.cargo} - Dept. {user.departamento}</span>
              <span className="chip">ID: {user.idEmpleado}</span>
              <span className="chip">Ingreso: {fechaIngresoStr}</span>
              <span className="chip">Supervisor: {user.supervisor}</span>
            </div>
          </CardContent>
        </Card>
        {/* Sección central: Métricas en tarjetas doradas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card className="card-custom hover:shadow-gold transition duration-200">
            <CardContent className="flex flex-col items-center py-6">
              <div className="big-number-gold">{user.nivel}</div>
              <div className="separator" />
              <span className="muted">Nivel actual</span>
            </CardContent>
          </Card>
          <Card className="card-custom hover:shadow-gold transition duration-200">
            <CardContent className="flex flex-col items-center py-6">
              <div className="big-number-gold">{user.xp}</div>
              <div className="separator" />
              <span className="muted">XP acumulado</span>
            </CardContent>
          </Card>
          <Card className="card-custom hover:shadow-gold transition duration-200">
            <CardContent className="flex flex-col items-center py-6">
              <div className="big-number-gold">{user.racha}</div>
              <div className="separator" />
              <span className="muted">Racha actual</span>
              <span className="chip mt-2">Mejor racha: {user.mejorRacha}</span>
            </CardContent>
          </Card>
          <Card className="card-custom hover:shadow-gold transition duration-200">
            <CardContent className="flex flex-col items-center py-6">
              <div className="big-number-gold">{user.totalDias}</div>
              <div className="separator" />
              <span className="muted">Días totales</span>
            </CardContent>
          </Card>
        </div>
        {/* Sección inferior: Progreso detallado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Card className="card-custom">
            <CardHeader>
              <CardTitle className="card-title-gold flex items-center gap-2">
                <BarChart3 className="w-6 h-6 icon-gold" />
                Progreso mensual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProgressChart />
            </CardContent>
          </Card>
          <Card className="card-custom">
            <CardHeader>
              <CardTitle className="card-title-gold flex items-center gap-2">
                <Award className="w-6 h-6 icon-gold" />
                Certificaciones y logros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3 mb-4">
                {user.certificaciones.map((cert, idx) => (
                  <span key={idx} className="chip flex items-center">
                    {cert.icon}
                    {cert.nombre}
                  </span>
                ))}
              </div>
              <div className="chip mb-2">
                Puntaje de integridad: <span className="font-bold ml-2 text-gold">{user.puntajeIntegridad}/100</span>
              </div>
              <div className="chip mb-2">
                Temas completados: {user.temasCompletados} / {user.temasTotales}
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Últimas actividades */}
        <Card className="card-custom">
          <CardHeader>
            <CardTitle className="card-title-gold flex items-center gap-2">
              <CalendarDays className="w-6 h-6 icon-gold" />
              Últimas actividades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {user.actividades.map((act, idx) => (
                <li key={idx} className="flex items-center gap-3 proximo-tema-item">
                  <span className="chip">{act.fecha}</span>
                  <span className="muted">{act.descripcion}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
