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
  class_id: string | null;
  remaining_hours: number;
}

interface ClassInfo {
  id: string;
  name: string;
  schedule: string;
  default_hours: number;
}

export default function TeacherDashboard() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [checkedStudents, setCheckedStudents] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');

  // 获取班级列表
  const { data: classes = [] } = useQuery({
    queryKey: ['teacher-classes', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name, schedule, default_hours')
        .eq('teacher_id', profile!.id)
        .order('name');
      if (error) throw error;
      return data as ClassInfo[];
    },
    enabled: !!profile?.id,
  });

  // 获取学生列表 — 只获取属于当前老师班级的学生
  const teacherClassIds = useMemo(() => classes.map(c => c.id), [classes]);
  const { data: allStudents = [] } = useQuery({
    queryKey: ['teacher-students', profile?.id, teacherClassIds],
    queryFn: async () => {
      if (teacherClassIds.length === 0) return [];
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('status', 'active')
        .in('class_id', teacherClassIds)
        .order('name');
      if (error) throw error;
      return data as Student[];
    },
    enabled: !!profile?.id && teacherClassIds.length > 0,
  });

  // 根据选择的班级过滤学生（使用 class_id 精确匹配，避免同名班级串数据）
  const students = useMemo(() => {
    if (selectedClassId === 'all') {
      // allStudents 已经通过 .in('class_id', teacherClassIds) 过滤过了
      return allStudents;
    }
    return allStudents.filter(s => s.class_id === selectedClassId);
  }, [allStudents, selectedClassId]);

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

  // 压缩照片并添加时间戳水印
  const processPhoto = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const MAX_W = 800;
        const MAX_H = 600;

        let w = img.width;
        let h = img.height;

        // 等比缩放到 800x600 以内
        if (w > MAX_W || h > MAX_H) {
          const ratio = Math.min(MAX_W / w, MAX_H / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;

        // 绘制缩放后的图片
        ctx.drawImage(img, 0, 0, w, h);

        // 右下角添加时间戳水印
        const now = new Date();
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        const stampText = `${dateStr} ${timeStr}`;

        const fontSize = Math.max(14, Math.round(w * 0.025));
        ctx.font = `bold ${fontSize}px sans-serif`;
        const textMetrics = ctx.measureText(stampText);
        const textW = textMetrics.width;
        const textH = fontSize;
        const padding = 6;
        const margin = 10;

        // 半透明深色背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        const bgX = w - textW - padding * 2 - margin;
        const bgY = h - textH - padding * 2 - margin;
        const bgW = textW + padding * 2;
        const bgH = textH + padding * 2;
        const radius = 4;
        ctx.moveTo(bgX + radius, bgY);
        ctx.lineTo(bgX + bgW - radius, bgY);
        ctx.quadraticCurveTo(bgX + bgW, bgY, bgX + bgW, bgY + radius);
        ctx.lineTo(bgX + bgW, bgY + bgH - radius);
        ctx.quadraticCurveTo(bgX + bgW, bgY + bgH, bgX + bgW - radius, bgY + bgH);
        ctx.lineTo(bgX + radius, bgY + bgH);
        ctx.quadraticCurveTo(bgX, bgY + bgH, bgX, bgY + bgH - radius);
        ctx.lineTo(bgX, bgY + radius);
        ctx.quadraticCurveTo(bgX, bgY, bgX + radius, bgY);
        ctx.fill();

        // 白色文字
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.textBaseline = 'top';
        ctx.fillText(stampText, bgX + padding, bgY + padding);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('照片处理失败'));
          },
          'image/jpeg',
          0.85
        );
      };
      img.onerror = () => reject(new Error('照片加载失败'));
      img.src = URL.createObjectURL(file);
    });
  };

  // 上传照片（接受原始 File 或处理后的 Blob）
  const uploadPhoto = async (blob: Blob): Promise<string> => {
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    const filePath = `class-photos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('class_photos')
      .upload(filePath, blob, { contentType: 'image/jpeg' });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('class_photos')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  // 拍照处理：先压缩+加水印，再提交
  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const processedBlob = await processPhoto(file);
        submitCheckin.mutate(processedBlob);
      } catch (err) {
        toast.error('照片处理失败，请重试');
      }
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
    mutationFn: async (capturedBlob: Blob) => {
      if (!capturedBlob || checkedStudents.size === 0) {
        throw new Error('请选择签到学生');
      }

      setSubmitting(true);
      const uploadedUrl = await uploadPhoto(capturedBlob);
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
    setCheckedStudents(new Set());
    setSubmitting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const [confirmOpen, setConfirmOpen] = useState(false);

  // 签到页面
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex flex-col items-center justify-start py-8 px-4">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-2">课堂签到</h1>
        <p className="text-muted-foreground">请先选择签到学生，再点击一键签到拍照</p>
      </div>

      <div className="w-full max-w-xs mb-8">
        <Select value={selectedClassId} onValueChange={setSelectedClassId}>
          <SelectTrigger>
            <SelectValue placeholder="选择当前上课班级" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有我的班级</SelectItem>
            {[...classes]
              .sort((a, b) => {
                const weekOrder: Record<string, number> = { '周一': 1, '周二': 2, '周三': 3, '周四': 4, '周五': 5, '周六': 6, '周日': 7 };
                const parse = (s: string) => {
                  if (!s) return { day: 99, time: 9999 };
                  const dayMatch = s.match(/周[一二三四五六日]/);
                  const timeMatch = s.match(/(\d{1,2}):(\d{2})/);
                  return {
                    day: dayMatch ? (weekOrder[dayMatch[0]] ?? 99) : 99,
                    time: timeMatch ? parseInt(timeMatch[1]) * 60 + parseInt(timeMatch[2]) : 9999,
                  };
                };
                const pa = parse(a.schedule);
                const pb = parse(b.schedule);
                if (pa.day !== pb.day) return pa.day - pb.day;
                return pa.time - pb.time;
              })
              .map(c => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} ({c.schedule || '无时间'}) - {c.default_hours || 1}课时
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <button
        onClick={() => {
          if (checkedStudents.size === 0) {
            toast.error('请至少选择一名学生');
            return;
          }
          setConfirmOpen(true);
        }}
        disabled={submitting}
        className="w-40 h-40 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground flex flex-col items-center justify-center shadow-2xl shadow-primary/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none mb-8"
      >
        <Camera className="w-16 h-16 mb-2" />
        <span className="text-lg font-medium">{submitting ? '提交中...' : '一键签到'}</span>
      </button>

      <div className="w-full max-w-md">
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                选择已到学生名片：
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (checkedStudents.size === students.length) {
                    setCheckedStudents(new Set());
                  } else {
                    setCheckedStudents(new Set(students.map(s => s.id)));
                  }
                }}
              >
                {checkedStudents.size === students.length ? '全部取消' : '全部选中'}
              </Button>
            </div>

            <div className="flex flex-wrap gap-3 max-h-64 overflow-y-auto p-1">
              {students.length === 0 && (
                <div className="w-full text-center py-4 text-muted-foreground text-sm">此班级暂无学生</div>
              )}
              {students.map((student) => {
                const isChecked = checkedStudents.has(student.id);
                return (
                  <button
                    key={student.id}
                    onClick={() => toggleStudent(student.id)}
                    className={cn(
                      'relative w-14 h-14 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                      isChecked
                        ? 'bg-green-500 text-white shadow-lg shadow-green-500/30 ring-2 ring-green-500 ring-offset-2'
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
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCapture}
        className="hidden"
      />

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-sm">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">确认签到</h2>
              <p className="mb-6 text-muted-foreground">
                即将为已选中的 <strong className="text-foreground">{checkedStudents.size}</strong> 位学生签到。签到后将开启摄像头拍照并自动完成。
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setConfirmOpen(false)}>取消</Button>
                <Button onClick={() => {
                  setConfirmOpen(false);
                  trackTeacherCheckinClick();
                  fileInputRef.current?.click();
                }}>确认拍照</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
