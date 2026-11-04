import assert from "node:assert/strict";
import test from "node:test";
import { decodeElm327DtcResponse } from "./elm327.ts";

test("decodes standard powertrain trouble codes", () => {
  assert.deepEqual(decodeElm327DtcResponse("43 03 00 01 33"), ["P0300", "P0133"]);
});

test("decodes chassis, body, and network codes", () => {
  assert.deepEqual(decodeElm327DtcResponse("43 71 23 92 34 E2 34"), ["C3123", "B1234", "U2234"]);
});

test("treats an empty ECU response as no stored trouble codes", () => {
  assert.deepEqual(decodeElm327DtcResponse("NO DATA"), []);
  assert.deepEqual(decodeElm327DtcResponse("43 00 00"), []);
});

test("rejects incomplete or unavailable ECU responses", () => {
  assert.throws(() => decodeElm327DtcResponse("SEARCHING..."), /не вернул ответ/);
  assert.throws(() => decodeElm327DtcResponse("43 03 0"), /неполный ответ/);
  assert.throws(() => decodeElm327DtcResponse("UNABLE TO CONNECT"), /ЭБУ не ответил/);
});
