const supabase = require('../supabase');

async function routes(fastify, options) {
  
  // GET /groups
  fastify.get('/', async (request, reply) => {
    const { data, error } = await supabase.from('groups').select('*');
    if (error) return reply.code(500).send({ error: error.message });
    return reply.send(data);
  });

  // GET /groups/:id
  fastify.get('/:id', async (request, reply) => {
    const id = request.params.id;
    const { data, error } = await supabase.from('groups').select('*').eq('id', id).single();
    if (error) return reply.code(404).send({ error: 'Group not found' });
    return reply.send(data);
  });

  // POST /groups
  fastify.post('/', async (request, reply) => {
    const { nombre, nivel, autor, integrantes, tickets, descripcion } = request.body;
    const { data, error } = await supabase.from('groups').insert([{ 
      nombre, 
      nivel, 
      autor, 
      integrantes: integrantes || 0, 
      tickets: tickets || 0, 
      descripcion 
    }]).select();
    
    if (error) return reply.code(400).send({ error: error.message });
    return reply.code(201).send(data[0]);
  });

  // PUT /groups/:id
  fastify.put('/:id', async (request, reply) => {
    const id = request.params.id;
    const updateData = { ...request.body };
    
    // Evitar actualizar el id
    delete updateData.id;

    const { data, error } = await supabase.from('groups').update(updateData).eq('id', id).select();
    if (error) return reply.code(400).send({ error: error.message });
    return reply.send(data[0]);
  });

  // DELETE /groups/:id
  fastify.delete('/:id', async (request, reply) => {
    const id = request.params.id;
    const { error } = await supabase.from('groups').delete().eq('id', id);
    if (error) return reply.code(400).send({ error: error.message });
    return reply.code(204).send();
  });
}

module.exports = routes;
