import React, { useState, useEffect } from 'react';
import { Button, Select, Card, ConfirmModal, useToast } from '../components/ui';
import { schedulerService, GenerateResult, SessionRow } from '../api/scheduler.service';
import { academicService, Block } from '../api/academic.service';

const DAY_NAMES = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

export const SchedulerPage: React.FC = () => {
  const { addToast } = useToast();

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState('');
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [view, setView] = useState<'section' | 'teacher'>('section');

  const [clearTarget, setClearTarget] = useState<string | null>(null);

  useEffect(() => {
    academicService.listBlocks().then(setBlocks);
  }, []);

  const loadResult = async (blockId: string) => {
    if (!blockId) return;
    try {
      const s = await schedulerService.getResult(blockId);
      setSessions(s);
    } catch {
      setSessions([]);
    }
  };

  const handleGenerate = async () => {
    if (!selectedBlockId) {
      addToast('error', 'Selecciona un bloque');
      return;
    }
    setIsGenerating(true);
    setResult(null);
    try {
      const r = await schedulerService.generate(selectedBlockId);
      setResult(r);
      await loadResult(selectedBlockId);
      if (r.unresolved.length === 0) {
        addToast('success', `✅ Horario generado: ${r.totalSessions} sesiones en ${r.resolved} secciones`);
      } else {
        addToast('error', `⚠️ ${r.unresolved.length} secciones no pudieron resolverse`);
      }
    } catch (err: any) {
      addToast('error', err.response?.data?.message || 'Error al generar');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClear = async () => {
    if (!clearTarget) return;
    try {
      await schedulerService.clear(clearTarget);
      addToast('success', 'Horario limpiado');
      setClearTarget(null);
      if (selectedBlockId === clearTarget) {
        setSessions([]);
        setResult(null);
      }
    } catch (err: any) {
      addToast('error', err.response?.data?.message || 'Error');
    }
  };

  // ===== Vista por SECCIÓN =====
  const renderBySection = () => {
    const bySection = new Map<string, SessionRow[]>();
    for (const s of sessions) {
      const key = s.section.id;
      if (!bySection.has(key)) bySection.set(key, []);
      bySection.get(key)!.push(s);
    }

    return (
      <div className="space-y-4">
        {Array.from(bySection.entries()).map(([secId, secs]) => {
          const section = secs[0].section;
          // Construir matriz 5 días × 2 slots
          const grid: (SessionRow | null)[][] = Array.from({ length: 5 }, () => [null, null]);
          for (const s of secs) {
            grid[s.dayOfWeek - 1][s.slot - 1] = s;
          }

          return (
            <Card key={secId}>
              <h3 className="font-semibold mb-2">
                🚪 {section.name} · {section.classroom.sede.name} · {section.turno.name}
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border px-2 py-1 w-16">Slot</th>
                      {[1, 2, 3, 4, 5].map((d) => (
                        <th key={d} className="border px-2 py-1">{DAY_NAMES[d]}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2].map((slot) => (
                      <tr key={slot}>
                        <td className="border px-2 py-1 text-center font-medium">Slot {slot}</td>
                        {[1, 2, 3, 4, 5].map((d) => {
                          const s = grid[d - 1][slot - 1];
                          return (
                            <td key={d} className={`border px-2 py-2 align-top ${s ? 'bg-blue-50' : 'bg-gray-50'}`}>
                              {s ? (
                                <div>
                                  <p className="font-semibold text-blue-900">{s.course.name}</p>
                                  <p className="text-xs text-gray-600">
                                    {s.teacher.lastName}, {s.teacher.firstName}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-gray-400 text-xs">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          );
        })}
        {bySection.size === 0 && (
          <p className="text-gray-500 text-sm">Aún no se ha generado el horario para este bloque.</p>
        )}
      </div>
    );
  };

  // ===== Vista por DOCENTE =====
  const renderByTeacher = () => {
    const byTeacher = new Map<string, SessionRow[]>();
    for (const s of sessions) {
      if (!byTeacher.has(s.teacher.id)) byTeacher.set(s.teacher.id, []);
      byTeacher.get(s.teacher.id)!.push(s);
    }

    return (
      <div className="space-y-4">
        {Array.from(byTeacher.entries()).map(([tId, secs]) => {
          const teacher = secs[0].teacher;
          const grid: (SessionRow | null)[][] = Array.from({ length: 5 }, () => [null, null]);
          for (const s of secs) {
            grid[s.dayOfWeek - 1][s.slot - 1] = s;
          }

          return (
            <Card key={tId}>
              <h3 className="font-semibold mb-2">
                👨‍🏫 {teacher.lastName}, {teacher.firstName}{' '}
                <span className="text-xs text-gray-500">(DNI: {teacher.dni})</span>
                <span className="ml-2 text-sm text-blue-600">
                  · {secs.length} sesiones/semana
                </span>
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border px-2 py-1 w-16">Slot</th>
                      {[1, 2, 3, 4, 5].map((d) => (
                        <th key={d} className="border px-2 py-1">{DAY_NAMES[d]}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2].map((slot) => (
                      <tr key={slot}>
                        <td className="border px-2 py-1 text-center font-medium">Slot {slot}</td>
                        {[1, 2, 3, 4, 5].map((d) => {
                          const s = grid[d - 1][slot - 1];
                          return (
                            <td key={d} className={`border px-2 py-2 align-top ${s ? 'bg-green-50' : 'bg-gray-50'}`}>
                              {s ? (
                                <div>
                                  <p className="font-semibold text-green-900">{s.course.name}</p>
                                  <p className="text-xs text-gray-600">
                                    {s.section.name} · {s.section.classroom.sede.name}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-gray-400 text-xs">libre</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          );
        })}
        {byTeacher.size === 0 && (
          <p className="text-gray-500 text-sm">Aún no se ha generado el horario para este bloque.</p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">🧠 Generador de Horarios</h1>

      <Card>
        <div className="flex flex-wrap gap-3 items-end">
          <Select
            label="Bloque"
            value={selectedBlockId}
            onChange={(e) => {
              setSelectedBlockId(e.target.value);
              setResult(null);
              setSessions([]);
            }}
            options={[
              { value: '', label: 'Selecciona bloque...' },
              ...blocks.map((b) => ({
                value: b.id,
                label: `${b.period?.name || ''} · ${b.name} (S${b.startWeek}-S${b.endWeek})`,
              })),
            ]}
          />
          <Button onClick={handleGenerate} isLoading={isGenerating} disabled={!selectedBlockId}>
            🧠 Generar horario
          </Button>
          {selectedBlockId && (
            <Button variant="danger" onClick={() => setClearTarget(selectedBlockId)}>
              🗑️ Limpiar
            </Button>
          )}
          {sessions.length > 0 && (
            <Button
              variant="success"
              onClick={async () => {
                try {
                  await schedulerService.exportExcel(selectedBlockId);
                  addToast('success', '📥 Excel descargado');
                } catch (err: any) {
                  addToast('error', err.response?.data?.message || 'Error al exportar');
                }
              }}
            >
              📥 Exportar Excel
            </Button>
          )}
        </div>
      </Card>

      {result && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="text-center">
            <p className="text-2xl font-bold text-gray-800">{result.totalSections}</p>
            <p className="text-xs text-gray-500">Secciones</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-bold text-green-600">{result.resolved}</p>
            <p className="text-xs text-gray-500">Resueltas</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-bold text-red-600">{result.unresolved.length}</p>
            <p className="text-xs text-gray-500">Sin resolver</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-bold text-blue-600">{result.totalSessions}</p>
            <p className="text-xs text-gray-500">Sesiones totales</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-bold text-purple-600">{result.teachersUsed.length}</p>
            <p className="text-xs text-gray-500">Docentes usados</p>
          </Card>
        </div>
      )}

      {result && result.unresolved.length > 0 && (
        <Card>
          <h3 className="font-semibold text-red-700 mb-2">⚠️ Secciones sin resolver</h3>
          <ul className="space-y-1">
            {result.unresolved.map((u) => (
              <li key={u.sectionId} className="text-sm bg-red-50 border border-red-200 rounded px-3 py-2">
                <strong>{u.sectionName}</strong>: {u.reason}
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-500 mt-2">
            Sugerencia: verifica que haya suficientes docentes para cada curso y que sus disponibilidades no sean muy restrictivas.
          </p>
        </Card>
      )}

      {sessions.length > 0 && (
        <>
          <div className="flex gap-2 border-b">
            <button
              onClick={() => setView('section')}
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                view === 'section' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'
              }`}
            >
              🚪 Vista por sección
            </button>
            <button
              onClick={() => setView('teacher')}
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                view === 'teacher' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500'
              }`}
            >
              👨‍🏫 Vista por docente
            </button>
          </div>

          {view === 'section' ? renderBySection() : renderByTeacher()}
        </>
      )}

      <ConfirmModal
        isOpen={!!clearTarget}
        onClose={() => setClearTarget(null)}
        onConfirm={handleClear}
        title="Limpiar horario"
        message="Se eliminarán todas las sesiones generadas para este bloque. ¿Continuar?"
      />
    </div>
  );
};