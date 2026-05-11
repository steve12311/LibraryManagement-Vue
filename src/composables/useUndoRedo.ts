import { ref } from "vue";

export interface UndoEntryMove {
  type: "move" | "rotate";
  shelfId: number;
  prevX: number;
  prevY: number;
  prevAngle: number;
  nextX: number;
  nextY: number;
  nextAngle: number;
}

export interface UndoEntryCreate {
  type: "create";
  shelfId: number;
}

export interface UndoEntryDelete {
  type: "delete";
  shelfId: number;
  shelfData: {
    floorId: number;
    shelfNo: string;
    name?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    angle: number;
    capacity: number;
    status: number;
    remark?: string;
  };
}

export interface UndoEntryBatch {
  type: "batch-move";
  shelves: { shelfId: number; x: number; y: number }[];
}

export type UndoEntry = UndoEntryMove | UndoEntryCreate | UndoEntryDelete | UndoEntryBatch;

const MAX_STACK = 20;

export function useUndoRedo() {
  const undoStack = ref<UndoEntry[]>([]);
  const redoStack = ref<UndoEntry[]>([]);

  function push(entry: UndoEntry) {
    undoStack.value.push(entry);
    if (undoStack.value.length > MAX_STACK) {
      undoStack.value.shift();
    }
    redoStack.value = [];
  }

  function undo(): UndoEntry | undefined {
    const entry = undoStack.value.pop();
    if (entry) {
      redoStack.value.push(entry);
    }
    return entry;
  }

  function redo(): UndoEntry | undefined {
    const entry = redoStack.value.pop();
    if (entry) {
      undoStack.value.push(entry);
    }
    return entry;
  }

  function clear() {
    undoStack.value = [];
    redoStack.value = [];
  }

  return { undoStack, redoStack, push, undo, redo, clear };
}
