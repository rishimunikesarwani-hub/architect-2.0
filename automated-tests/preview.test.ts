import { describe, expect, it } from 'vitest';
import { createProject, previewHtml } from '../application/data';

function mountSampleScript(html: string) {
  const request = { value: '' };
  const result = { textContent: '' };
  const run = { onclick: undefined as (() => void) | undefined };
  const elements = { request, result, run };
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1]);
  expect(scripts).toHaveLength(1);
  const document = { getElementById: (id: keyof typeof elements) => elements[id] };
  new Function('document', scripts[0])(document);
  return { request, result, run };
}

describe('generated interactive preview', () => {
  it('runs the generated entry-point script and responds to a real input', () => {
    const project = createProject('Build a research copilot for product managers');
    const html = project.state.files.find((entry) => entry.path === 'index.html')!.content;
    const { request, result, run } = mountSampleScript(html);
    expect(run.onclick).toBeTypeOf('function');
    run.onclick!();
    expect(result.textContent).toContain('Add a request');
    request.value = 'Investigate changes in customer feedback';
    run.onclick!();
    expect(result.textContent).toContain(request.value);
    expect(result.textContent).toContain('not a live agent response');
  });

  it('treats user-provided project metadata as text rather than preview code', () => {
    const hostile = '</script><script>globalThis.__unexpected = true</script>';
    const html = previewHtml(hostile, '<img src=x onerror=alert(1)>');
    expect(html).not.toContain(hostile);
    expect(html).not.toContain('<img src=x');
    const { request, result, run } = mountSampleScript(html);
    request.value = '<script>attempt</script>';
    run.onclick!();
    expect(result.textContent).toContain('<script>attempt</script>');
  });
});
