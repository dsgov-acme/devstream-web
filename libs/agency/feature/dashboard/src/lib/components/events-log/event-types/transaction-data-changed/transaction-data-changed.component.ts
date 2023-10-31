import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { AuditEventModel, EventUpdates } from '@dsg/shared/data-access/audit-api';
import { FormConfigurationModel, IFormConfigurationSchema } from '@dsg/shared/data-access/work-api';
import { DocumentFormService } from '@dsg/shared/feature/form-nuv';
import { take } from 'rxjs';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  selector: 'dsg-transaction-data-changed',
  standalone: true,
  styleUrls: ['./transaction-data-changed.component.scss'],
  templateUrl: './transaction-data-changed.component.html',
})
export class TransactionDataChangedComponent implements OnInit {
  @Input()
  public event?: AuditEventModel;

  @Input()
  public fromConfiguration?: FormConfigurationModel;
  public eventUpdates: EventUpdates[] = [];

  constructor(private readonly documentFormService: DocumentFormService) {}

  public ngOnInit(): void {
    if (!this.event) return;

    this.handleTransactionDataUpdatedEvent(this.event);
  }

  public trackByFn(index: number): number {
    return index;
  }

  private findAddressDisplayValue(component: IFormConfigurationSchema, addressEntryKey: string, newStateValueKey: string): string {
    // Initialize displayValue with newStateValueKey for address fields with no selection options
    let displayValue = newStateValueKey;

    component.components?.forEach(addressComponent => {
      if (addressComponent.key === addressEntryKey) {
        const searchResult = addressComponent.props?.selectOptions?.find((option: { key: string; displayTextValue: string }) => option.key == newStateValueKey);
        displayValue = searchResult?.displayTextValue || newStateValueKey;
      }
    });

    return displayValue;
  }

  private handleTransactionDataUpdatedEvent(event: AuditEventModel) {
    const { newState, oldState } = event.eventData;
    if (!newState || !oldState) return; // Nothing happens if either is undefined

    const newStates = JSON.parse(newState);

    Object.entries(newStates).forEach(([key, newStateValue]) => {
      const formElement = this.fromConfiguration?.getComponentLabelAndComponentByKey(key);
      if (!formElement) return;
      const label = formElement.label;
      if (!label) return; // Nothing happens if label is undefined

      const component = formElement.component;
      let _newStateValue = newStateValue;
      let _oldStateValue;
      let newDocumentId = '';
      let oldDocumentId = '';

      if (component && component.type == 'nuverialSelect' && component.props?.selectOptions) {
        _newStateValue = component.props.selectOptions.find(
          (option: { key: string; displayTextValue: string }) => option.key == newStateValue,
        )?.displayTextValue;
      }

      if (component && component.type == 'nuverialFileUpload') {
        newDocumentId = newStateValue as string;
        _newStateValue = 'File';
      }

      if (component && component.type == 'nuverialAddress' && typeof newStateValue === 'string') {
        _newStateValue = this.findAddressDisplayValue(component, key, newStateValue);
      }

      const newStateDisplayValue: string = this.displayValueOrBlank(_newStateValue as string);
      const oldStates = JSON.parse(oldState);
      const oldStateDisplayValue: string = this.displayValueOrBlank(oldStates[key]);
      _oldStateValue = oldStateDisplayValue;

      if (oldStateDisplayValue != 'blank' && component && component.type == 'nuverialFileUpload') {
        oldDocumentId = oldStateDisplayValue;
        _oldStateValue = 'File';
      }

      this.eventUpdates.push({
        label: label,
        newDocumentId: newDocumentId,
        newState: newStateDisplayValue,
        oldDocumentId: oldDocumentId,
        oldState: _oldStateValue,
      });
    });
  }

  private displayValueOrBlank(state: string): string {
    const isBlank = !state || state === '' || state === 'null';

    return isBlank ? 'blank' : state;
  }

  public openDocument(documentId: string) {
    this.documentFormService.openDocument$(documentId).pipe(take(1)).subscribe();
  }
}
