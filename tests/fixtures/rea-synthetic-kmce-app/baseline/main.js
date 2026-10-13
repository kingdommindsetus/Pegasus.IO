// SYNTHETIC TEST FIXTURE ONLY: no customers, API keys or network calls.
export const navigation = { events: '/events', registration: '/events/register' };
export const declaredPages = ['/education', '/events', '/events/register'];
export function courseRegisterHref(courseId) {
  return navigation.registration + '?courseId=' + encodeURIComponent(courseId);
}
