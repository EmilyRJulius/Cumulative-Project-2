"use strict"

const request = require("supertest");

const app = require("../app");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    testJobIds,
    u1Token,
    adminToken,
  } = require("./_testCommon");
  
  beforeAll(commonBeforeAll);
  beforeEach(commonBeforeEach);
  afterEach(commonAfterEach);
  afterAll(commonAfterAll);

  /**POST /jobs */
  describe("POST /jobs", function(){
    testJobIds("admin", async function(){
        const response = await request(app)
        .post(`/jobs`)
        .send({
            companyHandle: "c1",
            title: "J-new",
            salary: 10,
            equity: "0.2",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(response.statusCode).toEqual(201);
    expect(response.body).toEqual({
        job: {
            id: expect.any(Number),
            title: "J-new",
            salary: 10,
            equity: "0.2",
            companyHandle: "c1",
        },
    });
    });

    test("Unauthorized users", async function(){
        const response = await request(app)
        .post(`/jobs`)
        .send({
            companyHandle: "c1",
            title: "J-new",
            salary: 10,
            equity: "0.2",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(response.statusCode).toEqual(400);
    });

    test("Request with invalid data", async function(){
        const response = await request(app)
        .post(`/jobs`)
        .send({
            companyHandle: "c1",
            title: "J-new",
            salary: "not-a-number",
            equity: "0.2",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(response.statusCode).toEqual(400);
    });
  });

  /** GET /jobs */

  describe("GET /jobs", function () {
    test("works for anon", async function () {
      const resp = await request(app).get(`/jobs`);
      expect(resp.body).toEqual({
            jobs: [
              {
                id: expect.any(Number),
                title: "J1",
                salary: 1,
                equity: "0.1",
                companyHandle: "c1",
                companyName: "C1",
              },
              {
                id: expect.any(Number),
                title: "J2",
                salary: 2,
                equity: "0.2",
                companyHandle: "c1",
                companyName: "C1",
              },
              {
                id: expect.any(Number),
                title: "J3",
                salary: 3,
                equity: null,
                companyHandle: "c1",
                companyName: "C1",
              },
            ],
          },
      );
    });
  
    test("filtering with 1 filter", async function () {
      const resp = await request(app)
          .get(`/jobs`)
          .query({ hasEquity: true });
      expect(resp.body).toEqual({
            jobs: [
              {
                id: expect.any(Number),
                title: "J1",
                salary: 1,
                equity: "0.1",
                companyHandle: "c1",
                companyName: "C1",
              },
              {
                id: expect.any(Number),
                title: "J2",
                salary: 2,
                equity: "0.2",
                companyHandle: "c1",
                companyName: "C1",
              },
            ],
          },
      );
    });
  
    test("filtering with 2 filters", async function () {
      const resp = await request(app)
          .get(`/jobs`)
          .query({ minSalary: 2, title: "3" });
      expect(resp.body).toEqual({
            jobs: [
              {
                id: expect.any(Number),
                title: "J3",
                salary: 3,
                equity: null,
                companyHandle: "c1",
                companyName: "C1",
              },
            ],
          },
      );
    });
  
    test("invalid filter key", async function () {
      const resp = await request(app)
          .get(`/jobs`)
          .query({ minSalary: 2, nope: "nope" });
      expect(resp.statusCode).toEqual(400);
    });
  });

  describe("GET /jobs/:id", function () {
    test("works for anon", async function () {
      const resp = await request(app).get(`/jobs/${testJobIds[0]}`);
      expect(resp.body).toEqual({
        job: {
          id: testJobIds[0],
          title: "J1",
          salary: 1,
          equity: "0.1",
          company: {
            handle: "c1",
            name: "C1",
            description: "Desc1",
            numEmployees: 1,
            logoUrl: "http://c1.img",
          },
        },
      });
    });
  
    test("no such job", async function () {
      const resp = await request(app).get(`/jobs/0`);
      expect(resp.statusCode).toEqual(404);
    });
  });

  /** PATCH /jobs/:id */

  describe("PATCH /jobs/:id", function () {
    test("authorized: admin", async function () {
      const resp = await request(app)
          .patch(`/jobs/${testJobIds[0]}`)
          .send({
            title: "J-New",
          })
          .set("authorization", `Bearer ${adminToken}`);
      expect(resp.body).toEqual({
        job: {
          id: expect.any(Number),
          title: "J-New",
          salary: 1,
          equity: "0.1",
          companyHandle: "c1",
        },
      });
    });
  
    test("unauthorzed: other users", async function () {
      const resp = await request(app)
          .patch(`/jobs/${testJobIds[0]}`)
          .send({
            title: "J-New",
          })
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(401);
    });
  
    test("not found, no such job", async function () {
      const resp = await request(app)
          .patch(`/jobs/0`)
          .send({
            handle: "new",
          })
          .set("authorization", `Bearer ${adminToken}`);
      expect(resp.statusCode).toEqual(400);
    });
  
    test("bad request: handle change attempt", async function () {
      const resp = await request(app)
          .patch(`/jobs/${testJobIds[0]}`)
          .send({
            handle: "new",
          })
          .set("authorization", `Bearer ${adminToken}`);
      expect(resp.statusCode).toEqual(400);
    });
  
    test("bad request: invalid data", async function () {
      const resp = await request(app)
          .patch(`/jobs/${testJobIds[0]}`)
          .send({
            salary: "not-a-number",
          })
          .set("authorization", `Bearer ${adminToken}`);
      expect(resp.statusCode).toEqual(400);
    });
  });

  /** DELETE /job/:id */

  describe("DELETE /jobs/:id", function () {
    test("authorized: admin", async function () {
      const resp = await request(app)
          .delete(`/jobs/${testJobIds[0]}`)
          .set("authorization", `Bearer ${adminToken}`);
      expect(resp.body).toEqual({ deleted: testJobIds[0] });
    });
  
    test("unauthorized: other users", async function () {
      const resp = await request(app)
          .delete(`/jobs/${testJobIds[0]}`)
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(401);
    });
  
    test("unauthorized: anon", async function () {
      const resp = await request(app)
          .delete(`/jobs/${testJobIds[0]}`);
      expect(resp.statusCode).toEqual(401);
    });
  
    test("not found: no such job", async function () {
      const resp = await request(app)
          .delete(`/jobs/0`)
          .set("authorization", `Bearer ${adminToken}`);
      expect(resp.statusCode).toEqual(404);
    });
  });