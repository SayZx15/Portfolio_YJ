import { apiFromEnv, apiServer } from './app.mjs';
const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '127.0.0.1';
const server = apiServer(apiFromEnv());
server.listen(port, host, () => console.log(`Contact API: http://${host}:${port}`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
