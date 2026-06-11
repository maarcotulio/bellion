import type { Encounter } from "@/lib/schemas/encounter";

type EncounterSaveQueueInput = {
  readonly save: (encounter: Encounter) => Promise<Encounter>;
  readonly onSaved: (encounter: Encounter) => void;
  readonly onError: (message: string | null) => void;
  readonly onSavingChange: (isSaving: boolean) => void;
};

export function createEncounterSaveQueue({
  save,
  onSaved,
  onError,
  onSavingChange,
}: EncounterSaveQueueInput) {
  let pendingEncounter: Encounter | null = null;
  let activeDrain: Promise<void> | null = null;

  async function drain() {
    onSavingChange(true);

    try {
      while (pendingEncounter) {
        const encounterToSave = pendingEncounter;
        pendingEncounter = null;

        try {
          const savedEncounter = await save(encounterToSave);

          if (!pendingEncounter) {
            onSaved(savedEncounter);
          }

          onError(null);
        } catch (error: unknown) {
          pendingEncounter = pendingEncounter ?? encounterToSave;
          onError(error instanceof Error ? error.message : "Encounter updated locally but could not be saved.");
          break;
        }
      }
    } finally {
      onSavingChange(false);
      activeDrain = null;
    }
  }

  return {
    enqueue(encounter: Encounter) {
      pendingEncounter = encounter;
      activeDrain = activeDrain ?? drain();

      return activeDrain;
    },
  };
}
