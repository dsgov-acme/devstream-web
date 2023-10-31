import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { SchemaTreeDefinitionMock, SchemaTreeDefinitionModel, WorkApiRoutesService } from '@dsg/shared/data-access/work-api';
import { NuverialSnackBarService } from '@dsg/shared/ui/nuverial';
import { LoggingService } from '@dsg/shared/utils/logging';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { SchemaKeySelectorModalComponent } from './schema-key-selector-modal.component';

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

const schemaTreeMock = new SchemaTreeDefinitionModel(SchemaTreeDefinitionMock);
global.structuredClone = (val: unknown) => JSON.parse(JSON.stringify(val));

describe('SchemaKeySelectorComponent', () => {
  let component: SchemaKeySelectorModalComponent;
  let fixture: ComponentFixture<SchemaKeySelectorModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchemaKeySelectorModalComponent, NoopAnimationsModule],
      providers: [
        MockProvider(WorkApiRoutesService, {
          schemaTree$: of(schemaTreeMock),
        }),
        MockProvider(NuverialSnackBarService),
        MockProvider(LoggingService),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ transactionDefinitionKey: 'FinancialBenefit' })),
          },
        },
        { provide: MAT_DIALOG_DATA, useValue: 'FinancialBenefit' },
        {
          provide: MatDialogRef,
          useValue: {
            close: jest.fn().mockReturnValue('FinancialBenefit'),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SchemaKeySelectorModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('loadSchemaTree$', () => {
    it('should set baseSchemaTree to the tree representation of the response items', () => {
      component.loadSchemaTree$.subscribe();

      expect(component.baseSchemaTree).toEqual(SchemaTreeDefinitionModel.toTree(SchemaTreeDefinitionMock));
    });

    it('should call getSchemasList', () => {
      jest.spyOn(component, 'getSchemasList');

      component.loadSchemaTree$.subscribe();

      expect(component.getSchemasList).toHaveBeenCalled();
    });
  });

  describe('filterSchemaTree', () => {
    it('should set schemaTree to baseSchemaTree when searchText is falsy', () => {
      component.baseSchemaTree = { children: [], expanded: true, key: 'root', label: 'Root' };
      component.schemaTree = { children: [], expanded: true, key: 'child', label: 'Child' };

      component.filterSchemaTree('');

      expect(component.schemaTree).toEqual(component.baseSchemaTree);
    });

    it('should filter with deep partial matching when searchText is single step', () => {
      const searchText = 'other';
      const expectedTree = {
        children: [
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

      component.baseSchemaTree = mockTree;

      component.filterSchemaTree(searchText);

      expect(component.schemaTree).toEqual(expectedTree);
    });

    it('should filter with exact intermediate step matching when searchText is full path', () => {
      const searchText = 'child1.child1a';
      const expectedTree = {
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
        ],
        expanded: true,
        key: 'Root',
        label: 'Root',
      };

      component.baseSchemaTree = mockTree;

      component.filterSchemaTree(searchText);

      expect(component.schemaTree).toEqual(expectedTree);
    });
  });

  describe('searching', () => {
    it('should clear the search input', () => {
      component.searchInput.setValue('test');
      fixture.detectChanges();

      const containerDebugElement = fixture.debugElement.query(By.css('nuverial-text-input'));
      expect(containerDebugElement).toBeTruthy();

      const clearIconDebugElement = containerDebugElement.query(By.css('nuverial-button'));
      expect(clearIconDebugElement).toBeTruthy();

      clearIconDebugElement.triggerEventHandler('click', null);
      expect(component.searchInput.value).toEqual('');
    });

    it('should set the search box icon', () => {
      fixture.detectChanges();

      const containerDebugElement = fixture.debugElement.query(By.css('nuverial-text-input'));
      expect(containerDebugElement).toBeTruthy();

      const buttonDebugElement = containerDebugElement.query(By.css('nuverial-button'));
      expect(buttonDebugElement).toBeTruthy();

      const iconDebugElement = buttonDebugElement.query(By.css('nuverial-icon'));
      expect(iconDebugElement).toBeTruthy();

      let iconName = iconDebugElement.nativeElement.getAttribute('ng-reflect-icon-name');
      expect(iconName).toBe('search');

      component.searchInput.setValue('test');
      containerDebugElement.triggerEventHandler('keyup', {});
      fixture.detectChanges();

      iconName = iconDebugElement.nativeElement.getAttribute('ng-reflect-icon-name');
      expect(iconName).toBe('cancel_outline');
    });

    it('should call filterSchemaTree with proper filters when searchText has a value', async () => {
      const spy = jest.spyOn(component, 'filterSchemaTree');
      const searchText = 'some search text';
      const containerDebugElement = fixture.debugElement.query(By.css('nuverial-text-input'));
      expect(containerDebugElement).toBeTruthy();

      component.searchInput.setValue(searchText);
      containerDebugElement.triggerEventHandler('keyup.enter', {});
      component.filteredSchemaTree$.subscribe();

      expect(spy).toHaveBeenCalledWith(searchText);
    });

    it('should call getTransactionDefinitionsList$ with proper filters when searchText is empty', () => {
      const spy = jest.spyOn(component, 'filterSchemaTree');
      const containerDebugElement = fixture.debugElement.query(By.css('nuverial-text-input'));
      expect(containerDebugElement).toBeTruthy();

      component.searchInput.setValue('');
      containerDebugElement.triggerEventHandler('keyup.enter', {});
      component.filteredSchemaTree$.subscribe();

      expect(spy).toHaveBeenCalledWith('');
    });
  });

  describe('selectSchemaKey', () => {
    it('should set selectedSchemaKey to the key of the selected schema', () => {
      const event = 'root.Child1.Child1a';

      component.selectSchemaKey(event);

      expect(component.selectedSchemaKey).toEqual('Child1.Child1a');
    });
  });

  describe('clearSelectedSchemaKey', () => {
    it('should set selectedSchemaKey to empty string', () => {
      component.selectedSchemaKey = 'some value';

      component.clearSelectedSchemaKey();

      expect(component.selectedSchemaKey).toEqual('');
    });
  });
});
