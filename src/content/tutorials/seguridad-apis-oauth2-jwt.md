---
title: "Seguridad en APIs: Guía Completa de OAuth 2.0 y JWT"
description: "Aprende a diseñar esquemas de autenticación y autorización robustos con JWT, Refresh Tokens y OAuth 2.0."
slug: "seguridad-apis-oauth2-jwt"
image: "https://jwt.io/img/pic_logo.svg"
updated: "Jul 2026"
---

## Autenticación Stateless con JWT y OAuth 2.0

En la arquitectura moderna de APIs RESTful y microservicios, la autenticación **stateless** (sin estado en el servidor) mediante **JWT (JSON Web Tokens)** se ha convertido en el estándar indiscutible.

![JWT Logo](https://jwt.io/img/pic_logo.svg)

---

## 1. Estructura y Firma de un JWT

Un token JWT consta de tres componentes codificados en Base64URL concatenados por puntos (`.`):

1. **Header:** Define el algoritmo de cifrado (ej. `RS256` o `HS256`).
2. **Payload:** Almacena los *claims* o afirmaciones sobre el usuario (`sub`, `email`, `role`, `exp`).
3. **Signature:** Firma digital generada con una clave secreta privada en el servidor.

---

## 2. Implementación de Verificación de JWT en Node.js/TypeScript

```typescript
import jwt from 'jsonwebtoken';

interface UserJwtPayload {
  userId: string;
  email: string;
  role: 'admin' | 'user';
  iat: number;
  exp: number;
}

const JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY || 'clave_secreta';

export function authenticateRequest(authHeader?: string): UserJwtPayload {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Cabecera Authorization no válida o ausente');
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_PUBLIC_KEY, {
      algorithms: ['RS256', 'HS256'],
    }) as UserJwtPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('El token ha expirado. Por favor solicita un nuevo token');
    }
    throw new Error('Token de autenticación no válido');
  }
}
```

---

## 3. Patrón Seguro: Access Token + Refresh Token

Para evitar vulnerabilidades de seguridad:
- **Access Token:** Corta duración (15 minutos). Almacenado en memoria RAM del cliente.
- **Refresh Token:** Larga duración (7 días). Almacenado exclusivamente en una **Cookie `HttpOnly` `SameSite=Strict` `Secure`**.

```typescript
// Seteo de cookie de Refresh Token en el servidor
res.cookie('refreshToken', token, {
  httpOnly: true, // Inaccesible por JavaScript en cliente (previene XSS)
  secure: true,   // Solo via HTTPS
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});
```

---

## Conclusión

Implementar Access Tokens efímeros junto con Refresh Tokens seguros en cookies `HttpOnly` minimiza el riesgo de secuestro de sesión y ataques XSS/CSRF.
