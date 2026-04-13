require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const fastify = require('fastify')({ logger: true });

// Cors para el microservicio individual (el API gateway también tiene el suyo)
fastify.register(require('@fastify/cors'), { 
  origin: '*' 
});

fastify.register(require('./routes/user.routes'));

// Estandarización de Respuesta Universal
fastify.addHook('onSend', async (request, reply, payload) => {
  const contentType = reply.getHeader('content-type');
  // Solo envolver si es JSON y no es un 204 (No Content)
  if (reply.statusCode === 204 || (contentType && !contentType.includes('application/json'))) {
    return payload;
  }

  try {
    const json = JSON.parse(payload);
    
    // Evitar doble envoltura (si el microservicio ya lo envió envuelto o es un error del gateway)
    if (json && typeof json === 'object' && json.statusCode && json.intOpCode) {
      return payload;
    }

    const wrapped = {
      statusCode: reply.statusCode,
      intOpCode: `SxUS${reply.statusCode}`, // Sx + US (Users) + Code
      data: json
    };
    
    return JSON.stringify(wrapped);
  } catch (err) {
    // Si no es un JSON válido, retornamos tal cual (ej. errores de sistema)
    return payload;
  }
});

const start = async () => {
  try {
    const port = process.env.PORT || 3001;
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info(`Users service running at port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
