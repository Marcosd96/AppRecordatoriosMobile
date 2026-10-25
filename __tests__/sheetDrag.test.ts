import { sheetOffset, shouldDismissSheet } from '../src/hooks/useSheetDrag';

describe('sheetOffset', () => {
  it('sigue al dedo hacia abajo', () => {
    expect(sheetOffset(120)).toBe(120);
  });

  it('hacia arriba cede poco y con tope', () => {
    expect(sheetOffset(-40)).toBe(-10);
    expect(sheetOffset(-400)).toBe(-32);
  });
});

describe('shouldDismissSheet', () => {
  it('se cierra al pasar un tercio de la altura', () => {
    expect(shouldDismissSheet(200, 0, 600)).toBe(true);
    expect(shouldDismissSheet(150, 0, 600)).toBe(false);
  });

  it('un gesto rápido hacia abajo la cierra aunque sea corto', () => {
    expect(shouldDismissSheet(40, 1.5, 600)).toBe(true);
  });

  it('nunca se cierra arrastrando hacia arriba', () => {
    expect(shouldDismissSheet(-200, 3, 600)).toBe(false);
  });
});
