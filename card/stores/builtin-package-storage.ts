import type { ImportData } from '../card-types';
import Dexie, { Table } from 'dexie';
import { BUILTIN_BATCH_ID, STORAGE_KEYS } from './store-types';
import { BUILTIN_PACKAGE_UPDATE_SIGNAL_KEY } from '@/lib/builtin-package-refresh';
import { sanitizeImportData } from '@/card/package-sanitizer';

export const BUILTIN_PACKAGE_OVERRIDE_KEY = 'daggerheart_builtin_package_override';
const BUILTIN_PACKAGE_RECORD_KEY = 'builtin-package-override';
const LEGACY_BUILTIN_BATCH_STORAGE_KEY = `${STORAGE_KEYS.BATCH_PREFIX}${BUILTIN_BATCH_ID}`;
const BUILTIN_PACKAGE_DB_NAME = 'DaggerHeartBuiltinPackageDB';

interface BuiltinPackageRecord {
  key: string;
  data: string;
  updatedAt: number;
}

class BuiltinPackageOverrideDB extends Dexie {
  packages!: Table<BuiltinPackageRecord, string>;

  constructor() {
    super(BUILTIN_PACKAGE_DB_NAME);
    this.version(1).stores({
      packages: 'key, updatedAt'
    });
  }
}

let builtinPackageDb: BuiltinPackageOverrideDB | null = null;

function cloneImportData<T extends ImportData>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

function parseImportData(serializedData: string): ImportData {
  return sanitizeImportData(JSON.parse(serializedData) as ImportData);
}

function createStorageError(
  action: '读取' | '保存',
  primaryError: unknown,
  fallbackError?: unknown
): Error {
  const messages = [primaryError, fallbackError]
    .filter(Boolean)
    .map(error => (error instanceof Error ? error.message : String(error)))
    .filter(Boolean);

  const normalizedMessage = messages.join('；');
  const storageFull =
    normalizedMessage.includes('QuotaExceededError') ||
    normalizedMessage.includes('quota') ||
    normalizedMessage.includes('exceeded the quota');
  const storageBlocked =
    normalizedMessage.includes('SecurityError') ||
    normalizedMessage.includes('access is denied');

  if (storageFull) {
    return new Error(`核心包${action}失败：浏览器存储空间不足，请清理站点数据后重试`);
  }

  if (storageBlocked) {
    return new Error(`核心包${action}失败：浏览器阻止了本地存储访问`);
  }

  return new Error(`核心包${action}失败：${normalizedMessage || '本地存储不可用'}`);
}

function removeLegacyBuiltinBatchStorage(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(LEGACY_BUILTIN_BATCH_STORAGE_KEY);
  } catch (error) {
    console.warn('[BuiltinPackageStorage] Failed to clean legacy builtin batch storage:', error);
  }
}

function emitBuiltinPackageUpdatedSignal(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(BUILTIN_PACKAGE_UPDATE_SIGNAL_KEY, Date.now().toString());
  } catch (error) {
    console.warn('[BuiltinPackageStorage] Failed to emit builtin package update signal:', error);
  }
}

function isIndexedDbAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return 'indexedDB' in window && window.indexedDB !== null;
  } catch {
    return false;
  }
}

function getBuiltinPackageDb(): BuiltinPackageOverrideDB | null {
  if (!isIndexedDbAvailable()) {
    return null;
  }

  if (!builtinPackageDb) {
    builtinPackageDb = new BuiltinPackageOverrideDB();
  }

  return builtinPackageDb;
}

export function sanitizeBuiltinPackageData(data: ImportData): ImportData {
  return sanitizeImportData(data);
}

async function loadBuiltinPackageOverrideFromIndexedDb(): Promise<ImportData | null> {
  const builtinDb = getBuiltinPackageDb();
  if (!builtinDb) {
    return null;
  }

  try {
    const record = await builtinDb.packages.get(BUILTIN_PACKAGE_RECORD_KEY);
    if (!record?.data) {
      return null;
    }

    try {
      return parseImportData(record.data);
    } catch (error) {
      console.error('[BuiltinPackageStorage] Failed to parse IndexedDB builtin package override:', error);
      await builtinDb.packages.delete(BUILTIN_PACKAGE_RECORD_KEY);
      return null;
    }
  } catch (error) {
    console.error('[BuiltinPackageStorage] Failed to read IndexedDB builtin package override:', error);
    return null;
  }
}

function loadBuiltinPackageOverrideFromLocalStorage(): ImportData | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = localStorage.getItem(BUILTIN_PACKAGE_OVERRIDE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return parseImportData(raw);
  } catch (error) {
    console.error('[BuiltinPackageStorage] Failed to parse localStorage builtin package override:', error);
    localStorage.removeItem(BUILTIN_PACKAGE_OVERRIDE_KEY);
    return null;
  }
}

async function migrateLocalStorageOverride(override: ImportData): Promise<void> {
  const builtinDb = getBuiltinPackageDb();
  if (!builtinDb) {
    return;
  }

  try {
    await builtinDb.packages.put({
      key: BUILTIN_PACKAGE_RECORD_KEY,
      data: JSON.stringify(sanitizeBuiltinPackageData(override)),
      updatedAt: Date.now()
    });
    localStorage.removeItem(BUILTIN_PACKAGE_OVERRIDE_KEY);
  } catch (error) {
    console.warn('[BuiltinPackageStorage] Failed to migrate builtin package override to IndexedDB:', error);
  }
}

export async function loadBuiltinPackageOverride(): Promise<ImportData | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  removeLegacyBuiltinBatchStorage();

  const indexedDbOverride = await loadBuiltinPackageOverrideFromIndexedDb();
  if (indexedDbOverride) {
    return indexedDbOverride;
  }

  const localStorageOverride = loadBuiltinPackageOverrideFromLocalStorage();
  if (localStorageOverride) {
    await migrateLocalStorageOverride(localStorageOverride);
  }

  return localStorageOverride;
}

export async function saveBuiltinPackageOverride(data: ImportData): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  removeLegacyBuiltinBatchStorage();

  const serializedData = JSON.stringify(sanitizeBuiltinPackageData(data));
  let indexedDbError: unknown = null;
  const builtinDb = getBuiltinPackageDb();

  if (builtinDb) {
    try {
      await builtinDb.packages.put({
        key: BUILTIN_PACKAGE_RECORD_KEY,
        data: serializedData,
        updatedAt: Date.now()
      });
      try {
        localStorage.removeItem(BUILTIN_PACKAGE_OVERRIDE_KEY);
      } catch (cleanupError) {
        console.warn('[BuiltinPackageStorage] Failed to clean legacy localStorage override:', cleanupError);
      }
      emitBuiltinPackageUpdatedSignal();
      return;
    } catch (error) {
      indexedDbError = error;
      console.error('[BuiltinPackageStorage] Failed to save builtin package override to IndexedDB:', error);
    }
  }

  try {
    localStorage.setItem(BUILTIN_PACKAGE_OVERRIDE_KEY, serializedData);
    emitBuiltinPackageUpdatedSignal();
  } catch (localStorageError) {
    throw createStorageError('保存', indexedDbError ?? localStorageError, indexedDbError ? localStorageError : undefined);
  }
}

export async function loadBuiltinPackageSource(): Promise<{
  data: ImportData;
  source: 'override' | 'default';
}> {
  const override = await loadBuiltinPackageOverride();
  if (override) {
    return {
      data: override,
      source: 'override'
    };
  }

  const builtinCardPackJson = await import('../../data/cards/builtin-base.json');
  return {
    data: sanitizeImportData(cloneImportData(builtinCardPackJson.default as ImportData)),
    source: 'default'
  };
}
