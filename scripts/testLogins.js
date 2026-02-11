const http = require("http");

const users = [
  { email: "employee@example.com", password: "123456" },
  { email: "hr@example.com", password: "123456" },
  { email: "juan@example.com", password: "password123" },
  { email: "maria@example.com", password: "123456" },
  { email: "carlos@example.com", password: "123456" },
];

function postLogin(user) {
  return new Promise((resolve) => {
    const data = JSON.stringify({ email: user.email, password: user.password });
    const options = {
      hostname: "localhost",
      port: 3000,
      path: "/api/auth/login",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
      },
    };

    const req = http.request(options, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        resolve({ email: user.email, statusCode: res.statusCode, body });
      });
    });

    req.on("error", (err) => {
      resolve({ email: user.email, error: err.message });
    });

    req.write(data);
    req.end();
  });
}

(async () => {
  for (const u of users) {
    const result = await postLogin(u);
    console.log("---");
    if (result.error) {
      console.log(`${u.email} -> ERROR: ${result.error}`);
    } else {
      console.log(`${u.email} -> HTTP ${result.statusCode}`);
      try {
        console.log(JSON.parse(result.body));
      } catch (e) {
        console.log("Response body:", result.body);
      }
    }
  }
})();
