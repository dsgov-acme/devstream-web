import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { SchemaTreeDefinitionModel, WorkApiRoutesService } from '@dsg/shared/data-access/work-api';
import { NuverialIconComponent, NuverialSnackBarService } from '@dsg/shared/ui/nuverial';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { EMPTY, catchError, switchMap, tap } from 'rxjs';
import { FormioBaseCustomComponent } from '../base';
import { SchemaKeySelectorModalComponent } from '../schema-key-selector-modal';

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
  imports: [CommonModule, NuverialIconComponent],
  selector: 'dsg-schema-key-selector',
  standalone: true,
  styleUrls: ['./schema-key-selector.component.scss'],
  templateUrl: './schema-key-selector.component.html',
})
export class SchemaKeySelectorComponent extends FormioBaseCustomComponent<string> implements OnInit {
  public selectedSchemaKey = '';

  public loadSchemaTree$ = this._route.paramMap.pipe(
    switchMap(params => {
      const transactionDefinitionKey = params.get('transactionDefinitionKey') ?? '';

      return this._workApiRoutesService.getSchemaTree$(transactionDefinitionKey).pipe(
        tap(schemaTree => {
          if (this.value) {
            const root = SchemaTreeDefinitionModel.toTree(schemaTree);
            this.checkAndSetExistingSchemaKey(this.value, root);
          }
        }),
        catchError(_ => {
          this._nuverialSnackbarService.notifyApplicationError();

          return EMPTY;
        }),
      );
    }),
    untilDestroyed(this),
  );

  constructor(
    private readonly _dialog: MatDialog,
    private readonly _changeDetectorRef: ChangeDetectorRef,
    private readonly _workApiRoutesService: WorkApiRoutesService,
    private readonly _route: ActivatedRoute,
    private readonly _nuverialSnackbarService: NuverialSnackBarService,
  ) {
    super();
  }

  // Case sensitive, not a search
  public checkAndSetExistingSchemaKey(key: string, root: TreeNode) {
    const steps = key.split('.');

    let currentNode = root;
    for (const step of steps) {
      // Continue down the tree if a child matches the key
      const matchingChild = currentNode.children.find((child: TreeNode) => child.key === step);
      if (matchingChild) {
        currentNode = matchingChild;
      } else {
        return;
      }
    }

    this.selectedSchemaKey = key;
    this.updateValue(this.selectedSchemaKey);
    this._changeDetectorRef.markForCheck();
  }

  public clearSelectedSchemaKey(): void {
    this.selectedSchemaKey = '';
    this.updateValue(this.selectedSchemaKey);
  }

  public openModal(): void {
    const dialogRef = this._dialog.open(SchemaKeySelectorModalComponent, {
      autoFocus: false,
    });

    dialogRef
      .afterClosed()
      .pipe(
        tap(response => {
          if (response) {
            this.selectedSchemaKey = response;
            this.updateValue(this.selectedSchemaKey);
            this._changeDetectorRef.markForCheck();
          }
        }),
      )
      .subscribe();
  }

  // Prompt validator
  public ngOnInit(): void {
    this.loadSchemaTree$.subscribe();
  }
}
