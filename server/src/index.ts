import { createApp } from "./server.js";

const port = Number(process.env.PORT ?? 3001);
const httpServer = createApp();

httpServer.listen(port, "0.0.0.0", () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on port ${port}`);
});
