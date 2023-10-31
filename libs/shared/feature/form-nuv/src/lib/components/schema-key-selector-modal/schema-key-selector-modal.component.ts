import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ISchemaDefinition, SchemaTreeDefinitionModel, WorkApiRoutesService } from '@dsg/shared/data-access/work-api';
import { NuverialButtonComponent, NuverialIconComponent, NuverialTextInputComponent, NuverialTreeComponent } from '@dsg/shared/ui/nuverial';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BehaviorSubject, ReplaySubject, tap } from 'rxjs';

interface TreeNode {
  children: TreeNode[];
  expanded: boolean;
  icon?: string;
  key: string;
  label: string;
}

@UntilDestroy()
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NuverialTextInputComponent, NuverialTreeComponent, NuverialButtonComponent, NuverialIconComponent],
  selector: 'dsg-schema-key-selector-modal',
  standalone: true,
  styleUrls: ['./schema-key-selector-modal.component.scss'],
  templateUrl: './schema-key-selector-modal.component.html',
})
export class SchemaKeySelectorModalComponent implements OnInit {
  public searchInput = new FormControl();
  public searchBoxIcon = 'search';
  public schemaList: ISchemaDefinition[] = [];
  public schemaTree!: TreeNode;
  public selectedSchemaKey = '';
  public baseSchemaTree!: TreeNode;
  public transactionDefinitionKey = new ReplaySubject<string>(1);

  private readonly _searchFilter: BehaviorSubject<string> = new BehaviorSubject<string>('');

  public loadSchemaTree$ = this._workApiRoutesService.schemaTree$.pipe(
    tap(schemaTree => {
      this.baseSchemaTree = SchemaTreeDefinitionModel.toTree(schemaTree);
      this.getSchemasList();
    }),
  );

  public filteredSchemaTree$ = this._searchFilter.asObservable().pipe(
    tap(searchText => {
      this.filterSchemaTree(searchText);
      this._changeDetectorRef.markForCheck();
    }),
    untilDestroyed(this),
  );

  // Filters base tree by key, ignoring root key in text and tree
  public filterSchemaTree(searchText: string): void {
    if (!searchText) {
      this.schemaTree = structuredClone(this.baseSchemaTree);

      return;
    }

    const searchSteps = searchText.toLowerCase().split('.');
    let root: TreeNode = {
      children: [],
      expanded: true,
      key: this.baseSchemaTree.key,
      label: this.baseSchemaTree.label,
    };

    if (searchSteps.length === 1) {
      // Single step search, return partial matches anywhere
      root = this.filterSchemaTreeSingleStep(searchSteps[0], this.baseSchemaTree) ?? root;
    } else {
      // Multi step search, expect intermediate steps to full match
      root.children = this.filterSchemaTreeMultiStep(0, searchSteps, this.baseSchemaTree);
    }

    this.schemaTree = root;
  }

  // searchStep is lowercase
  private filterSchemaTreeSingleStep(searchStep: string, currentNode: TreeNode): TreeNode | null {
    const partialMatch = currentNode.key.toLowerCase().includes(searchStep);

    // End of search steps, return deep copy of current node on partial match
    if (partialMatch && currentNode !== this.baseSchemaTree) {
      return structuredClone(currentNode);
    }

    const currentSubtree: TreeNode = {
      children: [],
      expanded: true,
      key: currentNode.key,
      label: currentNode.label,
    };

    currentNode.children.forEach(child => {
      const childSubtree = this.filterSchemaTreeSingleStep(searchStep, child);
      if (childSubtree) currentSubtree.children.push(childSubtree);
    });

    if (currentSubtree.children.length) return currentSubtree;

    return null;
  }

  // searchSteps is lowercase
  private filterSchemaTreeMultiStep(step: number, searchSteps: string[], currentNode: TreeNode): TreeNode[] {
    if (currentNode.children.length === 0) return [];

    const treeNodes: TreeNode[] = [];
    const searchStep = searchSteps[step];

    if (step < searchSteps.length - 1) {
      // Full match in intermediate steps
      // Only add intermediate node's children if their decendants match subsequent search steps

      currentNode.children.forEach((child: TreeNode) => {
        const childNode: TreeNode = {
          children: this.filterSchemaTreeMultiStep(step + 1, searchSteps, child),
          expanded: true,
          key: child.key,
          label: child.label,
        };

        // Push only if intermediate node's child has matching descendants
        if (childNode.children.length && childNode.key.toLowerCase() === searchStep) treeNodes.push(childNode);
      });
    } else {
      // Last step of search, partial match all children
      currentNode.children.forEach(child => {
        const childSubtree = this.filterSchemaTreeSingleStep(searchStep, child);
        if (childSubtree) {
          treeNodes.push(childSubtree);
        }
      });
    }

    return treeNodes;
  }

  constructor(
    private readonly _workApiRoutesService: WorkApiRoutesService,
    private readonly _changeDetectorRef: ChangeDetectorRef,
    private readonly _dialog: MatDialogRef<SchemaKeySelectorModalComponent>,
    @Inject(MAT_DIALOG_DATA) public key: string,
  ) {}

  public ngOnInit(): void {
    this.filteredSchemaTree$.subscribe();
    this.transactionDefinitionKey.next(this.key);
  }

  public getSchemasList(): void {
    const searchText = this.searchInput.value ? this.searchInput.value.trim().toLowerCase() : '';
    this._searchFilter.next(searchText);
  }

  public setSearchBoxIcon(): void {
    const searchText = this.searchInput.value ? this.searchInput.value.trim().toLowerCase() : '';
    this.searchBoxIcon = searchText ? 'cancel_outline' : 'search';
  }

  public clearSearch(): void {
    this.searchInput.setValue('');
    this.setSearchBoxIcon();
    this.getSchemasList();
  }

  public selectSchemaKey(event: string): void {
    const key = event.split('.').slice(1).join('.');
    this.selectedSchemaKey = key;
  }

  public clearSelectedSchemaKey(): void {
    this.selectedSchemaKey = '';
    this._changeDetectorRef.markForCheck();
  }

  public closeDialog(): void {
    this._dialog.close(null);
  }

  public submitDialog(): void {
    this._dialog.close(this.selectedSchemaKey);
  }
}
