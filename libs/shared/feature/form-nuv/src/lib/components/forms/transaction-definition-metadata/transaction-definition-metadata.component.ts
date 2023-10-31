import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject, Input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ITransactionMetaData } from '@dsg/shared/data-access/work-api';
import { MarkAllControlsAsTouched, NuverialButtonComponent, NuverialTextAreaComponent, NuverialTextInputComponent } from '@dsg/shared/ui/nuverial';
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatDialogModule, NuverialTextInputComponent, NuverialButtonComponent, NuverialTextAreaComponent, ReactiveFormsModule],
  selector: 'dsg-transaction-definition-metadata-component',
  standalone: true,
  styleUrls: ['./transaction-definition-metadata.component.scss'],
  templateUrl: './transaction-definition-metadata.component.html',
})
export class TransactionDefinitionMetaDataComponent {
  @Input() public metaData?: ITransactionMetaData;

  public formGroup: FormGroup;

  constructor(@Inject(MAT_DIALOG_DATA) public dialogData: ITransactionMetaData, public dialogRef: MatDialogRef<TransactionDefinitionMetaDataComponent>) {
    if (dialogData) {
      this.metaData = dialogData;
    }
    const formKeyFormControl = new FormControl(this.metaData?.formKey, [Validators.maxLength(200), Validators.required]);
    if (this.metaData?.mode === 'Update') {
      formKeyFormControl.disable();
    }
    this.formGroup = new FormGroup({
      createdBy: new FormControl(this.metaData?.createdBy),
      description: new FormControl(this.metaData?.description, [Validators.maxLength(200)]),
      formKey: formKeyFormControl,
      lastUpdatedBy: new FormControl(this.metaData?.lastUpdatedBy),
      name: new FormControl(this.metaData?.name, [Validators.maxLength(200), Validators.required]),
      schemaKey: new FormControl(this.metaData?.schemaKey, Validators.required),
    });
  }

  public loading = false;
  public onSave() {
    MarkAllControlsAsTouched(this.formGroup);
    if (this.formGroup.valid) {
      this.metaData = {
        createdBy: this.formGroup.value.createdBy,
        description: this.formGroup.value.description,
        formKey: this.metaData?.mode === 'Create' ? this.formGroup.value.formKey : this.metaData?.formKey,
        lastUpdatedBy: this.formGroup.value.lastUpdatedBy,
        mode: this.metaData?.mode,
        name: this.formGroup.value.name,
        schemaKey: this.formGroup.value.schemaKey,
        transactionDefinitionKey: this.metaData?.transactionDefinitionKey || '',
      };
      this.loading = true;
      this.dialogRef.close({ metaData: this.metaData, save: true });
    }
  }
}
