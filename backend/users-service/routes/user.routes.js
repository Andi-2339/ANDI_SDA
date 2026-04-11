const supabase = require('../supabase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function routes(fastify, options) {
  
  // LOGIN OBTENIENDO DE SUPABASE
  fastify.post('/auth/login', async (request, reply) => {
    const { username, password } = request.body;
    
    console.log('Intento de login para:', username);
    
    // Supabase DB fetch por correo O por username
    // Usamos una consulta más robusta
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .or(`username.eq."${username}",email.eq."${username}"`)
      .single();
      
    if (error || !user) {
      console.log('Usuario no encontrado o error:', error?.message);
      return reply.code(401).send({ error: 'Credenciales inválidas' });
    }
    
    console.log('Usuario encontrado:', user.username);
    
    // Validar pass
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return reply.code(401).send({ error: 'Credenciales inválidas' });
    }
    
    // Generar JWT usando backend normal (puedes usar el propio de Supabase si usas Supabase Auth)
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.permissions }, 
      process.env.JWT_SECRET || 'super_secret_jwt_key_123',
      { expiresIn: '1d' }
    );
    
    delete user.password; // no enviar el password
    
    return reply.send({ ...user, token });
  });

  // REGISTRO PÚBLICO
  fastify.post('/auth/register', async (request, reply) => {
    let { username, password, fullName, email, phone, address } = request.body;
    
    if (!username && email) {
      username = email.split('@')[0];
    }
    
    const userPassword = password || '123456';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userPassword, salt);
    
    // Al ser registro público, asignamos permisos básicos (vista solamente)
    const defaultPermissions = {
      groups: { view: true, add: false, edit: false, delete: false },
      users: { view: false, add: false, edit: false, delete: false },
      tickets: { view: true, add: false, edit: false, delete: false }
    };

    const { data, error } = await supabase.from('users').insert([{
      username, 
      password: hashedPassword, 
      fullName, 
      email, 
      phone, 
      address, 
      groupId: 1, // Default group
      active: true, 
      permissions: defaultPermissions
    }]).select();
    
    if (error) return reply.code(400).send({ error: error.message });
    delete data[0].password;
    return reply.code(201).send(data[0]);
  });

  // RUTAS CRUD USUARIOS
  
  // GET /users
  fastify.get('/', async (request, reply) => {
    const { data, error } = await supabase.from('users').select('*');
    if (error) return reply.code(500).send({ error: error.message });
    // Limpiar contraseñas
    const cleanData = data.map(u => { delete u.password; return u; });
    return reply.send(cleanData);
  });

  // GET /users/:id
  fastify.get('/:id', async (request, reply) => {
    const { data, error } = await supabase.from('users').select('*').eq('id', request.params.id).single();
    if (error) return reply.code(404).send({ error: 'User not found' });
    delete data.password;
    return reply.send(data);
  });

  // POST /users
  fastify.post('/', async (request, reply) => {
    let { username, password, fullName, email, phone, address, groupId, active, permissions } = request.body;
    
    if (!username && email) {
      username = email.split('@')[0];
    }
    
    const userPassword = password || '123456';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userPassword, salt);
    
    const { data, error } = await supabase.from('users').insert([{
      username, 
      password: hashedPassword, 
      fullName, 
      email, 
      phone, 
      address, 
      groupId, 
      active, 
      permissions
    }]).select();
    
    if (error) return reply.code(400).send({ error: error.message });
    delete data[0].password;
    return reply.code(201).send(data[0]);
  });

  // PUT /users/:id
  fastify.put('/:id', async (request, reply) => {
    const id = request.params.id;
    const bodyDate = { ...request.body };
    
    if (bodyDate.password) {
      const salt = await bcrypt.genSalt(10);
      bodyDate.password = await bcrypt.hash(bodyDate.password, salt);
    }
    
    const { data, error } = await supabase.from('users').update(bodyDate).eq('id', id).select();
    
    if (error) return reply.code(400).send({ error: error.message });
    delete data[0].password;
    return reply.send(data[0]);
  });

  // DELETE /users/:id
  fastify.delete('/:id', async (request, reply) => {
    const { error } = await supabase.from('users').delete().eq('id', request.params.id);
    if (error) return reply.code(400).send({ error: error.message });
    return reply.code(204).send();
  });
}

module.exports = routes;
