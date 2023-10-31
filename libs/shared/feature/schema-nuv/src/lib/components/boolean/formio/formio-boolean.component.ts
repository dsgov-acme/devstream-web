import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormioBaseCustomComponent } from '../../base';
import { AttributeBaseProperties } from '../../base/formio/formio-attribute-base.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  selector: 'dsg-formio-boolean',
  standalone: true,
  styleUrls: ['./formio-boolean.component.scss'],
  templateUrl: '../../base/formio/formio-attribute-base.component.html',
})
export class FormioBooleanComponent extends FormioBaseCustomComponent<string, AttributeBaseProperties> {}
