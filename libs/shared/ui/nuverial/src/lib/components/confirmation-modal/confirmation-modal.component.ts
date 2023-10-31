import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy } from '@ngneat/until-destroy';
import { NuverialButtonComponent } from '../button';

export enum ConfirmationModalReponses {
  Confirm = 'confirm',
}

export interface ConfirmationModalData {
  nuverialConfirmationModalText: string;
  nuverialConfirmationModalButtonLabel: string;
}

@UntilDestroy()
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatDialogModule, NuverialButtonComponent],
  selector: 'nuverial-confirmation-modal',
  standalone: true,
  styleUrls: ['./confirmation-modal.component.scss'],
  templateUrl: './confirmation-modal.component.html',
})
export class ConfirmationModalComponent {
  constructor(public dialog: MatDialogRef<ConfirmationModalComponent>, @Inject(MAT_DIALOG_DATA) public modalData: ConfirmationModalData) {}

  public onApprove(): void {
    this.dialog.close(ConfirmationModalReponses.Confirm);
  }
}
