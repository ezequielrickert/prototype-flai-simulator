# Tecnologías Utilizadas en la Plataforma

Este documento describe las principales tecnologías empleadas en esta plataforma, cómo se utilizan y cómo se integran entre sí para ofrecer la funcionalidad del sistema.

## 1. Next.js

**¿Qué es?**
Next.js es un framework de React para construir aplicaciones web modernas, con soporte para renderizado del lado del servidor (SSR), generación de sitios estáticos (SSG) y API routes.

**¿Cómo se usa?**
- La estructura principal de la aplicación está basada en Next.js (`app/`, `next.config.mjs`, `next-env.d.ts`).
- Se utilizan rutas de API (`app/api/`) para manejar la lógica del backend, como chat, feedback, escenarios y servicios de voz.
- El frontend se desarrolla con componentes React, aprovechando el sistema de rutas y layouts de Next.js.

**Integración:**
Next.js orquesta la interacción entre el frontend y el backend, permitiendo que los componentes de React consuman las rutas de API internas y externas.

## 2. React

**¿Qué es?**
React es una biblioteca de JavaScript para construir interfaces de usuario basadas en componentes.

**¿Cómo se usa?**
- Todos los componentes de la interfaz (`components/`) están escritos en React.
- Se emplean hooks personalizados (`hooks/`) para manejar lógica de estado y efectos secundarios.

**Integración:**
React se integra nativamente con Next.js, permitiendo el desarrollo de interfaces dinámicas y reutilizables.

## 3. TypeScript

**¿Qué es?**
TypeScript es un superset de JavaScript que añade tipado estático.

**¿Cómo se usa?**
- El código fuente está mayormente escrito en TypeScript (`.ts`, `.tsx`), lo que mejora la robustez y mantenibilidad.
- Se definen tipos personalizados en `types/` para estructuras como reconocimiento de voz.

**Integración:**
TypeScript se integra con Next.js y React, permitiendo detectar errores en tiempo de desarrollo y mejorar la experiencia del desarrollador.


## 4. Servicio de IA: OpenAI

**¿Qué es?**
OpenAI proporciona modelos avanzados de procesamiento de lenguaje natural (NLP), como GPT-3.5 y GPT-4, que permiten generar, completar y analizar texto de manera inteligente.


- OpenAI se utiliza principalmente para implementar el chatbot conversacional de la plataforma y la funcionalidad de chat en tiempo real.
- Se emplea la API de OpenAI **gpt-4o-realtime-preview** para habilitar conversaciones en tiempo real, tanto de texto como de audio, mediante WebRTC y canales de datos.
- La integración se realiza mediante la siguiente URL de la API:

   ```typescript
   const response = await fetch('https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview', {
      // ...
   });
   ```

- El archivo `lib/realtime-chat-service.ts` implementa la integración directa con la API de OpenAI, estableciendo una conexión WebRTC y enviando/recibiendo mensajes y audio en tiempo real.

**¿Para qué se usa?**
- Generación de respuestas automáticas en conversaciones.
- Simulación de agentes conversacionales inteligentes.
- Asistencia en tareas de aprendizaje, tutoría o soporte automatizado.


**Integración:**
- Para chat en tiempo real, el frontend establece una conexión directa con la API de OpenAI (gpt-4o-realtime-preview) usando WebRTC, gestionado desde `lib/realtime-chat-service.ts`, permitiendo intercambio de audio y texto en tiempo real.


**Ejemplo de flujos de integración:**

*Chat en tiempo real (texto y audio, gpt-4o-realtime-preview):*
```
[Usuario]
   |
[Componente de chat en React]
   |
[Servicio realtime en frontend (`lib/realtime-chat-service.ts`)]
   |
[Conexión WebRTC directa con OpenAI (gpt-4o-realtime-preview)]
   |
[Intercambio de audio y texto en tiempo real]
   |
[Frontend muestra la respuesta y/o audio]
```


## 5. Tailwind CSS

**¿Qué es?**
Tailwind CSS es un framework de utilidades para estilos CSS.

**¿Cómo se usa?**
- Se utiliza para el diseño y la maquetación de la interfaz (`globals.css`, clases en componentes).

**Integración:**
Tailwind se integra en el flujo de Next.js y React, permitiendo estilos rápidos y consistentes.





## 6. Hosting: Vercel

La plataforma está desplegada y hosteada en **Vercel**, un servicio de cloud hosting optimizado para aplicaciones Next.js.

- Permite despliegues automáticos a partir de los cambios en el repositorio.
- Ofrece integración nativa con Next.js para SSR, rutas de API y manejo de variables de entorno.
- Proporciona CDN global, HTTPS y escalabilidad automática.

## Integración General

La plataforma está diseñada de forma modular, donde el frontend (React + Next.js + Tailwind) interactúa con rutas de API internas que a su vez se comunican con servicios externos de IA. TypeScript asegura la calidad del código y la integración entre módulos. Todo el flujo está orquestado por Next.js, facilitando el desarrollo fullstack.


## Diagrama Simplificado

```
[Usuario]
   |
[Frontend (React + Next.js + Tailwind)]
   |
[API Routes (Next.js)]
   |
[Servicios Externos: OpenAI, ElevenLabs]
```