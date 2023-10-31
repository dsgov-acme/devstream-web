import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormioBaseCustomComponent } from '../../base';
import { AttributeBaseProperties } from '../../base/formio/formio-attribute-base.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  selector: 'dsg-formio-integer',
  standalone: true,
  styleUrls: ['./formio-integer.component.scss'],
  templateUrl: '../../base/formio/formio-attribute-base.component.html',
})
export class FormioIntegerComponent extends FormioBaseCustomComponent<string, AttributeBaseProperties> {}
