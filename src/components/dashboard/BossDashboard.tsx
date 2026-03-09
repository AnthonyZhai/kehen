import { useState, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RefreshCw, Download, AlertTriangle, ChevronLeft, ChevronRight, Search, Users, Clock, Plus, GraduationCap, UserPlus, Pencil, Upload, User, FileText, Layout, Trash2 } from 'lucide-react';
import WebsiteContentManager from './WebsiteContentManager';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface Student {
  id: string;
  name: string;
  class_name: string;
  class_id?: string | null;
  subject: string;
  remaining_hours: number;
  total_hours: number;
  alert_threshold: number;
  photo_url: string | null;
  parent_id: string | null;
  status: string | null;
}

interface ClassRecord {
  id: string;
  student_id: string;
  class_date: string;
  hours_consumed: number;
  photo_url: string | null;
  students: { name: string; class_name: string };
  profiles: { full_name: string };
}

interface Teacher {
  id: string;
  email: string;
  full_name: string;
}

interface ClassInfo {
  id: string;
  name: string;
  description: string;
  teacher_id: string | null;
  schedule: string;
  default_hours?: number;
  profiles?: { full_name: string };
}

interface TrialApplication {
  id: string;
  child_name: string;
  course_type: string;
  phone: string;
  status: string;
  notes: string | null;
  created_at: string;
}

const PAGE_SIZE = 20;

export default function BossDashboard() {
  const queryClient = useQueryClient();
  const [studentPage, setStudentPage] = useState(1);
  const [recordPage, setRecordPage] = useState(1);
  const [recordSearch, setRecordSearch] = useState('');
  const [studentMgmtPage, setStudentMgmtPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [editStudentOpen, setEditStudentOpen] = useState(false);
  const [addTeacherOpen, setAddTeacherOpen] = useState(false);
  const [editTeacherOpen, setEditTeacherOpen] = useState(false);
  const [addClassOpen, setAddClassOpen] = useState(false);
  const [editClassOpen, setEditClassOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // 导入进度状态
  const [importProgress, setImportProgress] = useState({ importing: false, current: 0, total: 0 });

  // 续费相关状态
  const [renewalOpen, setRenewalOpen] = useState(false);
  const [renewalStudent, setRenewalStudent] = useState<Student | null>(null);
  const [renewalForm, setRenewalForm] = useState({ hoursToAdd: '', notes: '' });

  const [studentFilters, setStudentFilters] = useState({
    name: '',
    class_name: '',
    sortBy: 'name' as 'name' | 'remaining_hours' | 'class_name',
    sortOrder: 'asc' as 'asc' | 'desc',
    class_id: '',
  });

  const [newStudent, setNewStudent] = useState({
    name: '', className: '', subject: '', totalHours: '', remainingHours: '', parentId: '', photoUrl: '', alertThreshold: '0', classId: '',
  });

  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState({
    name: '', className: '', subject: '', totalHours: '', remainingHours: '', alertThreshold: '', parentId: '', photoUrl: '', classId: '', status: 'active',
  });

  const [studentMgmtFilters, setStudentMgmtFilters] = useState({
    name: '',
    class_name: '',
    sortBy: 'name' as 'name' | 'remaining_hours' | 'class_name',
    sortOrder: 'asc' as 'asc' | 'desc',
    class_id: '',
  });

  const [newTeacher, setNewTeacher] = useState({
    fullName: '', email: '', password: '',
  });

  const [newClass, setNewClass] = useState({
    name: '', description: '', teacherId: '', schedule: '', defaultHours: '1',
  });

  const [editTeacher, setEditTeacher] = useState<Teacher | null>(null);
  const [editTeacherForm, setEditTeacherForm] = useState({ fullName: '', email: '', password: '' });

  const [editClass, setEditClass] = useState<ClassInfo | null>(null);
  const [editClassForm, setEditClassForm] = useState({
    name: '', description: '', teacherId: '', schedule: '', defaultHours: '1',
  });

  const [trialPage, setTrialPage] = useState(1);
  const [trialFilter, setTrialFilter] = useState('all');

  // 获取所有学生
  const { data: allStudents = [] } = useQuery({
    queryKey: ['all-students'],
    queryFn: async () => {
      const { data, error } = await supabase.from('students').select('*').order('name');
      if (error) throw error;
      return data as Student[];
    },
  });

  // 获取所有家长
  const { data: allParents = [] } = useQuery({
    queryKey: ['all-parents'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('id, email, full_name').eq('role', 'parent').order('full_name');
      if (error) throw error;
      return data as { id: string; email: string; full_name: string }[];
    },
  });

  // 获取所有教师
  const { data: allTeachers = [] } = useQuery({
    queryKey: ['all-teachers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('id, email, full_name').eq('role', 'teacher').order('full_name');
      if (error) throw error;
      return data as Teacher[];
    },
  });

  // 获取所有班级
  const { data: allClasses = [] } = useQuery({
    queryKey: ['all-classes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('classes').select('*, profiles(full_name)').order('name');
      if (error) throw error;
      return data as ClassInfo[];
    },
  });

  // 获取试听申请
  const { data: trialData } = useQuery({
    queryKey: ['trial-applications', trialPage, trialFilter],
    queryFn: async () => {
      const from = (trialPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      let query = supabase.from('trial_applications').select('*', { count: 'exact' });
      if (trialFilter !== 'all') query = query.eq('status', trialFilter);
      const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, to);
      if (error) throw error;
      return { applications: data as TrialApplication[], total: count || 0 };
    },
  });

  const trialApplications = trialData?.applications || [];
  const totalTrialApplications = trialData?.total || 0;
  const totalTrialPages = Math.ceil(totalTrialApplications / PAGE_SIZE);

  // 筛选和排序学生（用于课时列表）
  const filteredStudents = useMemo(() => {
    let result = [...allStudents];
    if (studentFilters.name) result = result.filter(s => s.name.includes(studentFilters.name));
    if (studentFilters.class_id) result = result.filter(s => s.class_id === studentFilters.class_id);
    else if (studentFilters.class_name) result = result.filter(s => s.class_name === studentFilters.class_name);
    result.sort((a, b) => {
      let cmp = 0;
      if (studentFilters.sortBy === 'name') cmp = a.name.localeCompare(b.name);
      else if (studentFilters.sortBy === 'remaining_hours') cmp = (a.remaining_hours || 0) - (b.remaining_hours || 0);
      else if (studentFilters.sortBy === 'class_name') cmp = (a.class_name || '').localeCompare(b.class_name || '');
      return studentFilters.sortOrder === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [allStudents, studentFilters]);

  const paginatedStudents = useMemo(() => {
    const start = (studentPage - 1) * PAGE_SIZE;
    return filteredStudents.slice(start, start + PAGE_SIZE);
  }, [filteredStudents, studentPage]);

  const totalStudentPages = Math.ceil(filteredStudents.length / PAGE_SIZE);

  // 筛选和排序学生（用于学生管理列表）
  const filteredStudentsMgmt = useMemo(() => {
    let result = [...allStudents];
    if (studentMgmtFilters.name) result = result.filter(s => s.name.includes(studentMgmtFilters.name));
    if (studentMgmtFilters.class_id) result = result.filter(s => s.class_id === studentMgmtFilters.class_id);
    else if (studentMgmtFilters.class_name) result = result.filter(s => s.class_name === studentMgmtFilters.class_name);
    result.sort((a, b) => {
      let cmp = 0;
      if (studentMgmtFilters.sortBy === 'name') cmp = a.name.localeCompare(b.name);
      else if (studentMgmtFilters.sortBy === 'remaining_hours') cmp = (a.remaining_hours || 0) - (b.remaining_hours || 0);
      else if (studentMgmtFilters.sortBy === 'class_name') cmp = (a.class_name || '').localeCompare(b.class_name || '');
      return studentMgmtFilters.sortOrder === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [allStudents, studentMgmtFilters]);

  // 学生管理分页
  const paginatedStudentsMgmt = useMemo(() => {
    const start = (studentMgmtPage - 1) * PAGE_SIZE;
    return filteredStudentsMgmt.slice(start, start + PAGE_SIZE);
  }, [filteredStudentsMgmt, studentMgmtPage]);

  const totalStudentMgmtPages = Math.ceil(filteredStudentsMgmt.length / PAGE_SIZE);

  // 获取课时记录
  const { data: recordsData, isLoading: recordsLoading } = useQuery({
    queryKey: ['all-records', recordPage, recordSearch],
    queryFn: async () => {
      const from = (recordPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      let query = supabase
        .from('class_records')
        .select('*, students(name, class_name), profiles(full_name)', { count: 'exact' });

      // 如果有搜索关键词，先在客户端匹配学生名获取 student_id 列表
      if (recordSearch.trim()) {
        const matchedIds = allStudents
          .filter(s => s.name.includes(recordSearch.trim()))
          .map(s => s.id);
        if (matchedIds.length === 0) {
          return { records: [] as ClassRecord[], total: 0 };
        }
        query = query.in('student_id', matchedIds);
      }

      const { data, error, count } = await query
        .order('class_date', { ascending: false })
        .order('id', { ascending: false })
        .range(from, to);
      if (error) throw error;
      return { records: data as ClassRecord[], total: count || 0 };
    },
  });

  const records = recordsData?.records || [];
  const totalRecords = recordsData?.total || 0;
  const totalRecordPages = Math.ceil(totalRecords / PAGE_SIZE);

  const lowHourStudents = useMemo(() => allStudents.filter(s => s.remaining_hours <= s.alert_threshold), [allStudents]);
  const classNames = useMemo(() => [...new Set(allStudents.map(s => s.class_name).filter(Boolean))], [allStudents]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['all-students'] });
    await queryClient.invalidateQueries({ queryKey: ['all-records'] });
    await queryClient.invalidateQueries({ queryKey: ['all-teachers'] });
    await queryClient.invalidateQueries({ queryKey: ['all-classes'] });
    await queryClient.invalidateQueries({ queryKey: ['trial-applications'] });
    setRefreshing(false);
    toast.success('数据已刷新');
  };

  // 更新试听申请状态
  const handleUpdateTrialStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from('trial_applications').update({ status }).eq('id', id);
      if (error) throw error;
      toast.success('状态已更新');
      queryClient.invalidateQueries({ queryKey: ['trial-applications'] });
    } catch (error) {
      toast.error('更新失败');
    }
  };

  // 添加学生
  const handleAddStudent = async () => {
    if (!newStudent.name) { toast.error('请填写学生姓名'); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('students').insert([{
        name: newStudent.name,
        class_name: newStudent.className,
        ...(newStudent.classId ? { class_id: newStudent.classId } : {}),
        subject: newStudent.subject || '',
        total_hours: parseInt(newStudent.totalHours) || 0,
        remaining_hours: newStudent.remainingHours ? parseFloat(newStudent.remainingHours) : (parseFloat(newStudent.totalHours) || 0),
        alert_threshold: parseInt(newStudent.alertThreshold) || 2,
        status: 'active',
        parent_id: newStudent.parentId || null,
      }]);
      if (error) throw error;
      toast.success('学生添加成功');
      setAddStudentOpen(false);
      setNewStudent({ name: '', className: '', subject: '', totalHours: '', remainingHours: '', parentId: '', photoUrl: '', alertThreshold: '0', classId: '' });
      queryClient.invalidateQueries({ queryKey: ['all-students'] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '添加失败');
    } finally { setSubmitting(false); }
  };

  // 打开编辑学生对话框
  const openEditStudent = (student: Student) => {
    setEditStudent(student);
    setEditForm({
      name: student.name,
      className: student.class_name || '',
      classId: student.class_id || '',
      subject: student.subject || '',
      totalHours: (student.total_hours || 0).toString(),
      remainingHours: (student.remaining_hours || 0).toString(),
      alertThreshold: (student.alert_threshold || 0).toString(),
      parentId: student.parent_id || '',
      photoUrl: student.photo_url || '',
      status: student.status || 'active',
    });
    setEditStudentOpen(true);
  };

  // 保存学生编辑
  const handleSaveStudent = async () => {
    if (!editStudent || !editForm.name) { toast.error('请填写学生姓名'); return; }
    setSubmitting(true);
    try {
      const updateData: Record<string, any> = {
        name: editForm.name,
        class_name: editForm.classId ? editForm.className : null,
        class_id: editForm.classId || null,
        subject: editForm.subject || null,
        total_hours: parseFloat(editForm.totalHours) || 0,
        remaining_hours: parseFloat(editForm.remainingHours) || 0,
        alert_threshold: parseInt(editForm.alertThreshold) || 0,
        parent_id: editForm.parentId || null,
        photo_url: editForm.photoUrl || null,
        status: editForm.status || 'active',
      };
      const { error } = await supabase.from('students').update(updateData).eq('id', editStudent.id);
      if (error) {
        console.error('Student update error:', error);
        throw new Error(error.message || JSON.stringify(error));
      }
      toast.success('学生信息已更新');
      setEditStudentOpen(false);
      setEditStudent(null);
      queryClient.invalidateQueries({ queryKey: ['all-students'] });
    } catch (error: any) {
      console.error('handleSaveStudent catch:', error);
      toast.error(error?.message || '更新失败');
    } finally { setSubmitting(false); }
  };

  // 上传学生照片
  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editStudent) return;

    setUploadingPhoto(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `student_${editStudent.id}_${Date.now()}.${fileExt}`;
      const filePath = `students/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('class_photos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('class_photos')
        .getPublicUrl(filePath);

      setEditForm({ ...editForm, photoUrl: publicUrl });
      toast.success('照片上传成功');
    } catch (error) {
      toast.error('照片上传失败');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 添加教师
  const handleAddTeacher = async () => {
    if (!newTeacher.fullName || !newTeacher.email || !newTeacher.password) {
      toast.error('请填写所有字段'); return;
    }
    if (newTeacher.password.length < 6) { toast.error('密码至少6位'); return; }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-teacher', {
        body: { fullName: newTeacher.fullName, email: newTeacher.email, password: newTeacher.password },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('教师账号创建成功');
      setAddTeacherOpen(false);
      setNewTeacher({ fullName: '', email: '', password: '' });
      queryClient.invalidateQueries({ queryKey: ['all-teachers'] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '创建失败');
    } finally { setSubmitting(false); }
  };

  // 添加班级
  const handleAddClass = async () => {
    if (!newClass.name) { toast.error('请填写班级名称'); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('classes').insert({
        name: newClass.name,
        description: newClass.description || '',
        teacher_id: newClass.teacherId || null,
        schedule: newClass.schedule || '',
        default_hours: parseFloat(newClass.defaultHours) || 1.0,
      });
      if (error) throw error;
      toast.success('班级创建成功');
      setAddClassOpen(false);
      setNewClass({ name: '', description: '', teacherId: '', schedule: '', defaultHours: '1' });
      queryClient.invalidateQueries({ queryKey: ['all-classes'] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '创建失败');
    } finally { setSubmitting(false); }
  };

  // 删除学生
  const handleDeleteStudent = async (student: Student) => {
    if (!window.confirm(`确定要删除学生「${student.name}」吗？该操作不可撤销，相关的课时记录和续费记录也会被一并删除。`)) return;
    try {
      const { error } = await supabase.from('students').delete().eq('id', student.id);
      if (error) throw error;
      toast.success(`已删除学生「${student.name}」`);
      queryClient.invalidateQueries({ queryKey: ['all-students'] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '删除失败');
    }
  };

  // 打开编辑教师对话框
  const openEditTeacher = (teacher: Teacher) => {
    setEditTeacher(teacher);
    setEditTeacherForm({ fullName: teacher.full_name, email: teacher.email, password: '' });
    setEditTeacherOpen(true);
  };

  // 保存教师编辑
  const handleSaveTeacher = async () => {
    if (!editTeacher || !editTeacherForm.fullName) { toast.error('请填写教师姓名'); return; }
    if (!editTeacherForm.email) { toast.error('请填写邮箱'); return; }
    if (editTeacherForm.password && editTeacherForm.password.length < 6) { toast.error('密码至少6位'); return; }
    setSubmitting(true);
    try {
      const body: Record<string, string> = {
        teacherId: editTeacher.id,
        fullName: editTeacherForm.fullName,
        email: editTeacherForm.email,
      };
      if (editTeacherForm.password) {
        body.password = editTeacherForm.password;
      }
      const { data, error } = await supabase.functions.invoke('update-teacher', { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('教师信息已更新');
      setEditTeacherOpen(false);
      setEditTeacher(null);
      queryClient.invalidateQueries({ queryKey: ['all-teachers'] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '更新失败');
    } finally { setSubmitting(false); }
  };

  // 打开编辑班级对话框
  const openEditClass = (classInfo: ClassInfo) => {
    setEditClass(classInfo);
    setEditClassForm({
      name: classInfo.name,
      description: classInfo.description || '',
      teacherId: classInfo.teacher_id || '',
      schedule: classInfo.schedule || '',
      defaultHours: (classInfo.default_hours || 1.0).toString(),
    });
    setEditClassOpen(true);
  };

  // 保存班级编辑
  const handleSaveClass = async () => {
    if (!editClass || !editClassForm.name) { toast.error('请填写班级名称'); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('classes').update({
        name: editClassForm.name,
        description: editClassForm.description || '',
        teacher_id: editClassForm.teacherId || null,
        schedule: editClassForm.schedule || '',
        default_hours: parseFloat(editClassForm.defaultHours) || 1.0,
      }).eq('id', editClass.id);
      if (error) throw error;

      // Update class_name in students table - try class_id first, fallback to old class_name
      try {
        await supabase.from('students').update({ class_name: editClassForm.name }).eq('class_id', editClass.id);
      } catch {
        // class_id column may not exist yet, fallback to class_name match
        if (editClass.name !== editClassForm.name) {
          await supabase.from('students').update({ class_name: editClassForm.name }).eq('class_name', editClass.name);
        }
      }

      toast.success('班级信息已更新');
      setEditClassOpen(false);
      setEditClass(null);
      queryClient.invalidateQueries({ queryKey: ['all-classes'] });
      queryClient.invalidateQueries({ queryKey: ['all-students'] }); // 刷新学生数据因为班级名称可能变了
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '更新失败');
    } finally { setSubmitting(false); }
  };

  // 导出学生数据
  const handleExportStudents = () => {
    const csvData = filteredStudents.map(s => ({
      '学生姓名': s.name, '班级': s.class_name || '-', '所学内容': s.subject || '-',
      '总课时': s.total_hours, '剩余课时': s.remaining_hours, '预警阈值': s.alert_threshold,
    }));
    if (csvData.length === 0) { toast.error('没有数据可导出'); return; }
    const headers = Object.keys(csvData[0]);
    const csv = [headers.join(','), ...csvData.map(row => headers.map(h => row[h as keyof typeof row]).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `学生课时统计_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
    link.click();
    toast.success('导出成功');
  };

  // 导入学生数据
  const handleImportStudents = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // 优先尝试 UTF-8，若表头匹配不到中文则回退 GBK
      let text = await file.text();
      if (!text.includes('姓名')) {
        const buf = await file.arrayBuffer();
        const decoder = new TextDecoder('gbk');
        text = decoder.decode(buf);
      }
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) { toast.error('CSV文件格式不正确'); return; }

      const headers = lines[0].split(',').map(h => h.trim());
      const nameIdx = headers.findIndex(h => h.includes('姓名'));
      const remainIdx = headers.findIndex(h => h.includes('剩余'));
      const totalIdx = headers.findIndex(h => h.includes('总'));

      if (nameIdx === -1 || remainIdx === -1 || totalIdx === -1) {
        toast.error('CSV须包含"客户姓名/学生姓名"、"剩余课时"、"总课时"列');
        return;
      }

      const classIdx = headers.findIndex(h => h.includes('班级'));

      const dataLines = lines.length - 1;
      setImportProgress({ importing: true, current: 0, total: dataLines });

      let updated = 0, created = 0;
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim());
        const name = cols[nameIdx];
        const remainingHours = parseFloat(cols[remainIdx]) || 0;
        const totalHours = parseFloat(cols[totalIdx]) || 0;
        const className = classIdx !== -1 ? cols[classIdx] : undefined;
        let classId: string | undefined = undefined;

        if (className) {
          const matchedClass = allClasses.find(c => c.name === className);
          if (matchedClass) {
            classId = matchedClass.id;
          }
        }

        if (!name) {
          setImportProgress(prev => ({ ...prev, current: i }));
          continue;
        }

        const existing = allStudents.find(s => s.name === name);
        if (existing) {
          const updateData: any = { remaining_hours: remainingHours, total_hours: totalHours };
          if (className !== undefined) {
            updateData.class_name = className;
            if (classId) updateData.class_id = classId;
          }
          await supabase.from('students').update(updateData).eq('id', existing.id);
          updated++;
        } else {
          const insertData: any = { name, remaining_hours: remainingHours, total_hours: totalHours, alert_threshold: 2, status: 'active' };
          if (className !== undefined) {
            insertData.class_name = className;
            if (classId) insertData.class_id = classId;
          }
          await supabase.from('students').insert(insertData);
          created++;
        }
        setImportProgress(prev => ({ ...prev, current: i }));
      }

      queryClient.invalidateQueries({ queryKey: ['all-students'] });
      toast.success(`导入完成：更新${updated}条，新建${created}条`);
    } catch (error) {
      toast.error('导入失败，请检查CSV格式');
    } finally {
      setImportProgress({ importing: false, current: 0, total: 0 });
      if (csvInputRef.current) csvInputRef.current.value = '';
    }
  };

  // 续费
  const openRenewal = (student: Student) => {
    setRenewalStudent(student);
    setRenewalForm({ hoursToAdd: '', notes: '' });
    setRenewalOpen(true);
  };

  const handleRenewal = async () => {
    if (!renewalStudent || !renewalForm.hoursToAdd) { toast.error('请填写新增课时'); return; }
    const hoursToAdd = parseFloat(renewalForm.hoursToAdd);
    if (isNaN(hoursToAdd) || hoursToAdd <= 0) { toast.error('请输入有效的课时数'); return; }

    setSubmitting(true);
    try {
      const prevRemaining = renewalStudent.remaining_hours;
      const prevTotal = renewalStudent.total_hours;
      const newRemaining = prevRemaining + hoursToAdd;
      const newTotal = prevTotal + hoursToAdd;

      const { error: updateErr } = await supabase.from('students').update({
        remaining_hours: newRemaining,
        total_hours: newTotal,
      }).eq('id', renewalStudent.id);
      if (updateErr) throw updateErr;

      const { data: { user } } = await supabase.auth.getUser();

      const { error: insertErr } = await supabase.from('renewal_records').insert({
        student_id: renewalStudent.id,
        hours_added: hoursToAdd,
        previous_remaining: prevRemaining,
        previous_total: prevTotal,
        created_by: user?.id || null,
        notes: renewalForm.notes || null,
      });
      if (insertErr) throw insertErr;

      queryClient.invalidateQueries({ queryKey: ['all-students'] });
      toast.success(`已为 ${renewalStudent.name} 续费 ${hoursToAdd} 课时`);
      setRenewalOpen(false);
      setRenewalStudent(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '续费失败');
    } finally { setSubmitting(false); }
  };

  // 获取家长名称
  const getParentName = (parentId: string | null) => {
    if (!parentId) return '-';
    const parent = allParents.find(p => p.id === parentId);
    return parent?.full_name || '-';
  };

  return (
    <DashboardLayout title="课时管理">
      <div className="space-y-4 sm:space-y-6">
        {lowHourStudents.length > 0 && (
          <Alert variant="destructive" className="bg-orange-50 border-orange-200">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertTitle className="text-orange-800 text-sm sm:text-base">续费预警</AlertTitle>
            <AlertDescription className="text-orange-700 text-xs sm:text-sm">
              有 {lowHourStudents.length} 位学生课时不足：
              <span className="flex flex-wrap gap-1 mt-1">
                {lowHourStudents.map(s => (
                  <Badge key={s.id} variant="outline" className="border-orange-300 text-orange-700 text-xs">
                    {s.name} ({s.remaining_hours}课时)
                  </Badge>
                ))}
              </span>
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="students" className="space-y-4">
          <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-full h-auto flex-wrap gap-2 justify-start sm:justify-center p-1">
              <TabsTrigger value="students" className="gap-2 text-sm sm:text-base px-3 py-2 flex-grow sm:flex-grow-0"><Clock className="w-4 h-4" /><span className="hidden sm:inline">课时</span>统计</TabsTrigger>
              <TabsTrigger value="student-mgmt" className="gap-2 text-sm sm:text-base px-3 py-2 flex-grow sm:flex-grow-0"><Users className="w-4 h-4" />学生<span className="hidden sm:inline">管理</span></TabsTrigger>
              <TabsTrigger value="records" className="gap-2 text-sm sm:text-base px-3 py-2 flex-grow sm:flex-grow-0"><Clock className="w-4 h-4" /><span className="hidden sm:inline">签到</span>记录</TabsTrigger>
              <TabsTrigger value="teachers" className="gap-2 text-sm sm:text-base px-3 py-2 flex-grow sm:flex-grow-0"><UserPlus className="w-4 h-4" />教师<span className="hidden sm:inline">管理</span></TabsTrigger>
              <TabsTrigger value="classes" className="gap-2 text-sm sm:text-base px-3 py-2 flex-grow sm:flex-grow-0"><GraduationCap className="w-4 h-4" />班级<span className="hidden sm:inline">管理</span></TabsTrigger>
              <TabsTrigger value="trials" className="gap-2 text-sm sm:text-base px-3 py-2 flex-grow sm:flex-grow-0"><FileText className="w-4 h-4" />试听<span className="hidden sm:inline">申请</span></TabsTrigger>
              <TabsTrigger value="website-content" className="gap-2 text-sm sm:text-base px-3 py-2 flex-grow sm:flex-grow-0"><Layout className="w-4 h-4" />官网<span className="hidden sm:inline">内容</span></TabsTrigger>
            </TabsList>
          </div>

          {/* 课时统计 */}
          <TabsContent value="students">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <CardTitle className="text-base sm:text-lg">学生课时列表</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="text-xs sm:text-sm">
                      <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${refreshing ? 'animate-spin' : ''}`} />刷新
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportStudents} className="text-xs sm:text-sm">
                      <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />导出
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => csvInputRef.current?.click()} className="text-xs sm:text-sm" disabled={importProgress.importing}>
                      <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />{importProgress.importing ? '导入中...' : '导入'}
                    </Button>
                    <input ref={csvInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportStudents} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {importProgress.importing && (
                  <div className="mb-4 space-y-2">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>正在导入学生数据...</span>
                      <span>{importProgress.current}/{importProgress.total}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-150"
                        style={{ width: `${Math.round((importProgress.current / importProgress.total) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 mb-4">
                  <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="搜索学生姓名..." value={studentFilters.name} onChange={(e) => { setStudentFilters({ ...studentFilters, name: e.target.value }); setStudentPage(1); }} className="pl-9 text-sm" />
                  </div>
                  <div className="grid grid-cols-3 sm:flex gap-2">
                    <Select value={studentFilters.class_id || 'all'} onValueChange={(v) => {
                      const selectedClass = allClasses.find(c => c.id === v);
                      setStudentFilters({ ...studentFilters, class_id: v === 'all' ? '' : v, class_name: selectedClass?.name || '' });
                      setStudentPage(1);
                    }}>
                      <SelectTrigger className="w-full sm:min-w-[140px] text-xs sm:text-sm whitespace-nowrap"><SelectValue placeholder="班级" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部班级</SelectItem>
                        {[...allClasses]
                          .sort((a, b) => {
                            const teacherA = a.profiles?.full_name || '';
                            const teacherB = b.profiles?.full_name || '';
                            if (teacherA !== teacherB) return teacherA.localeCompare(teacherB);
                            return a.name.localeCompare(b.name);
                          })
                          .map(c => (
                            <SelectItem key={c.id} value={c.id} className="whitespace-nowrap">
                              <div className="flex items-center gap-2 whitespace-nowrap">
                                {c.profiles?.full_name && (
                                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/10 text-[10px] font-medium text-primary">
                                    {c.profiles.full_name[0]}
                                  </span>
                                )}
                                <span className="truncate">{c.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Select value={studentFilters.sortBy} onValueChange={(v) => setStudentFilters({ ...studentFilters, sortBy: v as typeof studentFilters.sortBy })}>
                      <SelectTrigger className="w-full sm:w-[100px] text-xs sm:text-sm"><SelectValue placeholder="排序" /></SelectTrigger>
                      <SelectContent><SelectItem value="name">姓名</SelectItem><SelectItem value="remaining_hours">课时</SelectItem><SelectItem value="class_name">班级</SelectItem></SelectContent>
                    </Select>
                    <Select value={studentFilters.sortOrder} onValueChange={(v) => setStudentFilters({ ...studentFilters, sortOrder: v as 'asc' | 'desc' })}>
                      <SelectTrigger className="w-full sm:w-[80px] text-xs sm:text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="asc">升序</SelectItem><SelectItem value="desc">降序</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="rounded-lg border overflow-x-auto">
                  <Table>
                    <TableHeader><TableRow><TableHead className="whitespace-nowrap">学生姓名</TableHead><TableHead className="whitespace-nowrap">班级</TableHead><TableHead className="whitespace-nowrap hidden sm:table-cell">所学内容</TableHead><TableHead className="whitespace-nowrap">总课时</TableHead><TableHead className="whitespace-nowrap">剩余</TableHead><TableHead className="whitespace-nowrap">状态</TableHead><TableHead className="whitespace-nowrap">操作</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {paginatedStudents.length === 0 ? (
                        <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">暂无学生数据</TableCell></TableRow>
                      ) : paginatedStudents.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium text-sm whitespace-nowrap">{s.name}</TableCell>
                          <TableCell className="text-sm whitespace-nowrap">{s.class_name || '-'}</TableCell>
                          <TableCell className="text-sm whitespace-nowrap hidden sm:table-cell">{s.subject || '-'}</TableCell>
                          <TableCell className="text-sm">{s.total_hours}</TableCell>
                          <TableCell><Badge variant={s.remaining_hours <= s.alert_threshold ? 'destructive' : 'secondary'} className="text-xs">{s.remaining_hours}</Badge></TableCell>
                          <TableCell>{s.remaining_hours <= 0 ? <Badge variant="destructive" className="text-xs">欠费</Badge> : s.remaining_hours <= s.alert_threshold ? <Badge variant="outline" className="border-orange-400 text-orange-600 text-xs">续费</Badge> : <Badge variant="outline" className="border-green-400 text-green-600 text-xs">正常</Badge>}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" className="text-xs" onClick={() => openRenewal(s)}>
                              <Plus className="w-3 h-3 mr-1" />续费
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {totalStudentPages > 1 && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-4">
                    <p className="text-xs sm:text-sm text-muted-foreground">共 {filteredStudents.length} 位学生，第 {studentPage}/{totalStudentPages} 页</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={() => setStudentPage(p => Math.max(1, p - 1))} disabled={studentPage === 1}><ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />上一页</Button>
                      <Button variant="outline" size="sm" onClick={() => setStudentPage(p => Math.min(totalStudentPages, p + 1))} disabled={studentPage === totalStudentPages}>下一页<ChevronRight className="w-4 h-4" /></Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 学生管理 */}
          <TabsContent value="student-mgmt">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>学生管理</CardTitle>
                  <Dialog open={addStudentOpen} onOpenChange={setAddStudentOpen}>
                    <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-2" />录入学生</Button></DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>录入新学生</DialogTitle>
                        <DialogDescription className="sr-only">填写学生基本信息以录入系统</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div className="flex gap-4 mb-4">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={newStudent.photoUrl || ''} />
                            <AvatarFallback><User className="h-8 w-8" /></AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <Label>姓名</Label>
                            <Input placeholder="输入学生姓名" value={newStudent.name} onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>班级</Label>
                            <Select value={newStudent.classId || 'none'} onValueChange={(v) => {
                              const selectedClass = allClasses.find(c => c.id === v);
                              setNewStudent({ ...newStudent, classId: v === 'none' ? '' : v, className: selectedClass?.name || '' });
                            }}>
                              <SelectTrigger><SelectValue placeholder="选择班级" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">暂不选择</SelectItem>
                                {[...allClasses]
                                  .sort((a, b) => {
                                    const teacherA = a.profiles?.full_name || '';
                                    const teacherB = b.profiles?.full_name || '';
                                    if (teacherA !== teacherB) return teacherA.localeCompare(teacherB);
                                    return a.name.localeCompare(b.name);
                                  })
                                  .map(c => (
                                    <SelectItem key={c.id} value={c.id} className="whitespace-nowrap">
                                      <div className="flex items-center gap-2 whitespace-nowrap">
                                        {c.profiles?.full_name && (
                                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/10 text-[10px] font-medium text-primary">
                                            {c.profiles.full_name[0]}
                                          </span>
                                        )}
                                        <span className="truncate">{c.name}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2"><Label>所学内容</Label><Input placeholder="如：Python编程" value={newStudent.subject} onChange={(e) => setNewStudent({ ...newStudent, subject: e.target.value })} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2"><Label>总课时</Label><Input type="number" placeholder="0" value={newStudent.totalHours} onChange={(e) => setNewStudent({ ...newStudent, totalHours: e.target.value })} /></div>
                          <div className="space-y-2"><Label>剩余课时</Label><Input type="number" placeholder="默认等于总课时" value={newStudent.remainingHours} onChange={(e) => setNewStudent({ ...newStudent, remainingHours: e.target.value })} /></div>
                        </div>
                        <div className="space-y-2">
                          <Label>关联家长</Label>
                          <Select value={newStudent.parentId || 'none'} onValueChange={(v) => setNewStudent({ ...newStudent, parentId: v === 'none' ? '' : v })}>
                            <SelectTrigger><SelectValue placeholder="选择家长" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">暂不关联</SelectItem>
                              {allParents.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name} ({p.email})</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={handleAddStudent} className="w-full" disabled={submitting}>{submitting ? '提交中...' : '确认添加'}</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 mb-4">
                  <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="搜索学生姓名..." value={studentMgmtFilters.name} onChange={(e) => { setStudentMgmtFilters({ ...studentMgmtFilters, name: e.target.value }); setStudentMgmtPage(1); }} className="pl-9 text-sm" />
                  </div>
                  <div className="grid grid-cols-3 sm:flex gap-2">
                    <Select value={studentMgmtFilters.class_id || 'all'} onValueChange={(v) => {
                      const selectedClass = allClasses.find(c => c.id === v);
                      setStudentMgmtFilters({ ...studentMgmtFilters, class_id: v === 'all' ? '' : v, class_name: selectedClass?.name || '' });
                      setStudentMgmtPage(1);
                    }}>
                      <SelectTrigger className="w-full sm:min-w-[140px] text-xs sm:text-sm whitespace-nowrap"><SelectValue placeholder="班级" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部班级</SelectItem>
                        {[...allClasses]
                          .sort((a, b) => {
                            const teacherA = a.profiles?.full_name || '';
                            const teacherB = b.profiles?.full_name || '';
                            if (teacherA !== teacherB) return teacherA.localeCompare(teacherB);
                            return a.name.localeCompare(b.name);
                          })
                          .map(c => (
                            <SelectItem key={c.id} value={c.id} className="whitespace-nowrap">
                              <div className="flex items-center gap-2 whitespace-nowrap">
                                {c.profiles?.full_name && (
                                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/10 text-[10px] font-medium text-primary">
                                    {c.profiles.full_name[0]}
                                  </span>
                                )}
                                <span className="truncate">{c.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Select value={studentMgmtFilters.sortBy} onValueChange={(v) => setStudentMgmtFilters({ ...studentMgmtFilters, sortBy: v as typeof studentMgmtFilters.sortBy })}>
                      <SelectTrigger className="w-full sm:w-[100px] text-xs sm:text-sm"><SelectValue placeholder="排序" /></SelectTrigger>
                      <SelectContent><SelectItem value="name">姓名</SelectItem><SelectItem value="remaining_hours">课时</SelectItem><SelectItem value="class_name">班级</SelectItem></SelectContent>
                    </Select>
                    <Select value={studentMgmtFilters.sortOrder} onValueChange={(v) => setStudentMgmtFilters({ ...studentMgmtFilters, sortOrder: v as 'asc' | 'desc' })}>
                      <SelectTrigger className="w-full sm:w-[80px] text-xs sm:text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="asc">升序</SelectItem><SelectItem value="desc">降序</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader><TableRow><TableHead>照片</TableHead><TableHead>学生姓名</TableHead><TableHead>班级</TableHead><TableHead>所学内容</TableHead><TableHead>关联家长</TableHead><TableHead>操作</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {paginatedStudentsMgmt.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">暂无学生数据</TableCell></TableRow>
                      ) : paginatedStudentsMgmt.map((s) => (
                        <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openEditStudent(s)}>
                          <TableCell>
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={s.photo_url || ''} />
                              <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                            </Avatar>
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-1.5">
                              {s.name}
                              {s.status === 'leave' && <Badge variant="outline" className="text-[10px] px-1 py-0 border-yellow-400 text-yellow-600">请假</Badge>}
                              {s.status === 'inactive' && <Badge variant="outline" className="text-[10px] px-1 py-0 border-gray-400 text-gray-500">已退</Badge>}
                            </div>
                          </TableCell>
                          <TableCell>{s.class_name || '-'}</TableCell>
                          <TableCell>{s.subject || '-'}</TableCell>
                          <TableCell>{getParentName(s.parent_id)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEditStudent(s); }}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteStudent(s); }}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {totalStudentMgmtPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">共 {filteredStudentsMgmt.length} 位学生，第 {studentMgmtPage}/{totalStudentMgmtPages} 页</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setStudentMgmtPage(p => Math.max(1, p - 1))} disabled={studentMgmtPage === 1}><ChevronLeft className="w-4 h-4" />上一页</Button>
                      <Button variant="outline" size="sm" onClick={() => setStudentMgmtPage(p => Math.min(totalStudentMgmtPages, p + 1))} disabled={studentMgmtPage === totalStudentMgmtPages}>下一页<ChevronRight className="w-4 h-4" /></Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 编辑学生对话框 */}
            <Dialog open={editStudentOpen} onOpenChange={setEditStudentOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>编辑学生信息</DialogTitle>
                  <DialogDescription className="sr-only">修改学生基本信息及课时设置</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  {/* 学生照片 */}
                  <div className="flex flex-col items-center gap-3">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={editForm.photoUrl || ''} />
                      <AvatarFallback className="text-2xl"><User className="h-10 w-10" /></AvatarFallback>
                    </Avatar>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleUploadPhoto}
                    />
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto}>
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadingPhoto ? '上传中...' : '上传照片'}
                    </Button>
                  </div>

                  <div className="space-y-2"><Label>学生姓名 *</Label><Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>班级</Label>
                      <Select value={editForm.classId || 'none'} onValueChange={(v) => {
                        const selectedClass = allClasses.find(c => c.id === v);
                        setEditForm({ ...editForm, classId: v === 'none' ? '' : v, className: selectedClass?.name || '' });
                      }}>
                        <SelectTrigger><SelectValue placeholder="选择班级" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">暂不选择</SelectItem>
                          {[...allClasses]
                            .sort((a, b) => {
                              const teacherA = a.profiles?.full_name || '';
                              const teacherB = b.profiles?.full_name || '';
                              if (teacherA !== teacherB) return teacherA.localeCompare(teacherB);
                              return a.name.localeCompare(b.name);
                            })
                            .map(c => (
                              <SelectItem key={c.id} value={c.id} className="whitespace-nowrap">
                                <div className="flex items-center gap-2 whitespace-nowrap">
                                  {c.profiles?.full_name && (
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/10 text-[10px] font-medium text-primary">
                                      {c.profiles.full_name[0]}
                                    </span>
                                  )}
                                  <span className="truncate">{c.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>所学内容</Label><Input placeholder="如：Python编程" value={editForm.subject} onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>总课时</Label><Input type="number" value={editForm.totalHours} onChange={(e) => setEditForm({ ...editForm, totalHours: e.target.value })} /></div>
                    <div className="space-y-2"><Label>剩余课时</Label><Input type="number" step="0.5" value={editForm.remainingHours} onChange={(e) => setEditForm({ ...editForm, remainingHours: e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>续费预警阈值</Label><Input type="number" value={editForm.alertThreshold} onChange={(e) => setEditForm({ ...editForm, alertThreshold: e.target.value })} /></div>
                    <div className="space-y-2">
                      <Label>学生状态</Label>
                      <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">在读</SelectItem>
                          <SelectItem value="leave">长期请假</SelectItem>
                          <SelectItem value="inactive">已退出</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>关联家长</Label>
                    <Select value={editForm.parentId || 'none'} onValueChange={(v) => setEditForm({ ...editForm, parentId: v === 'none' ? '' : v })}>
                      <SelectTrigger><SelectValue placeholder="选择家长" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">暂不关联</SelectItem>
                        {allParents.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name} ({p.email})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleSaveStudent} className="w-full" disabled={submitting}>{submitting ? '保存中...' : '保存修改'}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* 签到记录 */}
          <TabsContent value="records">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <CardTitle className="text-base sm:text-lg">签到记录</CardTitle>
                  <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="text-xs sm:text-sm"><RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${refreshing ? 'animate-spin' : ''}`} />刷新</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 mb-4">
                  <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="搜索学生姓名..." value={recordSearch} onChange={(e) => { setRecordSearch(e.target.value); setRecordPage(1); }} className="pl-9 text-sm" />
                  </div>
                </div>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader><TableRow><TableHead>学生姓名</TableHead><TableHead>班级</TableHead><TableHead>签到时间</TableHead><TableHead>消耗课时</TableHead><TableHead>教师</TableHead><TableHead>照片</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {recordsLoading ? <TableRow><TableCell colSpan={6} className="text-center py-8">加载中...</TableCell></TableRow> :
                        records.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">暂无签到记录</TableCell></TableRow> :
                          records.map((r) => (
                            <TableRow key={r.id}>
                              <TableCell className="font-medium">{r.students.name}</TableCell>
                              <TableCell>{r.students.class_name || '-'}</TableCell>
                              <TableCell>{format(new Date(r.class_date), 'MM/dd HH:mm', { locale: zhCN })}</TableCell>
                              <TableCell>{r.hours_consumed}</TableCell>
                              <TableCell>{r.profiles.full_name}</TableCell>
                              <TableCell>{r.photo_url ? <a href={r.photo_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">查看</a> : '-'}</TableCell>
                            </TableRow>
                          ))}
                    </TableBody>
                  </Table>
                </div>
                {totalRecordPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">共 {totalRecords} 条记录，第 {recordPage}/{totalRecordPages} 页</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setRecordPage(p => Math.max(1, p - 1))} disabled={recordPage === 1}><ChevronLeft className="w-4 h-4" />上一页</Button>
                      <Button variant="outline" size="sm" onClick={() => setRecordPage(p => Math.min(totalRecordPages, p + 1))} disabled={recordPage === totalRecordPages}>下一页<ChevronRight className="w-4 h-4" /></Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 教师管理 */}
          <TabsContent value="teachers">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>教师列表</CardTitle>
                  <Dialog open={addTeacherOpen} onOpenChange={setAddTeacherOpen}>
                    <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-2" />添加教师</Button></DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>添加教师账号</DialogTitle>
                        <DialogDescription className="sr-only">创建新的教师账号</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div className="space-y-2"><Label>教师姓名 *</Label><Input placeholder="请输入教师姓名" value={newTeacher.fullName} onChange={(e) => setNewTeacher({ ...newTeacher, fullName: e.target.value })} /></div>
                        <div className="space-y-2"><Label>邮箱（登录账号） *</Label><Input type="email" placeholder="请输入邮箱" value={newTeacher.email} onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })} /></div>
                        <div className="space-y-2"><Label>初始密码 *</Label><Input type="text" placeholder="至少6位" value={newTeacher.password} onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })} /></div>
                        <Button onClick={handleAddTeacher} className="w-full" disabled={submitting}>{submitting ? '创建中...' : '创建教师账号'}</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader><TableRow><TableHead>教师姓名</TableHead><TableHead>邮箱</TableHead><TableHead>操作</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {allTeachers.length === 0 ? <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">暂无教师</TableCell></TableRow> :
                        allTeachers.map((t) => (
                          <TableRow key={t.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openEditTeacher(t)}>
                            <TableCell className="font-medium">{t.full_name}</TableCell>
                            <TableCell>{t.email}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEditTeacher(t); }}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* 编辑教师对话框 */}
            <Dialog open={editTeacherOpen} onOpenChange={setEditTeacherOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>编辑教师信息</DialogTitle>
                  <DialogDescription className="sr-only">修改教师基本信息</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2"><Label>教师姓名 *</Label><Input value={editTeacherForm.fullName} onChange={(e) => setEditTeacherForm({ ...editTeacherForm, fullName: e.target.value })} /></div>
                  <div className="space-y-2"><Label>邮箱 *</Label><Input type="email" value={editTeacherForm.email} onChange={(e) => setEditTeacherForm({ ...editTeacherForm, email: e.target.value })} /></div>
                  <div className="space-y-2"><Label>新密码（不修改请留空）</Label><Input type="password" value={editTeacherForm.password} onChange={(e) => setEditTeacherForm({ ...editTeacherForm, password: e.target.value })} placeholder="留空则不修改密码" /></div>
                  <Button onClick={handleSaveTeacher} className="w-full" disabled={submitting}>{submitting ? '保存中...' : '保存修改'}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* 班级管理 */}
          <TabsContent value="classes">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>班级列表</CardTitle>
                  <Dialog open={addClassOpen} onOpenChange={setAddClassOpen}>
                    <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-2" />添加班级</Button></DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>添加班级</DialogTitle>
                        <DialogDescription className="sr-only">创建新的班级并设置课时</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div className="space-y-2"><Label>班级名称 *</Label><Input placeholder="如：周六上午班" value={newClass.name} onChange={(e) => setNewClass({ ...newClass, name: e.target.value })} /></div>
                        <div className="space-y-2"><Label>班级描述</Label><Input placeholder="简要描述" value={newClass.description} onChange={(e) => setNewClass({ ...newClass, description: e.target.value })} /></div>
                        <div className="space-y-2"><Label>上课时间</Label><Input placeholder="如：每周六 9:00-11:00" value={newClass.schedule} onChange={(e) => setNewClass({ ...newClass, schedule: e.target.value })} /></div>
                        <div className="space-y-2"><Label>单次课时消耗</Label><Input type="number" step="0.5" placeholder="默认 1.0" value={newClass.defaultHours} onChange={(e) => setNewClass({ ...newClass, defaultHours: e.target.value })} /></div>
                        <div className="space-y-2">
                          <Label>关联教师</Label>
                          <Select value={newClass.teacherId || 'none'} onValueChange={(v) => setNewClass({ ...newClass, teacherId: v === 'none' ? '' : v })}>
                            <SelectTrigger><SelectValue placeholder="选择教师" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">暂不关联</SelectItem>
                              {allTeachers.map(t => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={handleAddClass} className="w-full" disabled={submitting}>{submitting ? '创建中...' : '创建班级'}</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader><TableRow><TableHead>班级名称</TableHead><TableHead>描述</TableHead><TableHead>上课时间</TableHead><TableHead>课时/次</TableHead><TableHead>授课教师</TableHead><TableHead>操作</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {allClasses.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">暂无班级</TableCell></TableRow> :
                        allClasses.map((c) => (
                          <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openEditClass(c)}>
                            <TableCell className="font-medium">{c.name}</TableCell>
                            <TableCell>{c.description || '-'}</TableCell>
                            <TableCell>{c.schedule || '-'}</TableCell>
                            <TableCell>{c.default_hours || 1.0}</TableCell>
                            <TableCell>{c.profiles?.full_name || <span className="text-muted-foreground">未分配</span>}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEditClass(c); }}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* 编辑班级对话框 */}
            <Dialog open={editClassOpen} onOpenChange={setEditClassOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>编辑班级信息</DialogTitle>
                  <DialogDescription className="sr-only">修改班级基本信息及配置</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2"><Label>班级名称 *</Label><Input value={editClassForm.name} onChange={(e) => setEditClassForm({ ...editClassForm, name: e.target.value })} /></div>
                  <div className="space-y-2"><Label>班级描述</Label><Input value={editClassForm.description} onChange={(e) => setEditClassForm({ ...editClassForm, description: e.target.value })} /></div>
                  <div className="space-y-2"><Label>上课时间</Label><Input value={editClassForm.schedule} onChange={(e) => setEditClassForm({ ...editClassForm, schedule: e.target.value })} /></div>
                  <div className="space-y-2"><Label>单次课时消耗</Label><Input type="number" step="0.5" value={editClassForm.defaultHours} onChange={(e) => setEditClassForm({ ...editClassForm, defaultHours: e.target.value })} /></div>
                  <div className="space-y-2">
                    <Label>关联教师</Label>
                    <Select value={editClassForm.teacherId || 'none'} onValueChange={(v) => setEditClassForm({ ...editClassForm, teacherId: v === 'none' ? '' : v })}>
                      <SelectTrigger><SelectValue placeholder="选择教师" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">暂不关联</SelectItem>
                        {allTeachers.map(t => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleSaveClass} className="w-full" disabled={submitting}>{submitting ? '保存中...' : '保存修改'}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* 试听申请 */}
          <TabsContent value="trials">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>试听申请列表</CardTitle>
                  <div className="flex gap-2">
                    <Select value={trialFilter} onValueChange={(v) => { setTrialFilter(v); setTrialPage(1); }}>
                      <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部</SelectItem>
                        <SelectItem value="pending">待处理</SelectItem>
                        <SelectItem value="contacted">已联系</SelectItem>
                        <SelectItem value="completed">已完成</SelectItem>
                        <SelectItem value="cancelled">已取消</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                      <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />刷新
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>孩子姓名</TableHead>
                        <TableHead>申请课程</TableHead>
                        <TableHead>联系电话</TableHead>
                        <TableHead>申请时间</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trialApplications.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">暂无试听申请</TableCell></TableRow>
                      ) : trialApplications.map((app) => (
                        <TableRow key={app.id}>
                          <TableCell className="font-medium">{app.child_name}</TableCell>
                          <TableCell>{app.course_type}</TableCell>
                          <TableCell>{app.phone}</TableCell>
                          <TableCell>{format(new Date(app.created_at), 'MM/dd HH:mm', { locale: zhCN })}</TableCell>
                          <TableCell>
                            {app.status === 'pending' && <Badge variant="outline" className="border-yellow-400 text-yellow-600">待处理</Badge>}
                            {app.status === 'contacted' && <Badge variant="outline" className="border-blue-400 text-blue-600">已联系</Badge>}
                            {app.status === 'completed' && <Badge variant="outline" className="border-green-400 text-green-600">已完成</Badge>}
                            {app.status === 'cancelled' && <Badge variant="outline" className="border-gray-400 text-gray-600">已取消</Badge>}
                          </TableCell>
                          <TableCell>
                            <Select value={app.status} onValueChange={(v) => handleUpdateTrialStatus(app.id, v)}>
                              <SelectTrigger className="w-[100px] h-8"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">待处理</SelectItem>
                                <SelectItem value="contacted">已联系</SelectItem>
                                <SelectItem value="completed">已完成</SelectItem>
                                <SelectItem value="cancelled">已取消</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {totalTrialPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">共 {totalTrialApplications} 条申请，第 {trialPage}/{totalTrialPages} 页</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setTrialPage(p => Math.max(1, p - 1))} disabled={trialPage === 1}><ChevronLeft className="w-4 h-4" />上一页</Button>
                      <Button variant="outline" size="sm" onClick={() => setTrialPage(p => Math.min(totalTrialPages, p + 1))} disabled={trialPage === totalTrialPages}>下一页<ChevronRight className="w-4 h-4" /></Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 官网内容管理 */}
          <TabsContent value="website-content">
            <WebsiteContentManager />
          </TabsContent>
        </Tabs>

        {/* 续费对话框 */}
        <Dialog open={renewalOpen} onOpenChange={setRenewalOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>学生续费</DialogTitle>
              <DialogDescription className="sr-only">为学生添加新的课时</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-1">
                <Label>学生姓名</Label>
                <p className="text-sm font-medium">{renewalStudent?.name}</p>
              </div>
              <div className="space-y-1">
                <Label>当前剩余课时</Label>
                <p className="text-sm font-medium">{renewalStudent?.remaining_hours}</p>
              </div>
              <div className="space-y-2">
                <Label>新增课时 *</Label>
                <Input type="number" step="0.5" min="0" placeholder="请输入新增课时数" value={renewalForm.hoursToAdd} onChange={(e) => setRenewalForm({ ...renewalForm, hoursToAdd: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>备注</Label>
                <Input placeholder="可选，如付款方式等" value={renewalForm.notes} onChange={(e) => setRenewalForm({ ...renewalForm, notes: e.target.value })} />
              </div>
              <Button onClick={handleRenewal} className="w-full" disabled={submitting}>{submitting ? '提交中...' : '确认续费'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
