const request = require("supertest");
var cheerio = require("cheerio");
const db = require("../models/index")
const app = require("../app")
let server, agent;
function extractCsrfToken(res) {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}
describe("todo test suite", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(2000, () => { });
    agent = request.agent(server);
  });
  afterAll(async () => {
    await db.sequelize.close();
    server.close();
  })
  test("respond with json at /todos", async () => {
    const res = await agent.get("/");
    const csrfToken = extractCsrfToken(res);
    const response = await agent.post('/todos').send({
      'title': 'buy chocolate',
      'duedate': new Date().toISOString(),
      completed: false,
      "_csrf": csrfToken

    })
    expect(response.statusCode).toBe(302);
  });

  test("Marks a todo with the given ID as complete", async () => {
    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);
    const response = await agent.post("/todos").send({
      title: "buy icecream",
      duedate: new Date().toISOString(),
      markAsComplete: false,
      "_csrf": csrfToken
    });

    const a = await agent
      .get("/")
      .set("Accept", "application/json");
    const b = JSON.parse(a.text);
    const lastItem = b.dueToday[b.dueToday.length - 1];

    res = await agent.get("/");
    csrfToken = extractCsrfToken(res);

    const markCompleteResponse = await agent.put(`/todos/${lastItem.id}`).send({
      _csrf: csrfToken,
    });

    const parsedUpdateResponse = JSON.parse(markCompleteResponse.text);
    expect(parsedUpdateResponse.markAsComplete).toBe(true);
  });

  test("Marks a todo with the given ID as incomplete", async () => {
    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);
    const response = await agent.post("/todos").send({
      title: "buy icecream",
      duedate: new Date().toISOString(),
      markAsComplete: false,
      "_csrf": csrfToken
    });

    const a = await agent
      .get("/")
      .set("Accept", "application/json");
    const b = JSON.parse(a.text);
    const lastItem = b.dueToday[b.dueToday.length - 1];

    res = await agent.get("/");
    csrfToken = extractCsrfToken(res);

    const markCompleteResponse = await agent.put(`/todos/${lastItem.id}`).send({
      _csrf: csrfToken,
    });

    const parsedUpdateResponse = JSON.parse(markCompleteResponse.text);
    expect(parsedUpdateResponse.markAsComplete).toBe(true);

    res = await agent.get("/");
    csrfToken = extractCsrfToken(res);

    const markIncompleteResponse = await agent.put(`/todos/${lastItem.id}`).send({
      _csrf: csrfToken,
    });
    parsedResponse = JSON.parse(markIncompleteResponse.text);
    expect(parsedResponse.markAsComplete).toBe(false);

  });


  test("Deletes a todo with the given ID if it exists and sends a boolean response", async () => {
    // FILL IN YOUR CODE HERE
    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);
    const response = await agent.post('/todos').send({
      'title': 'drink',
      'duedate': new Date().toISOString(),
      markAsComplete: false,
      "_csrf": csrfToken

    });
    const a = await agent
      .get("/")
      .set("Accept", "application/json");
    const b = JSON.parse(a.text);
    const lastItem = b.dueToday[b.dueToday.length - 1];

    res = await agent.get("/");
    csrfToken = extractCsrfToken(res);


    const deleteres = await agent.delete(`/todos/${lastItem.id}`).send({
      _csrf: csrfToken,
    });
    const c = JSON.parse(deleteres.text);
    expect(c).toBe(true);
  });

})