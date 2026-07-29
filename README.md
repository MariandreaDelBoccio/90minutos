# 90minutos

Sitio web estático **90 Minutos Sports** — catálogo de camisas, consulta por Instagram, cotización USD→VES (DolarApi) y favoritos en localStorage.

## Cómo verlo en local

```bash
npm run dev
```

Abre `http://localhost:8080`.

> Usa `npm run dev` (no `python3 -m http.server`) para que las miniaturas del catálogo Yupoo carguen: Yupoo bloquea hotlink y el servidor local incluye un proxy en `/api/yupoo-img`.

## Catálogo: Disponibles vs Todo el catálogo

En `catalogo.html` hay dos vistas principales:

| Filtro | Origen | Qué muestra |
|--------|--------|-------------|
| **DISPONIBLES** | `data/productos.json` (Decap CMS) | Stock curado con precios, tallas y edición Fan/Player |
| **TODO EL CATÁLOGO** | `data/yupoo/*.json` | Índice del proveedor Yupoo (~16 000 modelos), paginado, bajo consulta |

### Actualizar el catálogo Yupoo

El HTML de Yupoo se scrapea **offline** (no en el navegador del usuario):

```bash
npm run sync-yupoo
```

Opciones útiles:

```bash
# Solo las primeras N páginas remotas (pruebas)
npm run sync-yupoo -- --max-pages 3

# Más espera entre requests (si hay rate-limit)
npm run sync-yupoo -- --delay 600
```

Genera:

- `data/yupoo/meta.json` — total de **modelos** (agrupados), álbumes, páginas, fecha de sync
- `data/yupoo/pages/page-N.json` — chunks de ~100 **grupos** (title + `variants[]`)
- `data/yupoo/search-index.json` — índice liviano para búsqueda por título/variantes
- `data/yupoo/id-to-page.json` — mapa id de grupo/álbum → página

Las variantes del mismo modelo (Fan/Player, manga larga, mujer, niños…) se agrupan por reglas de texto en el título, sin LLM.

Si ya tienes los JSON locales y solo quieres reagrupar:

```bash
npm run sync-yupoo -- --regroup-only
```

Después del sync, haz commit de esos JSON y publica (Netlify rebuild) para que la web los sirva.

En **TODO EL CATÁLOGO** la web muestra primero **tarjetas de equipo** (España, Real Madrid…). Al entrar en un equipo ves las camisas cuyo título coincide con aliases en varios idiomas (`spain` / `españa`, etc.). El diccionario está en `scripts/yupoo-team-dict.mjs`.

En Netlify, las edge functions sirven:
- `/api/yupoo-img` — proxy de miniaturas/fotos (Yupoo rechaza hotlink directo)
- `/api/yupoo-album` — fotos de un álbum al abrir el detalle de una camisa

**No** hace falta base de datos en v1: el sitio sigue siendo estático.

## Gestionar productos sin programar (Decap CMS)

La web ya incluye un panel en `admin` para editar el catálogo con formulario.

### 1) Configurar GitHub

- Edita `admin/config.yml`.
- Cambia `repo: TU_USUARIO/TU_REPO` por tu repositorio real.
- Mantén `branch: main` (o ajusta si usas otra rama).

### 2) Datos del catálogo

- El catálogo público se lee desde `data/productos.json`.
- Decap guarda automáticamente cambios en ese archivo.
- Las imágenes se suben en `assets/productos`.

### 3) Entrar al panel

- Local: `http://localhost:8080/admin/`
- Producción: `https://tu-dominio.com/admin/`

### 4) Autenticación (importante)

Con `backend: github`, Decap necesita OAuth de GitHub.

- Opción recomendada simple: usar [Sveltia CMS](https://github.com/sveltia/sveltia-cms) si quieres evitar backend OAuth propio.
- Opción Decap completa: configurar OAuth (por ejemplo con Netlify Identity o servicio OAuth compatible).

Sin ese paso, el panel carga pero no podrá guardar commits en GitHub.

## Recomendación de despliegue: Netlify

Para este proyecto, la opción más simple para una persona no técnica suele ser:

- Hosting en Netlify (arrastrar/conectar repo).
- Decap CMS con `git-gateway` + Netlify Identity.

Flujo:

1. Publicas el sitio en Netlify conectando `MariandreaDelBoccio/90minutos`.
2. En Netlify activas **Identity** y **Git Gateway**.
3. Invitas a tu amigo por email (Identity).
4. Tu amigo entra en `/admin`, inicia sesión y edita productos.
5. Cada guardado crea commit en GitHub automáticamente.

Si quieres usar esta vía, cambia en `admin/config.yml`:

```yml
backend:
  name: git-gateway
  branch: main
```
