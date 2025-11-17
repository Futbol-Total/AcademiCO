# 🎓 AcademiCO - Sistema de Gestión Académica

<div align="center">

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=flat-square&logo=supabase)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![Status](https://img.shields.io/badge/Status-En%20Desarrollo-yellow?style=flat-square)

**Plataforma integral de gestión académica diseñada para optimizar la administración de cursos, estudiantes y materiales educativos.**

</div>

---

## 📋 Descripción del Proyecto

AcademiCO es una plataforma completa y moderna que facilita la administración integral del proceso educativo. Permite a docentes y estudiantes gestionar de manera eficiente todos los aspectos académicos en un solo lugar, desde la creación de cursos hasta el seguimiento del rendimiento estudiantil.

---

## 🎯 Objetivo Principal

El objetivo de AcademiCO es proporcionar una solución completa, intuitiva y escalable para:

- 📚 **Gestión de Cursos**: Crear y administrar cursos con códigos de acceso únicos
- 👥 **Control de Estudiantes**: Administrar inscripciones, asistencia y rendimiento
- 📊 **Calificaciones**: Sistema avanzado de evaluación por cortes
- 📁 **Materiales**: Compartir y organizar recursos educativos digitales
- 📈 **Seguimiento**: Monitorear el progreso en tiempo real
- 🔔 **Comunicación**: Notificaciones automáticas para docentes y estudiantes

---

## ✨ Características

### 👨‍🏫 Para Docentes

**Gestión de Cursos**
- ✅ Crear cursos con información detallada
- ✅ Generar códigos de acceso únicos
- ✅ Ver estadísticas de inscripciones en tiempo real

**Administración de Estudiantes**
- ✅ Visualizar lista de estudiantes inscritos
- ✅ Control de asistencia por fecha
- ✅ Gestionar inscripciones

**Sistema de Calificaciones**
- ✅ Crear actividades evaluativas por cortes
- ✅ Asignar porcentajes a cada actividad
- ✅ Registrar calificaciones automáticamente
- ✅ Cálculo automático de promedios y notas finales

**Materiales Educativos**
- ✅ Subir archivos (PDF, DOCX, PPTX, imágenes, etc.)
- ✅ Organizar materiales por curso
- ✅ Agregar descripciones y tags
- ✅ Control de acceso seguro

### 👨‍🎓 Para Estudiantes

**Inscripción a Cursos**
- ✅ Inscribirse usando códigos de acceso
- ✅ Ver información detallada de cursos disponibles

**Consulta de Calificaciones**
- ✅ Ver calificaciones por actividad
- ✅ Consultar promedios por corte
- ✅ Ver nota final del curso

**Acceso a Materiales**
- ✅ Descargar materiales del curso
- ✅ Consultar recursos compartidos por el docente

**Seguimiento Académico**
- ✅ Ver historial de asistencia personal
- ✅ Consultar progreso en cada curso
- ✅ Monitoreo en tiempo real

---

## 🛠 Tecnologías Utilizadas

| Categoría | Tecnologías |
|-----------|-------------|
| **Frontend** | React 18, TypeScript, Vite |
| **Estilos** | Tailwind CSS, shadcn/ui |
| **Backend** | Supabase, PostgreSQL |
| **Estado** | React Query, React Router |
| **Formularios** | React Hook Form, Zod |
| **Gráficos** | Recharts |

---

## 🚀 Instalación y Configuración

### 📋 Requisitos Previos

- **Node.js** v18+ y npm - [Descargar aquí](https://nodejs.org/)
- **Git** instalado
- Cuenta de **Supabase** - [Crear aquí](https://supabase.com/)

### 📦 Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/Futbol-Total/AcademiCO.git
cd AcademiCO
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env.local
```

Completar con tus credenciales de Supabase:
```env
VITE_SUPABASE_URL=tu_url_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

4. **Iniciar servidor de desarrollo**
```bash
npm run dev
```

---

## 📚 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia servidor de desarrollo con Vite |
| `npm run build` | Construye para producción |
| `npm run preview` | Previsualiza la compilación de producción |
| `npm run lint` | Ejecuta validación de código |

---

## 📁 Estructura del Proyecto

```
AcademiCO/
├── src/
│   ├── components/       # Componentes reutilizables
│   ├── pages/           # Páginas principales
│   ├── lib/             # Utilidades y configuraciones
│   ├── App.tsx          # Componente principal
│   └── main.tsx         # Punto de entrada
├── supabase/
│   ├── migrations/      # Migraciones de base de datos
│   ├── functions/       # Funciones serverless
│   └── config.toml      # Configuración
├── public/              # Archivos estáticos
└── package.json         # Dependencias
```

---

## 🎯 Guía de Uso Rápido

### Para Docentes
1. Regístrate como docente
2. Crea un nuevo curso
3. Comparte el código de acceso
4. Carga materiales y actividades
5. Registra calificaciones

### Para Estudiantes
1. Regístrate como estudiante
2. Inscríbete con código de acceso
3. Accede a materiales y actividades
4. Consulta tus calificaciones

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Para cambios importantes:

```bash
git checkout -b feature/nueva-caracteristica
git commit -m "feat: descripción del cambio"
git push origin feature/nueva-caracteristica
```

---

## 📞 Contacto y Soporte

Si tienes preguntas o encuentras problemas, no dudes en:
- Abrir un [Issue](https://github.com/Futbol-Total/AcademiCO/issues)
- Crear una [Discusión](https://github.com/Futbol-Total/AcademiCO/discussions)

---

## 📄 Licencia

Este proyecto está bajo licencia MIT. Ver `LICENSE` para más detalles.

<div align="center">

**[⬆ Volver al inicio](#-academicoico---sistema-de-gestión-académica)**

Desarrollado con ❤️ por Oscar Vega

</div>#