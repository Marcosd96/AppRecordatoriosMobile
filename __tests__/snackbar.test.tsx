import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import {
  SNACKBAR_DURATION_MS,
  SnackbarMessage,
  SnackbarProvider,
  useSnackbar,
} from '../src/context/SnackbarContext';

jest.mock('../src/hooks/queries', () => ({ useIsOnline: () => true }));

let show: (snackbar: SnackbarMessage) => void = () => {};

function Trigger() {
  show = useSnackbar().showSnackbar;
  return null;
}

function renderProvider() {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  act(() => {
    renderer = ReactTestRenderer.create(
      <SnackbarProvider bottomOffset={60}>
        <Trigger />
      </SnackbarProvider>,
    );
  });
  return renderer!;
}

const texts = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAllByType(Text).map(node => node.props.children);

describe('SnackbarProvider', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('muestra el mensaje y lo oculta solo pasado el tiempo', () => {
    const renderer = renderProvider();
    act(() => show({ message: 'Empresa eliminada' }));
    expect(texts(renderer)).toContain('Empresa eliminada');

    act(() => {
      jest.advanceTimersByTime(SNACKBAR_DURATION_MS);
    });
    expect(texts(renderer)).not.toContain('Empresa eliminada');
    act(() => renderer.unmount());
  });

  it('un mensaje nuevo reemplaza al anterior', () => {
    const renderer = renderProvider();
    act(() => show({ message: 'Primero' }));
    act(() => show({ message: 'Segundo' }));
    expect(texts(renderer)).toEqual(['Segundo']);
    act(() => renderer.unmount());
  });

  it('ejecuta la acción y se cierra', () => {
    const onAction = jest.fn();
    const renderer = renderProvider();
    act(() => show({ message: 'Tarea completada', actionLabel: 'Deshacer', onAction }));

    const action = renderer.root.findByProps({ accessibilityRole: 'button' });
    act(() => action.props.onPress());

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(texts(renderer)).not.toContain('Tarea completada');
    act(() => renderer.unmount());
  });
});
