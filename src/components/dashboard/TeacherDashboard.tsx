import { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Check, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { format, getDay, getHours, getMinutes } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { trackTeacherCheckinClick } from '@/lib/analytics';

interface Student {
  id: string;
  name: string;
  class_name: string;
  remaining_hours: number;
}

interface ClassInfo {
  id: string;
  name: string;
  schedule: string;
  default_hours: number;
}

type ViewState = 'checkin' | 'result';

export default function TeacherDashboard() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [viewState, setViewState] = useState<ViewState>('checkin');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [checkedStudents, setCheckedStudents] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');

  // 获取班级列表
  const { data: classes = [] } = useQuery({
    queryKey: ['teacher-classes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name, schedule, default_hours')
        .order('name');
      if (error) throw error;
      return data as ClassInfo[];
    },
  });

  // 获取学生列表
  const { data: allStudents = [] } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return data as Student[];
    },
  });

  // 根据选择的班级过滤学生
  const students = useMemo(() => {
    if (selectedClassId === 'all') return allStudents;
    const selectedClass = classes.find(c => c.id === selectedClassId);
    if (!selectedClass) return allStudents;
    return allStudents.filter(s => s.class_name === selectedClass.name);
  }, [allStudents, classes, selectedClassId]);

  // 自动选择当前时间的班级
  useEffect(() => {
    if (classes.length === 0) return;
    
    const now = new Date();
    const currentDay = getDay(now); // 0 = Sunday, 1 = Monday
    const currentHour = getHours(now);
    
    // 简单的中文星期映射
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const todayStr = weekDays[currentDay];
    
    // 查找包含今天且时间接近的班级
    const matchedClass = classes.find(c => {
      if (!c.schedule) return false;
      return c.schedule.includes(todayStr);
    });

    if (matchedClass) {
      setSelectedClassId(matchedClass.id);
    }
  }, [classes]);

  // 上传照片
  const uploadPhoto = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `class-photos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('class_photos')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('class_photos')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  // 拍照处理
  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const url = URL.createObjectURL(file);
      setPhotoUrl(url);
      
      // 模拟人脸识别 - 随机选择一些学生作为"识别到的"
      const recognizedIds = new Set<string>();
      students.forEach(s => {
        if (Math.random() > 0.3) { // 70%概率识别成功
          recognizedIds.add(s.id);
        }
      });
      setCheckedStudents(recognizedIds);
      
      setViewState('result');
    }
  };

  // 切换学生签到状态
  const toggleStudent = (studentId: string) => {
    const newChecked = new Set(checkedStudents);
    if (newChecked.has(studentId)) {
      newChecked.delete(studentId);
    } else {
      newChecked.add(studentId);
    }
    setCheckedStudents(newChecked);
  };

  // 提交签到
  const submitCheckin = useMutation({
    mutationFn: async () => {
      if (!photoFile || checkedStudents.size === 0) {
        throw new Error('请先拍照并选择签到学生');
      }

      setSubmitting(true);
      const uploadedUrl = await uploadPhoto(photoFile);
      const classDate = new Date().toISOString();
      
      const selectedClass = classes.find(c => c.id === selectedClassId);
      const hoursToDeduct = selectedClass?.default_hours || 1.0;

      // 为每个签到的学生创建记录
      const records = Array.from(checkedStudents).map(studentId => ({
        student_id: studentId,
        teacher_id: profile!.id,
        class_date: classDate,
        hours_consumed: hoursToDeduct,
        photo_url: uploadedUrl,
      }));

      const { error } = await supabase.from('class_records').insert(records);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`成功为 ${checkedStudents.size} 位学生签到`);
      queryClient.invalidateQueries({ queryKey: ['students'] });
      resetState();
    },
    onError: (error: Error) => {
      toast.error(error.message || '签到失败');
      setSubmitting(false);
    },
  });

  // 重置状态
  const resetState = () => {
    setViewState('checkin');
    setPhotoUrl(null);
    setPhotoFile(null);
    setCheckedStudents(new Set());
    setSubmitting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 签到页面
  if (viewState === 'checkin') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex flex-col items-center justify-center p-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">课堂签到</h1>
          <p className="text-muted-foreground">点击下方按钮拍摄课堂照片</p>
        </div>

        <div className="w-full max-w-xs mb-8">
          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
            <SelectTrigger>
              <SelectValue placeholder="选择当前上课班级" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有学生</SelectItem>
              {classes.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} ({c.schedule || '无时间'}) - {c.default_hours || 1}课时
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <button
          onClick={() => {
            trackTeacherCheckinClick();
            fileInputRef.current?.click();
          }}
          className="w-40 h-40 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground flex flex-col items-center justify-center shadow-2xl shadow-primary/30 transition-all hover:scale-105 active:scale-95"
        >
          <Camera className="w-16 h-16 mb-2" />
          <span className="text-lg font-medium">一键签到</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCapture}
          className="hidden"
        />

        <p className="mt-8 text-sm text-muted-foreground">
          今日已签到 {students.length} 位学生
        </p>
      </div>
    );
  }

  // 签到结果页面
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background p-4">
      <div className="max-w-md mx-auto">
        {/* 返回按钮 */}
        <Button
          variant="ghost"
          onClick={resetState}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          重新拍照
        </Button>

        {/* 签到照片 */}
        <Card className="mb-4 overflow-hidden">
          <div className="relative">
            {photoUrl && (
              <img
                src={photoUrl}
                alt="签到照片"
                className="w-full h-64 object-cover"
              />
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
              <p className="text-white text-sm font-medium">
                {format(new Date(), 'yyyy年MM月dd日 HH:mm:ss', { locale: zhCN })}
              </p>
            </div>
          </div>
        </Card>

        {/* 学生签到列表 */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              点击学生姓名进行手动补签
            </h3>
            <div className="flex flex-wrap gap-3">
              {students.map((student) => {
                const isChecked = checkedStudents.has(student.id);
                return (
                  <button
                    key={student.id}
                    onClick={() => toggleStudent(student.id)}
                    className={cn(
                      'relative w-14 h-14 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                      isChecked
                        ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    )}
                  >
                    {student.name.slice(0, 2)}
                    {isChecked && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow">
                        <Check className="w-3 h-3 text-green-500" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 提交按钮 */}
        <Button
          onClick={() => submitCheckin.mutate()}
          disabled={checkedStudents.size === 0 || submitting}
          size="lg"
          className="w-full mt-4 h-14 text-lg rounded-xl"
        >
          {submitting ? '提交中...' : `确认签到 (${checkedStudents.size}人)`}
        </Button>
      </div>
    </div>
  );
}
