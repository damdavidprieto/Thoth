# 🚀 Despliegue en GitHub Pages

Este proyecto ya está configurado para desplegarse automáticamente en GitHub Pages usando GitHub Actions, pero requiere una pequeña configuración inicial en el repositorio.

## 🛠️ Configuración Requerida

Para activar el despliegue automático:

1. Ve a la pestaña **Settings** (Configuración) de tu repositorio en GitHub.
2. En el menú lateral izquierdo, haz clic en **Pages**.
3. En la sección **Build and deployment**:
   - En **Source**, selecciona **GitHub Actions** (probablemente esté en "Deploy from a branch" por defecto).
   - ¡Eso es todo! GitHub detectará automáticamente el archivo `.github/workflows/static.yml`.

## 🔄 Verificar Despliegue

1. Una vez hecho el cambio anterior, ve a la pestaña **Actions**.
2. Deberías ver un workflow llamado "Deploy static content to Pages" ejecutándose (o puedes probar haciendo un push pequeño o ejecutándolo manualmente).
3. Cuando termine (icono verde ✅), tu sitio estará disponible en la URL que aparece en la sección "deploy" del log.

## 📝 Detalles Técnicos

El archivo de configuración se encuentra en `.github/workflows/static.yml` y está configurado para:
- Desplegarse cuando haces push a la rama `main`.
- Permitir ejecución manual desde la pestaña Actions.
- Utilizar las acciones estándar de GitHub para páginas estáticas (`upload-pages-artifact` y `deploy-pages`).
