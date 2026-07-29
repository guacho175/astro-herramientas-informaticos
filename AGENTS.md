# AGENTS.md

Reglas obligatorias para cualquier agente de código que trabaje en este repositorio.
Es la **única** fuente de reglas: `CLAUDE.md`, `.cursorrules` y `.github/copilot-instructions.md` son punteros a este archivo y no contienen reglas propias.

## 1. Antes de explorar

Lee **`docs/PROJECT_STATE.md`** primero. Describe el stack, la arquitectura y las limitaciones conocidas: evita que recorras el proyecto para deducirlo.

No recorras el repositorio completo. Nunca leas ni indexes `node_modules/`, `dist/`, `.astro/`, `.vercel/` ni `package-lock.json`.

Abre solo los archivos relacionados con la tarea. Este repositorio tiene menos de 100 archivos versionados: una búsqueda dirigida siempre es más barata que un recorrido.

## 2. Mapa mínimo

```
src/pages/          rutas SSR y endpoints (api/)
src/lib/            domain → application (servicios) → infrastructure (repositorio)
src/components/     UI y calculadoras
src/data/           catálogos estáticos (herramientas, calculadoras)
supabase/migrations/  esquema de base de datos (autoritativo)
scripts/            utilidades operativas con permisos de servicio
docs/               documentación canónica
```

Las páginas llaman a los **servicios**, nunca al repositorio ni a Supabase directamente.

## 3. Fuentes canónicas

| Necesitas saber | Fuente | No uses |
| :--- | :--- | :--- |
| estado, stack, arquitectura, limitaciones | `docs/PROJECT_STATE.md` | el README |
| endpoints, contratos, forma de los datos | `docs/API.md` | inferirlo del código sin actualizar el doc |
| cómo se crean tutoriales | `docs/CONTENT.md` | guías antiguas ya eliminadas |
| esquema de base de datos | `supabase/migrations/` | prosa en cualquier documento |
| por qué algo es como es | `docs/adr/` | suposiciones |
| qué se hizo antes | `git log` | archivos de bitácora |

**Ante conflicto entre un documento y el código, gana el código**: corrige el documento en el mismo cambio y dilo en el reporte.

El `README.md` es material de presentación pública. No es fuente de verdad técnica.

## 4. Comandos reales

```bash
npm run dev                   # localhost:4321
npm run build                 # ÚNICA validación de código disponible
npm run preview
node scripts/check-docs.mjs   # validación documental
```

**No existen** `npm test`, `npm run lint`, `npm run typecheck` ni `astro check`. No los inventes ni los declares ejecutados.

## 5. Convenciones y restricciones

- Los tutoriales viven en la tabla `tutorials` de Supabase. **Nunca crees archivos `.md` de tutoriales.** Las colecciones de contenido de Astro fueron eliminadas y no volverán.
- El sitio es **SSR** (`output: 'server'` + adaptador de Vercel). No propongas convertirlo a estático: ver `docs/adr/0001-ssr-en-vercel.md`.
- Nunca leas, imprimas ni vuelques `.env`, `.vercel/`, ni valores de `SUPABASE_SERVICE_ROLE_KEY`, `PUBLIC_SUPABASE_ANON_KEY` o `GEMINI_API_KEY`. En documentación y en código de ejemplo usa solo **nombres** de variables.
- La documentación se escribe asumiendo que el repositorio podría hacerse público: sin credenciales, URLs de proyecto, hashes ni datos personales.
- No ejecutes nada de `scripts/` sin autorización explícita: escriben en la base de datos real con permisos de servicio.
- No hagas `git push`, `git commit --amend`, `git reset --hard` ni despliegues sin que se te pida.
- **Alcance:** modifica solo lo necesario para la tarea. Refactorizaciones, renombrados y limpiezas colaterales se proponen; no se ejecutan.

## 6. Trabajo concurrente

Puede haber otro agente o chat trabajando en paralelo.

- Ejecuta `git status` y `git diff` **antes de tu primera edición**. Si hay cambios sin confirmar que no son tuyos, detente y repórtalo.
- Nunca sobrescribas ni revuelvas trabajo ajeno. Ante duda, pregunta.
- Tareas que abarcan varias sesiones: crea un plan propio en `docs/tasks/AAAA-MM-descripcion.md`. **Un archivo por tarea, nombre único.** Nunca un `PLAN.md` compartido ni un archivo de estado temporal común.
- Tareas de una sola sesión: **no crees archivo de plan.**

## 7. Regla de impacto documental

Toda tarea de implementación debe:

1. Identificar los archivos de código afectados.
2. Determinar si cambia alguno de estos: comportamiento visible · API o contratos · comandos · configuración · arquitectura · modelo de datos · migraciones · dependencias relevantes · instalación · despliegue · seguridad · limitaciones conocidas · flujo operativo.
3. Si cambia alguno, localizar **solo** el documento canónico correspondiente (tabla del punto 3).
4. Actualizarlo en el mismo cambio, tocando la superficie mínima.
5. Ejecutar `node scripts/check-docs.mjs`.
6. Revisar el diff final completo.
7. Declararlo en el reporte.

Un cambio interno sin impacto comprobable **no** obliga a tocar documentación. Dilo y justifícalo.

## 8. Definición de terminado

- `npm run build` pasa.
- `node scripts/check-docs.mjs` pasa.
- Diff revisado; sin archivos ni cambios fuera del alcance pedido.
- Documentación canónica coherente con el código.

## 9. Formato del reporte final

Termina siempre con estas cinco líneas:

```
Qué cambió:        <una frase>
Archivos:          <lista>
Validaciones:      <comando → resultado real; si no se ejecutó, dilo>
Impacto documental: actualizado <ruta>  |  sin impacto documental porque <razón>
Pendientes/riesgos: <o "ninguno">
```

Reporta resultados con fidelidad: si una validación falla, muestra la salida; si omitiste un paso, dilo.
