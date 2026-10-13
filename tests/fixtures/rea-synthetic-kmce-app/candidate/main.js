// SYNTHETIC REGRESSION ONLY: intentionally broken route for static-analysis testing.
export const navigation = { events: '/events', registration: '/events/register-missing' };
export const declaredPages = ['/education', '/events', '/events/register'];
export function courseRegisterHref(courseId) {
  return navigation.registration + '?courseId=' + encodeURIComponent(courseId);
}
