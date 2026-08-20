import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Card, Modal, ConfirmModal, useToast } from '../components/ui';
import { teachersService, Teacher } from '../api/teachers.service';

export const TeachersPage: React.FC = () => {
  const { addToast } = useToast();
  const nav = useNavigate();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', dni: '', phone: '', email: '', maxSessionsPerWeek: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Teacher | null>(null);

  const load = async () => setTeachers(await teachersService.list(search || undefined));
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [search]);

  const openCreate = () => {
    setEditing(null);
    setFormData({ firstName: '', lastName: '', dni: '', phone: '', email: '', maxSessionsPerWeek: '' });
    setShowForm(true);
  };

  const openEdit = (t: Teacher) => {
    setEditing(t);
    setFormData({
      firstName: t.firstName, lastName: t.lastName, dni: t.dni,
      phone: t.phone || '', email: t.email || '',
      maxSessionsPerWeek: t.maxSessionsPerWeek ? String(t.maxSessionsPerWeek) : '',
    });
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        maxSessionsPerWeek: formData.maxSessionsPerWeek ? parseInt(formData.maxSessionsPerWeek) : null,
      };
      if (editing) {
        await teachersService.update(editing.id, payload);
        addToast('success', 'Docente actualizado');
      } else {
        await teachersService.create(payload);
        addToast('success', 'Docente creado');
      }
      setShowForm(false);
      load();
    } catch (err: any) {
      addToast('error', err.response?.data?.message || 'Error');
    } finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsSaving(true);
    try {
      await teachersService.delete(deleteTarget.id);
      addToast('success', 'Docente eliminado');
      setDeleteTarget(null);
      load();
    } catch (err: any) {
      addToast('error', err.response?.data?.message || 'Error');
    } finally { setIsSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">👨‍🏫 Docentes</h1>
        <Button onClick={openCreate}>+ Nuevo Docente</Button>
      </div>

      <Card>
        <Input
          placeholder="Buscar por nombre o DNI..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Card>

      <Card className="p-0 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Docente</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">DNI</th>
              <th className="px-4 py-2 text-center font-medium text-gray-500">Cursos</th>
              <th className="px-4 py-2 text-center font-medium text-gray-500">Estado</th>
              <th className="px-4 py-2 text-right font-medium text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {teachers.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-medium">{t.lastName}, {t.firstName}</td>
                <td className="px-4 py-2">{t.dni}</td>
                <td className="px-4 py-2 text-center">{t.courses.length}</td>
                <td className="px-4 py-2 text-center">
                  <span className={`px-2 py-1 text-xs rounded-full ${t.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {t.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-2 text-right space-x-2">
                  <button onClick={() => nav(`/teachers/${t.id}`)} className="text-purple-600 hover:underline text-sm">
                    🎯 Disponibilidad
                  </button>
                  <button onClick={() => openEdit(t)} className="text-blue-600 hover:underline text-sm">
                    Editar
                  </button>
                  {t.isActive && (
                    <button onClick={() => setDeleteTarget(t)} className="text-red-600 hover:underline text-sm">
                      Eliminar
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {teachers.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Sin docentes</td></tr>
            )}
          </tbody>
        </table>
      </Card>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editing ? 'Editar Docente' : 'Nuevo Docente'}>
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nombres" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required />
            <Input label="Apellidos" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required />
          </div>
          <Input label="DNI" value={formData.dni} onChange={(e) => setFormData({ ...formData, dni: e.target.value })} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Teléfono" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          </div>
          <Input
            label="Carga máxima semanal (opcional)"
            type="number"
            min={1}
            value={formData.maxSessionsPerWeek}
            onChange={(e) => setFormData({ ...formData, maxSessionsPerWeek: e.target.value })}
            placeholder="Ej: 15"
          />
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button type="submit" isLoading={isSaving}>Guardar</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar Docente"
        message={`¿Eliminar a ${deleteTarget?.firstName} ${deleteTarget?.lastName}?`}
        isLoading={isSaving}
      />
    </div>
  );
};

// ===== DETAIL: Gestión de disponibilidad =====
export const TeacherDetailPage: React.FC = () => {
  const { addToast } = useToast();
  const nav = useNavigate();
  const id = window.location.pathname.split('/').pop()!;

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [sedes, setSedes] = useState<any[]>([]);
  const [turnos, setTurnos] = useState<any[]>([]);

  const load = async () => {
    const [t, c, s, tr] = await Promise.all([
      teachersService.findOne(id),
      import('../api/academic.service').then((m) => m.academicService.listCourses()),
      import('../api/structure.service').then((m) => m.structureService.listSedes()),
      import('../api/structure.service').then((m) => m.structureService.listTurnos()),
    ]);
    setTeacher(t);
    setCourses(c);
    setSedes(s);
    setTurnos(tr);
  };

  useEffect(() => { load(); }, [id]);

  if (!teacher) return <p className="text-center py-8">Cargando...</p>;

  const courseIds = new Set(teacher.courses.map((c) => c.course.id));
  const turnoIds = new Set(teacher.turnos.map((t) => t.turno.id));
  const sedeIds = new Set(teacher.sedes.map((s) => s.sede.id));
  const unavailDays = new Set(teacher.unavailableDays.map((d) => d.dayOfWeek));

  const toggleCourse = async (cid: string) => {
    try {
      if (courseIds.has(cid)) await teachersService.removeCourse(id, cid);
      else await teachersService.addCourse(id, cid);
      load();
    } catch (err: any) {
      addToast('error', err.response?.data?.message || 'Error');
    }
  };

  const saveTurnos = async (checked: boolean, tid: string) => {
    const next = checked ? [...turnoIds, tid] : [...turnoIds].filter((x) => x !== tid);
    try {
      await teachersService.setTurnos(id, next);
      load();
    } catch (err: any) {
      addToast('error', err.response?.data?.message || 'Error');
    }
  };

  const saveSedes = async (checked: boolean, sid: string) => {
    const next = checked ? [...sedeIds, sid] : [...sedeIds].filter((x) => x !== sid);
    try {
      await teachersService.setSedes(id, next);
      load();
    } catch (err: any) {
      addToast('error', err.response?.data?.message || 'Error');
    }
  };

  const saveDay = async (checked: boolean, day: number) => {
    const next = checked ? [...unavailDays, day] : [...unavailDays].filter((x) => x !== day);
    try {
      await teachersService.setUnavailableDays(id, Array.from(next));
      load();
    } catch (err: any) {
      addToast('error', err.response?.data?.message || 'Error');
    }
  };

  const DAY_NAMES = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <button onClick={() => nav('/teachers')} className="text-sm text-blue-600 hover:underline mb-1">← Volver</button>
          <h1 className="text-2xl font-bold">{teacher.firstName} {teacher.lastName}</h1>
          <p className="text-sm text-gray-500">DNI: {teacher.dni}</p>
        </div>
      </div>

      {/* Cursos */}
      <Card>
        <h2 className="font-semibold mb-2">📘 Cursos que puede dictar</h2>
        <div className="flex flex-wrap gap-2">
          {courses.map((c) => (
            <button
              key={c.id}
              onClick={() => toggleCourse(c.id)}
              className={`px-3 py-1.5 text-sm rounded ${
                courseIds.has(c.id) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {courseIds.has(c.id) ? '✓' : '+'} {c.name}
            </button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Turnos */}
        <Card>
          <h2 className="font-semibold mb-2">🕐 Turnos preferidos</h2>
          <p className="text-xs text-gray-500 mb-2">Si no hay ninguno marcado, puede dictar en todos.</p>
          <div className="space-y-1">
            {turnos.map((t) => (
              <label key={t.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={turnoIds.has(t.id)}
                  onChange={(e) => saveTurnos(e.target.checked, t.id)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm">{t.name} ({t.slot1Start}-{t.slot2End})</span>
              </label>
            ))}
          </div>
        </Card>

        {/* Sedes */}
        <Card>
          <h2 className="font-semibold mb-2">🏫 Sedes preferidas</h2>
          <p className="text-xs text-gray-500 mb-2">Si no hay ninguna marcada, puede dictar en todas.</p>
          <div className="space-y-1">
            {sedes.map((s) => (
              <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sedeIds.has(s.id)}
                  onChange={(e) => saveSedes(e.target.checked, s.id)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm">{s.name}</span>
              </label>
            ))}
          </div>
        </Card>
      </div>

      {/* Días no disponibles */}
      <Card>
        <h2 className="font-semibold mb-2">🚫 Días no disponibles</h2>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((d) => (
            <button
              key={d}
              onClick={() => saveDay(!unavailDays.has(d), d)}
              className={`px-4 py-2 text-sm rounded ${
                unavailDays.has(d) ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {unavailDays.has(d) ? '🚫' : '✓'} {DAY_NAMES[d]}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
};