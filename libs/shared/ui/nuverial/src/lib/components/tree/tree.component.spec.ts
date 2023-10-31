import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe } from 'jest-axe';
import { NuverialTreeComponent } from './tree.component';

interface TreeNode {
  children: TreeNode[];
  expanded: boolean;
  icon?: string;
  key: string;
  label: string;
}

export const mockTree: TreeNode = {
  children: [
    {
      children: [
        {
          children: [],
          expanded: true,
          key: 'Child1a',
          label: 'Child1a',
        },
      ],
      expanded: true,
      key: 'Child1',
      label: 'Child1',
    },
    {
      children: [
        {
          children: [],
          expanded: true,
          key: 'OtherSchema',
          label: 'Other Schema',
        },
      ],
      expanded: true,
      key: 'OtherSchema',
      label: 'Other Schema',
    },
  ],
  expanded: true,
  key: 'Root',
  label: 'Root',
};

describe('NuverialTreeComponent', () => {
  let component: NuverialTreeComponent;
  let fixture: ComponentFixture<NuverialTreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NuverialTreeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NuverialTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Accessibility', () => {
    it('should have no violations', async () => {
      const axeResults = await axe(fixture.nativeElement);
      expect(axeResults).toHaveNoViolations();
    });
  });

  describe('onSelect', () => {
    it('should emit the full schema key of the child selected node', () => {
      component.root = mockTree;
      const spy = jest.spyOn(component.nodeSelected, 'emit');

      component.onSelect(component.root.children[0]);

      expect(spy).toHaveBeenCalledWith('Root.Child1');
    });

    it('should emit the key of the root node', () => {
      component.root = mockTree;
      const spy = jest.spyOn(component.nodeSelected, 'emit');

      component.onSelect(component.root);

      expect(spy).toHaveBeenCalledWith('Root');
    });
  });

  describe('toggleExpanded', () => {
    it('should toggle the expanded property of the node', () => {
      component.root = mockTree;

      component.toggleExpanded(component.root);

      expect(component.root.expanded).toBeFalsy();

      component.toggleExpanded(component.root);

      expect(component.root.expanded).toBeTruthy();
    });

    it('should mark the component for check', () => {
      component.root = mockTree;

      const spy = jest.spyOn(component['_changeDetectorRef'], 'markForCheck');

      component.toggleExpanded(component.root);

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('trackByFn', () => {
    it('should return the index', () => {
      expect(component.trackByFn(0)).toBe(0);
      expect(component.trackByFn(1)).toBe(1);
      expect(component.trackByFn(2)).toBe(2);
    });
  });
});
