import AsyncStorage from "@react-native-async-storage/async-storage";
import evaluationContextService from "./evaluationContextService";
import type { EvaluationResultJson } from "../types/evaluationContext.type";

const LOCAL_EVALUATIONS_KEY = "localEvaluations";
const PENDING_ARCHIVE_KEY = "pendingArchivedEvaluations";
const DELETED_EVALUATIONS_KEY = "deletedEvaluationIds";
const MAX_LOCAL_EVALUATIONS = 18;
let localEvaluationsVersion = 0;
const localEvaluationListeners = new Set<() => void>();

export type LocalEvaluation = {
  evaluationContextId: string;
  profileId: string;
  productId: string;
  promptId?: string | null;
  resultJson: EvaluationResultJson;
  productName: string;
  profileName: string;
  imageUri?: string | null;
  createdAt: string;
};

const toTimestamp = (value: string): number => {
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const sortNewestFirst = (items: LocalEvaluation[]): LocalEvaluation[] => {
  return [...items].sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt));
};

const emitLocalEvaluationsChanged = () => {
  localEvaluationsVersion += 1;
  localEvaluationListeners.forEach((listener) => {
    listener();
  });
};

const dedupeById = (items: LocalEvaluation[]): LocalEvaluation[] => {
  const byId = new Map<string, LocalEvaluation>();

  for (const item of sortNewestFirst(items)) {
    if (!byId.has(item.evaluationContextId)) {
      byId.set(item.evaluationContextId, item);
    }
  }

  return Array.from(byId.values());
};

const parseStoredList = (raw: string | null): LocalEvaluation[] => {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item): item is LocalEvaluation => {
        if (!item || typeof item !== "object") {
          return false;
        }

        const candidate = item as Partial<LocalEvaluation>;
        return (
          typeof candidate.evaluationContextId === "string" &&
          typeof candidate.profileId === "string" &&
          typeof candidate.productId === "string" &&
          typeof candidate.productName === "string" &&
          typeof candidate.profileName === "string" &&
          typeof candidate.createdAt === "string" &&
          typeof candidate.resultJson === "object"
        );
      })
      .map((item) => ({
        ...item,
        imageUri: typeof item.imageUri === "string" ? item.imageUri : null,
        promptId: typeof item.promptId === "string" ? item.promptId : null,
      }));
  } catch {
    return [];
  }
};

const parseStoredStringArray = (raw: string | null): string[] => {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is string => typeof item === "string" && item.trim().length > 0,
    );
  } catch {
    return [];
  }
};

const getPendingArchive = async (): Promise<LocalEvaluation[]> => {
  const raw = await AsyncStorage.getItem(PENDING_ARCHIVE_KEY);
  return dedupeById(parseStoredList(raw));
};

const setPendingArchive = async (items: LocalEvaluation[]): Promise<void> => {
  await AsyncStorage.setItem(PENDING_ARCHIVE_KEY, JSON.stringify(dedupeById(items)));
};

const archiveToBackend = async (item: LocalEvaluation): Promise<void> => {
  await evaluationContextService.sendToServer({
    evaluationContextId: item.evaluationContextId,
    profileId: item.profileId,
    productId: item.productId,
    promptId: item.promptId ?? undefined,
    resultJson: item.resultJson,
  });
};

const flushPendingArchive = async (): Promise<void> => {
  const pending = await getPendingArchive();
  if (pending.length === 0) {
    return;
  }

  const failed: LocalEvaluation[] = [];

  for (const item of pending) {
    try {
      await archiveToBackend(item);
    } catch {
      failed.push(item);
    }
  }

  await setPendingArchive(failed);
};

export const getLocalEvaluations = async (): Promise<LocalEvaluation[]> => {
  const raw = await AsyncStorage.getItem(LOCAL_EVALUATIONS_KEY);
  return sortNewestFirst(dedupeById(parseStoredList(raw))).slice(0, MAX_LOCAL_EVALUATIONS);
};

export const getDeletedEvaluationIds = async (): Promise<string[]> => {
  const raw = await AsyncStorage.getItem(DELETED_EVALUATIONS_KEY);
  return Array.from(new Set(parseStoredStringArray(raw)));
};

const setDeletedEvaluationIds = async (ids: string[]): Promise<void> => {
  const normalized = Array.from(
    new Set(ids.filter((id) => typeof id === "string" && id.trim().length > 0)),
  );
  await AsyncStorage.setItem(DELETED_EVALUATIONS_KEY, JSON.stringify(normalized));
};

const addDeletedEvaluationId = async (evaluationContextId: string): Promise<void> => {
  const current = await getDeletedEvaluationIds();
  if (current.includes(evaluationContextId)) {
    return;
  }

  await setDeletedEvaluationIds([...current, evaluationContextId]);
};

const removeDeletedEvaluationId = async (evaluationContextId: string): Promise<void> => {
  const current = await getDeletedEvaluationIds();
  const next = current.filter((id) => id !== evaluationContextId);
  if (next.length === current.length) {
    return;
  }

  await setDeletedEvaluationIds(next);
};

export const subscribeLocalEvaluations = (listener: () => void): (() => void) => {
  localEvaluationListeners.add(listener);
  return () => {
    localEvaluationListeners.delete(listener);
  };
};

export const setLocalEvaluations = async (items: LocalEvaluation[]): Promise<void> => {
  const normalized = sortNewestFirst(dedupeById(items)).slice(0, MAX_LOCAL_EVALUATIONS);
  await AsyncStorage.setItem(LOCAL_EVALUATIONS_KEY, JSON.stringify(normalized));
  emitLocalEvaluationsChanged();
};

export const saveEvaluation = async (newEvaluation: LocalEvaluation): Promise<void> => {
  await removeDeletedEvaluationId(newEvaluation.evaluationContextId);
  await flushPendingArchive();

  const current = await getLocalEvaluations();
  const withoutDuplicate = current.filter(
    (item) => item.evaluationContextId !== newEvaluation.evaluationContextId,
  );

  if (withoutDuplicate.length < MAX_LOCAL_EVALUATIONS) {
    await setLocalEvaluations([newEvaluation, ...withoutDuplicate]);
    return;
  }

  const oldest = [...withoutDuplicate].sort(
    (a, b) => toTimestamp(a.createdAt) - toTimestamp(b.createdAt),
  )[0];

  const remaining = withoutDuplicate.filter(
    (item) => item.evaluationContextId !== oldest.evaluationContextId,
  );

  try {
    await archiveToBackend(oldest);
  } catch {
    const pending = await getPendingArchive();
    await setPendingArchive([...pending, oldest]);
  }

  await setLocalEvaluations([newEvaluation, ...remaining]);
};

export const removeLocalEvaluationById = async (evaluationContextId: string): Promise<void> => {
  const [currentLocal, currentPending] = await Promise.all([
    getLocalEvaluations(),
    getPendingArchive(),
  ]);

  const nextLocal = currentLocal.filter(
    (item) => item.evaluationContextId !== evaluationContextId,
  );
  const nextPending = currentPending.filter(
    (item) => item.evaluationContextId !== evaluationContextId,
  );

  await Promise.all([
    setLocalEvaluations(nextLocal),
    setPendingArchive(nextPending),
    addDeletedEvaluationId(evaluationContextId),
  ]);
};
