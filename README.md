# 90minutos

Sitio web estático **90 Minutos Sports** — catálogo de camisas, consulta por Instagram, cotización USD→VES (DolarApi) y favoritos en localStorage.

## Cómo verlo en local

```bash
python3 -m http.server 8080
```

Abre `http://localhost:8080`.

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
