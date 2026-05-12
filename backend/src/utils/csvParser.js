import { HttpError } from "./httpError.js";

const SUPPORTED_DELIMITERS = [",", ";", "\t"];

function stripBom(value) {
  return value.replace(/^\uFEFF/, "");
}

function detectDelimiter(lines) {
  const sample = lines.slice(0, 5).join("\n");
  let bestDelimiter = ";";
  let bestScore = -1;

  for (const delimiter of SUPPORTED_DELIMITERS) {
    const score = sample
      .split("\n")
      .reduce((sum, line) => sum + (line.match(new RegExp(`\\${delimiter}`, "g"))?.length || 0), 0);

    if (score > bestScore) {
      bestScore = score;
      bestDelimiter = delimiter;
    }
  }

  return bestDelimiter;
}

function parseLine(line, delimiter) {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === "\"") {
      if (inQuotes && nextCharacter === "\"") {
        current += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === delimiter && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += character;
  }

  cells.push(current.trim());
  return cells.map((cell) => cell.replace(/^"(.*)"$/s, "$1").trim());
}

export function parseCsv(content) {
  if (!content || typeof content !== "string") {
    throw new HttpError(400, "Conteúdo CSV não informado.");
  }

  const normalized = stripBom(content).replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();

  if (!normalized) {
    throw new HttpError(400, "O arquivo CSV está vazio.");
  }

  const lines = normalized.split("\n").filter((line) => line.trim() !== "");
  const delimiter = detectDelimiter(lines);
  const headers = parseLine(lines[0], delimiter);

  if (headers.length < 2) {
    throw new HttpError(400, "Não foi possível identificar as colunas do CSV.");
  }

  const rows = lines.slice(1).map((line, index) => {
    const cells = parseLine(line, delimiter);
    const record = {};

    headers.forEach((header, headerIndex) => {
      record[header] = cells[headerIndex] ?? "";
    });

    return {
      index,
      raw: record
    };
  });

  return {
    delimiter,
    headers,
    rows
  };
}
