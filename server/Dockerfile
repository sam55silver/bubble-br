FROM denoland/deno:2.1.5
EXPOSE 5555
WORKDIR /app
COPY . .
CMD ["deno", "run", "--watch", "--allow-net", "--allow-env", "main.ts"]
