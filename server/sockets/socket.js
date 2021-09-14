const { io } = require('../server');
const { Usuarios } = require('../clases/usuarios');
const { crearMensaje } = require('../utilidades/utilidades'); 

const usuarios = new Usuarios();


io.on('connection', (client) => {

	client.on('entrarChat', (usuario, callback) => {

		if ( !usuario.nombre || !usuario.sala ) {
			return callback({
				error: true,
				mensaje: 'El nombre/sala es necesario'
			});
		}
		//unir el cliente a una sala
		client.join(usuario.sala);

		usuarios.agregarPersonas( client.id, usuario.nombre, usuario.sala );

		//notificar quien se conecta lista de personas
		client.broadcast.to(usuario.sala).emit('listaPersona', usuarios.getPersonasPorSala(usuario.sala));

		callback( usuarios.getPersonasPorSala(usuario.sala) );

	});


	client.on('crearMensaje', (data) => {

		let persona = usuarios.getPersona( client.id );

		let mensaje = crearMensaje( persona.nombre, data.mensaje );
		client.broadcast.to(persona.sala).emit('crearMensaje', mensaje)

	})


	//desconexion
	client.on('disconnect', () => {
		
		let personaBorrada = usuarios.borrarPersona( client.id );
		client.broadcast.to(personaBorrada.sala).emit('crearMensaje', crearMensaje('Administrador', `${ personaBorrada.nombre } salió`) );
		client.broadcast.to(personaBorrada.sala).emit('listaPersona', usuarios.getPersonasPorSala(personaBorrada.sala));
	});


	//mensajes privados
	client.on('mensajePrivado', data =>{

		let persona = usuarios.getPersona( client.id )

		client.broadcast.to(data.para).emit('mensajePrivado', crearMensaje(persona.nombre, data.mensaje) );

	})

});