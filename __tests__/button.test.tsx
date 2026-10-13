import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import Button from '../src/components/Button';

function renderButton(props: Partial<React.ComponentProps<typeof Button>> = {}) {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  act(() => {
    renderer = ReactTestRenderer.create(<Button label="Guardar tarea" onPress={jest.fn()} {...props} />);
  });
  // NativeWind envuelve Pressable: se busca el primer nodo con el rol de botón
  return renderer!.root.findAll(node => node.props.accessibilityRole === 'button')[0];
}

describe('Button', () => {
  it('durante la carga no admite pulsaciones y lo anuncia como ocupado', () => {
    const pressable = renderButton({ busy: true });
    expect(pressable.props.disabled).toBe(true);
    expect(pressable.props.accessibilityState).toEqual({ disabled: true, busy: true });
  });

  it('deshabilitado lo anuncia a los lectores de pantalla', () => {
    const pressable = renderButton({ disabled: true });
    expect(pressable.props.accessibilityState).toEqual({ disabled: true, busy: false });
  });

  it('el mediano amplía el área táctil hasta 48 dp', () => {
    expect(renderButton({ size: 'medium' }).props.hitSlop).toBe(4);
    expect(renderButton({ size: 'large' }).props.hitSlop).toBe(0);
  });
});
