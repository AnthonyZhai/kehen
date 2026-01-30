import { useRef, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Share2, Clock, User, BookOpen, GraduationCap, Star, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { trackParentQueryHour, trackParentViewPhoto, trackParentShareClick } from '@/lib/analytics';

interface Student {
  id: string;
  name: string;
  class_name: string;
  subject: string;
  remaining_hours: number;
  total_hours: number;
}

interface ClassRecord {
  id: string;
  class_date: string;
  photo_url: string | null;
  hours_consumed: number;
  students: { name: string };
  profiles: { full_name: string };
}

export default function ParentDashboard() {
  const { profile } = useAuth();
  const shareCardRef = useRef<HTMLDivElement>(null);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);
  const hasTrackedQuery = useRef(false);

  // 获取我的孩子
  const { data: students = [] } = useQuery({
    queryKey: ['my-students', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('parent_id', profile!.id)
        .order('name');
      if (error) throw error;
      return data as Student[];
    },
    enabled: !!profile,
  });

  // 获取最新的课时记录（带照片）
  const { data: latestRecord } = useQuery({
    queryKey: ['latest-record', students],
    queryFn: async () => {
      if (students.length === 0) return null;
      const studentIds = students.map(s => s.id);

      const { data, error } = await supabase
        .from('class_records')
        .select('*, students(name), profiles(full_name)')
        .in('student_id', studentIds)
        .not('photo_url', 'is', null)
        .order('class_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as ClassRecord | null;
    },
    enabled: students.length > 0,
  });

  // 课时查询埋点
  useEffect(() => {
    if (students.length > 0 && !hasTrackedQuery.current) {
      hasTrackedQuery.current = true;
      students.forEach(student => {
        trackParentQueryHour(student.name, student.remaining_hours);
      });
    }
  }, [students]);

  // 查看照片
  const handleViewPhoto = (photoUrl: string, studentName: string) => {
    trackParentViewPhoto(studentName);
    setSelectedPhotoUrl(photoUrl);
    setPhotoDialogOpen(true);
  };

  const currentStudent = students[0];
  
  // 计算已学习课时
  const learnedHours = currentStudent ? (currentStudent.total_hours - currentStudent.remaining_hours) : 0;

  // 生成分享图片
  const handleShare = async () => {
    if (!shareCardRef.current || !currentStudent) return;

    // 分享点击埋点
    trackParentShareClick(currentStudent.name, learnedHours);

    try {
      toast.loading('正在生成分享图片...', { id: 'share' });
      
      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });

      const link = document.createElement('a');
      link.download = `学习记录_${currentStudent?.name}_${format(new Date(), 'yyyyMMdd')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast.success('图片已生成，请保存后分享', { id: 'share' });
    } catch (error) {
      toast.error('生成图片失败', { id: 'share' });
    }
  };

  if (!currentStudent) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h2 className="text-xl font-semibold mb-2">暂无学生信息</h2>
            <p className="text-muted-foreground">请联系老师将您的孩子添加到系统中</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* 可分享的卡片 */}
        <div ref={shareCardRef} className="bg-white rounded-2xl overflow-hidden shadow-lg">
          {/* 学生信息头部 */}
          <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                <User className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold">{currentStudent.name}</h1>
                <div className="flex items-center gap-3 mt-1 text-sm opacity-90">
                  <span className="flex items-center gap-1">
                    <GraduationCap className="w-4 h-4" />
                    {currentStudent.class_name || '未分班'}
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    {currentStudent.subject || '未设置'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 签到照片 */}
          <div className="p-4">
            {latestRecord?.photo_url ? (
              <div 
                className="relative rounded-xl overflow-hidden cursor-pointer hover:opacity-95 transition-opacity"
                onClick={() => handleViewPhoto(latestRecord.photo_url!, currentStudent.name)}
              >
                <img
                  src={latestRecord.photo_url}
                  alt="签到照片"
                  className="w-full h-64 object-cover"
                  crossOrigin="anonymous"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <p className="text-white text-sm font-medium">
                    {format(new Date(latestRecord.class_date), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                  </p>
                  <p className="text-white/80 text-xs">
                    授课教师：{latestRecord.profiles.full_name}
                  </p>
                </div>
                <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  点击放大
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-muted h-64 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>暂无签到照片</p>
                </div>
              </div>
            )}
          </div>

          {/* 学习成就展示 */}
          <div className="px-4 pb-6">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-5 relative overflow-hidden">
              <div className="absolute top-2 right-2">
                <Trophy className="w-8 h-8 text-amber-400/30" />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-5 h-5 text-amber-500" />
                <span className="text-sm font-medium text-amber-700">学习成就</span>
              </div>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-gray-800">
                  我已坚持学习了 <span className="text-2xl text-primary font-bold">{learnedHours}</span> 小时
                </p>
                <p className="text-sm text-gray-600">
                  继续加油！还有 <span className="font-medium text-primary">{currentStudent.remaining_hours}</span> 小时的精彩等着我
                </p>
              </div>
              {currentStudent.remaining_hours <= 2 && (
                <Badge variant="destructive" className="mt-3">
                  课时即将用完，请及时续费
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* 分享按钮 */}
        <Button
          onClick={handleShare}
          size="lg"
          className="w-full h-14 text-lg rounded-xl"
        >
          <Share2 className="w-5 h-5 mr-2" />
          分享到朋友圈
        </Button>
      </div>

      {/* 照片放大对话框 */}
      <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">签到照片预览</DialogTitle>
          <DialogDescription className="sr-only">签到照片详情</DialogDescription>
          {selectedPhotoUrl && (
            <img
              src={selectedPhotoUrl}
              alt="签到照片"
              className="w-full h-auto"
              crossOrigin="anonymous"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
