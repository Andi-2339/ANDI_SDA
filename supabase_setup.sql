-- Script de Configuración Inicial para Supabase (Sincronizado con Angular Models)

-- LIMPIEZA TOTAL: Borrar tablas para asegurar que no queden políticas de seguridad (RLS) antiguas
DROP TABLE IF EXISTS public.tickets;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.groups;

-- 1. Tabla de Grupos (Workspaces)
CREATE TABLE public.groups (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    nivel VARCHAR(50),
    autor VARCHAR(255),
    integrantes INTEGER DEFAULT 0,
    tickets INTEGER DEFAULT 0,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.groups DISABLE ROW LEVEL SECURITY;

-- 2. Tabla de Usuarios
CREATE TABLE public.users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    "fullName" VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    "groupId" INTEGER REFERENCES public.groups(id) ON DELETE SET NULL,
    active BOOLEAN DEFAULT true,
    permissions JSONB DEFAULT '{
      "groups": {"view": false, "add": false, "edit": false, "delete": false, "manage": false},
      "users": {"view": false, "add": false, "edit": false, "delete": false, "manage": false},
      "tickets": {"view": false, "add": false, "edit": false, "delete": false, "manage": false}
    }',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 3. Tabla de Tickets
CREATE TABLE public.tickets (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    estado VARCHAR(50) DEFAULT 'pendiente',
    "asignadoA" VARCHAR(255),
    prioridad VARCHAR(50),
    "fechaCreacion" VARCHAR(100),
    "fechaLimite" VARCHAR(100),
    "groupId" INTEGER REFERENCES public.groups(id) ON DELETE CASCADE,
    comentarios JSONB DEFAULT '[]',
    "historialCambios" JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.tickets DISABLE ROW LEVEL SECURITY;

-- Dar permisos básicos a los roles decorativos de Supabase (anon, authenticated)
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;


-- Insertar Datos Semilla Básicos

-- Crear grupo Admin
INSERT INTO public.groups (nombre, nivel, autor, descripcion) 
VALUES ('General', 'Alto', 'Sistema', 'Grupo principal de administración');

-- Crear usuario Admin 
-- Password es 'Admin@12345!'
INSERT INTO public.users (username, password, "fullName", email, "groupId", permissions) 
VALUES (
  'admin', 
  '$2b$10$xgc8t.TMzgg4gSmdtXpxie9/.mBcKgWJFSEZNAWDRRJSnGgDEpbnW', 
  'Administrador', 
  'admin@erp.com', 
  1, 
  '{
    "groups": {"view": true, "add": true, "edit": true, "delete": true, "manage": true},
    "users": {"view": true, "add": true, "edit": true, "delete": true, "manage": true},
    "tickets": {"view": true, "add": true, "edit": true, "delete": true, "manage": true}
  }'
);
