import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormioBaseCustomComponent } from '../../base';
import { AttributeBaseProperties } from '../../base/formio/formio-attribute-base.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  selector: 'dsg-formio-big-decimal',
  standalone: true,
  styleUrls: ['./formio-big-decimal.component.scss'],
  templateUrl: '../../base/formio/formio-attribute-base.component.html',
})
export class FormioBigDecimalComponent extends FormioBaseCustomComponent<string, AttributeBaseProperties> {}
