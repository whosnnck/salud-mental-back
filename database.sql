-- =====================================================
-- BASE DE DATOS: SALUD MENTAL
-- =====================================================

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS salud_mental;
USE salud_mental;

-- =====================================================
-- TABLA: users (Autenticación)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('EMPLOYEE', 'HR', 'ADMIN') NOT NULL DEFAULT 'EMPLOYEE',
  department VARCHAR(100),
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
);

-- =====================================================
-- TABLA: checkins (Check-ins diarios del empleado)
-- =====================================================
CREATE TABLE IF NOT EXISTS checkins (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  mood ENUM('good', 'neutral', 'bad', 'tired') NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);

-- =====================================================
-- TABLA: diary_entries (Entradas del diario emocional)
-- =====================================================
CREATE TABLE IF NOT EXISTS diary_entries (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  emotion VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  is_shareable BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);

-- =====================================================
-- TABLA: support_requests (Solicitudes de apoyo)
-- =====================================================
CREATE TABLE IF NOT EXISTS support_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  request_type ENUM('contact_hr', 'psychological', 'general') NOT NULL,
  subject VARCHAR(200),
  message TEXT NOT NULL,
  urgency ENUM('low', 'medium', 'high', 'crisis') DEFAULT 'medium',
  phone_contact VARCHAR(20),
  status ENUM('pending', 'in_progress', 'resolved') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_urgency (urgency)
);

-- =====================================================
-- INSERTAR DATOS DE PRUEBA
-- =====================================================

-- Usuarios de prueba (contraseña: password123 hasheada con bcrypt)
-- Hash: $2b$10$YOvVJdsQK/jLOVP3h1nSUOVgQvxmQYqNYPZYQvxmQYqNYPZYQvxmQY (ejemplo, genera el tuyo)
-- Limpiamos los datos de prueba anteriores si es necesario
-- TRUNCATE TABLE users;

-- Usuarios de prueba con el hash corregido de 'password123'
INSERT INTO users (full_name, email, password, role, department, phone) VALUES
('Empleado Test', 'employee@example.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6L65Wq8T8QW5S3ka', 'EMPLOYEE', 'Desarrollo', '555-1001'),
('Recursos Humanos', 'hr@example.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6L65Wq8T8QW5S3ka', 'HR', 'RRHH', '555-2001'),
('Juan Pérez', 'juan@example.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6L65Wq8T8QW5S3ka', 'EMPLOYEE', 'Desarrollo', '555-3001'),
('María García', 'maria@example.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6L65Wq8T8QW5S3ka', 'EMPLOYEE', 'Marketing', '555-3002'),
('Carlos López', 'carlos@example.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6L65Wq8T8QW5S3ka', 'EMPLOYEE', 'Ventas', '555-3003');
-- Check-ins de prueba
INSERT INTO checkins (user_id, mood, notes) VALUES
(1, 'good', 'Me siento bien hoy, tengo mucha energía'),
(1, 'neutral', 'Un día normal, sin mayores cambios'),
(1, 'good', 'Excelente día, proyecto completado'),
(3, 'good', 'Trabajé bien en el proyecto'),
(3, 'neutral', 'Día típico de trabajo'),
(4, 'neutral', 'Día ocupado pero productivo'),
(4, 'tired', 'Cansada después de la presentación'),
(5, 'good', 'Logré cerrar varias ventas hoy');

-- Entradas del diario de prueba
INSERT INTO diary_entries (user_id, emotion, content, is_shareable) VALUES
(1, 'Reflexivo', 'Hoy reflexioné sobre mis objetivos profesionales. Siento que estoy en el camino correcto.', FALSE),
(1, 'Esperanzado', 'Las cosas están mejorando. Tengo nuevas perspectivas y estoy ansioso por los cambios que vienen.', FALSE),
(3, 'Motivado', 'Completé un proyecto importante. Me siento muy motivado con los resultados.', FALSE),
(4, 'Ansiosa', 'Tengo mucho estrés debido a la carga de trabajo, pero confío en poder manejarlo.', TRUE);

-- Solicitudes de apoyo de prueba
INSERT INTO support_requests (user_id, request_type, subject, message, urgency, phone_contact, status) VALUES
(1, 'contact_hr', 'Consulta general', 'Me gustaría hablar sobre oportunidades de desarrollo profesional', 'medium', '555-1001', 'pending'),
(3, 'psychological', 'Ayuda para manejo de estrés', 'Necesito hablar con un profesional sobre técnicas de manejo del estrés', 'high', '555-3001', 'in_progress'),
(4, 'general', 'Beneficios', 'Consulta sobre beneficios adicionales', 'low', '555-3002', 'pending');

-- =====================================================
-- VISTA: employee_summary (Resumen para HR)
-- =====================================================
CREATE VIEW employee_summary AS
SELECT 
  u.id,
  u.full_name AS name,
  u.email,
  u.department,
  u.role,
  (SELECT mood FROM checkins WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) AS lastMood,
  (SELECT DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') FROM checkins WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) AS lastCheckIn,
  CASE 
    WHEN (SELECT MAX(created_at) FROM checkins WHERE user_id = u.id AND DATE(created_at) = CURDATE()) IS NOT NULL THEN 'Presente'
    ELSE 'Ausente'
  END AS status
FROM users u
WHERE u.role = 'EMPLOYEE' AND u.is_active = TRUE
ORDER BY u.full_name;

-- =====================================================
-- ÍNDICES ADICIONALES PARA MEJOR RENDIMIENTO
-- =====================================================
CREATE INDEX idx_checkins_user_date ON checkins(user_id, created_at);
CREATE INDEX idx_diary_user_date ON diary_entries(user_id, created_at);
CREATE INDEX idx_support_user_status ON support_requests(user_id, status);

-- =====================================================
-- MOSTRAR ESTRUCTURA CREADA
-- =====================================================
SELECT '✅ Base de datos creada exitosamente' AS status;
SHOW TABLES;
