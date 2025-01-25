import { Logger } from "jsr:@deno-library/logger";
import { Application } from "jsr:@oak/oak/application";
import { Router } from "jsr:@oak/oak/router";
import { Next } from "jsr:@oak/oak/middleware";
import { Context } from "jsr:@oak/oak/context";
import { isHttpError } from "jsr:@oak/commons@^1.0/http_errors";

const logger = new Logger();

const router = new Router();

router.get("/", (ctx) => {
    ctx.response.body = "Hello World!";
});

router.get("/chat", (ctx) => {
    const socket = ctx.upgrade();
    socket.addEventListener("open", () => {
        logger.info("A client connect to chat!");
    });

    socket.addEventListener("message", (event) => {
        console.log(event.data);
        if (event.data === "ping") {
            socket.send("pong");
        }
    });
});

async function errorMiddleware(ctx: Context, next: Next) {
    try {
        await next();
    } catch (err) {
        if (isHttpError(err)) {
            ctx.response.status = err.status;
        } else {
            ctx.response.status = 500;
        }
        if (err instanceof Error) {
            ctx.response.body = { error: err.message };
        } else {
            ctx.response.body = {
                error: "Server Error!! Please contact system admin.",
            };
        }
        ctx.response.type = "json";
    }
}

function startServer() {
    const app = new Application();
    app.use(errorMiddleware);
    app.use(router.routes());
    app.use(router.allowedMethods());

    const PORT = 5555;
    logger.info("Starting application. Listing on port", PORT + "...");
    app.listen({ port: PORT });
}

startServer();
