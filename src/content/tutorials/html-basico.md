---
title: "Introducción a HTML"
description: "Aprende la estructura básica de una página web con HTML."
slug: "html-basico"
image: "https://cdn-icons-png.flaticon.com/512/732/732212.png"
updated: "Sep 2025"
---

## ¿Qué es HTML?

HTML (HyperText Markup Language) es el lenguaje estándar para estructurar el contenido de páginas web.  
Está compuesto por **etiquetas** que indican al navegador cómo mostrar los elementos, como textos, imágenes, enlaces, listas y más.

---

## Estructura mínima de un documento

Todo documento HTML debe tener una estructura básica que defina el tipo de contenido, el idioma, el encabezado y el cuerpo.

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Mi primera página</title>
</head>
<body>
  <h1>¡Hola Mundo!</h1>
  <p>Este es mi primer documento HTML.</p>
</body>
</html>
```

---

### Explicación del código

- `<!DOCTYPE html>`: Indica que se usará HTML5 como estándar.
- `<html lang="es">`: Define el inicio del documento y el idioma (español).
- `<head>`: Contiene metadatos como el conjunto de caracteres (`UTF-8`) y el título de la pestaña del navegador.
- `<title>`: Título que aparece en la pestaña del navegador.
- `<body>`: Sección donde va todo el contenido visible en la página.
- `<h1>`: Título principal.
- `<p>`: Párrafo de texto.

---

## Buenas prácticas

- Usa sangría y saltos de línea para que el código sea más legible.
- Siempre define el `charset="UTF-8"` para soportar caracteres especiales en español.
- Usa etiquetas semánticas cuando sea posible (por ejemplo: `<header>`, `<main>`, `<footer>`).

---

## Conclusión

HTML es el punto de partida para todo desarrollo web.  
Con una estructura clara y bien definida, puedes comenzar a construir páginas accesibles, legibles y compatibles con todos los navegadores modernos.
