import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';

const server: FastifyInstance = Fastify({
    logger: true
});

server.register(cors, {
    origin: '*' // Allow all for dev
});

server.get('/', async (request, reply) => {
    return { hello: 'world', system: 'PricePoint v2.0 API' };
});

const start = async () => {
    try {
        await server.listen({ port: 3000 });
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
