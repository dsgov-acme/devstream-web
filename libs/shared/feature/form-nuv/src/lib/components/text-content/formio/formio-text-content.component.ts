import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormioBaseCustomComponent } from '../../base';
import { TextContentFieldProperties } from '../models/formly-text-content.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  selector: 'dsg-formio-text-content',
  standalone: true,
  styleUrls: ['./formio-text-content.component.scss'],
  templateUrl: './formio-text-content.component.html',
})
export class FormioTextContentComponent extends FormioBaseCustomComponent<string, TextContentFieldProperties> {}
