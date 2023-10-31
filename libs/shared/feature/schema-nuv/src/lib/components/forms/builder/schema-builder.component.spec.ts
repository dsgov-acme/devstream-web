import { render } from '@testing-library/angular';
import { axe } from 'jest-axe';
import { MockBuilder } from 'ng-mocks';
import { SchemaBuilderComponent } from './schema-builder.component';
global.structuredClone = jest.fn(obj => obj);

const dependencies = MockBuilder(SchemaBuilderComponent).build();

const getFixture = async (props: Record<string, Record<string, unknown>>) => {
  const { fixture } = await render(SchemaBuilderComponent, {
    ...dependencies,
    ...props,
  });
  const component = fixture.componentInstance;

  return { component, fixture };
};

describe('SchemaBuilderComponent', () => {
  it('should create', async () => {
    const { fixture } = await getFixture({});

    expect(fixture).toBeTruthy();
  });

  it('should have no accessibility violations', async () => {
    const { fixture } = await getFixture({});
    const results = await axe(fixture.nativeElement);

    expect(results).toHaveNoViolations();
  });
});
