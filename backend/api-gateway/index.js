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

const supabase = require('./supabase');

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
    return reply.code(401).send({ 
      status: 'error', 
      code: 401, 
      message: 'Token inválido o ausente',
      details: err.message 
    });
  }

  // 3. Validar Permisos (Autorización)
  const userRole = request.user.role; // Permisos globales
  const memberships = request.user.memberships || []; // Membresías por grupo
  
  const method = request.method;
  const url = request.url;

  // Identificar el recurso y la acción de forma más granular
  let resource = null;
  let action = null;
  let ticketId = null;

  if (url.startsWith('/groups')) resource = 'groups';
  if (url.startsWith('/users')) resource = 'users';

  // Lógica específica para Tickets
  if (url.startsWith('/tickets')) {
    resource = 'tickets';
    if (method === 'POST') action = 'add';
    else if (method === 'GET') action = 'view';
    else if (method === 'DELETE') action = 'delete';
    else if (method === 'PUT') action = 'edit';
    else if (method === 'PATCH' && url.includes('/status')) {
      action = 'move';
      // Extraer ID del ticket de la URL /tickets/:id/status
      const parts = url.split('/');
      ticketId = parts[2];
    }
  } else {
    // Mapa de Acción genérico para otros recursos
    const actionMap = { 'GET': 'view', 'POST': 'add', 'PUT': 'edit', 'DELETE': 'delete' };
    action = actionMap[method];
  }

  if (!resource || !action) return;

  // Determinar qué permisos usar (Globales o del Grupo actual)
  // Nota: En una implementación real, el cliente enviaría un header 'x-group-id'
  // Por ahora, si el usuario tiene una membresía activa, usamos esos permisos.
  let userPermissions = userRole; 
  const activeGroupId = request.headers['x-group-id'];
  if (activeGroupId) {
    const membership = memberships.find(m => m.group_id == activeGroupId);
    if (membership) userPermissions = membership.permissions;
  }

  // Verificar si el usuario tiene el permiso
  const hasPermission = userPermissions && userPermissions[resource] && userPermissions[resource][action];

  if (!hasPermission) {
    return reply.code(403).send({ 
      status: 'error',
      code: 403, 
      message: `No tienes permisos para realizar la acción '${action}' en el recurso '${resource}'`,
      details: null
    });
  }

  // 4. VALIDACIÓN DE PROPIEDAD/ASIGNACIÓN (Regla de Negocio en Gateway)
  if (resource === 'tickets' && action === 'move' && ticketId) {
    const { data: ticket, error } = await supabase
      .from('tickets')
      .select('asignadoA')
      .eq('id', ticketId)
      .single();

    if (error || !ticket) {
      return reply.code(404).send({ status: 'error', code: 404, message: 'Ticket no encontrado', details: null });
    }

    // El ticket debe estar asignado al usuario que hace la petición
    if (ticket.asignadoA !== request.user.username) {
      return reply.code(403).send({ 
        status: 'error',
        code: 403, 
        message: 'Acceso denegado: Solo puedes mover tickets que tengas asignados.',
        details: { ticketId, assignedTo: ticket.asignadoA, currentUser: request.user.username }
      });
    }
  }

  // PROTECCIÓN EXTRA: Solo alguien con permiso 'manage' puede enviar el campo 'permissions' en el body
  if (method === 'PUT' || method === 'POST') {
    const body = request.body;
    if (body && body.permissions) {
      const canManage = userPermissions && userPermissions.users && userPermissions.users.manage;
      if (!canManage) {
        return reply.code(403).send({ 
          status: 'error',
          code: 403, 
          message: 'No tienes permisos para modificar los roles o permisos de los usuarios.',
          details: null
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
