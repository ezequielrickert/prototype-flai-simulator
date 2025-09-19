"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, User, Award, CalendarDays, BarChart3 } from "lucide-react"
import Link from "next/link"
import { ProgressChart } from "@/components/progress-chart"

// Componente de check dorado
function GoldCheck() {
  return <span style={{color: '#D4AF37', fontWeight: 'bold', fontSize: '1.2em'}}>✓</span>;
}

// Componente de barra circular para puntaje de integridad
// @ts-ignore
function CircularProgress({ value, max = 100, size = 64, color = "#D4AF37" }) {
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(value, max) / max
  return (
    <svg width={size} height={size} className="block mx-auto">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth="8"
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - progress)}
        style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(.4,2,.3,1)", filter: "drop-shadow(0 0 24px #D4AF37cc)" }}
        strokeLinecap="round"
      />
      <text
        x="50%"
        y="60%"
        textAnchor="middle"
        fontSize="2em"
        fontWeight="bold"
        fill="#fff"
        style={{ filter: "drop-shadow(0 0 8px #fffbe6cc)" }}
      >
        {value}
      </text>
    </svg>
  )
}

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
    avatar: "/placeholder-user.jpg",
    certificaciones: [
      { nombre: "Ética Empresarial", icon: "🏆" },
      { nombre: "Transparencia", icon: "💰" },
      { nombre: "Anticorrupción", icon: "🔒" },
    ],
    actividades: [
      { tema: "Conflictos de Interés", estado: "completado", xp: 50, tiempo: "12 min", icon: "📚" },
      { tema: "Transparencia Financiera", estado: "progreso", xp: 0, tiempo: "5 min", icon: "🎯" },
      { tema: "Dilemas Éticos", estado: "completado", xp: 75, tiempo: "18 min", icon: "⚖️" },
    ]
  }

  // Datos adicionales exclusivos del perfil
  const resumenDesempeno = {
    tiempoPromedioSesion: "3 min",
    mejorDia: "Miércoles",
    puntajeIntegridad: user.puntajeIntegridad,
  }
  const historialCertificaciones = [
    { nombre: "Ética Empresarial", icon: "⭐", nivel: 1, xp: 50, minutos: 3 },
    { nombre: "Transparencia", icon: "🔥", nivel: 2, xp: 80, minutos: 4 },
    { nombre: "Anticorrupción", icon: "🛡️", nivel: 3, xp: 120, minutos: 5 },
  ]
  const evaluacionesSupervisor = [
    { fecha: "2025-09-10", comentario: "Excelente compromiso y ética.", puntaje: 5, nombre: "Carlos Mendoza" },
    { fecha: "2025-08-15", comentario: "Buen trabajo en transparencia.", puntaje: 4, nombre: "Ana López" },
    { fecha: "2025-07-10", comentario: "Gran capacidad de liderazgo.", puntaje: 5, nombre: "Carlos Mendoza" },
    { fecha: "2025-06-05", comentario: "Sigue mejorando en comunicación.", puntaje: 3, nombre: "Ana López" },
  ]

  // Formateo de fecha de ingreso
  const fechaIngreso = new Date(user.fechaIngreso)
  const fechaIngresoStr = fechaIngreso.toLocaleDateString("es-ES", { month: "short", year: "numeric" })

  return (
    <div className="min-h-screen bg-background body-textura-diagonal">
      {/* Header premium con flecha dorada en círculo y avatar grande */}
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
                  <div className="rounded-full bg-beige border-2 border-gold shadow-lg w-20 h-20 flex items-center justify-center">
                      <User className="w-16 h-16 icon-gold perfil-icon" />
                  </div>
                  <div className="flex flex-col gap-1">
                      <span className="font-extrabold text-2xl text-gold leading-tight">{user.nombre}</span>
                      <span className="font-semibold text-lg text-cream">{user.departamento}</span>
                      <span className="text-base text-cream">{user.email}</span>
                  </div>
              </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {/* Resumen de desempeño rediseñado */}
        <Card className="card-custom shadow-lg flex flex-col p-8 mb-10">
          <CardHeader>
            <CardTitle className="card-title-gold flex items-center gap-2">Resumen de desempeño</CardTitle>
          </CardHeader>
          <CardContent className="w-full">
            <div className="flex flex-col gap-8">
              {/* GAP entre título y contenido */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mt-4">
                <div className="flex flex-col items-center md:items-start gap-4">
                  {/* Solo el círculo dorado, sin fondo cuadrado y sin texto superpuesto extra */}
                  <div className="flex items-center justify-center" style={{height: '110px', width: '110px', background: 'none'}}>
                    <CircularProgress value={resumenDesempeno.puntajeIntegridad} max={100} size={110} color="#D4AF37" />
                  </div>
                </div>
                <div className="flex flex-col gap-6 justify-center">
                  <div className="text-lg font-semibold text-cream">Tiempo promedio por sesión: <span className="text-gold font-bold">{resumenDesempeno.tiempoPromedioSesion}</span></div>
                  <div className="text-lg font-semibold text-cream">Mejor día: <span className="text-gold font-bold">{resumenDesempeno.mejorDia}</span></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Historial y últimas actividades en la misma fila */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
          {/* Historial de certificaciones horizontal */}
          <Card className="card-custom shadow-lg p-8 flex flex-col justify-center">
            <CardHeader>
              <CardTitle className="card-title-gold flex items-center gap-2">Historial de certificaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6 mt-4">
                {historialCertificaciones.map((cert, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-2 rounded-xl card-brown-bg shadow-md">
                    <span className="text-2xl" style={{minWidth: '2.2em', textAlign: 'center'}}>{cert.icon}</span>
                    <span className="font-semibold text-lg text-cream flex-1">{cert.nombre}</span>
                    <span className="nivel-tag">Nivel {cert.nivel}</span>
                    <span className="font-bold text-brown-dark text-base ml-2">+{cert.xp} XP</span>
                    <span className="font-bold text-brown-dark text-base ml-2">{cert.minutos} min</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          {/* Últimas actividades horizontal */}
          <Card className="card-custom shadow-lg p-8 flex flex-col justify-center">
            <CardHeader>
              <CardTitle className="card-title-gold flex items-center gap-2">
                <CalendarDays className="w-6 h-6 icon-gold" />
                Últimas actividades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6 mt-4">
                {user.actividades.map((act, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-4 proximo-tema-item transition-all duration-200 hover:shadow-gold hover:scale-[1.02] ${act.estado === "completado" ? "bg-beige" : "bg-background"}`}
                    style={{padding: '0.7em 1em'}}
                  >
                    <span className="text-2xl">
                      {act.icon === "📚" ? <BarChart3 className="w-6 h-6 icon-gold" />
                        : act.icon === "🎯" ? <Award className="w-6 h-6 icon-gold" />
                        : act.icon === "⚖️" ? <User className="w-6 h-6 icon-gold" />
                        : act.icon}
                    </span>
                    <div className="flex flex-col flex-1">
                      <span className="font-bold text-base">{act.tema}</span>
                      <span className="text-xs muted">{act.estado === "completado" ? "Completado" : "En progreso"}</span>
                    </div>
                    {act.xp > 0 && (
                      <span className="font-bold text-brown-dark text-base ml-2">+{act.xp} XP</span>
                    )}
                    <span className="font-bold text-brown-dark text-base ml-2">{Math.min(Number(act.tiempo.split(' ')[0]), 5)} min</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Evaluaciones del supervisor en grid 2 columnas */}
        <Card className="card-custom shadow-lg border-2 border-gold p-8 mb-10">
          <CardHeader>
            <CardTitle className="card-title-gold flex items-center gap-2">
              Evaluaciones del supervisor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
              {evaluacionesSupervisor.map((ev, idx) => {
                const fecha = new Date(ev.fecha)
                const mesAnio = fecha.toLocaleDateString("es-ES", { month: "long", year: "numeric" })
                const inicial = ev.nombre ? ev.nombre[0].toUpperCase() : "S"
                return (
                  <div key={idx} className="flex items-center gap-4 p-4 rounded-lg bg-beige/40 border border-gold card-custom shadow-md" style={{border: '2px solid #D4AF37'}}>
                    <span className="rounded-full bg-gold text-black font-bold w-10 h-10 flex items-center justify-center" style={{fontSize: '1.3em'}}>{inicial}</span>
                    <div className="flex flex-col flex-1 gap-2">
                      <span className="text-sm muted mb-1" style={{fontWeight: 600}}>{ev.nombre} · {mesAnio.charAt(0).toUpperCase() + mesAnio.slice(1)}</span>
                      <span className="muted text-base">{ev.comentario}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
