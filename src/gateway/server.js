const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();

/* Auth service routing */

app.use(
 "/auth",
 createProxyMiddleware({
  target: "http://localhost:5000/api/auth",
  changeOrigin: true
 })
);

/* Project routing */

app.use(
 "/projects",
 createProxyMiddleware({
  target: "http://localhost:5000/api/projects",
  changeOrigin: true
 })
);

/* Task routing */

app.use(
 "/tasks",
 createProxyMiddleware({
  target: "http://localhost:5000/api/tasks",
  changeOrigin: true
 })
);

app.listen(4000, () => {
 console.log("API Gateway running on port 4000");
});