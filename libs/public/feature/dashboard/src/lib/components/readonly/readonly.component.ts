import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IRendererFormConfigurationSchema } from '@dsg/shared/data-access/work-api';
import { FormRendererComponent, FormTransactionService, NuvalenceFormRendererOptions, PublicPortalReviewRendererOptions } from '@dsg/shared/feature/form-nuv';
import {
  NuverialAccordionComponent,
  NuverialBreadcrumbComponent,
  NuverialButtonComponent,
  NuverialFooterComponent,
  NuverialIconComponent,
  NuverialSpinnerComponent,
} from '@dsg/shared/ui/nuverial';
import { Observable, map, tap } from 'rxjs';

export enum StatusLabelColors {
  Black = 'status__label--black',
  Green = 'status__label--green',
  Red = 'status__label--red',
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormRendererComponent,
    NuverialAccordionComponent,
    NuverialBreadcrumbComponent,
    NuverialSpinnerComponent,
    NuverialIconComponent,
    NuverialButtonComponent,
    NuverialFooterComponent,
  ],
  selector: 'dsg-readonly',
  standalone: true,
  styleUrls: ['./readonly.component.scss'],
  templateUrl: './readonly.component.html',
})
export class ReadonlyComponent {
  public reviewRendererOptions: NuvalenceFormRendererOptions = PublicPortalReviewRendererOptions;
  public statusLabelColorClass = StatusLabelColors.Black;
  public externalTransactionId = '';

  public transaction$ = this._formTransactionService.transaction$.pipe(
    tap(transactionModel => {
      const status = transactionModel.status;
      if (status === 'Approved') {
        this.statusLabelColorClass = StatusLabelColors.Green;
      } else if (status === 'Denied') {
        this.statusLabelColorClass = StatusLabelColors.Red;
      } else {
        this.statusLabelColorClass = StatusLabelColors.Black;
      }

      this.externalTransactionId = transactionModel.externalId;
    }),
  );

  public reviewFormFields$?: Observable<IRendererFormConfigurationSchema[]> = this._formTransactionService.formConfiguration$.pipe(
    map(formConfigurationModel => formConfigurationModel?.toReviewForm()),
  );

  public formData$?: Observable<Record<string, unknown>> = this.transaction$.pipe(
    map(transactionModel => transactionModel?.data as unknown as Record<string, unknown>),
  );

  constructor(private readonly _formTransactionService: FormTransactionService) {}
}
