/**
 * @format
 */

import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import ErrorBoundary from '../src/components/ErrorBoundary';

let shouldFail = true;
function Flaky() {
  if (shouldFail) {
    throw new Error('fallo de prueba');
  }
  return <Text>contenido</Text>;
}

const texts = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAllByType(Text).map(node => node.props.children);

describe('ErrorBoundary', () => {
  beforeEach(() => jest.spyOn(console, 'error').mockImplementation(() => {}));
  afterEach(() => jest.restoreAllMocks());

  it('muestra el aviso en lugar de la pantalla que falló y permite reintentar', async () => {
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <ErrorBoundary>
          <Flaky />
        </ErrorBoundary>,
      );
    });
    expect(texts(renderer)).toContain('Algo salió mal');

    shouldFail = false;
    const retry = renderer.root.findAll(
      node => node.props.accessibilityRole === 'button' && typeof node.props.onPress === 'function',
    )[0];
    await ReactTestRenderer.act(() => retry.props.onPress());

    expect(texts(renderer)).toContain('contenido');
  });
});
