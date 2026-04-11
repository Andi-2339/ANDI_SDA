require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const fastify = require('fastify')({ logger: true });

// Cors para el microservicio individual (el API gateway también tiene el suyo)
fastify.register(require('@fastify/cors'), { 
  origin: '*' 
});

fastify.register(require('./routes/user.routes'));

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
