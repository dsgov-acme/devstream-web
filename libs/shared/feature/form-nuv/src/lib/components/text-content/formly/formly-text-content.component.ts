import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormlyBaseComponent } from '../../base';
import { TextContentFieldProperties } from '../models/formly-text-content.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  selector: 'dsg-formly-text-content',
  standalone: true,
  styleUrls: ['./formly-text-content.component.scss'],
  templateUrl: './formly-text-content.component.html',
})
export class FormlyTextContentComponent extends FormlyBaseComponent<TextContentFieldProperties> {}
