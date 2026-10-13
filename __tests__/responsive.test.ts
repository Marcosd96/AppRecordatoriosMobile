import { fontSize, getWindowClass, spacing } from '../src/hooks/useResponsive';

describe('getWindowClass', () => {
  it('usa los cortes de Material 3 (600 y 840 dp)', () => {
    expect(getWindowClass(360)).toBe('compact');
    expect(getWindowClass(599)).toBe('compact');
    expect(getWindowClass(600)).toBe('medium');
    expect(getWindowClass(839)).toBe('medium');
    expect(getWindowClass(840)).toBe('expanded');
    expect(getWindowClass(1280)).toBe('expanded');
  });
});

describe('tokens fijos', () => {
  it('no dependen del ancho de la pantalla', () => {
    // Antes se multiplicaban por ancho/375: 16 dp pasaban a ~44 dp en una tablet
    expect(spacing.md).toBe(16);
    expect(fontSize['3xl']).toBe(24);
  });
});
