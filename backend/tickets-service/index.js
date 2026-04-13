require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const fastify = require('fastify')({ logger: true });

fastify.register(require('@fastify/cors'), { 
  origin: '*' 
});

fastify.register(require('./routes/ticket.routes'));

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
      intOpCode: `SxTK${reply.statusCode}`, // Sx + TK (Tickets) + Code
      data: json
    };
    
    return JSON.stringify(wrapped);
  } catch (err) {
    return payload;
  }
});

const start = async () => {
  try {
    const port = process.env.PORT || 3003;
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info(`Tickets service running at port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
