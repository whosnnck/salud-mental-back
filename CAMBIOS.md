# Cambios Realizados en el Backend

##  Resumen
Se han actualizado los controladores, middleware y configuración del servidor para que funcione correctamente con el sistema de autenticación del frontend Angular.

##  Cambios Principales

### 1. **auth.controller.js** - Actualizado
**Mejoras:**
-  Respuesta de registro ahora incluye `token` y datos del `user`
-  Respuesta de login ahora incluye `token` y datos del `user`
-  Validación de campos requeridos en registro y login
-  Verificación de email duplicado en registro
-  Mensajes de error genéricos para seguridad ("Credenciales inválidas")
-  Uso de variables de entorno para JWT_SECRET
-  Método logout agregado

**Respuesta de Login (antes):**
```json
{
  "message": "Login exitoso",
  "token": "jwt_token",
  "role": "HR"
}
```

**Respuesta de Login (ahora):**
```json
{
  "message": "Login exitoso",
  "token": "jwt_token",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "HR"
  }
}
```

### 2. **auth.middleware.js** - Actualizado
**Mejoras:**
-  Mejor manejo del header Authorization
-  Validación correcta del formato "Bearer <token>"
-  Mensajes de error mejorados
-  Logging de errores para debugging
-  Uso de variables de entorno para JWT_SECRET

### 3. **server.js** - Actualizado
**Mejoras:**
-  CORS configurado correctamente para Angular (http://localhost:4200)
-  Headers CORS incluyendo Authorization
-  Middleware para parsear urlencoded
-  Manejo de errores 404
-  Mensajes de inicio mejorados
-  Orden correcto de rutas

### 4. **.env** - Nuevo archivo
Archivo de configuración con variables de entorno:
```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=nico1234
DB_NAME=salud_mental_app
JWT_SECRET=tu_clave_secreta_super_segura_aqui
CORS_ORIGIN=http://localhost:4200
```

##  Cómo Ejecutar

### 1. Instalación de dependencias
```bash
cd "c:\Users\nicko\Documents\Proyecto final\salud-mental-backend"
npm install
```

### 2. Crear la base de datos (si no existe)
```sql
CREATE DATABASE salud_mental_app;

CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM("EMPLOYEE", "HR") DEFAULT "EMPLOYEE",
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 3. Iniciar el servidor
```bash
npm start
```

Deberías ver:
```
 Servidor corriendo en http://localhost:3000
 CORS habilitado para http://localhost:4200
```

##  Endpoints

### POST /api/auth/register
**Solicitud:**
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "EMPLOYEE"
}
```

**Respuesta (201):**
```json
{
  "message": "Cuenta creada correctamente",
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "email": "john@example.com",
    "full_name": "John Doe",
    "role": "EMPLOYEE"
  }
}
```

### POST /api/auth/login
**Solicitud:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Respuesta (200):**
```json
{
  "message": "Login exitoso",
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "email": "john@example.com",
    "full_name": "John Doe",
    "role": "EMPLOYEE"
  }
}
```

### GET /api/user/me
**Headers:**
```
Authorization: Bearer eyJhbGc...
```

**Respuesta (200):**
```json
{
  "id": 1,
  "full_name": "John Doe",
  "email": "john@example.com",
  "role": "EMPLOYEE"
}
```

##  Notas Importantes

1. **JWT_SECRET**: En producción, usa una clave secreta fuerte y única
2. **CORS**: Asegúrate de que la URL en `cors.origin` coincida con tu aplicación Angular
3. **Variables de Entorno**: Copia el archivo `.env.example` a `.env` y actualiza los valores
4. **Base de Datos**: Verifica que MySQL esté corriendo y los datos de conexión sean correctos

##  Seguridad

- Las contraseñas se hashean con bcrypt (10 rounds)
- Los tokens JWT expiran en 8 horas
- El middleware verifica el token en todas las rutas protegidas
- Los mensajes de error no revelan información sensible

##  Próximos Pasos

1. Implementar refresh tokens
2. Agregar validación de email
3. Implementar reset de contraseña
4. Agregar rate limiting
5. Implementar logging centralizado

