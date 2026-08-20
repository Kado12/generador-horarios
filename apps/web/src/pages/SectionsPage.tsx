import React, { useState, useEffect } from 'react';
import { Button, Input, Select, Card, Modal, ConfirmModal, useToast } from '../components/ui';
import { structureService, SectionFull, Sede, Turno } from '../api/structure.service';

export const SectionsPage: React.FC = () => {
  const { addToast } = useToast();

  const [sections, setSections] = useState<SectionFull[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [turnos, setTurnos] = useState<Turno[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', sedeId: '', classroomId: '', turnoId: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SectionFull | null>(null);

  const load = async () => {
    const [s, sd, t] = await Promise.all([
      structureService.listSections(),
      structureService.listSedes(),
      structureService.listTurnos(),
    ]);
    setSections(s);
    setSedes(sd);
    setTurnos(t);
  };
  useEffect(() => { load(); }, []);

  const classroomsOfSede = sedes.find((s) => s.id === formData.sedeId)?.classrooms || [];

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await structureService.createSection({
        name: formData.name || undefined,
        classroomId: formData.classroomId,
        turnoId: formData.turnoId,
      });
      addToast('success', 'Sección creada');
      setShowForm(false);
      setFormData({ name: '', sedeId: '', classroomId: '', turnoId: '' });
      load();
    } catch (err: any) {
      addToast('error', err.response?.data?.message || 'Error');
    } finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsSaving(true);
    try {
      await structureService.deleteSection(deleteTarget.id);
      addToast('success', 'Sección eliminada');
      setDeleteTarget(null);
      load();
    } catch (err: any) {
      addToast('error', err.response?.data?.message || 'Error');
    } finally { setIsSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">📋 Secciones</h1>
        <Button onClick={() => setShowForm(true)}>+ Nueva Sección</Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Sección</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Salón</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Sede</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Turno</th>
              <th className="px-4 py-2 text-center font-medium text-gray-500">Sesiones</th>
              <th className="px-4 py-2 text-right font-medium text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {sections.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-medium">{s.name}</td>
                <td className="px-4 py-2">{s.classroom.name}</td>
                <td className="px-4 py-2">{s.classroom.sede.name}</td>
                <td className="px-4 py-2">{s.turno.name}</td>
                <td className="px-4 py-2 text-center">{s._count.sessions}</td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => setDeleteTarget(s)} className="text-red-600 hover:underline text-sm">
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {sections.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Sin secciones</td></tr>
            )}
          </tbody>
        </table>
      </Card>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Nueva Sección">
        <form onSubmit={save} className="space-y-4">
          <Select
            label="Sede"
            value={formData.sedeId}
            onChange={(e) => setFormData({ ...formData, sedeId: e.target.value, classroomId: '' })}
            options={[{ value: '', label: 'Selecciona sede' }, ...sedes.map((s) => ({ value: s.id, label: s.name }))]}
            required
          />
          <Select
            label="Salón"
            value={formData.classroomId}
            onChange={(e) => setFormData({ ...formData, classroomId: e.target.value })}
            options={[{ value: '', label: 'Selecciona salón' }, ...classroomsOfSede.map((c) => ({ value: c.id, label: c.name }))]}
            required
          />
          <Select
            label="Turno"
            value={formData.turnoId}
            onChange={(e) => setFormData({ ...formData, turnoId: e.target.value })}
            options={[{ value: '', label: 'Selecciona turno' }, ...turnos.map((t) => ({ value: t.id, label: t.name }))]}
            required
          />
          <Input
            label="Nombre (opcional, se autogenera si se deja vacío)"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ej: A11 - M"
          />
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button type="submit" isLoading={isSaving}>Crear</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar Sección"
        message={`¿Eliminar "${deleteTarget?.name}"?`}
        isLoading={isSaving}
      />
    </div>
  );
};