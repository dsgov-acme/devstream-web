import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { AlertModalComponent, IFormError } from '@dsg/shared/ui/nuverial';
import { FormlyModule } from '@ngx-formly/core';
import { Observable, tap } from 'rxjs';
import { FormTransactionService } from '../../../../services';
import { FormlyBaseComponent } from '../../../base';
import { LogicValidatorProperties } from '../models/formly-logic-validator.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormlyModule],
  selector: 'dsg-formly-logic-validator',
  standalone: true,
  template: '',
})
export class FormlyLogicValidatorComponent extends FormlyBaseComponent<LogicValidatorProperties> implements OnInit {
  public formErrors$: Observable<IFormError[]> = this._formTransactionService.formErrors$;

  constructor(private readonly _formTransactionService: FormTransactionService, private readonly _dialog: MatDialog) {
    super();
  }

  public ngOnInit(): void {
    this.field.className = 'formly-field-hide';

    this.formErrors$
      .pipe(
        tap(errors => {
          if (errors.some(item => item.controlName === this.field.key)) {
            this._openModal();
          }
        }),
      )
      .subscribe();
  }

  private _openModal() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = false;
    dialogConfig.data = {
      body: this.props.modalBody,
      dismissalButtonLabel: this.props.dismissalButtonLabel,
      icon: this.props.modalIcon,
      title: this.props.modalTitle,
    };
    this._dialog.open(AlertModalComponent, dialogConfig).afterClosed().subscribe();
  }
}
