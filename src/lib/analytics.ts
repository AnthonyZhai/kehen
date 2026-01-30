import posthog from 'posthog-js';

// 统一的埋点追踪函数
export const track = (eventId: string, properties?: Record<string, unknown>) => {
  posthog.capture(eventId, properties);
  // 同时发送到 GA
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventId, properties);
  }
};

// 扩展 Window 类型
declare global {
  interface Window {
    gtag: (command: string, eventName: string, params?: Record<string, unknown>) => void;
  }
}

// ========== 教师端埋点 ==========
// 教师一键签到点击
export const trackTeacherCheckinClick = () => {
  track('t_checkin_click', { timestamp: new Date().toISOString() });
};

// ========== 家长端埋点 ==========
// 家长查看剩余课时
export const trackParentQueryHour = (studentName: string, remainingHours: number) => {
  track('p_query_hour', { student_name: studentName, remaining_hours: remainingHours });
};

// 家长查看签到照片
export const trackParentViewPhoto = (studentName: string) => {
  track('p_view_photo', { student_name: studentName });
};

// 家长点击分享
export const trackParentShareClick = (studentName: string, learnedHours: number) => {
  track('p_share_click', { student_name: studentName, learned_hours: learnedHours });
};

// 家长登录
export const trackParentLogin = (success: boolean, failReason?: string) => {
  track('p_login', { success, fail_reason: failReason });
};

// ========== 访客/首页埋点 ==========
// 访客点击免费试听
export const trackApplyClick = (source: 'hero' | 'nav' | 'contact') => {
  track('v_apply_click', { source });
};

// 访客点击课时查询
export const trackQueryClick = () => {
  track('v_query_click');
};

// 课程卡片曝光
export const trackCourseExposure = (courseName: string) => {
  track('v_course_exposure', { course_name: courseName });
};

// 访客点击课程详情
export const trackCourseClick = (courseName: string) => {
  track('v_course_click', { course_name: courseName });
};

// 导航栏点击
export const trackNavClick = (navItem: string) => {
  track('v_nav_click', { nav_item: navItem });
};

// 首页停留时长
export const trackHomeDuration = (duration: number) => {
  let durationBucket = '0-10s';
  if (duration > 30) durationBucket = '30s+';
  else if (duration > 10) durationBucket = '10-30s';
  
  track('v_home_duration', { duration_seconds: duration, duration_bucket: durationBucket });
};

// ========== 表单页埋点 ==========
// 表单页加载完成
export const trackFormPageView = () => {
  track('v_form_page_view');
};

// 表单开始填写
export const trackFormStart = () => {
  track('v_form_start', { start_time: new Date().toISOString() });
};

// 字段填写完成
export const trackFieldComplete = (fieldName: 'name' | 'course' | 'phone') => {
  track('v_field_complete', { field_name: fieldName });
};

// 提交申请点击
export const trackFormSubmit = () => {
  track('v_form_submit');
};

// 表单提交成功
export const trackFormSuccess = (submitDuration: number, courseName: string) => {
  track('v_form_success', { submit_duration: submitDuration, course_name: courseName });
};

// 表单提交失败
export const trackFormFail = (failReason: 'validation_error' | 'network_error' | 'duplicate') => {
  track('v_form_fail', { fail_reason: failReason });
};

// 返回首页点击
export const trackBackClick = () => {
  track('v_back_click');
};

// 表单填写时长
export const trackFormDuration = (duration: number) => {
  track('v_form_duration', { duration_seconds: duration });
};

// 服务条款点击
export const trackTermsClick = () => {
  track('v_terms_click');
};
