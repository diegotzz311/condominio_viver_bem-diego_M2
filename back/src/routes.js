const { Router } = require("express");
const { timingSafeEqual } = require("crypto");
const { pool } = require("./database");
const config = require("./config/database");

const routes = Router();

function requireSyndic(req, res, next) {
  const authorization = req.get("authorization") || "";
  const [scheme, encodedCredentials] = authorization.split(" ");
  if (scheme !== "Basic" || !encodedCredentials) {
    res.set("WWW-Authenticate", 'Basic realm="Condominio Viver Bem"');
    return res.status(401).json({ message: "Acesso exclusivo para o síndico." });
  }

  let credentials;
  try {
    credentials = Buffer.from(encodedCredentials, "base64").toString("utf8");
  } catch {
    return res.status(401).json({ message: "Credenciais do síndico inválidas." });
  }

  const separatorIndex = credentials.indexOf(":");
  if (separatorIndex < 0) {
    return res.status(401).json({ message: "Credenciais do síndico inválidas." });
  }

  const email = credentials.slice(0, separatorIndex);
  const password = credentials.slice(separatorIndex + 1);
  const expectedEmail = Buffer.from(config.syndicEmail);
  const suppliedEmail = Buffer.from(email);
  const expectedPassword = Buffer.from(config.syndicPassword);
  const suppliedPassword = Buffer.from(password);
  const emailMatches = expectedEmail.length === suppliedEmail.length
    && timingSafeEqual(expectedEmail, suppliedEmail);
  const passwordMatches = expectedPassword.length === suppliedPassword.length
    && timingSafeEqual(expectedPassword, suppliedPassword);

  if (!emailMatches || !passwordMatches) {
    return res.status(401).json({ message: "Credenciais do síndico inválidas." });
  }

  return next();
}

routes.get("/", (req, res) => {
  return res.status(200).json({ message: "Server on" });
});

routes.get("/api/reservations", requireSyndic, async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT id, apartment_number, event_date, event_time, requested_at FROM reservations ORDER BY event_date, event_time"
    );
    return res.status(200).json({ reservations: result.rows });
  } catch (error) {
    return next(error);
  }
});

routes.post("/api/reservations", async (req, res, next) => {
  const body = req.body || {};
  const apartmentNumber = typeof body.apartmentNumber === "string"
    ? body.apartmentNumber.trim()
    : "";
  const eventDate = typeof body.eventDate === "string"
    ? body.eventDate
    : "";
  const eventTime = typeof body.eventTime === "string"
    ? body.eventTime
    : "";

  if (!apartmentNumber || apartmentNumber.length > 30) {
    return res.status(400).json({
      message: "Informe um número de apartamento válido (até 30 caracteres)."
    });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    return res.status(400).json({ message: "Informe uma data de evento válida." });
  }

  const parsedDate = new Date(`${eventDate}T00:00:00.000Z`);
  if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== eventDate) {
    return res.status(400).json({ message: "Informe uma data de evento válida." });
  }

  const now = new Date();
  const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
  if (eventDate < today) {
    return res.status(400).json({ message: "A data do evento não pode estar no passado." });
  }

  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(eventTime)) {
    return res.status(400).json({ message: "Informe um horário de evento válido." });
  }

  if (eventDate === today) {
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    if (eventTime < currentTime) {
      return res.status(400).json({ message: "O horário do evento não pode estar no passado." });
    }
  }

  try {
    const result = await pool.query(
      "INSERT INTO reservations (apartment_number, event_date, event_time) VALUES ($1, $2, $3) RETURNING id, apartment_number, event_date, event_time, requested_at",
      [apartmentNumber, eventDate, eventTime]
    );
    return res.status(201).json({
      message: "Solicitação de reserva registrada.",
      reservation: result.rows[0]
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "Este horário não está disponível. Já existe um evento marcado para esse dia e horário."
      });
    }
    return next(error);
  }
});

routes.use((error, req, res, next) => {
  console.error("Reservation request failed:", error.message);
  return res.status(500).json({ message: "Não foi possível registrar a reserva." });
});

module.exports = routes;
