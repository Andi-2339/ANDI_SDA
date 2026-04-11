require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const fastify = require('fastify')({ logger: true });

fastify.register(require('@fastify/cors'), { 
  origin: '*' 
});

fastify.register(require('./routes/ticket.routes'));

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
