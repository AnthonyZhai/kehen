import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { BookOpen, Users, GraduationCap, Code, Star, MapPin, Phone, Mail, ArrowRight, Menu, X, Trophy, Medal, Rocket, Sparkles, Smile, Brain } from 'lucide-react';
import { trackApplyClick, trackQueryClick, trackNavClick, trackCourseExposure, trackCourseClick, trackHomeDuration } from '@/lib/analytics';
import { teachers as defaultTeachers, awards as defaultAwards, contactInfo } from '@/data/mockData';

const IconMap: Record<string, any> = {
  Smile, Code, Trophy, Brain, Rocket, Star, Users, GraduationCap, Sparkles
};

export default function Index() {
  const navigate = useNavigate();
  const pageLoadTime = useRef(Date.now());
  const courseRefs = useRef<(HTMLDivElement | null)[]>([]);
  const exposedCourses = useRef<Set<string>>(new Set());
  const [globalTheme, setGlobalTheme] = useState(() => {
    return localStorage.getItem('website_theme') || 'playful';
  });

  // Fetch Global Theme
  useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('public_site_settings').select('value').eq('key', 'website_theme').single();
        if (data) {
          setGlobalTheme(data.value);
          localStorage.setItem('website_theme', data.value);
        }
        return data;
      } catch (error) {
        console.warn('Failed to fetch theme from DB, using local');
        return null;
      }
    },
  });

  const getThemeStyles = () => {
    switch (globalTheme) {
      case 'tech':
        return {
          bg: 'bg-slate-900',
          text: 'text-slate-100',
          mutedText: 'text-slate-400',
          nav: 'bg-slate-900/80 border-slate-700',
          card: 'bg-slate-800 border-slate-700 rounded-xl hover:shadow-cyan-500/20',
          primary: 'text-cyan-400',
          button: 'bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg',
          buttonOutline: 'border-cyan-500 text-cyan-400 hover:bg-cyan-950',
          sectionBg: 'bg-slate-900',
          decoration: 'tech'
        };
      case 'minimal':
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-900',
          mutedText: 'text-gray-500',
          nav: 'bg-white/80 border-gray-200 shadow-sm',
          card: 'bg-white border-gray-100 shadow-sm rounded-lg hover:shadow-md',
          primary: 'text-gray-900',
          button: 'bg-gray-900 hover:bg-gray-800 text-white rounded-md',
          buttonOutline: 'border-gray-300 text-gray-700 hover:bg-gray-100',
          sectionBg: 'bg-white',
          decoration: 'minimal'
        };
      case 'classic':
        return {
          bg: 'bg-[#f8f5f2]',
          text: 'text-[#2c3e50]',
          mutedText: 'text-[#7f8c8d]',
          nav: 'bg-[#fffdf9]/90 border-[#e0d6c8] shadow-md',
          card: 'bg-[#fffdf9] border-[#e0d6c8] shadow-md rounded-lg',
          primary: 'text-[#8e44ad]',
          button: 'bg-[#8e44ad] hover:bg-[#732d91] text-white rounded-md font-serif',
          buttonOutline: 'border-[#8e44ad] text-[#8e44ad] hover:bg-[#f0e6f5]',
          sectionBg: 'bg-[#f0e6f5]/20',
          decoration: 'classic'
        };
      default: // playful
        return {
          bg: 'bg-background',
          text: 'text-foreground',
          mutedText: 'text-muted-foreground',
          nav: 'bg-white/80 border-white/50 shadow-lg rounded-full',
          card: 'bg-white border-2 rounded-[2rem] shadow-xl',
          primary: 'text-primary',
          button: 'bg-primary hover:bg-primary/90 text-white rounded-full',
          buttonOutline: 'border-2 rounded-full hover:bg-secondary/10',
          sectionBg: 'bg-secondary/10',
          decoration: 'bubbles'
        };
    }
  };

  const theme = getThemeStyles();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch Public Courses
  const { data: fetchedCourses = [] } = useQuery({
    queryKey: ['public-courses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('public_courses').select('*').order('sort_order', { ascending: true });
      if (error) {
        console.error('Error fetching courses:', error);
        return [];
      }
      return data;
    },
  });

  // Fetch Public Awards
  const { data: fetchedAwards = [] } = useQuery({
    queryKey: ['public-awards'],
    queryFn: async () => {
      const { data, error } = await supabase.from('public_awards').select('*').order('sort_order', { ascending: true });
      if (error) {
         console.error('Error fetching awards:', error);
         return [];
      }
      return data;
    },
  });

  // Fetch Public Teachers
  const { data: fetchedTeachers = [] } = useQuery({
    queryKey: ['public-teachers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('public_teachers').select('*').order('sort_order', { ascending: true });
      if (error) {
        console.error('Error fetching teachers:', error);
        return [];
      }
      return data;
    },
  });

  const defaultCourses = [
    { 
      name: 'Scratch图形化编程', 
      age: '6-8岁', 
      desc: '像搭积木一样学编程，不仅好玩还能变聪明！', 
      colorClass: 'bg-orange-100 text-orange-600', 
      borderClass: 'border-orange-200', 
      shadowClass: 'hover:shadow-orange-200',
      btnClass: 'bg-orange-500 hover:bg-orange-600',
      icon_name: 'Smile' 
    },
    { 
      name: 'Python趣味编程', 
      age: '9-12岁', 
      desc: '用代码指挥电脑画画、做游戏，超酷的！', 
      colorClass: 'bg-green-100 text-green-600', 
      borderClass: 'border-green-200', 
      shadowClass: 'hover:shadow-green-200',
      btnClass: 'bg-green-500 hover:bg-green-600',
      icon_name: 'Code' 
    },
    { 
      name: 'C++奥赛挑战', 
      age: '10-15岁', 
      desc: '参加比赛拿金牌，成为未来的科技之星！', 
      colorClass: 'bg-blue-100 text-blue-600', 
      borderClass: 'border-blue-200', 
      shadowClass: 'hover:shadow-blue-200',
      btnClass: 'bg-blue-500 hover:bg-blue-600',
      icon_name: 'Trophy' 
    },
    { 
      name: 'AI人工智能', 
      age: '12-16岁', 
      desc: '和机器人做朋友，一起探索未来的秘密！', 
      colorClass: 'bg-purple-100 text-purple-600', 
      borderClass: 'border-purple-200', 
      shadowClass: 'hover:shadow-purple-200',
      btnClass: 'bg-purple-500 hover:bg-purple-600',
      icon_name: 'Brain' 
    },
  ];

  const courses = (fetchedCourses.length > 0 ? fetchedCourses : defaultCourses).map((c: any) => ({
    ...c,
    colorClass: c.color_class || c.colorClass,
    borderClass: c.border_class || c.borderClass,
    shadowClass: c.shadow_class || c.shadowClass,
    btnClass: c.btn_class || c.btnClass,
    icon: IconMap[c.icon_name] || Code // Resolve icon component
  }));

  const awards = (fetchedAwards.length > 0 ? fetchedAwards : defaultAwards).map((a: any) => ({
    name: a.student_name || a.name,
    school: a.school,
    match: a.match_name || a.match,
    award: a.award_name || a.award
  }));
  
  // Transform teachers data to match component expectation if needed, or adjust component
  // The mock data has `image`, DB has `image_url`. I should standardize.
  // Mock data: { name, title, desc, image }
  // DB data: { name, title, description, image_url }
  const teachers = (fetchedTeachers.length > 0 ? fetchedTeachers : defaultTeachers).map((t: any) => ({
    name: t.name,
    title: t.title,
    desc: t.description || t.desc,
    image: t.image_url || t.image
  }));

  const advantages = [
    { icon: Users, title: '小班趣学', desc: '每班不超过8人，老师时刻关注你的奇思妙想', colorClass: 'text-orange-500 bg-orange-50' },
    { icon: GraduationCap, title: '魔法导师', desc: '来自名校的大哥哥大姐姐，带你探索科技世界', colorClass: 'text-blue-500 bg-blue-50' },
    { icon: Rocket, title: '实战闯关', desc: '每节课都是一次探险，动手做出自己的作品', colorClass: 'text-purple-500 bg-purple-50' },
    { icon: Star, title: '成长档案', desc: '记录你的每一次进步，爸爸妈妈随时都能看到', colorClass: 'text-yellow-500 bg-yellow-50' },
  ];

  // 页面停留时长追踪
  useEffect(() => {
    const handleUnload = () => {
      const duration = Math.round((Date.now() - pageLoadTime.current) / 1000);
      trackHomeDuration(duration);
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => {
      handleUnload();
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  // 课程卡片曝光追踪
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const courseName = entry.target.getAttribute('data-course-name');
            if (courseName && !exposedCourses.current.has(courseName)) {
              exposedCourses.current.add(courseName);
              trackCourseExposure(courseName);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    courseRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  // 导航栏点击处理
  const handleNavClick = (navItem: string, href: string) => {
    trackNavClick(navItem);
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  // 免费试听点击处理
  const handleApplyClick = (source: 'hero' | 'nav' | 'contact') => {
    trackApplyClick(source);
    navigate('/trial');
  };

  // 课时查询点击处理
  const handleQueryClick = () => {
    trackQueryClick();
    navigate('/login');
  };

  // 课程卡片点击处理
  const handleCourseClick = (courseName: string) => {
    trackCourseClick(courseName);
    navigate('/trial');
  };

  const navItems = [
    { label: '关于我们', shortLabel: '关于', href: '#about' },
    { label: '课程乐园', shortLabel: '课程', href: '#courses' },
    { label: '魔法课堂', shortLabel: '课堂', href: '#advantages' },
    { label: '小小发明家', shortLabel: '荣誉', href: '#awards' },
    { label: '明星导师', shortLabel: '导师', href: '#teachers' },
    { label: '联系我们', shortLabel: '联系', href: '#contact' },
  ];

  return (
    <div className={`min-h-screen font-sans ${theme.bg} ${theme.text} transition-colors duration-500`}>
      {/* 装饰背景泡泡 - 仅在 playful 主题显示 */}
      {theme.decoration === 'bubbles' && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float"></div>
          <div className="absolute top-40 right-10 w-40 h-40 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute -bottom-8 left-20 w-56 h-56 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-40 right-20 w-48 h-48 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float" style={{ animationDelay: '3s' }}></div>
        </div>
      )}

      {/* Tech 主题背景 */}
      {theme.decoration === 'tech' && (
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
          <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-cyan-500/10 via-transparent to-transparent blur-3xl"></div>
        </div>
      )}

      {/* Minimal 主题背景 */}
      {theme.decoration === 'minimal' && (
        <div className="fixed inset-0 pointer-events-none z-0 bg-white">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        </div>
      )}

      {/* Classic 主题背景 */}
      {theme.decoration === 'classic' && (
        <div className="fixed inset-0 pointer-events-none z-0 bg-[#f8f5f2]">
          <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)', backgroundSize: '60px 60px', backgroundPosition: '0 0, 30px 30px' }}></div>
        </div>
      )}

      {/* 导航栏 */}
      <header className="fixed top-4 left-4 right-4 z-50">
        <div className="container mx-auto max-w-6xl">
          <div className={`${theme.nav} backdrop-blur-md px-3 sm:px-6 h-16 sm:h-20 flex items-center justify-between transition-all duration-300`}>
            <div className="flex items-center gap-2 sm:gap-3 cursor-pointer group" onClick={() => navigate('/')}>
              <div className={`p-2 sm:p-2.5 rounded-full ${globalTheme === 'playful' ? 'bg-primary' : theme.button} text-white group-hover:scale-110 transition-transform duration-300`}>
                <Rocket className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className={`font-bold text-lg sm:text-2xl ${globalTheme === 'playful' ? 'bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent' : theme.text} whitespace-nowrap`}>
                轻近编程
              </span>
            </div>

            {/* 桌面端导航 */}
            <nav className="hidden md:flex items-center gap-0.5 sm:gap-1 p-1 px-1 sm:px-3">
              {navItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => handleNavClick(item.label, item.href)}
                  className={`px-2 lg:px-3 xl:px-4 py-2 rounded-full text-sm font-medium ${theme.mutedText} hover:${theme.primary} hover:bg-black/5 transition-all duration-300 whitespace-nowrap`}
                >
                  <span className="xl:hidden">{item.shortLabel}</span>
                  <span className="hidden xl:inline">{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-2 sm:gap-3">
              <Button variant="ghost" onClick={() => navigate('/login')} className={`rounded-full hover:bg-black/5 ${theme.primary} px-2 sm:px-4`}>
                登录
              </Button>
              <Button onClick={() => navigate('/product')} className={`${theme.button} shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 px-3 sm:px-4`}>
                课时管理
              </Button>
            </div>

            {/* 移动端菜单按钮 */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className={`rounded-full ${theme.text}`}>
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className={`w-[300px] sm:w-[360px] ${globalTheme === 'playful' ? 'rounded-l-[2rem]' : ''} ${theme.bg} ${theme.text} border-l border-white/20 overflow-y-auto`}>
                <SheetTitle className="sr-only">移动端导航菜单</SheetTitle>
                <SheetDescription className="sr-only">包含网站导航链接和登录入口</SheetDescription>
                <div className="flex flex-col gap-4 sm:gap-8 mt-4 sm:mt-8">
                  <div className="flex items-center gap-3 px-2">
                    <div className={`p-2 rounded-xl ${globalTheme === 'playful' ? 'bg-primary/10' : theme.sectionBg}`}>
                      <Rocket className={`w-6 h-6 ${theme.primary}`} />
                    </div>
                    <span className="font-bold text-xl">轻近编程</span>
                  </div>
                  <nav className="flex flex-col gap-2 sm:gap-3">
                    {navItems.map((item) => (
                      <button
                        key={item.href}
                        onClick={() => handleNavClick(item.label, item.href)}
                        className={`flex items-center justify-between p-2 sm:p-3 rounded-xl hover:bg-black/5 transition-colors group`}
                      >
                        <span className={`text-base sm:text-lg font-medium ${theme.text} opacity-80 group-hover:${theme.primary}`}>{item.label}</span>
                        <ArrowRight className={`w-4 h-4 ${theme.mutedText} group-hover:${theme.primary} opacity-0 group-hover:opacity-100 transition-all`} />
                      </button>
                    ))}
                  </nav>
                  <div className="flex flex-col gap-3 pt-4 sm:pt-6 border-t border-dashed border-gray-200/20">
                    <Button variant="outline" className={`w-full h-10 sm:h-12 text-base sm:text-lg ${theme.buttonOutline}`} onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}>
                      登录
                    </Button>
                    <Button className={`w-full h-10 sm:h-12 text-base sm:text-lg shadow-lg ${theme.button}`} onClick={() => { setMobileMenuOpen(false); navigate('/product'); }}>
                      课时管理系统
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-32 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${globalTheme === 'playful' ? 'bg-white/60 backdrop-blur border border-white/50' : theme.card} shadow-sm mb-8 animate-bounce-soft`}>
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className={`text-sm font-medium ${theme.mutedText}`}>新学期编程课火热报名中！</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 sm:mb-8 tracking-tight">
            让孩子
            <span className="relative inline-block mx-2 sm:mx-4">
              <span className={`relative z-10 ${theme.primary} animate-wiggle inline-block`}>爱上编程</span>
              {globalTheme === 'playful' && <span className="absolute bottom-1 sm:bottom-2 left-0 w-full h-3 sm:h-4 bg-yellow-300/50 -rotate-2 rounded-full -z-0"></span>}
            </span>
            <br className="hidden sm:block" />
            <span className={globalTheme === 'playful' ? "bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-500" : theme.text}>
              开启奇妙科技之旅
            </span>
          </h1>
          
          <p className={`text-lg sm:text-xl md:text-2xl ${theme.mutedText} mb-8 sm:mb-12 max-w-3xl mx-auto px-4 leading-relaxed`}>
            专为6-16岁少儿设计，像玩游戏一样学编程。
            <br className="hidden sm:block" />
            培养逻辑思维，激发无限创造力，给梦想插上科技的翅膀！
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center px-4">
            <Button size="lg" className={`w-full sm:w-auto h-14 sm:h-16 px-8 text-lg sm:text-xl shadow-xl hover:scale-105 transition-transform ${theme.button}`} onClick={() => handleApplyClick('hero')}>
              <Sparkles className="mr-2 w-5 h-5 sm:w-6 sm:h-6" />
              免费试听体验
            </Button>
            <Button size="lg" variant="outline" className={`w-full sm:w-auto h-14 sm:h-16 px-8 text-lg sm:text-xl border-2 transition-all ${theme.buttonOutline}`} onClick={handleQueryClick}>
              <BookOpen className="mr-2 w-5 h-5 sm:w-6 sm:h-6" />
              查询课时
            </Button>
          </div>


          <div className="mt-16 sm:mt-20 flex justify-center gap-8 sm:gap-16 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
             {/* 可以放置一些合作伙伴Logo或者有趣的图标 */}
             <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-2 rotate-3 hover:rotate-12 transition-transform">
                  <span className="text-2xl sm:text-3xl">🧩</span>
                </div>
                <p className="text-xs sm:text-sm font-medium">逻辑思维</p>
             </div>
             <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-2 -rotate-3 hover:-rotate-12 transition-transform">
                  <span className="text-2xl sm:text-3xl">🎨</span>
                </div>
                <p className="text-xs sm:text-sm font-medium">创造力</p>
             </div>
             <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-2 rotate-6 hover:rotate-12 transition-transform">
                  <span className="text-2xl sm:text-3xl">🤝</span>
                </div>
                <p className="text-xs sm:text-sm font-medium">协作力</p>
             </div>
             <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-2 -rotate-6 hover:-rotate-12 transition-transform">
                  <span className="text-2xl sm:text-3xl">🔍</span>
                </div>
                <p className="text-xs sm:text-sm font-medium">专注力</p>
             </div>
          </div>
        </div>
      </section>

      {/* 关于我们 */}
      <section id="about" className={`py-20 sm:py-32 relative ${globalTheme !== 'playful' ? theme.sectionBg : ''}`}>
        {globalTheme === 'playful' && <div className="absolute inset-0 bg-secondary/5 skew-y-3 transform origin-top-left -z-10"></div>}
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className={`inline-block py-1 px-3 rounded-full ${globalTheme === 'playful' ? 'bg-primary/10 text-primary' : `${theme.buttonOutline} border`} text-sm font-bold mb-4`}>
              ✨ 关于我们
            </span>
            <h2 className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-6 ${theme.text}`}>
              为什么选择轻近编程？
            </h2>
            <p className={`text-lg ${theme.mutedText} max-w-2xl mx-auto`}>
              我们不仅教授代码，更是在孩子心中播下科技的种子，等待它们生根发芽，开出梦想的花朵。
            </p>
          </div>
          
          <div className="relative overflow-hidden -mx-4 px-4 sm:overflow-visible">
            <div className="flex overflow-x-auto gap-8 pb-8 snap-x hide-scrollbar md:grid md:grid-cols-3 md:pb-0 md:overflow-visible">
              <div className={`flex-none w-[280px] sm:w-[320px] md:w-auto snap-center ${theme.card} p-8 hover:-translate-y-2 transition-transform duration-300`}>
                <p className="text-6xl font-black text-orange-400 mb-2">5<span className="text-3xl">+</span></p>
                <p className={`text-xl font-bold ${theme.text} mb-2`}>年快乐教学</p>
                <p className={theme.mutedText}>丰富的少儿编程教育经验，懂技术更懂孩子</p>
              </div>
              <div className={`flex-none w-[280px] sm:w-[320px] md:w-auto snap-center ${theme.card} p-8 hover:-translate-y-2 transition-transform duration-300 md:-mt-8`}>
                <p className="text-6xl font-black text-blue-400 mb-2">1k<span className="text-3xl">+</span></p>
                <p className={`text-xl font-bold ${theme.text} mb-2`}>小小创造者</p>
                <p className={theme.mutedText}>见证了无数个创意作品的诞生，每个孩子都是发明家</p>
              </div>
              <div className={`flex-none w-[280px] sm:w-[320px] md:w-auto snap-center ${theme.card} p-8 hover:-translate-y-2 transition-transform duration-300`}>
                <p className="text-6xl font-black text-green-400 mb-2">98<span className="text-3xl">%</span></p>
                <p className={`text-xl font-bold ${theme.text} mb-2`}>家长超满意</p>
                <p className={theme.mutedText}>口碑相传，让学习变得轻松有趣，效果看得见</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 课程体系 */}
      <section id="courses" className="py-20 sm:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className={`inline-block py-1 px-3 rounded-full ${globalTheme === 'playful' ? 'bg-purple-100 text-purple-600' : `${theme.buttonOutline} border`} text-sm font-bold mb-4`}>
              🚀 课程乐园
            </span>
            <h2 className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-6 ${theme.text}`}>
              探索编程的魔法世界
            </h2>
            <p className={`text-lg ${theme.mutedText}`}>
              分龄分级科学体系，为不同阶段的孩子量身定制
            </p>
          </div>
          
          <div className="relative overflow-hidden -mx-4 px-4 sm:overflow-visible">
            <div className="flex overflow-x-auto gap-6 pb-8 snap-x hide-scrollbar">
              {courses.map((course, index) => (
                <div
                  key={index}
                  ref={(el) => { courseRefs.current[index] = el; }}
                  data-course-name={course.name}
                  className="flex-none snap-center w-[280px] sm:w-[320px] md:w-[calc(33.333%-16px)] lg:w-[calc(25%-18px)] h-full"
                >
                  <Card 
                    className={`h-full ${globalTheme === 'playful' ? `border-2 ${course.borderClass} rounded-[2rem] hover:shadow-xl ${course.shadowClass}` : `${theme.card}`} overflow-hidden transition-all duration-300 hover:-translate-y-2 cursor-pointer group border-0`}
                    onClick={() => handleCourseClick(course.name)}
                  >
                    <CardContent className="p-0 h-full flex flex-col">
                      <div className={`p-8 ${globalTheme === 'playful' ? course.colorClass : `${theme.bg} ${theme.text}`} flex flex-col items-center justify-center gap-4`}>
                        <div className={`w-16 h-16 ${globalTheme === 'playful' ? 'bg-white shadow-sm' : `${theme.card} border-0`} rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
                          <course.icon className={`w-8 h-8 ${globalTheme === 'playful' ? '' : theme.primary}`} />
                        </div>
                        <h3 className="font-bold text-xl">{course.name}</h3>
                        <span className={`px-3 py-1 ${globalTheme === 'playful' ? 'bg-white/50 backdrop-blur' : theme.sectionBg} rounded-full text-xs font-bold`}>
                          适合年龄：{course.age}
                        </span>
                      </div>
                      <div className={`p-6 flex-1 flex flex-col justify-between ${globalTheme === 'playful' ? 'bg-white' : theme.bg}`}>
                        <p className={`${theme.mutedText} text-center mb-6 leading-relaxed`}>
                          {course.desc}
                        </p>
                        <Button className={`w-full ${globalTheme === 'playful' ? `rounded-full ${course.btnClass} border-none shadow-md hover:opacity-90` : theme.buttonOutline}`}>
                          查看详情
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 教学优势 */}
      <section id="advantages" className={`py-20 sm:py-32 relative overflow-hidden ${globalTheme === 'playful' ? 'bg-secondary/10' : theme.sectionBg}`}>
        {/* 背景装饰 */}
        {globalTheme === 'playful' && (
          <>
            <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-background to-transparent"></div>
            <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-background to-transparent"></div>
          </>
        )}
        <div className={`absolute top-20 left-10 text-9xl opacity-5 rotate-12 select-none ${theme.text}`}>🎮</div>
        <div className={`absolute bottom-20 right-10 text-9xl opacity-5 -rotate-12 select-none ${theme.text}`}>🤖</div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-6 ${theme.text}`}>
              快乐学习的秘密武器
            </h2>
            <p className={`text-lg ${theme.mutedText}`}>
              在这里，学习不是枯燥的任务，而是一场有趣的冒险
            </p>
          </div>
          
          <div className="relative overflow-hidden -mx-4 px-4 sm:overflow-visible">
            <div className="flex overflow-x-auto gap-6 pb-8 snap-x hide-scrollbar sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:pb-0 sm:overflow-visible">
              {advantages.map((item, index) => (
                <div key={index} className="flex-none w-[280px] sm:w-auto snap-center h-full">
                  <Card className={`${globalTheme === 'playful' ? 'border-none shadow-lg rounded-[2rem]' : theme.card} hover:-translate-y-2 transition-transform duration-300 overflow-hidden h-full`}>
                    <CardContent className="p-8 text-center h-full flex flex-col items-center">
                      <div className={`w-20 h-20 rounded-full ${globalTheme === 'playful' ? item.colorClass : theme.sectionBg} flex items-center justify-center mb-6 animate-pulse-glow`}>
                        <item.icon className={`w-10 h-10 ${globalTheme === 'playful' ? '' : theme.primary}`} />
                      </div>
                      <h3 className={`font-bold text-xl mb-3 ${theme.text}`}>{item.title}</h3>
                      <p className={`${theme.mutedText} leading-relaxed`}>
                        {item.desc}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 学员风采 */}
      <section id="awards" className="py-20 sm:py-32">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-4">
            <div className="text-left">
              <span className={`inline-block py-1 px-3 rounded-full ${globalTheme === 'playful' ? 'bg-yellow-100 text-yellow-600' : `${theme.buttonOutline} border`} text-sm font-bold mb-4`}>
                🏆 小小发明家
              </span>
              <h2 className={`text-3xl sm:text-4xl font-bold mb-2 ${theme.text}`}>荣誉榜单</h2>
              <p className={theme.mutedText}>每一个奖杯背后，都是孩子努力思考的汗水</p>
            </div>
            <Button variant="outline" className={`hidden md:flex ${theme.buttonOutline} rounded-full`}>
              查看更多荣誉 <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
          
          <div className="relative overflow-hidden -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex overflow-x-auto gap-6 pb-8 snap-x hide-scrollbar">
              {awards.map((award, index) => (
                <div key={index} className="flex-none snap-center w-[280px] sm:w-[320px] md:w-[calc(33.333%-16px)] lg:w-[calc(25%-18px)]">
                  <div className={`${globalTheme === 'playful' ? 'bg-white rounded-[2rem] border-2 border-dashed border-gray-200 hover:border-yellow-400' : theme.card} p-2 transition-colors duration-300 h-full`}>
                    <div className={`${globalTheme === 'playful' ? 'bg-yellow-50/50 rounded-[1.5rem]' : theme.sectionBg} p-6 h-full flex flex-col relative overflow-hidden group rounded-xl`}>
                      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-150 duration-500 ${theme.primary}`}>
                        <Trophy className="w-24 h-24" />
                      </div>
                      
                      <div className="flex items-start justify-between mb-6 relative z-10">
                        <div className={`p-3 rounded-2xl shadow-sm ${globalTheme === 'playful' ? 'bg-white text-yellow-500' : `${theme.card} ${theme.primary}`}`}>
                          <Trophy className="w-8 h-8" />
                        </div>
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${globalTheme === 'playful' ? 'bg-white text-muted-foreground' : `${theme.card} ${theme.mutedText}`} shadow-sm uppercase tracking-wider`}>
                          {award.match}
                        </span>
                      </div>
                      
                      <div className="mt-auto relative z-10">
                        <h3 className={`text-xl font-bold mb-1 group-hover:${globalTheme === 'playful' ? 'text-primary' : theme.primary} transition-colors ${theme.text}`}>{award.name}</h3>
                        <p className={`text-sm ${theme.mutedText} mb-4`}>{award.school}</p>
                        <div className={`flex items-center font-bold ${globalTheme === 'playful' ? 'text-yellow-600 bg-white/80' : `${theme.primary} ${theme.card}`} backdrop-blur py-2 px-3 rounded-xl inline-flex shadow-sm`}>
                          <Medal className="w-5 h-5 mr-2" />
                          {award.award}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-4 text-center md:hidden">
            <Button variant="outline" className={`w-full ${theme.buttonOutline} rounded-full`}>
              查看更多荣誉 <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* 名师团队 */}
      <section id="teachers" className={`py-20 sm:py-32 ${globalTheme === 'playful' ? 'bg-primary/5' : theme.sectionBg}`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className={`inline-block py-1 px-3 rounded-full ${globalTheme === 'playful' ? 'bg-blue-100 text-blue-600' : `${theme.buttonOutline} border`} text-sm font-bold mb-4`}>
              👩‍🏫 明星导师
            </span>
            <h2 className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-6 ${theme.text}`}>
              和有趣的老师做朋友
            </h2>
            <p className={`text-lg ${theme.mutedText}`}>
              不仅技术过硬，更是孩子们的良师益友
            </p>
          </div>
          
          <div className="relative overflow-hidden -mx-4 px-4 sm:overflow-visible">
            <div className="flex overflow-x-auto gap-8 pb-8 snap-x hide-scrollbar sm:grid sm:grid-cols-2 md:grid-cols-3 sm:pb-0 sm:overflow-visible">
              {teachers.map((teacher, index) => (
                <div key={index} className="flex-none w-[280px] sm:w-auto snap-center group relative">
                  {globalTheme === 'playful' && <div className="absolute inset-0 bg-black/5 rounded-[2.5rem] transform translate-y-4 translate-x-4 transition-transform group-hover:translate-y-6 group-hover:translate-x-6"></div>}
                  <Card className={`relative overflow-hidden ${globalTheme === 'playful' ? 'rounded-[2.5rem] border-4 border-white' : `${theme.card} rounded-xl`} shadow-none transition-transform hover:-translate-y-2 h-full`}>
                    <div className={`aspect-[4/3] w-full overflow-hidden ${globalTheme === 'playful' ? 'bg-blue-50' : theme.bg} relative`}>
                      <img
                        src={teacher.image}
                        alt={teacher.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                         <p className="text-white text-sm">{teacher.desc}</p>
                      </div>
                    </div>
                    <CardContent className={`p-6 text-center ${globalTheme === 'playful' ? 'bg-white' : theme.bg} relative`}>
                      <div className={`absolute -top-10 left-1/2 transform -translate-x-1/2 ${globalTheme === 'playful' ? 'bg-white' : theme.card} p-2 rounded-full`}>
                         <div className={`${globalTheme === 'playful' ? 'bg-primary/10' : theme.sectionBg} p-2 rounded-full`}>
                            <Smile className={`w-6 h-6 ${globalTheme === 'playful' ? 'text-primary' : theme.primary}`} />
                         </div>
                      </div>
                      <h3 className={`text-xl font-bold mb-1 mt-4 ${theme.text}`}>{teacher.name}</h3>
                      <p className={`text-sm font-bold uppercase tracking-wider mb-2 ${globalTheme === 'playful' ? 'text-primary' : theme.primary}`}>{teacher.title}</p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 联系我们 */}
      <section id="contact" className="py-20 sm:py-32 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className={`max-w-4xl mx-auto ${globalTheme === 'playful' ? 'bg-white rounded-[3rem] border-4 border-white' : `${theme.card} rounded-xl`} shadow-2xl overflow-hidden`}>
            <div className="grid md:grid-cols-2">
               <div className={`${globalTheme === 'playful' ? 'bg-primary' : theme.sectionBg} p-10 ${globalTheme === 'playful' ? 'text-white' : theme.text} flex flex-col justify-center relative overflow-hidden`}>
                  {globalTheme === 'playful' && (
                    <>
                      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                      <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full -ml-10 -mb-10 blur-xl"></div>
                    </>
                  )}
                  
                  <h2 className="text-3xl font-bold mb-6 relative z-10">开启编程之旅</h2>
                  <p className={`${globalTheme === 'playful' ? 'text-primary-foreground/90' : theme.mutedText} mb-8 relative z-10`}>
                    有任何问题？欢迎随时联系我们！
                    预约试听，让孩子迈出科技第一步。
                  </p>
                  
                  <div className="space-y-6 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full ${globalTheme === 'playful' ? 'bg-white/20' : theme.bg} flex items-center justify-center backdrop-blur-sm`}>
                        <MapPin className={`w-5 h-5 ${globalTheme === 'playful' ? '' : theme.primary}`} />
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${globalTheme === 'playful' ? 'opacity-80' : theme.mutedText}`}>校区地址</p>
                        <p className="font-bold">{contactInfo.address}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full ${globalTheme === 'playful' ? 'bg-white/20' : theme.bg} flex items-center justify-center backdrop-blur-sm`}>
                        <Phone className={`w-5 h-5 ${globalTheme === 'playful' ? '' : theme.primary}`} />
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${globalTheme === 'playful' ? 'opacity-80' : theme.mutedText}`}>咨询电话</p>
                        <p className="font-bold text-lg">{contactInfo.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full ${globalTheme === 'playful' ? 'bg-white/20' : theme.bg} flex items-center justify-center backdrop-blur-sm`}>
                        <Mail className={`w-5 h-5 ${globalTheme === 'playful' ? '' : theme.primary}`} />
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${globalTheme === 'playful' ? 'opacity-80' : theme.mutedText}`}>电子邮箱</p>
                        <p className="font-bold">{contactInfo.email}</p>
                      </div>
                    </div>
                  </div>
               </div>
               
               <div className={`p-10 flex flex-col justify-center items-center text-center ${globalTheme !== 'playful' ? theme.bg : ''}`}>
                  <div className={`mb-6 ${globalTheme === 'playful' ? 'bg-orange-100 p-6 rounded-full inline-block' : theme.sectionBg} ${globalTheme !== 'playful' ? 'rounded-full inline-block p-6' : ''}`}>
                     <Rocket className={`w-12 h-12 ${theme.primary} animate-bounce-soft`} />
                  </div>
                  <h3 className={`text-2xl font-bold mb-3 ${theme.text}`}>免费预约试听课</h3>
                  <p className={`${theme.mutedText} mb-8`}>
                    填写信息或直接致电，我们的课程顾问会为您安排最适合的体验课程。
                  </p>
                  <Button size="lg" className={`w-full ${globalTheme === 'playful' ? 'rounded-full h-14 text-lg shadow-xl shadow-primary/20' : 'h-12'} ${theme.button} hover:scale-105 transition-transform`} onClick={() => handleApplyClick('contact')}>
                    立即预约体验
                  </Button>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-10 border-t ${globalTheme === 'playful' ? 'bg-white' : `${theme.bg} ${theme.nav}`}`}>
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${globalTheme === 'playful' ? 'bg-primary/10' : theme.sectionBg}`}>
                <Rocket className={`w-5 h-5 ${theme.primary}`} />
              </div>
              <span className={`font-bold text-lg ${theme.text}`}>轻近编程</span>
            </div>
            <div className={`text-sm ${theme.mutedText} text-center md:text-right`}>
              <p>&copy; 2024 青少年编程中心. All rights reserved.</p>
              <p className="mt-1 text-xs">用爱与科技，点亮孩子的未来</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
