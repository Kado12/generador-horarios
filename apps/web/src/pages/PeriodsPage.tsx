import React, { useState, useEffect } from 'react';
import { Button, Input, Select, Card, Modal, ConfirmModal, useToast } from '../components/ui';
import { academicService, Period, Block, Course } from '../api/academic.service';

export const PeriodsPage: React.FC = () => {
  const { addToast } = useToast();

  const [periods, setPeriods] = useState<Period[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState('');

  const [showPeriod, setShowPeriod] = useState(false);
  const [periodData, setPeriodData] = useState({ name: '', startDate: '', weeks: '12' });

  const [showBlock, setShowBlock] = useState(false);
  const [blockData, setBlockData] = useState({ name: '', startWeek: '1', endWeek: '6' });

  const [deleteTarget, setDeleteTarget] = useState<{ type: 'period' | 'block'; id: string; name: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const load = async () => {
    const [p, c] = await Promise.all([academicService.listPeriods(), academicService.listCourses()]);
    setPeriods(p);
    setCourses(c);
    const active = p.find((x) => x.isActive);
    if (active && !selectedPeriodId) setSelectedPeriodId(active.id);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (selectedPeriodId) academicService.listBlocks(selectedPeriodId).then(setBlocks);
  }, [selectedPeriodId]);

  const savePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await academicService.createPeriod(periodData.name, periodData.startDate, parseInt(periodData.weeks));
      addToast('success', 'Período creado');
      setShowPeriod(false);
      load();
    } catch (err: any) {
      addToast('error', err.response?.data?.message || 'Error');
    } finally { setIsSaving(false); }
  };

  const saveBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await academicService.createBlock({
        periodId: selectedPeriodId,
        name: blockData.name,
        startWeek: parseInt(blockData.startWeek),
        endWeek: parseInt(blockData.endWeek),
      });
      addToast('success', 'Bloque creado');
      setShowBlock(false);
      setBlockData({ name: '', startWeek: '1', endWeek: '6' });
      academicService.listBlocks(selectedPeriodId).then(setBlocks);
    } catch (err: any) {
      addToast('error', err.response?.data?.message || 'Error');
    } finally { setIsSaving(false); }
  };

  const togglePeriod = async (p: Period) => {
    try {
      await academicService.togglePeriod(p.id, !p.isActive);
      load();
    } catch (err: any) {
      addToast('error', err.response?.data?.message || 'Error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsSaving(true);
    try {
      if (deleteTarget.type === 'period') await academicService.deletePeriod(deleteTarget.id);
      else await academicService.deleteBlock(deleteTarget.id);
      addToast('success', 'Eliminado');
      setDeleteTarget(null);
      load();
      academicService.listBlocks(selectedPeriodId).then(setBlocks);
    } catch (err: any) {
      addToast('error', err.response?.data?.message || 'Error');
    } finally { setIsSaving(false); }
  };

  const toggleCourseInBlock = async (blockId: string, courseId: string, present: boolean) => {
    try {
      if (present) await academicService.removeCourseFromBlock(blockId, courseId);
      else await academicService.addCourseToBlock(blockId, courseId);
      academicService.listBlocks(selectedPeriodId).then(setBlocks);
    } catch (err: any) {
      addToast('error', err.response?.data?.message || 'Error');
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">📅 Períodos y Bloques</h1>

      <Card>
        <div className="flex gap-3">
          <Select
            label="Período"
            value={selectedPeriodId}
            onChange={(e) => setSelectedPeriodId(e.target.value)}
            options={periods.map((p) => ({ value: p.id, label: `${p.name} ${p.isActive ? '(activo)' : ''}` }))}
          />
          <div className="flex items-end gap-2">
            <Button onClick={() => setShowPeriod(true)}>+ Período</Button>
            <Button variant="secondary" onClick={() => setShowBlock(true)} disabled={!selectedPeriodId}>+ Bloque</Button>
          </div>
        </div>
      </Card>

      {/* Lista de períodos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {periods.map((p) => (
          <Card key={p.id}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{p.name}</h3>
                <p className="text-sm text-gray-500">
                  Inicio: {p.startDate.split('T')[0]} · {p.weeks} semanas
                </p>
                <p className="text-sm text-gray-500">
                  Bloques: {p.blocks.length}
                </p>
              </div>
              <div className="space-x-2">
                <button onClick={() => togglePeriod(p)} className="text-gray-600 hover:underline text-sm">
                  {p.isActive ? 'Desactivar' : 'Activar'}
                </button>
                <button onClick={() => setDeleteTarget({ type: 'period', id: p.id, name: p.name })} className="text-red-600 hover:underline text-sm">
                  Eliminar
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Bloques del período seleccionado */}
      {selectedPeriodId && (
        <Card>
          <h2 className="font-semibold mb-3">🧱 Bloques del período</h2>
          {blocks.length === 0 ? (
            <p className="text-sm text-gray-500">Sin bloques</p>
          ) : (
            <div className="space-y-3">
              {blocks.map((b) => {
                const assignedIds = new Set(b.courses?.map((c) => c.course.id) || []);
                return (
                  <div key={b.id} className="border rounded p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">🧱 {b.name}</p>
                        <p className="text-xs text-gray-500">Semanas {b.startWeek} a {b.endWeek} · {assignedIds.size} cursos</p>
                      </div>
                      <button
                        onClick={() => setDeleteTarget({ type: 'block', id: b.id, name: b.name })}
                        className="text-red-600 hover:underline text-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {courses.map((c) => {
                        const present = assignedIds.has(c.id);
                        return (
                          <button
                            key={c.id}
                            onClick={() => toggleCourseInBlock(b.id, c.id, present)}
                            className={`px-2 py-1 text-xs rounded ${
                              present ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {present ? '✓' : '+'} {c.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Modals */}
      <Modal isOpen={showPeriod} onClose={() => setShowPeriod(false)} title="Nuevo Período">
        <form onSubmit={savePeriod} className="space-y-4">
          <Input label="Nombre" value={periodData.name} onChange={(e) => setPeriodData({ ...periodData, name: e.target.value })} placeholder="2026" required />
          <Input label="Fecha de inicio (lunes)" type="date" value={periodData.startDate} onChange={(e) => setPeriodData({ ...periodData, startDate: e.target.value })} required />
          <Input label="Semanas" type="number" min={1} max={20} value={periodData.weeks} onChange={(e) => setPeriodData({ ...periodData, weeks: e.target.value })} required />
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" type="button" onClick={() => setShowPeriod(false)}>Cancelar</Button>
            <Button type="submit" isLoading={isSaving}>Crear</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showBlock} onClose={() => setShowBlock(false)} title="Nuevo Bloque">
        <form onSubmit={saveBlock} className="space-y-4">
          <Input label="Nombre" value={blockData.name} onChange={(e) => setBlockData({ ...blockData, name: e.target.value })} placeholder="Bloque 1" required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Semana inicio" type="number" min={1} value={blockData.startWeek} onChange={(e) => setBlockData({ ...blockData, startWeek: e.target.value })} required />
            <Input label="Semana fin" type="number" min={1} value={blockData.endWeek} onChange={(e) => setBlockData({ ...blockData, endWeek: e.target.value })} required />
          </div>
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" type="button" onClick={() => setShowBlock(false)}>Cancelar</Button>
            <Button type="submit" isLoading={isSaving}>Crear</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Eliminar ${deleteTarget?.type === 'period' ? 'Período' : 'Bloque'}`}
        message={`¿Eliminar "${deleteTarget?.name}"?`}
        isLoading={isSaving}
      />
    </div>
  );
};