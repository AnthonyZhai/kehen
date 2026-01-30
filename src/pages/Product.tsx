import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { BookOpen, CheckCircle, Clock, Shield } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();
  const { profile, loading } = useAuth();

  useEffect(() => {
    if (!loading && profile) {
      navigate('/dashboard');
    }
  }, [profile, loading, navigate]);

  const features = [
    {
      icon: Clock,
      title: '实时记录',
      description: '课上一键拍照记录课时，实时同步到数据库',
    },
    {
      icon: Shield,
      title: '三端同步',
      description: '教师、老板、家长三端数据100%一致，全程留痕',
    },
    {
      icon: CheckCircle,
      title: '智能预警',
      description: '课时不足自动提醒，提前7天推送续费通知',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-2xl bg-primary/10">
              <BookOpen className="w-16 h-16 text-primary" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            课时管理系统
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            告别Excel台账，让课时管理更简单、更透明、更高效
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/login')}>
              立即开始
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/login')}>
              了解更多
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-card rounded-xl p-6 border shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-20 bg-card rounded-2xl p-12 border max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">为什么选择我们？</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-primary mb-2">100%</p>
              <p className="text-muted-foreground">数据一致性</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary mb-2">实时</p>
              <p className="text-muted-foreground">课时同步</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary mb-2">0</p>
              <p className="text-muted-foreground">糊涂账</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
