import { CommonModule } from '@angular/common';
import { render } from '@testing-library/angular';
import { NgJsonEditorModule } from 'ang-jsoneditor';
import { MockBuilder } from 'ng-mocks';
import { NuverialJsonEditorWrapperComponent } from './json-editor.component';

const dependencies = MockBuilder(NuverialJsonEditorWrapperComponent).keep(CommonModule).keep(NgJsonEditorModule).build();

const getFixture = async (props: Record<string, Record<string, unknown>>) => {
  const { fixture } = await render(NuverialJsonEditorWrapperComponent, {
    ...dependencies,
    ...props,
  });

  return { fixture };
};

describe('JsonEditorWrapperComponent', () => {
  it('should create', async () => {
    const { fixture } = await getFixture({});
    expect(fixture).toBeTruthy();
  });

  describe('initJsonEditorOptions', () => {
    it('should set jsonEditorOptions', async () => {
      const { fixture } = await getFixture({});
      const component = fixture.componentInstance;
      component.initJsonEditorOptions();
      expect(component.jsonEditorOptions).toBeTruthy();
      expect(component.jsonEditorOptions.mode).toEqual('code');
      expect(component.jsonEditorOptions.modes).toEqual(['code', 'text', 'tree', 'view']);
    });
  });
});
