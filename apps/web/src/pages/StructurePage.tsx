import React, { useState, useEffect } from 'react';
import { Button, Input, Card, Modal, ConfirmModal, Checkbox, useToast } from '../components/ui';
import { structureService, Sede, Turno } from '../api/structure.service';

type Tab = 'sedes' | 'turnos' | 'salones';

export const StructurePage: React.FC = () => {
  const { addToast } = useToast();

  const [tab, setTab] = useState<Tab>('sedes');
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [turnos, setTurnos] = useState<Turno[]>([]);

  // Modals
  const [showSede, setShowSede] = useState(false);
  const [sedeName, setSedeName] = useState('');

  const [showTurno, setShowTurno] = useState(false);
  const [turnoData, setTurnoData] = useState({
    name: '', slot1Start: '08:00', slot1End: '11:00', slot2Start: '11:00', slot2End: '14:00',
  });

  const [showClassroom, setShowClassroom] = useState(false);
  const [classroomData, setClassroomData] = useState({ name: '', sedeId: '', turnoIds: [] as string[] });

  const [deleteTarget, setDeleteTarget] = useState<{ type: Tab; id: string; name: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const load = async () => {
    try {
      const [s, t] = await Promise.all([structureService.listSedes(), structureService.listTurnos()]);
      setSedes(s);
      setTurnos(t);
    } catch {
      addToast('error', 'Error al cargar datos');
    }
  };

  useEffect(() => { load(); }, []);

  const saveSede = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await structureService.createSede(sedeName);
      addToast('success', 'Sede creada');
      setShowSede(false);
      setSedeName('');
      load();
    } catch (err: any) {
      addToast('error', err.response?.data?.message || 'Error');
    } finally { setIsSaving(false); }
  };

  const saveTurno = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await structureService.createTurno(turnoData);
      addToast('success', 'Turno creado');
      setShowTurno(false);
      setTurnoData({ name: '', slot1Start: '08:00', slot1End: '11:00', slot2Start: '11:00', slot2End: '14:00' });
      load();
    } catch (err: any) {
      addToast('error', err.response?.data?.message || 'Error');
    } finally { setIsSaving(false); }
  };

  const saveClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await structureService.createClassroom(classroomData.name, classroomData.sedeId, classroomData.turnoIds);
      addToast('success', 'Salón y secciones creadas');
      setShowClassroom(false);
      setClassroomData({ name: '', sedeId: '', turnoIds: [] });
      load();
    } catch (err: any) {
      addToast('error', err.response?.data?.message || 'Error');
    } finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsSaving(true);
    try {
      if (deleteTarget.type === 'sedes') await structureService.deleteSede(deleteTarget.id);
      else if (deleteTarget.type === 'turnos') await structureService.deleteTurno(deleteTarget.id);
      else await structureService.deleteClassroom(deleteTarget.id);
      addToast('success', 'Eliminado');
      setDeleteTarget(null);
      load();
    } catch (err: any) {
      addToast('error', err.response?.data?.message || 'Error');
    } finally { setIsSaving(false); }
  };

  const toggleTurno = (id: string, checked: boolean) => {
    setClassroomData((prev) => ({
      ...prev,
      turnoIds: checked ? [...prev.turnoIds, id] : prev.turnoIds.filter((t) => t !== id),
    }));
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">🏫 Estructura</h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {(['sedes', 'turnos', 'salones'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 capitalize ${
              tab === t ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ===== SEDES ===== */}
      {tab === 'sedes' && (
        <>
          <div className="flex justify-end">
            <Button onClick={() => setShowSede(true)}>+ Nueva Sede</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sedes.map((s) => (
              <Card key={s.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{s.name}</h3>
                    <p className="text-sm text-gray-500">
                      {s.classrooms.length} salones ·{' '}
                      {s.classrooms.reduce((a, c) => a + c.sections.length, 0)} secciones
                    </p>
                  </div>
                  <button
                    onClick={() => setDeleteTarget({ type: 'sedes', id: s.id, name: s.name })}
                    className="text-red-600 hover:underline text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              </Card>
            ))}
            {sedes.length === 0 && <p className="text-gray-500 text-sm">No hay sedes</p>}
          </div>
        </>
      )}

      {/* ===== TURNOS ===== */}
      {tab === 'turnos' && (
        <>
          <div className="flex justify-end">
            <Button onClick={() => setShowTurno(true)}>+ Nuevo Turno</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {turnos.map((t) => (
              <Card key={t.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{t.name}</h3>
                    <p className="text-sm text-gray-500">
                      Slot 1: {t.slot1Start} - {t.slot1End}
                    </p>
                    <p className="text-sm text-gray-500">
                      Slot 2: {t.slot2Start} - {t.slot2End}
                    </p>
                  </div>
                  <button
                    onClick={() => setDeleteTarget({ type: 'turnos', id: t.id, name: t.name })}
                    className="text-red-600 hover:underline text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              </Card>
            ))}
            {turnos.length === 0 && <p className="text-gray-500 text-sm">No hay turnos</p>}
          </div>
        </>
      )}

      {/* ===== SALONES ===== */}
      {tab === 'salones' && (
        <>
          <div className="flex justify-end">
            <Button onClick={() => setShowClassroom(true)}>+ Nuevo Salón</Button>
          </div>
          {sedes.map((s) => (
            <Card key={s.id} className="mb-3">
              <h3 className="font-semibold mb-2">🏫 {s.name}</h3>
              {s.classrooms.length === 0 ? (
                <p className="text-sm text-gray-400">Sin salones</p>
              ) : (
                <div className="space-y-2">
                  {s.classrooms.map((c) => (
                    <div key={c.id} className="flex justify-between items-center bg-gray-50 rounded px-3 py-2">
                      <div>
                        <p className="font-medium">🚪 {c.name}</p>
                        <p className="text-xs text-gray-500">
                          Secciones: {c.sections.map((sec) => sec.name).join(', ')}
                        </p>
                      </div>
                      <button
                        onClick={() => setDeleteTarget({ type: 'salones', id: c.id, name: c.name })}
                        className="text-red-600 hover:underline text-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </>
      )}

      {/* ===== MODALS ===== */}
      <Modal isOpen={showSede} onClose={() => setShowSede(false)} title="Nueva Sede">
        <form onSubmit={saveSede} className="space-y-4">
          <Input label="Nombre" value={sedeName} onChange={(e) => setSedeName(e.target.value)} required />
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" type="button" onClick={() => setShowSede(false)}>Cancelar</Button>
            <Button type="submit" isLoading={isSaving}>Crear</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showTurno} onClose={() => setShowTurno(false)} title="Nuevo Turno">
        <form onSubmit={saveTurno} className="space-y-4">
          <Input label="Nombre" value={turnoData.name} onChange={(e) => setTurnoData({ ...turnoData, name: e.target.value })} placeholder="Ej: Mañana" required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Slot 1 inicio" type="time" value={turnoData.slot1Start} onChange={(e) => setTurnoData({ ...turnoData, slot1Start: e.target.value })} required />
            <Input label="Slot 1 fin" type="time" value={turnoData.slot1End} onChange={(e) => setTurnoData({ ...turnoData, slot1End: e.target.value })} required />
            <Input label="Slot 2 inicio" type="time" value={turnoData.slot2Start} onChange={(e) => setTurnoData({ ...turnoData, slot2Start: e.target.value })} required />
            <Input label="Slot 2 fin" type="time" value={turnoData.slot2End} onChange={(e) => setTurnoData({ ...turnoData, slot2End: e.target.value })} required />
          </div>
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" type="button" onClick={() => setShowTurno(false)}>Cancelar</Button>
            <Button type="submit" isLoading={isSaving}>Crear</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showClassroom} onClose={() => setShowClassroom(false)} title="Nuevo Salón">
        <form onSubmit={saveClassroom} className="space-y-4">
          <Input
            label="Nombre del salón"
            value={classroomData.name}
            onChange={(e) => setClassroomData({ ...classroomData, name: e.target.value })}
            placeholder="Ej: A11"
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sede</label>
            <select
              value={classroomData.sedeId}
              onChange={(e) => setClassroomData({ ...classroomData, sedeId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              required
            >
              <option value="">Selecciona sede</option>
              {sedes.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Turnos (se creará una sección por cada uno)
            </label>
            <div className="space-y-1">
              {turnos.map((t) => (
                <Checkbox
                  key={t.id}
                  label={`${t.name} (${t.slot1Start}-${t.slot1End} / ${t.slot2Start}-${t.slot2End})`}
                  checked={classroomData.turnoIds.includes(t.id)}
                  onChange={(v) => toggleTurno(t.id, v)}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" type="button" onClick={() => setShowClassroom(false)}>Cancelar</Button>
            <Button type="submit" isLoading={isSaving}>Crear</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Eliminar ${deleteTarget?.type || ''}`}
        message={`¿Eliminar "${deleteTarget?.name}"?`}
        isLoading={isSaving}
      />
    </div>
  );
};