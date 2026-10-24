import { type INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { createTestApp } from "./test-helpers.js";

describe("Auth (Contract)", () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /api/auth/login returns accessToken for valid credentials", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: "admin@example.com", password: "ChangeMe123!" })
      .expect(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body).toHaveProperty("user");
    expect(res.body.user).toHaveProperty("role");
  });

  it("POST /api/auth/login rejects invalid credentials", async () => {
    await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: "admin@example.com", password: "wrong-password" })
      .expect(401);
  });

  it("Management endpoints require authentication", async () => {
    await request(app.getHttpServer()).get("/api/server/status").expect(401);
  });
});
