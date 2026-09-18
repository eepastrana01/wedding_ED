# BodaED - Sistema de Gestión de Invitados y Familias 💍✨

Aplicación web y móvil diseñada con estética editorial y elegante para la gestión completa de invitados, familias y confirmación de asistencia (RSVP) con persistencia directa en **Neon PostgreSQL**.

---

## 📁 Estructura del Proyecto

```
BodaED/
├── server/                    # Backend API (Node.js + Express + Neon PostgreSQL)
│   ├── src/
│   │   ├── config/            # Conexión a la base de datos (Pool y SSL)
│   │   ├── controllers/       # Controladores RESTful (Guests, Families, Stats, CSV)
│   │   ├── database/          # Migraciones y DDL SQL
│   │   ├── middlewares/       # Manejador centralizado de errores
│   │   ├── routes/            # Rutas de la API (/api/guests, /api/families, etc.)
│   │   ├── services/          # Lógica de negocio e importador de CSV
│   │   └── index.js           # Servidor Express
│   ├── package.json
│   └── .env                   # Variables de entorno y connection string de Neon
├── client/                    # Frontend SPA (React + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── assets/            # Íconos y recursos estéticos
│   │   ├── components/
│   │   │   ├── common/        # Componentes UI (Badges, Modales, Toast, Botones RSVP)
│   │   │   ├── dashboard/     # Métricas de aforo y gráficos de distribución
│   │   │   ├── families/      # Tarjetas de familias y confirmación grupal
│   │   │   ├── guests/        # Vista dual (Tabla desktop + Tarjetas táctiles móvil)
│   │   │   ├── importer/      # Importador CSV con preview interactivo
│   │   │   └── layout/        # Barra superior y navegación inferior fija para móvil
│   │   ├── constants/         # Estados, prioridades y tipos
│   │   ├── context/           # Estado global (WeddingContext) y efectos (Confetti)
│   │   ├── services/          # Clientes API HTTP
│   │   ├── utils/             # Generador de enlaces WhatsApp y formateadores
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
├── package.json               # Orquestador raíz
└── README.md
```

---

## 🚀 Comandos para Ejecutar

### 1. Iniciar todo en simultáneo (Frontend + Backend):
```bash
npm run dev
```

- **Frontend:** `http://localhost:3000`
- **Backend API:** `http://localhost:5000`
- **Acceso desde el móvil en la misma red WiFi:** Abre `http://<IP-DE-TU-PC>:3000` desde el navegador de tu celular o el de tu novia.

---

## 🌟 Características

1. **Columnas CSV Soportadas:**
   - `Nombre`, `Pareja`, `Type`, `Grupo/Relacion`, `Tipo Invitado`, `Prioridad`.
2. **Confirmación Flexible (RSVP):**
   - Confirmación rápida individual con 1 solo toque (Sí / Pendiente / No Asiste).
   - Confirmación por **Familia Completa** en bloque.
3. **Diseño Adaptativo Dual:**
   - **Móvil:** Tarjetas táctiles fluidas, navegación inferior ergonómica y botones de WhatsApp directo.
   - **Web / Desktop:** Tablas completas con filtros rápidos y panel de métricas de aforo.
4. **Base de Datos Neon:**
   - Persistencia segura en la nube vía PostgreSQL con migraciones automáticas.
