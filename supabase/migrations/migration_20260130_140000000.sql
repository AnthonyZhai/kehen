-- Create public_courses table
create table if not exists public_courses (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  age text not null,
  description text not null,
  icon_name text not null,
  color_class text not null,
  border_class text not null,
  shadow_class text not null,
  btn_class text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  sort_order integer default 0
);

-- Create public_awards table
create table if not exists public_awards (
  id uuid default gen_random_uuid() primary key,
  student_name text not null,
  school text not null,
  match_name text not null,
  award_name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  sort_order integer default 0
);

-- Create public_teachers table
create table if not exists public_teachers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  title text not null,
  description text not null,
  image_url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  sort_order integer default 0
);

-- Enable RLS
alter table public_courses enable row level security;
alter table public_awards enable row level security;
alter table public_teachers enable row level security;

-- Policies
create policy "Public read access courses" on public_courses for select using (true);
create policy "Boss manage courses" on public_courses for all using (auth.role() = 'authenticated');

create policy "Public read access awards" on public_awards for select using (true);
create policy "Boss manage awards" on public_awards for all using (auth.role() = 'authenticated');

create policy "Public read access teachers" on public_teachers for select using (true);
create policy "Boss manage teachers" on public_teachers for all using (auth.role() = 'authenticated');

-- Insert initial data (optional, but good for testing)
insert into public_courses (name, age, description, icon_name, color_class, border_class, shadow_class, btn_class, sort_order) values
('Scratch图形化编程', '6-8岁', '像搭积木一样学编程，不仅好玩还能变聪明！', 'Smile', 'bg-orange-100 text-orange-600', 'border-orange-200', 'hover:shadow-orange-200', 'bg-orange-500 hover:bg-orange-600', 1),
('Python趣味编程', '9-12岁', '用代码指挥电脑画画、做游戏，超酷的！', 'Code', 'bg-green-100 text-green-600', 'border-green-200', 'hover:shadow-green-200', 'bg-green-500 hover:bg-green-600', 2),
('C++奥赛挑战', '10-15岁', '参加比赛拿金牌，成为未来的科技之星！', 'Trophy', 'bg-blue-100 text-blue-600', 'border-blue-200', 'hover:shadow-blue-200', 'bg-blue-500 hover:bg-blue-600', 3),
('AI人工智能', '12-16岁', '和机器人做朋友，一起探索未来的秘密！', 'Brain', 'bg-purple-100 text-purple-600', 'border-purple-200', 'hover:shadow-purple-200', 'bg-purple-500 hover:bg-purple-600', 4);

insert into public_teachers (name, title, description, image_url, sort_order) values
('张老师', '教学总监', '10年青少年编程教育经验，前知名科技公司高级工程师，辅导学员多次获得国赛金奖。', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&h=200&auto=format&fit=crop', 1),
('李老师', '金牌教练', '专注于C++算法竞赛教学，计算机专业硕士，条理清晰，深受学生喜爱。', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&h=200&auto=format&fit=crop', 2),
('王老师', '资深讲师', '擅长Python与人工智能教学，注重培养孩子的逻辑思维与创新能力。', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200&h=200&auto=format&fit=crop', 3);

insert into public_awards (student_name, school, match_name, award_name, sort_order) values
('陈威豪', '东胜区第四小学', '第13届蓝桥杯', '二等奖', 1),
('宋瑾苏', '东胜区第八小学', '第13届蓝桥杯', '一等奖+二等奖', 2),
('吴腾渊', '东胜区第十二小学', '全国中小学信息技术创新与实践大赛', '一等奖', 3),
('胡学奇', '东胜区第一中学', '少年硅谷——全国青少年人工智能教育成果展示大赛', '一等奖(全国铜牌)', 4),
('杨政翰', '东胜区大兴中学', '少年硅谷', '一等奖', 5),
('杨济远', '东胜区实验中学', '少年硅谷', '一等奖', 6);
