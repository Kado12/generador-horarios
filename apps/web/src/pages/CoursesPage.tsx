import React, { useState, useEffect } from 'react';
import { Button, Input, Card, ConfirmModal, useToast } from '../components/ui';
import { academicService, Course } from '../api/academic.service';

export const CoursesPage: React.FC = () => {
  const { addToast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);

  const load = async () => setCourses(await academicService.listCourses());
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await academicService.createCourse(name);
      addToast('success', 'Curso creado');
      setName('');
      load();
    } catch (err: any) {
      addToast('error', err.response?.data?.message || 'Error');
    } finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsSaving(true);
    try {
      await academicService.deleteCourse(deleteTarget.id);
      addToast('success', 'Curso eliminado');
      setDeleteTarget(null);
      load();
    } catch (err: any) {
      addToast('error', err.response?.data?.message || 'Error');
    } finally { setIsSaving(false); }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">📘 Cursos</h1>

      <Card>
        <form onSubmit={create} className="flex gap-3">
          <Input placeholder="Nombre del curso (ej: Aritmética)" value={name} onChange={(e) => setName(e.target.value)} className="flex-1" required />
          <Button type="submit" isLoading={isSaving}>+ Crear</Button>
        </form>
      </Card>

      <Card className="p-0 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Curso</th>
              <th className="px-4 py-2 text-center font-medium text-gray-500">Docentes asignados</th>
              <th className="px-4 py-2 text-center font-medium text-gray-500">En bloques</th>
              <th className="px-4 py-2 text-right font-medium text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {courses.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-medium">{c.name}</td>
                <td className="px-4 py-2 text-center">{c._count?.teacherCourses || 0}</td>
                <td className="px-4 py-2 text-center">{c._count?.blockCourses || 0}</td>
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={() => setDeleteTarget(c)}
                    className="text-red-600 hover:underline text-sm"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {courses.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">Sin cursos</td></tr>
            )}
          </tbody>
        </table>
      </Card>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar Curso"
        message={`¿Eliminar "${deleteTarget?.name}"? No podrá eliminarse si tiene docentes o bloques asignados.`}
        isLoading={isSaving}
      />
    </div>
  );
};