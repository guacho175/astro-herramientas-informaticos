---
title: "TypeScript 5+: Patrones Avanzados, Generics y Tipado Estricto"
description: "Masteriza patrones avanzados en TypeScript 5: Uniones Discriminadas, Generics con const, Narrowing y optimizaciones del compilador."
slug: "typescript-5-buenas-practicas"
image: "https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/typescript/typescript.png"
updated: "Jul 2026"
---

## Introducción a TypeScript 5+

**TypeScript 5** representa uno de los saltos más importantes en la evolución del lenguaje, reduciendo drásticamente los tiempos de compilación, mejorando el consumo de memoria e introduciendo soporte nativo para Decoradores de ECMAScript.

![TypeScript Logo](https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/typescript/typescript.png)

---

## 1. Uniones Discriminadas (Discriminated Unions)

Las uniones discriminadas son la forma más elegante y tipo-segura de modelar estados en aplicaciones complejas (como respuestas HTTP o máquinas de estado):

```typescript
// Definición de tipos de respuesta API
type ApiResponse<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T; timestamp: number }
  | { status: 'error'; message: string; errorCode: number };

function handleResponse<T>(response: ApiResponse<T>) {
  switch (response.status) {
    case 'idle':
      return 'Esperando acción...';
    case 'loading':
      return 'Cargando datos del servidor...';
    case 'success':
      // TypeScript infiere automáticamente que 'data' y 'timestamp' existen
      return `Éxito: ${JSON.stringify(response.data)} a las ${response.timestamp}`;
    case 'error':
      // TypeScript infiere automáticamente 'message' y 'errorCode'
      return `Error [${response.errorCode}]: ${response.message}`;
  }
}
```

---

## 2. Inferencia Literal con `const Type Parameters`

En versiones anteriores, pasar literales a funciones genéricas requería agregar `as const`. En TypeScript 5, podemos indicar que los parámetros genéricos sean inferidos como literales constantes:

```typescript
// TypeScript 5: const Type Parameter
function createConfig<const T extends Record<string, string>>(config: T): T {
  return config;
}

const appSettings = createConfig({
  endpoint: 'https://api.orbynexdigital.cl',
  environment: 'production',
});

// Infiere el tipo literal exacto:
// { readonly endpoint: "https://api.orbynexdigital.cl"; readonly environment: "production"; }
```

---

## 3. Utility Types Indispensables en el Día a Día

```typescript
interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  createdAt: Date;
}

// 1. Partial: Hace todos los campos opcionales (ideal para updates)
type UpdateUserDto = Partial<UserProfile>;

// 2. Pick: Selecciona solo las propiedades necesarias
type UserPreview = Pick<UserProfile, 'id' | 'name' | 'role'>;

// 3. Omit: Excluye propiedades sensibles
type PublicUserProfile = Omit<UserProfile, 'id'>;

// 4. Record: Mapea claves a valores tipo-seguros
type UserRolesPermissions = Record<UserProfile['role'], string[]>;
```

---

## Configuración Recomendada de `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "skipLibCheck": true
  }
}
```

---

## Conclusión

El tipado estricto en TypeScript 5 no solo captura errores en tiempo de compilación, sino que actúa como una documentación viva e inmutable dentro de tu equipo de desarrollo.
