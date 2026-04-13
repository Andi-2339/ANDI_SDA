require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const fastify = require('fastify')({ logger: true });

fastify.register(require('@fastify/cors'), { 
  origin: '*' 
});

fastify.register(require('./routes/group.routes'));

// Estandarización de Respuesta Universal
fastify.addHook('onSend', async (request, reply, payload) => {
  const contentType = reply.getHeader('content-type');
  if (reply.statusCode === 204 || (contentType && !contentType.includes('application/json'))) {
    return payload;
  }

  try {
    const json = JSON.parse(payload);
    if (json && typeof json === 'object' && json.statusCode && json.intOpCode) {
      return payload;
    }

    const wrapped = {
      statusCode: reply.statusCode,
      intOpCode: `SxGR${reply.statusCode}`, // Sx + GR (Groups) + Code
      data: json
    };
    
    return JSON.stringify(wrapped);
  } catch (err) {
    return payload;
  }
});

const start = async () => {
  try {
    const port = process.env.PORT || 3002;
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info(`Groups service running at port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
