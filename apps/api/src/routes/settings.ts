import type { FastifyInstance } from 'fastify';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to store settings JSON
const SETTINGS_PATH = join(__dirname, '../../data/settings.json');

interface Settings {
  sillyTavern?: {
    enabled: boolean;
    baseUrl: string;
    importEndpoint: string;
    sessionCookie: string;
  };
}

function loadSettings(): Settings {
  if (!existsSync(SETTINGS_PATH)) {
    return {};
  }
  try {
    const data = readFileSync(SETTINGS_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

function saveSettings(settings: Settings) {
  const dir = dirname(SETTINGS_PATH);
  if (!existsSync(dir)) {
    const { mkdirSync } = require('fs');
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf-8');
}

export async function settingsRoutes(fastify: FastifyInstance) {
  // Get all settings
  fastify.get('/settings', async () => {
    const settings = loadSettings();
    return { settings };
  });

  // Update SillyTavern settings
  fastify.patch<{
    Body: {
      sillyTavern?: {
        enabled: boolean;
        baseUrl: string;
        importEndpoint: string;
        sessionCookie: string;
      };
    };
  }>('/settings/sillytavern', async (request) => {
    const settings = loadSettings();

    if (request.body.sillyTavern) {
      settings.sillyTavern = request.body.sillyTavern;
      saveSettings(settings);
    }

    return { success: true, settings: settings.sillyTavern };
  });

  // Get SillyTavern settings specifically
  fastify.get('/settings/sillytavern', async () => {
    const settings = loadSettings();
    return { settings: settings.sillyTavern || { enabled: false, baseUrl: '', importEndpoint: '/api/characters/import', sessionCookie: '' } };
  });
}
