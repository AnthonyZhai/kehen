-- Create public_site_settings table
create table if not exists public_site_settings (
  key text primary key,
  value text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public_site_settings enable row level security;

-- Policies
create policy "Public read access settings" on public_site_settings for select using (true);
create policy "Boss manage settings" on public_site_settings for all using (auth.role() = 'authenticated');

-- Insert default theme
insert into public_site_settings (key, value) values ('website_theme', 'playful') on conflict (key) do nothing;
