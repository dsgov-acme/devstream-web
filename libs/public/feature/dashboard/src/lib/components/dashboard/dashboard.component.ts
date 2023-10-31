import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { PublicFeatureProfileService } from '@dsg/public/feature/profile';
import { UserModel } from '@dsg/shared/data-access/user-api';
import { ITransaction, TransactionModel, WorkApiRoutesService } from '@dsg/shared/data-access/work-api';
import { NuverialButtonComponent, NuverialIconComponent, NuverialSnackBarService, NuverialSpinnerComponent } from '@dsg/shared/ui/nuverial';
import { EMPTY, Observable, catchError, tap } from 'rxjs';
import { DashboardService } from '../../services';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, NuverialButtonComponent, NuverialSpinnerComponent, NuverialIconComponent],
  selector: 'dsg-dashboard',
  standalone: true,
  styleUrls: ['./dashboard.component.scss'],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  public profile$: Observable<UserModel | null> = this._profileService.getProfile$();
  public transactions$: Observable<TransactionModel[]> = this._dashboardService.getTransactions$();

  constructor(
    private readonly _workApiRoutesService: WorkApiRoutesService,
    private readonly _router: Router,
    private readonly _nuverialSnackBarService: NuverialSnackBarService,
    private readonly _profileService: PublicFeatureProfileService,
    private readonly _dashboardService: DashboardService,
  ) {}

  public trackByFn(_index: number, item: unknown) {
    return item;
  }

  public createNewTransaction() {
    this._workApiRoutesService
      .createTransaction$('FinancialBenefit') // the transaction definition key is hardcoded for now, we will introduce a selection process in the future
      .pipe(
        tap(transaction => this._router.navigate([`/dashboard/transaction/${transaction.id}`])),
        catchError(_error => this._nuverialSnackBarService.notifyApplicationError() && EMPTY),
      )
      .subscribe();
  }

  public hasRejectedDocuments(transaction: ITransaction): boolean {
    if (transaction && transaction.customerProvidedDocuments) {
      return transaction.customerProvidedDocuments.some(doc => doc.reviewStatus === 'REJECTED');
    }

    return false;
  }
}
