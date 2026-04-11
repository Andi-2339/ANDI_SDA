const supabase = require('../supabase');

async function routes(fastify, options) {
  
  // GET /tickets
  fastify.get('/', async (request, reply) => {
    const { data, error } = await supabase.from('tickets').select('*');
    if (error) return reply.code(500).send({ error: error.message });
    return reply.send(data);
  });

  // GET /tickets/:id
  fastify.get('/:id', async (request, reply) => {
    const id = request.params.id;
    const { data, error } = await supabase.from('tickets').select('*').eq('id', id).single();
    if (error) return reply.code(404).send({ error: 'Ticket not found' });
    return reply.send(data);
  });

  // GET /tickets/group/:groupId
  fastify.get('/group/:groupId', async (request, reply) => {
    const groupId = request.params.groupId;
    const { data, error } = await supabase.from('tickets').select('*').eq('groupId', groupId);
    if (error) return reply.code(500).send({ error: error.message });
    return reply.send(data);
  });

  // POST /tickets
  fastify.post('/', async (request, reply) => {
    const { 
      titulo, descripcion, estado, asignadoA, prioridad, 
      fechaCreacion, fechaLimite, groupId, comentarios, historialCambios 
    } = request.body;
    
    const { data, error } = await supabase.from('tickets').insert([{
      titulo, 
      descripcion, 
      estado: estado || 'pendiente', 
      asignadoA, 
      prioridad: prioridad || 'media', 
      fechaCreacion, 
      fechaLimite, 
      groupId, 
      comentarios: comentarios || [], 
      historialCambios: historialCambios || []
    }]).select();
    
    if (error) return reply.code(400).send({ error: error.message });
    return reply.code(201).send(data[0]);
  });

  // PUT /tickets/:id
  fastify.put('/:id', async (request, reply) => {
    const id = request.params.id;
    const updateData = { ...request.body };
    
    // Evitar actualizar el id
    delete updateData.id;

    const { data, error } = await supabase.from('tickets').update(updateData).eq('id', id).select();
    if (error) return reply.code(400).send({ error: error.message });
    return reply.send(data[0]);
  });

  // DELETE /tickets/:id
  fastify.delete('/:id', async (request, reply) => {
    const id = request.params.id;
    const { error } = await supabase.from('tickets').delete().eq('id', id);
    if (error) return reply.code(400).send({ error: error.message });
    return reply.code(204).send();
  });
}

module.exports = routes;
