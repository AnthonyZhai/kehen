import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Upload, Rocket, Trophy, Smile, Code, Brain, Settings, Layout, Monitor, BookOpen } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface PublicCourse {
  id: string;
  name: string;
  age: string;
  description: string;
  icon_name: string;
  color_class: string;
  border_class: string;
  shadow_class: string;
  btn_class: string;
}

interface PublicAward {
  id: string;
  student_name: string;
  school: string;
  match_name: string;
  award_name: string;
}

interface PublicTeacher {
  id: string;
  name: string;
  title: string;
  description: string;
  image_url: string;
}

const COLOR_THEMES = [
  {
    label: '活力橙 (Orange)',
    value: 'orange',
    classes: {
      color_class: 'bg-orange-100 text-orange-600',
      border_class: 'border-orange-200',
      shadow_class: 'hover:shadow-orange-200',
      btn_class: 'bg-orange-500 hover:bg-orange-600'
    }
  },
  {
    label: '清新绿 (Green)',
    value: 'green',
    classes: {
      color_class: 'bg-green-100 text-green-600',
      border_class: 'border-green-200',
      shadow_class: 'hover:shadow-green-200',
      btn_class: 'bg-green-500 hover:bg-green-600'
    }
  },
  {
    label: '科技蓝 (Blue)',
    value: 'blue',
    classes: {
      color_class: 'bg-blue-100 text-blue-600',
      border_class: 'border-blue-200',
      shadow_class: 'hover:shadow-blue-200',
      btn_class: 'bg-blue-500 hover:bg-blue-600'
    }
  },
  {
    label: '梦幻紫 (Purple)',
    value: 'purple',
    classes: {
      color_class: 'bg-purple-100 text-purple-600',
      border_class: 'border-purple-200',
      shadow_class: 'hover:shadow-purple-200',
      btn_class: 'bg-purple-500 hover:bg-purple-600'
    }
  },
  {
    label: '阳光黄 (Yellow)',
    value: 'yellow',
    classes: {
      color_class: 'bg-yellow-100 text-yellow-600',
      border_class: 'border-yellow-200',
      shadow_class: 'hover:shadow-yellow-200',
      btn_class: 'bg-yellow-500 hover:bg-yellow-600'
    }
  },
  {
    label: '热情红 (Red)',
    value: 'red',
    classes: {
      color_class: 'bg-red-100 text-red-600',
      border_class: 'border-red-200',
      shadow_class: 'hover:shadow-red-200',
      btn_class: 'bg-red-500 hover:bg-red-600'
    }
  },
  {
    label: '甜美粉 (Pink)',
    value: 'pink',
    classes: {
      color_class: 'bg-pink-100 text-pink-600',
      border_class: 'border-pink-200',
      shadow_class: 'hover:shadow-pink-200',
      btn_class: 'bg-pink-500 hover:bg-pink-600'
    }
  },
  {
    label: '极光青 (Cyan)',
    value: 'cyan',
    classes: {
      color_class: 'bg-cyan-100 text-cyan-600',
      border_class: 'border-cyan-200',
      shadow_class: 'hover:shadow-cyan-200',
      btn_class: 'bg-cyan-500 hover:bg-cyan-600'
    }
  },
  {
    label: '深邃灰 (Slate)',
    value: 'slate',
    classes: {
      color_class: 'bg-slate-100 text-slate-600',
      border_class: 'border-slate-200',
      shadow_class: 'hover:shadow-slate-200',
      btn_class: 'bg-slate-500 hover:bg-slate-600'
    }
  }
];

const GLOBAL_THEMES = [
  { id: 'playful', name: '童趣乐园 (默认)', desc: '活泼鲜艳，圆润亲和，适合低龄儿童', icon: Smile, color: 'bg-orange-100' },
  { id: 'tech', name: '未来科技', desc: '深色背景，霓虹光效，硬朗线条', icon: Monitor, color: 'bg-slate-900 text-white' },
  { id: 'minimal', name: '清新简约', desc: '极简留白，低饱和度，优雅大方', icon: Layout, color: 'bg-gray-50' },
  { id: 'classic', name: '经典学院', desc: '沉稳配色，书卷气息，传统严谨', icon: BookOpen, color: 'bg-[#f5f5dc]' },
];

export default function WebsiteContentManager() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('courses');
  
  // Global Theme State
  const [currentGlobalTheme, setCurrentGlobalTheme] = useState('playful');
  const [savingTheme, setSavingTheme] = useState(false);

  // Fetch Global Theme
  useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('public_site_settings').select('value').eq('key', 'website_theme').single();
      if (data) {
        setCurrentGlobalTheme(data.value);
      }
      return data;
    },
  });

  const handleSaveGlobalTheme = async (themeId: string) => {
    setSavingTheme(true);
    setCurrentGlobalTheme(themeId);
    localStorage.setItem('website_theme', themeId); // Save locally immediately
    
    try {
      const { error } = await supabase.from('public_site_settings').upsert({ key: 'website_theme', value: themeId });
      if (error) throw error;
      toast.success('全局主题已更新');
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
    } catch (error: any) {
      console.error('Theme update error:', error);
      toast.success('全局主题已更新 (本地缓存)');
    } finally {
      setSavingTheme(false);
    }
  };
  const [isAddCourseOpen, setAddCourseOpen] = useState(false);
  const [isEditCourseOpen, setEditCourseOpen] = useState(false);
  const [currentCourse, setCurrentCourse] = useState<PublicCourse | null>(null);
  const [courseForm, setCourseForm] = useState<Partial<PublicCourse>>({
    name: '', age: '', description: '', icon_name: 'Code', 
    color_class: 'bg-blue-100 text-blue-600', border_class: 'border-blue-200', 
    shadow_class: 'hover:shadow-blue-200', btn_class: 'bg-blue-500 hover:bg-blue-600'
  });
  const [selectedTheme, setSelectedTheme] = useState('blue');
  const [selectedIcon, setSelectedIcon] = useState('Code');

  const handleThemeChange = (themeValue: string) => {
    setSelectedTheme(themeValue);
    const theme = COLOR_THEMES.find(t => t.value === themeValue);
    if (theme) {
      setCourseForm(prev => ({
        ...prev,
        ...theme.classes
      }));
    }
  };

  const openAddCourse = () => {
    setCourseForm({
      name: '', age: '', description: '', icon_name: 'Code', 
      ...COLOR_THEMES.find(t => t.value === 'blue')?.classes
    });
    setSelectedTheme('blue');
    setSelectedIcon('Code');
    setAddCourseOpen(true);
  };

  const openEditCourse = (course: PublicCourse) => {
    setCurrentCourse(course);
    setCourseForm(course);
    // Try to detect theme from classes, defaulting to blue if not matched
    const foundTheme = COLOR_THEMES.find(t => t.classes.color_class === course.color_class);
    setSelectedTheme(foundTheme ? foundTheme.value : 'custom');
    setSelectedIcon(course.icon_name || 'Code');
    setEditCourseOpen(true);
  };

  // States for Awards
  const [isAddAwardOpen, setAddAwardOpen] = useState(false);
  const [isEditAwardOpen, setEditAwardOpen] = useState(false);
  const [currentAward, setCurrentAward] = useState<PublicAward | null>(null);
  const [awardForm, setAwardForm] = useState<Partial<PublicAward>>({
    student_name: '', school: '', match_name: '', award_name: ''
  });

  // States for Teachers
  const [isAddTeacherOpen, setAddTeacherOpen] = useState(false);
  const [isEditTeacherOpen, setEditTeacherOpen] = useState(false);
  const [currentTeacher, setCurrentTeacher] = useState<PublicTeacher | null>(null);
  const [teacherForm, setTeacherForm] = useState<Partial<PublicTeacher>>({
    name: '', title: '', description: '', image_url: ''
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const { data: courses = [] } = useQuery({
    queryKey: ['public-courses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('public_courses').select('*').order('sort_order', { ascending: true });
      if (error) throw error;
      return data as PublicCourse[];
    },
  });

  const { data: awards = [] } = useQuery({
    queryKey: ['public-awards'],
    queryFn: async () => {
      const { data, error } = await supabase.from('public_awards').select('*').order('sort_order', { ascending: true });
      if (error) throw error;
      return data as PublicAward[];
    },
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['public-teachers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('public_teachers').select('*').order('sort_order', { ascending: true });
      if (error) throw error;
      return data as PublicTeacher[];
    },
  });

  // Course Handlers
  const handleSaveCourse = async (isEdit: boolean) => {
    try {
      if (isEdit && currentCourse) {
        const { error } = await supabase.from('public_courses').update(courseForm).eq('id', currentCourse.id);
        if (error) throw error;
        toast.success('课程更新成功');
      } else {
        const { error } = await supabase.from('public_courses').insert([courseForm]);
        if (error) throw error;
        toast.success('课程添加成功');
      }
      setAddCourseOpen(false);
      setEditCourseOpen(false);
      queryClient.invalidateQueries({ queryKey: ['public-courses'] });
    } catch (error) {
      toast.error('操作失败');
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm('确定要删除吗？')) return;
    try {
      const { error } = await supabase.from('public_courses').delete().eq('id', id);
      if (error) throw error;
      toast.success('删除成功');
      queryClient.invalidateQueries({ queryKey: ['public-courses'] });
    } catch (error) {
      toast.error('删除失败');
    }
  };

  // Award Handlers
  const handleSaveAward = async (isEdit: boolean) => {
    try {
      if (isEdit && currentAward) {
        const { error } = await supabase.from('public_awards').update(awardForm).eq('id', currentAward.id);
        if (error) throw error;
        toast.success('荣誉更新成功');
      } else {
        const { error } = await supabase.from('public_awards').insert([awardForm]);
        if (error) throw error;
        toast.success('荣誉添加成功');
      }
      setAddAwardOpen(false);
      setEditAwardOpen(false);
      queryClient.invalidateQueries({ queryKey: ['public-awards'] });
    } catch (error) {
      toast.error('操作失败');
    }
  };

  const handleDeleteAward = async (id: string) => {
    if (!confirm('确定要删除吗？')) return;
    try {
      const { error } = await supabase.from('public_awards').delete().eq('id', id);
      if (error) throw error;
      toast.success('删除成功');
      queryClient.invalidateQueries({ queryKey: ['public-awards'] });
    } catch (error) {
      toast.error('删除失败');
    }
  };

  // Teacher Handlers
  const handleSaveTeacher = async (isEdit: boolean) => {
    try {
      if (isEdit && currentTeacher) {
        const { error } = await supabase.from('public_teachers').update(teacherForm).eq('id', currentTeacher.id);
        if (error) throw error;
        toast.success('导师更新成功');
      } else {
        const { error } = await supabase.from('public_teachers').insert([teacherForm]);
        if (error) throw error;
        toast.success('导师添加成功');
      }
      setAddTeacherOpen(false);
      setEditTeacherOpen(false);
      queryClient.invalidateQueries({ queryKey: ['public-teachers'] });
    } catch (error) {
      toast.error('操作失败');
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    if (!confirm('确定要删除吗？')) return;
    try {
      const { error } = await supabase.from('public_teachers').delete().eq('id', id);
      if (error) throw error;
      toast.success('删除成功');
      queryClient.invalidateQueries({ queryKey: ['public-teachers'] });
    } catch (error) {
      toast.error('删除失败');
    }
  };

  const handleUploadTeacherPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `teacher_${Date.now()}.${fileExt}`;
      const filePath = `public_assets/${fileName}`; // Assuming a public bucket or folder

      const { error: uploadError } = await supabase.storage
        .from('class_photos') // Reusing existing bucket for now
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('class_photos')
        .getPublicUrl(filePath);

      setTeacherForm({ ...teacherForm, image_url: publicUrl });
      toast.success('照片上传成功');
    } catch (error) {
      toast.error('照片上传失败');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>官网内容管理</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 w-full h-auto flex-wrap gap-2 justify-start sm:justify-center p-1">
            <TabsTrigger value="courses" className="text-base px-4 py-2 flex-grow sm:flex-grow-0"><Rocket className="w-4 h-4 mr-2" />课程乐园</TabsTrigger>
            <TabsTrigger value="awards" className="text-base px-4 py-2 flex-grow sm:flex-grow-0"><Trophy className="w-4 h-4 mr-2" />小小发明家</TabsTrigger>
            <TabsTrigger value="teachers" className="text-base px-4 py-2 flex-grow sm:flex-grow-0"><Smile className="w-4 h-4 mr-2" />明星导师</TabsTrigger>
            <TabsTrigger value="settings" className="text-base px-4 py-2 flex-grow sm:flex-grow-0"><Settings className="w-4 h-4 mr-2" />全局设置</TabsTrigger>
          </TabsList>

          {/* Courses Tab */}
          <TabsContent value="courses">
            <div className="flex justify-end mb-4">
              <Dialog open={isAddCourseOpen} onOpenChange={setAddCourseOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openAddCourse}>
                    <Plus className="w-4 h-4 mr-2" />添加课程
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>添加课程</DialogTitle>
                    <DialogDescription className="sr-only">添加新的课程到官网展示</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2"><Label>课程名称</Label><Input value={courseForm.name} onChange={e => setCourseForm({...courseForm, name: e.target.value})} /></div>
                    <div className="space-y-2"><Label>适合年龄</Label><Input value={courseForm.age} onChange={e => setCourseForm({...courseForm, age: e.target.value})} /></div>
                    <div className="space-y-2"><Label>描述</Label><Input value={courseForm.description} onChange={e => setCourseForm({...courseForm, description: e.target.value})} /></div>
                    
                    <div className="space-y-2">
                      <Label>图标</Label>
                      <Select value={selectedIcon} onValueChange={(v) => { setSelectedIcon(v); setCourseForm({ ...courseForm, icon_name: v }); }}>
                        <SelectTrigger><SelectValue placeholder="选择图标" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Smile"><div className="flex items-center"><Smile className="w-4 h-4 mr-2" />笑脸 (Smile)</div></SelectItem>
                          <SelectItem value="Code"><div className="flex items-center"><Code className="w-4 h-4 mr-2" />代码 (Code)</div></SelectItem>
                          <SelectItem value="Trophy"><div className="flex items-center"><Trophy className="w-4 h-4 mr-2" />奖杯 (Trophy)</div></SelectItem>
                          <SelectItem value="Brain"><div className="flex items-center"><Brain className="w-4 h-4 mr-2" />大脑 (Brain)</div></SelectItem>
                          <SelectItem value="Rocket"><div className="flex items-center"><Rocket className="w-4 h-4 mr-2" />火箭 (Rocket)</div></SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>颜色主题</Label>
                      <Select value={selectedTheme} onValueChange={handleThemeChange}>
                        <SelectTrigger><SelectValue placeholder="选择颜色主题" /></SelectTrigger>
                        <SelectContent>
                          {COLOR_THEMES.map(theme => (
                            <SelectItem key={theme.value} value={theme.value}>
                              <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded-full ${theme.classes.color_class.split(' ')[0]}`}></div>
                                {theme.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={() => handleSaveCourse(false)}>保存</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Table>
              <TableHeader><TableRow><TableHead>名称</TableHead><TableHead>年龄</TableHead><TableHead>描述</TableHead><TableHead>操作</TableHead></TableRow></TableHeader>
              <TableBody>
                {courses.map(course => (
                  <TableRow key={course.id}>
                    <TableCell>{course.name}</TableCell>
                    <TableCell>{course.age}</TableCell>
                    <TableCell>{course.description}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditCourse(course)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteCourse(course.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            <Dialog open={isEditCourseOpen} onOpenChange={setEditCourseOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>编辑课程</DialogTitle>
                  <DialogDescription className="sr-only">修改课程信息</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2"><Label>课程名称</Label><Input value={courseForm.name} onChange={e => setCourseForm({...courseForm, name: e.target.value})} /></div>
                  <div className="space-y-2"><Label>适合年龄</Label><Input value={courseForm.age} onChange={e => setCourseForm({...courseForm, age: e.target.value})} /></div>
                  <div className="space-y-2"><Label>描述</Label><Input value={courseForm.description} onChange={e => setCourseForm({...courseForm, description: e.target.value})} /></div>
                  
                  <div className="space-y-2">
                    <Label>图标</Label>
                    <Select value={selectedIcon} onValueChange={(v) => { setSelectedIcon(v); setCourseForm({ ...courseForm, icon_name: v }); }}>
                      <SelectTrigger><SelectValue placeholder="选择图标" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Smile"><div className="flex items-center"><Smile className="w-4 h-4 mr-2" />笑脸 (Smile)</div></SelectItem>
                        <SelectItem value="Code"><div className="flex items-center"><Code className="w-4 h-4 mr-2" />代码 (Code)</div></SelectItem>
                        <SelectItem value="Trophy"><div className="flex items-center"><Trophy className="w-4 h-4 mr-2" />奖杯 (Trophy)</div></SelectItem>
                        <SelectItem value="Brain"><div className="flex items-center"><Brain className="w-4 h-4 mr-2" />大脑 (Brain)</div></SelectItem>
                        <SelectItem value="Rocket"><div className="flex items-center"><Rocket className="w-4 h-4 mr-2" />火箭 (Rocket)</div></SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>颜色主题</Label>
                    <Select value={selectedTheme} onValueChange={handleThemeChange}>
                      <SelectTrigger><SelectValue placeholder="选择颜色主题" /></SelectTrigger>
                      <SelectContent>
                        {COLOR_THEMES.map(theme => (
                          <SelectItem key={theme.value} value={theme.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded-full ${theme.classes.color_class.split(' ')[0]}`}></div>
                              {theme.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={() => handleSaveCourse(true)}>保存修改</Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Awards Tab */}
          <TabsContent value="awards">
            <div className="flex justify-end mb-4">
              <Dialog open={isAddAwardOpen} onOpenChange={setAddAwardOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setAwardForm({})}><Plus className="w-4 h-4 mr-2" />添加荣誉</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>添加荣誉</DialogTitle>
                    <DialogDescription className="sr-only">记录学生获奖信息</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2"><Label>学生姓名</Label><Input value={awardForm.student_name} onChange={e => setAwardForm({...awardForm, student_name: e.target.value})} /></div>
                    <div className="space-y-2"><Label>学校</Label><Input value={awardForm.school} onChange={e => setAwardForm({...awardForm, school: e.target.value})} /></div>
                    <div className="space-y-2"><Label>比赛名称</Label><Input value={awardForm.match_name} onChange={e => setAwardForm({...awardForm, match_name: e.target.value})} /></div>
                    <div className="space-y-2"><Label>奖项</Label><Input value={awardForm.award_name} onChange={e => setAwardForm({...awardForm, award_name: e.target.value})} /></div>
                    <Button onClick={() => handleSaveAward(false)}>保存</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Table>
              <TableHeader><TableRow><TableHead>学生</TableHead><TableHead>学校</TableHead><TableHead>比赛</TableHead><TableHead>奖项</TableHead><TableHead>操作</TableHead></TableRow></TableHeader>
              <TableBody>
                {awards.map(award => (
                  <TableRow key={award.id}>
                    <TableCell>{award.student_name}</TableCell>
                    <TableCell>{award.school}</TableCell>
                    <TableCell>{award.match_name}</TableCell>
                    <TableCell>{award.award_name}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => { setCurrentAward(award); setAwardForm(award); setEditAwardOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteAward(award.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Dialog open={isEditAwardOpen} onOpenChange={setEditAwardOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>编辑荣誉</DialogTitle>
                  <DialogDescription className="sr-only">修改获奖信息</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2"><Label>学生姓名</Label><Input value={awardForm.student_name} onChange={e => setAwardForm({...awardForm, student_name: e.target.value})} /></div>
                  <div className="space-y-2"><Label>学校</Label><Input value={awardForm.school} onChange={e => setAwardForm({...awardForm, school: e.target.value})} /></div>
                  <div className="space-y-2"><Label>比赛名称</Label><Input value={awardForm.match_name} onChange={e => setAwardForm({...awardForm, match_name: e.target.value})} /></div>
                  <div className="space-y-2"><Label>奖项</Label><Input value={awardForm.award_name} onChange={e => setAwardForm({...awardForm, award_name: e.target.value})} /></div>
                  <Button onClick={() => handleSaveAward(true)}>保存修改</Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Teachers Tab */}
          <TabsContent value="teachers">
            <div className="flex justify-end mb-4">
              <Dialog open={isAddTeacherOpen} onOpenChange={setAddTeacherOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setTeacherForm({})}><Plus className="w-4 h-4 mr-2" />添加导师</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>添加导师</DialogTitle>
                    <DialogDescription className="sr-only">添加明星导师信息</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex flex-col items-center gap-3">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={teacherForm.image_url || ''} />
                        <AvatarFallback>图</AvatarFallback>
                      </Avatar>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadTeacherPhoto} />
                      <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto}>
                        <Upload className="w-4 h-4 mr-2" />上传照片
                      </Button>
                    </div>
                    <div className="space-y-2"><Label>姓名</Label><Input value={teacherForm.name} onChange={e => setTeacherForm({...teacherForm, name: e.target.value})} /></div>
                    <div className="space-y-2"><Label>头衔</Label><Input value={teacherForm.title} onChange={e => setTeacherForm({...teacherForm, title: e.target.value})} /></div>
                    <div className="space-y-2"><Label>简介</Label><Input value={teacherForm.description} onChange={e => setTeacherForm({...teacherForm, description: e.target.value})} /></div>
                    <Button onClick={() => handleSaveTeacher(false)}>保存</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Table>
              <TableHeader><TableRow><TableHead>照片</TableHead><TableHead>姓名</TableHead><TableHead>头衔</TableHead><TableHead>简介</TableHead><TableHead>操作</TableHead></TableRow></TableHeader>
              <TableBody>
                {teachers.map(teacher => (
                  <TableRow key={teacher.id}>
                    <TableCell><Avatar><AvatarImage src={teacher.image_url} /></Avatar></TableCell>
                    <TableCell>{teacher.name}</TableCell>
                    <TableCell>{teacher.title}</TableCell>
                    <TableCell className="max-w-xs truncate">{teacher.description}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => { setCurrentTeacher(teacher); setTeacherForm(teacher); setEditTeacherOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteTeacher(teacher.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Dialog open={isEditTeacherOpen} onOpenChange={setEditTeacherOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>编辑导师</DialogTitle>
                  <DialogDescription className="sr-only">修改导师信息</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex flex-col items-center gap-3">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={teacherForm.image_url || ''} />
                      <AvatarFallback>图</AvatarFallback>
                    </Avatar>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadTeacherPhoto} />
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto}>
                      <Upload className="w-4 h-4 mr-2" />上传照片
                    </Button>
                  </div>
                  <div className="space-y-2"><Label>姓名</Label><Input value={teacherForm.name} onChange={e => setTeacherForm({...teacherForm, name: e.target.value})} /></div>
                  <div className="space-y-2"><Label>头衔</Label><Input value={teacherForm.title} onChange={e => setTeacherForm({...teacherForm, title: e.target.value})} /></div>
                  <div className="space-y-2"><Label>简介</Label><Input value={teacherForm.description} onChange={e => setTeacherForm({...teacherForm, description: e.target.value})} /></div>
                  <Button onClick={() => handleSaveTeacher(true)}>保存修改</Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Global Settings Tab */}
          <TabsContent value="settings">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {GLOBAL_THEMES.map((theme) => (
                <Card 
                  key={theme.id} 
                  className={`cursor-pointer transition-all hover:scale-105 ${currentGlobalTheme === theme.id ? 'ring-2 ring-primary ring-offset-2' : 'hover:shadow-lg'}`}
                  onClick={() => handleSaveGlobalTheme(theme.id)}
                >
                  <div className={`h-32 w-full ${theme.color} flex items-center justify-center rounded-t-xl`}>
                    <theme.icon className="w-12 h-12 opacity-80" />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold">{theme.name}</h3>
                      {currentGlobalTheme === theme.id && <div className="w-2 h-2 bg-green-500 rounded-full"></div>}
                    </div>
                    <p className="text-sm text-muted-foreground">{theme.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
