import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_HOST,
  DEFAULT_PORT,
  createSessionId,
  isValidSessionId,
  parseCliOptions,
} from "./types.ts";

test("parseCliOptions returns stdio defaults", () => {
  const options = parseCliOptions([]);
  assert.equal(options.transport, "stdio");
  assert.equal(options.port, DEFAULT_PORT);
  assert.equal(options.host, DEFAULT_HOST);
});

test("parseCliOptions parses explicit values", () => {
  const options = parseCliOptions(["--transport", "sse", "--port", "4123", "--host", "0.0.0.0"]);
  assert.equal(options.transport, "sse");
  assert.equal(options.port, 4123);
  assert.equal(options.host, "0.0.0.0");
});

test("parseCliOptions rejects invalid transport", () => {
  assert.throws(
    () => parseCliOptions(["--transport", "http"]),
    /Invalid --transport value/,
  );
});

test("parseCliOptions rejects invalid port", () => {
  assert.throws(
    () => parseCliOptions(["--port", "99999"]),
    /Invalid --port value/,
  );
});

test("createSessionId returns valid and stable format", () => {
  const sessionId = createSessionId(0.123456789);
  assert.equal(isValidSessionId(sessionId), true);
});

test("createSessionId produces different IDs for different seeds", () => {
  const first = createSessionId(0.1111111111);
  const second = createSessionId(0.2222222222);
  assert.notEqual(first, second);
});
