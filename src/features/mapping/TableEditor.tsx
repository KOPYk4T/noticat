import { useState, useRef } from "react";
import { Button } from "../../components/Button";
import {
  Plus,
  Trash2,
  GripVertical,
  Filter,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { FileStructure } from "../../shared/types/fileMapping";

interface TableEditorProps {
  structure: FileStructure;
  onConfirm: (structure: FileStructure) => void;
  onCancel: () => void;
}

// Componente para columnas arrastrables
const SortableHeader = ({
  id,
  header,
  index,
  onRemove,
  onEdit,
}: {
  id: string;
  header: string;
  index: number;
  onRemove: () => void;
  onEdit: (value: string) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <th
      ref={setNodeRef}
      style={style}
      className="px-3 py-3 text-left text-neutral-700 font-medium border-r border-neutral-200 last:border-r-0 min-w-[180px] bg-neutral-50 hover:bg-neutral-100 transition-colors relative group"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-neutral-400 hover:text-neutral-600 flex-shrink-0"
            title="Arrastrar para reordenar"
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={header}
            onChange={(e) => onEdit(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none focus:ring-2 focus:ring-neutral-400 focus:bg-white px-2 py-1.5 rounded font-medium text-sm min-w-0"
            placeholder={`Columna ${index + 1}`}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <button
          onClick={onRemove}
          className="p-1.5 hover:bg-neutral-200 rounded text-neutral-400 hover:text-red-600 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
          title="Eliminar columna"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </th>
  );
};

// Componente para filas arrastrables
const SortableRow = ({
  id,
  row,
  rowIndex,
  selectedRow,
  onSelect,
  onCellChange,
  onRemove,
}: {
  id: string;
  row: (string | number)[];
  rowIndex: number;
  selectedRow: number | null;
  onSelect: () => void;
  onCellChange: (colIndex: number, value: string) => void;
  onRemove: () => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const isEmpty = row.every((cell) => String(cell).trim().length === 0);
  const isSelected = selectedRow === rowIndex;

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-neutral-100 hover:bg-neutral-50 transition-colors group ${
        isSelected ? "bg-neutral-100" : ""
      } ${isEmpty ? "opacity-40" : ""}`}
    >
      <td className="px-2 py-2 border-r border-neutral-100 w-12 bg-neutral-50/50">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-neutral-400 hover:text-neutral-600 p-0.5"
            title="Arrastrar para reordenar"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRemove}
            className="p-0.5 hover:bg-neutral-200 rounded text-neutral-400 hover:text-red-600 transition-colors"
            title="Eliminar fila"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
        <div className="text-xs text-neutral-400 font-mono pt-1">
          {rowIndex + 1}
        </div>
      </td>
      {row.map((cell, colIndex) => (
        <td
          key={colIndex}
          className="px-3 py-2 text-neutral-700 border-r border-neutral-100 last:border-r-0"
          onClick={onSelect}
        >
          <input
            type="text"
            value={String(cell)}
            onChange={(e) => onCellChange(colIndex, e.target.value)}
            className="w-full bg-transparent border-none outline-none focus:ring-2 focus:ring-neutral-400 focus:bg-white px-2 py-1.5 rounded text-sm font-light"
            onClick={(e) => e.stopPropagation()}
            onFocus={(e) => e.target.select()}
          />
        </td>
      ))}
    </tr>
  );
};

export const TableEditor = ({
  structure,
  onConfirm,
  onCancel,
}: TableEditorProps) => {
  const [editedHeaders, setEditedHeaders] = useState<string[]>(
    structure.headers
  );
  const [editedRows, setEditedRows] = useState<(string | number)[][]>(
    structure.rows
  );
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Requiere mover 8px antes de activar drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddColumn = () => {
    const newHeader = `Columna ${editedHeaders.length + 1}`;
    setEditedHeaders([...editedHeaders, newHeader]);
    setEditedRows(editedRows.map((row) => [...row, ""]));
  };

  const handleRemoveColumn = (index: number) => {
    if (editedHeaders.length <= 1) return;

    setEditedHeaders(editedHeaders.filter((_, i) => i !== index));
    setEditedRows(editedRows.map((row) => row.filter((_, i) => i !== index)));
  };

  const handleHeaderChange = (index: number, value: string) => {
    const newHeaders = [...editedHeaders];
    newHeaders[index] = value;
    setEditedHeaders(newHeaders);
  };

  const handleCellChange = (
    rowIndex: number,
    colIndex: number,
    value: string
  ) => {
    const newRows = [...editedRows];
    newRows[rowIndex][colIndex] = value;
    setEditedRows(newRows);
  };

  const handleRemoveRow = (index: number) => {
    setEditedRows(editedRows.filter((_, i) => i !== index));
    if (selectedRow === index) {
      setSelectedRow(null);
    } else if (selectedRow !== null && selectedRow > index) {
      setSelectedRow(selectedRow - 1);
    }
  };

  const handleRemoveEmptyRows = () => {
    const filtered = editedRows.filter((row) =>
      row.some((cell) => String(cell).trim().length > 0)
    );
    setEditedRows(filtered);
    if (selectedRow !== null && selectedRow >= filtered.length) {
      setSelectedRow(null);
    }
  };

  const handleRemoveEmptyColumns = () => {
    // Encontrar columnas vacías
    const emptyColumns: number[] = [];
    for (let colIndex = 0; colIndex < editedHeaders.length; colIndex++) {
      const hasData = editedRows.some((row) => {
        const cell = row[colIndex];
        return cell !== undefined && String(cell).trim().length > 0;
      });
      if (
        !hasData &&
        (!editedHeaders[colIndex] ||
          editedHeaders[colIndex].trim().length === 0)
      ) {
        emptyColumns.push(colIndex);
      }
    }

    // Eliminar columnas vacías (en orden inverso para mantener índices)
    if (emptyColumns.length > 0) {
      const newHeaders = editedHeaders.filter(
        (_, i) => !emptyColumns.includes(i)
      );
      const newRows = editedRows.map((row) =>
        row.filter((_, i) => !emptyColumns.includes(i))
      );
      setEditedHeaders(newHeaders);
      setEditedRows(newRows);
    }
  };

  const handleColumnDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = editedHeaders.findIndex(
        (_, i) => `header-${i}` === active.id
      );
      const newIndex = editedHeaders.findIndex(
        (_, i) => `header-${i}` === over.id
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        setEditedHeaders(arrayMove(editedHeaders, oldIndex, newIndex));
        setEditedRows(
          editedRows.map((row) => arrayMove(row, oldIndex, newIndex))
        );
      }
    }
  };

  const handleRowDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = editedRows.findIndex((_, i) => `row-${i}` === active.id);
      const newIndex = editedRows.findIndex((_, i) => `row-${i}` === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newRows = arrayMove(editedRows, oldIndex, newIndex);
        setEditedRows(newRows);

        // Actualizar índice seleccionado
        if (selectedRow === oldIndex) {
          setSelectedRow(newIndex);
        } else if (selectedRow === newIndex) {
          setSelectedRow(oldIndex);
        }
      }
    }
  };

  const handleConfirm = () => {
    onConfirm({
      headers: editedHeaders,
      rows: editedRows,
      detectedDelimiter: structure.detectedDelimiter,
    });
  };

  const emptyRowsCount = editedRows.filter((row) =>
    row.every((cell) => String(cell).trim().length === 0)
  ).length;

  const emptyColumnsCount = editedHeaders.filter((header, index) => {
    const hasData = editedRows.some((row) => {
      const cell = row[index];
      return cell !== undefined && String(cell).trim().length > 0;
    });
    return !hasData && (!header || header.trim().length === 0);
  }).length;

  return (
    <div className="min-h-screen bg-neutral-50 p-6 font-sans">
      <div className="max-w-[95vw] mx-auto space-y-6">
        {/* Header con progreso visual */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-neutral-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-light tracking-tight text-neutral-900">
                    Editor de Tabla
                  </h1>
                  <p className="text-neutral-500 font-light text-sm mt-0.5">
                    Ajusta y organiza los datos detectados del archivo
                  </p>
                </div>
              </div>

              {/* Barra de progreso visual */}
              <div className="mt-4 flex items-center gap-2 text-xs text-neutral-500">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-neutral-900"></div>
                  <span className="font-medium text-neutral-900">
                    Paso 1: Editar tabla
                  </span>
                </div>
                <ArrowRight className="w-3 h-3" />
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-neutral-300"></div>
                  <span>Paso 2: Mapear columnas</span>
                </div>
                <ArrowRight className="w-3 h-3" />
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-neutral-300"></div>
                  <span>Paso 3: Categorizar</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={onCancel}>
                Cancelar
              </Button>
              <Button
                onClick={handleConfirm}
                className="flex items-center gap-2"
              >
                <span>Continuar</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Toolbar mejorado */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAddColumn}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Agregar Columna
              </Button>

              {emptyRowsCount > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleRemoveEmptyRows}
                  className="flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Eliminar {emptyRowsCount} Fila{emptyRowsCount > 1 ? "s" : ""}{" "}
                  Vacía{emptyRowsCount > 1 ? "s" : ""}
                </Button>
              )}

              {emptyColumnsCount > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleRemoveEmptyColumns}
                  className="flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Eliminar {emptyColumnsCount} Columna
                  {emptyColumnsCount > 1 ? "s" : ""} Vacía
                  {emptyColumnsCount > 1 ? "s" : ""}
                </Button>
              )}

              <button
                onClick={() => setShowHelp(!showHelp)}
                className="px-3 py-1.5 text-sm font-light text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors flex items-center gap-2"
              >
                <HelpCircle className="w-4 h-4" />
                Ayuda
              </button>
            </div>

            <div className="flex items-center gap-4 text-sm text-neutral-600">
              <div className="flex items-center gap-2">
                <span className="font-medium">{editedRows.length}</span>
                <span className="text-neutral-500">filas</span>
              </div>
              <div className="w-px h-4 bg-neutral-300"></div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{editedHeaders.length}</span>
                <span className="text-neutral-500">columnas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Panel de ayuda colapsable */}
        {showHelp && (
          <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5 animate-[fadeIn_0.3s_ease-out]">
            <div className="flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-3">
                <h3 className="font-medium text-neutral-900 text-sm">
                  Cómo usar el editor
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-neutral-700">
                  <div className="flex items-start gap-2">
                    <GripVertical className="w-4 h-4 mt-0.5 flex-shrink-0 text-neutral-400" />
                    <span>
                      <strong>Arrastra</strong> el ícono para reorganizar
                      columnas o filas
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 mt-0.5 flex-shrink-0 text-neutral-400">
                      ✎
                    </span>
                    <span>
                      <strong>Edita</strong> cualquier celda haciendo clic y
                      escribiendo
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Trash2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-neutral-400" />
                    <span>
                      <strong>Elimina</strong> filas o columnas con el ícono de
                      basura
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Filter className="w-4 h-4 mt-0.5 flex-shrink-0 text-neutral-400" />
                    <span>
                      <strong>Limpia</strong> espacios vacíos automáticamente
                      con los botones
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Table mejorada estilo Excel */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
          <div
            ref={tableContainerRef}
            className="overflow-auto max-h-[calc(100vh-400px)]"
            style={{ scrollbarWidth: "thin" }}
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(event) => {
                if (event.active.id.toString().startsWith("header-")) {
                  handleColumnDragEnd(event);
                } else if (event.active.id.toString().startsWith("row-")) {
                  handleRowDragEnd(event);
                }
              }}
            >
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0 bg-neutral-50 border-b-2 border-neutral-300 z-20 shadow-sm">
                  <tr>
                    <th className="px-2 py-3 w-12 border-r border-neutral-200 bg-neutral-50 sticky left-0 z-30"></th>
                    <SortableContext
                      items={editedHeaders.map((_, i) => `header-${i}`)}
                      strategy={horizontalListSortingStrategy}
                    >
                      {editedHeaders.map((header, colIndex) => (
                        <SortableHeader
                          key={colIndex}
                          id={`header-${colIndex}`}
                          header={header}
                          index={colIndex}
                          onRemove={() => handleRemoveColumn(colIndex)}
                          onEdit={(value) =>
                            handleHeaderChange(colIndex, value)
                          }
                        />
                      ))}
                    </SortableContext>
                  </tr>
                </thead>
                <tbody>
                  <SortableContext
                    items={editedRows.slice(0, 500).map((_, i) => `row-${i}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    {editedRows.slice(0, 500).map((row, rowIndex) => (
                      <SortableRow
                        key={rowIndex}
                        id={`row-${rowIndex}`}
                        row={row}
                        rowIndex={rowIndex}
                        selectedRow={selectedRow}
                        onSelect={() =>
                          setSelectedRow(
                            rowIndex === selectedRow ? null : rowIndex
                          )
                        }
                        onCellChange={(colIndex, value) =>
                          handleCellChange(rowIndex, colIndex, value)
                        }
                        onRemove={() => handleRemoveRow(rowIndex)}
                      />
                    ))}
                  </SortableContext>
                  {editedRows.length > 500 && (
                    <tr>
                      <td
                        colSpan={editedHeaders.length + 1}
                        className="px-4 py-4 text-center text-neutral-400 text-sm font-light bg-neutral-50"
                      >
                        ... y {editedRows.length - 500} filas más
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </DndContext>
          </div>
        </div>

        {/* Footer con acciones */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-4 flex items-center justify-between">
          <div className="text-sm text-neutral-500 font-light">
            Presiona{" "}
            <kbd className="px-2 py-1 bg-neutral-100 rounded text-xs font-mono">
              Tab
            </kbd>{" "}
            para navegar entre celdas
          </div>
          <Button onClick={handleConfirm} className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Continuar con el Mapeo
          </Button>
        </div>
      </div>
    </div>
  );
};
