import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { IRendererFormConfigurationSchema, TransactionData } from '@dsg/shared/data-access/work-api';
import { NuverialButtonComponent, NuverialFormFieldErrorComponent, NuverialIconComponent } from '@dsg/shared/ui/nuverial';
import { FormlyModule } from '@ngx-formly/core';
import { Observable, map } from 'rxjs';
import { FormRendererModule } from '../../../form-renderer.module';
import { FormTransactionService } from '../../../services/form-transaction.service';
import { NuvalenceFormRendererOptions, PublicPortalIntakeRendererOptions } from './renderer.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormRendererModule,
    FormlyModule,
    NuverialButtonComponent,
    NuverialFormFieldErrorComponent,
    NuverialIconComponent,
  ],
  selector: 'dsg-form-renderer',
  standalone: true,
  styleUrls: ['./form-renderer.component.scss'],
  templateUrl: './form-renderer.component.html',
})
export class FormRendererComponent {
  @HostBinding('class.form-renderer') public componentClass = true;
  /** The form group */
  public form = new FormGroup({});
  /** The form options, initial form state */
  @Input() public options: NuvalenceFormRendererOptions = PublicPortalIntakeRendererOptions;
  /** The form configuration json */
  @Input() public fields$?: Observable<IRendererFormConfigurationSchema[]>;
  /** The form data model */
  @Input() public model$?: Observable<TransactionData> = this._formTransactionService.transaction$.pipe(map(transactionModel => transactionModel.data));

  constructor(private readonly _formTransactionService: FormTransactionService) {}
}
