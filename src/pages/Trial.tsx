import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  trackFormPageView,
  trackFormStart,
  trackFieldComplete,
  trackFormSubmit,
  trackFormSuccess,
  trackFormFail,
  trackBackClick,
  trackFormDuration,
  trackTermsClick,
} from '@/lib/analytics';

const courseOptions = [
  { value: 'scratch', label: 'Scratch图形化编程', age: '6-8岁' },
  { value: 'python', label: 'Python基础编程', age: '9-12岁' },
  { value: 'cpp', label: 'C++算法竞赛', age: '10-15岁' },
  { value: 'ai', label: '人工智能入门', age: '12-16岁' },
  { value: 'hardware', label: '智能开源硬件', age: '8-14岁' },
  { value: 'wedo', label: 'Wedo编程', age: '5-7岁' },
  { value: 'ev3', label: 'Ev3机器人编程', age: '8-14岁' },
];

export default function Trial() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    childName: '',
    courseType: '',
    phone: '',
  });
  
  // 埋点相关状态
  const formStartTime = useRef<number | null>(null);
  const hasStarted = useRef(false);
  const completedFields = useRef<Set<string>>(new Set());

  // 页面加载埋点
  useEffect(() => {
    trackFormPageView();
  }, []);

  // 表单开始填写
  const handleFormStart = () => {
    if (!hasStarted.current) {
      hasStarted.current = true;
      formStartTime.current = Date.now();
      trackFormStart();
    }
  };

  // 字段填写完成
  const handleFieldBlur = (fieldName: 'name' | 'course' | 'phone', value: string) => {
    if (value && !completedFields.current.has(fieldName)) {
      completedFields.current.add(fieldName);
      trackFieldComplete(fieldName);
    }
  };

  // 返回首页
  const handleBackClick = () => {
    trackBackClick();
    navigate('/');
  };

  // 服务条款点击
  const handleTermsClick = () => {
    trackTermsClick();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 提交点击埋点
    trackFormSubmit();
    
    if (!form.childName || !form.courseType || !form.phone) {
      toast.error('请填写所有必填项');
      trackFormFail('validation_error');
      return;
    }

    if (!/^1[3-9]\d{9}$/.test(form.phone)) {
      toast.error('请输入正确的手机号码');
      trackFormFail('validation_error');
      return;
    }

    setSubmitting(true);
    try {
      const courseName = courseOptions.find(c => c.value === form.courseType)?.label || form.courseType;
      
      const { error } = await supabase.from('trial_applications').insert({
        child_name: form.childName,
        course_type: courseName,
        phone: form.phone,
      });

      if (error) {
        if (error.message.includes('duplicate')) {
          trackFormFail('duplicate');
        } else {
          trackFormFail('network_error');
        }
        throw error;
      }
      
      // 计算填写时长
      const submitDuration = formStartTime.current 
        ? Math.round((Date.now() - formStartTime.current) / 1000) 
        : 0;
      
      // 成功埋点
      trackFormSuccess(submitDuration, courseName);
      trackFormDuration(submitDuration);
      
      setSubmitted(true);
      toast.success('申请提交成功！');
    } catch (error) {
      toast.error('提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-10 pb-8">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">申请提交成功！</h2>
            <p className="text-muted-foreground mb-6">
              我们的课程顾问将在24小时内与您联系，<br />请保持电话畅通。
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate('/')}>
                返回首页
              </Button>
              <Button onClick={() => { 
                setSubmitted(false); 
                setForm({ childName: '', courseType: '', phone: '' }); 
                hasStarted.current = false;
                formStartTime.current = null;
                completedFields.current.clear();
              }}>
                继续申请
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* 顶部导航 */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Button variant="ghost" onClick={handleBackClick} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-lg mx-auto">
          {/* 标题 */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">免费试听申请</h1>
            <p className="text-muted-foreground">
              填写以下信息，我们将尽快安排试听课程
            </p>
          </div>

          {/* 申请表单 */}
          <Card>
            <CardHeader>
              <CardTitle>填写申请信息</CardTitle>
              <CardDescription>请准确填写联系方式，以便我们与您联系</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="childName">孩子姓名 *</Label>
                  <Input
                    id="childName"
                    placeholder="请输入孩子姓名"
                    value={form.childName}
                    onFocus={handleFormStart}
                    onChange={(e) => setForm({ ...form, childName: e.target.value })}
                    onBlur={(e) => handleFieldBlur('name', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="courseType">试听课程 *</Label>
                  <Select
                    value={form.courseType}
                    onValueChange={(value) => {
                      handleFormStart();
                      setForm({ ...form, courseType: value });
                      handleFieldBlur('course', value);
                    }}
                  >
                    <SelectTrigger id="courseType">
                      <SelectValue placeholder="请选择想要试听的课程" />
                    </SelectTrigger>
                    <SelectContent>
                      {courseOptions.map((course) => (
                        <SelectItem key={course.value} value={course.value}>
                          <span>{course.label}</span>
                          <span className="text-muted-foreground ml-2">({course.age})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">联系电话 *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="请输入手机号码"
                    value={form.phone}
                    onFocus={handleFormStart}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    onBlur={(e) => handleFieldBlur('phone', e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                  {submitting ? '提交中...' : '提交申请'}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  提交即表示您同意我们的
                  <button type="button" onClick={handleTermsClick} className="underline hover:text-foreground">
                    服务条款和隐私政策
                  </button>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
