---
title: "Seguridad en APIs: Autenticación OAuth2 y JWT"
description: "Aprende a proteger tus endpoints con tokens de acceso JWT, autenticación stateless y firma de seguridad HMAC/RSA."
slug: "seguridad-apis-oauth2-jwt"
image: "https://jwt.io/img/pic_logo.svg"
updated: "Jul 2026"
---

## Autenticación Moderna en APIs RESTful

En arquitecturas distribuidas y de microservicios, el estándar **JWT (JSON Web Token)** combinado con el flujo **OAuth 2.0** provee un esquema de autenticación sin estado (*stateless*), escalable y seguro.

---

## 1. Anatoma de un JWT

Un JWT consta de 3 partes separadas por puntos (`.`):
- **Header:** Algoritmo de firma (ej: `HS256` o `RS256`).
- **Payload:** Datos del usuario (*claims* como `sub`, `exp`, `role`).
- **Signature:** Firma digital para garantizar que el token no ha sido alterado.

```text
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkNocmlzdGlhbiBHYWxpbmRleiIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

---

## 2. Implementación de Middleware de Verificación

En un entorno Node.js / Express / Astro Server Side:

```typescript
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'secreto_super_seguro';

export function verifyAuthToken(authHeader?: string) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token no proporcionado');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    return decoded;
  } catch (err) {
    throw new Error('Token inválido o expirado');
  }
}
```

---

## Reglas de Oro de Seguridad

- **Expiración Corta:** Configura tiempos de vida cortos para Access Tokens (ej: 15 minutos) combinados con Refresh Tokens en cookies `HttpOnly`.
- **Nunca guardar en localStorage:** Previene vulnerabilidades de ataques XSS (*Cross-Site Scripting*).
- **Cifrado de Comunicaciones:** Obliga el uso de `HTTPS` (TLS 1.3) en todos los endpoints.

---

## Conclusión

El diseño correcto de esquemas OAuth2/JWT es la piedra angular para proteger la información de los usuarios en servicios modernos.
