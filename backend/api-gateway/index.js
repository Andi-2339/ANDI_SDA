require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const fastify = require('fastify')({ logger: true });

// Configuración de CORS
fastify.register(require('@fastify/cors'), { 
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
});

// Configuración JWT (compartida o validada si el Gateway va a verificar)
// Como usamos Supabase, el Gateway puede simplemente pasar el Bearer token y dejar
// que los microservicios y Supabase lo validen, o validarlo él mismo si usamos nuestro JWT.
// Si validamos aquí para proteger rutas:
fastify.register(require('@fastify/jwt'), {
  secret: process.env.JWT_SECRET || 'super_secret_jwt_key_123' 
});

// Gancho Global de Seguridad y Permisos
fastify.addHook('preHandler', async (request, reply) => {
  // 1. Excluir rutas públicas (Autenticación)
  if (request.url.startsWith('/auth')) {
    return;
  }

  // 2. Validar JWT (Autenticación)
  try {
    await request.jwtVerify();
  } catch (err) {
    return reply.code(401).send({ error: 'Token inválido o ausente' });
  }

  // 3. Validar Permisos (Autorización)
  const userPermissions = request.user.role; // Extraído del JWT
  const method = request.method;
  const url = request.url;

  // Mapa de Acción según Método HTTP
  const actionMap = {
    'GET': 'view',
    'POST': 'add',
    'PUT': 'edit',
    'DELETE': 'delete'
  };

  const action = actionMap[method];
  
  // Identificar el recurso (groups, tickets, users)
  let resource = null;
  if (url.startsWith('/groups')) resource = 'groups';
  if (url.startsWith('/tickets')) resource = 'tickets';
  if (url.startsWith('/users')) resource = 'users';

  // Si no hay recurso identificado, permitimos (ej: rutas base)
  if (!resource) return;

  // Verificar si el usuario tiene el permiso
  const hasPermission = userPermissions && userPermissions[resource] && userPermissions[resource][action];

  if (!hasPermission) {
    fastify.log.warn(`Acceso denegado: Usuario ${request.user.username} intentó ${action} en ${resource}`);
    return reply.code(403).send({ 
      error: 'Acceso denegado', 
      message: `No tienes permisos para realizar la acción '${action}' en '${resource}'` 
    });
  }

  // PROTECCIÓN EXTRA: Solo alguien con permiso 'manage' puede enviar el campo 'permissions' en el body
  if (method === 'PUT' || method === 'POST') {
    const body = request.body;
    if (body && body.permissions) {
      const canManage = userPermissions && userPermissions.users && userPermissions.users.manage;
      if (!canManage) {
        fastify.log.warn(`Intento de usurpación: Usuario ${request.user.username} intentó modificar permisos sin autorización`);
        return reply.code(403).send({ 
          error: 'Acceso denegado', 
          message: 'No tienes permisos para modificar los roles o permisos de los usuarios.' 
        });
      }
    }
  }
});

// Registrar proxy para Autenticación y Usuarios (Microservicio Users -> puerto 3001)
// Redirige /auth/* -> http://127.0.0.1:3001/auth/*
fastify.register(require('@fastify/http-proxy'), {
  upstream: 'http://127.0.0.1:3001',
  prefix: '/auth',
  rewritePrefix: '/auth',
  http2: false
});

// Redirige /users/* -> http://127.0.0.1:3001/*
fastify.register(require('@fastify/http-proxy'), {
  upstream: 'http://127.0.0.1:3001',
  prefix: '/users',
  rewritePrefix: '',
  http2: false
});

// Registrar proxy para Grupos (Microservicio Groups -> puerto 3002)
fastify.register(require('@fastify/http-proxy'), {
  upstream: 'http://127.0.0.1:3002',
  prefix: '/groups',
  rewritePrefix: ''
});

// Registrar proxy para Tickets (Microservicio Tickets -> puerto 3003)
fastify.register(require('@fastify/http-proxy'), {
  upstream: 'http://127.0.0.1:3003',
  prefix: '/tickets',
  rewritePrefix: ''
});

const start = async () => {
  try {
    const port = process.env.PORT || 3000;
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info(`API Gateway running securely at port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
